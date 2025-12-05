'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
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
    Users
} from 'lucide-react'
import { logout } from '@/lib/auth-actions'
import { cn } from '@/lib/utils'

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
            { href: '/repair', label: 'Repair Station', icon: Wrench, roles: ['SUPERADMIN'] },
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
            { href: '/repair', label: 'Repair Station', icon: Wrench, roles: ['REPAIR_ENGINEER', 'ADMIN'] },
            { href: '/paint', label: 'Paint Shop', icon: PaintBucket, roles: ['PAINT_SHOP_TECHNICIAN', 'ADMIN'] },
            { href: '/qc', label: 'QC', icon: ClipboardCheck, roles: ['QC_ENGINEER', 'ADMIN'] },
            { href: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'] },
            { href: '/outward', label: 'Outward', icon: Truck, roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'] },
        ]

    const filteredLinks = baseLinks.filter(link =>
        link.roles.length === 0 || link.roles.includes(user.role)
    )

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center px-4 border-b border-white/10 shadow-md">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
                <span className="ml-3 text-lg font-bold text-white tracking-tight">COMPRINT</span>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <motion.div
                className={cn(
                    "fixed left-0 top-0 h-screen w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 text-slate-100 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Mobile Close Button */}
                <div className="md:hidden absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            COMPRINT
                        </h1>
                        <p className="text-xs text-slate-400 mt-1 font-medium tracking-widest uppercase">Operations Portal</p>
                    </motion.div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {filteredLinks.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname.startsWith(link.href)

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative block group"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <div className={cn(
                                    "relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200",
                                    isActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}>
                                    <Icon size={20} className={cn(
                                        "transition-colors duration-200",
                                        isActive ? "text-blue-400" : "group-hover:text-blue-300"
                                    )} />
                                    <span className="font-medium tracking-wide text-sm">{link.label}</span>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="ml-auto"
                                        >
                                            <ChevronRight size={16} className="text-blue-400" />
                                        </motion.div>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 bg-slate-950/30">
                    <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-white/10">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-slate-200">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate font-medium">{user.role.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200 text-sm font-semibold border border-transparent hover:border-red-500/20 group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </motion.div>
        </>
    )
}
