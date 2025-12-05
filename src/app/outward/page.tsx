import { checkRole } from '@/lib/auth'
import { getReadyForStockDevices, getUsers, getOutwardRecords } from '@/lib/actions'
import OutwardClient from './OutwardClient'

export default async function OutwardPage() {
    await checkRole(['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'])

    const [devices, users, outwardRecords] = await Promise.all([
        getReadyForStockDevices(),
        getUsers(),
        getOutwardRecords()
    ])

    return <OutwardClient devices={devices} users={users} outwardRecords={outwardRecords} />
}
