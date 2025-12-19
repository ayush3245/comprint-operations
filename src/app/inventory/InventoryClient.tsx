'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Warehouse, History, MapPin, ChevronDown, Check, X, RotateCcw } from 'lucide-react'
import { searchInventory, assignDeviceToRack } from '@/lib/actions'
import { Pagination } from '@/components/ui/Pagination'
import { DeviceHistoryModal } from '@/components/ui/DeviceHistoryModal'
import { cn } from '@/lib/utils'

type Rack = {
    id: string
    rackCode: string
    stage: string
    capacity: number
    isActive: boolean
    _count: { devices: number }
}

type Device = {
    id: string
    barcode: string
    brand: string
    model: string | null
    category: string
    cpu: string | null
    ram: string | null
    ssd: string | null
    gpu: string | null
    screenSize: string | null
    grade: string | null
    ownership: string
    status: string
    rack: {
        id: string
        rackCode: string
        stage: string
    } | null
}

type InventoryData = {
    devices: Device[]
    total: number
    page: number
    limit: number
    totalPages: number
}

interface Props {
    initialData: InventoryData
    racks: Rack[]
    canManageRacks: boolean
}

const categoryOptions = [
    { value: 'LAPTOP', label: 'Laptop' },
    { value: 'DESKTOP', label: 'Desktop' },
    { value: 'WORKSTATION', label: 'Workstation' },
    { value: 'SERVER', label: 'Server' },
    { value: 'MONITOR', label: 'Monitor' },
    { value: 'STORAGE', label: 'Storage' },
    { value: 'NETWORKING_CARD', label: 'Networking Card' }
]

const ownershipOptions = [
    { value: 'REFURB_STOCK', label: 'Refurb Stock' },
    { value: 'RENTAL_RETURN', label: 'Rental Return' }
]

const statusOptions = [
    { value: 'RECEIVED', label: 'Received' },
    { value: 'PENDING_INSPECTION', label: 'Pending Inspection' },
    { value: 'WAITING_FOR_SPARES', label: 'Waiting for Spares' },
    { value: 'READY_FOR_REPAIR', label: 'Ready for Repair' },
    { value: 'UNDER_REPAIR', label: 'Under Repair' },
    { value: 'IN_PAINT_SHOP', label: 'In Paint Shop' },
    { value: 'AWAITING_QC', label: 'Awaiting QC' },
    { value: 'READY_FOR_STOCK', label: 'Ready for Dispatch' }
]

const gradeOptions = [
    { value: 'A', label: 'Grade A' },
    { value: 'B', label: 'Grade B' }
]

const statusColors: Record<string, string> = {
    RECEIVED: 'bg-secondary text-secondary-foreground',
    PENDING_INSPECTION: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
    WAITING_FOR_SPARES: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400',
    READY_FOR_REPAIR: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
    UNDER_REPAIR: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400',
    IN_PAINT_SHOP: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-400',
    AWAITING_QC: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400',
    READY_FOR_STOCK: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
}

type SortField = 'barcode' | 'brand' | 'model' | 'updatedAt' | 'createdAt'

