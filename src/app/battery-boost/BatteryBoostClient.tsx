'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Battery, Play, CheckCircle, Clock, AlertTriangle, User, Zap, TrendingUp } from 'lucide-react'

interface BatteryJob {
    id: string
    status: string
    initialCapacity: string | null
    targetCapacity: string | null
    finalCapacity: string | null
    notes: string | null
    startedAt: Date | null
    device: {
        id: string
        barcode: string
        brand: string
        model: string
        category: string
        repairJobs: Array<{
            l2Engineer: { name: string } | null
        }>
    }
    assignedTo: { id: string; name: string } | null
}

interface CompletedBatteryJob {
    id: string
    status: string
    initialCapacity: string | null
    targetCapacity: string | null
    finalCapacity: string | null
    notes: string | null
    startedAt: Date | null
    completedAt: Date | null
    device: {
        id: string
        barcode: string
        brand: string
        model: string
        category: string
        repairJobs: Array<{
            l2Engineer: { name: string } | null
        }>
    }
    assignedTo: { id: string; name: string } | null
}

interface BatteryBoostClientProps {
    jobs: BatteryJob[]
    completedJobs: CompletedBatteryJob[]
    userId: string
    userName: string
    userRole: string
    onStartBoost: (jobId: string) => Promise<void>
    onCompleteBoost: (jobId: string, finalCapacity: string, notes: string) => Promise<void>
}

