'use client'

import { useState, useTransition } from 'react'
import { Package, Plus, Loader2, AlertCircle, CheckCircle, MapPin, Trash2, Edit2, Layers } from 'lucide-react'
import { createRack, updateRack, deleteRack, initializeDefaultRacks } from '@/lib/actions'
import { type RackStage } from '@prisma/client'
import { cn } from '@/lib/utils'

type Rack = {
    id: string
    rackCode: string
    stage: string
    capacity: number
    location: string | null
    isActive: boolean
    _count: { devices: number }
}

type RackStats = Record<string, { total: number; used: number; capacity: number }>

interface Props {
    initialRacks: Rack[]
    initialStats: RackStats
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    RECEIVED: { label: 'Received', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-500/20' },
    WAITING_FOR_REPAIR: { label: 'Waiting for Repair', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-500/20' },
    UNDER_REPAIR: { label: 'Under Repair', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-500/20' },
    AWAITING_QC: { label: 'Awaiting QC', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-500/20' },
    READY_FOR_DISPATCH: { label: 'Ready for Dispatch', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/20' }
}

export default function RacksClient({ initialRacks, initialStats }: Props) {
    const [isPending, startTransition] = useTransition()
    const [racks, setRacks] = useState(initialRacks)
    const [stats, setStats] = useState(initialStats)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingRack, setEditingRack] = useState<Rack | null>(null)
    const [newRackStage, setNewRackStage] = useState<string>('RECEIVED')
    const [newRackLocation, setNewRackLocation] = useState('')
    const [newRackCapacity, setNewRackCapacity] = useState(10)

    const handleInitialize = () => {
        startTransition(async () => {
            try {
                const result = await initializeDefaultRacks()
                setMessage({ type: 'success', text: `Created ${result.createdCount} default racks` })
                window.location.reload()
            } catch (error) {
                setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to initialize racks' })
            }
        })
    }

    const handleCreateRack = () => {
        startTransition(async () => {
            try {
                await createRack({
                    stage: newRackStage as RackStage,
                    location: newRackLocation || undefined,
                    capacity: newRackCapacity
                })
                setMessage({ type: 'success', text: 'Rack created successfully' })
                setShowAddModal(false)
                setNewRackLocation('')
                setNewRackCapacity(10)
                window.location.reload()
            } catch (error) {
                setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create rack' })
            }
        })
    }

    const handleUpdateRack = () => {
        if (!editingRack) return
        startTransition(async () => {
            try {
                await updateRack(editingRack.id, {
                    location: editingRack.location || undefined,
                    capacity: editingRack.capacity,
                    isActive: editingRack.isActive
                })
                setMessage({ type: 'success', text: 'Rack updated successfully' })
                setEditingRack(null)
                window.location.reload()
            } catch (error) {
                setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update rack' })
            }
        })
    }

    const handleDeleteRack = (rack: Rack) => {
        if (!confirm(`Are you sure you want to delete rack ${rack.rackCode}?`)) return
        startTransition(async () => {
            try {
                await deleteRack(rack.id)
                setMessage({ type: 'success', text: 'Rack deleted successfully' })
                window.location.reload()
            } catch (error) {
                setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete rack' })
            }
        })
    }

    // Group racks by stage
    const racksByStage = Object.keys(STAGE_CONFIG).reduce((acc, stage) => {
        acc[stage] = racks.filter(r => r.stage === stage)
        return acc
    }, {} as Record<string, Rack[]>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Rack Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage device storage racks by stage</p>
                </div>
                <div className="flex gap-2">
                    {racks.length === 0 && (
                        <button
                            onClick={handleInitialize}
                            disabled={isPending}
                            className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />}
                            Initialize Default Racks
                        </button>
                    )}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 transition-all duration-200 font-medium text-sm"
                    >
                        <Plus size={18} />
                        Add Rack
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={cn(
                    'p-3 rounded-lg flex items-center gap-2 text-sm',
                    message.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                )}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto text-current hover:opacity-70">
                        &times;
                    </button>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
                    const stageStats = stats[stage] || { total: 0, used: 0, capacity: 0 }
                    const utilization = stageStats.capacity > 0 ? Math.round((stageStats.used / stageStats.capacity) * 100) : 0

                    return (
                        <div key={stage} className="bg-card rounded-xl shadow-soft border border-default p-4">
                            <div className={cn('text-xs font-medium mb-1', config.color)}>{config.label}</div>
                            <div className="text-2xl font-bold text-foreground">{stageStats.used}</div>
                            <div className="text-xs text-muted-foreground">of {stageStats.capacity} capacity</div>
                            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all', config.bgColor.replace('bg-', 'bg-'))}
                                    style={{ width: `${utilization}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Racks by Stage */}
            {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
                const stageRacks = racksByStage[stage] || []

                return (
                    <div key={stage} className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                        <div className={cn('px-4 py-3 border-b border-default', config.bgColor)}>
                            <h2 className={cn('font-semibold', config.color)}>{config.label}</h2>
                        </div>
                        <div className="p-4">
                            {stageRacks.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No racks in this stage</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {stageRacks.map(rack => (
                                        <div
                                            key={rack.id}
                                            className={cn(
                                                'relative p-3 rounded-lg border transition-colors',
                                                rack.isActive
                                                    ? 'border-default bg-background hover:bg-muted'
                                                    : 'border-dashed border-muted-foreground/30 bg-muted/50 opacity-60'
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="font-mono text-sm font-medium text-primary">{rack.rackCode}</div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setEditingRack(rack)}
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                    >
                                                        <Edit2 size={12} className="text-muted-foreground" />
                                                    </button>
                                                    {rack._count.devices === 0 && (
                                                        <button
                                                            onClick={() => handleDeleteRack(rack)}
                                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors"
                                                        >
                                                            <Trash2 size={12} className="text-red-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                <Package size={12} />
                                                <span>{rack._count.devices} / {rack.capacity}</span>
                                            </div>
                                            {rack.location && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin size={12} />
                                                    <span className="truncate">{rack.location}</span>
                                                </div>
                                            )}
                                            {/* Capacity bar */}
                                            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full transition-all',
                                                        rack._count.devices >= rack.capacity
                                                            ? 'bg-red-500'
                                                            : rack._count.devices >= rack.capacity * 0.8
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                    )}
                                                    style={{ width: `${(rack._count.devices / rack.capacity) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}

            {/* Add Rack Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-card rounded-xl shadow-2xl border border-default w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Add New Rack</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Stage</label>
                                <select
                                    value={newRackStage}
                                    onChange={(e) => setNewRackStage(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {Object.entries(STAGE_CONFIG).map(([stage, config]) => (
                                        <option key={stage} value={stage}>{config.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Location (optional)</label>
                                <input
                                    type="text"
                                    value={newRackLocation}
                                    onChange={(e) => setNewRackLocation(e.target.value)}
                                    placeholder="e.g., Aisle A, Shelf 2"
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Capacity</label>
                                <input
                                    type="number"
                                    value={newRackCapacity}
                                    onChange={(e) => setNewRackCapacity(parseInt(e.target.value) || 10)}
                                    min={1}
                                    max={50}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-input rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRack}
                                disabled={isPending}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending && <Loader2 size={16} className="animate-spin" />}
                                Create Rack
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Rack Modal */}
            {editingRack && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={() => setEditingRack(null)} />
                    <div className="relative bg-card rounded-xl shadow-2xl border border-default w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Edit Rack {editingRack.rackCode}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                                <input
                                    type="text"
                                    value={editingRack.location || ''}
                                    onChange={(e) => setEditingRack({ ...editingRack, location: e.target.value })}
                                    placeholder="e.g., Aisle A, Shelf 2"
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Capacity</label>
                                <input
                                    type="number"
                                    value={editingRack.capacity}
                                    onChange={(e) => setEditingRack({ ...editingRack, capacity: parseInt(e.target.value) || 10 })}
                                    min={editingRack._count.devices}
                                    max={50}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {editingRack._count.devices > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Minimum capacity: {editingRack._count.devices} (current devices)
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editingRack.isActive}
                                    onChange={(e) => setEditingRack({ ...editingRack, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-input"
                                />
                                <label htmlFor="isActive" className="text-sm text-foreground">Active</label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingRack(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-input rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateRack}
                                disabled={isPending}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending && <Loader2 size={16} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
