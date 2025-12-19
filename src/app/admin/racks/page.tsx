import { getRacks, getRackStats } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import RacksClient from './RacksClient'

export default async function RacksPage() {
    await checkRole(['ADMIN', 'SUPERADMIN', 'WAREHOUSE_MANAGER'])

    const [racks, stats] = await Promise.all([
        getRacks(),
        getRackStats()
    ])

    return <RacksClient initialRacks={racks} initialStats={stats} />
}
