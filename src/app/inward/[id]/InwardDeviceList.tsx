'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, X, Loader2 } from 'lucide-react'
import { DeviceCategory } from '@prisma/client'
import BarcodePrintButton from '@/components/BarcodePrintButton'
import { updateDevice } from '@/lib/actions'
import { useToast } from '@/components/ui/Toast'

interface Device {
    id: string
    barcode: string
    brand: string
    model: string
    category: DeviceCategory
    status: string
    cpu: string | null
    ram: string | null
    ssd: string | null
    gpu: string | null
    screenSize: string | null
    serial: string | null
    // Server fields
    formFactor: string | null
    raidController: string | null
    networkPorts: string | null
    // Monitor fields
    monitorSize: string | null
    resolution: string | null
    panelType: string | null
    refreshRate: string | null
    monitorPorts: string | null
    // Storage fields
    storageType: string | null
    capacity: string | null
    storageFormFactor: string | null
    interface: string | null
    rpm: string | null
    // Networking card fields
    nicSpeed: string | null
    portCount: string | null
    connectorType: string | null
    nicInterface: string | null
    bracketType: string | null
}

interface Props {
    devices: Device[]
}

// Device category configuration with their specific fields
const categoryFields: Record<DeviceCategory, Array<{ name: string; label: string }>> = {
    LAPTOP: [
        { name: 'cpu', label: 'CPU' },
        { name: 'ram', label: 'RAM' },
        { name: 'ssd', label: 'Storage' },
        { name: 'gpu', label: 'GPU' },
        { name: 'screenSize', label: 'Screen Size' },
        { name: 'serial', label: 'Serial Number' }
    ],
    DESKTOP: [
        { name: 'cpu', label: 'CPU' },
        { name: 'ram', label: 'RAM' },
        { name: 'ssd', label: 'Storage' },
        { name: 'gpu', label: 'GPU' },
        { name: 'serial', label: 'Serial Number' }
    ],
    WORKSTATION: [
        { name: 'cpu', label: 'CPU' },
        { name: 'ram', label: 'RAM' },
        { name: 'ssd', label: 'Storage' },
        { name: 'gpu', label: 'GPU' },
        { name: 'serial', label: 'Serial Number' }
    ],
    SERVER: [
        { name: 'formFactor', label: 'Form Factor' },
        { name: 'cpu', label: 'CPU' },
        { name: 'ram', label: 'RAM' },
        { name: 'ssd', label: 'Storage' },
        { name: 'raidController', label: 'RAID / Controller' },
        { name: 'networkPorts', label: 'Network Ports' },
        { name: 'serial', label: 'Serial Number' }
    ],
    MONITOR: [
        { name: 'monitorSize', label: 'Size' },
        { name: 'resolution', label: 'Resolution' },
        { name: 'panelType', label: 'Panel Type' },
        { name: 'refreshRate', label: 'Refresh Rate' },
        { name: 'monitorPorts', label: 'Ports' },
        { name: 'serial', label: 'Serial Number' }
    ],
    STORAGE: [
        { name: 'storageType', label: 'Type' },
        { name: 'capacity', label: 'Capacity' },
        { name: 'storageFormFactor', label: 'Form Factor' },
        { name: 'interface', label: 'Interface' },
        { name: 'rpm', label: 'RPM' },
        { name: 'serial', label: 'Serial Number' }
    ],
    NETWORKING_CARD: [
        { name: 'nicSpeed', label: 'Speed' },
        { name: 'portCount', label: 'Port Count' },
        { name: 'connectorType', label: 'Connector Type' },
        { name: 'nicInterface', label: 'Interface' },
        { name: 'bracketType', label: 'Bracket Type' },
        { name: 'serial', label: 'Serial Number' }
    ]
}

