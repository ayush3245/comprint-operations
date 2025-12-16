import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { checkRole } from '@/lib/auth'

export default async function InwardPage() {
    await checkRole(['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'])
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
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Inward Batches</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage incoming devices and shipments</p>
                </div>
                <Link
                    href="/inward/new"
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 transition-all duration-200 font-medium"
                >
                    <Plus size={20} />
                    <span>New Batch</span>
                </Link>
            </div>

            <div className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Batch ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Devices</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-gray-100 dark:divide-gray-800">
                            {batches.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                                                <Plus className="text-muted-foreground" size={24} />
                                            </div>
                                            <p className="font-medium text-foreground">No batches found</p>
                                            <p className="text-sm text-muted-foreground mt-1">Create a new batch to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                batches.map((batch) => (
                                    <tr key={batch.id} className="hover:bg-muted/50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-primary">
                                            <Link href={`/inward/${batch.batchId}`} className="hover:underline">
                                                {batch.batchId}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                {batch.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {batch.type === 'REFURB_PURCHASE' ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{batch.poInvoiceNo}</span>
                                                    {batch.supplier && <span className="text-xs text-muted-foreground">{batch.supplier}</span>}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{batch.customer}</span>
                                                    {batch.rentalRef && <span className="text-xs text-muted-foreground">Ref: {batch.rentalRef}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {formatDate(batch.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                                            {batch._count.devices}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                                                    {batch.createdBy.name.charAt(0)}
                                                </div>
                                                {batch.createdBy.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link href={`/inward/${batch.batchId}`} className="text-primary hover:text-primary-hover transition-colors">
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
