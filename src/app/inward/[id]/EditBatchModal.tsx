'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Edit2, Loader2, Save } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { updateInwardBatch } from '@/lib/actions'
import { InwardType } from '@prisma/client'

type BatchData = {
    batchId: string
    type: InwardType
    date: Date
    poInvoiceNo: string | null
    supplier: string | null
    customer: string | null
    rentalRef: string | null
    emailSubject: string | null
}

interface Props {
    batch: BatchData
}

export default function EditBatchModal({ batch }: Props) {
    const router = useRouter()
    const toast = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const [formData, setFormData] = useState({
        date: batch.date.toISOString().split('T')[0],
        poInvoiceNo: batch.poInvoiceNo || '',
        supplier: batch.supplier || '',
        customer: batch.customer || '',
        rentalRef: batch.rentalRef || '',
        emailSubject: batch.emailSubject || ''
    })

    function handleOpen() {
        setFormData({
            date: batch.date.toISOString().split('T')[0],
            poInvoiceNo: batch.poInvoiceNo || '',
            supplier: batch.supplier || '',
            customer: batch.customer || '',
            rentalRef: batch.rentalRef || '',
            emailSubject: batch.emailSubject || ''
        })
        setIsOpen(true)
    }

    function handleClose() {
        setIsOpen(false)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        startTransition(async () => {
            try {
                await updateInwardBatch(batch.batchId, formData)
                toast.success('Batch updated successfully')
                setIsOpen(false)
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to update batch')
            }
        })
    }

    return (
        <>
            <button
                onClick={handleOpen}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-input rounded-lg transition-colors"
            >
                <Edit2 size={16} />
                <span>Edit Batch</span>
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <div
                        className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-default flex items-center justify-between bg-muted/50">
                            <h2 className="text-xl font-bold text-foreground">Edit Batch Details</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Date Field */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Receipt Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors"
                                />
                            </div>

                            {batch.type === 'REFURB_PURCHASE' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            PO / Invoice No
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.poInvoiceNo}
                                            onChange={(e) => setFormData({ ...formData, poInvoiceNo: e.target.value })}
                                            className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Supplier Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                            className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Customer Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.customer}
                                            onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                            className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Rental Reference / Ticket ID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.rentalRef}
                                            onChange={(e) => setFormData({ ...formData, rentalRef: e.target.value })}
                                            className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Email Subject / Thread Reference
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.emailSubject}
                                            onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                                            className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 bg-muted border border-input text-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
