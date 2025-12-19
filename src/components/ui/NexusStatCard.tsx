'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface NexusStatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  iconColor?: string
  iconBgColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  onClick?: () => void
  className?: string
  delay?: number
}

const NexusStatCard = React.memo(function NexusStatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  iconBgColor = 'bg-blue-50 dark:bg-blue-500/20',
  trend,
  subtitle,
  onClick,
  className,
  delay = 0
}: NexusStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        // Base styles
        'relative p-4 md:p-6 rounded-xl md:rounded-2xl',
        // Light mode
        'bg-white border border-gray-100 shadow-sm',
        // Dark mode - semi-transparent like Nexus
        'dark:bg-white/5 dark:border-white/10',
        // Hover effects
        'hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
        'dark:hover:bg-white/10',
        // Cursor
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Header: Label + Icon */}
      <div className="flex items-start justify-between mb-3">
        {/* Label - Nexus style uppercase */}
        <span className="font-display text-[14px] md:text-[15px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
          {label}
        </span>

        {/* Icon */}
        {Icon && (
          <div className={cn('p-2 rounded-lg', iconBgColor)}>
            <Icon size={16} className={iconColor} />
          </div>
        )}
      </div>

      {/* Value - Nexus brand font */}
      <h3 className="text-2xl md:text-3xl font-brand font-bold text-gray-900 dark:text-white">
        {value}
      </h3>

      {/* Trend indicator or subtitle */}
      {(trend || subtitle) && (
        <div className="mt-2">
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-xs font-medium',
                trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
})

export default NexusStatCard

// Alert variant for important stats like TAT breaches
interface NexusAlertCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  variant: 'danger' | 'warning' | 'success' | 'info'
  subtitle?: string
  onClick?: () => void
  className?: string
  delay?: number
}

const variantStyles = {
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-500',
    value: 'text-red-700 dark:text-red-300'
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-500',
    value: 'text-orange-700 dark:text-orange-300'
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-500',
    value: 'text-emerald-700 dark:text-emerald-300'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-500',
    value: 'text-blue-700 dark:text-blue-300'
  }
}

export const NexusAlertCard = React.memo(function NexusAlertCard({
  label,
  value,
  icon: Icon,
  variant,
  subtitle,
  onClick,
  className,
  delay = 0
}: NexusAlertCardProps) {
  const styles = variantStyles[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        'relative p-4 md:p-6 rounded-xl border',
        styles.bg,
        styles.border,
        'hover:shadow-md transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={16} className={styles.icon} />}
        <span className={cn(
          'text-xs font-semibold uppercase tracking-wide',
          styles.text
        )}>
          {label}
        </span>
      </div>

      {/* Value */}
      <h3 className={cn('text-2xl font-brand font-bold', styles.value)}>
        {value}
      </h3>

      {/* Subtitle */}
      {subtitle && (
        <p className={cn('text-xs mt-1 opacity-80', styles.text)}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
})
