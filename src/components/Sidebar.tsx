import Link from 'next/link'
import { getCurrentUser, logout } from '@/lib/auth'
import {
    LayoutDashboard,
    PackagePlus,
    Search,
    Wrench,
    PaintBucket,
    ClipboardCheck,
    Warehouse,
    LogOut
} from 'lucide-react'

export default async function Sidebar() {
    const user = await getCurrentUser()
    if (!user) return null

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] }, // All
        { href: '/inward', label: 'Inward', icon: PackagePlus, roles: ['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN'] },
        { href: '/inspection', label: 'Inspection', icon: Search, roles: ['INSPECTION_ENGINEER', 'ADMIN'] },
        { href: '/repair', label: 'Repair Station', icon: Wrench, roles: ['REPAIR_ENGINEER', 'ADMIN'] },
        { href: '/paint', label: 'Paint Shop', icon: PaintBucket, roles: ['PAINT_SHOP_TECHNICIAN', 'ADMIN'] },
        { href: '/qc', label: 'QC', icon: ClipboardCheck, roles: ['QC_ENGINEER', 'ADMIN'] },
        { href: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'] },
    ]

    const filteredLinks = links.filter(link =>
        link.roles.length === 0 || link.roles.includes(user.role)
    )

    return (
        <div className="w-64 bg-slate-900 text-slate-100 h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800 shadow-xl z-50">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                <h1 className="text-xl font-bold tracking-wider text-white">COMPRINT</h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">Operations Portal</p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {filteredLinks.map((link) => {
                    const Icon = link.icon
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all duration-200 group"
                        >
                            <Icon size={20} className="group-hover:text-blue-400 transition-colors" />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.role.replace(/_/g, ' ')}</p>
                    </div>
                </div>
                <form action={async () => {
                    'use server'
                    await logout()
                }}>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm font-medium">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </form>
            </div>
        </div>
    )
}
