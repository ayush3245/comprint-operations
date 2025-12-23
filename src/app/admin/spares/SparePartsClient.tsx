'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSparePart, updateSparePart, deleteSparePart, adjustSpareStock } from '@/lib/actions'
import { SparePart } from '@prisma/client'
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'

interface SparePartsClientProps {
    spareParts: SparePart[]
}

export default function SparePartsClient({ spareParts }: SparePartsClientProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [editingPart, setEditingPart] = useState<SparePart | null>(null)
    const [showAdjustStock, setShowAdjustStock] = useState<SparePart | null>(null)
    const [loading, setLoading] = useState(false)

    const lowStockParts = spareParts.filter(part => part.currentStock <= part.minStock)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const data = {
                partCode: formData.get('partCode') as string,
                description: formData.get('description') as string,
                category: formData.get('category') as string,
                compatibleModels: formData.get('compatibleModels') as string || undefined,
                minStock: parseInt(formData.get('minStock') as string) || 0,
                maxStock: parseInt(formData.get('maxStock') as string) || 100,
                currentStock: parseInt(formData.get('currentStock') as string) || 0,
                binLocation: formData.get('binLocation') as string || undefined
            }

            if (editingPart) {
                await updateSparePart(editingPart.id, data)
            } else {
                await createSparePart(data)
            }

            setShowForm(false)
            setEditingPart(null)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert(error instanceof Error ? error.message : 'Failed to save spare part')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this spare part?')) return

        try {
            await deleteSparePart(id)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Failed to delete spare part')
        }
    }

    async function handleAdjustStock(formData: FormData) {
        if (!showAdjustStock) return

        setLoading(true)
        try {
            const adjustment = parseInt(formData.get('adjustment') as string)
            const reason = formData.get('reason') as string

            await adjustSpareStock(showAdjustStock.id, adjustment, reason)
            setShowAdjustStock(null)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert(error instanceof Error ? error.message : 'Failed to adjust stock')
        } finally {
            setLoading(false)
        }
    }

    function openEdit(part: SparePart) {
        setEditingPart(part)
        setShowForm(true)
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Spare Parts Inventory</h1>
                <button
                    onClick={() => {
                        setEditingPart(null)
                        setShowForm(!showForm)
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                    <Plus size={18} />
                    Add Spare Part
                </button>
            </div>

            {/* Low Stock Alert */}
            {lowStockParts.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300 font-semibold mb-2">
                        <AlertTriangle size={20} />
                        Low Stock Alert ({lowStockParts.length} items)
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {lowStockParts.map(part => (
                            <span key={part.id} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-500/20 rounded text-sm text-yellow-800 dark:text-yellow-300">
                                {part.partCode}: {part.currentStock}/{part.minStock}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-card rounded-xl shadow-soft border border-default p-6 mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
                    </h2>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Part Code *</label>
                                <input
                                    type="text"
                                    name="partCode"
                                    required
                                    defaultValue={editingPart?.partCode || ''}
                                    placeholder="e.g., KB-DELL-001"
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
                                <select
                                    name="category"
                                    required
                                    defaultValue={editingPart?.category || ''}
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                >
                                    <option value="">Select Category</option>
                                    <option value="Keyboard">Keyboard</option>
                                    <option value="Screen">Screen/Display</option>
                                    <option value="Battery">Battery</option>
                                    <option value="Adapter">Power Adapter</option>
                                    <option value="RAM">RAM</option>
                                    <option value="SSD">SSD/Storage</option>
                                    <option value="Fan">Cooling Fan</option>
                                    <option value="Motherboard">Motherboard</option>
                                    <option value="Cover">Panel/Cover</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Description *</label>
                            <input
                                type="text"
                                name="description"
                                required
                                defaultValue={editingPart?.description || ''}
                                placeholder="e.g., Dell Latitude 5520 Keyboard US Layout"
                                className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Compatible Models</label>
                            <input
                                type="text"
                                name="compatibleModels"
                                defaultValue={editingPart?.compatibleModels || ''}
                                placeholder="e.g., Latitude 5520, 5530, 5540"
                                className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Current Stock</label>
                                <input
                                    type="number"
                                    name="currentStock"
                                    min="0"
                                    defaultValue={editingPart?.currentStock || 0}
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Min Stock</label>
                                <input
                                    type="number"
                                    name="minStock"
                                    min="0"
                                    defaultValue={editingPart?.minStock || 0}
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Max Stock</label>
                                <input
                                    type="number"
                                    name="maxStock"
                                    min="0"
                                    defaultValue={editingPart?.maxStock || 100}
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Bin Location</label>
                                <input
                                    type="text"
                                    name="binLocation"
                                    defaultValue={editingPart?.binLocation || ''}
                                    placeholder="e.g., A1-03"
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false)
                                    setEditingPart(null)
                                }}
                                className="px-4 py-2 bg-muted border border-input rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Saving...' : editingPart ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {showAdjustStock && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md border border-default">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Adjust Stock - {showAdjustStock.partCode}</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Current stock: <strong className="text-foreground">{showAdjustStock.currentStock}</strong>
                        </p>
                        <form action={handleAdjustStock} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Adjustment (+ to add, - to remove)
                                </label>
                                <input
                                    type="number"
                                    name="adjustment"
                                    required
                                    placeholder="e.g., +10 or -5"
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Reason</label>
                                <select
                                    name="reason"
                                    required
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                >
                                    <option value="">Select reason</option>
                                    <option value="Stock received">Stock received</option>
                                    <option value="Issued to repair">Issued to repair</option>
                                    <option value="Return from repair">Return from repair</option>
                                    <option value="Stock correction">Stock correction</option>
                                    <option value="Damaged/Defective">Damaged/Defective</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustStock(null)}
                                    className="px-4 py-2 bg-muted border border-input rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Updating...' : 'Apply'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Spare Parts Table */}
            <div className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    {spareParts.length === 0 ? (
                        <div className="px-4 py-10 text-center text-muted-foreground">
                            No spare parts in inventory. Add your first spare part.
                        </div>
                    ) : (
                        spareParts.map(part => {
                            const isLowStock = part.currentStock <= part.minStock
                            return (
                                <div key={part.id} className={`p-4 space-y-3 ${isLowStock ? 'bg-yellow-50 dark:bg-yellow-500/10' : ''}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                                {part.partCode}
                                            </span>
                                            <span className="ml-2 px-2 py-0.5 bg-muted rounded text-xs text-foreground">
                                                {part.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <IconButton
                                                icon={<Package size={16} />}
                                                variant="success"
                                                size="sm"
                                                onClick={() => setShowAdjustStock(part)}
                                                title="Adjust Stock"
                                            />
                                            <IconButton
                                                icon={<Pencil size={16} />}
                                                variant="primary"
                                                size="sm"
                                                onClick={() => openEdit(part)}
                                                title="Edit Part"
                                            />
                                            <IconButton
                                                icon={<Trash2 size={16} />}
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(part.id)}
                                                title="Delete Part"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground">{part.description}</p>
                                    {part.compatibleModels && (
                                        <p className="text-xs text-muted-foreground">Compatible: {part.compatibleModels}</p>
                                    )}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                                Stock: {part.currentStock}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                (min: {part.minStock}, max: {part.maxStock})
                                            </span>
                                            {isLowStock && <AlertTriangle size={14} className="text-yellow-500" />}
                                        </div>
                                        {part.binLocation && (
                                            <span className="text-xs text-muted-foreground">📍 {part.binLocation}</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Part Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                            {spareParts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                                        No spare parts in inventory. Add your first spare part.
                                    </td>
                                </tr>
                            ) : (
                                spareParts.map(part => {
                                    const isLowStock = part.currentStock <= part.minStock
                                    return (
                                        <tr key={part.id} className={isLowStock ? 'bg-yellow-50 dark:bg-yellow-500/10 hover:bg-yellow-100 dark:hover:bg-yellow-500/20' : 'bg-card hover:bg-muted'} style={{ transition: 'background-color 150ms' }}>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                                {part.partCode}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                <div>{part.description}</div>
                                                {part.compatibleModels && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Compatible: {part.compatibleModels}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-muted rounded text-xs text-foreground">
                                                    {part.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                                        {part.currentStock}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        / {part.maxStock}
                                                    </span>
                                                    {isLowStock && (
                                                        <AlertTriangle size={14} className="text-yellow-500" />
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Min: {part.minStock}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {part.binLocation || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <IconButton
                                                        icon={<Package size={18} />}
                                                        variant="success"
                                                        onClick={() => setShowAdjustStock(part)}
                                                        title="Adjust Stock"
                                                    />
                                                    <IconButton
                                                        icon={<Pencil size={18} />}
                                                        variant="primary"
                                                        onClick={() => openEdit(part)}
                                                        title="Edit"
                                                    />
                                                    <IconButton
                                                        icon={<Trash2 size={18} />}
                                                        variant="danger"
                                                        onClick={() => handleDelete(part.id)}
                                                        title="Delete"
                                                    />
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
        </div>
    )
}
