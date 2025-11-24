import { getPaintPanels, updatePanelStatus } from '@/lib/actions'
import { formatDate } from '@/lib/utils'
import { PaintBucket, CheckCircle, ArrowRight } from 'lucide-react'

export default async function PaintPage() {
    const panels = await getPaintPanels()

    async function handleStatusUpdate(formData: FormData) {
        'use server'
        const panelId = formData.get('panelId') as string
        const status = formData.get('status') as 'IN_PAINT' | 'READY_FOR_COLLECTION' | 'FITTED'
        await updatePanelStatus(panelId, status)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Paint Shop</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Panel Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {panels.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                    No panels awaiting paint work.
                                </td>
                            </tr>
                        ) : (
                            panels.map((panel) => (
                                <tr key={panel.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="font-medium">{panel.device.barcode}</div>
                                        <div className="text-xs text-gray-500">{panel.device.model}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {panel.panelType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${panel.status === 'AWAITING_PAINT' ? 'bg-red-100 text-red-800' :
                                                panel.status === 'IN_PAINT' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {panel.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex gap-2">
                                            {panel.status === 'AWAITING_PAINT' && (
                                                <form action={handleStatusUpdate}>
                                                    <input type="hidden" name="panelId" value={panel.id} />
                                                    <input type="hidden" name="status" value="IN_PAINT" />
                                                    <button type="submit" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                                        <PaintBucket size={16} /> Start
                                                    </button>
                                                </form>
                                            )}

                                            {panel.status === 'IN_PAINT' && (
                                                <form action={handleStatusUpdate}>
                                                    <input type="hidden" name="panelId" value={panel.id} />
                                                    <input type="hidden" name="status" value="READY_FOR_COLLECTION" />
                                                    <button type="submit" className="text-green-600 hover:text-green-800 flex items-center gap-1">
                                                        <CheckCircle size={16} /> Finish
                                                    </button>
                                                </form>
                                            )}

                                            {panel.status === 'READY_FOR_COLLECTION' && (
                                                <span className="text-gray-400 italic text-xs">Waiting for Repair Eng to collect</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
