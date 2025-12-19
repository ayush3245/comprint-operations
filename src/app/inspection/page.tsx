import { checkRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import InspectionSearchClient from './InspectionSearchClient'
import DashboardStats from '@/components/DashboardStats'

export default async function InspectionPage() {
    const user = await checkRole(['INSPECTION_ENGINEER', 'ADMIN'])

    // Get inspection stats - user-specific for in-progress/completed, queue size for pending
    const [pending, inProgress, completed] = await Promise.all([
        // Pending: devices awaiting inspection (queue size)
        prisma.device.count({
            where: { status: { in: ['RECEIVED', 'PENDING_INSPECTION'] } }
        }),
        // In Progress: repair jobs by THIS user still in inspection phase
        prisma.repairJob.count({
            where: {
                inspectionEngId: user.id,
                status: 'PENDING_INSPECTION'
            }
        }),
        // Completed: inspections completed by THIS user (moved past inspection phase)
        prisma.repairJob.count({
            where: {
                inspectionEngId: user.id,
                status: { notIn: ['PENDING_INSPECTION'] }
            }
        })
    ])

    return (
        <div className="p-6">
            <DashboardStats
                pending={pending}
                completed={completed}
                hideInProgress={true}
                labels={{
                    pending: 'Awaiting Inspection',
                    completed: 'My Completed'
                }}
            />
            <InspectionSearchClient />
        </div>
    )
}
