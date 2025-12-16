'use client'

import { Clock, Activity, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardStatsProps {
    pending: number
    inProgress: number
    completed: number
    onPendingClick?: () => void
    onInProgressClick?: () => void
    onCompletedClick?: () => void
    labels?: {
        pending?: string
        inProgress?: string
        completed?: string
    }
}

export default function DashboardStats({
    pending,
    inProgress,
    completed,
    onPendingClick,
    onInProgressClick,
    onCompletedClick,
    labels = {}
}: DashboardStatsProps) {
    const {
        pending: pendingLabel = 'Pending',
        inProgress: inProgressLabel = 'In Progress',
        completed: completedLabel = 'Completed'
    } = labels

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Pending */}
            <div
                onClick={onPendingClick}
                className={cn(
                    'bg-card rounded-xl shadow-card p-5 border-l-4 border-yellow-500',
                    'transition-all duration-200',
                    onPendingClick && 'cursor-pointer hover:shadow-soft'
                )}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{pendingLabel}</p>
                        <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pending}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-full">
                        <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                </div>
                {onPendingClick && (
                    <p className="text-xs text-muted-foreground mt-3">Click to view</p>
                )}
            </div>

            {/* In Progress */}
            <div
                onClick={onInProgressClick}
                className={cn(
                    'bg-card rounded-xl shadow-card p-5 border-l-4 border-indigo-500',
                    'transition-all duration-200',
                    onInProgressClick && 'cursor-pointer hover:shadow-soft'
                )}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{inProgressLabel}</p>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{inProgress}</p>
                    </div>
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-full">
                        <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                {onInProgressClick && (
                    <p className="text-xs text-muted-foreground mt-3">Click to view</p>
                )}
            </div>

            {/* Completed */}
            <div
                onClick={onCompletedClick}
                className={cn(
                    'bg-card rounded-xl shadow-card p-5 border-l-4 border-green-500',
                    'transition-all duration-200',
                    onCompletedClick && 'cursor-pointer hover:shadow-soft'
                )}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{completedLabel}</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{completed}</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                {onCompletedClick && (
                    <p className="text-xs text-muted-foreground mt-3">Click to view</p>
                )}
            </div>
        </div>
    )
}
