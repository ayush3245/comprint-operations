import { checkRole } from '@/lib/auth'
import { getL3RepairJobs, startL3Repair, completeL3Repair } from '@/lib/actions'
import L3RepairClient from './L3RepairClient'

export default async function L3RepairPage() {
    const user = await checkRole(['L3_ENGINEER', 'ADMIN', 'SUPERADMIN'])

    const jobs = await getL3RepairJobs()

    async function handleStartRepair(jobId: string) {
        'use server'
        return await startL3Repair(jobId)
    }

    async function handleCompleteRepair(jobId: string, resolution: string, notes: string) {
        'use server'
        return await completeL3Repair(jobId, resolution, notes)
    }

    return (
        <L3RepairClient
            jobs={jobs}
            userId={user.id}
            userName={user.name}
            onStartRepair={handleStartRepair}
            onCompleteRepair={handleCompleteRepair}
        />
    )
}
