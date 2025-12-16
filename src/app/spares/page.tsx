import { getSparesRequests, issueSpares } from '@/lib/actions'
import { formatDate } from '@/lib/utils'
import { PackageCheck } from 'lucide-react'
import { checkRole } from '@/lib/auth'

export default async function SparesPage() {
    await checkRole(['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'])
    const requests = await getSparesRequests()

    async function handleIssue(formData: FormData) {
        'use server'
        const jobId = formData.get('jobId') as string
        const sparesIssued = formData.get('sparesIssued') as string
        await issueSpares(jobId, sparesIssued)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-foreground">Spares Requests</h1>

            <div className="bg-card rounded-xl shadow-soft border border-default overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                                    No pending spares requests.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
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
                                        <form action={handleIssue} className="flex gap-2">
                                            <input type="hidden" name="jobId" value={req.id} />
                                            <input
                                                type="text"
                                                name="sparesIssued"
                                                placeholder="Confirm Issued Spares"
                                                className="px-2 py-1 bg-muted border border-input rounded-lg text-sm w-40 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                                required
                                                defaultValue={req.sparesRequired || ''}
                                            />
                                            <button
                                                type="submit"
                                                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center gap-1 transition-colors"
                                            >
                                                <PackageCheck size={16} />
                                                Issue
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
