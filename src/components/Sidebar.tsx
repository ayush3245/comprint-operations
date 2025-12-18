'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    PackagePlus,
    Search,
    Wrench,
    PaintBucket,
    ClipboardCheck,
    Warehouse,
    Truck,
    Cog,
    LogOut,
    Menu,
    X,
    Users,
    Monitor,
    Battery,
    Cpu,
    Box
} from 'lucide-react'
import { logout } from '@/lib/auth-actions'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface SidebarProps {
    user: {
        name: string
        role: string
    }
}

export default function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    // Close sidebar on route change
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Build links based on user role
    const baseLinks = user.role === 'SUPERADMIN'
        ? [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPERADMIN'] },
            { href: '/admin/users', label: 'User Management', icon: Users, roles: ['SUPERADMIN'] },
            { href: '/admin/spares', label: 'Spare Parts', icon: Cog, roles: ['SUPERADMIN'] },
            { href: '/inward', label: 'Inward', icon: PackagePlus, roles: ['SUPERADMIN'] },
            { href: '/inspection', label: 'Inspection', icon: Search, roles: ['SUPERADMIN'] },
            { href: '/spares', label: 'Spares Requests', icon: Wrench, roles: ['SUPERADMIN'] },
            { href: '/l2-repair', label: 'L2 Repair', icon: Wrench, roles: ['SUPERADMIN'] },
            { href: '/l3-repair', label: 'L3 Repair', icon: Cpu, roles: ['SUPERADMIN'] },
            { href: '/display-repair', label: 'Display Repair', icon: Monitor, roles: ['SUPERADMIN'] },
            { href: '/battery-boost', label: 'Battery Boost', icon: Battery, roles: ['SUPERADMIN'] },
            { href: '/repair', label: 'Repair (Legacy)', icon: Wrench, roles: ['SUPERADMIN'] },
            { href: '/paint', label: 'Paint Shop', icon: PaintBucket, roles: ['SUPERADMIN'] },
            { href: '/qc', label: 'QC', icon: ClipboardCheck, roles: ['SUPERADMIN'] },
            { href: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['SUPERADMIN'] },
            { href: '/outward', label: 'Outward', icon: Truck, roles: ['SUPERADMIN'] },
        ]
        : [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] },
            { href: '/inward', label: 'Inward', icon: PackagePlus, roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'] },
            { href: '/inspection', label: 'Inspection', icon: Search, roles: ['INSPECTION_ENGINEER', 'ADMIN'] },
            { href: '/spares', label: 'Spares Requests', icon: Cog, roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'] },
            { href: '/admin/spares', label: 'Spare Parts', icon: Cog, roles: ['WAREHOUSE_MANAGER', 'ADMIN'] },
            { href: '/l2-repair', label: 'L2 Repair', icon: Wrench, roles: ['L2_ENGINEER', 'REPAIR_ENGINEER', 'ADMIN'] },
            { href: '/l3-repair', label: 'L3 Repair', icon: Cpu, roles: ['L3_ENGINEER', 'ADMIN'] },
            { href: '/display-repair', label: 'Display Repair', icon: Monitor, roles: ['DISPLAY_TECHNICIAN', 'L2_ENGINEER', 'ADMIN'] },
            { href: '/battery-boost', label: 'Battery Boost', icon: Battery, roles: ['BATTERY_TECHNICIAN', 'L2_ENGINEER', 'ADMIN'] },
            { href: '/repair', label: 'Repair (Legacy)', icon: Wrench, roles: ['REPAIR_ENGINEER', 'ADMIN'] },
            { href: '/paint', label: 'Paint Shop', icon: PaintBucket, roles: ['PAINT_SHOP_TECHNICIAN', 'ADMIN'] },
            { href: '/qc', label: 'QC', icon: ClipboardCheck, roles: ['QC_ENGINEER', 'ADMIN'] },
            { href: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'] },
            { href: '/outward', label: 'Outward', icon: Truck, roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'] },
        ]

    const filteredLinks = baseLinks.filter(link =>
        link.roles.length === 0 || link.roles.includes(user.role)
    )

    // Get initials from name
    const getInitials = (name: string): string => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    }

    // Shared sidebar content
    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            {/* Logo Area - Theme Aware */}
            <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 dark:border-white/10">
                <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
                    <Box className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 dark:text-emerald-400 mr-2 md:mr-3" />
                    <div className="text-left">
                        <h1 className="font-brand font-bold text-lg md:text-xl tracking-tighter uppercase leading-none text-gray-900 dark:text-white">
                            COMPRINT
                        </h1>
                        <span className="font-display text-[9px] md:text-[10px] text-gray-500 tracking-[0.15em] uppercase">
                            Operations
                        </span>
                    </div>
                </Link>
                {isMobile ? (
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                ) : (
                    <div className="hidden md:block">
                        <ThemeToggle />
                    </div>
                )}
            </div>

            {/* Navigation - Theme Aware */}
            <nav className="flex-1 py-3 md:py-4 px-2 md:px-3 space-y-1 overflow-y-auto">
                {filteredLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname.startsWith(link.href)

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "w-full flex items-center px-3 py-2 md:py-2.5 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white shadow-sm border border-blue-100 dark:border-white/20"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            <Icon
                                size={18}
                                className={cn(
                                    "mr-2 md:mr-3 transition-colors",
                                    isActive
                                        ? "text-blue-500 dark:text-blue-400"
                                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-white"
                                )}
                            />
                            <span className={cn("text-sm", isActive && "font-medium")}>
                                {link.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId={isMobile ? "activeIndicatorMobile" : "activeIndicator"}
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* User Section - Theme Aware */}
            <div className="p-3 md:p-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center mb-3 md:mb-4 px-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center font-brand font-bold text-xs md:text-sm text-white shadow-lg">
                        {getInitials(user.name)}
                    </div>
                    <div className="ml-2 md:ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.role.replace(/_/g, ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center px-3 md:px-4 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 active:bg-red-200 dark:active:bg-red-500/30 transition-all text-sm font-medium border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile Header - Theme Aware */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#0A0A0A] z-40 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/10 shadow-sm dark:shadow-lg">
                <div className="flex items-center">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <Box className="ml-3 w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                    <span className="ml-2 text-lg font-brand font-bold text-gray-900 dark:text-white tracking-tight uppercase">
                        COMPRINT
                    </span>
                </div>
                <ThemeToggle />
            </div>

            {/* Mobile Sidebar with AnimatePresence */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed inset-0 bg-black/40 dark:bg-black/60 z-40 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        {/* Mobile Sidebar - Theme Aware */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="md:hidden fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#0A0A0A] border-r border-gray-200 dark:border-white/10 shadow-2xl z-50 flex flex-col"
                        >
                            <SidebarContent isMobile />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar - Theme Aware */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#0A0A0A] border-r border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl z-50 flex-col">
                <SidebarContent />
            </aside>
        </>
    )
}
