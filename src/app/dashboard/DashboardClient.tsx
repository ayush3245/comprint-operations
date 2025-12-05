'use client'

import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'
import {
    ClipboardList,
    Wrench,
    CheckCircle,
    AlertTriangle,
    Package,
    PaintBucket,
    ArrowRight,
    Clock,
    TrendingUp,
    Users,
    Box,
    Laptop,
    Monitor,
    Server
} from 'lucide-react'
import Link from 'next/link'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'

interface DashboardClientProps {
    user: { name: string; role: string } | null
    stats: {
        pendingInspection: number
        underRepair: number
        inPaint: number
        awaitingQC: number
        readyForStock: number
        waitingForSpares: number
        tatBreaches: number
    }
    activityFeed: Array<{
        id: string
        action: string
        details: string | null
        createdAt: Date
        user: { name: string; role: string }
    }>
    analytics: {
        qcEngineerStats: Array<{
            name: string
            passed: number
            failed: number
            total: number
            passRate: number
        }>
        gradeStats: {
            gradeA: number
            gradeB: number
        }
        categoryStats: Array<{
            category: string
            count: number
        }>
        workloadStats: Array<{
            name: string
            activeJobs: number
            capacity: number
        }>
        overdueDevices: Array<{
            jobId: string
            barcode: string
            model: string
            repairEng: string
            dueDate: Date | null
            daysOverdue: number
        }>
        throughputData: Array<{
            day: string
            completed: number
        }>
        batchStats: Array<{
            batchId: string
            total: number
            completed: number
            progress: number
        }>
    }
}

const GRADE_COLORS = { A: '#10B981', B: '#F59E0B' }

