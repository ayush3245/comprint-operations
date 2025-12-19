'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, User, Calendar, Cpu, HardDrive, Monitor, Loader2, History, Package, Wrench, PaintBucket, ClipboardCheck, Truck, Battery, CircuitBoard } from 'lucide-react'
import { getDeviceHistory, type DeviceHistory, type DeviceHistoryEvent } from '@/lib/actions'
import { cn } from '@/lib/utils'

interface DeviceHistoryModalProps {
    deviceId: string | null
    onClose: () => void
}

const eventTypeConfig: Record<string, { icon: typeof Package; color: string; bgColor: string }> = {
    RECEIVED: { icon: Package, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-500/20' },
    INSPECTED: { icon: ClipboardCheck, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-500/20' },
    L2_REPAIR_STARTED: { icon: Wrench, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-500/20' },
    L2_REPAIR_COMPLETED: { icon: Wrench, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/20' },
    DISPLAY_REPAIR_STARTED: { icon: Monitor, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-500/20' },
    DISPLAY_REPAIR_COMPLETED: { icon: Monitor, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/20' },
    BATTERY_BOOST_STARTED: { icon: Battery, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-500/20' },
    BATTERY_BOOST_COMPLETED: { icon: Battery, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/20' },
    L3_REPAIR_STARTED: { icon: CircuitBoard, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-500/20' },
    L3_REPAIR_COMPLETED: { icon: CircuitBoard, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/20' },
    PAINT_COMPLETED: { icon: PaintBucket, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-500/20' },
    QC_PASSED: { icon: ClipboardCheck, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/20' },
    QC_FAILED: { icon: ClipboardCheck, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-500/20' },
    MOVEMENT_INWARD: { icon: Truck, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-500/20' },
    MOVEMENT_SALES_OUTWARD: { icon: Truck, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20' },
    MOVEMENT_RENTAL_OUTWARD: { icon: Truck, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-500/20' },
}

const defaultConfig = { icon: History, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-500/20' }

function getEventConfig(type: string) {
    return eventTypeConfig[type] || defaultConfig
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function formatRole(role: string) {
    return role.split('_').map(word =>
        word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
}

export function DeviceHistoryModal({ deviceId, onClose }: DeviceHistoryModalProps) {
    const [isPending, startTransition] = useTransition()
    const [history, setHistory] = useState<DeviceHistory | null>(null)

    useEffect(() => {
        if (deviceId) {
            startTransition(async () => {
                const data = await getDeviceHistory(deviceId)
                setHistory(data)
            })
        }
    }, [deviceId])

    if (!deviceId) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-card rounded-xl shadow-2xl border border-default overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-default bg-muted">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <History className="text-primary" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Device History</h2>
                            {history && (
                                <p className="text-sm text-muted-foreground font-mono">{history.device.barcode}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {isPending ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : history ? (
                        <div className="space-y-6">
                            {/* Device Info */}
                            <div className="bg-muted rounded-lg p-4">
                                <h3 className="font-medium text-foreground mb-3">Device Details</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Brand/Model:</span>
                                        <p className="font-medium text-foreground">{history.device.brand} {history.device.model}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Category:</span>
                                        <p className="font-medium text-foreground">{history.device.category.replace(/_/g, ' ')}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Status:</span>
                                        <p className="font-medium text-foreground">{history.device.status.replace(/_/g, ' ')}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Grade:</span>
                                        <p className="font-medium text-foreground">{history.device.grade || 'Not graded'}</p>
                                    </div>
                                    {history.device.cpu && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Specs:</span>
                                            <p className="font-medium text-foreground text-xs">
                                                {[history.device.cpu, history.device.ram, history.device.ssd, history.device.gpu, history.device.screenSize]
                                                    .filter(Boolean).join(' • ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h3 className="font-medium text-foreground mb-4">Work History</h3>
                                {history.timeline.length === 0 ? (
                                    <p className="text-muted-foreground text-sm text-center py-4">No history events recorded</p>
                                ) : (
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                                        {/* Events */}
                                        <div className="space-y-4">
                                            {history.timeline.map((event, index) => {
                                                const config = getEventConfig(event.type)
                                                const Icon = config.icon

                                                return (
                                                    <div key={index} className="relative flex gap-4">
                                                        {/* Icon */}
                                                        <div className={cn(
                                                            'relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                                                            config.bgColor
                                                        )}>
                                                            <Icon size={18} className={config.color} />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 pb-4">
                                                            <div className="bg-card border border-default rounded-lg p-3">
                                                                <p className="font-medium text-foreground text-sm">{event.description}</p>
                                                                {event.user && (
                                                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                                        <User size={12} />
                                                                        <span>{event.user.name}</span>
                                                                        <span className="px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground">
                                                                            {formatRole(event.user.role)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                    <Calendar size={12} />
                                                                    <span>{formatDate(event.date)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            Device not found
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-default bg-muted">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
