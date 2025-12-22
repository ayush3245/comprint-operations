import { prisma } from '@/lib/db'
import { addDeviceToBatch, bulkUploadDevices } from '@/lib/actions'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { DeviceCategory, Ownership, VerificationStatus } from '@prisma/client'
import { checkRole, getCurrentUser } from '@/lib/auth'
import BulkUploadForm from './BulkUploadForm'
import BarcodePrintButton from '@/components/BarcodePrintButton'
import DynamicDeviceForm from '@/components/DynamicDeviceForm'
import InwardDeviceList from './InwardDeviceList'
import EditBatchModal from './EditBatchModal'
import VerificationPanel from './VerificationPanel'
import Link from 'next/link'
import { ArrowLeft, Lock, Truck, User, ExternalLink, Package } from 'lucide-react'

export default async function BatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await checkRole(['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN', 'STORE_INCHARGE'])
    const { id } = await params
    const batch = await prisma.inwardBatch.findUnique({
        where: { batchId: id },
        include: {
            devices: true,
            createdBy: true,
            purchaseOrder: {
                include: {
                    expectedItems: true
                }
            }
        }
    })

    if (!batch) notFound()

    // Check if user can override verification (warehouse manager or admin only)
    const canOverride = ['WAREHOUSE_MANAGER', 'ADMIN', 'SUPERADMIN'].includes(user.role)

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

    const isLocked = batch.isLocked
    const hasPurchaseOrder = !!batch.purchaseOrder

    return (
        <div className="space-y-6">
            {/* Back Navigation */}
            <Link
                href="/inward"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Batches</span>
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-bold text-foreground">Batch: {batch.batchId}</h1>
                        {isLocked && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                                <Lock size={12} />
                                Locked
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        {batch.type.replace('_', ' ')} • {formatDate(batch.date)} • Created by {batch.createdBy.name}
                    </p>
                    <div className="mt-2 text-sm text-muted-foreground">
                        {batch.type === 'REFURB_PURCHASE' ? (
                            <>PO: {batch.poInvoiceNo} {batch.supplier && `• Supplier: ${batch.supplier}`}</>
                        ) : (
                            <>Customer: {batch.customer} {batch.rentalRef && `• Ref: ${batch.rentalRef}`}</>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {!isLocked && <EditBatchModal batch={batch} />}
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
                    {!isLocked && <BulkUploadForm batchId={batch.id} onUpload={handleBulkUpload} />}
                    <div className="bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg font-medium">
                        {batch.devices.length} Devices
                    </div>
                </div>
            </div>

            {/* Batch delivery info */}
            {hasPurchaseOrder && (
                <div className="bg-card p-4 rounded-lg shadow-soft border border-default">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        {batch.vehicleNumber && (
                            <span className="inline-flex items-center gap-2 text-foreground">
                                <Truck size={16} className="text-muted-foreground" />
                                {batch.vehicleNumber}
                            </span>
                        )}
                        {batch.driverName && (
                            <span className="inline-flex items-center gap-2 text-foreground">
                                <User size={16} className="text-muted-foreground" />
                                {batch.driverName}
                            </span>
                        )}
                        {batch.deliveryChallanUrl && (
                            <a
                                href={batch.deliveryChallanUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                                View Challan
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Expected Items from PO */}
            {hasPurchaseOrder && batch.purchaseOrder?.expectedItems && batch.purchaseOrder.expectedItems.length > 0 && (
                <div className="bg-card p-4 rounded-lg shadow-soft border border-default">
                    <div className="flex items-center gap-2 mb-3">
                        <Package size={18} className="text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Expected Devices from PO</h3>
                        <span className="text-xs text-muted-foreground">
                            ({batch.purchaseOrder.expectedDevices} total)
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {batch.purchaseOrder.expectedItems.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {item.brand} {item.model}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.category.replace('_', ' ')} • Qty: {item.quantity}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Verification Panel - Only for PO-linked batches */}
            {hasPurchaseOrder && (
                <VerificationPanel
                    batchId={batch.id}
                    verificationStatus={batch.verificationStatus}
                    verificationResult={batch.verificationResult as Record<string, unknown> | null}
                    isLocked={isLocked}
                    hasPurchaseOrder={hasPurchaseOrder}
                    deviceCount={batch.devices.length}
                    canOverride={canOverride}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Device Form - Only show if not locked */}
                {!isLocked && (
                    <div className="lg:col-span-1">
                        <div className="bg-card p-6 rounded-lg shadow-soft border border-default">
                            <h2 className="text-lg font-semibold mb-4 text-foreground">Add Device</h2>
                            <DynamicDeviceForm
                                onSubmit={handleAddDevice}
                                batchType={batch.type}
                            />
                        </div>
                    </div>
                )}

                {/* Device List */}
                <div className={isLocked ? "lg:col-span-3" : "lg:col-span-2"}>
                    <div className="bg-card rounded-lg shadow-soft border border-default overflow-hidden">
                        <div className="px-4 md:px-6 py-4 border-b border-default">
                            <h2 className="text-lg font-semibold text-foreground">Devices in Batch</h2>
                        </div>
                        <InwardDeviceList devices={batch.devices} />
                    </div>
                </div>
            </div>
        </div>
    )
}
