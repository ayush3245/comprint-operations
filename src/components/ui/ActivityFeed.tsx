'use client'

import { motion } from 'framer-motion'
import { cn, formatRelativeTime } from '@/lib/utils'
import {
  ClipboardCheck,
  Wrench,
  CheckCircle,
  Package,
  Truck,
  LucideIcon
} from 'lucide-react'

type ActivityType = 'inspection' | 'repair' | 'qc' | 'inward' | 'outward'

interface ActivityItem {
  id: string
  user: { name: string; initials: string }
  action: string
  target: string
  timestamp: Date | string
  type: ActivityType
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxHeight?: string
  className?: string
  emptyMessage?: string
}

const activityConfig: Record<ActivityType, {
  icon: LucideIcon
  color: string
  bgColor: string
}> = {
  inspection: {
    icon: ClipboardCheck,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
  },
  repair: {
    icon: Wrench,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
  },
  qc: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
  },
  inward: {
    icon: Package,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50',
  },
  outward: {
    icon: Truck,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/50',
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
}

export function ActivityFeed({
  activities,
  maxHeight = '400px',
  className,
  emptyMessage = 'No recent activity'
}: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-8 text-muted-foreground',
        className
      )}>
        <Package size={40} className="mb-2 opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn('overflow-y-auto', className)}
      style={{ maxHeight }}
    >
      <div className="space-y-3">
        {activities.map((activity) => {
          const config = activityConfig[activity.type]
          const Icon = config.icon

          return (
            <motion.div
              key={activity.id}
              variants={itemVariants}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              {/* User Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {activity.user.initials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground">
                    {activity.user.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {activity.action}
                  </span>
                  <span className="font-mono text-sm text-foreground truncate">
                    {activity.target}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    config.bgColor,
                    config.color
                  )}>
                    <Icon size={12} />
                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export type { ActivityItem, ActivityType, ActivityFeedProps }
