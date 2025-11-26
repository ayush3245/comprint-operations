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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Rental Returns Report</h1>

            <div className="space-y-8">
                {returns.map((batch) => (
                    <div key={batch.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">{batch.customer}</h2>
                                <p className="text-sm text-gray-500">Ref: {batch.rentalRef} • {formatDate(batch.date)}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {batch.devices.length} Devices
                            </span>
                        </div>

                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QC Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {batch.devices.map((device) => (
                                    <tr key={device.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">
                                            {device.barcode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {device.model}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${device.status === 'READY_FOR_STOCK' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {device.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {device.grade ? `Grade ${device.grade}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {device.qcRecords[0]?.remarks || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}

                {returns.length === 0 && (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
                        No rental returns found.
                    </div>
                )}
            </div>
        </div>
    )
}
