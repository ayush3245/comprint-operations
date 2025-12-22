import { checkRole } from '@/lib/auth'
import { getUnaddressedPurchaseOrders } from '@/lib/actions'
import NewInwardBatchClient from './NewInwardBatchClient'

export default async function NewInwardBatchPage() {
    await checkRole(['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN', 'STORE_INCHARGE'])

    // Fetch unaddressed POs for the dropdown
    const purchaseOrders = await getUnaddressedPurchaseOrders()

    return <NewInwardBatchClient purchaseOrders={purchaseOrders} />
}
