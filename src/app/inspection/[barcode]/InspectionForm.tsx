'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp, Paintbrush } from 'lucide-react'
import type { DeviceCategory } from '@prisma/client'
import type { ChecklistItemDefinition } from '@/lib/checklist-definitions'

type ChecklistStatus = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'PENDING'

interface ChecklistItemState {
  itemIndex: number
  itemText: string
  status: ChecklistStatus
  notes: string
  notesPlaceholder?: string
}

interface InspectionFormProps {
  deviceId: string
  userId: string
  deviceBarcode: string
  deviceBrand: string
  deviceModel: string
  deviceCategory: DeviceCategory
  checklistItems: ChecklistItemDefinition[]
  onSubmit: (deviceId: string, data: {
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
  }) => Promise<{ nextStatus: string }>
}

export default function InspectionForm({
  deviceId,
  userId,
  deviceBarcode,
  deviceBrand,
  deviceModel,
  deviceCategory,
  checklistItems,
  onSubmit
}: InspectionFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()
  const [showAllItems, setShowAllItems] = useState(true)

  // Initialize checklist state from definitions
  const [items, setItems] = useState<ChecklistItemState[]>(() =>
    checklistItems.map(item => ({
      itemIndex: item.index,
      itemText: item.text,
      status: 'PENDING' as ChecklistStatus,
      notes: '',
      notesPlaceholder: item.notesPlaceholder
    }))
  )

  const [sparesRequired, setSparesRequired] = useState('')
  const [overallNotes, setOverallNotes] = useState('')
  const [showPaintSection, setShowPaintSection] = useState(false)

  // Paint panel options
  const paintPanelOptions = [
    'Top Cover',
    'Bottom Cover',
    'Palm Rest',
    'Bezel',
    'Hinge Covers',
    'Side Panels'
  ]
  const [selectedPaintPanels, setSelectedPaintPanels] = useState<string[]>([])

  const togglePaintPanel = (panel: string) => {
    setSelectedPaintPanels(prev =>
      prev.includes(panel)
        ? prev.filter(p => p !== panel)
        : [...prev, panel]
    )
  }

  const updateItemStatus = (index: number, status: ChecklistStatus) => {
    setItems(prev => prev.map(item =>
      item.itemIndex === index ? { ...item, status } : item
    ))
  }

  const updateItemNotes = (index: number, notes: string) => {
    setItems(prev => prev.map(item =>
      item.itemIndex === index ? { ...item, notes } : item
    ))
  }

  const setAllStatus = (status: ChecklistStatus) => {
    setItems(prev => prev.map(item => ({ ...item, status })))
  }

  const pendingCount = items.filter(i => i.status === 'PENDING').length
  const passCount = items.filter(i => i.status === 'PASS').length
  const failCount = items.filter(i => i.status === 'FAIL').length
  const naCount = items.filter(i => i.status === 'NOT_APPLICABLE').length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all items are checked
    if (pendingCount > 0) {
      toast.error(`Please check all items. ${pendingCount} item(s) still pending.`)
      return
    }

    const submissionItems = items.map(item => ({
      itemIndex: item.itemIndex,
      itemText: item.itemText,
      status: item.status as 'PASS' | 'FAIL' | 'NOT_APPLICABLE',
      notes: item.notes || undefined
    }))

    startTransition(async () => {
      try {
        const result = await onSubmit(deviceId, {
          inspectionEngId: userId,
          checklistItems: submissionItems,
          sparesRequired,
          overallNotes: overallNotes || undefined,
          paintPanels: selectedPaintPanels
        })

        // Build details array
        const details: Array<{ label: string; value: string }> = [
          { label: 'Barcode', value: deviceBarcode },
          { label: 'Device', value: `${deviceBrand} ${deviceModel}` },
          { label: 'Category', value: deviceCategory },
          { label: 'Results', value: `${passCount} Pass, ${failCount} Fail, ${naCount} N/A` }
        ]
        if (sparesRequired) {
          details.push({ label: 'Spares Required', value: sparesRequired })
        }
        if (selectedPaintPanels.length > 0) {
          details.push({ label: 'Paint Panels', value: selectedPaintPanels.join(', ') })
        }
        details.push({
          label: 'Next Step',
          value: result.nextStatus === 'AWAITING_QC' ? 'QC' : 'L2 Repair'
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

  const getStatusIcon = (status: ChecklistStatus) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="text-green-600" size={20} />
      case 'FAIL':
        return <XCircle className="text-red-600" size={20} />
      case 'NOT_APPLICABLE':
        return <MinusCircle className="text-gray-400" size={20} />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusBgColor = (status: ChecklistStatus) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-50 border-green-200'
      case 'FAIL':
        return 'bg-red-50 border-red-200'
      case 'NOT_APPLICABLE':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Summary Bar */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Progress: </span>
            <span className="text-gray-900">{items.length - pendingCount}/{items.length}</span>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">
              <CheckCircle className="inline mr-1" size={16} />
              {passCount}
            </span>
            <span className="text-red-600">
              <XCircle className="inline mr-1" size={16} />
              {failCount}
            </span>
            <span className="text-gray-500">
              <MinusCircle className="inline mr-1" size={16} />
              {naCount}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAllStatus('PASS')}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            All Pass
          </button>
          <button
            type="button"
            onClick={() => setAllStatus('PENDING')}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="bg-white rounded-lg shadow">
        <div
          className="p-4 border-b flex items-center justify-between cursor-pointer"
          onClick={() => setShowAllItems(!showAllItems)}
        >
          <h2 className="text-lg font-semibold">
            {deviceCategory} Inspection Checklist
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({items.length} items)
            </span>
          </h2>
          {showAllItems ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {showAllItems && (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.itemIndex}
                className={`p-4 ${getStatusBgColor(item.status)} transition-colors`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-sm font-medium text-gray-500">
                      {item.itemIndex}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">{item.itemText}</p>
                    {/* Notes field - show if item has placeholder or if failed */}
                    {(item.notesPlaceholder || item.status === 'FAIL') && (
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateItemNotes(item.itemIndex, e.target.value)}
                        placeholder={item.notesPlaceholder || 'Add notes about the issue...'}
                        className="mt-2 w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateItemStatus(item.itemIndex, 'PASS')}
                      className={`p-2 rounded-lg transition-colors ${
                        item.status === 'PASS'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title="Pass"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItemStatus(item.itemIndex, 'FAIL')}
                      className={`p-2 rounded-lg transition-colors ${
                        item.status === 'FAIL'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title="Fail"
                    >
                      <XCircle size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItemStatus(item.itemIndex, 'NOT_APPLICABLE')}
                      className={`p-2 rounded-lg transition-colors ${
                        item.status === 'NOT_APPLICABLE'
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Not Applicable"
                    >
                      <MinusCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spares Requirement */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Spares Requirement</h2>
        <textarea
          value={sparesRequired}
          onChange={(e) => setSparesRequired(e.target.value)}
          rows={2}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="List required spares (Part Codes). Leave empty if none."
        />
      </div>

      {/* Paint Panel Selection */}
      <div className="bg-white rounded-lg shadow">
        <div
          className="p-4 border-b flex items-center justify-between cursor-pointer"
          onClick={() => setShowPaintSection(!showPaintSection)}
        >
          <div className="flex items-center gap-2">
            <Paintbrush size={20} className="text-orange-600" />
            <h2 className="text-lg font-semibold">
              Paint Required
              {selectedPaintPanels.length > 0 && (
                <span className="ml-2 text-sm font-normal text-orange-600">
                  ({selectedPaintPanels.length} panel{selectedPaintPanels.length !== 1 ? 's' : ''} selected)
                </span>
              )}
            </h2>
          </div>
          {showPaintSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {showPaintSection && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Select panels that need painting. Leave unchecked if no painting is required.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paintPanelOptions.map(panel => (
                <label
                  key={panel}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPaintPanels.includes(panel)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPaintPanels.includes(panel)}
                    onChange={() => togglePaintPanel(panel)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className={selectedPaintPanels.includes(panel) ? 'font-medium text-orange-700' : 'text-gray-700'}>
                    {panel}
                  </span>
                </label>
              ))}
            </div>
            {selectedPaintPanels.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Selected for painting:</strong> {selectedPaintPanels.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overall Notes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Additional Notes</h2>
        <textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional observations or notes about this device..."
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4">
        <a
          href="/inspection"
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending || pendingCount > 0}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          <CheckCircle size={20} />
          <span>
            {isPending
              ? 'Submitting...'
              : pendingCount > 0
              ? `Check ${pendingCount} more items`
              : 'Submit Inspection'}
          </span>
        </button>
      </div>
    </form>
  )
}
