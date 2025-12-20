import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'

// Cache dashboard data for 60 seconds
export const revalidate = 60

export default async function DashboardPage() {
    const user = await requireUser()

    // OPTIMIZED: Single groupBy query instead of 6 separate count queries
    const deviceStatusCounts = await prisma.device.groupBy({
        by: ['status'],
        _count: { id: true }
    })
    const statusMap = new Map(deviceStatusCounts.map(s => [s.status, s._count.id]))

    const pendingInspection = statusMap.get('RECEIVED') || 0
    const underRepair = statusMap.get('UNDER_REPAIR') || 0
    const inPaint = statusMap.get('IN_PAINT_SHOP') || 0
    const awaitingQC = statusMap.get('AWAITING_QC') || 0
    const readyForStock = statusMap.get('READY_FOR_STOCK') || 0
    const waitingForSpares = statusMap.get('WAITING_FOR_SPARES') || 0

    // TAT breaches count
    const tatBreaches = await prisma.repairJob.count({
        where: {
            status: { in: ['UNDER_REPAIR', 'IN_PAINT_SHOP', 'AWAITING_QC'] },
            tatDueDate: { lt: new Date() }
        }
    })

    // QC pass/fail rates by engineer - optimized with Map lookup
    const qcByEngineer = await prisma.qCRecord.groupBy({
        by: ['qcEngId', 'status'],
        _count: { id: true }
    })

    // Get QC engineer names
    const qcEngIds = [...new Set(qcByEngineer.map(q => q.qcEngId))]
    const qcEngineers = await prisma.user.findMany({
        where: { id: { in: qcEngIds } },
        select: { id: true, name: true }
    })
    const qcEngMap = new Map(qcEngineers.map(e => [e.id, e.name]))

    // OPTIMIZED: Use Map for O(1) lookup instead of O(n) .find()
    const qcDataMap = new Map<string, number>()
    qcByEngineer.forEach(q => {
        qcDataMap.set(`${q.qcEngId}-${q.status}`, q._count.id)
    })

    const qcEngineerStats = qcEngIds.map(engId => {
        const passed = qcDataMap.get(`${engId}-PASSED`) || 0
        const failed = qcDataMap.get(`${engId}-FAILED_REWORK`) || 0
        const total = passed + failed
        return {
            name: qcEngMap.get(engId) || 'Unknown',
            passed,
            failed,
            total,
            passRate: total > 0 ? Math.round((passed / total) * 100) : 0
        }
    }).filter(e => e.total > 0)

    // Stock by grade - optimized with Map
    const stockByGrade = await prisma.device.groupBy({
        by: ['grade'],
        where: { status: 'READY_FOR_STOCK', grade: { not: null } },
        _count: { id: true }
    })
    const gradeMap = new Map(stockByGrade.map(g => [g.grade, g._count.id]))

    const gradeStats = {
        gradeA: gradeMap.get('A') || 0,
        gradeB: gradeMap.get('B') || 0
    }

    // Stock by category
    const stockByCategory = await prisma.device.groupBy({
        by: ['category'],
        where: { status: 'READY_FOR_STOCK' },
        _count: { id: true }
    })

    const categoryStats = stockByCategory.map(c => ({
        category: c.category,
        count: c._count.id
    }))

    // Repair engineer workload
    const repairWorkload = await prisma.repairJob.groupBy({
        by: ['repairEngId'],
        where: {
            status: 'UNDER_REPAIR',
            repairEngId: { not: null }
        },
        _count: { id: true }
    })

    // Get repair engineer names
    const repairEngIds = repairWorkload.map(r => r.repairEngId).filter((id): id is string => id !== null)
    const repairEngineers = await prisma.user.findMany({
        where: { id: { in: repairEngIds } },
        select: { id: true, name: true }
    })
    const repairEngMap = new Map(repairEngineers.map(e => [e.id, e.name]))

    const workloadStats = repairWorkload.map(r => ({
        name: repairEngMap.get(r.repairEngId!) || 'Unknown',
        activeJobs: r._count.id,
        capacity: 10
    }))

    // Overdue devices
    const overdueDevices = await prisma.repairJob.findMany({
        where: {
            status: { in: ['UNDER_REPAIR', 'IN_PAINT_SHOP', 'AWAITING_QC'] },
            tatDueDate: { lt: new Date() }
        },
        include: {
            device: { select: { barcode: true, model: true } },
            repairEng: { select: { name: true } }
        },
        orderBy: { tatDueDate: 'asc' },
        take: 10
    })

    // Weekly throughput - devices completed QC in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weeklyQC = await prisma.qCRecord.findMany({
        where: {
            completedAt: { gte: sevenDaysAgo },
            status: 'PASSED'
        },
        select: { completedAt: true }
    })

    // Group by day
    const dailyThroughput: Record<string, number> = {}
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayKey = days[date.getDay()]
        dailyThroughput[dayKey] = 0
    }

    weeklyQC.forEach(qc => {
        const dayKey = days[new Date(qc.completedAt).getDay()]
        if (dailyThroughput[dayKey] !== undefined) {
            dailyThroughput[dayKey]++
        }
    })

    const throughputData = Object.entries(dailyThroughput).map(([day, count]) => ({
        day,
        completed: count
    }))

    // OPTIMIZED: Batch completion stats - only fetch status counts, not all devices
    const batches = await prisma.inwardBatch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            batchId: true,
            _count: {
                select: { devices: true }
            }
        }
    })

    // Get completion counts separately with aggregation using internal IDs
    const batchInternalIds = batches.map(b => b.id)
    const completedCounts = await prisma.device.groupBy({
        by: ['inwardBatchId'],
        where: {
            inwardBatchId: { in: batchInternalIds },
            status: { in: ['READY_FOR_STOCK', 'STOCK_OUT_SOLD', 'STOCK_OUT_RENTAL'] }
        },
        _count: { id: true }
    })
    const completedMap = new Map(completedCounts.map(c => [c.inwardBatchId, c._count.id]))

    const batchStats = batches.map(batch => {
        const total = batch._count.devices
        const completed = completedMap.get(batch.id) || 0
        return {
            batchId: batch.batchId,
            total,
            completed,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0
        }
    })

    const stats = {
        pendingInspection,
        underRepair,
        inPaint,
        awaitingQC,
        readyForStock,
        waitingForSpares,
        tatBreaches
    }

    const analytics = {
        qcEngineerStats,
        gradeStats,
        categoryStats,
        workloadStats,
        overdueDevices: overdueDevices.map(d => ({
            jobId: d.jobId,
            barcode: d.device.barcode,
            model: d.device.model,
            repairEng: d.repairEng?.name || 'Unassigned',
            dueDate: d.tatDueDate,
            daysOverdue: d.tatDueDate ? Math.ceil((new Date().getTime() - new Date(d.tatDueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
        })),
        throughputData,
        batchStats
    }

    const activityFeed = await prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: true } } }
    })

    return <DashboardClient user={user} stats={stats} activityFeed={activityFeed} analytics={analytics} />
}
