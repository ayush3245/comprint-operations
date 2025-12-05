import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
    const user = await requireUser()

    // Fetch basic stage counts
    const [
        pendingInspection,
        underRepair,
        inPaint,
        awaitingQC,
        readyForStock,
        waitingForSpares
    ] = await Promise.all([
        prisma.device.count({ where: { status: 'PENDING_INSPECTION' } }),
        prisma.device.count({ where: { status: 'UNDER_REPAIR' } }),
        prisma.device.count({ where: { status: 'IN_PAINT_SHOP' } }),
        prisma.device.count({ where: { status: 'AWAITING_QC' } }),
        prisma.device.count({ where: { status: 'READY_FOR_STOCK' } }),
        prisma.device.count({ where: { status: 'WAITING_FOR_SPARES' } })
    ])

    // TAT breaches count
    const tatBreaches = await prisma.repairJob.count({
        where: {
            status: { in: ['UNDER_REPAIR', 'IN_PAINT_SHOP', 'AWAITING_QC'] },
            tatDueDate: { lt: new Date() }
        }
    })

    // QC pass/fail rates by engineer
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
    const qcEngMap = Object.fromEntries(qcEngineers.map(e => [e.id, e.name]))

    // Process QC by engineer data
    const qcEngineerStats = qcEngIds.map(engId => {
        const passed = qcByEngineer.find(q => q.qcEngId === engId && q.status === 'PASSED')?._count.id || 0
        const failed = qcByEngineer.find(q => q.qcEngId === engId && q.status === 'FAILED_REWORK')?._count.id || 0
        const total = passed + failed
        return {
            name: qcEngMap[engId] || 'Unknown',
            passed,
            failed,
            total,
            passRate: total > 0 ? Math.round((passed / total) * 100) : 0
        }
    }).filter(e => e.total > 0)

    // Stock by grade
    const stockByGrade = await prisma.device.groupBy({
        by: ['grade'],
        where: { status: 'READY_FOR_STOCK', grade: { not: null } },
        _count: { id: true }
    })

    const gradeStats = {
        gradeA: stockByGrade.find(g => g.grade === 'A')?._count.id || 0,
        gradeB: stockByGrade.find(g => g.grade === 'B')?._count.id || 0
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
    const repairEngMap = Object.fromEntries(repairEngineers.map(e => [e.id, e.name]))

    const workloadStats = repairWorkload.map(r => ({
        name: repairEngMap[r.repairEngId!] || 'Unknown',
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

    // Batch completion stats
    const batches = await prisma.inwardBatch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            batchId: true,
            _count: {
                select: { devices: true }
            },
            devices: {
                select: { status: true }
            }
        }
    })

    const batchStats = batches.map(batch => {
        const total = batch._count.devices
        const completed = batch.devices.filter(d =>
            d.status === 'READY_FOR_STOCK' ||
            d.status === 'STOCK_OUT_SOLD' ||
            d.status === 'STOCK_OUT_RENTAL'
        ).length
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
