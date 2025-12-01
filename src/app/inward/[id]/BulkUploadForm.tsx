'use client'

import { useState } from 'react'
import { Upload, Download, X, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

interface BulkUploadFormProps {
  batchId: string
  onUpload: (devices: any[]) => Promise<{ success: number; failed: number; errors: any[] }>
}

export default function BulkUploadForm({ batchId, onUpload }: BulkUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: any[] } | null>(null)
  const [showModal, setShowModal] = useState(false)

  const downloadTemplate = () => {
    const template = [
      {
        'Category': 'LAPTOP',
        'Brand': 'Dell',
        'Model': 'Latitude 7490',
        'CPU': 'i5-8350U',
        'RAM': '16GB',
        'SSD': '256GB',
        'GPU': 'Intel UHD 620',
        'Screen Size': '14 inch',
        'Serial Number': 'ABC123XYZ'
      },
      {
        'Category': 'DESKTOP',
        'Brand': 'HP',
        'Model': 'EliteDesk 800 G5',
        'CPU': 'i7-9700',
        'RAM': '32GB',
        'SSD': '512GB',
        'GPU': 'Intel UHD 630',
        'Screen Size': '',
        'Serial Number': 'DEF456UVW'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Devices')

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Category
      { wch: 15 }, // Brand
      { wch: 20 }, // Model
      { wch: 15 }, // CPU
      { wch: 10 }, // RAM
      { wch: 10 }, // SSD
      { wch: 20 }, // GPU
      { wch: 12 }, // Screen Size
      { wch: 20 }  // Serial Number
    ]

    XLSX.writeFile(wb, 'device_upload_template.xlsx')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Map Excel column names to our expected format
      const devices = jsonData.map((row: any) => ({
        category: row['Category'] || row['category'],
        brand: row['Brand'] || row['brand'],
        model: row['Model'] || row['model'],
        cpu: row['CPU'] || row['cpu'],
        ram: row['RAM'] || row['ram'],
        ssd: row['SSD'] || row['ssd'],
        gpu: row['GPU'] || row['gpu'],
        screenSize: row['Screen Size'] || row['screenSize'] || row['screen_size'],
        serial: row['Serial Number'] || row['serial'] || row['serial_number']
      }))

      const uploadResult = await onUpload(devices)
      setResult(uploadResult)

      if (uploadResult.failed === 0) {
        setFile(null)
        setTimeout(() => {
          setShowModal(false)
          setResult(null)
        }, 3000)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to process file. Please ensure it matches the template format.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        <Upload size={18} />
        Bulk Upload
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Bulk Upload Devices</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Download className="text-blue-600 mt-1" size={20} />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">Step 1: Download Template</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Download the Excel template, fill in your device details, and upload it back.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload File */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Step 2: Upload Filled Template</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {file ? file.name : 'Click to select Excel file (.xlsx, .xls, .csv)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Devices'}
              </button>

              {/* Results */}
              {result && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={20} />
                        <span className="font-medium">Success: {result.success}</span>
                      </div>
                    </div>
                    {result.failed > 0 && (
                      <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertCircle size={20} />
                          <span className="font-medium">Failed: {result.failed}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Details */}
                  {result.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.errors.map((err, idx) => (
                          <div key={idx} className="text-sm text-red-700 bg-white p-2 rounded">
                            <span className="font-medium">Row {err.row}:</span> {err.error}
                            <div className="text-xs text-red-600 mt-1">
                              {err.data.brand} {err.data.model} ({err.data.category})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Category must be: LAPTOP, DESKTOP, or WORKSTATION</li>
                  <li>Brand and Model are required fields</li>
                  <li>CPU, RAM, SSD, GPU, Screen Size, and Serial Number are optional</li>
                  <li>Keep the same column headers as in the template</li>
                  <li>Each row represents one device</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
