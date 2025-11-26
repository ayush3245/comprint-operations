import { checkRole } from '@/lib/auth'
import NewInwardBatchClient from './NewInwardBatchClient'

export default async function NewInwardBatchPage() {
    await checkRole(['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'])
    return <NewInwardBatchClient />
}
