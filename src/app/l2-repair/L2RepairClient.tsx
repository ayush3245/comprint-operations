'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import {
    Wrench, Monitor, Battery, Cpu, Paintbrush, CheckCircle,
    Download, Send, Play, ChevronDown, ChevronUp, AlertCircle,
    Package, FileText, User, AlertTriangle, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { L3IssueType } from '@prisma/client'
import ReportedIssuesDisplay from '@/components/ReportedIssuesDisplay'

interface ChecklistItem {
    id: string
    itemIndex: number
    itemText: string
    status: string
    notes: string | null
    checkedAtStage: string
    checkedBy: { name: string } | null
}

interface ParallelJob {
    id: string
    status: string
    reportedIssues?: string | null
    initialCapacity?: string | null
    finalCapacity?: string | null
    issueType?: string
    notes?: string | null
    completedByL2?: boolean
    assignedTo?: { name: string } | null
}

interface PaintPanel {
    id: string
    panelType: string
    status: string
}

interface AssignedDevice {
    id: string
    status: string
    reportedIssues: string | null
    sparesRequired: string | null
    sparesIssued: string | null
    recommendedPaintPanels: string | null // JSON array of panel names from inspection
    inspectionEng: { name: string } | null
    device: {
        id: string
        barcode: string
        brand: string
        model: string
        category: string
        displayRepairRequired: boolean
        displayRepairCompleted: boolean
        batteryBoostRequired: boolean
        batteryBoostCompleted: boolean
        l3RepairRequired: boolean
        l3RepairCompleted: boolean
        paintRequired: boolean
        paintCompleted: boolean
        inspectionChecklist: ChecklistItem[]
        displayRepairJobs: ParallelJob[]
        batteryBoostJobs: ParallelJob[]
        l3RepairJobs: ParallelJob[]
        paintPanels: PaintPanel[]
    }
}

interface AvailableDevice {
    id: string
    barcode: string
    brand: string
    model: string
    category: string
    status: string
    repairJobs: Array<{
        id: string
        reportedIssues: string | null
        sparesRequired: string | null
        sparesIssued: string | null
        inspectionEng: { name: string } | null
    }>
    inspectionChecklist: ChecklistItem[]
}

interface CompletedDevice {
    id: string
    barcode: string
    brand: string
    model: string
    category: string
    status: string
    updatedAt: Date
    repairJobs: Array<{
        id: string
        status: string
        repairEndDate: Date | null
        l2Engineer: { name: string } | null
        inspectionEng: { name: string } | null
    }>
    qcRecords: Array<{
        status: string
        finalGrade: string
        completedAt: Date
        qcEng: { name: string } | null
    }>
}

interface L2RepairClientProps {
    assignedDevices: AssignedDevice[]
    availableDevices: AvailableDevice[]
    completedDevices: CompletedDevice[]
    userId: string
    userName: string
    onClaimDevice: (deviceId: string) => Promise<any>
    onSendToDisplay: (deviceId: string, issues: string) => Promise<any>
    onSendToBattery: (deviceId: string, initialCapacity: string) => Promise<any>
    onSendToL3: (deviceId: string, issueType: L3IssueType, description: string) => Promise<any>
    onSendToPaint: (deviceId: string, panels: string[]) => Promise<any>
    onCompleteDisplayByL2: (deviceId: string, notes: string) => Promise<any>
    onCompleteBatteryByL2: (deviceId: string, finalCapacity: string, notes: string) => Promise<any>
    onCollectFromDisplay: (deviceId: string) => Promise<any>
    onCollectFromBattery: (deviceId: string) => Promise<any>
    onCollectFromL3: (deviceId: string) => Promise<any>
    onCollectFromPaint: (jobId: string) => Promise<any>
    onSendToQC: (deviceId: string) => Promise<any>
    onRequestSpares: (deviceId: string, sparesRequired: string, notes?: string) => Promise<any>
}

