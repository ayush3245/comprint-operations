import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'

interface DeviceData {
  barcode: string
  category: string
  brand: string
  model: string
  cpu?: string | null
  ram?: string | null
  ssd?: string | null
  serial?: string | null
}

/**
 * Generate a barcode label PDF for a single device
 * Label dimensions: 100mm x 50mm (standard shipping label size)
 * Generates 2 identical labels per device on one page
 */
export function generateDeviceLabel(device: DeviceData): jsPDF {
  // Create PDF with A4 dimensions to fit 2 labels
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Generate 2 identical labels per device
  const labelOffsets = [20, 120] // Top and middle of page

  labelOffsets.forEach((yOffset) => {
    // Generate barcode without displayValue to prevent overlap
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, device.barcode, {
      format: 'CODE128',
      width: 3,
      height: 60,
      displayValue: false,
      margin: 5
    })

    const barcodeImage = canvas.toDataURL('image/png')

    // Add border for label (100mm x 45mm)
    pdf.setDrawColor(200)
    pdf.rect(55, yOffset - 5, 100, 45)

    // Add barcode image centered (80mm wide)
    pdf.addImage(barcodeImage, 'PNG', 65, yOffset, 80, 18)

    // Add barcode number below the barcode
    pdf.setFontSize(10)
    pdf.setFont('courier', 'bold')
    pdf.text(device.barcode, 105, yOffset + 22, { align: 'center' })

    // Add device information
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${device.brand} ${device.model}`, 105, yOffset + 28, { align: 'center' })

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(device.category, 105, yOffset + 33, { align: 'center' })

    // Add specifications if available
    const specs = []
    if (device.cpu) specs.push(device.cpu)
    if (device.ram) specs.push(device.ram)
    if (device.ssd) specs.push(device.ssd)

    if (specs.length > 0) {
      pdf.setFontSize(7)
      pdf.text(specs.join(' • '), 105, yOffset + 38, { align: 'center' })
    }
  })

  return pdf
}

/**
 * Generate barcode labels for multiple devices in a single PDF
 * 4 labels per page (2 devices x 2 copies each)
 * Label dimensions match individual labels for consistency
 */
export function generateBatchLabels(devices: DeviceData[]): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // 4 labels per page: 2 devices x 2 copies each
  // Vertical positions for 4 labels on A4
  const labelPositions = [15, 85, 155, 225]
  let currentLabelIndex = 0
  let isFirstPage = true

  devices.forEach((device) => {
    // Print 2 identical labels per device
    for (let copy = 0; copy < 2; copy++) {
      // Add new page if needed (4 labels per page)
      if (currentLabelIndex === 4) {
        pdf.addPage()
        currentLabelIndex = 0
        isFirstPage = false
      }

      const yOffset = labelPositions[currentLabelIndex]

      // Generate barcode without displayValue to prevent overlap
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, device.barcode, {
        format: 'CODE128',
        width: 3,
        height: 60,
        displayValue: false,
        margin: 5
      })

      const barcodeImage = canvas.toDataURL('image/png')

      // Add border for label (100mm x 45mm) - same as individual
      pdf.setDrawColor(200)
      pdf.rect(55, yOffset - 5, 100, 45)

      // Add barcode image centered (80mm wide) - same as individual
      pdf.addImage(barcodeImage, 'PNG', 65, yOffset, 80, 18)

      // Add barcode number below the barcode
      pdf.setFontSize(10)
      pdf.setFont('courier', 'bold')
      pdf.text(device.barcode, 105, yOffset + 22, { align: 'center' })

      // Add device information
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${device.brand} ${device.model}`, 105, yOffset + 28, { align: 'center' })

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(device.category, 105, yOffset + 33, { align: 'center' })

      // Add specifications
      const specs = []
      if (device.cpu) specs.push(device.cpu)
      if (device.ram) specs.push(device.ram)
      if (device.ssd) specs.push(device.ssd)

      if (specs.length > 0) {
        pdf.setFontSize(7)
        pdf.text(specs.join(' • '), 105, yOffset + 38, { align: 'center' })
      }

      currentLabelIndex++
    }
  })

  return pdf
}

/**
 * Client-side function to download the PDF
 */
export function downloadPDF(pdf: jsPDF, filename: string) {
  pdf.save(filename)
}

/**
 * Client-side function to print the PDF
 */
export function printPDF(pdf: jsPDF) {
  const pdfBlob = pdf.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)

  const printWindow = window.open(pdfUrl)
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print()
    })
  }
}
