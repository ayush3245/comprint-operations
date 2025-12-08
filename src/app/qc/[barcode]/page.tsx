import { getDeviceByBarcode, submitQC } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import { AlertCircle } from 'lucide-react'
import QCForm from './QCForm'

export default async function QCFormPage({ params }: { params: Promise<{ barcode: string }> }) {
    const { barcode } = await params
    const device = await getDeviceByBarcode(barcode)
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
                onSubmit={handleQC}
            />
        </div>
    )
}
