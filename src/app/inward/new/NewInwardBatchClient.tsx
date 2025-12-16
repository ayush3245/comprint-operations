'use client'

import { createInwardBatch } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { InwardType } from '@prisma/client'
import { useToast } from '@/components/ui/Toast'

export default function NewInwardBatchClient() {
    const router = useRouter()
    const toast = useToast()
    const [type, setType] = useState<InwardType>('REFURB_PURCHASE')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const data = {
                type,
                poInvoiceNo: formData.get('poInvoiceNo') as string,
                supplier: formData.get('supplier') as string,
                customer: formData.get('customer') as string,
                rentalRef: formData.get('rentalRef') as string,
                emailSubject: formData.get('emailSubject') as string,
                createdById: 'placeholder'
            }

            const batch = await createInwardBatch(data)
            toast.success(`Batch created successfully! Now add devices.`)
            router.push(`/inward/${batch.batchId}`)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to create batch')
        } finally {
            setLoading(false)
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
                            onClick={() => setType('REFURB_PURCHASE')}
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
                    {type === 'REFURB_PURCHASE' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">PO / Invoice No</label>
                                <input
                                    type="text"
                                    name="poInvoiceNo"
                                    required
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Supplier Name</label>
                                <input
                                    type="text"
                                    name="supplier"
                                    required
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
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
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Batch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