export default function BatteryBoostClient({
    jobs,
    completedJobs,
    userId,
    userName,
    userRole,
    onStartBoost,
    onCompleteBoost
}: BatteryBoostClientProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('pending')
    const [completeModal, setCompleteModal] = useState<string | null>(null)
    const [selectedJob, setSelectedJob] = useState<BatteryJob | null>(null)

    const pendingJobs = jobs.filter(j => j.status === 'PENDING')
    const inProgressJobs = jobs.filter(j => j.status === 'IN_PROGRESS')
    const myJobs = inProgressJobs.filter(j => j.assignedTo?.id === userId)

    // L2/Admin/Superadmin see all in-progress jobs, Battery Technicians see only their own
    const displayedInProgressJobs = ['ADMIN', 'SUPERADMIN', 'L2_ENGINEER'].includes(userRole)
        ? inProgressJobs
        : myJobs

    const handleStart = async (job: BatteryJob) => {
        startTransition(async () => {
            try {
                await onStartBoost(job.id)
                toast.success(`Started battery boost for ${job.device.barcode}`, {
                    title: 'Boost Started',
                    details: [
                        { label: 'Device', value: `${job.device.brand} ${job.device.model}` },
                        { label: 'Initial Capacity', value: job.initialCapacity || 'Unknown' }
                    ]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to start boost')
            }
        })
    }

    const handleComplete = async (jobId: string, finalCapacity: string, notes: string) => {
        startTransition(async () => {
            try {
                await onCompleteBoost(jobId, finalCapacity, notes)
                toast.success('Battery boost completed. Device will be returned to L2 Engineer.', {
                    title: 'Boost Completed'
                })
                setCompleteModal(null)
                setSelectedJob(null)
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to complete boost')
            }
        })
    }

    const getCapacityColor = (capacity: string) => {
        const num = parseInt(capacity.replace('%', ''))
        if (isNaN(num)) return 'text-gray-600'
        if (num >= 80) return 'text-green-600'
        if (num >= 50) return 'text-yellow-600'
        return 'text-red-600'
    }

    const JobCard = ({ job, showStart }: { job: BatteryJob; showStart: boolean }) => {
        const l2Engineer = job.device.repairJobs[0]?.l2Engineer?.name || 'Unassigned'
        const isMyJob = job.assignedTo?.id === userId

        return (
            <div className={`bg-card rounded-lg shadow-soft border border-default border-l-4 ${
                job.status === 'IN_PROGRESS' ? 'border-l-green-500' : 'border-l-yellow-500'
            }`}>
                <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-lg text-foreground">{job.device.barcode}</h3>
                            <p className="text-sm text-muted-foreground">
                                {job.device.brand} {job.device.model} • {job.device.category}
                            </p>
                        </div>
                        <Battery size={24} className="text-green-600 dark:text-green-400" />
                    </div>

                    {/* Battery Status */}
                    <div className="bg-muted p-3 rounded mb-3">
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Initial</p>
                                <p className={`text-lg font-bold ${getCapacityColor(job.initialCapacity || '')}`}>
                                    {job.initialCapacity || 'N/A'}
                                </p>
                            </div>
                            <TrendingUp size={24} className="text-muted-foreground" />
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Target</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {job.targetCapacity || '≥80%'}
                                </p>
                            </div>
                            {job.finalCapacity && (
                                <>
                                    <Zap size={20} className="text-yellow-500 dark:text-yellow-400" />
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">Final</p>
                                        <p className={`text-lg font-bold ${getCapacityColor(job.finalCapacity)}`}>
                                            {job.finalCapacity}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                            <User size={14} />
                            L2: {l2Engineer}
                        </span>
                        {job.status === 'IN_PROGRESS' && job.startedAt && (
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                Started: {new Date(job.startedAt).toLocaleString()}
                            </span>
                        )}
                        {job.assignedTo && (
                            <span className="flex items-center gap-1">
                                <User size={14} />
                                {isMyJob ? 'You' : job.assignedTo.name}
                            </span>
                        )}
                    </div>

                    {showStart && job.status === 'PENDING' && (
                        <button
                            onClick={() => handleStart(job)}
                            disabled={isPending}
                            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-green-400"
                        >
                            <Play size={18} />
                            {isPending ? 'Starting...' : 'Start Boost'}
                        </button>
                    )}

                    {job.status === 'IN_PROGRESS' && isMyJob && (
                        <button
                            onClick={() => {
                                setSelectedJob(job)
                                setCompleteModal(job.id)
                            }}
                            disabled={isPending}
                            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-green-400"
                        >
                            <CheckCircle size={18} />
                            Complete Boost
                        </button>
                    )}

                    {job.status === 'IN_PROGRESS' && !isMyJob && (
                        <div className="text-center py-2 text-sm text-muted-foreground">
                            Being boosted by {job.assignedTo?.name}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Battery size={28} className="text-green-600 dark:text-green-400" />
                    <h1 className="text-2xl font-bold text-foreground">Battery Boost Queue</h1>
                </div>
                <span className="text-sm text-muted-foreground">Technician: {userName}</span>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30">
                <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <Zap size={18} />
                    Battery Boost Guidelines
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Target capacity: 80% or higher for passing QC</li>
                    <li>• Maximum charging time: 8 hours per cycle</li>
                    <li>• If battery cannot hold charge, note for L2 replacement</li>
                </ul>
            </div>

            {/* Tabs - Only show for Battery Technician, not L2 */}
            {userRole !== 'L2_ENGINEER' && (
                <div className="flex gap-2 border-b border-default">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'pending'
                                ? 'border-b-2 border-yellow-600 text-yellow-600 dark:text-yellow-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <AlertTriangle size={16} className="inline mr-1" />
                        Pending ({pendingJobs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('in_progress')}
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'in_progress'
                                ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Clock size={16} className="inline mr-1" />
                        In Progress ({displayedInProgressJobs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'completed'
                                ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <CheckCircle size={16} className="inline mr-1" />
                        Completed ({completedJobs.length})
                    </button>
                </div>
            )}

            {/* Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* L2 view: Show only their in-progress jobs */}
                {userRole === 'L2_ENGINEER' && myJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No battery boost jobs in progress. View from L2 Repair page.
                    </div>
                )}
                {userRole === 'L2_ENGINEER' && myJobs.map(job => (
                    <JobCard key={job.id} job={job} showStart={false} />
                ))}

                {/* Technician view: Show based on active tab */}
                {userRole !== 'L2_ENGINEER' && activeTab === 'pending' && pendingJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No pending battery boost jobs. Check back later.
                    </div>
                )}
                {userRole !== 'L2_ENGINEER' && activeTab === 'pending' && pendingJobs.map(job => (
                    <JobCard key={job.id} job={job} showStart={true} />
                ))}

                {userRole !== 'L2_ENGINEER' && activeTab === 'in_progress' && displayedInProgressJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No jobs in progress. Pick up a pending job to get started.
                    </div>
                )}
                {userRole !== 'L2_ENGINEER' && activeTab === 'in_progress' && displayedInProgressJobs.map(job => (
                    <JobCard key={job.id} job={job} showStart={false} />
                ))}

                {userRole !== 'L2_ENGINEER' && activeTab === 'completed' && completedJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No completed jobs yet.
                    </div>
                )}
                {userRole !== 'L2_ENGINEER' && activeTab === 'completed' && completedJobs.map(job => {
                    const l2Engineer = job.device.repairJobs[0]?.l2Engineer?.name || 'Unassigned'
                    return (
                        <div key={job.id} className="bg-card rounded-lg shadow-soft border border-default border-l-4 border-l-green-500">
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground">{job.device.barcode}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {job.device.brand} {job.device.model} • {job.device.category}
                                        </p>
                                    </div>
                                    <Battery size={24} className="text-green-600 dark:text-green-400" />
                                </div>

                                {/* Battery Capacity Summary */}
                                <div className="bg-muted p-3 rounded mb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Initial</p>
                                            <p className={`text-lg font-bold ${getCapacityColor(job.initialCapacity || '')}`}>
                                                {job.initialCapacity || 'N/A'}
                                            </p>
                                        </div>
                                        <TrendingUp size={24} className="text-muted-foreground" />
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Final</p>
                                            <p className={`text-lg font-bold ${getCapacityColor(job.finalCapacity || '')}`}>
                                                {job.finalCapacity || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {job.completedAt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Completed:</span>
                                            <span className="text-foreground">
                                                {new Date(job.completedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User size={14} />
                                        L2: {l2Engineer}
                                    </div>
                                    {job.notes && (
                                        <div className="bg-muted p-2 rounded text-xs text-muted-foreground mt-2">
                                            {job.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Complete Modal */}
            {completeModal && selectedJob && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-lg p-6 w-full max-w-md border border-default">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                            Complete Battery Boost
                        </h3>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const finalCapacity = form.finalCapacity.value
                            const notes = form.notes.value
                            handleComplete(completeModal, finalCapacity, notes)
                        }}>
                            <div className="mb-4 p-3 bg-muted rounded">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Initial Capacity:</span>
                                    <span className={`font-bold ${getCapacityColor(selectedJob.initialCapacity || '')}`}>
                                        {selectedJob.initialCapacity || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Final Capacity *</label>
                                <input
                                    type="text"
                                    name="finalCapacity"
                                    className="w-full border border-default rounded p-2 bg-card text-foreground"
                                    placeholder="e.g., 85%"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">Enter the current battery health percentage</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Notes</label>
                                <textarea
                                    name="notes"
                                    className="w-full border border-default rounded p-2 bg-card text-foreground"
                                    rows={3}
                                    placeholder="Any notes about the battery condition, charging behavior, etc."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCompleteModal(null)
                                        setSelectedJob(null)
                                    }}
                                    className="flex-1 py-2 border border-default rounded hover:bg-muted text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
                                >
                                    {isPending ? 'Completing...' : 'Complete'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
