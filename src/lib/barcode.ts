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
 */
export function generateDeviceLabel(device: DeviceData): jsPDF {
  // Create PDF with custom dimensions (100mm x 50mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [50, 100]
  })

  // Generate barcode as SVG
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, device.barcode, {
    format: 'CODE128',
    width: 2,
    height: 40,
    displayValue: true,
    fontSize: 14,
    margin: 5
  })

  // Add barcode image to PDF
  const barcodeImage = canvas.toDataURL('image/png')
  pdf.addImage(barcodeImage, 'PNG', 10, 5, 80, 20)

  // Add device information
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${device.brand} ${device.model}`, 50, 32, { align: 'center' })

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(device.category, 50, 37, { align: 'center' })

  // Add specifications if available
  const specs = []
  if (device.cpu) specs.push(device.cpu)
  if (device.ram) specs.push(device.ram)
  if (device.ssd) specs.push(device.ssd)

  if (specs.length > 0) {
    pdf.setFontSize(7)
    pdf.text(specs.join(' • '), 50, 42, { align: 'center' })
  }

  // Add serial number if available
  if (device.serial) {
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'italic')
    pdf.text(`S/N: ${device.serial}`, 50, 47, { align: 'center' })
  }

  return pdf
}

/**
 * Generate barcode labels for multiple devices in a single PDF
 * 2 labels per page (sticker sheet format)
 */
export function generateBatchLabels(devices: DeviceData[]): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let currentPage = 0
  let labelPosition = 0

  devices.forEach((device, index) => {
    // Add new page if needed (2 labels per page)
    if (labelPosition === 2) {
      pdf.addPage()
      currentPage++
      labelPosition = 0
    }

    // Calculate position (top or bottom half of page)
    const yOffset = labelPosition === 0 ? 20 : 150

    // Generate barcode
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, device.barcode, {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 14,
      margin: 5
    })

    const barcodeImage = canvas.toDataURL('image/png')

    // Add border for label
    pdf.setDrawColor(200)
    pdf.rect(15, yOffset - 5, 180, 60)

    // Add barcode
    pdf.addImage(barcodeImage, 'PNG', 25, yOffset, 160, 25)

    // Add device information
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${device.brand} ${device.model}`, 105, yOffset + 35, { align: 'center' })

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(device.category, 105, yOffset + 42, { align: 'center' })

    // Add specifications
    const specs = []
    if (device.cpu) specs.push(device.cpu)
    if (device.ram) specs.push(device.ram)
    if (device.ssd) specs.push(device.ssd)

    if (specs.length > 0) {
      pdf.setFontSize(8)
      pdf.text(specs.join(' • '), 105, yOffset + 48, { align: 'center' })
    }

    // Add serial number
    if (device.serial) {
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'italic')
      pdf.text(`Serial: ${device.serial}`, 105, yOffset + 53, { align: 'center' })
    }

    labelPosition++
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
