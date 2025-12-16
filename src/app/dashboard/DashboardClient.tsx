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
import { useTheme } from '@/components/ThemeProvider'

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
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    if (!user) return null

    const isAdmin = ['ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN'].includes(user.role)

    // Chart colors based on theme
    const chartColors = {
        grid: isDark ? '#334155' : '#E5E7EB',
        text: isDark ? '#94a3b8' : '#6B7280',
        tooltip: {
            bg: isDark ? '#1e293b' : '#ffffff',
            border: isDark ? '#334155' : '#e2e8f0'
        },
        bar: isDark ? '#818cf8' : '#4f46e5',
        line: isDark ? '#34d399' : '#10B981',
        orange: isDark ? '#fb923c' : '#F97316'
    }

    const statItems = [
        {
            label: 'Pending Inspection',
            value: stats.pendingInspection,
            icon: ClipboardList,
            iconColor: 'text-indigo-600 dark:text-indigo-300',
            cardBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200/80 dark:from-indigo-900/60 dark:to-indigo-800/40',
            iconBg: 'bg-indigo-200/80 dark:bg-indigo-700/50',
            borderColor: 'border-indigo-200 dark:border-indigo-700/50',
            roles: ['INSPECTION_ENGINEER', 'ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
        {
            label: 'Waiting for Spares',
            value: stats.waitingForSpares,
            icon: Clock,
            iconColor: 'text-amber-600 dark:text-amber-300',
            cardBg: 'bg-gradient-to-br from-amber-100 to-amber-200/80 dark:from-amber-900/60 dark:to-amber-800/40',
            iconBg: 'bg-amber-200/80 dark:bg-amber-700/50',
            borderColor: 'border-amber-200 dark:border-amber-700/50',
            roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN', 'SUPERADMIN']
        },
        {
            label: 'Under Repair',
            value: stats.underRepair,
            icon: Wrench,
            iconColor: 'text-orange-600 dark:text-orange-300',
            cardBg: 'bg-gradient-to-br from-orange-100 to-orange-200/80 dark:from-orange-900/60 dark:to-orange-800/40',
            iconBg: 'bg-orange-200/80 dark:bg-orange-700/50',
            borderColor: 'border-orange-200 dark:border-orange-700/50',
            roles: ['REPAIR_ENGINEER', 'ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
        {
            label: 'In Paint Shop',
            value: stats.inPaint,
            icon: PaintBucket,
            iconColor: 'text-purple-600 dark:text-purple-300',
            cardBg: 'bg-gradient-to-br from-purple-100 to-purple-200/80 dark:from-purple-900/60 dark:to-purple-800/40',
            iconBg: 'bg-purple-200/80 dark:bg-purple-700/50',
            borderColor: 'border-purple-200 dark:border-purple-700/50',
            roles: ['PAINT_SHOP_TECHNICIAN', 'ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
        {
            label: 'Awaiting QC',
            value: stats.awaitingQC,
            icon: CheckCircle,
            iconColor: 'text-yellow-600 dark:text-yellow-300',
            cardBg: 'bg-gradient-to-br from-yellow-100 to-yellow-200/80 dark:from-yellow-900/60 dark:to-yellow-800/40',
            iconBg: 'bg-yellow-200/80 dark:bg-yellow-700/50',
            borderColor: 'border-yellow-200 dark:border-yellow-700/50',
            roles: ['QC_ENGINEER', 'ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
        {
            label: 'Ready for Stock',
            value: stats.readyForStock,
            icon: Package,
            iconColor: 'text-green-600 dark:text-green-300',
            cardBg: 'bg-gradient-to-br from-green-100 to-green-200/80 dark:from-green-900/60 dark:to-green-800/40',
            iconBg: 'bg-green-200/80 dark:bg-green-700/50',
            borderColor: 'border-green-200 dark:border-green-700/50',
            roles: ['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN', 'SUPERADMIN']
        },
        {
            label: 'TAT Breaches',
            value: stats.tatBreaches,
            icon: AlertTriangle,
            iconColor: 'text-red-600 dark:text-red-300',
            cardBg: 'bg-gradient-to-br from-red-100 to-red-200/80 dark:from-red-900/60 dark:to-red-800/40',
            iconBg: 'bg-red-200/80 dark:bg-red-700/50',
            borderColor: 'border-red-200 dark:border-red-700/50',
            roles: ['ADMIN', 'REPAIR_ENGINEER', 'WAREHOUSE_MANAGER', 'SUPERADMIN']
        },
    ]

    const quickActions = [
        {
            href: '/inward/new',
            label: 'New Inward Batch',
            color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20',
            roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN', 'SUPERADMIN']
        },
        {
            href: '/inspection',
            label: 'Start Inspection',
            color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20',
            roles: ['INSPECTION_ENGINEER', 'ADMIN', 'SUPERADMIN']
        },
        {
            href: '/repair',
            label: 'Repair Jobs',
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20',
            roles: ['REPAIR_ENGINEER', 'ADMIN', 'SUPERADMIN']
        },
        {
            href: '/qc',
            label: 'QC Check',
            color: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20',
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
                <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">
                    Dashboard
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                    Welcome back, <span className="text-primary">{user.name}</span>
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
                        <div className={`p-6 h-full rounded-2xl border shadow-soft hover:shadow-xl transition-all duration-300 ${stat.cardBg} ${stat.borderColor}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">{stat.label}</p>
                                    <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.iconBg} ${stat.iconColor}`}>
                                    <stat.icon size={28} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Workflow Pipeline */}
                <GlassCard className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                        Workflow Pipeline
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={repairVolumeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: isDark ? '#1e293b' : '#F3F4F6' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: `1px solid ${chartColors.tooltip.border}`,
                                        backgroundColor: chartColors.tooltip.bg,
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                                />
                                <Bar dataKey="value" fill={chartColors.bar} radius={[4, 4, 0, 0]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Weekly Throughput */}
                <GlassCard className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-green-500 rounded-full" />
                        <TrendingUp size={20} className="text-green-500" />
                        Weekly Throughput (QC Passed)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.throughputData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: `1px solid ${chartColors.tooltip.border}`,
                                        backgroundColor: chartColors.tooltip.bg,
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke={chartColors.line}
                                    strokeWidth={3}
                                    dot={{ fill: chartColors.line, strokeWidth: 2, r: 4 }}
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
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
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
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: `1px solid ${chartColors.tooltip.border}`,
                                                backgroundColor: chartColors.tooltip.bg
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-muted-foreground">
                                No stock data available
                            </div>
                        )}
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-sm text-muted-foreground">Grade A: {analytics.gradeStats.gradeA}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-sm text-muted-foreground">Grade B: {analytics.gradeStats.gradeB}</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Stock by Category */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-purple-500 rounded-full" />
                            Ready Stock by Category
                        </h3>
                        <div className="space-y-4">
                            {analytics.categoryStats.length > 0 ? (
                                analytics.categoryStats.map((cat) => (
                                    <div key={cat.category} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-default">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/20 text-purple-500">
                                                {categoryIcon(cat.category)}
                                            </div>
                                            <span className="font-medium text-foreground">{cat.category}</span>
                                        </div>
                                        <span className="text-2xl font-bold text-foreground">{cat.count}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="h-32 flex items-center justify-center text-muted-foreground">
                                    No category data available
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* QC Engineer Performance */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-cyan-500 rounded-full" />
                            <Users size={20} className="text-cyan-500" />
                            QC Pass Rates
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {analytics.qcEngineerStats.length > 0 ? (
                                analytics.qcEngineerStats.map((eng) => (
                                    <div key={eng.name} className="p-3 bg-secondary/50 rounded-xl border border-default">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-foreground text-sm">{eng.name}</span>
                                            <span className={`text-sm font-bold ${eng.passRate >= 80 ? 'text-green-600 dark:text-green-400' : eng.passRate >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {eng.passRate}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${eng.passRate >= 80 ? 'bg-green-500' : eng.passRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${eng.passRate}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                            <span>Passed: {eng.passed}</span>
                                            <span>Failed: {eng.failed}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-32 flex items-center justify-center text-muted-foreground">
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
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-orange-500 rounded-full" />
                            <Wrench size={20} className="text-orange-500" />
                            Repair Engineer Workload
                        </h3>
                        {analytics.workloadStats.length > 0 ? (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.workloadStats} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={chartColors.grid} />
                                        <XAxis type="number" domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} width={100} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: `1px solid ${chartColors.tooltip.border}`,
                                                backgroundColor: chartColors.tooltip.bg,
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                                            formatter={(value: number) => [`${value} / 10 jobs`, 'Active Jobs']}
                                        />
                                        <Bar dataKey="activeJobs" fill={chartColors.orange} radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                No active repair jobs
                            </div>
                        )}
                    </GlassCard>

                    {/* Overdue Devices */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-red-500 rounded-full" />
                            <AlertTriangle size={20} className="text-red-500" />
                            TAT Overdue Devices
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {analytics.overdueDevices.length > 0 ? (
                                analytics.overdueDevices.map((device) => (
                                    <div key={device.jobId} className="p-3 bg-red-50/50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{device.barcode}</p>
                                                <p className="text-xs text-muted-foreground">{device.model}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
                                                    {device.daysOverdue} days overdue
                                                </span>
                                                <p className="text-xs text-muted-foreground mt-1">{device.repairEng}</p>
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
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                            Recent Batch Progress
                        </h3>
                        <div className="space-y-4">
                            {analytics.batchStats.length > 0 ? (
                                analytics.batchStats.map((batch) => (
                                    <div key={batch.batchId} className="p-4 bg-secondary/50 rounded-xl border border-default">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-foreground">{batch.batchId}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {batch.completed} / {batch.total} devices
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all ${batch.progress === 100 ? 'bg-green-500' : batch.progress >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                                style={{ width: `${batch.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-right text-xs text-muted-foreground mt-1">{batch.progress}% complete</p>
                                    </div>
                                ))
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    No batch data available
                                </div>
                            )}
                        </div>
                    </GlassCard>
                )}

                {/* Recent Activity */}
                <GlassCard className={`p-8 ${!isAdmin ? 'lg:col-span-2' : ''}`}>
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                        Recent Activity
                    </h3>
                    <div className="space-y-4">
                        {activityFeed.length === 0 ? (
                            <div className="h-48 flex items-center justify-center border-2 border-dashed border-default rounded-2xl bg-muted/50">
                                <p className="text-muted-foreground font-medium">No recent activity</p>
                            </div>
                        ) : (
                            activityFeed.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-default shadow-sm hover:shadow-md transition-all">
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                        <ClipboardList size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-foreground">
                                            {activity.user.name} <span className="font-normal text-muted-foreground">performed</span> {activity.action.replace(/_/g, ' ')}
                                        </p>
                                        {activity.details && (
                                            <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground/70 mt-2">
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
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
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
                            <div className="col-span-4 flex items-center justify-center h-24 text-muted-foreground text-sm font-medium">
                                No quick actions available for your role.
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
