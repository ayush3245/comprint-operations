'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import {
  CheckCircle, XCircle, MinusCircle, AlertTriangle,
  Monitor, Battery, Cpu, Paintbrush, ChevronDown, ChevronUp
} from 'lucide-react'

interface ChecklistItem {
  id: string
  itemIndex: number
  itemText: string
  status: string
  notes: string | null
  checkedAtStage: string
  checkedBy: { name: string } | null
}

interface ParallelWorkStatus {
  displayRepairRequired: boolean
  displayRepairCompleted: boolean
  batteryBoostRequired: boolean
  batteryBoostCompleted: boolean
  l3RepairRequired: boolean
  l3RepairCompleted: boolean
  paintRequired: boolean
  paintCompleted: boolean
  displayRepairJobs: Array<{ status: string; notes: string | null }>
  batteryBoostJobs: Array<{ status: string; finalCapacity: string | null; notes: string | null }>
  l3RepairJobs: Array<{ status: string; issueType: string; resolution: string | null; notes: string | null }>
  paintPanels: Array<{ panelType: string; status: string }>
}

interface QCFormProps {
  deviceId: string
  userId: string
  deviceBarcode: string
  deviceBrand: string
  deviceModel: string
  deviceCategory: string
  checklistItems: ChecklistItem[]
  parallelWork: ParallelWorkStatus
  l2EngineerName: string | null
  inspectionEngineerName: string | null
  onSubmit: (deviceId: string, data: {
    qcEngId: string
    checklistResults: string
    remarks: string
    finalGrade: 'A' | 'B' | null
    status: 'PASSED' | 'FAILED_REWORK'
  }) => Promise<void>
  onUpdateChecklistItem: (
    itemId: string,
    status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE',
    notes?: string
  ) => Promise<void>
}

