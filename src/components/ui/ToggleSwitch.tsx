'use client'

import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    label?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
    label = true,
    size = 'md',
    className
}: ToggleSwitchProps) {
    const handleClick = () => {
        if (!disabled) {
            onChange(!checked)
        }
    }

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={handleClick}
            className={cn(
                'inline-flex items-center gap-3 cursor-pointer transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 rounded-full',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
        >
            {/* Toggle Track */}
            <span
                className={cn(
                    'relative inline-flex items-center rounded-full transition-colors duration-300',
                    // Size variants for track
                    {
                        'h-5 w-9': size === 'sm',
                        'h-7 w-14': size === 'md',
                        'h-8 w-16': size === 'lg',
                    },
                    // Color based on checked state
                    checked
                        ? 'bg-green-500 dark:bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                )}
            >
                {/* Toggle Circle */}
                <span
                    className={cn(
                        'inline-block rounded-full bg-white shadow-md transform transition-transform duration-300',
                        // Size variants for circle
                        {
                            'h-3.5 w-3.5': size === 'sm',
                            'h-5 w-5': size === 'md',
                            'h-6 w-6': size === 'lg',
                        },
                        // Position based on checked state and size
                        checked && size === 'sm' && 'translate-x-[18px]',
                        checked && size === 'md' && 'translate-x-[30px]',
                        checked && size === 'lg' && 'translate-x-[34px]',
                        !checked && size === 'sm' && 'translate-x-[3px]',
                        !checked && (size === 'md' || size === 'lg') && 'translate-x-[4px]'
                    )}
                />
            </span>

            {/* Label */}
            {label && (
                <span
                    className={cn(
                        'font-semibold transition-colors duration-200',
                        // Size variants for label
                        {
                            'text-xs': size === 'sm',
                            'text-sm': size === 'md',
                            'text-base': size === 'lg',
                        },
                        // Color based on checked state
                        checked
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                    )}
                >
                    {checked ? 'Active' : 'Inactive'}
                </span>
            )}
        </button>
    )
}
