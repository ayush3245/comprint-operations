import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
    const user = await getCurrentUser()

    // Fetch counts
    const pendingInspection = await prisma.device.count({ where: { status: 'PENDING_INSPECTION' } })
    const underRepair = await prisma.device.count({ where: { status: 'UNDER_REPAIR' } })
    const inPaint = await prisma.device.count({ where: { status: 'IN_PAINT_SHOP' } })
    const awaitingQC = await prisma.device.count({ where: { status: 'AWAITING_QC' } })
    const readyForStock = await prisma.device.count({ where: { status: 'READY_FOR_STOCK' } })

    const tatBreaches = await prisma.repairJob.count({
        where: {
            status: 'UNDER_REPAIR',
            tatDueDate: { lt: new Date() }
        }
    })

    const stats = {
        pendingInspection,
        underRepair,
        inPaint,
        awaitingQC,
        readyForStock,
        tatBreaches
    }

    return <DashboardClient user={user} stats={stats} />
}
