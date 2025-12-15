import { getDeviceForQC, submitQC, updateChecklistItemStatus } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import { AlertCircle } from 'lucide-react'
import QCForm from './QCForm'

export default async function QCFormPage({ params }: { params: Promise<{ barcode: string }> }) {
    const { barcode } = await params
    const device = await getDeviceForQC(barcode)
    const user = await checkRole(['QC_ENGINEER', 'ADMIN'])

    if (!device) return <div className="p-8 text-center text-red-600">Device not found</div>

    // Allow QC only if AWAITING_QC
    if (device.status !== 'AWAITING_QC') {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <AlertCircle className="mx-auto text-yellow-600 mb-2" size={48} />
                <h2 className="text-xl font-bold text-yellow-800">Not Ready for QC</h2>
                <p className="text-yellow-700 mt-2">
                    This device is currently <strong>{device.status.replace('_', ' ')}</strong>.
                </p>
                <div className="mt-6">
                    <a href="/qc" className="text-blue-600 hover:underline">Scan another device</a>
                </div>
            </div>
        )
    }

    // Extract repair job info
    const repairJob = device.repairJobs[0]
    const l2EngineerName = repairJob?.l2Engineer?.name || null
    const inspectionEngineerName = repairJob?.inspectionEng?.name || null

    // Build parallel work status
    const parallelWork = {
        displayRepairRequired: device.displayRepairRequired,
        displayRepairCompleted: device.displayRepairCompleted,
        batteryBoostRequired: device.batteryBoostRequired,
        batteryBoostCompleted: device.batteryBoostCompleted,
        l3RepairRequired: device.l3RepairRequired,
        l3RepairCompleted: device.l3RepairCompleted,
        paintRequired: device.paintRequired,
        paintCompleted: device.paintCompleted,
        displayRepairJobs: device.displayRepairJobs.map(j => ({
            status: j.status,
            notes: j.notes
        })),
        batteryBoostJobs: device.batteryBoostJobs.map(j => ({
            status: j.status,
            finalCapacity: j.finalCapacity,
            notes: j.notes
        })),
        l3RepairJobs: device.l3RepairJobs.map(j => ({
            status: j.status,
            issueType: j.issueType,
            resolution: j.resolution,
            notes: j.notes
        })),
        paintPanels: device.paintPanels.map(p => ({
            panelType: p.panelType,
            status: p.status
        }))
    }

    // Build checklist items
    const checklistItems = device.inspectionChecklist.map(item => ({
        id: item.id,
        itemIndex: item.itemIndex,
        itemText: item.itemText,
        status: item.status,
        notes: item.notes,
        checkedAtStage: item.checkedAtStage,
        checkedBy: item.checkedBy
    }))

    async function handleQC(deviceId: string, data: {
        qcEngId: string
        checklistResults: string
        remarks: string
        finalGrade: 'A' | 'B' | null
        status: 'PASSED' | 'FAILED_REWORK'
    }) {
        'use server'
        await submitQC(deviceId, data)
    }

    async function handleUpdateChecklistItem(
        itemId: string,
        status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE',
        notes?: string
    ) {
        'use server'
        await updateChecklistItemStatus(itemId, status, notes)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">QC Inspection: {device.barcode}</h1>
                    <p className="text-gray-500">{device.brand} {device.model} ({device.category})</p>
                </div>
            </div>

            <QCForm
                deviceId={device.id}
                userId={user.id}
                deviceBarcode={device.barcode}
                deviceBrand={device.brand}
                deviceModel={device.model}
                deviceCategory={device.category}
                checklistItems={checklistItems}
                parallelWork={parallelWork}
                l2EngineerName={l2EngineerName}
                inspectionEngineerName={inspectionEngineerName}
                onSubmit={handleQC}
                onUpdateChecklistItem={handleUpdateChecklistItem}
            />
        </div>
    )
}
