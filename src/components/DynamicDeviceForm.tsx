'use client'

import { useState, useTransition } from 'react'
import { DeviceCategory } from '@prisma/client'
import { useToast } from './ui/Toast'

interface DynamicDeviceFormProps {
  onSubmit: (formData: FormData) => Promise<void>
  batchType: 'REFURB_PURCHASE' | 'RENTAL_RETURN'
}

// Device category configuration with their specific fields
const categoryConfig: Record<DeviceCategory, {
  label: string
  fields: Array<{
    name: string
    label: string
    placeholder: string
    required?: boolean
    type?: 'text' | 'select'
    options?: string[]
  }>
}> = {
  LAPTOP: {
    label: 'Laptop',
    fields: [
      { name: 'cpu', label: 'CPU', placeholder: 'e.g. i5-8350U' },
      { name: 'ram', label: 'RAM', placeholder: 'e.g. 16GB' },
      { name: 'ssd', label: 'Storage', placeholder: 'e.g. 256GB SSD' },
      { name: 'gpu', label: 'GPU', placeholder: 'e.g. Intel UHD 620' },
      { name: 'screenSize', label: 'Screen Size', placeholder: 'e.g. 14 inch' },
      { name: 'serial', label: 'Serial Number', placeholder: 'Optional' }
    ]
  },
  DESKTOP: {
    label: 'Desktop',
    fields: [
      { name: 'cpu', label: 'CPU', placeholder: 'e.g. i7-9700' },
      { name: 'ram', label: 'RAM', placeholder: 'e.g. 32GB' },
      { name: 'ssd', label: 'Storage', placeholder: 'e.g. 512GB SSD' },
      { name: 'gpu', label: 'GPU', placeholder: 'e.g. Intel UHD 630' },
      { name: 'serial', label: 'Serial Number', placeholder: 'Optional' }
    ]
  },
  WORKSTATION: {
    label: 'Workstation',
    fields: [
      { name: 'cpu', label: 'CPU', placeholder: 'e.g. Xeon W-2245' },
      { name: 'ram', label: 'RAM', placeholder: 'e.g. 64GB ECC' },
      { name: 'ssd', label: 'Storage', placeholder: 'e.g. 1TB NVMe' },
      { name: 'gpu', label: 'GPU', placeholder: 'e.g. NVIDIA Quadro RTX 4000' },
      { name: 'serial', label: 'Serial Number', placeholder: 'Optional' }
    ]
  },
  SERVER: {
    label: 'Server',
    fields: [
      { name: 'formFactor', label: 'Form Factor', placeholder: 'e.g. 1U rack, 2U rack, Tower' },
      { name: 'cpu', label: 'CPU', placeholder: 'e.g. 2x Xeon Silver 4210' },
      { name: 'ram', label: 'RAM', placeholder: 'e.g. 64GB DDR4' },
      { name: 'ssd', label: 'Storage', placeholder: 'e.g. 2x 480GB SSD + 4x 2TB HDD' },
      { name: 'raidController', label: 'RAID / Controller', placeholder: 'e.g. P408i-a, RAID 5 (Optional)' },
      { name: 'networkPorts', label: 'Network Ports', placeholder: 'e.g. 4x 1GbE + 2x 10GbE (Optional)' },
      { name: 'serial', label: 'Serial Number', placeholder: 'Optional' }
    ]
  },
  MONITOR: {
    label: 'Monitor',
    fields: [
      { name: 'monitorSize', label: 'Size', placeholder: 'e.g. 24 inch' },
      { name: 'resolution', label: 'Resolution', placeholder: 'e.g. 1920x1080' },
      { name: 'panelType', label: 'Panel Type', placeholder: 'e.g. IPS, TN, VA (Optional)' },
      { name: 'refreshRate', label: 'Refresh Rate', placeholder: 'e.g. 75Hz (Optional)' },
      { name: 'monitorPorts', label: 'Ports', placeholder: 'e.g. HDMI + DisplayPort + VGA (Optional)' },
      { name: 'serial', label: 'Serial Number', placeholder: 'Optional' }
    ]
  },
  STORAGE: {
    label: 'Storage (HDD/SSD/NVMe)',
    fields: [
      { name: 'storageType', label: 'Type', placeholder: 'Select type', type: 'select', options: ['HDD', 'SSD', 'NVMe'] },
      { name: 'capacity', label: 'Capacity', placeholder: 'e.g. 1TB, 500GB' },
      { name: 'storageFormFactor', label: 'Form Factor', placeholder: 'e.g. 2.5", 3.5", M.2' },
      { name: 'interface', label: 'Interface', placeholder: 'e.g. SATA, SAS, PCIe Gen4' },
      { name: 'rpm', label: 'RPM', placeholder: 'e.g. 7200 RPM (HDD only, Optional)' },
      { name: 'serial', label: 'Serial Number', placeholder: 'Optional' }
    ]
  },
  NETWORKING_CARD: {
    label: 'Networking Card (NIC)',
    fields: [
      { name: 'nicSpeed', label: 'Speed', placeholder: 'e.g. 10GbE, 25GbE' },
      { name: 'portCount', label: 'Port Count', placeholder: 'e.g. 2-port, 4-port' },
      { name: 'connectorType', label: 'Connector Type', placeholder: 'e.g. RJ45, SFP+, QSFP+' },
      { name: 'nicInterface', label: 'Interface', placeholder: 'e.g. PCIe x8' },
      { name: 'bracketType', label: 'Bracket Type', placeholder: 'e.g. Low Profile / Full Height (Optional)' },
      { name: 'serial', label: 'Serial Number / Part Number', placeholder: 'Optional' }
    ]
  }
}

