import { getDeviceByBarcode, submitInspection } from '@/lib/actions'
import { getCurrentUser } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default async function InspectionFormPage({ params }: { params: Promise<{ barcode: string }> }) {
    const { barcode } = await params
    const device = await getDeviceByBarcode(barcode)
    const user = await getCurrentUser()

    if (!device) return <div className="p-8 text-center text-red-600">Device not found</div>

    // If device is not in PENDING_INSPECTION, show status
    if (device.status !== 'PENDING_INSPECTION' && device.status !== 'RECEIVED') {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <AlertCircle className="mx-auto text-yellow-600 mb-2" size={48} />
                <h2 className="text-xl font-bold text-yellow-800">Inspection Already Done</h2>
                <p className="text-yellow-700 mt-2">
                    This device is currently <strong>{device.status.replace('_', ' ')}</strong>.
                </p>
                <div className="mt-6">
                    <a href="/inspection" className="text-blue-600 hover:underline">Scan another device</a>
                </div>
            </div>
        )
    }

    async function handleSubmit(formData: FormData) {
        'use server'
        if (!device || !user) return

        const paintPanels = formData.getAll('paintPanels') as string[]

        await submitInspection(device.id, {
            inspectionEngId: user.id,
            reportedIssues: formData.get('functionalIssues') as string,
            cosmeticIssues: formData.get('cosmeticIssues') as string,
            paintRequired: paintPanels.length > 0,
            paintPanels,
            sparesRequired: formData.get('spares') as string
        })

        redirect('/inspection')
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inspection: {device.barcode}</h1>
                    <p className="text-gray-500">{device.brand} {device.model} ({device.category})</p>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {device.ownership.replace('_', ' ')}
                </div>
            </div>

            <form action={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Functional Check</h2>
                    <textarea
                        name="functionalIssues"
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe functional issues (Boot, Display, Keyboard, Audio, Wi-Fi, etc.). Leave empty if all good."
                    />
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Cosmetic Check & Paint</h2>
                    <textarea
                        name="cosmeticIssues"
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-4"
                        placeholder="Describe cosmetic condition (Dents, Scratches, etc.)"
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Paint Required For:</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Top Cover', 'Bottom Cover', 'Palmrest', 'Bezel', 'Keyboard', 'Touchpad'].map((panel) => (
                                <label key={panel} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" name="paintPanels" value={panel} className="rounded text-blue-600 focus:ring-blue-500" />
                                    <span>{panel}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Spares Requirement</h2>
                    <textarea
                        name="spares"
                        rows={2}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="List required spares (Part Codes). Leave empty if none."
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <a href="/inspection" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Cancel
                    </a>
                    <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
                        <CheckCircle size={20} />
                        <span>Submit Inspection</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