export default function DashboardClient({ user, stats, activityFeed, analytics }: DashboardClientProps) {
    if (!user) return null

    const isAdmin = ['ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN'].includes(user.role)

    const statItems = [
        {
            label: 'Pending Inspection',
            value: stats.pendingInspection,
            icon: ClipboardList,
            color: 'text-blue-500',
            gradient: 'from-blue-500/20 to-blue-600/5',
            roles: ['INSPECTION_ENGINEER', 'ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
        {
            label: 'Waiting for Spares',
            value: stats.waitingForSpares,
            icon: Clock,
            color: 'text-amber-500',
            gradient: 'from-amber-500/20 to-amber-600/5',
            roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN', 'SUPERADMIN']
        },
        {
            label: 'Under Repair',
            value: stats.underRepair,
            icon: Wrench,
            color: 'text-orange-500',
            gradient: 'from-orange-500/20 to-orange-600/5',
            roles: ['REPAIR_ENGINEER', 'ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
        {
            label: 'In Paint Shop',
            value: stats.inPaint,
            icon: PaintBucket,
            color: 'text-purple-500',
            gradient: 'from-purple-500/20 to-purple-600/5',
            roles: ['PAINT_SHOP_TECHNICIAN', 'ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
        {
            label: 'Awaiting QC',
            value: stats.awaitingQC,
            icon: CheckCircle,
            color: 'text-yellow-500',
            gradient: 'from-yellow-500/20 to-yellow-600/5',
            roles: ['QC_ENGINEER', 'ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
        {
            label: 'Ready for Stock',
            value: stats.readyForStock,
            icon: Package,
            color: 'text-green-500',
            gradient: 'from-green-500/20 to-green-600/5',
            roles: ['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN', 'SUPERADMIN']
        },
        {
            label: 'TAT Breaches',
            value: stats.tatBreaches,
            icon: AlertTriangle,
            color: 'text-red-500',
            gradient: 'from-red-500/20 to-red-600/5',
            roles: ['ADMIN', 'REPAIR_ENGINEER', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
    ]

    const quickActions = [
        {
            href: '/inward/new',
            label: 'New Inward Batch',
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN', 'SUPERADMIN']
        },
        {
            href: '/inspection',
            label: 'Start Inspection',
            color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
            roles: ['INSPECTION_ENGINEER', 'ADMIN', 'SUPERADMIN']
        },
        {
            href: '/repair',
            label: 'Repair Jobs',
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
            roles: ['REPAIR_ENGINEER', 'ADMIN', 'SUPERADMIN']
        },
        {
            href: '/qc',
            label: 'QC Check',
            color: 'bg-green-50 text-green-600 hover:bg-green-100',
            roles: ['QC_ENGINEER', 'ADMIN', 'SUPERADMIN']
        },
    ]

    const filteredStats = statItems.filter(item => item.roles.includes(user.role))
    const filteredActions = quickActions.filter(action => action.roles.includes(user.role))

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    // Chart Data Preparation
    const repairVolumeData = [
        { name: 'Inspection', value: stats.pendingInspection },
        { name: 'Spares', value: stats.waitingForSpares },
        { name: 'Repair', value: stats.underRepair },
        { name: 'Paint', value: stats.inPaint },
        { name: 'QC', value: stats.awaitingQC },
        { name: 'Ready', value: stats.readyForStock },
    ]

    // Grade pie chart data
    const gradeData = [
        { name: 'Grade A', value: analytics.gradeStats.gradeA, color: GRADE_COLORS.A },
        { name: 'Grade B', value: analytics.gradeStats.gradeB, color: GRADE_COLORS.B },
    ].filter(d => d.value > 0)

    // Category icon mapping
    const categoryIcon = (cat: string) => {
        switch (cat) {
            case 'LAPTOP': return <Laptop size={16} />
            case 'DESKTOP': return <Monitor size={16} />
            case 'WORKSTATION': return <Server size={16} />
            default: return <Box size={16} />
        }
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
                    Dashboard
                </h1>
                <p className="text-lg text-gray-500 font-medium">
                    Welcome back, <span className="text-blue-600">{user.name}</span>
                </p>
            </motion.div>

            {/* Stage Stats Cards */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {filteredStats.map((stat) => (
                    <motion.div key={stat.label} variants={item}>
                        <GlassCard className="p-6 h-full hover:shadow-2xl transition-shadow duration-300 border-white/40">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                                    <h3 className="text-4xl font-bold text-gray-800 tracking-tight">{stat.value}</h3>
                                </div>
                                <div className={`p-4 rounded-2xl bg-white/80 shadow-sm ${stat.color}`}>
                                    <stat.icon size={28} />
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Workflow Pipeline */}
                <GlassCard className="p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                        Workflow Pipeline
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={repairVolumeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Weekly Throughput */}
                <GlassCard className="p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-green-500 rounded-full" />
                        <TrendingUp size={20} className="text-green-500" />
                        Weekly Throughput (QC Passed)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.throughputData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

            {/* Stock Analytics Row - Admin Only */}
            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stock by Grade */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                            Ready Stock by Grade
                        </h3>
                        {gradeData.length > 0 ? (
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={gradeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                            labelLine={false}
                                        >
                                            {gradeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-gray-400">
                                No stock data available
                            </div>
                        )}
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-sm text-gray-600">Grade A: {analytics.gradeStats.gradeA}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-sm text-gray-600">Grade B: {analytics.gradeStats.gradeB}</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Stock by Category */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-purple-500 rounded-full" />
                            Ready Stock by Category
                        </h3>
                        <div className="space-y-4">
                            {analytics.categoryStats.length > 0 ? (
                                analytics.categoryStats.map((cat) => (
                                    <div key={cat.category} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/60">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-purple-50 text-purple-500`}>
                                                {categoryIcon(cat.category)}
                                            </div>
                                            <span className="font-medium text-gray-700">{cat.category}</span>
                                        </div>
                                        <span className="text-2xl font-bold text-gray-800">{cat.count}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="h-32 flex items-center justify-center text-gray-400">
                                    No category data available
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* QC Engineer Performance */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-cyan-500 rounded-full" />
                            <Users size={20} className="text-cyan-500" />
                            QC Pass Rates
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {analytics.qcEngineerStats.length > 0 ? (
                                analytics.qcEngineerStats.map((eng) => (
                                    <div key={eng.name} className="p-3 bg-white/50 rounded-xl border border-white/60">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-700 text-sm">{eng.name}</span>
                                            <span className={`text-sm font-bold ${eng.passRate >= 80 ? 'text-green-600' : eng.passRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                                {eng.passRate}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${eng.passRate >= 80 ? 'bg-green-500' : eng.passRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${eng.passRate}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                                            <span>Passed: {eng.passed}</span>
                                            <span>Failed: {eng.failed}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-32 flex items-center justify-center text-gray-400">
                                    No QC data available
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Repair Workload & Overdue Devices */}
            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Repair Engineer Workload */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-orange-500 rounded-full" />
                            <Wrench size={20} className="text-orange-500" />
                            Repair Engineer Workload
                        </h3>
                        {analytics.workloadStats.length > 0 ? (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.workloadStats} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                        <XAxis type="number" domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} width={100} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: number) => [`${value} / 10 jobs`, 'Active Jobs']}
                                        />
                                        <Bar dataKey="activeJobs" fill="#F97316" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                No active repair jobs
                            </div>
                        )}
                    </GlassCard>

                    {/* Overdue Devices */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-red-500 rounded-full" />
                            <AlertTriangle size={20} className="text-red-500" />
                            TAT Overdue Devices
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {analytics.overdueDevices.length > 0 ? (
                                analytics.overdueDevices.map((device) => (
                                    <div key={device.jobId} className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{device.barcode}</p>
                                                <p className="text-xs text-gray-500">{device.model}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                                                    {device.daysOverdue} days overdue
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1">{device.repairEng}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-48 flex items-center justify-center text-green-500 font-medium">
                                    <CheckCircle size={24} className="mr-2" />
                                    No overdue devices
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Batch Progress & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Batch Completion Progress - Admin Only */}
                {isAdmin && (
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                            Recent Batch Progress
                        </h3>
                        <div className="space-y-4">
                            {analytics.batchStats.length > 0 ? (
                                analytics.batchStats.map((batch) => (
                                    <div key={batch.batchId} className="p-4 bg-white/50 rounded-xl border border-white/60">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-gray-800">{batch.batchId}</span>
                                            <span className="text-sm text-gray-500">
                                                {batch.completed} / {batch.total} devices
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all ${batch.progress === 100 ? 'bg-green-500' : batch.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                style={{ width: `${batch.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-right text-xs text-gray-500 mt-1">{batch.progress}% complete</p>
                                    </div>
                                ))
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400">
                                    No batch data available
                                </div>
                            )}
                        </div>
                    </GlassCard>
                )}

                {/* Recent Activity */}
                <GlassCard className={`p-8 ${!isAdmin ? 'lg:col-span-2' : ''}`}>
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                        Recent Activity
                    </h3>
                    <div className="space-y-4">
                        {activityFeed.length === 0 ? (
                            <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <p className="text-gray-400 font-medium">No recent activity</p>
                            </div>
                        ) : (
                            activityFeed.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/50 border border-white/60 shadow-sm hover:shadow-md transition-all">
                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                        <ClipboardList size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">
                                            {activity.user.name} <span className="font-normal text-gray-500">performed</span> {activity.action.replace(/_/g, ' ')}
                                        </p>
                                        {activity.details && (
                                            <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-8">
                <GlassCard className="p-8" gradient>
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-purple-500 rounded-full" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {filteredActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className={`group relative p-4 rounded-xl font-bold text-sm transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center h-24 ${action.color}`}
                            >
                                <span>{action.label}</span>
                                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                        {filteredActions.length === 0 && (
                            <div className="col-span-4 flex items-center justify-center h-24 text-gray-400 text-sm font-medium">
                                No quick actions available for your role.
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
