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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Inward Batches</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage incoming devices and shipments</p>
                </div>
                <Link
                    href="/inward/new"
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 transition-all duration-200 font-medium w-full sm:w-auto"
                >
                    <Plus size={20} />
                    <span>New Batch</span>
                </Link>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {batches.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-soft border border-default p-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                                <Plus className="text-muted-foreground" size={24} />
                            </div>
                            <p className="font-medium text-foreground">No batches found</p>
                            <p className="text-sm text-muted-foreground mt-1">Create a new batch to get started</p>
                        </div>
                    </div>
                ) : (
                    batches.map((batch) => (
                        <Link
                            key={batch.id}
                            href={`/inward/${batch.batchId}`}
                            className="block bg-card rounded-xl shadow-soft border border-default p-4 hover:bg-muted transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="font-mono text-sm font-medium text-primary">{batch.batchId}</div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground mt-1">
                                        {batch.type.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-foreground">{batch._count.devices}</div>
                                    <div className="text-xs text-muted-foreground">devices</div>
                                </div>
                            </div>
                            <div className="text-sm mb-2">
                                {batch.type === 'REFURB_PURCHASE' ? (
                                    <div>
                                        <span className="font-medium text-foreground">{batch.poInvoiceNo}</span>
                                        {batch.supplier && <span className="text-muted-foreground"> • {batch.supplier}</span>}
                                    </div>
                                ) : (
                                    <div>
                                        <span className="font-medium text-foreground">{batch.customer}</span>
                                        {batch.rentalRef && <span className="text-muted-foreground"> • Ref: {batch.rentalRef}</span>}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{formatDate(batch.date)}</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                                        {batch.createdBy.name.charAt(0)}
                                    </div>
                                    <span>{batch.createdBy.name}</span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Batch ID</th>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Date</th>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Devices</th>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Created By</th>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                                    <tr key={batch.id} className="bg-card hover:bg-muted transition-colors duration-150">
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-primary">
                                            <Link href={`/inward/${batch.batchId}`} className="hover:underline">
                                                {batch.batchId}
                                            </Link>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                {batch.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                                            {formatDate(batch.date)}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                                            {batch._count.devices}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                                                    {batch.createdBy.name.charAt(0)}
                                                </div>
                                                {batch.createdBy.name}
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link href={`/inward/${batch.batchId}`} className="text-primary hover:text-primary-hover transition-colors">
                                                View
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
