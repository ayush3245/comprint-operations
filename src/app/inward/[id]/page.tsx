import { prisma } from '@/lib/db'
import { addDeviceToBatch, bulkUploadDevices } from '@/lib/actions'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { DeviceCategory, Ownership } from '@prisma/client'
import { checkRole } from '@/lib/auth'
import BulkUploadForm from './BulkUploadForm'
import BarcodePrintButton from '@/components/BarcodePrintButton'
import DynamicDeviceForm from '@/components/DynamicDeviceForm'

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

        // Common fields
        const cpu = formData.get('cpu') as string
        const ram = formData.get('ram') as string
        const ssd = formData.get('ssd') as string
        const gpu = formData.get('gpu') as string
        const screenSize = formData.get('screenSize') as string
        const serial = formData.get('serial') as string

        // Server fields
        const formFactor = formData.get('formFactor') as string
        const raidController = formData.get('raidController') as string
        const networkPorts = formData.get('networkPorts') as string

        // Monitor fields
        const monitorSize = formData.get('monitorSize') as string
        const resolution = formData.get('resolution') as string
        const panelType = formData.get('panelType') as string
        const refreshRate = formData.get('refreshRate') as string
        const monitorPorts = formData.get('monitorPorts') as string

        // Storage fields
        const storageType = formData.get('storageType') as string
        const capacity = formData.get('capacity') as string
        const storageFormFactor = formData.get('storageFormFactor') as string
        const interfaceType = formData.get('interface') as string
        const rpm = formData.get('rpm') as string

        // Networking card fields
        const nicSpeed = formData.get('nicSpeed') as string
        const portCount = formData.get('portCount') as string
        const connectorType = formData.get('connectorType') as string
        const nicInterface = formData.get('nicInterface') as string
        const bracketType = formData.get('bracketType') as string

        // Determine ownership based on batch type
        const ownership = batch?.type === 'REFURB_PURCHASE' ? Ownership.REFURB_STOCK : Ownership.RENTAL_RETURN

        if (batch) {
            await addDeviceToBatch(batch.id, {
                category,
                brand,
                model,
                cpu,
                ram,
                ssd,
                gpu,
                screenSize,
                serial,
                formFactor,
                raidController,
                networkPorts,
                monitorSize,
                resolution,
                panelType,
                refreshRate,
                monitorPorts,
                storageType,
                capacity,
                storageFormFactor,
                interface: interfaceType,
                rpm,
                nicSpeed,
                portCount,
                connectorType,
                nicInterface,
                bracketType,
                ownership
            })
        }
    }

    async function handleBulkUpload(devices: any[]) {
        'use server'
        if (!batch) throw new Error('Batch not found')
        return await bulkUploadDevices(batch.id, devices)
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
                <div className="flex items-center gap-3">
                    {batch.devices.length > 0 && (
                        <BarcodePrintButton
                            devices={batch.devices.map(d => ({
                                barcode: d.barcode,
                                category: d.category,
                                brand: d.brand,
                                model: d.model,
                                cpu: d.cpu,
                                ram: d.ram,
                                ssd: d.ssd,
                                serial: d.serial
                            }))}
                            mode="batch"
                            variant="secondary"
                        />
                    )}
                    <BulkUploadForm batchId={batch.id} onUpload={handleBulkUpload} />
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
                        {batch.devices.length} Devices
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Device Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Add Device</h2>
                        <DynamicDeviceForm
                            onSubmit={handleAddDevice}
                            batchType={batch.type}
                        />
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specifications</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {batch.devices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                            No devices added yet.
                                        </td>
                                    </tr>
                                ) : (
                                    batch.devices.map((device) => {
                                        // Get category-specific specs
                                        let specs = ''
                                        switch (device.category) {
                                            case 'LAPTOP':
                                            case 'DESKTOP':
                                            case 'WORKSTATION':
                                                specs = [device.cpu, device.ram, device.ssd, device.gpu, device.screenSize].filter(Boolean).join(' • ')
                                                break
                                            case 'SERVER':
                                                specs = [device.formFactor, device.cpu, device.ram, device.ssd].filter(Boolean).join(' • ')
                                                break
                                            case 'MONITOR':
                                                specs = [device.monitorSize, device.resolution, device.panelType].filter(Boolean).join(' • ')
                                                break
                                            case 'STORAGE':
                                                specs = [device.storageType, device.capacity, device.storageFormFactor, device.interface].filter(Boolean).join(' • ')
                                                break
                                            case 'NETWORKING_CARD':
                                                specs = [device.nicSpeed, device.portCount, device.connectorType].filter(Boolean).join(' • ')
                                                break
                                        }

                                        // Format category label
                                        const categoryLabel = device.category.replace('_', ' ')

                                        return (
                                            <tr key={device.id}>
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">
                                                    {device.barcode}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="font-medium">{device.brand} {device.model}</div>
                                                    <div className="text-xs text-gray-500">{categoryLabel}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {specs || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        {device.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <BarcodePrintButton
                                                        devices={[{
                                                            barcode: device.barcode,
                                                            category: device.category,
                                                            brand: device.brand,
                                                            model: device.model,
                                                            cpu: device.cpu,
                                                            ram: device.ram,
                                                            ssd: device.ssd,
                                                            serial: device.serial
                                                        }]}
                                                        mode="single"
                                                        variant="icon"
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
