import { getInventory } from '@/lib/actions'
import { formatDate } from '@/lib/utils'
import { requireUser } from '@/lib/auth'

export default async function InventoryPage() {
    await requireUser()
    const inventory = await getInventory()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Finished Goods Inventory</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Config</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ownership</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No devices in stock.
                                    </td>
                                </tr>
                            ) : (
                                inventory.map((device) => (
                                    <tr key={device.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">
                                            {device.barcode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{device.brand} {device.model}</div>
                                            <div className="text-xs text-gray-500">{device.category}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {device.config || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${device.grade === 'A' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                Grade {device.grade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {device.ownership.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {device.location || 'Warehouse'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
