import { getDeviceByBarcode, submitInspectionWithChecklist } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import { getChecklistForCategory } from '@/lib/checklist-definitions'
import { AlertCircle } from 'lucide-react'
import InspectionForm from './InspectionForm'
import type { DeviceCategory } from '@prisma/client'

export default async function InspectionFormPage({ params }: { params: Promise<{ barcode: string }> }) {
    const { barcode } = await params
    const device = await getDeviceByBarcode(barcode)
    const user = await checkRole(['INSPECTION_ENGINEER', 'ADMIN'])

    if (!device) return <div className="p-8 text-center text-red-600">Device not found</div>

    // If device is not in PENDING_INSPECTION, show status
    if (device.status !== 'PENDING_INSPECTION' && device.status !== 'RECEIVED') {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-6 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg text-center">
                <AlertCircle className="mx-auto text-yellow-600 dark:text-yellow-400 mb-2" size={48} />
                <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-400">Inspection Already Done</h2>
                <p className="text-yellow-700 dark:text-yellow-400 mt-2">
                    This device is currently <strong>{device.status.replace('_', ' ')}</strong>.
                </p>
                <div className="mt-6">
                    <a href="/inspection" className="text-blue-600 dark:text-blue-400 hover:underline">Scan another device</a>
                </div>
            </div>
        )
    }

    // Get category-specific checklist items
    const checklistItems = getChecklistForCategory(device.category as DeviceCategory)

    async function handleInspection(deviceId: string, data: {
        inspectionEngId: string
        checklistItems: Array<{
            itemIndex: number
            itemText: string
            status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE'
            notes?: string
        }>
        sparesRequired: string
        overallNotes?: string
        paintPanels: string[]
    }) {
        'use server'
        return await submitInspectionWithChecklist(deviceId, data)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Inspection: {device.barcode}</h1>
                    <p className="text-muted-foreground">{device.brand} {device.model} ({device.category})</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {device.ownership.replace('_', ' ')}
                </div>
            </div>

            <InspectionForm
                deviceId={device.id}
                userId={user.id}
                deviceBarcode={device.barcode}
                deviceBrand={device.brand}
                deviceModel={device.model}
                deviceCategory={device.category}
                checklistItems={checklistItems}
                onSubmit={handleInspection}
            />
        </div>
    )
}
