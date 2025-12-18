'use client'

import { Printer } from 'lucide-react'
import { generateDeviceLabel, generateBatchLabels, printPDF, downloadPDF } from '@/lib/barcode'

interface Device {
  barcode: string
  category: string
  brand: string
  model: string
  cpu?: string | null
  ram?: string | null
  ssd?: string | null
  serial?: string | null
}

interface BarcodePrintButtonProps {
  devices: Device[]
  mode?: 'single' | 'batch'
  variant?: 'primary' | 'secondary' | 'icon'
  label?: string
}

export default function BarcodePrintButton({
  devices,
  mode = 'single',
  variant = 'secondary',
  label
}: BarcodePrintButtonProps) {

  const handlePrint = () => {
    try {
      let pdf

      if (mode === 'single' && devices.length === 1) {
        pdf = generateDeviceLabel(devices[0])
        printPDF(pdf)
      } else {
        pdf = generateBatchLabels(devices)
        printPDF(pdf)
      }
    } catch (error) {
      console.error('Error generating barcode:', error)
      alert('Failed to generate barcode label. Please try again.')
    }
  }

  const handleDownload = () => {
    try {
      let pdf
      let filename

      if (mode === 'single' && devices.length === 1) {
        pdf = generateDeviceLabel(devices[0])
        filename = `label-${devices[0].barcode}.pdf`
      } else {
        pdf = generateBatchLabels(devices)
        filename = `labels-batch-${new Date().getTime()}.pdf`
      }

      downloadPDF(pdf, filename)
    } catch (error) {
      console.error('Error downloading barcode:', error)
      alert('Failed to download barcode label. Please try again.')
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handlePrint}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        title="Print Barcode Label"
      >
        <Printer size={18} />
      </button>
    )
  }

  const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
  const variantClasses = variant === 'primary'
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : "bg-card text-foreground border border-default hover:bg-muted"

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePrint}
        className={`${baseClasses} ${variantClasses}`}
      >
        <Printer size={18} />
        {label || (mode === 'single' ? 'Print Label' : `Print ${devices.length} Labels`)}
      </button>
      <button
        onClick={handleDownload}
        className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-sm transition-colors"
        title="Download PDF"
      >
        Download
      </button>
    </div>
  )
}
