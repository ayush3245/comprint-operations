'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle } from 'lucide-react'

interface InspectionFormProps {
  deviceId: string
  userId: string
  deviceBarcode: string
  deviceBrand: string
  deviceModel: string
  onSubmit: (deviceId: string, data: {
    inspectionEngId: string
    reportedIssues: string
    cosmeticIssues: string
    paintRequired: boolean
    paintPanels: string[]
    sparesRequired: string
  }) => Promise<void>
}

export default function InspectionForm({ deviceId, userId, deviceBarcode, deviceBrand, deviceModel, onSubmit }: InspectionFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  const handleSubmit = async (formData: FormData) => {
    const paintPanels = formData.getAll('paintPanels') as string[]
    const sparesRequired = formData.get('spares') as string
    const functionalIssues = formData.get('functionalIssues') as string

    startTransition(async () => {
      try {
        await onSubmit(deviceId, {
          inspectionEngId: userId,
          reportedIssues: functionalIssues,
          cosmeticIssues: formData.get('cosmeticIssues') as string,
          paintRequired: paintPanels.length > 0,
          paintPanels,
          sparesRequired
        })

        // Build details array
        const details: Array<{ label: string; value: string }> = [
          { label: 'Barcode', value: deviceBarcode },
          { label: 'Device', value: `${deviceBrand} ${deviceModel}` }
        ]
        if (paintPanels.length > 0) {
          details.push({ label: 'Paint Required', value: paintPanels.join(', ') })
        }
        if (sparesRequired) {
          details.push({ label: 'Spares Required', value: sparesRequired })
        }
        details.push({
          label: 'Next Step',
          value: paintPanels.length > 0 ? 'Paint Shop' : (functionalIssues || sparesRequired ? 'Repair' : 'QC')
        })

        toast.success('The device inspection has been recorded and moved to the next stage.', {
          title: 'Inspection Completed',
          details
        })

        setTimeout(() => {
          router.push('/inspection')
        }, 100)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit inspection')
      }
    })
  }

  return (
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
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 disabled:bg-green-400"
        >
          <CheckCircle size={20} />
          <span>{isPending ? 'Submitting...' : 'Submit Inspection'}</span>
        </button>
      </div>
    </form>
  )
}
