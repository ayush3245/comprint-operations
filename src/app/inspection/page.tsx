import { checkRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import InspectionSearchClient from './InspectionSearchClient'
import DashboardStats from '@/components/DashboardStats'

export default async function InspectionPage() {
    const user = await checkRole(['INSPECTION_ENGINEER', 'ADMIN'])

    // Get inspection stats - user-specific for completed, queue size for pending
    const [pending, completed] = await Promise.all([
        // Pending: devices awaiting inspection (RECEIVED status)
        prisma.device.count({
            where: { status: 'RECEIVED' }
        }),
        // Completed: inspections completed by THIS user (repair jobs created)
        prisma.repairJob.count({
            where: {
                inspectionEngId: user.id
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
