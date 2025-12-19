import { checkRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import QCSearchClient from './QCSearchClient'
import DashboardStats from '@/components/DashboardStats'

export default async function QCPage() {
    const user = await checkRole(['QC_ENGINEER', 'ADMIN'])

    // Get QC stats - user-specific for completed, queue size for pending
    const [pending, completed] = await Promise.all([
        // Pending: all devices awaiting QC (queue size)
        prisma.device.count({
            where: { status: 'AWAITING_QC' }
        }),
        // Completed: QC records completed by THIS user only
        prisma.qCRecord.count({
            where: { qcEngId: user.id }
        })
    ])

    return (
        <div className="p-6">
            <DashboardStats
                pending={pending}
                completed={completed}
                hideInProgress={true}
                labels={{
                    pending: 'Awaiting QC',
                    completed: 'My Completed'
                }}
            />
            <QCSearchClient />
        </div>
    )
}
