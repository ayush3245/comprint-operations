'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSparePart, updateSparePart, deleteSparePart, adjustSpareStock } from '@/lib/actions'
import { SparePart } from '@prisma/client'
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'

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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Spare Parts Inventory</h1>
                <button
                    onClick={() => {
                        setEditingPart(null)
                        setShowForm(!showForm)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Spare Part
                </button>
            </div>

            {/* Low Stock Alert */}
            {lowStockParts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                        <AlertTriangle size={20} />
                        Low Stock Alert ({lowStockParts.length} items)
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {lowStockParts.map(part => (
                            <span key={part.id} className="px-2 py-1 bg-yellow-100 rounded text-sm text-yellow-800">
                                {part.partCode}: {part.currentStock}/{part.minStock}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
                    </h2>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Part Code *</label>
                                <input
                                    type="text"
                                    name="partCode"
                                    required
                                    defaultValue={editingPart?.partCode || ''}
                                    placeholder="e.g., KB-DELL-001"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    name="category"
                                    required
                                    defaultValue={editingPart?.category || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <input
                                type="text"
                                name="description"
                                required
                                defaultValue={editingPart?.description || ''}
                                placeholder="e.g., Dell Latitude 5520 Keyboard US Layout"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Compatible Models</label>
                            <input
                                type="text"
                                name="compatibleModels"
                                defaultValue={editingPart?.compatibleModels || ''}
                                placeholder="e.g., Latitude 5520, 5530, 5540"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                                <input
                                    type="number"
                                    name="currentStock"
                                    min="0"
                                    defaultValue={editingPart?.currentStock || 0}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                                <input
                                    type="number"
                                    name="minStock"
                                    min="0"
                                    defaultValue={editingPart?.minStock || 0}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
                                <input
                                    type="number"
                                    name="maxStock"
                                    min="0"
                                    defaultValue={editingPart?.maxStock || 100}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bin Location</label>
                                <input
                                    type="text"
                                    name="binLocation"
                                    defaultValue={editingPart?.binLocation || ''}
                                    placeholder="e.g., A1-03"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : editingPart ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {showAdjustStock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Adjust Stock - {showAdjustStock.partCode}</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Current stock: <strong>{showAdjustStock.currentStock}</strong>
                        </p>
                        <form action={handleAdjustStock} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Adjustment (+ to add, - to remove)
                                </label>
                                <input
                                    type="number"
                                    name="adjustment"
                                    required
                                    placeholder="e.g., +10 or -5"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <select
                                    name="reason"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Apply'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Spare Parts Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {spareParts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No spare parts in inventory. Add your first spare part.
                                    </td>
                                </tr>
                            ) : (
                                spareParts.map(part => {
                                    const isLowStock = part.currentStock <= part.minStock
                                    return (
                                        <tr key={part.id} className={isLowStock ? 'bg-yellow-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600 font-semibold">
                                                {part.partCode}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div>{part.description}</div>
                                                {part.compatibleModels && (
                                                    <div className="text-xs text-gray-500">
                                                        Compatible: {part.compatibleModels}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                                    {part.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {part.currentStock}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        / {part.maxStock}
                                                    </span>
                                                    {isLowStock && (
                                                        <AlertTriangle size={14} className="text-yellow-500" />
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Min: {part.minStock}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {part.binLocation || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setShowAdjustStock(part)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                                        title="Adjust Stock"
                                                    >
                                                        <Package size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(part)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(part.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
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
