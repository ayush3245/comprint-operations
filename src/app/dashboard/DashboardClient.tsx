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
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface DashboardClientProps {
    user: { name: string } | null
    stats: {
        pendingInspection: number
        underRepair: number
        inPaint: number
        awaitingQC: number
        readyForStock: number
        tatBreaches: number
    }
}

export default function DashboardClient({ user, stats }: DashboardClientProps) {
    const statItems = [
        { label: 'Pending Inspection', value: stats.pendingInspection, icon: ClipboardList, color: 'text-blue-500', gradient: 'from-blue-500/20 to-blue-600/5' },
        { label: 'Under Repair', value: stats.underRepair, icon: Wrench, color: 'text-orange-500', gradient: 'from-orange-500/20 to-orange-600/5' },
        { label: 'In Paint Shop', value: stats.inPaint, icon: PaintBucket, color: 'text-purple-500', gradient: 'from-purple-500/20 to-purple-600/5' },
        { label: 'Awaiting QC', value: stats.awaitingQC, icon: CheckCircle, color: 'text-yellow-500', gradient: 'from-yellow-500/20 to-yellow-600/5' },
        { label: 'Ready for Stock', value: stats.readyForStock, icon: Package, color: 'text-green-500', gradient: 'from-green-500/20 to-green-600/5' },
        { label: 'TAT Breaches', value: stats.tatBreaches, icon: AlertTriangle, color: 'text-red-500', gradient: 'from-red-500/20 to-red-600/5' },
    ]

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
                    Welcome back, <span className="text-blue-600">{user?.name}</span>
                </p>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {statItems.map((stat) => (
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                        Recent Activity
                    </h3>
                    <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <p className="text-gray-400 font-medium">Activity feed coming soon...</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-8" gradient>
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-purple-500 rounded-full" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { href: '/inward/new', label: 'New Inward Batch', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                            { href: '/inspection', label: 'Start Inspection', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
                            { href: '/repair', label: 'My Repair Jobs', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
                            { href: '/qc', label: 'QC Check', color: 'bg-green-50 text-green-600 hover:bg-green-100' },
                        ].map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className={`group relative p-4 rounded-xl font-bold text-sm transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center h-24 ${action.color}`}
                            >
                                <span>{action.label}</span>
                                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
