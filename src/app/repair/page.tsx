import { getRepairJobs, startRepair, completeRepair, sendToPaint } from '@/lib/actions'
import { getCurrentUser } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import { Play, CheckCircle, PaintBucket } from 'lucide-react'

export default async function RepairPage() {
    const user = await getCurrentUser()
    if (!user) return null

    const jobs = await getRepairJobs(user.id)

    async function handleStart(formData: FormData) {
        'use server'
        if (!user) return
        const jobId = formData.get('jobId') as string
        try {
            await startRepair(jobId, user.id)
        } catch (e: any) {
            // In a real app, show toast
            console.error(e.message)
        }
    }

    async function handleComplete(formData: FormData) {
        'use server'
        const jobId = formData.get('jobId') as string
        const notes = formData.get('notes') as string
        await completeRepair(jobId, notes)
    }

    async function handlePaint(formData: FormData) {
        'use server'
        const jobId = formData.get('jobId') as string
        await sendToPaint(jobId)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Repair Station</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{job.device.barcode}</h3>
                                <p className="text-sm text-gray-500">{job.device.model}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${job.status === 'UNDER_REPAIR' ? 'bg-orange-100 text-orange-800' :
                                    job.status === 'READY_FOR_REPAIR' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {job.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="mb-4 text-sm text-gray-600">
                            <p><strong>Issues:</strong> {JSON.parse(job.reportedIssues || '{}').functional || 'None'}</p>
                            {job.sparesIssued && <p><strong>Spares:</strong> {job.sparesIssued}</p>}
                            {job.tatDueDate && <p className={new Date() > job.tatDueDate ? 'text-red-600 font-bold' : ''}>
                                <strong>Due:</strong> {formatDate(job.tatDueDate)}
                            </p>}
                        </div>

                        <div className="flex gap-2 mt-4">
                            {job.status === 'READY_FOR_REPAIR' && (
                                <form action={handleStart} className="w-full">
                                    <input type="hidden" name="jobId" value={job.id} />
                                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2">
                                        <Play size={16} /> Start
                                    </button>
                                </form>
                            )}

                            {job.status === 'UNDER_REPAIR' && (
                                <div className="w-full space-y-2">
                                    <form action={handlePaint} className="w-full">
                                        <input type="hidden" name="jobId" value={job.id} />
                                        <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 flex justify-center items-center gap-2">
                                            <PaintBucket size={16} /> Send to Paint
                                        </button>
                                    </form>

                                    <form action={handleComplete} className="w-full">
                                        <input type="hidden" name="jobId" value={job.id} />
                                        <input type="text" name="notes" placeholder="Repair Notes" className="w-full mb-2 px-2 py-1 border rounded text-sm" required />
                                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 flex justify-center items-center gap-2">
                                            <CheckCircle size={16} /> Complete
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {jobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No repair jobs assigned or available.
                    </div>
                )}
            </div>
        </div>
    )
}