export default function QCForm({
  deviceId,
  userId,
  deviceBarcode,
  deviceBrand,
  deviceModel,
  deviceCategory,
  checklistItems,
  parallelWork,
  l2EngineerName,
  inspectionEngineerName,
  onSubmit,
  onUpdateChecklistItem
}: QCFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()
  const [showChecklist, setShowChecklist] = useState(true)
  const [decision, setDecision] = useState<'PASSED' | 'FAILED' | null>(null)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)

  const handleToggleStatus = async (itemId: string, newStatus: 'PASS' | 'FAIL' | 'NOT_APPLICABLE') => {
    setUpdatingItemId(itemId)
    try {
      await onUpdateChecklistItem(itemId, newStatus)
      toast.success(`Item updated to ${newStatus.replace('_', ' ')}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update item')
    } finally {
      setUpdatingItemId(null)
    }
  }

  // Calculate checklist stats
  const passCount = checklistItems.filter(i => i.status === 'PASS').length
  const failCount = checklistItems.filter(i => i.status === 'FAIL').length
  const naCount = checklistItems.filter(i => i.status === 'NOT_APPLICABLE').length
  const pendingCount = checklistItems.filter(i => i.status === 'PENDING').length

  // Check parallel work completion
  const parallelWorkErrors: string[] = []
  if (parallelWork.displayRepairRequired && !parallelWork.displayRepairCompleted) {
    parallelWorkErrors.push('Display repair not completed')
  }
  if (parallelWork.batteryBoostRequired && !parallelWork.batteryBoostCompleted) {
    parallelWorkErrors.push('Battery boost not completed')
  }
  if (parallelWork.l3RepairRequired && !parallelWork.l3RepairCompleted) {
    parallelWorkErrors.push('L3 repair not completed')
  }
  if (parallelWork.paintRequired && !parallelWork.paintCompleted) {
    const incompletePanels = parallelWork.paintPanels.filter(p =>
      p.status !== 'READY_FOR_COLLECTION' && p.status !== 'FITTED'
    )
    if (incompletePanels.length > 0) {
      parallelWorkErrors.push(`Paint work not completed (${incompletePanels.length} panels pending)`)
    }
  }

  const canPass = pendingCount === 0 && parallelWorkErrors.length === 0

  const handleSubmit = async (formData: FormData) => {
    const grade = formData.get('grade') as 'A' | 'B' | null

    if (decision === 'PASSED' && !canPass) {
      if (pendingCount > 0) {
        toast.error(`Cannot pass: ${pendingCount} checklist items are still PENDING`)
        return
      }
      if (parallelWorkErrors.length > 0) {
        toast.error(`Cannot pass: ${parallelWorkErrors.join(', ')}`)
        return
      }
    }

    if (decision === 'PASSED' && !grade) {
      toast.error('Please select a final grade (A or B) for passing devices')
      return
    }

    startTransition(async () => {
      try {
        await onSubmit(deviceId, {
          qcEngId: userId,
          checklistResults: JSON.stringify({
            total: checklistItems.length,
            pass: passCount,
            fail: failCount,
            na: naCount,
            pending: pendingCount
          }),
          remarks: formData.get('remarks') as string,
          finalGrade: decision === 'PASSED' ? grade : null,
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
              { label: 'Status', value: 'Sent to L2 Repair' }
            ]
          })
          setTimeout(() => router.push('/qc?failed=true'), 100)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit QC')
      }
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle size={16} className="text-green-600" />
      case 'FAIL': return <XCircle size={16} className="text-red-600" />
      case 'NOT_APPLICABLE': return <MinusCircle size={16} className="text-gray-400" />
      default: return <AlertTriangle size={16} className="text-yellow-500" />
    }
  }

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'INSPECTION': return 'Inspection'
      case 'L2_ENGINEER': return 'L2 Repair'
      case 'L3_ENGINEER': return 'L3 Repair'
      case 'QC': return 'QC'
      default: return stage
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Device Info */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-gray-500">L2 Engineer:</span>
          <span className="ml-2 font-medium">{l2EngineerName || 'Not assigned'}</span>
        </div>
        <div>
          <span className="text-gray-500">Inspection By:</span>
          <span className="ml-2 font-medium">{inspectionEngineerName || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-gray-500">Category:</span>
          <span className="ml-2 font-medium">{deviceCategory}</span>
        </div>
      </div>

      {/* Parallel Work Status */}
      {(parallelWork.displayRepairRequired || parallelWork.batteryBoostRequired ||
        parallelWork.l3RepairRequired || parallelWork.paintRequired) && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Parallel Work Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {parallelWork.displayRepairRequired && (
              <div className={`p-3 rounded border ${parallelWork.displayRepairCompleted
                ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Monitor size={16} />
                  <span className="font-medium text-sm">Display</span>
                </div>
                <span className={`text-xs ${parallelWork.displayRepairCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                  {parallelWork.displayRepairCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>
            )}
            {parallelWork.batteryBoostRequired && (
              <div className={`p-3 rounded border ${parallelWork.batteryBoostCompleted
                ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Battery size={16} />
                  <span className="font-medium text-sm">Battery</span>
                </div>
                <span className={`text-xs ${parallelWork.batteryBoostCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                  {parallelWork.batteryBoostCompleted ? 'Completed' : 'Pending'}
                </span>
                {parallelWork.batteryBoostJobs[0]?.finalCapacity && (
                  <div className="text-xs text-gray-500 mt-1">
                    Final: {parallelWork.batteryBoostJobs[0].finalCapacity}
                  </div>
                )}
              </div>
            )}
            {parallelWork.l3RepairRequired && (
              <div className={`p-3 rounded border ${parallelWork.l3RepairCompleted
                ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Cpu size={16} />
                  <span className="font-medium text-sm">L3 Repair</span>
                </div>
                <span className={`text-xs ${parallelWork.l3RepairCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                  {parallelWork.l3RepairCompleted ? 'Completed' : 'Pending'}
                </span>
                {parallelWork.l3RepairJobs.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {parallelWork.l3RepairJobs.map(j => j.issueType.replace('_', ' ')).join(', ')}
                  </div>
                )}
              </div>
            )}
            {parallelWork.paintRequired && (
              <div className={`p-3 rounded border ${parallelWork.paintCompleted
                ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Paintbrush size={16} />
                  <span className="font-medium text-sm">Paint</span>
                </div>
                <span className={`text-xs ${parallelWork.paintCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                  {parallelWork.paintCompleted ? 'Completed' : `${parallelWork.paintPanels.length} panels`}
                </span>
              </div>
            )}
          </div>
          {parallelWorkErrors.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <AlertTriangle size={14} className="inline mr-1" />
              {parallelWorkErrors.join('; ')}
            </div>
          )}
        </div>
      )}

      {/* Inspection Checklist */}
      <div className="bg-white rounded-lg shadow">
        <div
          className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => setShowChecklist(!showChecklist)}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Inspection Checklist</h2>
            <div className="flex gap-3 text-sm">
              <span className="text-green-600">
                <CheckCircle size={14} className="inline mr-1" />
                {passCount}
              </span>
              <span className="text-red-600">
                <XCircle size={14} className="inline mr-1" />
                {failCount}
              </span>
              <span className="text-gray-500">
                <MinusCircle size={14} className="inline mr-1" />
                {naCount}
              </span>
              {pendingCount > 0 && (
                <span className="text-yellow-600 font-medium">
                  <AlertTriangle size={14} className="inline mr-1" />
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>
          {showChecklist ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {showChecklist && (
          <div className="divide-y max-h-96 overflow-y-auto">
            {checklistItems.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No checklist items found for this device.
              </div>
            ) : (
              checklistItems.map((item) => {
                const isUpdating = updatingItemId === item.id
                return (
                  <div
                    key={item.id}
                    className={`p-3 flex items-start gap-3 ${
                      item.status === 'PASS' ? 'bg-green-50' :
                      item.status === 'FAIL' ? 'bg-red-50' :
                      item.status === 'NOT_APPLICABLE' ? 'bg-gray-50' : 'bg-yellow-50'
                    } ${isUpdating ? 'opacity-50' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-800">
                          <span className="text-gray-400 mr-1">{item.itemIndex}.</span>
                          {item.itemText}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Toggle buttons */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id, 'PASS')}
                            disabled={isUpdating || item.status === 'PASS'}
                            className={`p-1 rounded transition-colors ${
                              item.status === 'PASS'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Mark as Pass"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id, 'FAIL')}
                            disabled={isUpdating || item.status === 'FAIL'}
                            className={`p-1 rounded transition-colors ${
                              item.status === 'FAIL'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Mark as Fail"
                          >
                            <XCircle size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id, 'NOT_APPLICABLE')}
                            disabled={isUpdating || item.status === 'NOT_APPLICABLE'}
                            className={`p-1 rounded transition-colors ${
                              item.status === 'NOT_APPLICABLE'
                                ? 'bg-gray-500 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Mark as N/A"
                          >
                            <MinusCircle size={14} />
                          </button>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">Note: {item.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {getStageLabel(item.checkedAtStage)}
                        {item.checkedBy && ` by ${item.checkedBy.name}`}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Validation Warnings */}
      {(pendingCount > 0 || parallelWorkErrors.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-800 flex items-center gap-2 mb-2">
            <AlertTriangle size={18} />
            Cannot Pass QC
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {pendingCount > 0 && (
              <li>• {pendingCount} checklist item(s) are still PENDING</li>
            )}
            {parallelWorkErrors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Remarks */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">QC Remarks</h2>
        <textarea
          name="remarks"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Add any observations, notes, or issues found during QC..."
        />
      </div>

      {/* Final Decision */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Final Decision</h2>

        <div className="flex gap-6">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="decision"
              value="PASSED"
              className="peer sr-only"
              required
              onChange={() => setDecision('PASSED')}
              disabled={!canPass}
            />
            <div className={`p-4 border-2 rounded-lg text-center transition-all ${
              canPass
                ? 'border-gray-200 peer-checked:border-green-500 peer-checked:bg-green-50 cursor-pointer'
                : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
            }`}>
              <CheckCircle className={`mx-auto mb-2 ${canPass ? 'text-green-600' : 'text-gray-400'}`} size={32} />
              <span className={`font-bold ${canPass ? 'text-green-700' : 'text-gray-500'}`}>QC PASSED</span>
              {!canPass && (
                <p className="text-xs text-gray-500 mt-1">Resolve pending items first</p>
              )}
            </div>
          </label>

          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="decision"
              value="FAILED"
              className="peer sr-only"
              onChange={() => setDecision('FAILED')}
            />
            <div className="p-4 border-2 border-gray-200 rounded-lg peer-checked:border-red-500 peer-checked:bg-red-50 text-center transition-all">
              <XCircle className="mx-auto mb-2 text-red-600" size={32} />
              <span className="font-bold text-red-700">FAILED - REWORK</span>
            </div>
          </label>
        </div>

        {decision === 'PASSED' && canPass && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Final Grade *</label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="grade" value="A" className="text-blue-600 focus:ring-blue-500" required />
                <span className="font-bold">Grade A</span>
                <span className="text-xs text-gray-500">(Excellent condition)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="grade" value="B" className="text-blue-600 focus:ring-blue-500" />
                <span className="font-bold">Grade B</span>
                <span className="text-xs text-gray-500">(Good condition)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <a href="/qc" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending || !decision}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isPending ? 'Submitting...' : 'Submit QC Result'}
        </button>
      </div>
    </form>
  )
}
