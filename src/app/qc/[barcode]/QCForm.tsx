'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle, XCircle } from 'lucide-react'

interface QCFormProps {
  deviceId: string
  userId: string
  deviceBarcode: string
  deviceBrand: string
  deviceModel: string
  onSubmit: (deviceId: string, data: {
    qcEngId: string
    checklistResults: string
    remarks: string
    finalGrade: 'A' | 'B' | null
    status: 'PASSED' | 'FAILED_REWORK'
  }) => Promise<void>
}

export default function QCForm({ deviceId, userId, deviceBarcode, deviceBrand, deviceModel, onSubmit }: QCFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  const handleSubmit = async (formData: FormData) => {
    const decision = formData.get('decision') as 'PASSED' | 'FAILED'
    const grade = formData.get('grade') as 'A' | 'B' | null

    startTransition(async () => {
      try {
        await onSubmit(deviceId, {
          qcEngId: userId,
          checklistResults: formData.get('checklist') as string,
          remarks: formData.get('remarks') as string,
          finalGrade: grade,
          status: decision === 'PASSED' ? 'PASSED' : 'FAILED_REWORK'
        })

        if (decision === 'PASSED') {
          toast.success('Device has passed quality control and is now ready for stock/dispatch.', {
            title: 'QC Passed',
            details: [
              { label: 'Barcode', value: deviceBarcode },
              { label: 'Device', value: `${deviceBrand} ${deviceModel}` },
              { label: 'Final Grade', value: grade ? `Grade ${grade}` : 'Not Graded' },
              { label: 'Status', value: 'Ready for Stock' }
            ]
          })
          setTimeout(() => router.push('/qc?success=true'), 100)
        } else {
          toast.warning('Device has failed QC and has been sent back for rework.', {
            title: 'QC Failed - Rework Required',
            details: [
              { label: 'Barcode', value: deviceBarcode },
              { label: 'Device', value: `${deviceBrand} ${deviceModel}` },
              { label: 'Status', value: 'Sent to Repair' }
            ]
          })
          setTimeout(() => router.push('/qc?failed=true'), 100)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit QC')
      }
    })
  }

  return (
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
        <input type="hidden" name="checklist" value="All Checked" />

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
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isPending ? 'Submitting...' : 'Submit Result'}
        </button>
      </div>
    </form>
  )
}
