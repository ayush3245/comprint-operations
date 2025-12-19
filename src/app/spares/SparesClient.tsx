'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PackageCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { issueSpares } from '@/lib/actions'
import { formatDate } from '@/lib/utils'

type SparesRequest = {
    id: string
    jobId: string
    sparesRequired: string | null
    createdAt: Date
    device: {
        barcode: string
        model: string | null
    }
    inspectionEng: {
        name: string
    } | null
}

interface Props {
    requests: SparesRequest[]
}

export default function SparesClient({ requests }: Props) {
    const router = useRouter()
    const toast = useToast()
    const [isPending, startTransition] = useTransition()
    const [processingId, setProcessingId] = useState<string | null>(null)

    async function handleIssue(jobId: string, sparesIssued: string, deviceBarcode: string) {
        if (!sparesIssued.trim()) {
            toast.warning('Please enter spare parts to issue')
            return
        }

        setProcessingId(jobId)
        startTransition(async () => {
            try {
                await issueSpares(jobId, sparesIssued)
                toast.success(`Spare parts issued successfully for ${deviceBarcode}`, {
                    title: 'Spares Issued',
                    details: [
                        { label: 'Parts', value: sparesIssued }
                    ]
                })
                router.refresh()
            } catch (error) {
                // Show warning toast instead of crashing
                const errorMessage = error instanceof Error ? error.message : 'Failed to issue spares'
                toast.error(errorMessage, {
                    title: 'Cannot Issue Spares',
                    details: [
                        { label: 'Device', value: deviceBarcode },
                        { label: 'Reason', value: 'Some parts may be out of stock or not found in inventory' }
                    ]
                })
            } finally {
                setProcessingId(null)
            }
        })
    }

    return (
        <div className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {requests.length === 0 ? (
                    <div className="px-4 py-10 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                            <PackageCheck size={32} className="text-muted-foreground/50" />
                            <span>No pending spares requests.</span>
                        </div>
                    </div>
                ) : (
                    requests.map((req) => {
                        const isProcessing = processingId === req.id
                        return (
                            <div key={req.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-medium text-foreground">{req.device.barcode}</div>
                                        <div className="text-xs text-muted-foreground">{req.device.model}</div>
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                        {req.jobId}
                                    </span>
                                </div>
                                <div className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 p-2 rounded">
                                    {req.sparesRequired}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>By: {req.inspectionEng?.name || 'Unknown'}</span>
                                    <span>{formatDate(req.createdAt)}</span>
                                </div>
                                <SparesIssueForm
                                    jobId={req.id}
                                    deviceBarcode={req.device.barcode}
                                    defaultSpares={req.sparesRequired || ''}
                                    isProcessing={isProcessing}
                                    onSubmit={handleIssue}
                                />
                            </div>
                        )
                    })
                )}
            </div>

            {/* Desktop Table View */}
            <table className="hidden md:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-muted">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Job ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Device</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Required Spares</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Requested By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <PackageCheck size={32} className="text-muted-foreground/50" />
                                    <span>No pending spares requests.</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        requests.map((req) => {
                            const isProcessing = processingId === req.id
                            return (
                                <tr key={req.id} className="bg-card hover:bg-muted transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                        {req.jobId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        <div className="font-medium text-foreground">{req.device.barcode}</div>
                                        <div className="text-xs">{req.device.model}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 font-medium">
                                        {req.sparesRequired}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {req.inspectionEng?.name || 'Unknown'}
                                        <div className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <SparesIssueForm
                                            jobId={req.id}
                                            deviceBarcode={req.device.barcode}
                                            defaultSpares={req.sparesRequired || ''}
                                            isProcessing={isProcessing}
                                            onSubmit={handleIssue}
                                        />
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    )
}

function SparesIssueForm({
    jobId,
    deviceBarcode,
    defaultSpares,
    isProcessing,
    onSubmit
}: {
    jobId: string
    deviceBarcode: string
    defaultSpares: string
    isProcessing: boolean
    onSubmit: (jobId: string, sparesIssued: string, deviceBarcode: string) => void
}) {
    const [sparesValue, setSparesValue] = useState(defaultSpares)

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        onSubmit(jobId, sparesValue, deviceBarcode)
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
                type="text"
                value={sparesValue}
                onChange={(e) => setSparesValue(e.target.value)}
                placeholder="Confirm Issued Spares"
                className="px-2 py-2 sm:py-1 bg-muted border border-input rounded-lg text-sm flex-1 sm:w-40 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:opacity-50"
                required
                disabled={isProcessing}
            />
            <button
                type="submit"
                disabled={isProcessing}
                className="bg-green-600 text-white px-3 py-2 sm:py-1 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Issuing...</span>
                    </>
                ) : (
                    <>
                        <PackageCheck size={16} />
                        <span>Issue</span>
                    </>
                )}
            </button>
        </form>
    )
}
