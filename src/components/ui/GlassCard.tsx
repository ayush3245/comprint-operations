'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLMotionProps<"div"> {
    gradient?: boolean
    hover?: boolean
}

const GlassCard = React.memo(function GlassCard({
    className,
    children,
    gradient = false,
    hover = false,
    ...props
}: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                'relative overflow-hidden rounded-xl md:rounded-2xl',
                // Light mode: white with subtle shadow
                'bg-white shadow-sm border border-gray-100',
                // Dark mode: semi-transparent Nexus style
                'dark:bg-white/5 dark:border-white/10',
                // Hover effects (optional)
                hover && 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200 dark:hover:bg-white/10 cursor-pointer',
                // Gradient option
                gradient && 'bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/20',
                className
            )}
            {...props}
        >
            {gradient && (
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            )}
            <div className="relative z-10">
                {children as React.ReactNode}
            </div>
        </motion.div>
    )
})

export default GlassCard
