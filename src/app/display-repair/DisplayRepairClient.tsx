'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Monitor, Play, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react'

interface DisplayJob {
    id: string
    status: string
    reportedIssues: string | null
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

interface DisplayRepairClientProps {
    jobs: DisplayJob[]
    userId: string
    userName: string
    userRole: string
    onStartRepair: (jobId: string) => Promise<void>
    onCompleteRepair: (jobId: string, notes: string) => Promise<void>
}

export default function DisplayRepairClient({
    jobs,
    userId,
    userName,
    userRole,
    onStartRepair,
    onCompleteRepair
}: DisplayRepairClientProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<'pending' | 'in_progress'>('pending')
    const [completeModal, setCompleteModal] = useState<string | null>(null)

    const pendingJobs = jobs.filter(j => j.status === 'PENDING')
    const inProgressJobs = jobs.filter(j => j.status === 'IN_PROGRESS')
    const myJobs = inProgressJobs.filter(j => j.assignedTo?.id === userId)

    const handleStart = async (job: DisplayJob) => {
        startTransition(async () => {
            try {
                await onStartRepair(job.id)
                toast.success(`Started working on ${job.device.barcode}`, {
                    title: 'Job Started',
                    details: [
                        { label: 'Device', value: `${job.device.brand} ${job.device.model}` },
                        { label: 'Issues', value: (job.reportedIssues || 'Not specified').substring(0, 50) + (job.reportedIssues && job.reportedIssues.length > 50 ? '...' : '') }
                    ]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to start repair')
            }
        })
    }

    const handleComplete = async (jobId: string, notes: string) => {
        startTransition(async () => {
            try {
                await onCompleteRepair(jobId, notes)
                toast.success('Display repair completed. Device will be returned to L2 Engineer.', {
                    title: 'Repair Completed'
                })
                setCompleteModal(null)
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to complete repair')
            }
        })
    }

    const JobCard = ({ job, showStart }: { job: DisplayJob; showStart: boolean }) => {
        const l2Engineer = job.device.repairJobs[0]?.l2Engineer?.name || 'Unassigned'
        const isMyJob = job.assignedTo?.id === userId

        return (
            <div className={`bg-card rounded-lg shadow-soft border border-default border-l-4 ${
                job.status === 'IN_PROGRESS' ? 'border-l-blue-500' : 'border-l-yellow-500'
            }`}>
                <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-lg text-foreground">{job.device.barcode}</h3>
                            <p className="text-sm text-muted-foreground">
                                {job.device.brand} {job.device.model} • {job.device.category}
                            </p>
                        </div>
                        <Monitor size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="bg-muted p-3 rounded mb-3">
                        <p className="text-sm font-medium text-foreground mb-1">Reported Issues:</p>
                        <p className="text-sm text-muted-foreground">{job.reportedIssues || 'No issues specified'}</p>
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
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-blue-400"
                        >
                            <Play size={18} />
                            {isPending ? 'Starting...' : 'Start Repair'}
                        </button>
                    )}

                    {job.status === 'IN_PROGRESS' && isMyJob && (
                        <button
                            onClick={() => setCompleteModal(job.id)}
                            disabled={isPending}
                            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-green-400"
                        >
                            <CheckCircle size={18} />
                            Complete Repair
                        </button>
                    )}

                    {job.status === 'IN_PROGRESS' && !isMyJob && (
                        <div className="text-center py-2 text-sm text-muted-foreground">
                            Being worked on by {job.assignedTo?.name}
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
                    <Monitor size={28} className="text-blue-600 dark:text-blue-400" />
                    <h1 className="text-2xl font-bold text-foreground">Display Repair Queue</h1>
                </div>
                <span className="text-sm text-muted-foreground">Technician: {userName}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-500/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{pendingJobs.length}</div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{myJobs.length}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">My Active Jobs</div>
                </div>
                <div className="bg-muted p-4 rounded-lg border border-default">
                    <div className="text-2xl font-bold text-foreground">{inProgressJobs.length - myJobs.length}</div>
                    <div className="text-sm text-muted-foreground">Others Active</div>
                </div>
            </div>

            {/* Tabs - Only show for Display Technician, not L2 */}
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
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Clock size={16} className="inline mr-1" />
                        In Progress ({inProgressJobs.length})
                    </button>
                </div>
            )}

            {/* Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* L2 view: Show only their in-progress jobs */}
                {userRole === 'L2_ENGINEER' && myJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No display repair jobs in progress. View from L2 Repair page.
                    </div>
                )}
                {userRole === 'L2_ENGINEER' && myJobs.map(job => (
                    <JobCard key={job.id} job={job} showStart={false} />
                ))}

                {/* Technician view: Show based on active tab */}
                {userRole !== 'L2_ENGINEER' && activeTab === 'pending' && pendingJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No pending display repair jobs. Check back later.
                    </div>
                )}
                {userRole !== 'L2_ENGINEER' && activeTab === 'pending' && pendingJobs.map(job => (
                    <JobCard key={job.id} job={job} showStart={true} />
                ))}

                {userRole !== 'L2_ENGINEER' && activeTab === 'in_progress' && inProgressJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No jobs in progress. Pick up a pending job to get started.
                    </div>
                )}
                {userRole !== 'L2_ENGINEER' && activeTab === 'in_progress' && inProgressJobs.map(job => (
                    <JobCard key={job.id} job={job} showStart={false} />
                ))}
            </div>

            {/* Complete Modal */}
            {completeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-lg p-6 w-full max-w-md border border-default">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                            Complete Display Repair
                        </h3>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const notes = form.notes.value
                            handleComplete(completeModal, notes)
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Repair Notes *</label>
                                <textarea
                                    name="notes"
                                    className="w-full border border-default rounded p-2 bg-card text-foreground"
                                    rows={4}
                                    placeholder="Describe what was repaired (e.g., screen replaced, cable reconnected, bezel fixed)..."
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input type="checkbox" name="testedDisplay" defaultChecked />
                                    Display tested and working properly
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCompleteModal(null)}
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
