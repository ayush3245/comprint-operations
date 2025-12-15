import { checkRole } from '@/lib/auth'
import { getBatteryBoostJobs, startBatteryBoost, completeBatteryBoost, getUserDashboardStats } from '@/lib/actions'
import BatteryBoostClient from './BatteryBoostClient'
import DashboardStats from '@/components/DashboardStats'

export default async function BatteryBoostPage() {
    const user = await checkRole(['BATTERY_TECHNICIAN', 'L2_ENGINEER', 'ADMIN', 'SUPERADMIN'])

    const [jobs, stats] = await Promise.all([
        getBatteryBoostJobs(),
        getUserDashboardStats(user.id, user.role)
    ])

    async function handleStartBoost(jobId: string) {
        'use server'
        return await startBatteryBoost(jobId)
    }

    async function handleCompleteBoost(jobId: string, finalCapacity: string, notes: string) {
        'use server'
        return await completeBatteryBoost(jobId, finalCapacity, notes)
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
            <BatteryBoostClient
                jobs={jobs}
                userId={user.id}
                userName={user.name}
                userRole={user.role}
                onStartBoost={handleStartBoost}
                onCompleteBoost={handleCompleteBoost}
            />
        </div>
    )
}
