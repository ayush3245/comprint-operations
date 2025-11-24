'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
    isLoading?: boolean
    icon?: React.ElementType
}

export default function AnimatedButton({
    className,
    variant = 'primary',
    isLoading,
    icon: Icon,
    children,
    ...props
}: AnimatedButtonProps) {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 border-transparent',
        secondary: 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 shadow-sm',
        danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:shadow-red-500/30 border-transparent',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent shadow-none',
        outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 border',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                variants[variant],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && Icon && <Icon className="w-4 h-4 mr-2" />}
            {children as React.ReactNode}
        </motion.button>
    )
}
