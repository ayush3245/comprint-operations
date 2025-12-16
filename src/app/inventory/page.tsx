import { getInventory } from '@/lib/actions'
import { formatDate } from '@/lib/utils'
import { checkRole } from '@/lib/auth'

export default async function InventoryPage() {
    await checkRole(['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'])
    const inventory = await getInventory()

    // Helper function to format device status for display
    const getStatusDisplay = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            RECEIVED: { label: 'Received', color: 'bg-secondary text-secondary-foreground' },
            PENDING_INSPECTION: { label: 'Pending Inspection', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' },
            WAITING_FOR_SPARES: { label: 'Waiting for Spares', color: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400' },
            READY_FOR_REPAIR: { label: 'Ready for Repair', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' },
            UNDER_REPAIR: { label: 'Under Repair', color: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400' },
            IN_PAINT_SHOP: { label: 'In Paint Shop', color: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-400' },
            AWAITING_QC: { label: 'Awaiting QC', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400' },
            READY_FOR_STOCK: { label: 'Ready for Dispatch', color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' },
        }
        return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-secondary text-secondary-foreground' }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-foreground">Inventory</h1>

            <div className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Barcode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Device</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Specifications</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ownership</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stage</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                            {inventory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                                        No devices in warehouse.
                                    </td>
                                </tr>
                            ) : (
                                inventory.map((device) => {
                                    const statusInfo = getStatusDisplay(device.status)
                                    const specs = [
                                        device.cpu,
                                        device.ram,
                                        device.ssd,
                                        device.gpu,
                                        device.screenSize
                                    ].filter(Boolean).join(' • ')

                                    return (
                                        <tr key={device.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-primary">
                                                {device.barcode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                <div className="font-medium">{device.brand} {device.model}</div>
                                                <div className="text-xs text-muted-foreground">{device.category}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {specs || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {device.grade ? (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${device.grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                                                        }`}>
                                                        Grade {device.grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {device.ownership.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