export default function L2RepairClient({
    assignedDevices,
    availableDevices,
    completedDevices,
    userId,
    userName,
    onClaimDevice,
    onSendToDisplay,
    onSendToBattery,
    onSendToL3,
    onSendToPaint,
    onCompleteDisplayByL2,
    onCompleteBatteryByL2,
    onCollectFromDisplay,
    onCollectFromBattery,
    onCollectFromL3,
    onCollectFromPaint,
    onSendToQC,
    onRequestSpares
}: L2RepairClientProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const toast = useToast()
    const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'assigned' | 'available' | 'completed'>('assigned')

    // Modal states
    const [showL3Modal, setShowL3Modal] = useState<string | null>(null)
    const [showPaintModal, setShowPaintModal] = useState<{ deviceId: string; recommendedPanels: string[] } | null>(null)
    const [showBatteryModal, setShowBatteryModal] = useState<string | null>(null)
    const [showDisplayModal, setShowDisplayModal] = useState<string | null>(null)
    const [showSparesModal, setShowSparesModal] = useState<string | null>(null)

    const handleClaim = async (device: AvailableDevice) => {
        startTransition(async () => {
            try {
                await onClaimDevice(device.id)
                toast.success(`Device ${device.barcode} has been assigned to you.`, {
                    title: 'Device Claimed'
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to claim device')
            }
        })
    }

    const handleSendToQC = async (deviceId: string, barcode: string) => {
        startTransition(async () => {
            try {
                await onSendToQC(deviceId)
                toast.success('Device has been sent to QC for final inspection.', {
                    title: 'Sent to QC',
                    details: [{ label: 'Barcode', value: barcode }]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to send to QC')
            }
        })
    }

    const getParallelWorkStatus = (device: AssignedDevice['device'], job: AssignedDevice) => {
        // Only consider paint complete if there are panels AND they're all done
        // (every() returns true for empty arrays, so we need the length check)
        const allPaintComplete = device.paintPanels.length > 0 && device.paintPanels.every(
            p => p.status === 'READY_FOR_COLLECTION' || p.status === 'FITTED'
        )

        const displayJob = device.displayRepairJobs[0]
        const batteryJob = device.batteryBoostJobs[0]
        const l3Jobs = device.l3RepairJobs

        // Parse recommended paint panels from inspection (JSON array)
        let recommendedPanels: string[] = []
        if (job.recommendedPaintPanels) {
            try {
                recommendedPanels = JSON.parse(job.recommendedPaintPanels)
            } catch {
                recommendedPanels = []
            }
        }

        return {
            display: {
                required: device.displayRepairRequired,
                completed: device.displayRepairCompleted,
                pending: displayJob?.status === 'PENDING',
                inProgress: displayJob?.status === 'IN_PROGRESS',
                readyToCollect: displayJob?.status === 'COMPLETED' && !device.displayRepairCompleted,
                assignedToName: displayJob?.assignedTo?.name
            },
            battery: {
                required: device.batteryBoostRequired,
                completed: device.batteryBoostCompleted,
                pending: batteryJob?.status === 'PENDING',
                inProgress: batteryJob?.status === 'IN_PROGRESS',
                readyToCollect: batteryJob?.status === 'COMPLETED' && !device.batteryBoostCompleted,
                assignedToName: batteryJob?.assignedTo?.name
            },
            l3: {
                required: device.l3RepairRequired,
                completed: device.l3RepairCompleted,
                pending: l3Jobs.some(j => j.status === 'PENDING'),
                inProgress: l3Jobs.some(j => j.status === 'IN_PROGRESS'),
                readyToCollect: l3Jobs.every(j => j.status === 'COMPLETED') && l3Jobs.length > 0 && !device.l3RepairCompleted,
                assignedToName: l3Jobs.find(j => j.status === 'IN_PROGRESS')?.assignedTo?.name || l3Jobs[0]?.assignedTo?.name
            },
            paint: {
                required: device.paintRequired,
                completed: device.paintCompleted || allPaintComplete,
                panels: device.paintPanels,
                recommendedPanels, // Panels recommended by inspection
                panelsSent: device.paintPanels.length > 0, // Whether L2 has sent panels to paint
                readyToCollect: allPaintComplete && !device.paintCompleted && device.paintPanels.length > 0
            },
            readyForQC: (
                (!device.displayRepairRequired || device.displayRepairCompleted) &&
                (!device.batteryBoostRequired || device.batteryBoostCompleted) &&
                (!device.l3RepairRequired || device.l3RepairCompleted) &&
                (!device.paintRequired || device.paintCompleted || allPaintComplete)
            )
        }
    }

    const L3IssueTypes: L3IssueType[] = ['MOTHERBOARD', 'DOMAIN_LOCK', 'BIOS_LOCK', 'POWER_ON_ISSUE']
    const PaintPanelOptions = ['Top Cover', 'Bottom Cover', 'Palmrest', 'Bezel', 'Keyboard', 'Touchpad', 'Screen Bezel', 'Hinge Cover']

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">L2 Repair Coordination</h1>
                    {/* Capacity Indicator Badge */}
                    <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        assignedDevices.length >= 10
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                    )}>
                        {assignedDevices.length} / 10 active
                    </span>
                </div>
                <span className="text-sm text-muted-foreground">Engineer: {userName}</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-default overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                    onClick={() => setActiveTab('assigned')}
                    className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'assigned'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    My Devices ({assignedDevices.length})
                </button>
                <button
                    onClick={() => setActiveTab('available')}
                    className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'available'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Available ({availableDevices.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'completed'
                        ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Completed ({completedDevices.length})
                </button>
            </div>

            {/* Assigned Devices */}
            {activeTab === 'assigned' && (
                <div className="space-y-4">
                    {assignedDevices.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No devices assigned. Check the Available tab to claim devices.
                        </div>
                    ) : (
                        assignedDevices.map((job) => {
                            const device = job.device
                            const isExpanded = expandedDevice === device.id
                            const status = getParallelWorkStatus(device, job)
                            const failedItems = device.inspectionChecklist.filter(i => i.status === 'FAIL')

                            return (
                                <div key={job.id} className="bg-card rounded-lg shadow-soft border border-default">
                                    {/* Header */}
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted"
                                        onClick={() => setExpandedDevice(isExpanded ? null : device.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground">{device.barcode}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {device.brand} {device.model} • {device.category}
                                                </p>
                                            </div>
                                            {failedItems.length > 0 && (
                                                <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded text-xs">
                                                    {failedItems.length} Failed Items
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {/* Status indicators */}
                                            <div className="flex gap-2">
                                                {status.display.required && (
                                                    <Monitor
                                                        size={20}
                                                        className={status.display.completed ? 'text-green-600' :
                                                            status.display.readyToCollect ? 'text-yellow-500 animate-pulse' :
                                                                'text-gray-400'}
                                                    />
                                                )}
                                                {status.battery.required && (
                                                    <Battery
                                                        size={20}
                                                        className={status.battery.completed ? 'text-green-600' :
                                                            status.battery.readyToCollect ? 'text-yellow-500 animate-pulse' :
                                                                'text-gray-400'}
                                                    />
                                                )}
                                                {status.l3.required && (
                                                    <Cpu
                                                        size={20}
                                                        className={status.l3.completed ? 'text-green-600' :
                                                            status.l3.readyToCollect ? 'text-yellow-500 animate-pulse' :
                                                                'text-gray-400'}
                                                    />
                                                )}
                                                {status.paint.required && (
                                                    <Paintbrush
                                                        size={20}
                                                        className={status.paint.completed ? 'text-green-600' :
                                                            status.paint.readyToCollect ? 'text-yellow-500 animate-pulse' :
                                                                'text-gray-400'}
                                                    />
                                                )}
                                            </div>
                                            {status.readyForQC && (
                                                <span className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                                    Ready for QC
                                                </span>
                                            )}
                                            {isExpanded ? <ChevronUp size={20} className="text-foreground" /> : <ChevronDown size={20} className="text-foreground" />}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-default p-4 space-y-4">
                                            {/* Inspection Summary */}
                                            <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded border border-blue-200 dark:border-blue-500/30">
                                                <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                                                    <FileText size={16} /> Inspection Summary
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    {job.inspectionEng && (
                                                        <div className="flex items-center gap-2">
                                                            <User size={14} className="text-blue-600 dark:text-blue-400" />
                                                            <span className="text-muted-foreground">Inspector:</span>
                                                            <span className="font-medium text-foreground">{job.inspectionEng.name}</span>
                                                        </div>
                                                    )}
                                                    {job.reportedIssues && (
                                                        <div className="col-span-full">
                                                            <span className="text-muted-foreground block mb-2">Reported Issues:</span>
                                                            <ReportedIssuesDisplay issues={job.reportedIssues} />
                                                        </div>
                                                    )}
                                                    <div className="col-span-full flex flex-wrap gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={14} className="text-orange-600 dark:text-orange-400" />
                                                            <span className="text-muted-foreground">Spares Required:</span>
                                                            <span className={job.sparesRequired ? 'font-medium text-orange-700 dark:text-orange-400' : 'text-muted-foreground'}>
                                                                {job.sparesRequired || 'None'}
                                                            </span>
                                                        </div>
                                                        {job.sparesIssued && (
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                                                                <span className="text-muted-foreground">Spares Issued:</span>
                                                                <span className="font-medium text-green-700 dark:text-green-400">{job.sparesIssued}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Request Spares Button */}
                                                    <div className="col-span-full">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setShowSparesModal(device.id)
                                                            }}
                                                            disabled={job.status === 'WAITING_FOR_SPARES'}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                                                                job.status === 'WAITING_FOR_SPARES'
                                                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                                                    : 'bg-orange-500 text-white hover:bg-orange-600'
                                                            }`}
                                                        >
                                                            <Package size={14} />
                                                            {job.status === 'WAITING_FOR_SPARES' ? 'Waiting for Spares' : 'Request Spares'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Failed Checklist Items */}
                                            {failedItems.length > 0 && (
                                                <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded border border-red-200 dark:border-red-500/30">
                                                    <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                                                        <AlertCircle size={16} /> Failed Inspection Items
                                                    </h4>
                                                    <ul className="space-y-1 text-sm">
                                                        {failedItems.map(item => (
                                                            <li key={item.id} className="text-red-700 dark:text-red-400">
                                                                [{item.itemIndex}] {item.itemText}
                                                                {item.notes && <span className="text-red-600 dark:text-red-400 ml-2">- {item.notes}</span>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Parallel Work Status */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                                {/* Display Status */}
                                                <div className={`p-3 rounded border ${status.display.required
                                                    ? status.display.completed ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' :
                                                        status.display.readyToCollect ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                                                    : 'bg-muted border-default'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Monitor size={16} className="text-foreground" />
                                                        <span className="font-medium text-sm text-foreground">Display</span>
                                                    </div>
                                                    {status.display.completed ? (
                                                        <div>
                                                            <span className="text-xs text-green-600 dark:text-green-400">Completed</span>
                                                            {status.display.assignedToName && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">by {status.display.assignedToName}</p>
                                                            )}
                                                        </div>
                                                    ) : status.display.readyToCollect ? (
                                                        <button
                                                            onClick={() => {
                                                                startTransition(async () => {
                                                                    try {
                                                                        await onCollectFromDisplay(device.id)
                                                                        toast.success('Display repair collected')
                                                                        router.refresh()
                                                                    } catch (e: any) {
                                                                        toast.error(e.message)
                                                                    }
                                                                })
                                                            }}
                                                            disabled={isPending}
                                                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
                                                        >
                                                            <Download size={12} className="inline mr-1" />
                                                            Collect
                                                        </button>
                                                    ) : status.display.required ? (
                                                        <div>
                                                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                                                {status.display.inProgress ? 'In Progress' : status.display.pending ? 'Pending' : 'Sent'}
                                                            </span>
                                                            {status.display.inProgress && status.display.assignedToName && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">by {status.display.assignedToName}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowDisplayModal(device.id)}
                                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                                        >
                                                            <Send size={12} className="inline mr-1" />
                                                            Send
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Battery Status */}
                                                <div className={`p-3 rounded border ${status.battery.required
                                                    ? status.battery.completed ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' :
                                                        status.battery.readyToCollect ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                                                    : 'bg-muted border-default'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Battery size={16} className="text-foreground" />
                                                        <span className="font-medium text-sm text-foreground">Battery</span>
                                                    </div>
                                                    {status.battery.completed ? (
                                                        <div>
                                                            <span className="text-xs text-green-600 dark:text-green-400">Completed</span>
                                                            {status.battery.assignedToName && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">by {status.battery.assignedToName}</p>
                                                            )}
                                                        </div>
                                                    ) : status.battery.readyToCollect ? (
                                                        <button
                                                            onClick={() => {
                                                                startTransition(async () => {
                                                                    try {
                                                                        await onCollectFromBattery(device.id)
                                                                        toast.success('Battery boost collected')
                                                                        router.refresh()
                                                                    } catch (e: any) {
                                                                        toast.error(e.message)
                                                                    }
                                                                })
                                                            }}
                                                            disabled={isPending}
                                                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
                                                        >
                                                            <Download size={12} className="inline mr-1" />
                                                            Collect
                                                        </button>
                                                    ) : status.battery.required ? (
                                                        <div>
                                                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                                                {status.battery.inProgress ? 'In Progress' : status.battery.pending ? 'Pending' : 'Sent'}
                                                            </span>
                                                            {status.battery.inProgress && status.battery.assignedToName && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">by {status.battery.assignedToName}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowBatteryModal(device.id)}
                                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                                        >
                                                            <Send size={12} className="inline mr-1" />
                                                            Send
                                                        </button>
                                                    )}
                                                </div>

                                                {/* L3 Status */}
                                                <div className={`p-3 rounded border ${status.l3.required
                                                    ? status.l3.completed ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' :
                                                        status.l3.readyToCollect ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                                                    : 'bg-muted border-default'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Cpu size={16} className="text-foreground" />
                                                        <span className="font-medium text-sm text-foreground">L3 Repair</span>
                                                    </div>
                                                    {status.l3.completed ? (
                                                        <div>
                                                            <span className="text-xs text-green-600 dark:text-green-400">Completed</span>
                                                            {status.l3.assignedToName && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">by {status.l3.assignedToName}</p>
                                                            )}
                                                        </div>
                                                    ) : status.l3.readyToCollect ? (
                                                        <button
                                                            onClick={() => {
                                                                startTransition(async () => {
                                                                    try {
                                                                        await onCollectFromL3(device.id)
                                                                        toast.success('L3 repair collected')
                                                                        router.refresh()
                                                                    } catch (e: any) {
                                                                        toast.error(e.message)
                                                                    }
                                                                })
                                                            }}
                                                            disabled={isPending}
                                                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
                                                        >
                                                            <Download size={12} className="inline mr-1" />
                                                            Collect
                                                        </button>
                                                    ) : status.l3.required ? (
                                                        <div>
                                                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                                                {status.l3.inProgress ? 'In Progress' : status.l3.pending ? 'Pending' : 'Sent'}
                                                            </span>
                                                            {status.l3.inProgress && status.l3.assignedToName && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">by {status.l3.assignedToName}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowL3Modal(device.id)}
                                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                                        >
                                                            <Send size={12} className="inline mr-1" />
                                                            Send
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Paint Status */}
                                                <div className={`p-3 rounded border ${status.paint.required
                                                    ? status.paint.completed ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' :
                                                        status.paint.readyToCollect ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30' : 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30'
                                                    : 'bg-muted border-default'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Paintbrush size={16} className="text-foreground" />
                                                        <span className="font-medium text-sm text-foreground">Paint</span>
                                                        {status.paint.required && status.paint.panels.length > 0 && (
                                                            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                                                {status.paint.panels.length} panel{status.paint.panels.length !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {status.paint.required && !status.paint.panelsSent && status.paint.recommendedPanels.length > 0 && (
                                                            <span className="text-xs bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                                                                Recommended
                                                            </span>
                                                        )}
                                                    </div>
                                                    {status.paint.required && status.paint.completed ? (
                                                        <span className="text-xs text-green-600 dark:text-green-400">All panels completed</span>
                                                    ) : status.paint.readyToCollect ? (
                                                        <button
                                                            onClick={() => {
                                                                startTransition(async () => {
                                                                    try {
                                                                        // Find the associated repair job ID
                                                                        await onCollectFromPaint(job.id)
                                                                        toast.success('Paint panels collected')
                                                                        router.refresh()
                                                                    } catch (e: any) {
                                                                        toast.error(e.message)
                                                                    }
                                                                })
                                                            }}
                                                            disabled={isPending}
                                                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
                                                        >
                                                            <Download size={12} className="inline mr-1" />
                                                            Collect
                                                        </button>
                                                    ) : status.paint.required && status.paint.panels.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {status.paint.panels.map(p => (
                                                                <div key={p.id} className="text-xs flex items-center justify-between">
                                                                    <span className="text-purple-700 dark:text-purple-400">{p.panelType}</span>
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                                        p.status === 'AWAITING_PAINT' ? 'bg-muted text-muted-foreground' :
                                                                        p.status === 'IN_PAINT' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                                                        p.status === 'READY_FOR_COLLECTION' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                                                                        'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                                                    }`}>
                                                                        {p.status.replace(/_/g, ' ')}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : status.paint.required && !status.paint.panelsSent ? (
                                                        // Paint required but L2 hasn't sent panels yet - show recommendations
                                                        <div className="space-y-2">
                                                            {status.paint.recommendedPanels.length > 0 && (
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Inspection recommended:</span>
                                                                    {status.paint.recommendedPanels.map((panel, idx) => (
                                                                        <div key={idx} className="text-xs text-purple-700 dark:text-purple-400">
                                                                            • {panel}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => setShowPaintModal({ deviceId: device.id, recommendedPanels: status.paint.recommendedPanels })}
                                                                className="text-xs bg-purple-500 text-white px-2 py-1 rounded w-full hover:bg-purple-600 transition-colors"
                                                            >
                                                                <Send size={12} className="inline mr-1" />
                                                                Send to Paint
                                                            </button>
                                                        </div>
                                                    ) : !status.paint.required ? (
                                                        <button
                                                            onClick={() => setShowPaintModal({ deviceId: device.id, recommendedPanels: [] })}
                                                            className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 transition-colors"
                                                        >
                                                            <Send size={12} className="inline mr-1" />
                                                            Send
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Not required</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Send to QC Button */}
                                            {status.readyForQC && (
                                                <div className="pt-4 border-t border-default">
                                                    <button
                                                        onClick={() => handleSendToQC(device.id, device.barcode)}
                                                        disabled={isPending}
                                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle size={20} />
                                                        Send to QC
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Available Devices */}
            {activeTab === 'available' && (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {availableDevices.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No devices available for claiming.
                        </div>
                    ) : (
                        availableDevices.map((device) => {
                            const repairJob = device.repairJobs[0]
                            const failedItems = device.inspectionChecklist.filter(i => i.status === 'FAIL')

                            return (
                                <motion.div
                                    key={device.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className="bg-card rounded-lg shadow-soft p-4 border border-default border-t-4 border-t-blue-500"
                                >
                                    <div className="mb-4">
                                        <h3 className="font-bold text-lg text-foreground">{device.barcode}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {device.brand} {device.model} • {device.category}
                                        </p>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400 rounded text-xs">
                                            {device.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {repairJob?.inspectionEng && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Inspected by: {repairJob.inspectionEng.name}
                                        </p>
                                    )}

                                    {failedItems.length > 0 && (
                                        <div className="bg-red-50 dark:bg-red-500/10 p-2 rounded mb-3 text-xs border border-red-100 dark:border-red-500/30">
                                            <strong className="text-red-700 dark:text-red-400">{failedItems.length} Failed Items</strong>
                                            <ul className="mt-1 text-red-600 dark:text-red-400 max-h-20 overflow-y-auto">
                                                {failedItems.slice(0, 3).map(item => (
                                                    <li key={item.id}>• {item.itemText.substring(0, 40)}...</li>
                                                ))}
                                                {failedItems.length > 3 && (
                                                    <li className="italic">+{failedItems.length - 3} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleClaim(device)}
                                        disabled={isPending}
                                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-blue-400"
                                    >
                                        <Play size={16} />
                                        {isPending ? 'Claiming...' : 'Claim Device'}
                                    </button>
                                </motion.div>
                            )
                        })
                    )}
                </motion.div>
            )}

            {/* Completed Devices */}
            {activeTab === 'completed' && (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {completedDevices.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No completed devices yet.
                        </div>
                    ) : (
                        completedDevices.map((device) => {
                            const repairJob = device.repairJobs[0]
                            const qcRecord = device.qcRecords[0]

                            return (
                                <motion.div
                                    key={device.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className="bg-card rounded-lg shadow-soft p-4 border border-default border-t-4 border-t-green-500"
                                >
                                    <div className="mb-3">
                                        <h3 className="font-bold text-lg text-foreground">{device.barcode}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {device.brand} {device.model} • {device.category}
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className={`font-medium ${
                                                device.status === 'READY_FOR_STOCK' ? 'text-green-600 dark:text-green-400' :
                                                device.status === 'AWAITING_QC' ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'
                                            }`}>
                                                {device.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        {repairJob?.repairEndDate && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Completed:</span>
                                                <span className="text-foreground">{new Date(repairJob.repairEndDate).toLocaleDateString()}</span>
                                            </div>
                                        )}

                                        {qcRecord && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">QC Result:</span>
                                                    <span className={qcRecord.status === 'PASSED' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400'}>
                                                        {qcRecord.status}
                                                    </span>
                                                </div>
                                                {qcRecord.finalGrade && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Grade:</span>
                                                        <span className="font-bold text-foreground">Grade {qcRecord.finalGrade}</span>
                                                    </div>
                                                )}
                                                {qcRecord.qcEng && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">QC By:</span>
                                                        <span className="text-foreground">{qcRecord.qcEng.name}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {!qcRecord && (
                                            <div className="text-center py-2 bg-yellow-50 dark:bg-yellow-500/10 rounded text-yellow-700 dark:text-yellow-400 text-xs">
                                                Awaiting QC Review
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </motion.div>
            )}

            {/* Spares Request Modal */}
            {showSparesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg p-4 sm:p-6 w-full max-w-md border border-default max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Request Spare Parts</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const sparesRequired = form.sparesRequired.value
                            const notes = form.notes.value
                            startTransition(async () => {
                                try {
                                    await onRequestSpares(showSparesModal, sparesRequired, notes)
                                    toast.success('Spare parts request submitted')
                                    setShowSparesModal(null)
                                    router.refresh()
                                } catch (err: any) {
                                    toast.error(err.message)
                                }
                            })
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Spare Parts Required</label>
                                <textarea
                                    name="sparesRequired"
                                    className="w-full border border-default rounded p-2 bg-card text-foreground"
                                    rows={3}
                                    placeholder="List part codes or descriptions (one per line)"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Notes (optional)</label>
                                <textarea name="notes" className="w-full border border-default rounded p-2 bg-card text-foreground" rows={2} placeholder="Any additional details..." />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowSparesModal(null)} className="flex-1 py-2 border border-default rounded text-foreground hover:bg-muted">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 transition-colors">
                                    {isPending ? 'Requesting...' : 'Request Spares'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* L3 Modal */}
            {showL3Modal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg p-4 sm:p-6 w-full max-w-md border border-default max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Send to L3 Engineer</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const issueType = form.issueType.value as L3IssueType
                            const description = form.description.value
                            startTransition(async () => {
                                try {
                                    await onSendToL3(showL3Modal, issueType, description)
                                    toast.success('Sent to L3 Engineer')
                                    setShowL3Modal(null)
                                    router.refresh()
                                } catch (err: any) {
                                    toast.error(err.message)
                                }
                            })
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Issue Type</label>
                                <select name="issueType" className="w-full border border-default rounded p-2 bg-card text-foreground" required>
                                    {L3IssueTypes.map(type => (
                                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Description</label>
                                <textarea name="description" className="w-full border border-default rounded p-2 bg-card text-foreground" rows={3} required />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowL3Modal(null)} className="flex-1 py-2 border border-default rounded text-foreground hover:bg-muted">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                    {isPending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Paint Modal */}
            {showPaintModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg p-4 sm:p-6 w-full max-w-md border border-default max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Send Panels to Paint</h3>
                        {showPaintModal.recommendedPanels.length > 0 && (
                            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-500/10 rounded border border-orange-200 dark:border-orange-500/30">
                                <p className="text-sm text-orange-700 dark:text-orange-400">
                                    <strong>Inspection recommended:</strong> {showPaintModal.recommendedPanels.join(', ')}
                                </p>
                            </div>
                        )}
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const selectedPanels: string[] = []
                            PaintPanelOptions.forEach(panel => {
                                if ((form.elements.namedItem(panel) as HTMLInputElement)?.checked) {
                                    selectedPanels.push(panel)
                                }
                            })
                            if (selectedPanels.length === 0) {
                                toast.error('Select at least one panel')
                                return
                            }
                            startTransition(async () => {
                                try {
                                    await onSendToPaint(showPaintModal.deviceId, selectedPanels)
                                    toast.success('Sent to Paint Shop')
                                    setShowPaintModal(null)
                                    router.refresh()
                                } catch (err: any) {
                                    toast.error(err.message)
                                }
                            })
                        }}>
                            <div className="mb-4 grid grid-cols-2 gap-2">
                                {PaintPanelOptions.map(panel => (
                                    <label key={panel} className={cn(
                                        "flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer",
                                        showPaintModal.recommendedPanels.includes(panel)
                                            ? "border-orange-300 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-500/10"
                                            : "border-default"
                                    )}>
                                        <input
                                            type="checkbox"
                                            name={panel}
                                            defaultChecked={showPaintModal.recommendedPanels.includes(panel)}
                                        />
                                        <span className="text-sm text-foreground">{panel}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowPaintModal(null)} className="flex-1 py-2 border border-default rounded text-foreground hover:bg-muted">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors">
                                    {isPending ? 'Sending...' : 'Send to Paint'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Battery Modal */}
            {showBatteryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg p-4 sm:p-6 w-full max-w-md border border-default max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Battery Boost</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const doItMyself = (form.elements.namedItem('doItMyself') as HTMLInputElement)?.checked
                            const initialCapacity = form.initialCapacity.value
                            const finalCapacity = form.finalCapacity?.value || ''
                            const notes = form.notes?.value || ''
                            startTransition(async () => {
                                try {
                                    if (doItMyself) {
                                        await onCompleteBatteryByL2(showBatteryModal, finalCapacity, notes)
                                        toast.success('Battery boost completed by you')
                                    } else {
                                        await onSendToBattery(showBatteryModal, initialCapacity)
                                        toast.success('Sent for Battery Boost')
                                    }
                                    setShowBatteryModal(null)
                                    router.refresh()
                                } catch (err: any) {
                                    toast.error(err.message)
                                }
                            })
                        }}>
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded border border-blue-200 dark:border-blue-500/30">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="doItMyself"
                                        className="w-4 h-4"
                                        onChange={(e) => {
                                            const form = e.target.closest('form')
                                            const finalCapacityDiv = form?.querySelector('[data-field="finalCapacity"]') as HTMLElement
                                            const notesDiv = form?.querySelector('[data-field="notes"]') as HTMLElement
                                            const initialCapacityDiv = form?.querySelector('[data-field="initialCapacity"]') as HTMLElement
                                            if (finalCapacityDiv) finalCapacityDiv.style.display = e.target.checked ? 'block' : 'none'
                                            if (notesDiv) notesDiv.style.display = e.target.checked ? 'block' : 'none'
                                            if (initialCapacityDiv) initialCapacityDiv.style.display = e.target.checked ? 'none' : 'block'
                                        }}
                                    />
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-400">I&apos;ll handle this myself</span>
                                </label>
                            </div>
                            <div className="mb-4" data-field="initialCapacity">
                                <label className="block text-sm font-medium mb-1 text-foreground">Current Battery Capacity</label>
                                <input
                                    type="text"
                                    name="initialCapacity"
                                    placeholder="e.g., 45%"
                                    className="w-full border border-default rounded p-2 bg-card text-foreground"
                                />
                            </div>
                            <div className="mb-4 hidden" data-field="finalCapacity">
                                <label className="block text-sm font-medium mb-1 text-foreground">Final Battery Capacity</label>
                                <input
                                    type="text"
                                    name="finalCapacity"
                                    placeholder="e.g., 85%"
                                    className="w-full border border-default rounded p-2 bg-card text-foreground"
                                />
                            </div>
                            <div className="mb-4 hidden" data-field="notes">
                                <label className="block text-sm font-medium mb-1 text-foreground">Notes (optional)</label>
                                <textarea name="notes" className="w-full border border-default rounded p-2 bg-card text-foreground" rows={2} placeholder="Any notes about the work..." />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowBatteryModal(null)} className="flex-1 py-2 border border-default rounded text-foreground hover:bg-muted">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                    {isPending ? 'Processing...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Display Modal */}
            {showDisplayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg p-4 sm:p-6 w-full max-w-md border border-default max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Display Repair</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const doItMyself = (form.elements.namedItem('doItMyself') as HTMLInputElement)?.checked
                            const issues = form.issues.value
                            const notes = form.notes?.value || ''
                            startTransition(async () => {
                                try {
                                    if (doItMyself) {
                                        await onCompleteDisplayByL2(showDisplayModal, notes || issues)
                                        toast.success('Display repair completed by you')
                                    } else {
                                        await onSendToDisplay(showDisplayModal, issues)
                                        toast.success('Sent for Display Repair')
                                    }
                                    setShowDisplayModal(null)
                                    router.refresh()
                                } catch (err: any) {
                                    toast.error(err.message)
                                }
                            })
                        }}>
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded border border-blue-200 dark:border-blue-500/30">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="doItMyself"
                                        className="w-4 h-4"
                                        onChange={(e) => {
                                            const form = e.target.closest('form')
                                            const issuesDiv = form?.querySelector('[data-field="issues"]') as HTMLElement
                                            const notesDiv = form?.querySelector('[data-field="notes"]') as HTMLElement
                                            if (issuesDiv) {
                                                const label = issuesDiv.querySelector('label')
                                                if (label) label.textContent = e.target.checked ? 'Work Completed (notes)' : 'Display Issues'
                                            }
                                            if (notesDiv) notesDiv.style.display = e.target.checked ? 'block' : 'none'
                                        }}
                                    />
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-400">I&apos;ll handle this myself</span>
                                </label>
                            </div>
                            <div className="mb-4" data-field="issues">
                                <label className="block text-sm font-medium mb-1 text-foreground">Display Issues</label>
                                <textarea
                                    name="issues"
                                    placeholder="Describe the display issues or work completed..."
                                    className="w-full border border-default rounded p-2 bg-card text-foreground"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="mb-4 hidden" data-field="notes">
                                <label className="block text-sm font-medium mb-1 text-foreground">Additional Notes (optional)</label>
                                <textarea name="notes" className="w-full border border-default rounded p-2 bg-card text-foreground" rows={2} placeholder="Any additional notes..." />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowDisplayModal(null)} className="flex-1 py-2 border border-default rounded text-foreground hover:bg-muted">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                    {isPending ? 'Processing...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
