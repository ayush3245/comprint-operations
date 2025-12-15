import { checkRole } from '@/lib/auth'
import { getBatteryBoostJobs, startBatteryBoost, completeBatteryBoost } from '@/lib/actions'
import BatteryBoostClient from './BatteryBoostClient'

export default async function BatteryBoostPage() {
    const user = await checkRole(['BATTERY_TECHNICIAN', 'L2_ENGINEER', 'ADMIN', 'SUPERADMIN'])

    const jobs = await getBatteryBoostJobs()

    async function handleStartBoost(jobId: string) {
        'use server'
        return await startBatteryBoost(jobId)
    }

    async function handleCompleteBoost(jobId: string, finalCapacity: string, notes: string) {
        'use server'
        return await completeBatteryBoost(jobId, finalCapacity, notes)
    }

    return (
        <BatteryBoostClient
            jobs={jobs}
            userId={user.id}
            userName={user.name}
            onStartBoost={handleStartBoost}
            onCompleteBoost={handleCompleteBoost}
        />
    )
}
