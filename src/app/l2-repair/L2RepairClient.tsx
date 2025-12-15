'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import {
    Wrench, Monitor, Battery, Cpu, Paintbrush, CheckCircle,
    Download, Send, Play, ChevronDown, ChevronUp, AlertCircle,
    Package, FileText, User
} from 'lucide-react'
import type { L3IssueType } from '@prisma/client'

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
    const [showPaintModal, setShowPaintModal] = useState<string | null>(null)
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

    const getParallelWorkStatus = (device: AssignedDevice['device']) => {
        const allPaintComplete = device.paintPanels.every(
            p => p.status === 'READY_FOR_COLLECTION' || p.status === 'FITTED'
        )

        const displayJob = device.displayRepairJobs[0]
        const batteryJob = device.batteryBoostJobs[0]
        const l3Jobs = device.l3RepairJobs

        return {
            display: {
                required: device.displayRepairRequired,
                completed: device.displayRepairCompleted,
                pending: displayJob?.status === 'PENDING',
                inProgress: displayJob?.status === 'IN_PROGRESS',
                readyToCollect: displayJob?.status === 'COMPLETED' && !device.displayRepairCompleted
            },
            battery: {
                required: device.batteryBoostRequired,
                completed: device.batteryBoostCompleted,
                pending: batteryJob?.status === 'PENDING',
                inProgress: batteryJob?.status === 'IN_PROGRESS',
                readyToCollect: batteryJob?.status === 'COMPLETED' && !device.batteryBoostCompleted
            },
            l3: {
                required: device.l3RepairRequired,
                completed: device.l3RepairCompleted,
                pending: l3Jobs.some(j => j.status === 'PENDING'),
                inProgress: l3Jobs.some(j => j.status === 'IN_PROGRESS'),
                readyToCollect: l3Jobs.every(j => j.status === 'COMPLETED') && l3Jobs.length > 0 && !device.l3RepairCompleted
            },
            paint: {
                required: device.paintRequired,
                completed: device.paintCompleted || allPaintComplete,
                panels: device.paintPanels,
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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">L2 Repair Coordination</h1>
                <span className="text-sm text-gray-500">Engineer: {userName}</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab('assigned')}
                    className={`px-4 py-2 font-medium ${activeTab === 'assigned'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    My Devices ({assignedDevices.length})
                </button>
                <button
                    onClick={() => setActiveTab('available')}
                    className={`px-4 py-2 font-medium ${activeTab === 'available'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Available ({availableDevices.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 font-medium ${activeTab === 'completed'
                        ? 'border-b-2 border-green-600 text-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Completed ({completedDevices.length})
                </button>
            </div>

            {/* Assigned Devices */}
            {activeTab === 'assigned' && (
                <div className="space-y-4">
                    {assignedDevices.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No devices assigned. Check the Available tab to claim devices.
                        </div>
                    ) : (
                        assignedDevices.map((job) => {
                            const device = job.device
                            const isExpanded = expandedDevice === device.id
                            const status = getParallelWorkStatus(device)
                            const failedItems = device.inspectionChecklist.filter(i => i.status === 'FAIL')

                            return (
                                <div key={job.id} className="bg-white rounded-lg shadow border">
                                    {/* Header */}
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                        onClick={() => setExpandedDevice(isExpanded ? null : device.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h3 className="font-bold text-lg">{device.barcode}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {device.brand} {device.model} • {device.category}
                                                </p>
                                            </div>
                                            {failedItems.length > 0 && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
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
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                    Ready for QC
                                                </span>
                                            )}
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t p-4 space-y-4">
                                            {/* Inspection Summary */}
                                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                                    <FileText size={16} /> Inspection Summary
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    {job.inspectionEng && (
                                                        <div className="flex items-center gap-2">
                                                            <User size={14} className="text-blue-600" />
                                                            <span className="text-gray-600">Inspector:</span>
                                                            <span className="font-medium">{job.inspectionEng.name}</span>
                                                        </div>
                                                    )}
                                                    {job.reportedIssues && (
                                                        <div className="col-span-full">
                                                            <span className="text-gray-600">Reported Issues:</span>
                                                            <p className="mt-1 text-gray-800 bg-white p-2 rounded border">
                                                                {job.reportedIssues}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="col-span-full flex flex-wrap gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={14} className="text-orange-600" />
                                                            <span className="text-gray-600">Spares Required:</span>
                                                            <span className={job.sparesRequired ? 'font-medium text-orange-700' : 'text-gray-400'}>
                                                                {job.sparesRequired || 'None'}
                                                            </span>
                                                        </div>
                                                        {job.sparesIssued && (
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle size={14} className="text-green-600" />
                                                                <span className="text-gray-600">Spares Issued:</span>
                                                                <span className="font-medium text-green-700">{job.sparesIssued}</span>
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
                                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
                                                <div className="bg-red-50 p-3 rounded">
                                                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                                        <AlertCircle size={16} /> Failed Inspection Items
                                                    </h4>
                                                    <ul className="space-y-1 text-sm">
                                                        {failedItems.map(item => (
                                                            <li key={item.id} className="text-red-700">
                                                                [{item.itemIndex}] {item.itemText}
                                                                {item.notes && <span className="text-red-600 ml-2">- {item.notes}</span>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Parallel Work Status */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {/* Display Status */}
                                                <div className={`p-3 rounded border ${status.display.required
                                                    ? status.display.completed ? 'bg-green-50 border-green-200' :
                                                        status.display.readyToCollect ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                                                    : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Monitor size={16} />
                                                        <span className="font-medium text-sm">Display</span>
                                                    </div>
                                                    {status.display.completed ? (
                                                        <span className="text-xs text-green-600">Completed</span>
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
                                                        <span className="text-xs text-blue-600">
                                                            {status.display.inProgress ? 'In Progress' : status.display.pending ? 'Pending' : 'Sent'}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowDisplayModal(device.id)}
                                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                                                        >
                                                            <Send size={12} className="inline mr-1" />
                                                            Send
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Battery Status */}
                                                <div className={`p-3 rounded border ${status.battery.required
                                                    ? status.battery.completed ? 'bg-green-50 border-green-200' :
                                                        status.battery.readyToCollect ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                                                    : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Battery size={16} />
                                                        <span className="font-medium text-sm">Battery</span>
                                                    </div>
                                                    {status.battery.completed ? (
                                                        <span className="text-xs text-green-600">Completed</span>
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
                                                        <span className="text-xs text-blue-600">
                                                            {status.battery.inProgress ? 'In Progress' : status.battery.pending ? 'Pending' : 'Sent'}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowBatteryModal(device.id)}
                                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                                                        >
                                                            <Send size={12} className="inline mr-1" />
                                                            Send
                                                        </button>
                                                    )}
                                                </div>

                                                {/* L3 Status */}
                                                <div className={`p-3 rounded border ${status.l3.required
                                                    ? status.l3.completed ? 'bg-green-50 border-green-200' :
                                                        status.l3.readyToCollect ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                                                    : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Cpu size={16} />
                                                        <span className="font-medium text-sm">L3 Repair</span>
                                                    </div>
                                                    {status.l3.completed ? (
                                                        <span className="text-xs text-green-600">Completed</span>
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
                                                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
                                                        >
                                                            <Download size={12} className="inline mr-1" />
                                                            Collect
                                                        </button>
                                                    ) : status.l3.required ? (
                                                        <span className="text-xs text-blue-600">
                                                            {status.l3.inProgress ? 'In Progress' : status.l3.pending ? 'Pending' : 'Sent'}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowL3Modal(device.id)}
                                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                                                        >
                                                            <Send size={12} className="inline mr-1" />
                                                            Send
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Paint Status */}
                                                <div className={`p-3 rounded border ${status.paint.required
                                                    ? status.paint.completed ? 'bg-green-50 border-green-200' :
                                                        status.paint.readyToCollect ? 'bg-yellow-50 border-yellow-200' : 'bg-purple-50 border-purple-200'
                                                    : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Paintbrush size={16} />
                                                        <span className="font-medium text-sm">Paint</span>
                                                    </div>
                                                    {status.paint.completed ? (
                                                        <span className="text-xs text-green-600">Completed</span>
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
                                                    ) : status.paint.required ? (
                                                        <div className="text-xs text-purple-600">
                                                            {status.paint.panels.map(p => (
                                                                <div key={p.id}>{p.panelType}: {p.status.replace('_', ' ')}</div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowPaintModal(device.id)}
                                                            className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
                                                        >
                                                            <Send size={12} className="inline mr-1" />
                                                            Send
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Send to QC Button */}
                                            {status.readyForQC && (
                                                <div className="pt-4 border-t">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableDevices.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No devices available for claiming.
                        </div>
                    ) : (
                        availableDevices.map((device) => {
                            const repairJob = device.repairJobs[0]
                            const failedItems = device.inspectionChecklist.filter(i => i.status === 'FAIL')

                            return (
                                <div key={device.id} className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-lg">{device.barcode}</h3>
                                        <p className="text-sm text-gray-500">
                                            {device.brand} {device.model} • {device.category}
                                        </p>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                                            {device.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {repairJob?.inspectionEng && (
                                        <p className="text-xs text-gray-500 mb-2">
                                            Inspected by: {repairJob.inspectionEng.name}
                                        </p>
                                    )}

                                    {failedItems.length > 0 && (
                                        <div className="bg-red-50 p-2 rounded mb-3 text-xs">
                                            <strong className="text-red-700">{failedItems.length} Failed Items</strong>
                                            <ul className="mt-1 text-red-600 max-h-20 overflow-y-auto">
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
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Completed Devices */}
            {activeTab === 'completed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedDevices.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No completed devices yet.
                        </div>
                    ) : (
                        completedDevices.map((device) => {
                            const repairJob = device.repairJobs[0]
                            const qcRecord = device.qcRecords[0]

                            return (
                                <div key={device.id} className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
                                    <div className="mb-3">
                                        <h3 className="font-bold text-lg">{device.barcode}</h3>
                                        <p className="text-sm text-gray-500">
                                            {device.brand} {device.model} • {device.category}
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Status:</span>
                                            <span className={`font-medium ${
                                                device.status === 'READY_FOR_STOCK' ? 'text-green-600' :
                                                device.status === 'AWAITING_QC' ? 'text-yellow-600' : 'text-gray-600'
                                            }`}>
                                                {device.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        {repairJob?.repairEndDate && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Completed:</span>
                                                <span>{new Date(repairJob.repairEndDate).toLocaleDateString()}</span>
                                            </div>
                                        )}

                                        {qcRecord && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">QC Result:</span>
                                                    <span className={qcRecord.status === 'PASSED' ? 'text-green-600 font-medium' : 'text-red-600'}>
                                                        {qcRecord.status}
                                                    </span>
                                                </div>
                                                {qcRecord.finalGrade && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Grade:</span>
                                                        <span className="font-bold">Grade {qcRecord.finalGrade}</span>
                                                    </div>
                                                )}
                                                {qcRecord.qcEng && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">QC By:</span>
                                                        <span>{qcRecord.qcEng.name}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {!qcRecord && (
                                            <div className="text-center py-2 bg-yellow-50 rounded text-yellow-700 text-xs">
                                                Awaiting QC Review
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Spares Request Modal */}
            {showSparesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Request Spare Parts</h3>
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
                                <label className="block text-sm font-medium mb-1">Spare Parts Required</label>
                                <textarea
                                    name="sparesRequired"
                                    className="w-full border rounded p-2"
                                    rows={3}
                                    placeholder="List part codes or descriptions (one per line)"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                                <textarea name="notes" className="w-full border rounded p-2" rows={2} placeholder="Any additional details..." />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowSparesModal(null)} className="flex-1 py-2 border rounded">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-orange-600 text-white rounded">
                                    {isPending ? 'Requesting...' : 'Request Spares'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* L3 Modal */}
            {showL3Modal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Send to L3 Engineer</h3>
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
                                <label className="block text-sm font-medium mb-1">Issue Type</label>
                                <select name="issueType" className="w-full border rounded p-2" required>
                                    {L3IssueTypes.map(type => (
                                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea name="description" className="w-full border rounded p-2" rows={3} required />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowL3Modal(null)} className="flex-1 py-2 border rounded">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-blue-600 text-white rounded">
                                    {isPending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Paint Modal */}
            {showPaintModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Send Panels to Paint</h3>
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
                                    await onSendToPaint(showPaintModal, selectedPanels)
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
                                    <label key={panel} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" name={panel} />
                                        <span className="text-sm">{panel}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowPaintModal(null)} className="flex-1 py-2 border rounded">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-purple-600 text-white rounded">
                                    {isPending ? 'Sending...' : 'Send to Paint'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Battery Modal */}
            {showBatteryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Battery Boost</h3>
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
                            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
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
                                    <span className="text-sm font-medium text-blue-800">I&apos;ll handle this myself</span>
                                </label>
                            </div>
                            <div className="mb-4" data-field="initialCapacity">
                                <label className="block text-sm font-medium mb-1">Current Battery Capacity</label>
                                <input
                                    type="text"
                                    name="initialCapacity"
                                    placeholder="e.g., 45%"
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div className="mb-4 hidden" data-field="finalCapacity">
                                <label className="block text-sm font-medium mb-1">Final Battery Capacity</label>
                                <input
                                    type="text"
                                    name="finalCapacity"
                                    placeholder="e.g., 85%"
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div className="mb-4 hidden" data-field="notes">
                                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                                <textarea name="notes" className="w-full border rounded p-2" rows={2} placeholder="Any notes about the work..." />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowBatteryModal(null)} className="flex-1 py-2 border rounded">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-blue-600 text-white rounded">
                                    {isPending ? 'Processing...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Display Modal */}
            {showDisplayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Display Repair</h3>
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
                            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
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
                                    <span className="text-sm font-medium text-blue-800">I&apos;ll handle this myself</span>
                                </label>
                            </div>
                            <div className="mb-4" data-field="issues">
                                <label className="block text-sm font-medium mb-1">Display Issues</label>
                                <textarea
                                    name="issues"
                                    placeholder="Describe the display issues or work completed..."
                                    className="w-full border rounded p-2"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="mb-4 hidden" data-field="notes">
                                <label className="block text-sm font-medium mb-1">Additional Notes (optional)</label>
                                <textarea name="notes" className="w-full border rounded p-2" rows={2} placeholder="Any additional notes..." />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowDisplayModal(null)} className="flex-1 py-2 border rounded">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 py-2 bg-blue-600 text-white rounded">
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