export default function InwardDeviceList({ devices }: Props) {
    const router = useRouter()
    const toast = useToast()
    const [isPending, startTransition] = useTransition()
    const [editingDevice, setEditingDevice] = useState<Device | null>(null)
    const [formData, setFormData] = useState<Record<string, string>>({})

    function openEditModal(device: Device) {
        setEditingDevice(device)
        // Pre-populate form with existing values
        const data: Record<string, string> = {
            category: device.category,
            brand: device.brand || '',
            model: device.model || ''
        }
        // Load fields for all categories so data persists when switching
        Object.values(DeviceCategory).forEach(cat => {
            const fields = categoryFields[cat] || []
            fields.forEach(field => {
                const value = device[field.name as keyof Device]
                data[field.name] = typeof value === 'string' ? value : ''
            })
        })
        setFormData(data)
    }

    function closeEditModal() {
        setEditingDevice(null)
        setFormData({})
    }

    function handleInputChange(name: string, value: string) {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    async function handleSave() {
        if (!editingDevice) return

        startTransition(async () => {
            try {
                await updateDevice(editingDevice.id, formData)
                toast.success('Device updated successfully')
                closeEditModal()
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to update device')
            }
        })
    }

    function getDeviceSpecs(device: Device): string {
        switch (device.category) {
            case 'LAPTOP':
            case 'DESKTOP':
            case 'WORKSTATION':
                return [device.cpu, device.ram, device.ssd, device.gpu, device.screenSize].filter(Boolean).join(' • ')
            case 'SERVER':
                return [device.formFactor, device.cpu, device.ram, device.ssd].filter(Boolean).join(' • ')
            case 'MONITOR':
                return [device.monitorSize, device.resolution, device.panelType].filter(Boolean).join(' • ')
            case 'STORAGE':
                return [device.storageType, device.capacity, device.storageFormFactor, device.interface].filter(Boolean).join(' • ')
            case 'NETWORKING_CARD':
                return [device.nicSpeed, device.portCount, device.connectorType].filter(Boolean).join(' • ')
            default:
                return '-'
        }
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Barcode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Specifications</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                        {devices.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                    No devices added yet.
                                </td>
                            </tr>
                        ) : (
                            devices.map((device) => (
                                <tr key={device.id} className="bg-card hover:bg-muted transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-primary">
                                        {device.barcode}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                        <div className="font-medium">{device.brand} {device.model}</div>
                                        <div className="text-xs text-muted-foreground">{device.category.replace('_', ' ')}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {getDeviceSpecs(device) || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400">
                                            {device.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {device.status === 'RECEIVED' && (
                                                <button
                                                    onClick={() => openEditModal(device)}
                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded transition-colors"
                                                    title="Edit Device"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            <BarcodePrintButton
                                                devices={[{
                                                    barcode: device.barcode,
                                                    category: device.category,
                                                    brand: device.brand,
                                                    model: device.model,
                                                    cpu: device.cpu,
                                                    ram: device.ram,
                                                    ssd: device.ssd,
                                                    serial: device.serial
                                                }]}
                                                mode="single"
                                                variant="icon"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingDevice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-default">
                        <div className="px-6 py-4 border-b border-default flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">
                                Edit Device: {editingDevice.barcode}
                            </h2>
                            <button
                                onClick={closeEditModal}
                                className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                                <select
                                    value={formData.category || editingDevice.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors"
                                >
                                    {Object.values(DeviceCategory).map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat.replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Brand</label>
                                    <input
                                        type="text"
                                        value={formData.brand || ''}
                                        onChange={(e) => handleInputChange('brand', e.target.value)}
                                        className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Model</label>
                                    <input
                                        type="text"
                                        value={formData.model || ''}
                                        onChange={(e) => handleInputChange('model', e.target.value)}
                                        className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {categoryFields[(formData.category || editingDevice.category) as DeviceCategory]?.map((field) => (
                                <div key={field.name}>
                                    <label className="block text-sm font-medium text-foreground mb-1">{field.label}</label>
                                    <input
                                        type="text"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-4 border-t border-default flex justify-end gap-3">
                            <button
                                onClick={closeEditModal}
                                className="px-4 py-2 border border-default rounded-lg text-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
                            >
                                {isPending && <Loader2 size={16} className="animate-spin" />}
                                {isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
