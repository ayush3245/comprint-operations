'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { PaintBucket, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    onBulkUpdateStatus: (panelIds: string[], status: 'IN_PAINT' | 'READY_FOR_COLLECTION') => Promise<{ success: boolean; count: number }>
}

export default function PaintClient({ panels, onUpdateStatus, onBulkUpdateStatus }: PaintClientProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set())
    const router = useRouter()
    const toast = useToast()

    // Group panels by status for bulk action availability
    const awaitingPaintPanels = useMemo(() => panels.filter(p => p.status === 'AWAITING_PAINT'), [panels])
    const inPaintPanels = useMemo(() => panels.filter(p => p.status === 'IN_PAINT'), [panels])

    // Check what types of panels are selected
    const selectedAwaitingPaint = useMemo(() =>
        [...selectedPanels].filter(id => awaitingPaintPanels.some(p => p.id === id)),
        [selectedPanels, awaitingPaintPanels]
    )
    const selectedInPaint = useMemo(() =>
        [...selectedPanels].filter(id => inPaintPanels.some(p => p.id === id)),
        [selectedPanels, inPaintPanels]
    )

    const togglePanel = (panelId: string) => {
        setSelectedPanels(prev => {
            const newSet = new Set(prev)
            if (newSet.has(panelId)) {
                newSet.delete(panelId)
            } else {
                newSet.add(panelId)
            }
            return newSet
        })
    }

    const selectAllAwaiting = () => {
        setSelectedPanels(new Set(awaitingPaintPanels.map(p => p.id)))
    }

    const selectAllInPaint = () => {
        setSelectedPanels(new Set(inPaintPanels.map(p => p.id)))
    }

    const clearSelection = () => {
        setSelectedPanels(new Set())
    }

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

    const handleBulkStart = async () => {
        if (selectedAwaitingPaint.length === 0) return
        startTransition(async () => {
            try {
                const result = await onBulkUpdateStatus(selectedAwaitingPaint, 'IN_PAINT')
                toast.success(`Started paint work on ${result.count} panels`)
                setSelectedPanels(new Set())
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to start paint')
            }
        })
    }

    const handleBulkFinish = async () => {
        if (selectedInPaint.length === 0) return
        startTransition(async () => {
            try {
                const result = await onBulkUpdateStatus(selectedInPaint, 'READY_FOR_COLLECTION')
                toast.success(`Completed paint work on ${result.count} panels`)
                setSelectedPanels(new Set())
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to complete paint')
            }
        })
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Paint Shop</h1>

                {/* Bulk Actions */}
                {selectedPanels.size > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {selectedPanels.size} selected
                        </span>
                        {selectedAwaitingPaint.length > 0 && (
                            <button
                                onClick={handleBulkStart}
                                disabled={isPending}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                            >
                                {isPending ? <Loader2 size={14} className="animate-spin" /> : <PaintBucket size={14} />}
                                Start All ({selectedAwaitingPaint.length})
                            </button>
                        )}
                        {selectedInPaint.length > 0 && (
                            <button
                                onClick={handleBulkFinish}
                                disabled={isPending}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                            >
                                {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                Finish All ({selectedInPaint.length})
                            </button>
                        )}
                        <button
                            onClick={clearSelection}
                            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Selection Buttons */}
            {panels.length > 0 && selectedPanels.size === 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {awaitingPaintPanels.length > 0 && (
                        <button
                            onClick={selectAllAwaiting}
                            className="text-sm px-3 py-1.5 border border-default rounded-lg hover:bg-muted transition-colors text-foreground"
                        >
                            Select All Awaiting ({awaitingPaintPanels.length})
                        </button>
                    )}
                    {inPaintPanels.length > 0 && (
                        <button
                            onClick={selectAllInPaint}
                            className="text-sm px-3 py-1.5 border border-default rounded-lg hover:bg-muted transition-colors text-foreground"
                        >
                            Select All In Paint ({inPaintPanels.length})
                        </button>
                    )}
                </div>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {panels.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-soft border border-default p-8 text-center text-muted-foreground">
                        No panels awaiting paint work.
                    </div>
                ) : (
                    panels.map((panel) => (
                        <div
                            key={panel.id}
                            className={cn(
                                "bg-card rounded-xl shadow-soft border p-4 transition-colors",
                                selectedPanels.has(panel.id) ? "border-primary bg-primary/5" : "border-default"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedPanels.has(panel.id)}
                                    onChange={() => togglePanel(panel.id)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="font-medium text-foreground">{panel.device.barcode}</div>
                                            <div className="text-xs text-muted-foreground">{panel.device.brand} {panel.device.model}</div>
                                        </div>
                                        <span className={cn(
                                            'px-2 py-1 rounded-full text-xs font-semibold shrink-0',
                                            panel.status === 'AWAITING_PAINT' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' :
                                                panel.status === 'IN_PAINT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                                    'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                        )}>
                                            {panel.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="text-sm text-foreground mb-3">Panel: {panel.panelType}</div>
                                    <div className="flex gap-2">
                                        {panel.status === 'AWAITING_PAINT' && (
                                            <button
                                                onClick={() => handleStartPaint(panel)}
                                                disabled={isPending}
                                                className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <PaintBucket size={16} /> Start
                                            </button>
                                        )}
                                        {panel.status === 'IN_PAINT' && (
                                            <button
                                                onClick={() => handleFinishPaint(panel)}
                                                disabled={isPending}
                                                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <CheckCircle size={16} /> Finish
                                            </button>
                                        )}
                                        {panel.status === 'READY_FOR_COLLECTION' && (
                                            <span className="text-muted-foreground italic text-xs">Waiting for Repair Eng to collect</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedPanels.size === panels.length && panels.length > 0}
                                    onChange={() => {
                                        if (selectedPanels.size === panels.length) {
                                            clearSelection()
                                        } else {
                                            setSelectedPanels(new Set(panels.map(p => p.id)))
                                        }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Device</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Panel Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                        {panels.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                    No panels awaiting paint work.
                                </td>
                            </tr>
                        ) : (
                            panels.map((panel) => (
                                <tr
                                    key={panel.id}
                                    className={cn(
                                        "transition-colors",
                                        selectedPanels.has(panel.id) ? "bg-primary/5" : "bg-card hover:bg-muted"
                                    )}
                                >
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedPanels.has(panel.id)}
                                            onChange={() => togglePanel(panel.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                                        <div className="font-medium">{panel.device.barcode}</div>
                                        <div className="text-xs text-muted-foreground">{panel.device.brand} {panel.device.model}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                                        {panel.panelType}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            'px-2 py-1 rounded-full text-xs font-semibold',
                                            panel.status === 'AWAITING_PAINT' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' :
                                                panel.status === 'IN_PAINT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                                    'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                        )}>
                                            {panel.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        <div className="flex gap-2">
                                            {panel.status === 'AWAITING_PAINT' && (
                                                <button
                                                    onClick={() => handleStartPaint(panel)}
                                                    disabled={isPending}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
                                                >
                                                    <PaintBucket size={16} /> Start
                                                </button>
                                            )}

                                            {panel.status === 'IN_PAINT' && (
                                                <button
                                                    onClick={() => handleFinishPaint(panel)}
                                                    disabled={isPending}
                                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
                                                >
                                                    <CheckCircle size={16} /> Finish
                                                </button>
                                            )}

                                            {panel.status === 'READY_FOR_COLLECTION' && (
                                                <span className="text-muted-foreground italic text-xs">Waiting for Repair Eng to collect</span>
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