export default function InventoryClient({ initialData, racks, canManageRacks }: Props) {
    const [isPending, startTransition] = useTransition()
    const [isAssigning, startAssignTransition] = useTransition()
    const [data, setData] = useState<InventoryData>(initialData)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [sortBy, setSortBy] = useState<SortField>('updatedAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(25)
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
    const [rackAssignDevice, setRackAssignDevice] = useState<Device | null>(null)
    const [assignError, setAssignError] = useState<string | null>(null)

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm, filters, sortBy, sortOrder, currentPage, itemsPerPage])

    async function fetchData() {
        startTransition(async () => {
            const result = await searchInventory({
                search: searchTerm,
                category: filters.category,
                ownership: filters.ownership,
                status: filters.status,
                grade: filters.grade,
                sortBy,
                sortOrder,
                page: currentPage,
                limit: itemsPerPage
            })
            setData(result)
        })
    }

    function handleFilterChange(key: string, value: string) {
        setFilters(prev => ({ ...prev, [key]: value }))
        setCurrentPage(1) // Reset to first page on filter change
    }

    function handleClearFilters() {
        setFilters({})
        setSearchTerm('')
        setCurrentPage(1)
    }

    function handleSort(field: SortField) {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
        setCurrentPage(1)
    }

    function getSortIcon(field: SortField) {
        if (sortBy !== field) return <ArrowUpDown size={14} className="opacity-50" />
        return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
    }

    function getStatusLabel(status: string) {
        return status.replace(/_/g, ' ')
    }

    function getRackStageLabel(stage: string) {
        const labels: Record<string, string> = {
            RECEIVED: 'Received',
            WAITING_FOR_REPAIR: 'Waiting for Repair',
            UNDER_REPAIR: 'Under Repair',
            AWAITING_QC: 'Awaiting QC',
            READY_FOR_DISPATCH: 'Ready for Dispatch'
        }
        return labels[stage] || stage
    }

    // Map device status to allowed rack stage
    function getAllowedRackStage(deviceStatus: string): string | null {
        const statusToStage: Record<string, string> = {
            RECEIVED: 'RECEIVED',
            PENDING_INSPECTION: 'RECEIVED',
            WAITING_FOR_SPARES: 'WAITING_FOR_REPAIR',
            READY_FOR_REPAIR: 'WAITING_FOR_REPAIR',
            UNDER_REPAIR: 'UNDER_REPAIR',
            IN_PAINT_SHOP: 'UNDER_REPAIR',
            AWAITING_QC: 'AWAITING_QC',
            QC_FAILED_REWORK: 'AWAITING_QC',
            READY_FOR_STOCK: 'READY_FOR_DISPATCH',
            QC_PASSED: 'READY_FOR_DISPATCH'
        }
        return statusToStage[deviceStatus] || null
    }

    async function handleRackAssign(rackId: string | null) {
        if (!rackAssignDevice) return
        setAssignError(null)

        startAssignTransition(async () => {
            try {
                await assignDeviceToRack(rackAssignDevice.id, rackId)
                setRackAssignDevice(null)
                fetchData() // Refresh data
            } catch (error) {
                setAssignError(error instanceof Error ? error.message : 'Failed to assign rack')
            }
        })
    }

    // Group racks by stage for the dropdown
    const racksByStage = racks.reduce((acc, rack) => {
        if (!rack.isActive) return acc
        if (!acc[rack.stage]) acc[rack.stage] = []
        acc[rack.stage].push(rack)
        return acc
    }, {} as Record<string, Rack[]>)

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by barcode, brand, model, or location..."
                        className="w-full pl-12 pr-4 py-3 bg-card border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    {isPending && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" size={20} />
                    )}
                </div>
            </div>

            {/* Inline Filters - Always Visible */}
            <div className="bg-card rounded-xl shadow-soft border border-default p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                        <select
                            value={filters.category || ''}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        >
                            <option value="">All Categories</option>
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Ownership</label>
                        <select
                            value={filters.ownership || ''}
                            onChange={(e) => handleFilterChange('ownership', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        >
                            <option value="">All Ownership</option>
                            {ownershipOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Stage</label>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        >
                            <option value="">All Stages</option>
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Grade</label>
                        <select
                            value={filters.grade || ''}
                            onChange={(e) => handleFilterChange('grade', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        >
                            <option value="">All Grades</option>
                            {gradeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    {Object.values(filters).some(Boolean) && (
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            <RotateCcw size={14} />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Found <span className="font-medium text-foreground">{data.total}</span> devices
                </p>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {data.devices.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-soft border border-default p-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                            <Warehouse size={32} className="text-muted-foreground/50" />
                            <span>No devices found matching your criteria.</span>
                        </div>
                    </div>
                ) : (
                    data.devices.map((device) => {
                        const specs = [
                            device.cpu,
                            device.ram,
                            device.ssd,
                            device.gpu,
                            device.screenSize
                        ].filter(Boolean).join(' • ')

                        return (
                            <div
                                key={device.id}
                                onClick={() => setSelectedDeviceId(device.id)}
                                className="bg-card rounded-xl shadow-soft border border-default p-4 cursor-pointer hover:bg-muted transition-colors active:scale-[0.99]"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="font-mono text-sm text-primary font-medium">{device.barcode}</div>
                                        <div className="font-medium text-foreground">{device.brand} {device.model}</div>
                                        <div className="text-xs text-muted-foreground">{device.category.replace('_', ' ')}</div>
                                    </div>
                                    <span className={cn(
                                        'px-2 py-1 rounded-full text-xs font-semibold shrink-0',
                                        statusColors[device.status] || 'bg-secondary text-secondary-foreground'
                                    )}>
                                        {getStatusLabel(device.status)}
                                    </span>
                                </div>
                                {specs && (
                                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{specs}</div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {device.grade && (
                                            <span className={cn(
                                                'px-2 py-0.5 rounded-full text-xs font-bold',
                                                device.grade === 'A'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                                            )}>
                                                Grade {device.grade}
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {device.ownership.replace('_', ' ')}
                                        </span>
                                        {canManageRacks ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setRackAssignDevice(device)
                                                    setAssignError(null)
                                                }}
                                                className={cn(
                                                    'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                                                    device.rack
                                                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                                                )}
                                            >
                                                <MapPin size={10} />
                                                {device.rack?.rackCode || 'No rack'}
                                            </button>
                                        ) : device.rack && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400">
                                                <MapPin size={10} />
                                                {device.rack.rackCode}
                                            </span>
                                        )}
                                    </div>
                                    <History size={14} className="text-muted-foreground" />
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-muted">
                            <tr>
                                <th
                                    className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('barcode')}
                                >
                                    <span className="flex items-center gap-1">
                                        Barcode {getSortIcon('barcode')}
                                    </span>
                                </th>
                                <th
                                    className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('brand')}
                                >
                                    <span className="flex items-center gap-1">
                                        Device {getSortIcon('brand')}
                                    </span>
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">
                                    Specifications
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Grade
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">
                                    Ownership
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Rack
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Stage
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                            {data.devices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Warehouse size={32} className="text-muted-foreground/50" />
                                            <span>No devices found matching your criteria.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.devices.map((device) => {
                                    const specs = [
                                        device.cpu,
                                        device.ram,
                                        device.ssd,
                                        device.gpu,
                                        device.screenSize
                                    ].filter(Boolean).join(' • ')

                                    return (
                                        <tr
                                            key={device.id}
                                            onClick={() => setSelectedDeviceId(device.id)}
                                            className="bg-card hover:bg-muted transition-colors cursor-pointer"
                                        >
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap font-mono text-sm text-primary">
                                                {device.barcode}
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                <div className="font-medium">{device.brand} {device.model}</div>
                                                <div className="text-xs text-muted-foreground">{device.category.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 text-sm text-muted-foreground max-w-xs truncate hidden lg:table-cell">
                                                {specs || '-'}
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                {device.grade ? (
                                                    <span className={cn(
                                                        'px-2 py-1 rounded-full text-xs font-bold',
                                                        device.grade === 'A'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                                                    )}>
                                                        Grade {device.grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                                                {device.ownership.replace('_', ' ')}
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                {canManageRacks ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setRackAssignDevice(device)
                                                            setAssignError(null)
                                                        }}
                                                        className={cn(
                                                            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                                                            device.rack
                                                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-500/30'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500/30'
                                                        )}
                                                    >
                                                        <MapPin size={12} />
                                                        {device.rack?.rackCode || 'Unassigned'}
                                                        <ChevronDown size={12} />
                                                    </button>
                                                ) : (
                                                    <span className={cn(
                                                        'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                                                        device.rack
                                                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400'
                                                            : 'text-muted-foreground'
                                                    )}>
                                                        <MapPin size={12} />
                                                        {device.rack?.rackCode || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        'px-2 py-1 rounded-full text-xs font-semibold',
                                                        statusColors[device.status] || 'bg-secondary text-secondary-foreground'
                                                    )}>
                                                        {getStatusLabel(device.status)}
                                                    </span>
                                                    <History size={14} className="text-muted-foreground" />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination - shown for both mobile and desktop */}
            {data.totalPages > 0 && (
                <div className="bg-card rounded-xl shadow-soft border border-default px-4 py-2">
                    <Pagination
                        currentPage={data.page}
                        totalPages={data.totalPages}
                        totalItems={data.total}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                        onItemsPerPageChange={(count) => {
                            setItemsPerPage(count)
                            setCurrentPage(1)
                        }}
                    />
                </div>
            )}

            {/* Device History Modal */}
            <DeviceHistoryModal
                deviceId={selectedDeviceId}
                onClose={() => setSelectedDeviceId(null)}
            />

            {/* Rack Assignment Modal */}
            {rackAssignDevice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setRackAssignDevice(null)}
                    />
                    <div className="relative bg-card rounded-xl shadow-xl border border-default w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-default">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Assign to Rack</h3>
                                <p className="text-sm text-muted-foreground">
                                    {rackAssignDevice.barcode} - {rackAssignDevice.brand} {rackAssignDevice.model}
                                </p>
                            </div>
                            <button
                                onClick={() => setRackAssignDevice(null)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {assignError && (
                                <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 rounded-lg text-sm">
                                    {assignError}
                                </div>
                            )}

                            {/* Current assignment info */}
                            {rackAssignDevice.rack && (
                                <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">
                                    <p className="text-sm text-cyan-800 dark:text-cyan-400">
                                        Currently in: <span className="font-semibold">{rackAssignDevice.rack.rackCode}</span>
                                        <span className="text-cyan-600 dark:text-cyan-500 ml-1">
                                            ({getRackStageLabel(rackAssignDevice.rack.stage)})
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Remove from rack option */}
                            {rackAssignDevice.rack && (
                                <button
                                    onClick={() => handleRackAssign(null)}
                                    disabled={isAssigning}
                                    className="w-full mb-4 p-3 flex items-center justify-between bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <span className="text-sm font-medium">Remove from rack</span>
                                    {isAssigning && <Loader2 size={16} className="animate-spin" />}
                                </button>
                            )}

                            {/* Rack options - only show racks matching device's workflow stage */}
                            {(() => {
                                const allowedStage = getAllowedRackStage(rackAssignDevice.status)
                                const allowedRacks = allowedStage ? racksByStage[allowedStage] || [] : []

                                if (!allowedStage) {
                                    return (
                                        <div className="text-center py-6 text-muted-foreground">
                                            <p className="text-sm">This device cannot be assigned to a rack in its current status.</p>
                                        </div>
                                    )
                                }

                                if (allowedRacks.length === 0) {
                                    return (
                                        <div className="text-center py-6 text-muted-foreground">
                                            <p className="text-sm">No {getRackStageLabel(allowedStage)} racks available.</p>
                                            <p className="text-xs mt-1">Create racks in Admin → Rack Management.</p>
                                        </div>
                                    )
                                }

                                return (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                                                {getRackStageLabel(allowedStage)} Racks
                                            </h4>
                                            <div className="space-y-1">
                                                {allowedRacks.map((rack) => {
                                                    const isFull = rack._count.devices >= rack.capacity
                                                    const isCurrent = rack.id === rackAssignDevice.rack?.id

                                                    return (
                                                        <button
                                                            key={rack.id}
                                                            onClick={() => handleRackAssign(rack.id)}
                                                            disabled={isAssigning || isFull || isCurrent}
                                                            className={cn(
                                                                'w-full p-3 flex items-center justify-between rounded-lg transition-colors text-left',
                                                                isCurrent
                                                                    ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400 cursor-default'
                                                                    : isFull
                                                                        ? 'bg-gray-100 dark:bg-gray-500/10 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                                        : 'bg-muted hover:bg-accent hover:text-accent-foreground'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <MapPin size={14} />
                                                                <span className="font-medium">{rack.rackCode}</span>
                                                                {isCurrent && (
                                                                    <span className="text-xs bg-cyan-200 dark:bg-cyan-500/30 px-1.5 py-0.5 rounded">
                                                                        Current
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <span className={cn(
                                                                    isFull ? 'text-red-500' : 'text-muted-foreground'
                                                                )}>
                                                                    {rack._count.devices}/{rack.capacity}
                                                                </span>
                                                                {isCurrent && <Check size={14} />}
                                                                {isAssigning && !isCurrent && <Loader2 size={14} className="animate-spin" />}
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
