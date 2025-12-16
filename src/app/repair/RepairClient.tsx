'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import { Play, CheckCircle, Download } from 'lucide-react'

interface RepairJob {
    id: string
    status: string
    reportedIssues: string | null
    sparesIssued: string | null
    notes: string | null
    tatDueDate: Date | null
    device: {
        barcode: string
        brand: string
        model: string
        paintPanels: Array<{
            id: string
            panelType: string
            status: string
        }>
        qcRecords: Array<{
            status: string
            remarks: string | null
        }>
    }
}

interface RepairClientProps {
    jobs: RepairJob[]
    userId: string
    onStartRepair: (jobId: string, userId: string) => Promise<void>
    onCompleteRepair: (jobId: string, notes: string) => Promise<void>
    onCollectFromPaint: (jobId: string) => Promise<void>
}

export default function RepairClient({ jobs, userId, onStartRepair, onCompleteRepair, onCollectFromPaint }: RepairClientProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const toast = useToast()

    const handleStart = async (job: RepairJob) => {
        startTransition(async () => {
            try {
                await onStartRepair(job.id, userId)
                toast.success('Repair work has started. You can now begin fixing the device.', {
                    title: 'Repair Started',
                    details: [
                        { label: 'Barcode', value: job.device.barcode },
                        { label: 'Device', value: `${job.device.brand} ${job.device.model}` },
                        { label: 'Status', value: 'Under Repair' }
                    ]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to start repair')
            }
        })
    }

    const handleComplete = async (job: RepairJob, formData: FormData) => {
        const notes = formData.get('notes') as string
        if (!notes) {
            toast.error('Please enter repair notes before completing.')
            return
        }

        startTransition(async () => {
            try {
                await onCompleteRepair(job.id, notes)
                toast.success('Repair has been completed. Device will now move to QC for final check.', {
                    title: 'Repair Completed',
                    details: [
                        { label: 'Barcode', value: job.device.barcode },
                        { label: 'Device', value: `${job.device.brand} ${job.device.model}` },
                        { label: 'Notes', value: notes.substring(0, 50) + (notes.length > 50 ? '...' : '') },
                        { label: 'Next Step', value: 'QC Inspection' }
                    ]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to complete repair')
            }
        })
    }

    const handleCollect = async (job: RepairJob) => {
        startTransition(async () => {
            try {
                await onCollectFromPaint(job.id)
                const panels = job.device.paintPanels.map(p => p.panelType).join(', ')
                toast.success('Paint panels have been collected and fitted. Device is ready for final repair/QC.', {
                    title: 'Paint Collected',
                    details: [
                        { label: 'Barcode', value: job.device.barcode },
                        { label: 'Device', value: `${job.device.brand} ${job.device.model}` },
                        { label: 'Panels Fitted', value: panels },
                        { label: 'Status', value: 'Ready for Final Repair' }
                    ]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to collect from paint')
            }
        })
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-foreground">Repair Station</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => {
                    const paintPanels = job.device.paintPanels || []
                    const allPanelsReady = paintPanels.length > 0 && paintPanels.every(p => p.status === 'READY_FOR_COLLECTION' || p.status === 'FITTED')
                    const latestQC = job.device.qcRecords?.[0]
                    const isQCRework = latestQC?.status === 'FAILED_REWORK'

                    return (
                        <div key={job.id} className={`bg-card rounded-xl shadow-soft p-6 border-t-4 border border-default ${isQCRework ? 'border-t-red-500' : 'border-t-indigo-500'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">{job.device.barcode}</h3>
                                    <p className="text-sm text-muted-foreground">{job.device.model}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${job.status === 'UNDER_REPAIR' ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400' :
                                    job.status === 'READY_FOR_REPAIR' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' :
                                        job.status === 'IN_PAINT_SHOP' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400' :
                                            'bg-secondary text-secondary-foreground'
                                    }`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                            </div>

                            {isQCRework && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded text-xs">
                                    <p className="font-bold text-red-800 dark:text-red-400 mb-1">QC FAILED - REWORK REQUIRED</p>
                                    <p className="text-red-700 dark:text-red-400"><strong>QC Remarks:</strong> {latestQC?.remarks || 'None'}</p>
                                </div>
                            )}

                            <div className="mb-4 text-sm text-muted-foreground">
                                <p><strong className="text-foreground">Issues:</strong> {JSON.parse(job.reportedIssues || '{}').functional || 'None'}</p>
                                {job.sparesIssued && <p><strong className="text-foreground">Spares:</strong> {job.sparesIssued}</p>}
                                {job.notes && (
                                    <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">
                                        <strong className="text-foreground">Notes:</strong>
                                        <pre className="whitespace-pre-wrap mt-1 text-muted-foreground">{job.notes}</pre>
                                    </div>
                                )}
                                {job.status === 'IN_PAINT_SHOP' && (
                                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-500/10 rounded text-xs">
                                        <strong className="text-foreground">Paint Status:</strong>
                                        <ul className="list-disc list-inside mt-1">
                                            {paintPanels.map(p => (
                                                <li key={p.id} className={p.status === 'READY_FOR_COLLECTION' ? 'text-green-600 dark:text-green-400 font-bold' : ''}>
                                                    {p.panelType}: {p.status.replace('_', ' ')}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {job.tatDueDate && <p className={`mt-2 ${new Date() > job.tatDueDate ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}>
                                    <strong className="text-foreground">Due:</strong> {formatDate(job.tatDueDate)}
                                </p>}
                            </div>

                            <div className="flex gap-2 mt-4">
                                {job.status === 'READY_FOR_REPAIR' && (
                                    <button
                                        onClick={() => handleStart(job)}
                                        disabled={isPending}
                                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex justify-center items-center gap-2 disabled:bg-indigo-400 transition-colors"
                                    >
                                        <Play size={16} /> {isPending ? 'Starting...' : 'Start'}
                                    </button>
                                )}

                                {job.status === 'UNDER_REPAIR' && (
                                    <form action={(formData) => handleComplete(job, formData)} className="w-full">
                                        <input type="text" name="notes" placeholder="Repair Notes" className="w-full mb-2 px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" required />
                                        <button
                                            type="submit"
                                            disabled={isPending}
                                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex justify-center items-center gap-2 disabled:bg-green-400 transition-colors"
                                        >
                                            <CheckCircle size={16} /> {isPending ? 'Completing...' : 'Complete Repair'}
                                        </button>
                                    </form>
                                )}

                                {job.status === 'IN_PAINT_SHOP' && allPanelsReady && (
                                    <button
                                        onClick={() => handleCollect(job)}
                                        disabled={isPending}
                                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex justify-center items-center gap-2 animate-pulse disabled:bg-green-400 transition-colors"
                                    >
                                        <Download size={16} /> {isPending ? 'Collecting...' : 'Collect from Paint'}
                                    </button>
                                )}

                                {job.status === 'IN_PAINT_SHOP' && !allPanelsReady && (
                                    <div className="w-full text-center text-xs text-muted-foreground italic py-2 bg-secondary/50 rounded-lg">
                                        Waiting for paint shop...
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {jobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No repair jobs assigned or available.
                    </div>
                )}
            </div>
        </div>
    )
}
