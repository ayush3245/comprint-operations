import { checkRole } from '@/lib/auth'
import { getDisplayRepairJobs, getDisplayRepairCompletedJobs, startDisplayRepair, completeDisplayRepair, getUserDashboardStats } from '@/lib/actions'
import DisplayRepairClient from './DisplayRepairClient'
import DashboardStats from '@/components/DashboardStats'

export default async function DisplayRepairPage() {
    const user = await checkRole(['DISPLAY_TECHNICIAN', 'L2_ENGINEER', 'ADMIN', 'SUPERADMIN'])

    // Admin/Superadmin see all completed jobs, others see only their own
    const completedJobsParam = ['ADMIN', 'SUPERADMIN'].includes(user.role) ? undefined : user.id

    const [jobs, completedJobs, stats] = await Promise.all([
        getDisplayRepairJobs(),
        getDisplayRepairCompletedJobs(completedJobsParam),
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
                completedJobs={completedJobs}
                userId={user.id}
                userName={user.name}
                userRole={user.role}
                onStartRepair={handleStartRepair}
                onCompleteRepair={handleCompleteRepair}
            />
        </div>
    )
}