export default function DynamicDeviceForm({ onSubmit, batchType }: DynamicDeviceFormProps) {
  const [category, setCategory] = useState<DeviceCategory>('LAPTOP')
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const currentConfig = categoryConfig[category]

  const handleSubmit = async (formData: FormData) => {
    const brand = formData.get('brand') as string
    const model = formData.get('model') as string

    startTransition(async () => {
      try {
        await onSubmit(formData)
        toast.success('Device has been added to the batch and is ready for inspection.', {
          title: 'Device Added',
          details: [
            { label: 'Category', value: categoryConfig[category].label },
            { label: 'Brand', value: brand },
            { label: 'Model', value: model }
          ]
        })
        // Reset form
        const form = document.getElementById('device-form') as HTMLFormElement
        if (form) {
          // Keep the category selection but reset other fields
          const inputs = form.querySelectorAll('input')
          inputs.forEach(input => input.value = '')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to add device')
      }
    })
  }

  const inputClasses = "w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors"
  const selectClasses = "w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors"
  const labelClasses = "block text-sm font-medium text-foreground mb-1"

  return (
    <form id="device-form" action={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClasses}>Category</label>
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as DeviceCategory)}
          className={selectClasses}
        >
          {Object.entries(categoryConfig).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClasses}>Brand *</label>
        <input
          type="text"
          name="brand"
          required
          className={inputClasses}
          placeholder={category === 'SERVER' ? 'e.g. HPE, Dell, Lenovo' :
                       category === 'MONITOR' ? 'e.g. Dell, LG, Samsung' :
                       category === 'STORAGE' ? 'e.g. Seagate, Samsung, Micron' :
                       category === 'NETWORKING_CARD' ? 'e.g. HPE, Intel, Broadcom' :
                       'e.g. Dell, HP, Lenovo'}
        />
      </div>

      <div>
        <label className={labelClasses}>Model *</label>
        <input
          type="text"
          name="model"
          required
          className={inputClasses}
          placeholder={category === 'SERVER' ? 'e.g. ProLiant DL380 Gen10' :
                       category === 'MONITOR' ? 'e.g. P2419H' :
                       category === 'STORAGE' ? 'e.g. 870 EVO' :
                       category === 'NETWORKING_CARD' ? 'e.g. X710-DA2' :
                       'e.g. Latitude 7490'}
        />
      </div>

      {/* Dynamic fields based on category */}
      {currentConfig.fields.map((field) => (
        <div key={field.name}>
          <label className={labelClasses}>
            {field.label} {field.required && '*'}
          </label>
          {field.type === 'select' && field.options ? (
            <select
              name={field.name}
              className={selectClasses}
            >
              <option value="">{field.placeholder}</option>
              {field.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name={field.name}
              required={field.required}
              className={inputClasses}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
      >
        {isPending ? 'Adding...' : 'Add Device'}
      </button>
    </form>
  )
}
