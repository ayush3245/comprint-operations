import { getRepairJobs, startRepair, completeRepair, collectFromPaint } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import { Play, CheckCircle, Download } from 'lucide-react'

export default async function RepairPage() {
    const user = await checkRole(['REPAIR_ENGINEER', 'ADMIN'])

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

    async function handleCollect(formData: FormData) {
        'use server'
        const jobId = formData.get('jobId') as string
        await collectFromPaint(jobId)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Repair Station</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => {
                    const paintPanels = job.device.paintPanels || []
                    const allPanelsReady = paintPanels.length > 0 && paintPanels.every(p => p.status === 'READY_FOR_COLLECTION' || p.status === 'FITTED')
                    const latestQC = job.device.qcRecords?.[0]
                    const isQCRework = latestQC?.status === 'FAILED_REWORK'

                    return (
                        <div key={job.id} className={`bg-white rounded-lg shadow p-6 border-t-4 ${isQCRework ? 'border-red-500' : 'border-blue-500'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{job.device.barcode}</h3>
                                    <p className="text-sm text-gray-500">{job.device.model}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${job.status === 'UNDER_REPAIR' ? 'bg-orange-100 text-orange-800' :
                                    job.status === 'READY_FOR_REPAIR' ? 'bg-green-100 text-green-800' :
                                        job.status === 'IN_PAINT_SHOP' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                            </div>

                            {isQCRework && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs">
                                    <p className="font-bold text-red-800 mb-1">⚠️ QC FAILED - REWORK REQUIRED</p>
                                    <p className="text-red-700"><strong>QC Remarks:</strong> {latestQC.remarks || 'None'}</p>
                                </div>
                            )}

                            <div className="mb-4 text-sm text-gray-600">
                                <p><strong>Issues:</strong> {JSON.parse(job.reportedIssues || '{}').functional || 'None'}</p>
                                {job.sparesIssued && <p><strong>Spares:</strong> {job.sparesIssued}</p>}
                                {job.notes && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                        <strong>Notes:</strong>
                                        <pre className="whitespace-pre-wrap mt-1">{job.notes}</pre>
                                    </div>
                                )}
                                {job.status === 'IN_PAINT_SHOP' && (
                                    <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                                        <strong>Paint Status:</strong>
                                        <ul className="list-disc list-inside mt-1">
                                            {paintPanels.map(p => (
                                                <li key={p.id} className={p.status === 'READY_FOR_COLLECTION' ? 'text-green-600 font-bold' : ''}>
                                                    {p.panelType}: {p.status.replace('_', ' ')}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {job.tatDueDate && <p className={`mt-2 ${new Date() > job.tatDueDate ? 'text-red-600 font-bold' : ''}`}>
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
                                    <form action={handleComplete} className="w-full">
                                        <input type="hidden" name="jobId" value={job.id} />
                                        <input type="text" name="notes" placeholder="Repair Notes" className="w-full mb-2 px-2 py-1 border rounded text-sm" required />
                                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 flex justify-center items-center gap-2">
                                            <CheckCircle size={16} /> Complete Repair
                                        </button>
                                    </form>
                                )}

                                {job.status === 'IN_PAINT_SHOP' && allPanelsReady && (
                                    <form action={handleCollect} className="w-full">
                                        <input type="hidden" name="jobId" value={job.id} />
                                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 flex justify-center items-center gap-2 animate-pulse">
                                            <Download size={16} /> Collect from Paint
                                        </button>
                                    </form>
                                )}

                                {job.status === 'IN_PAINT_SHOP' && !allPanelsReady && (
                                    <div className="w-full text-center text-xs text-gray-500 italic py-2 bg-gray-50 rounded">
                                        Waiting for paint shop...
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {jobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No repair jobs assigned or available.
                    </div>
                )}
            </div>
        </div>
    )
}
