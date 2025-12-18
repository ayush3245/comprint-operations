'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertType = 'danger' | 'warning' | 'success' | 'info'

interface AlertCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  type?: AlertType
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

const typeStyles: Record<AlertType, {
  card: string
  border: string
  iconBg: string
  iconColor: string
  titleColor: string
  valueColor: string
}> = {
  danger: {
    card: 'bg-red-50/50 dark:bg-red-950/30',
    border: 'border-l-4 border-l-red-500 border-red-200/50 dark:border-red-800/50',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-900 dark:text-red-100',
    valueColor: 'text-red-700 dark:text-red-300',
  },
  warning: {
    card: 'bg-amber-50/50 dark:bg-amber-950/30',
    border: 'border-l-4 border-l-amber-500 border-amber-200/50 dark:border-amber-800/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-900 dark:text-amber-100',
    valueColor: 'text-amber-700 dark:text-amber-300',
  },
  success: {
    card: 'bg-green-50/50 dark:bg-green-950/30',
    border: 'border-l-4 border-l-green-500 border-green-200/50 dark:border-green-800/50',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-900 dark:text-green-100',
    valueColor: 'text-green-700 dark:text-green-300',
  },
  info: {
    card: 'bg-blue-50/50 dark:bg-blue-950/30',
    border: 'border-l-4 border-l-blue-500 border-blue-200/50 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-900 dark:text-blue-100',
    valueColor: 'text-blue-700 dark:text-blue-300',
  },
}

const AlertCard = forwardRef<HTMLDivElement, AlertCardProps>(
  ({ title, value, icon: Icon, type = 'info', description, action, className }, ref) => {
    const styles = typeStyles[type]

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'p-4 rounded-xl border shadow-soft',
          styles.card,
          styles.border,
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn('p-2.5 rounded-xl shrink-0', styles.iconBg)}>
            <Icon size={20} className={styles.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className={cn('font-semibold text-sm', styles.titleColor)}>
                {title}
              </h4>
              <span className={cn('text-2xl font-bold tabular-nums', styles.valueColor)}>
                {value}
              </span>
            </div>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className={cn(
                  'mt-2 text-sm font-medium underline-offset-4 hover:underline',
                  styles.iconColor
                )}
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }
)

AlertCard.displayName = 'AlertCard'

export { AlertCard, type AlertCardProps, type AlertType }
