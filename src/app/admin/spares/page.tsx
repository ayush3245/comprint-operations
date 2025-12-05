import { checkRole } from '@/lib/auth'
import { getSpareParts } from '@/lib/actions'
import SparePartsClient from './SparePartsClient'

export default async function SparePartsPage() {
    await checkRole(['WAREHOUSE_MANAGER', 'ADMIN'])

    const spareParts = await getSpareParts()

    return <SparePartsClient spareParts={spareParts} />
}
