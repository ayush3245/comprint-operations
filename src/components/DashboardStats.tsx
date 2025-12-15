'use client'

import { Clock, Loader2, CheckCircle } from 'lucide-react'

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
                className={`bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500 ${
                    onPendingClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{pendingLabel}</p>
                        <p className="text-3xl font-bold text-yellow-600">{pending}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                        <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                </div>
                {onPendingClick && (
                    <p className="text-xs text-gray-400 mt-2">Click to view</p>
                )}
            </div>

            {/* In Progress */}
            <div
                onClick={onInProgressClick}
                className={`bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 ${
                    onInProgressClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{inProgressLabel}</p>
                        <p className="text-3xl font-bold text-blue-600">{inProgress}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                        <Loader2 className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
                {onInProgressClick && (
                    <p className="text-xs text-gray-400 mt-2">Click to view</p>
                )}
            </div>

            {/* Completed */}
            <div
                onClick={onCompletedClick}
                className={`bg-white rounded-lg shadow p-4 border-l-4 border-green-500 ${
                    onCompletedClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{completedLabel}</p>
                        <p className="text-3xl font-bold text-green-600">{completed}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                </div>
                {onCompletedClick && (
                    <p className="text-xs text-gray-400 mt-2">Click to view</p>
                )}
            </div>
        </div>
    )
}
