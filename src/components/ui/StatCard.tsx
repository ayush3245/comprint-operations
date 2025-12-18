'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ColorVariant =
  | 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  | 'orange' | 'pink' | 'teal' | 'indigo' | 'cyan'
  | 'slate' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: ColorVariant
  trend?: { value: number; isPositive: boolean }
  onClick?: () => void
  className?: string
}

const colorMap: Record<ColorVariant, {
  card: string
  iconBg: string
  iconColor: string
  border: string
}> = {
  blue: {
    card: 'from-blue-50 to-blue-100/80 dark:from-blue-950/60 dark:to-blue-900/40',
    iconBg: 'bg-blue-500/20 dark:bg-blue-500/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/50 dark:border-blue-700/50',
  },
  green: {
    card: 'from-green-50 to-green-100/80 dark:from-green-950/60 dark:to-green-900/40',
    iconBg: 'bg-green-500/20 dark:bg-green-500/30',
    iconColor: 'text-green-600 dark:text-green-400',
    border: 'border-green-200/50 dark:border-green-700/50',
  },
  yellow: {
    card: 'from-yellow-50 to-yellow-100/80 dark:from-yellow-950/60 dark:to-yellow-900/40',
    iconBg: 'bg-yellow-500/20 dark:bg-yellow-500/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200/50 dark:border-yellow-700/50',
  },
  red: {
    card: 'from-red-50 to-red-100/80 dark:from-red-950/60 dark:to-red-900/40',
    iconBg: 'bg-red-500/20 dark:bg-red-500/30',
    iconColor: 'text-red-600 dark:text-red-400',
    border: 'border-red-200/50 dark:border-red-700/50',
  },
  purple: {
    card: 'from-purple-50 to-purple-100/80 dark:from-purple-950/60 dark:to-purple-900/40',
    iconBg: 'bg-purple-500/20 dark:bg-purple-500/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200/50 dark:border-purple-700/50',
  },
  orange: {
    card: 'from-orange-50 to-orange-100/80 dark:from-orange-950/60 dark:to-orange-900/40',
    iconBg: 'bg-orange-500/20 dark:bg-orange-500/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200/50 dark:border-orange-700/50',
  },
  pink: {
    card: 'from-pink-50 to-pink-100/80 dark:from-pink-950/60 dark:to-pink-900/40',
    iconBg: 'bg-pink-500/20 dark:bg-pink-500/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200/50 dark:border-pink-700/50',
  },
  teal: {
    card: 'from-teal-50 to-teal-100/80 dark:from-teal-950/60 dark:to-teal-900/40',
    iconBg: 'bg-teal-500/20 dark:bg-teal-500/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200/50 dark:border-teal-700/50',
  },
  indigo: {
    card: 'from-indigo-50 to-indigo-100/80 dark:from-indigo-950/60 dark:to-indigo-900/40',
    iconBg: 'bg-indigo-500/20 dark:bg-indigo-500/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200/50 dark:border-indigo-700/50',
  },
  cyan: {
    card: 'from-cyan-50 to-cyan-100/80 dark:from-cyan-950/60 dark:to-cyan-900/40',
    iconBg: 'bg-cyan-500/20 dark:bg-cyan-500/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200/50 dark:border-cyan-700/50',
  },
  slate: {
    card: 'from-slate-50 to-slate-100/80 dark:from-slate-950/60 dark:to-slate-900/40',
    iconBg: 'bg-slate-500/20 dark:bg-slate-500/30',
    iconColor: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200/50 dark:border-slate-700/50',
  },
  emerald: {
    card: 'from-emerald-50 to-emerald-100/80 dark:from-emerald-950/60 dark:to-emerald-900/40',
    iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/50 dark:border-emerald-700/50',
  },
  amber: {
    card: 'from-amber-50 to-amber-100/80 dark:from-amber-950/60 dark:to-amber-900/40',
    iconBg: 'bg-amber-500/20 dark:bg-amber-500/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/50 dark:border-amber-700/50',
  },
  rose: {
    card: 'from-rose-50 to-rose-100/80 dark:from-rose-950/60 dark:to-rose-900/40',
    iconBg: 'bg-rose-500/20 dark:bg-rose-500/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/50 dark:border-rose-700/50',
  },
  violet: {
    card: 'from-violet-50 to-violet-100/80 dark:from-violet-950/60 dark:to-violet-900/40',
    iconBg: 'bg-violet-500/20 dark:bg-violet-500/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/50 dark:border-violet-700/50',
  },
  sky: {
    card: 'from-sky-50 to-sky-100/80 dark:from-sky-950/60 dark:to-sky-900/40',
    iconBg: 'bg-sky-500/20 dark:bg-sky-500/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200/50 dark:border-sky-700/50',
  },
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon: Icon, color = 'indigo', trend, onClick, className }, ref) => {
    const colors = colorMap[color]

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={onClick ? { scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={cn(
          'p-6 rounded-2xl border shadow-soft',
          'bg-gradient-to-br',
          colors.card,
          colors.border,
          'transition-all duration-300',
          'hover:shadow-xl',
          onClick && 'cursor-pointer',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {value}
              </h3>
              {trend && (
                <span
                  className={cn(
                    'flex items-center text-sm font-medium',
                    trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {trend.isPositive ? (
                    <ArrowUpRight size={16} className="mr-0.5" />
                  ) : (
                    <ArrowDownRight size={16} className="mr-0.5" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
          <div className={cn('p-4 rounded-2xl', colors.iconBg)}>
            <Icon size={28} className={colors.iconColor} />
          </div>
        </div>
      </motion.div>
    )
  }
)

StatCard.displayName = 'StatCard'

export { StatCard, type StatCardProps, type ColorVariant }
