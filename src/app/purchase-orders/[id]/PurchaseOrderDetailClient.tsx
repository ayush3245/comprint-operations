'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { createInwardBatchFromPO, deletePurchaseOrder } from '@/lib/actions'
import { formatDate } from '@/lib/utils'
import {
    FileText,
    Package,
    Truck,
    User,
    Upload,
    Loader2,
    Trash2,
    AlertTriangle,
    CheckCircle,
    ExternalLink
} from 'lucide-react'

interface PurchaseOrderDetailClientProps {
    purchaseOrder: {
        id: string
        poNumber: string
        supplierCode: string
        supplierName: string | null
        expectedDevices: number
        pdfUrl: string | null
        isAddressed: boolean
        createdAt: Date
        createdBy: { name: string }
        expectedItems: {
            id: string
            category: string
            brand: string
            model: string
            serial: string | null
            quantity: number
        }[]
        inwardBatch: {
            batchId: string
            _count: { devices: number }
        } | null
    }
    availableRackCapacity: number
}

export default function PurchaseOrderDetailClient({
    purchaseOrder,
    availableRackCapacity
}: PurchaseOrderDetailClientProps) {
    const router = useRouter()
    const toast = useToast()
    const [showCreateBatch, setShowCreateBatch] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deliveryChallanUrl, setDeliveryChallanUrl] = useState<string | null>(null)
    const [deliveryChallanName, setDeliveryChallanName] = useState<string | null>(null)

    const insufficientCapacity = availableRackCapacity < purchaseOrder.expectedDevices

    async function handleChallanUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only images and PDF files are allowed')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'delivery-challans')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed')
            }

            setDeliveryChallanUrl(result.url)
            setDeliveryChallanName(file.name)
            toast.success('Delivery challan uploaded successfully')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to upload')
        } finally {
            setUploading(false)
        }
    }

    async function handleCreateBatch(formData: FormData) {
        if (!deliveryChallanUrl) {
            toast.error('Please upload the delivery challan')
            return
        }

        if (insufficientCapacity) {
            toast.error(`Insufficient rack capacity. Available: ${availableRackCapacity}, Required: ${purchaseOrder.expectedDevices}`)
            return
        }

        setLoading(true)
        try {
            const data = {
                purchaseOrderId: purchaseOrder.id,
                vehicleNumber: formData.get('vehicleNumber') as string,
                driverName: formData.get('driverName') as string,
                deliveryChallanUrl: deliveryChallanUrl
            }

            if (!data.vehicleNumber || !data.driverName) {
                toast.error('Vehicle number and driver name are required')
                return
            }

            const batch = await createInwardBatchFromPO(data)
            toast.success('Inward batch created successfully!')
            router.push(`/inward/${batch.batchId}`)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to create batch')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this Purchase Order? This cannot be undone.')) {
            return
        }

        setDeleting(true)
        try {
            await deletePurchaseOrder(purchaseOrder.id)
            toast.success('Purchase Order deleted')
            router.push('/purchase-orders')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">{purchaseOrder.poNumber}</h1>
                        {purchaseOrder.isAddressed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle size={12} />
                                Addressed
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Pending
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Created by {purchaseOrder.createdBy.name} on {formatDate(purchaseOrder.createdAt)}
                    </p>
                </div>
                {!purchaseOrder.isAddressed && (
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors"
                    >
                        {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        Delete PO
                    </button>
                )}
            </div>

            {/* PO Details */}
            <div className="bg-card p-6 rounded-xl shadow-soft border border-default mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Purchase Order Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Supplier Code</p>
                        <p className="text-sm font-medium text-foreground mt-1">{purchaseOrder.supplierCode}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Supplier Name</p>
                        <p className="text-sm font-medium text-foreground mt-1">{purchaseOrder.supplierName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Expected Devices</p>
                        <p className="text-sm font-medium text-foreground mt-1">{purchaseOrder.expectedDevices}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">PO Document</p>
                        {purchaseOrder.pdfUrl ? (
                            <a
                                href={purchaseOrder.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-1"
                            >
                                <FileText size={14} />
                                View PDF
                                <ExternalLink size={12} />
                            </a>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-1">Not uploaded</p>
                        )}
                    </div>
                </div>

                {purchaseOrder.inwardBatch && (
                    <div className="mt-4 pt-4 border-t border-default">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Linked Batch</p>
                        <Link
                            href={`/inward/${purchaseOrder.inwardBatch.batchId}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mt-1"
                        >
                            <Package size={14} />
                            {purchaseOrder.inwardBatch.batchId}
                            <span className="text-muted-foreground">
                                ({purchaseOrder.inwardBatch._count.devices} devices)
                            </span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Expected Items */}
            <div className="bg-card p-6 rounded-xl shadow-soft border border-default mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Expected Items</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serial</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {purchaseOrder.expectedItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                        {item.category.replace('_', ' ')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground font-medium">{item.brand}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{item.model}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground font-mono">
                                        {item.serial || '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground font-bold">{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Inward Batch */}
            {!purchaseOrder.isAddressed && (
                <div className="bg-card p-6 rounded-xl shadow-soft border border-default">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Create Inward Batch</h2>
                        {!showCreateBatch && (
                            <button
                                onClick={() => setShowCreateBatch(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Receive Shipment
                            </button>
                        )}
                    </div>

                    {/* Rack Capacity Warning */}
                    {insufficientCapacity && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                            <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Insufficient Rack Capacity
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Available capacity: {availableRackCapacity} | Required: {purchaseOrder.expectedDevices}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    Please add more racks to the Received stage before proceeding.
                                </p>
                            </div>
                        </div>
                    )}

                    {showCreateBatch && (
                        <form action={handleCreateBatch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        <div className="flex items-center gap-2">
                                            <Truck size={16} />
                                            Vehicle Number <span className="text-red-500">*</span>
                                        </div>
                                    </label>
                                    <input
                                        type="text"
                                        name="vehicleNumber"
                                        required
                                        placeholder="e.g., MH12AB1234"
                                        className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        <div className="flex items-center gap-2">
                                            <User size={16} />
                                            Driver Name <span className="text-red-500">*</span>
                                        </div>
                                    </label>
                                    <input
                                        type="text"
                                        name="driverName"
                                        required
                                        placeholder="Driver's full name"
                                        className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Delivery Challan <span className="text-red-500">*</span>
                                </label>
                                {deliveryChallanUrl ? (
                                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-input">
                                        <FileText className="text-indigo-500" size={24} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground">{deliveryChallanName}</p>
                                            <p className="text-xs text-muted-foreground">Uploaded successfully</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeliveryChallanUrl(null)
                                                setDeliveryChallanName(null)
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
                                                {uploading ? 'Uploading...' : 'Upload delivery challan (Image or PDF)'}
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,application/pdf"
                                            onChange={handleChallanUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateBatch(false)}
                                    className="px-4 py-2 bg-muted border border-input rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || insufficientCapacity || !deliveryChallanUrl}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={16} />}
                                    {loading ? 'Creating...' : 'Create Inward Batch'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    )
}
