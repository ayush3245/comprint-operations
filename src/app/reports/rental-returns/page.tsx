import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { checkRole } from '@/lib/auth'

export default async function RentalReturnsReportPage() {
    await checkRole(['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'])
    const returns = await prisma.inwardBatch.findMany({
        where: {
            type: 'RENTAL_RETURN'
        },
        include: {
            devices: {
                include: {
                    qcRecords: true
                }
            }
        },
        orderBy: { date: 'desc' }
    })

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-foreground">Rental Returns Report</h1>

            <div className="space-y-8">
                {returns.map((batch) => (
                    <div key={batch.id} className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                        <div className="px-6 py-4 bg-muted border-b border-default flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{batch.customer}</h2>
                                <p className="text-sm text-muted-foreground">Ref: {batch.rentalRef} • {formatDate(batch.date)}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                                {batch.devices.length} Devices
                            </span>
                        </div>

                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Barcode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Model</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">QC Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                                {batch.devices.map((device) => (
                                    <tr key={device.id} className="bg-card hover:bg-muted transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-primary">
                                            {device.barcode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {device.model}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${device.status === 'READY_FOR_STOCK' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                                                }`}>
                                                {device.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">
                                            {device.grade ? `Grade ${device.grade}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {device.qcRecords[0]?.remarks || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}

                {returns.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground bg-card rounded-xl shadow-soft border border-default">
                        No rental returns found.
                    </div>
                )}
            </div>
        </div>
    )
}
