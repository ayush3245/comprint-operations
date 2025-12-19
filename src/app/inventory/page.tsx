import { searchInventory, getRacks } from '@/lib/actions'
import { checkRole, getCurrentUser } from '@/lib/auth'
import InventoryClient from './InventoryClient'

export default async function InventoryPage() {
    await checkRole(['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'])
    const user = await getCurrentUser()

    // Fetch initial data with default parameters
    const [initialData, racks] = await Promise.all([
        searchInventory({
            page: 1,
            limit: 25,
            sortBy: 'updatedAt',
            sortOrder: 'desc'
        }),
        getRacks()
    ])

    // Determine if user can manage racks (warehouse roles, admin, superadmin)
    const canManageRacks = user && ['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN', 'SUPERADMIN'].includes(user.role)

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage all devices in the warehouse
                    </p>
                </div>
            </div>
            <InventoryClient
                initialData={initialData}
                racks={racks}
                canManageRacks={canManageRacks ?? false}
            />
        </div>
    )
}
