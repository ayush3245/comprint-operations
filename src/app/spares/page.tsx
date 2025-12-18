import { getSparesRequests } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import SparesClient from './SparesClient'

export default async function SparesPage() {
    await checkRole(['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'])
    const requests = await getSparesRequests()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-foreground">Spares Requests</h1>
            <SparesClient requests={requests} />
        </div>
    )
}
