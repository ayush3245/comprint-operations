import { checkRole } from '@/lib/auth'
import { getL3RepairJobs, startL3Repair, completeL3Repair, getUserDashboardStats } from '@/lib/actions'
import L3RepairClient from './L3RepairClient'
import DashboardStats from '@/components/DashboardStats'

export default async function L3RepairPage() {
    const user = await checkRole(['L3_ENGINEER', 'ADMIN', 'SUPERADMIN'])

    const [jobs, stats] = await Promise.all([
        getL3RepairJobs(),
        getUserDashboardStats(user.id, user.role)
    ])

    async function handleStartRepair(jobId: string) {
        'use server'
        return await startL3Repair(jobId)
    }

    async function handleCompleteRepair(jobId: string, resolution: string, notes: string) {
        'use server'
        return await completeL3Repair(jobId, resolution, notes)
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
            <L3RepairClient
                jobs={jobs}
                userId={user.id}
                userName={user.name}
                onStartRepair={handleStartRepair}
                onCompleteRepair={handleCompleteRepair}
            />
        </div>
    )
}
