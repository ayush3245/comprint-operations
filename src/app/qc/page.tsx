import { checkRole } from '@/lib/auth'
import { getUserDashboardStats } from '@/lib/actions'
import QCSearchClient from './QCSearchClient'
import DashboardStats from '@/components/DashboardStats'

export default async function QCPage() {
    const user = await checkRole(['QC_ENGINEER', 'ADMIN'])
    const stats = await getUserDashboardStats(user.id, user.role)

    return (
        <div className="p-6">
            <DashboardStats
                pending={stats.pending}
                inProgress={stats.inProgress}
                completed={stats.completed}
                labels={{
                    pending: 'Awaiting QC',
                    inProgress: 'In Progress',
                    completed: 'Completed'
                }}
            />
            <QCSearchClient />
        </div>
    )
}
