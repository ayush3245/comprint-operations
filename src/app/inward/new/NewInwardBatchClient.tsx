'use client'

import { createInwardBatch, createInwardBatchFromPO } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { InwardType } from '@prisma/client'
import { useToast } from '@/components/ui/Toast'

interface PurchaseOrderOption {
    id: string
    poNumber: string
    supplierCode: string
    supplierName: string | null
    expectedDevices: number
    createdAt: Date
}

interface NewInwardBatchClientProps {
    purchaseOrders: PurchaseOrderOption[]
}

export default function NewInwardBatchClient({ purchaseOrders }: NewInwardBatchClientProps) {
    const router = useRouter()
    const toast = useToast()
    const [type, setType] = useState<InwardType>('REFURB_PURCHASE')
    const [loading, setLoading] = useState(false)
    const [selectedPOId, setSelectedPOId] = useState<string>('')
    const [challanFile, setChallanFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function uploadChallan(file: File): Promise<string> {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'delivery-challans')

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Failed to upload challan')
        }

        return data.url
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            if (type === 'REFURB_PURCHASE') {
                // Validate required fields for REFURB_PURCHASE
                if (!selectedPOId) {
                    throw new Error('Please select a Purchase Order')
                }
                const vehicleNumber = formData.get('vehicleNumber') as string
                const driverName = formData.get('driverName') as string

                if (!vehicleNumber?.trim()) {
                    throw new Error('Vehicle Number is required')
                }
                if (!driverName?.trim()) {
                    throw new Error('Driver Name is required')
                }
                if (!challanFile) {
                    throw new Error('Delivery Challan is required')
                }

                // Upload challan first
                setUploading(true)
                const challanUrl = await uploadChallan(challanFile)
                setUploading(false)

                // Create batch from PO
                const batch = await createInwardBatchFromPO({
                    purchaseOrderId: selectedPOId,
                    vehicleNumber: vehicleNumber.trim(),
                    driverName: driverName.trim(),
                    deliveryChallanUrl: challanUrl,
                    date: formData.get('date') as string
                })
                toast.success(`Batch created successfully! Now add devices.`)
                router.push(`/inward/${batch.batchId}`)
            } else {
                // RENTAL_RETURN - use existing flow
                const data = {
                    type,
                    date: formData.get('date') as string,
                    poInvoiceNo: '',
                    supplier: '',
                    customer: formData.get('customer') as string,
                    rentalRef: formData.get('rentalRef') as string,
                    emailSubject: formData.get('emailSubject') as string,
                    createdById: 'placeholder'
                }

                const batch = await createInwardBatch(data)
                toast.success(`Batch created successfully! Now add devices.`)
                router.push(`/inward/${batch.batchId}`)
            }
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to create batch')
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type (images and PDFs)
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
            if (!allowedTypes.includes(file.type)) {
                toast.error('Please upload an image (JPEG, PNG, GIF, WebP) or PDF file')
                return
            }
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB')
                return
            }
            setChallanFile(file)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Create New Inward Batch</h1>

            <div className="bg-card p-6 rounded-xl shadow-soft border border-default">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">Inward Type</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setType('REFURB_PURCHASE')
                                setSelectedPOId('')
                                setChallanFile(null)
                            }}
                            className={`px-4 py-2 rounded-lg border transition-colors ${type === 'REFURB_PURCHASE'
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-400 dark:text-indigo-300'
                                : 'bg-card border-input text-foreground hover:bg-muted'
                                }`}
                        >
                            Refurb Purchase
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('RENTAL_RETURN')}
                            className={`px-4 py-2 rounded-lg border transition-colors ${type === 'RENTAL_RETURN'
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-400 dark:text-indigo-300'
                                : 'bg-card border-input text-foreground hover:bg-muted'
                                }`}
                        >
                            Rental Return
                        </button>
                    </div>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    {/* Receipt Date Field */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Receipt Date
                        </label>
                        <input
                            type="date"
                            name="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                        />
                    </div>

                    {type === 'REFURB_PURCHASE' ? (
                        <>
                            {/* Purchase Order Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Purchase Order <span className="text-red-500">*</span>
                                </label>
                                {purchaseOrders.length === 0 ? (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
                                        No unaddressed Purchase Orders available. Create a new PO first.
                                    </div>
                                ) : (
                                    <select
                                        value={selectedPOId}
                                        onChange={(e) => setSelectedPOId(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    >
                                        <option value="">Select a Purchase Order</option>
                                        {purchaseOrders.map((po) => (
                                            <option key={po.id} value={po.id}>
                                                {po.poNumber} ({po.expectedDevices} devices)
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Vehicle Number */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Vehicle Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="vehicleNumber"
                                    required
                                    placeholder="e.g., KA-01-AB-1234"
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>

                            {/* Driver Name */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Driver Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="driverName"
                                    required
                                    placeholder="Enter driver name"
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>

                            {/* Delivery Challan Upload */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Delivery Challan <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-muted border border-input rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                                    >
                                        {challanFile ? 'Change File' : 'Upload Challan'}
                                    </button>
                                    {challanFile && (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="truncate max-w-[200px]">{challanFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setChallanFile(null)
                                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Upload an image or PDF of the delivery challan (max 10MB)
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    name="customer"
                                    required
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Rental Reference / Ticket ID</label>
                                <input
                                    type="text"
                                    name="rentalRef"
                                    required
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Email Subject / Thread Reference</label>
                                <input
                                    type="text"
                                    name="emailSubject"
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-muted border border-input rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (type === 'REFURB_PURCHASE' && purchaseOrders.length === 0)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {uploading ? 'Uploading Challan...' : loading ? 'Creating...' : 'Create Batch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
