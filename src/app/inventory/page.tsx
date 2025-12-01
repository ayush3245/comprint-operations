import { getInventory } from '@/lib/actions'
import { formatDate } from '@/lib/utils'
import { checkRole } from '@/lib/auth'

export default async function InventoryPage() {
    await checkRole(['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'])
    const inventory = await getInventory()

    // Helper function to format device status for display
    const getStatusDisplay = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            RECEIVED: { label: 'Received', color: 'bg-gray-100 text-gray-800' },
            PENDING_INSPECTION: { label: 'Pending Inspection', color: 'bg-blue-100 text-blue-800' },
            WAITING_FOR_SPARES: { label: 'Waiting for Spares', color: 'bg-orange-100 text-orange-800' },
            READY_FOR_REPAIR: { label: 'Ready for Repair', color: 'bg-yellow-100 text-yellow-800' },
            UNDER_REPAIR: { label: 'Under Repair', color: 'bg-purple-100 text-purple-800' },
            IN_PAINT_SHOP: { label: 'In Paint Shop', color: 'bg-pink-100 text-pink-800' },
            AWAITING_QC: { label: 'Awaiting QC', color: 'bg-indigo-100 text-indigo-800' },
            READY_FOR_STOCK: { label: 'Ready for Dispatch', color: 'bg-green-100 text-green-800' },
        }
        return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800' }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Inventory</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specifications</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ownership</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
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
                                        <tr key={device.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">
                                                {device.barcode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="font-medium">{device.brand} {device.model}</div>
                                                <div className="text-xs text-gray-500">{device.category}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {specs || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {device.grade ? (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${device.grade === 'A' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        Grade {device.grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
