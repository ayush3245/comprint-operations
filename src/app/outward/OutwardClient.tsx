'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOutward } from '@/lib/actions'
import { Device, InwardBatch, OutwardRecord, Role } from '@prisma/client'
import { useToast } from '@/components/ui/Toast'

type DeviceWithBatch = Device & { inwardBatch: InwardBatch }
type UserOption = { id: string; name: string; role: Role }
type OutwardWithDetails = OutwardRecord & {
    devices: Device[]
    packedBy: { name: string } | null
    checkedBy: { name: string } | null
}

interface OutwardClientProps {
    devices: DeviceWithBatch[]
    users: UserOption[]
    outwardRecords: OutwardWithDetails[]
}

export default function OutwardClient({ devices, users, outwardRecords }: OutwardClientProps) {
    const router = useRouter()
    const toast = useToast()
    const [type, setType] = useState<'SALES' | 'RENTAL'>('SALES')
    const [selectedDevices, setSelectedDevices] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)

    const toggleDevice = (deviceId: string) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        )
    }

    const selectAll = () => {
        if (selectedDevices.length === devices.length) {
            setSelectedDevices([])
        } else {
            setSelectedDevices(devices.map(d => d.id))
        }
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const customer = formData.get('customer') as string
        const reference = formData.get('reference') as string

        try {
            const data = {
                type,
                customer,
                reference,
                shippingDetails: formData.get('shippingDetails') as string || undefined,
                packedById: formData.get('packedById') as string || undefined,
                checkedById: formData.get('checkedById') as string || undefined,
                deviceIds: selectedDevices
            }

            await createOutward(data)
            toast.success(`${selectedDevices.length} device(s) have been dispatched and marked as ${type === 'SALES' ? 'sold' : 'rented out'}.`, {
                title: `${type === 'SALES' ? 'Sales' : 'Rental'} Dispatch Created`,
                details: [
                    { label: 'Customer', value: customer },
                    { label: type === 'SALES' ? 'Invoice No' : 'Rental Ref', value: reference },
                    { label: 'Devices', value: `${selectedDevices.length} device(s)` },
                    { label: 'Type', value: type === 'SALES' ? 'Sales Outward' : 'Rental Outward' }
                ]
            })
            setShowForm(false)
            setSelectedDevices([])
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to create dispatch')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Outward / Dispatch</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    {showForm ? 'Cancel' : 'New Dispatch'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Create New Dispatch</h2>

                    {/* Type Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dispatch Type</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setType('SALES')}
                                className={`px-4 py-2 rounded-md border ${type === 'SALES'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Sales Outward
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('RENTAL')}
                                className={`px-4 py-2 rounded-md border ${type === 'RENTAL'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Rental Outward
                            </button>
                        </div>
                    </div>

                    {/* Device Selection */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Select Devices ({selectedDevices.length} selected)
                            </label>
                            <button
                                type="button"
                                onClick={selectAll}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {selectedDevices.length === devices.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        {devices.length === 0 ? (
                            <div className="border rounded-md p-8 text-center text-gray-500">
                                No devices ready for dispatch.
                            </div>
                        ) : (
                            <div className="border rounded-md max-h-64 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDevices.length === devices.length && devices.length > 0}
                                                    onChange={selectAll}
                                                    className="rounded border-gray-300"
                                                />
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {devices.map(device => (
                                            <tr
                                                key={device.id}
                                                className={`cursor-pointer hover:bg-gray-50 ${selectedDevices.includes(device.id) ? 'bg-blue-50' : ''
                                                    }`}
                                                onClick={() => toggleDevice(device.id)}
                                            >
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDevices.includes(device.id)}
                                                        onChange={() => toggleDevice(device.id)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="rounded border-gray-300"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 font-mono text-sm text-blue-600">{device.barcode}</td>
                                                <td className="px-4 py-2 text-sm">
                                                    <div className="font-medium">{device.brand} {device.model}</div>
                                                    <div className="text-xs text-gray-500">{device.category}</div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {device.grade && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${device.grade === 'A' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            Grade {device.grade}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{device.inwardBatch.batchId}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Form Fields */}
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    name="customer"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {type === 'SALES' ? 'Invoice Number *' : 'Rental Reference *'}
                                </label>
                                <input
                                    type="text"
                                    name="reference"
                                    required
                                    placeholder={type === 'SALES' ? 'INV-2025-001' : 'RENT-2025-001'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Details</label>
                            <textarea
                                name="shippingDetails"
                                rows={2}
                                placeholder="Carrier, tracking number, delivery address..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Packed By</label>
                                <select
                                    name="packedById"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="">Select...</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Checked By</label>
                                <select
                                    name="checkedById"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="">Select...</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false)
                                    setSelectedDevices([])
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || selectedDevices.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : `Create ${type === 'SALES' ? 'Sales' : 'Rental'} Dispatch`}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Outward History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Dispatch History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outward ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Devices</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packed By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {outwardRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                                        No dispatch records yet.
                                    </td>
                                </tr>
                            ) : (
                                outwardRecords.map(record => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">
                                            {record.outwardId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.type === 'SALES'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.customer}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.reference}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {record.devices.length} device(s)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.packedBy?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.checkedBy?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(record.date)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
