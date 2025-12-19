'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Cpu, Play, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react'

interface L3Job {
    id: string
    status: string
    issueType: string
    description: string | null
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

interface L3RepairClientProps {
    jobs: L3Job[]
    userId: string
    userName: string
    onStartRepair: (jobId: string) => Promise<void>
    onCompleteRepair: (jobId: string, resolution: string, notes: string) => Promise<void>
}

export default function L3RepairClient({
    jobs,
    userId,
    userName,
    onStartRepair,
    onCompleteRepair
}: L3RepairClientProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<'pending' | 'in_progress'>('pending')
    const [completeModal, setCompleteModal] = useState<string | null>(null)

    const pendingJobs = jobs.filter(j => j.status === 'PENDING')
    const inProgressJobs = jobs.filter(j => j.status === 'IN_PROGRESS')
    const myJobs = inProgressJobs.filter(j => j.assignedTo?.id === userId)

    const handleStart = async (job: L3Job) => {
        startTransition(async () => {
            try {
                await onStartRepair(job.id)
                toast.success(`Started working on ${job.device.barcode}`, {
                    title: 'Job Started',
                    details: [
                        { label: 'Issue Type', value: job.issueType.replace('_', ' ') },
                        { label: 'Device', value: `${job.device.brand} ${job.device.model}` }
                    ]
                })
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to start repair')
            }
        })
    }

    const handleComplete = async (jobId: string, resolution: string, notes: string) => {
        startTransition(async () => {
            try {
                await onCompleteRepair(jobId, resolution, notes)
                toast.success('L3 repair completed. Device will be returned to L2 Engineer.', {
                    title: 'Repair Completed'
                })
                setCompleteModal(null)
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to complete repair')
            }
        })
    }

    const getIssueTypeColor = (issueType: string) => {
        switch (issueType) {
            case 'MOTHERBOARD': return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400'
            case 'DOMAIN_LOCK': return 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400'
            case 'BIOS_LOCK': return 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400'
            case 'POWER_ON_ISSUE': return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400'
            default: return 'bg-muted text-foreground'
        }
    }

    const JobCard = ({ job, showStart }: { job: L3Job; showStart: boolean }) => {
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getIssueTypeColor(job.issueType)}`}>
                            {job.issueType.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="bg-muted p-3 rounded mb-3">
                        <p className="text-sm font-medium text-foreground mb-1">Issue Description:</p>
                        <p className="text-sm text-muted-foreground">{job.description || 'No description provided'}</p>
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
                    <Cpu size={28} className="text-blue-600 dark:text-blue-400" />
                    <h1 className="text-2xl font-bold text-foreground">L3 Repair Queue</h1>
                </div>
                <span className="text-sm text-muted-foreground">Engineer: {userName}</span>
            </div>

            {/* Issue Type Legend */}
            <div className="bg-card p-3 rounded-lg shadow-soft border border-default flex flex-wrap gap-2">
                <span className="text-sm font-medium text-foreground mr-2">Issue Types:</span>
                <span className={`px-2 py-0.5 rounded text-xs ${getIssueTypeColor('MOTHERBOARD')}`}>Motherboard</span>
                <span className={`px-2 py-0.5 rounded text-xs ${getIssueTypeColor('DOMAIN_LOCK')}`}>Domain Lock</span>
                <span className={`px-2 py-0.5 rounded text-xs ${getIssueTypeColor('BIOS_LOCK')}`}>BIOS Lock</span>
                <span className={`px-2 py-0.5 rounded text-xs ${getIssueTypeColor('POWER_ON_ISSUE')}`}>Power On Issue</span>
            </div>

            {/* Tabs */}
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

            {/* Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === 'pending' && pendingJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No pending L3 repair jobs. Check back later.
                    </div>
                )}
                {activeTab === 'pending' && pendingJobs.map(job => (
                    <JobCard key={job.id} job={job} showStart={true} />
                ))}

                {activeTab === 'in_progress' && inProgressJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No jobs in progress. Pick up a pending job to get started.
                    </div>
                )}
                {activeTab === 'in_progress' && inProgressJobs.map(job => (
                    <JobCard key={job.id} job={job} showStart={false} />
                ))}
            </div>

            {/* Complete Modal */}
            {completeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-lg p-6 w-full max-w-md border border-default">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                            Complete L3 Repair
                        </h3>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const resolution = form.resolution.value
                            const notes = form.notes.value
                            handleComplete(completeModal, resolution, notes)
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Resolution *</label>
                                <select name="resolution" className="w-full border border-default rounded p-2 bg-card text-foreground" required>
                                    <option value="">Select resolution...</option>
                                    <option value="REPAIRED">Repaired Successfully</option>
                                    <option value="REPLACED_COMPONENT">Component Replaced</option>
                                    <option value="UNLOCKED">Unlocked (BIOS/Domain)</option>
                                    <option value="UNABLE_TO_REPAIR">Unable to Repair</option>
                                    <option value="NEEDS_PARTS">Needs Parts - On Hold</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-foreground">Notes *</label>
                                <textarea
                                    name="notes"
                                    className="w-full border border-default rounded p-2 bg-card text-foreground"
                                    rows={4}
                                    placeholder="Describe what was done to resolve the issue..."
                                    required
                                />
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
