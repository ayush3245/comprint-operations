import { checkRole } from '@/lib/auth'
import { getDisplayRepairJobs, startDisplayRepair, completeDisplayRepair } from '@/lib/actions'
import DisplayRepairClient from './DisplayRepairClient'

export default async function DisplayRepairPage() {
    const user = await checkRole(['DISPLAY_TECHNICIAN', 'L2_ENGINEER', 'ADMIN', 'SUPERADMIN'])

    const jobs = await getDisplayRepairJobs()

    async function handleStartRepair(jobId: string) {
        'use server'
        return await startDisplayRepair(jobId)
    }

    async function handleCompleteRepair(jobId: string, notes: string) {
        'use server'
        return await completeDisplayRepair(jobId, notes)
    }

    return (
        <DisplayRepairClient
            jobs={jobs}
            userId={user.id}
            userName={user.name}
            onStartRepair={handleStartRepair}
            onCompleteRepair={handleCompleteRepair}
        />
    )
}
