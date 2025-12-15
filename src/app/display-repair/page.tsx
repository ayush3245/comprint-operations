import { checkRole } from '@/lib/auth'
import { getDisplayRepairJobs, startDisplayRepair, completeDisplayRepair, getUserDashboardStats } from '@/lib/actions'
import DisplayRepairClient from './DisplayRepairClient'
import DashboardStats from '@/components/DashboardStats'

export default async function DisplayRepairPage() {
    const user = await checkRole(['DISPLAY_TECHNICIAN', 'L2_ENGINEER', 'ADMIN', 'SUPERADMIN'])

    const [jobs, stats] = await Promise.all([
        getDisplayRepairJobs(),
        getUserDashboardStats(user.id, user.role)
    ])

    async function handleStartRepair(jobId: string) {
        'use server'
        return await startDisplayRepair(jobId)
    }

    async function handleCompleteRepair(jobId: string, notes: string) {
        'use server'
        return await completeDisplayRepair(jobId, notes)
    }

    return (
        <div className="p-6">
            <DashboardStats
                pending={stats.pending}
                inProgress={stats.inProgress}
                completed={stats.completed}
                labels={{
                    pending: 'Waiting',
                    inProgress: 'My Active',
                    completed: 'Completed'
                }}
            />
            <DisplayRepairClient
                jobs={jobs}
                userId={user.id}
                userName={user.name}
                onStartRepair={handleStartRepair}
                onCompleteRepair={handleCompleteRepair}
            />
        </div>
    )
}
