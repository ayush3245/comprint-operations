import { prisma } from '@/lib/db'
import { addDeviceToBatch } from '@/lib/actions'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { DeviceCategory, Ownership } from '@prisma/client'
import { checkRole } from '@/lib/auth'

export default async function BatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    await checkRole(['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'])
    const { id } = await params
    const batch = await prisma.inwardBatch.findUnique({
        where: { batchId: id },
        include: {
            devices: true,
            createdBy: true
        }
    })

    if (!batch) notFound()

    async function handleAddDevice(formData: FormData) {
        'use server'
        const category = formData.get('category') as DeviceCategory
        const brand = formData.get('brand') as string
        const model = formData.get('model') as string
        const config = formData.get('config') as string
        const serial = formData.get('serial') as string

        // Determine ownership based on batch type
        const ownership = batch?.type === 'REFURB_PURCHASE' ? Ownership.REFURB_STOCK : Ownership.RENTAL_RETURN

        if (batch) {
            await addDeviceToBatch(batch.id, {
                category,
                brand,
                model,
                config,
                serial,
                ownership
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Batch: {batch.batchId}</h1>
                    <p className="text-gray-500">
                        {batch.type.replace('_', ' ')} • {formatDate(batch.date)} • Created by {batch.createdBy.name}
                    </p>
                    <div className="mt-2 text-sm text-gray-600">
                        {batch.type === 'REFURB_PURCHASE' ? (
                            <>PO: {batch.poInvoiceNo} {batch.supplier && `• Supplier: ${batch.supplier}`}</>
                        ) : (
                            <>Customer: {batch.customer} {batch.rentalRef && `• Ref: ${batch.rentalRef}`}</>
                        )}
                    </div>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
                    {batch.devices.length} Devices
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Device Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Add Device</h2>
                        <form action={handleAddDevice} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select name="category" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                    <option value="LAPTOP">Laptop</option>
                                    <option value="DESKTOP">Desktop</option>
                                    <option value="WORKSTATION">Workstation</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <input type="text" name="brand" required className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g. Dell" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                <input type="text" name="model" required className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g. Latitude 7490" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Config (CPU/RAM/SSD)</label>
                                <input type="text" name="config" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g. i5-8350U/16GB/256GB" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                <input type="text" name="serial" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Optional" />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                                Add Device
                            </button>
                        </form>
                    </div>
                </div>

                {/* Device List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Devices in Batch</h2>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Config</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {batch.devices.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                            No devices added yet.
                                        </td>
                                    </tr>
                                ) : (
                                    batch.devices.map((device) => (
                                        <tr key={device.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">
                                                {device.barcode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="font-medium">{device.brand} {device.model}</div>
                                                <div className="text-xs text-gray-500">{device.category}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {device.config || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    {device.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
