import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
    ClipboardList,
    Wrench,
    CheckCircle,
    AlertTriangle,
    Package,
    PaintBucket
} from 'lucide-react'

export default async function DashboardPage() {
    const user = await getCurrentUser()

    // Fetch counts
    const pendingInspection = await prisma.device.count({ where: { status: 'PENDING_INSPECTION' } })
    const underRepair = await prisma.device.count({ where: { status: 'UNDER_REPAIR' } })
    const inPaint = await prisma.device.count({ where: { status: 'IN_PAINT_SHOP' } })
    const awaitingQC = await prisma.device.count({ where: { status: 'AWAITING_QC' } })
    const readyForStock = await prisma.device.count({ where: { status: 'READY_FOR_STOCK' } })

    // Mock TAT breaches for now, or calculate if needed
    const tatBreaches = await prisma.repairJob.count({
        where: {
            status: 'UNDER_REPAIR',
            tatDueDate: { lt: new Date() }
        }
    })

    const stats = [
        { label: 'Pending Inspection', value: pendingInspection, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Under Repair', value: underRepair, icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'In Paint Shop', value: inPaint, icon: PaintBucket, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Awaiting QC', value: awaitingQC, icon: CheckCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Ready for Stock', value: readyForStock, icon: Package, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'TAT Breaches', value: tatBreaches, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    ]

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500">Welcome back, {user?.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className={`p-4 rounded-full ${stat.bg} mr-4`}>
                            <stat.icon className={stat.color} size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="text-gray-500 text-sm italic">
                        Activity log implementation pending...
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <a href="/inward/new" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center font-medium text-blue-600">
                            New Inward Batch
                        </a>
                        <a href="/inspection" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center font-medium text-blue-600">
                            Start Inspection
                        </a>
                        <a href="/repair" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center font-medium text-blue-600">
                            My Repair Jobs
                        </a>
                        <a href="/qc" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center font-medium text-blue-600">
                            QC Check
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
