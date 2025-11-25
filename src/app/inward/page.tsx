import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function InwardPage() {
    const batches = await prisma.inwardBatch.findMany({
        include: {
            createdBy: true,
            _count: {
                select: { devices: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inward Batches</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage incoming devices and shipments</p>
                </div>
                <Link
                    href="/inward/new"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 transition-all duration-200 font-medium"
                >
                    <Plus size={20} />
                    <span>New Batch</span>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Devices</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {batches.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                <Plus className="text-gray-400" size={24} />
                                            </div>
                                            <p className="font-medium text-gray-900">No batches found</p>
                                            <p className="text-sm text-gray-500 mt-1">Create a new batch to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                batches.map((batch) => (
                                    <tr key={batch.id} className="hover:bg-gray-50/80 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-blue-600">
                                            <Link href={`/inward/${batch.batchId}`} className="hover:underline">
                                                {batch.batchId}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {batch.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {batch.type === 'REFURB_PURCHASE' ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{batch.poInvoiceNo}</span>
                                                    {batch.supplier && <span className="text-xs text-gray-400">{batch.supplier}</span>}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{batch.customer}</span>
                                                    {batch.rentalRef && <span className="text-xs text-gray-400">Ref: {batch.rentalRef}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(batch.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {batch._count.devices}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                                    {batch.createdBy.name.charAt(0)}
                                                </div>
                                                {batch.createdBy.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link href={`/inward/${batch.batchId}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
