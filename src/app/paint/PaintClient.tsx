'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { PaintBucket, CheckCircle } from 'lucide-react'

interface PaintPanel {
    id: string
    panelType: string
    status: string
    device: {
        barcode: string
        brand: string
        model: string
    }
}

interface PaintClientProps {
    panels: PaintPanel[]
    onUpdateStatus: (panelId: string, status: 'IN_PAINT' | 'READY_FOR_COLLECTION') => Promise<void>
}

export default function PaintClient({ panels, onUpdateStatus }: PaintClientProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const toast = useToast()

    const handleStartPaint = async (panel: PaintPanel) => {
        startTransition(async () => {
            try {
                await onUpdateStatus(panel.id, 'IN_PAINT')
                toast.success('Paint work has started on this panel.', {
                    title: 'Paint Started',
                    details: [
                        { label: 'Barcode', value: panel.device.barcode },
                        { label: 'Device', value: `${panel.device.brand} ${panel.device.model}` },
                        { label: 'Panel', value: panel.panelType },
                        { label: 'Status', value: 'In Paint' }
                    ]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to start paint')
            }
        })
    }

    const handleFinishPaint = async (panel: PaintPanel) => {
        startTransition(async () => {
            try {
                await onUpdateStatus(panel.id, 'READY_FOR_COLLECTION')
                toast.success('Paint work has been completed. The panel is ready for collection by Repair Engineer.', {
                    title: 'Paint Completed',
                    details: [
                        { label: 'Barcode', value: panel.device.barcode },
                        { label: 'Device', value: `${panel.device.brand} ${panel.device.model}` },
                        { label: 'Panel', value: panel.panelType },
                        { label: 'Status', value: 'Ready for Collection' }
                    ]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to complete paint')
            }
        })
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
                                        <div className="text-xs text-gray-500">{panel.device.brand} {panel.device.model}</div>
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
                                                <button
                                                    onClick={() => handleStartPaint(panel)}
                                                    disabled={isPending}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <PaintBucket size={16} /> {isPending ? 'Starting...' : 'Start'}
                                                </button>
                                            )}

                                            {panel.status === 'IN_PAINT' && (
                                                <button
                                                    onClick={() => handleFinishPaint(panel)}
                                                    disabled={isPending}
                                                    className="text-green-600 hover:text-green-800 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <CheckCircle size={16} /> {isPending ? 'Finishing...' : 'Finish'}
                                                </button>
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
