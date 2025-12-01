import { getDeviceByBarcode, submitQC } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

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

    async function handleSubmit(formData: FormData) {
        'use server'
        if (!device || !user) return

        const decision = formData.get('decision') as 'PASSED' | 'FAILED'
        const grade = formData.get('grade') as 'A' | 'B' | null

        await submitQC(device.id, {
            qcEngId: user.id,
            checklistResults: formData.get('checklist') as string, // Simplified for MVP
            remarks: formData.get('remarks') as string,
            finalGrade: grade,
            status: decision === 'PASSED' ? 'PASSED' : 'FAILED_REWORK'
        })

        // Only show success (confetti) if QC passed
        if (decision === 'PASSED') {
            redirect('/qc?success=true')
        } else {
            redirect('/qc?failed=true')
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">QC Inspection: {device.barcode}</h1>
                    <p className="text-gray-500">{device.brand} {device.model} ({device.category})</p>
                </div>
            </div>

            <form action={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">QC Checklist</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {['Power On / Boot', 'Display Quality', 'Keyboard & Touchpad', 'Ports & Connectivity', 'Battery Health', 'Thermals / Fan', 'Cosmetic Condition', 'Cleanliness'].map((item) => (
                            <label key={item} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                                <span>{item}</span>
                                <input type="checkbox" name="checklist_item" defaultChecked className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                            </label>
                        ))}
                    </div>
                    <input type="hidden" name="checklist" value="All Checked" /> {/* Simplified */}

                    <textarea
                        name="remarks"
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Final Remarks..."
                    />
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Final Decision</h2>

                    <div className="flex gap-6">
                        <label className="flex-1 cursor-pointer">
                            <input type="radio" name="decision" value="PASSED" className="peer sr-only" required />
                            <div className="p-4 border-2 border-gray-200 rounded-lg peer-checked:border-green-500 peer-checked:bg-green-50 text-center transition-all">
                                <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
                                <span className="font-bold text-green-700">QC PASSED</span>
                            </div>
                        </label>

                        <label className="flex-1 cursor-pointer">
                            <input type="radio" name="decision" value="FAILED" className="peer sr-only" />
                            <div className="p-4 border-2 border-gray-200 rounded-lg peer-checked:border-red-500 peer-checked:bg-red-50 text-center transition-all">
                                <XCircle className="mx-auto mb-2 text-red-600" size={32} />
                                <span className="font-bold text-red-700">FAILED - REWORK</span>
                            </div>
                        </label>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Final Grade (If Passed)</label>
                        <div className="flex gap-4">
                            <label className="flex items-center space-x-2">
                                <input type="radio" name="grade" value="A" className="text-blue-600 focus:ring-blue-500" />
                                <span className="font-bold">Grade A</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="radio" name="grade" value="B" className="text-blue-600 focus:ring-blue-500" />
                                <span className="font-bold">Grade B</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <a href="/qc" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Cancel
                    </a>
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                        Submit Result
                    </button>
                </div>
            </form>
        </div>
    )
}
