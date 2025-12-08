'use client'

import { useState } from 'react'
import { Upload, Download, X, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useToast } from '@/components/ui/Toast'

interface BulkUploadFormProps {
  batchId: string
  onUpload: (devices: any[]) => Promise<{ success: number; failed: number; errors: any[] }>
}

export default function BulkUploadForm({ batchId, onUpload }: BulkUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: any[] } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const toast = useToast()

  const downloadTemplate = () => {
    // Create separate sheets for different device types
    const wb = XLSX.utils.book_new()

    // Laptop/Desktop/Workstation template
    const computersTemplate = [
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
      },
      {
        'Category': 'WORKSTATION',
        'Brand': 'Dell',
        'Model': 'Precision 5820',
        'CPU': 'Xeon W-2245',
        'RAM': '64GB ECC',
        'SSD': '1TB NVMe',
        'GPU': 'NVIDIA Quadro RTX 4000',
        'Screen Size': '',
        'Serial Number': 'GHI789RST'
      }
    ]
    const wsComputers = XLSX.utils.json_to_sheet(computersTemplate)
    wsComputers['!cols'] = [
      { wch: 14 }, { wch: 15 }, { wch: 22 }, { wch: 18 },
      { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(wb, wsComputers, 'Computers')

    // Server template
    const serverTemplate = [
      {
        'Category': 'SERVER',
        'Brand': 'HPE',
        'Model': 'ProLiant DL380 Gen10',
        'Form Factor': '2U rack',
        'CPU': '2x Xeon Silver 4210',
        'RAM': '64GB DDR4',
        'SSD': '2x 480GB SSD + 4x 2TB HDD',
        'RAID Controller': 'P408i-a, RAID 5',
        'Network Ports': '4x 1GbE + 2x 10GbE',
        'Serial Number': 'SRV001XYZ'
      }
    ]
    const wsServer = XLSX.utils.json_to_sheet(serverTemplate)
    wsServer['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 12 },
      { wch: 22 }, { wch: 15 }, { wch: 28 }, { wch: 20 },
      { wch: 25 }, { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(wb, wsServer, 'Servers')

    // Monitor template
    const monitorTemplate = [
      {
        'Category': 'MONITOR',
        'Brand': 'Dell',
        'Model': 'P2419H',
        'Monitor Size': '24 inch',
        'Resolution': '1920x1080',
        'Panel Type': 'IPS',
        'Refresh Rate': '75Hz',
        'Monitor Ports': 'HDMI + DisplayPort + VGA',
        'Serial Number': 'MON001ABC'
      }
    ]
    const wsMonitor = XLSX.utils.json_to_sheet(monitorTemplate)
    wsMonitor['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(wb, wsMonitor, 'Monitors')

    // Storage template
    const storageTemplate = [
      {
        'Category': 'STORAGE',
        'Brand': 'Samsung',
        'Model': '870 EVO',
        'Storage Type': 'SSD',
        'Capacity': '1TB',
        'Storage Form Factor': '2.5"',
        'Interface': 'SATA',
        'RPM': '',
        'Serial Number': 'STG001DEF'
      },
      {
        'Category': 'STORAGE',
        'Brand': 'Seagate',
        'Model': 'Exos X18',
        'Storage Type': 'HDD',
        'Capacity': '18TB',
        'Storage Form Factor': '3.5"',
        'Interface': 'SAS',
        'RPM': '7200 RPM',
        'Serial Number': 'STG002GHI'
      }
    ]
    const wsStorage = XLSX.utils.json_to_sheet(storageTemplate)
    wsStorage['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 14 },
      { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(wb, wsStorage, 'Storage')

    // Networking Card template
    const nicTemplate = [
      {
        'Category': 'NETWORKING_CARD',
        'Brand': 'Intel',
        'Model': 'X710-DA2',
        'NIC Speed': '10GbE',
        'Port Count': '2-port',
        'Connector Type': 'SFP+',
        'NIC Interface': 'PCIe x8',
        'Bracket Type': 'Full Height',
        'Serial Number': 'NIC001JKL'
      }
    ]
    const wsNIC = XLSX.utils.json_to_sheet(nicTemplate)
    wsNIC['!cols'] = [
      { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(wb, wsNIC, 'Networking Cards')

    // Instructions sheet
    const instructions = [
      { 'Instructions': 'DEVICE BULK UPLOAD TEMPLATE' },
      { 'Instructions': '' },
      { 'Instructions': 'Each sheet contains examples for different device categories.' },
      { 'Instructions': 'You can use any sheet to upload devices - the system will read from the first sheet.' },
      { 'Instructions': '' },
      { 'Instructions': 'VALID CATEGORIES:' },
      { 'Instructions': '- LAPTOP, DESKTOP, WORKSTATION (use Computers sheet)' },
      { 'Instructions': '- SERVER (use Servers sheet)' },
      { 'Instructions': '- MONITOR (use Monitors sheet)' },
      { 'Instructions': '- STORAGE (use Storage sheet)' },
      { 'Instructions': '- NETWORKING_CARD (use Networking Cards sheet)' },
      { 'Instructions': '' },
      { 'Instructions': 'REQUIRED FIELDS (all categories):' },
      { 'Instructions': '- Category, Brand, Model' },
      { 'Instructions': '' },
      { 'Instructions': 'OPTIONAL FIELDS vary by category - see examples in each sheet.' },
      { 'Instructions': '' },
      { 'Instructions': 'TIP: Copy data into the appropriate sheet and remove example rows.' }
    ]
    const wsInstructions = XLSX.utils.json_to_sheet(instructions)
    wsInstructions['!cols'] = [{ wch: 70 }]
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')

    XLSX.writeFile(wb, 'device_upload_template.xlsx')
    toast.info('Template downloaded - check all sheets for different device types')
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

      // Map Excel column names to our expected format - supporting all device categories
      const devices = jsonData.map((row: any) => ({
        // Common fields
        category: row['Category'] || row['category'],
        brand: row['Brand'] || row['brand'],
        model: row['Model'] || row['model'],
        serial: row['Serial Number'] || row['serial'] || row['serial_number'],

        // Computer fields (Laptop/Desktop/Workstation)
        cpu: row['CPU'] || row['cpu'],
        ram: row['RAM'] || row['ram'],
        ssd: row['SSD'] || row['ssd'],
        gpu: row['GPU'] || row['gpu'],
        screenSize: row['Screen Size'] || row['screenSize'] || row['screen_size'],

        // Server fields
        formFactor: row['Form Factor'] || row['formFactor'] || row['form_factor'],
        raidController: row['RAID Controller'] || row['raidController'] || row['raid_controller'],
        networkPorts: row['Network Ports'] || row['networkPorts'] || row['network_ports'],

        // Monitor fields
        monitorSize: row['Monitor Size'] || row['monitorSize'] || row['monitor_size'],
        resolution: row['Resolution'] || row['resolution'],
        panelType: row['Panel Type'] || row['panelType'] || row['panel_type'],
        refreshRate: row['Refresh Rate'] || row['refreshRate'] || row['refresh_rate'],
        monitorPorts: row['Monitor Ports'] || row['monitorPorts'] || row['monitor_ports'],

        // Storage fields
        storageType: row['Storage Type'] || row['storageType'] || row['storage_type'],
        capacity: row['Capacity'] || row['capacity'],
        storageFormFactor: row['Storage Form Factor'] || row['storageFormFactor'] || row['storage_form_factor'],
        interface: row['Interface'] || row['interface'],
        rpm: row['RPM'] || row['rpm'],

        // Networking card fields
        nicSpeed: row['NIC Speed'] || row['nicSpeed'] || row['nic_speed'],
        portCount: row['Port Count'] || row['portCount'] || row['port_count'],
        connectorType: row['Connector Type'] || row['connectorType'] || row['connector_type'],
        nicInterface: row['NIC Interface'] || row['nicInterface'] || row['nic_interface'],
        bracketType: row['Bracket Type'] || row['bracketType'] || row['bracket_type']
      }))

      const uploadResult = await onUpload(devices)
      setResult(uploadResult)

      if (uploadResult.failed === 0) {
        setFile(null)
        toast.success(`Successfully uploaded ${uploadResult.success} device(s)`)
        setTimeout(() => {
          setShowModal(false)
          setResult(null)
        }, 2000)
      } else if (uploadResult.success > 0) {
        toast.warning(`Uploaded ${uploadResult.success} device(s), ${uploadResult.failed} failed`)
      } else {
        toast.error(`All ${uploadResult.failed} device(s) failed to upload`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to process file. Please ensure it matches the template format.')
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
                  <li>Valid categories: LAPTOP, DESKTOP, WORKSTATION, SERVER, MONITOR, STORAGE, NETWORKING_CARD</li>
                  <li>Brand and Model are required for all device types</li>
                  <li>The template has separate sheets for each device type with appropriate fields</li>
                  <li>Use the first sheet in your uploaded file for data</li>
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
