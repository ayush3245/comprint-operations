'use client'

import { createInwardBatch } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { InwardType } from '@prisma/client'

export default function NewInwardBatchClient() {
    const router = useRouter()
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

            await createInwardBatch(data)
            router.push('/inward')
        } catch (error) {
            console.error(error)
            alert('Failed to create batch')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Inward Batch</h1>

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inward Type</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setType('REFURB_PURCHASE')}
                            className={`px-4 py-2 rounded-md border ${type === 'REFURB_PURCHASE'
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Refurb Purchase
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('RENTAL_RETURN')}
                            className={`px-4 py-2 rounded-md border ${type === 'RENTAL_RETURN'
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">PO / Invoice No</label>
                                <input
                                    type="text"
                                    name="poInvoiceNo"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                                <input
                                    type="text"
                                    name="supplier"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    name="customer"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rental Reference / Ticket ID</label>
                                <input
                                    type="text"
                                    name="rentalRef"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject / Thread Reference</label>
                                <input
                                    type="text"
                                    name="emailSubject"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Batch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
