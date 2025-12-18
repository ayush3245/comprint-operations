'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Warehouse } from 'lucide-react'
import { searchInventory } from '@/lib/actions'
import { FilterPanel, type FilterConfig } from '@/components/ui/FilterPanel'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'

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
}

const filterConfig: FilterConfig[] = [
    {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
            { value: 'LAPTOP', label: 'Laptop' },
            { value: 'DESKTOP', label: 'Desktop' },
            { value: 'WORKSTATION', label: 'Workstation' },
            { value: 'SERVER', label: 'Server' },
            { value: 'MONITOR', label: 'Monitor' },
            { value: 'STORAGE', label: 'Storage' },
            { value: 'NETWORKING_CARD', label: 'Networking Card' }
        ]
    },
    {
        key: 'ownership',
        label: 'Ownership',
        type: 'select',
        options: [
            { value: 'REFURB_STOCK', label: 'Refurb Stock' },
            { value: 'RENTAL_RETURN', label: 'Rental Return' }
        ]
    },
    {
        key: 'status',
        label: 'Stage',
        type: 'select',
        options: [
            { value: 'RECEIVED', label: 'Received' },
            { value: 'PENDING_INSPECTION', label: 'Pending Inspection' },
            { value: 'WAITING_FOR_SPARES', label: 'Waiting for Spares' },
            { value: 'READY_FOR_REPAIR', label: 'Ready for Repair' },
            { value: 'UNDER_REPAIR', label: 'Under Repair' },
            { value: 'IN_PAINT_SHOP', label: 'In Paint Shop' },
            { value: 'AWAITING_QC', label: 'Awaiting QC' },
            { value: 'READY_FOR_STOCK', label: 'Ready for Dispatch' }
        ]
    },
    {
        key: 'grade',
        label: 'Grade',
        type: 'select',
        options: [
            { value: 'A', label: 'Grade A' },
            { value: 'B', label: 'Grade B' }
        ]
    }
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

export default function InventoryClient({ initialData }: Props) {
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<InventoryData>(initialData)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [sortBy, setSortBy] = useState<SortField>('updatedAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(25)

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

            {/* Filters */}
            <FilterPanel
                filters={filterConfig}
                values={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
            />

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Found <span className="font-medium text-foreground">{data.total}</span> devices
                </p>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-muted">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('barcode')}
                                >
                                    <span className="flex items-center gap-1">
                                        Barcode {getSortIcon('barcode')}
                                    </span>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('brand')}
                                >
                                    <span className="flex items-center gap-1">
                                        Device {getSortIcon('brand')}
                                    </span>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Specifications
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Grade
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Ownership
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Stage
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                            {data.devices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
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
                                        <tr key={device.id} className="bg-card hover:bg-muted transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-primary">
                                                {device.barcode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                <div className="font-medium">{device.brand} {device.model}</div>
                                                <div className="text-xs text-muted-foreground">{device.category.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                                                {specs || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {device.ownership.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn(
                                                    'px-2 py-1 rounded-full text-xs font-semibold',
                                                    statusColors[device.status] || 'bg-secondary text-secondary-foreground'
                                                )}>
                                                    {getStatusLabel(device.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data.totalPages > 0 && (
                    <div className="border-t border-default px-4">
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
            </div>
        </div>
    )
}
