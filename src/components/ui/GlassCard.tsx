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
                'relative overflow-hidden rounded-2xl shadow-soft backdrop-blur-xl',
                'border border-default',
                // Light mode
                gradient
                    ? 'bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-900/40'
                    : 'bg-white/70 dark:bg-slate-800/70',
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
