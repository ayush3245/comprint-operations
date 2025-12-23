'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode
    variant?: 'default' | 'primary' | 'danger' | 'warning' | 'success'
    size?: 'sm' | 'md'
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, variant = 'default', size = 'md', className, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled}
                className={cn(
                    // Base styles
                    'inline-flex items-center justify-center rounded-lg border cursor-pointer transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'active:scale-95',
                    // Size variants
                    {
                        'p-1.5': size === 'sm',
                        'p-2': size === 'md',
                    },
                    // Color variants
                    {
                        // Default - neutral gray
                        'border-gray-300 bg-card text-muted-foreground hover:bg-muted hover:text-foreground hover:border-gray-400 focus:ring-gray-300 dark:border-gray-600 dark:hover:border-gray-500':
                            variant === 'default',
                        // Primary - blue
                        'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-400 focus:ring-blue-300 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 dark:hover:border-blue-400':
                            variant === 'primary',
                        // Danger - red
                        'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 focus:ring-red-300 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:border-red-400':
                            variant === 'danger',
                        // Warning - yellow/amber
                        'border-yellow-300 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-400 focus:ring-yellow-300 dark:border-yellow-500/50 dark:bg-yellow-500/10 dark:text-yellow-400 dark:hover:bg-yellow-500/20 dark:hover:border-yellow-400':
                            variant === 'warning',
                        // Success - green
                        'border-green-300 bg-green-50 text-green-600 hover:bg-green-100 hover:border-green-400 focus:ring-green-300 dark:border-green-500/50 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 dark:hover:border-green-400':
                            variant === 'success',
                    },
                    className
                )}
                {...props}
            >
                {icon}
            </button>
        )
    }
)

IconButton.displayName = 'IconButton'

export { IconButton }
