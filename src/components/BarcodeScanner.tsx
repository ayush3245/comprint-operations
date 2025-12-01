'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, X, Loader2, ScanLine } from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/library'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onClose?: () => void
}

export default function BarcodeScanner({ onBarcodeDetected, onClose }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scanImageForBarcode = async (img: HTMLImageElement): Promise<string | null> => {
    try {
      // First try: Direct scan
      const codeReader = new BrowserMultiFormatReader()
      try {
        const result = await codeReader.decodeFromImageElement(img)
        if (result) return result.getText()
      } catch (err) {
        console.log('Direct scan failed, trying with image enhancement...')
      }

      // Second try: Enhance image contrast and try again
      const enhancedCanvas = document.createElement('canvas')
      const ctx = enhancedCanvas.getContext('2d')
      if (!ctx) return null

      enhancedCanvas.width = img.width
      enhancedCanvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Get image data and enhance contrast
      const imageData = ctx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height)
      const data = imageData.data

      // Increase contrast
      const contrast = 50
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128       // Red
        data[i + 1] = factor * (data[i + 1] - 128) + 128 // Green
        data[i + 2] = factor * (data[i + 2] - 128) + 128 // Blue
      }

      ctx.putImageData(imageData, 0, 0)

      // Try scanning enhanced image
      const enhancedImg = new Image()
      enhancedImg.src = enhancedCanvas.toDataURL()

      await new Promise((resolve) => {
        enhancedImg.onload = resolve
      })

      const result = await codeReader.decodeFromImageElement(enhancedImg)
      return result ? result.getText() : null
    } catch (err) {
      console.error('Barcode decode error:', err)
      return null
    }
  }

  const handlePDFUpload = async (file: File) => {
    try {
      const pdfjsLib = await import('pdfjs-dist')

      // Set worker source to use local copy from node_modules
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      }).promise

      // Try to scan each page with multiple scales for better detection
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)

        // Try different scales to improve barcode detection - much higher scales
        const scales = [6.0, 5.0, 4.0, 3.0]

        for (const scale of scales) {
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) continue

          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          } as any).promise

          // Try to detect barcode from canvas
          const img = new Image()
          img.src = canvas.toDataURL()

          await new Promise((resolve) => {
            img.onload = resolve
          })

          const barcode = await scanImageForBarcode(img)
          if (barcode) {
            onBarcodeDetected(barcode)
            setScanning(false)
            return
          }
        }
      }

      setError('No barcode detected in the PDF. Please try another file or enter manually.')
      setScanning(false)
    } catch (err) {
      console.error('PDF processing error:', err)
      setError('Failed to process PDF. Please try again.')
      setScanning(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setScanning(true)
    setError(null)

    // Check if file is PDF
    if (file.type === 'application/pdf') {
      await handlePDFUpload(file)
      return
    }

    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const imageData = e.target?.result as string
          const img = new Image()

          img.onload = async () => {
            const barcode = await scanImageForBarcode(img)
            if (barcode) {
              onBarcodeDetected(barcode)
              setScanning(false)
            } else {
              setError('No barcode detected in the image. Please try again or enter manually.')
              setScanning(false)
            }
          }

          img.onerror = () => {
            setError('Failed to load image. Please try again.')
            setScanning(false)
          }

          img.src = imageData
        } catch (err) {
          console.error('Image processing error:', err)
          setError('Failed to process image. Please try again.')
          setScanning(false)
        }
      }

      reader.onerror = () => {
        setError('Failed to read file. Please try again.')
        setScanning(false)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      console.error('File upload error:', err)
      setError('Failed to upload file. Please try again.')
      setScanning(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      onBarcodeDetected(manualInput.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-2">
            <ScanLine className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Scan Barcode</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Image Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Upload Barcode Image</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleImageUpload}
                className="hidden"
                disabled={scanning}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="flex flex-col items-center gap-2 mx-auto"
              >
                {scanning ? (
                  <>
                    <Loader2 size={32} className="text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">Scanning barcode...</span>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload barcode image
                    </span>
                    <span className="text-xs text-gray-500">
                      Supports: JPG, PNG, PDF, or any image format
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Or Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Manual Input Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Enter Barcode Manually</h3>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g., L-DEL-1234"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={scanning}
              />
              <button
                type="submit"
                disabled={!manualInput.trim() || scanning}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Barcode
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure the barcode is well-lit and in focus</li>
              <li>Capture the entire barcode in the image</li>
              <li>Avoid glare or shadows on the barcode</li>
              <li>PDF files: Scans all pages automatically</li>
              <li>Use manual entry if scanning fails</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
