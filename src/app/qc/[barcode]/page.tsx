import { getDeviceForQC, submitQC, updateChecklistItemStatus } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import { AlertCircle, Search } from 'lucide-react'
import QCForm from './QCForm'
import Link from 'next/link'

export default async function QCFormPage({ params }: { params: Promise<{ barcode: string }> }) {
    const { barcode } = await params
    const device = await getDeviceForQC(barcode)
    const user = await checkRole(['QC_ENGINEER', 'ADMIN'])

    if (!device) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="text-red-500 dark:text-red-400" size={32} />
                </div>
                <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
                    Device Not Found
                </h2>
                <p className="text-red-600 dark:text-red-400 mb-2">
                    No device found with barcode:
                </p>
                <p className="font-mono text-lg font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/20 px-4 py-2 rounded-lg mb-4">
                    {barcode}
                </p>
                <p className="text-sm text-red-500 dark:text-red-400 mb-6">
                    Please verify the barcode is correct and the device has been registered in the system.
                </p>
                <Link
                    href="/qc"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                    <Search size={18} />
                    Scan Another Device
                </Link>
            </div>
        )
    }

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
