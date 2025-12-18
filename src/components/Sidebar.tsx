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
    ChevronRight,
    Menu,
    X,
    Users,
    Monitor,
    Battery,
    Cpu
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

    // Shared sidebar content
    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            {/* Mobile Close Button */}
            {isMobile && (
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Header with Brand and Theme Toggle */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-2xl font-brand font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                            COMPRINT
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium tracking-widest uppercase">Operations Portal</p>
                    </motion.div>
                    {!isMobile && (
                        <div className="hidden md:block">
                            <ThemeToggle />
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {filteredLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname.startsWith(link.href)

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="relative block group"
                        >
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId={isMobile ? "activeTabMobile" : "activeTab"}
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <div className={cn(
                                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                    isActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}>
                                    <Icon size={18} className={cn(
                                        "transition-colors duration-200",
                                        isActive ? "text-indigo-400" : "group-hover:text-indigo-300"
                                    )} />
                                    <span className="font-medium text-sm">{link.label}</span>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="ml-auto"
                                        >
                                            <ChevronRight size={14} className="text-indigo-400" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center gap-3 px-3 py-2.5 mb-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.role.replace(/_/g, ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-200 text-sm font-medium group"
                >
                    <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Sign Out</span>
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center justify-between px-4 border-b border-slate-700/50 shadow-lg">
                <div className="flex items-center">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="ml-3 text-lg font-brand font-bold text-white tracking-tight">COMPRINT</span>
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
                            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        {/* Mobile Sidebar */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="md:hidden fixed left-0 top-0 h-screen w-72 bg-slate-900 border-r border-slate-700/50 text-slate-100 shadow-2xl z-50 flex flex-col"
                        >
                            <SidebarContent isMobile />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar - Always visible */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-slate-900 border-r border-slate-700/50 text-slate-100 shadow-2xl z-50 flex-col">
                <SidebarContent />
            </aside>
        </>
    )
}
