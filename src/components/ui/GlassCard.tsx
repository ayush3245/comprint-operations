'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLMotionProps<"div"> {
    gradient?: boolean
}

export default function GlassCard({
    className,
    children,
    gradient = false,
    ...props
}: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                'relative overflow-hidden rounded-2xl shadow-soft',
                'border border-default',
                'bg-card text-card-foreground',
                gradient && 'bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/30 dark:to-violet-950/30',
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
}
