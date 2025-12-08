import { getRepairJobs, startRepair, completeRepair, collectFromPaint } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import RepairClient from './RepairClient'

export default async function RepairPage() {
    const user = await checkRole(['REPAIR_ENGINEER', 'ADMIN'])
    const jobs = await getRepairJobs(user.id)

    async function handleStartRepair(jobId: string, userId: string) {
        'use server'
        await startRepair(jobId, userId)
    }

    async function handleCompleteRepair(jobId: string, notes: string) {
        'use server'
        await completeRepair(jobId, notes)
    }

    async function handleCollectFromPaint(jobId: string) {
        'use server'
        await collectFromPaint(jobId)
    }

    return (
        <RepairClient
            jobs={jobs}
            userId={user.id}
            onStartRepair={handleStartRepair}
            onCompleteRepair={handleCompleteRepair}
            onCollectFromPaint={handleCollectFromPaint}
        />
    )
}
