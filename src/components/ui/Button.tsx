'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          // Variants
          {
            // Primary - Indigo
            'bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-primary':
              variant === 'primary',
            // Secondary
            'bg-secondary text-secondary-foreground hover:bg-secondary-hover focus-visible:ring-secondary':
              variant === 'secondary',
            // Ghost
            'bg-transparent text-foreground hover:bg-secondary focus-visible:ring-secondary':
              variant === 'ghost',
            // Danger
            'bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive':
              variant === 'danger',
            // Outline
            'border-2 border-default bg-transparent text-foreground hover:bg-secondary focus-visible:ring-primary':
              variant === 'outline',
            // Success
            'bg-success text-success-foreground hover:opacity-90 focus-visible:ring-success':
              variant === 'success',
          },
          // Sizes
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
