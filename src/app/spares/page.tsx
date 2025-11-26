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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Spares Requests</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required Spares</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                    No pending spares requests.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {req.jobId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-medium text-gray-900">{req.device.barcode}</div>
                                        <div className="text-xs">{req.device.model}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-red-600 font-medium">
                                        {req.sparesRequired}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {req.inspectionEng?.name || 'Unknown'}
                                        <div className="text-xs text-gray-400">{formatDate(req.createdAt)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <form action={handleIssue} className="flex gap-2">
                                            <input type="hidden" name="jobId" value={req.id} />
                                            <input
                                                type="text"
                                                name="sparesIssued"
                                                placeholder="Confirm Issued Spares"
                                                className="px-2 py-1 border border-gray-300 rounded text-sm w-40"
                                                required
                                                defaultValue={req.sparesRequired || ''}
                                            />
                                            <button
                                                type="submit"
                                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
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
