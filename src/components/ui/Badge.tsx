'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          // Sizes
          {
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-2.5 py-1 text-xs': size === 'md',
          },
          // Variants
          {
            'bg-primary/10 text-primary': variant === 'default',
            'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400': variant === 'success',
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400': variant === 'warning',
            'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400': variant === 'error',
            'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400': variant === 'info',
            'bg-secondary text-muted-foreground': variant === 'neutral',
          },
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full', {
              'bg-primary': variant === 'default',
              'bg-green-500': variant === 'success',
              'bg-yellow-500': variant === 'warning',
              'bg-red-500': variant === 'error',
              'bg-blue-500': variant === 'info',
              'bg-muted-foreground': variant === 'neutral',
            })}
          />
        )}
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
