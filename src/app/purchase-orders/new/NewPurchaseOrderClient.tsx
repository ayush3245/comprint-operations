'use client'

import { createPurchaseOrder } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DeviceCategory } from '@prisma/client'
import { useToast } from '@/components/ui/Toast'
import { Plus, Trash2, Upload, FileText, Loader2 } from 'lucide-react'

interface ExpectedItem {
    category: DeviceCategory
    brand: string
    model: string
    serial?: string
    quantity: number
}

const CATEGORIES = Object.values(DeviceCategory)

export default function NewPurchaseOrderClient() {
    const router = useRouter()
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [pdfFileName, setPdfFileName] = useState<string | null>(null)
    const [expectedItems, setExpectedItems] = useState<ExpectedItem[]>([
        { category: 'LAPTOP', brand: '', model: '', quantity: 1 }
    ])

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'purchase-orders')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed')
            }

            setPdfUrl(result.url)
            setPdfFileName(file.name)
            toast.success('PDF uploaded successfully')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to upload PDF')
        } finally {
            setUploading(false)
        }
    }

    function addItem() {
        setExpectedItems([...expectedItems, { category: 'LAPTOP', brand: '', model: '', quantity: 1 }])
    }

    function removeItem(index: number) {
        if (expectedItems.length > 1) {
            setExpectedItems(expectedItems.filter((_, i) => i !== index))
        }
    }

    function updateItem(index: number, field: keyof ExpectedItem, value: string | number) {
        const updated = [...expectedItems]
        if (field === 'quantity') {
            updated[index][field] = typeof value === 'string' ? parseInt(value) || 1 : value
        } else if (field === 'category') {
            updated[index][field] = value as DeviceCategory
        } else {
            updated[index][field] = value as string
        }
        setExpectedItems(updated)
    }

    const totalDevices = expectedItems.reduce((sum, item) => sum + item.quantity, 0)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const data = {
                poNumber: formData.get('poNumber') as string,
                supplierCode: formData.get('supplierCode') as string,
                supplierName: (formData.get('supplierName') as string) || undefined,
                expectedDevices: totalDevices,
                pdfUrl: pdfUrl || undefined,
                expectedItems: expectedItems.filter(item => item.brand && item.model)
            }

            if (!data.poNumber || !data.supplierCode) {
                toast.error('PO Number and Supplier Code are required')
                return
            }

            if (data.expectedItems.length === 0) {
                toast.error('At least one expected item with brand and model is required')
                return
            }

            const po = await createPurchaseOrder(data)
            toast.success('Purchase Order created successfully!')
            router.push(`/purchase-orders/${po.id}`)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to create Purchase Order')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Create New Purchase Order</h1>

            <form action={handleSubmit}>
                {/* Basic Info */}
                <div className="bg-card p-6 rounded-xl shadow-soft border border-default mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                PO Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="poNumber"
                                required
                                placeholder="e.g., PO-2024-001"
                                className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Supplier Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="supplierCode"
                                required
                                placeholder="e.g., SUP-001"
                                className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Supplier Name (Optional)
                            </label>
                            <input
                                type="text"
                                name="supplierName"
                                placeholder="e.g., ABC Electronics Pvt Ltd"
                                className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* PDF Upload */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            PO Document (PDF)
                        </label>
                        {pdfUrl ? (
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-input">
                                <FileText className="text-indigo-500" size={24} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{pdfFileName}</p>
                                    <p className="text-xs text-muted-foreground">Uploaded successfully</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPdfUrl(null)
                                        setPdfFileName(null)
                                    }}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted hover:bg-muted/70 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {uploading ? (
                                        <Loader2 className="animate-spin text-muted-foreground mb-2" size={24} />
                                    ) : (
                                        <Upload className="text-muted-foreground mb-2" size={24} />
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        {uploading ? 'Uploading...' : 'Click to upload PO PDF'}
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Expected Items */}
                <div className="bg-card p-6 rounded-xl shadow-soft border border-default mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Expected Items</h2>
                            <p className="text-sm text-muted-foreground">Total devices: {totalDevices}</p>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors text-sm font-medium"
                        >
                            <Plus size={16} />
                            Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {expectedItems.map((item, index) => (
                            <div key={index} className="p-4 bg-muted rounded-lg border border-input">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-foreground">Item {index + 1}</span>
                                    {expectedItems.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                                        <select
                                            value={item.category}
                                            onChange={(e) => updateItem(index, 'category', e.target.value)}
                                            className="w-full px-2 py-1.5 bg-card border border-input rounded-lg text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Brand *</label>
                                        <input
                                            type="text"
                                            value={item.brand}
                                            onChange={(e) => updateItem(index, 'brand', e.target.value)}
                                            placeholder="HP, Dell..."
                                            className="w-full px-2 py-1.5 bg-card border border-input rounded-lg text-foreground placeholder-muted-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Model *</label>
                                        <input
                                            type="text"
                                            value={item.model}
                                            onChange={(e) => updateItem(index, 'model', e.target.value)}
                                            placeholder="Latitude 5520"
                                            className="w-full px-2 py-1.5 bg-card border border-input rounded-lg text-foreground placeholder-muted-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Serial (opt)</label>
                                        <input
                                            type="text"
                                            value={item.serial || ''}
                                            onChange={(e) => updateItem(index, 'serial', e.target.value)}
                                            placeholder="ABC123..."
                                            className="w-full px-2 py-1.5 bg-card border border-input rounded-lg text-foreground placeholder-muted-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            className="w-full px-2 py-1.5 bg-card border border-input rounded-lg text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-muted border border-input rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        {loading ? 'Creating...' : 'Create Purchase Order'}
                    </button>
                </div>
            </form>
        </div>
    )
}
