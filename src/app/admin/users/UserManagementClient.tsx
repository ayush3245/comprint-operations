'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    Plus,
    Edit2,
    Trash2,
    Key,
    X,
    AlertCircle,
    CheckCircle,
    Mail,
    User,
    Shield,
    Eye,
    EyeOff,
    Search
} from 'lucide-react'
import { Role } from '@prisma/client'
import {
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword
} from '@/lib/user-actions'
import GlassCard from '@/components/ui/GlassCard'
import { IconButton } from '@/components/ui/IconButton'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

type UserData = {
    id: string
    name: string
    email: string
    role: Role
    active: boolean
    createdAt: Date
    updatedAt: Date
}

interface Props {
    users: UserData[]
}

const ROLES: { value: Role; label: string }[] = [
    { value: 'SUPERADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MIS_WAREHOUSE_EXECUTIVE', label: 'MIS Warehouse Executive' },
    { value: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager' },
    { value: 'INSPECTION_ENGINEER', label: 'Inspection Engineer' },
    { value: 'L2_ENGINEER', label: 'L2 Engineer (Coordinator)' },
    { value: 'L3_ENGINEER', label: 'L3 Engineer (Major Repairs)' },
    { value: 'DISPLAY_TECHNICIAN', label: 'Display Technician' },
    { value: 'BATTERY_TECHNICIAN', label: 'Battery Technician' },
    { value: 'PAINT_SHOP_TECHNICIAN', label: 'Paint Shop Technician' },
    { value: 'QC_ENGINEER', label: 'QC Engineer' },
]

function getRoleBadgeColor(role: Role): string {
    switch (role) {
        case 'SUPERADMIN':
            return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
        case 'ADMIN':
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
        case 'MIS_WAREHOUSE_EXECUTIVE':
        case 'WAREHOUSE_MANAGER':
            return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
        case 'INSPECTION_ENGINEER':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30'
        case 'L2_ENGINEER':
            return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30'
        case 'L3_ENGINEER':
            return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
        case 'DISPLAY_TECHNICIAN':
            return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30'
        case 'BATTERY_TECHNICIAN':
            return 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-500/20 dark:text-lime-300 dark:border-lime-500/30'
        case 'PAINT_SHOP_TECHNICIAN':
            return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30'
        case 'QC_ENGINEER':
            return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30'
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30'
    }
}

export default function UserManagementClient({ users: initialUsers }: Props) {
    const [users, setUsers] = useState(initialUsers)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState<Role | ''>('')
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'password'>('create')
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'ADMIN' as Role,
        active: true
    })
    const [showPassword, setShowPassword] = useState(false)
    const [modalError, setModalError] = useState<string | null>(null)

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = !filterRole || user.role === filterRole
        return matchesSearch && matchesRole
    })

    function showNotification(type: 'success' | 'error', message: string) {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 4000)
    }

    function openCreateModal() {
        setFormData({ name: '', email: '', password: '', role: 'ADMIN', active: true })
        setModalMode('create')
        setSelectedUser(null)
        setModalError(null)
        setShowModal(true)
    }

    function openEditModal(user: UserData) {
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            active: user.active
        })
        setModalMode('edit')
        setSelectedUser(user)
        setModalError(null)
        setShowModal(true)
    }

    function openPasswordModal(user: UserData) {
        setFormData({ ...formData, password: '' })
        setModalMode('password')
        setSelectedUser(user)
        setModalError(null)
        setShowModal(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setModalError(null)

        try {
            if (modalMode === 'create') {
                const result = await createUser(formData)
                if (result.success) {
                    showNotification('success', 'User created successfully')
                    setShowModal(false)
                    window.location.reload()
                } else {
                    // Show error inside modal for better visibility
                    setModalError(result.error || 'Failed to create user')
                }
            } else if (modalMode === 'edit' && selectedUser) {
                const result = await updateUser(selectedUser.id, formData)
                if (result.success) {
                    showNotification('success', 'User updated successfully')
                    setShowModal(false)
                    window.location.reload()
                } else {
                    setModalError(result.error || 'Failed to update user')
                }
            } else if (modalMode === 'password' && selectedUser) {
                const result = await resetUserPassword(selectedUser.id, formData.password)
                if (result.success) {
                    showNotification('success', 'Password reset successfully')
                    setShowModal(false)
                } else {
                    setModalError(result.error || 'Failed to reset password')
                }
            }
        } catch {
            setModalError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggleStatus(user: UserData) {
        setIsLoading(true)
        try {
            const result = await toggleUserStatus(user.id)
            if (result.success) {
                setUsers(users.map(u =>
                    u.id === user.id ? { ...u, active: !u.active } : u
                ))
                showNotification('success', `User ${user.active ? 'deactivated' : 'activated'} successfully`)
            } else {
                showNotification('error', result.error || 'Failed to update user status')
            }
        } catch {
            showNotification('error', 'An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete(user: UserData) {
        if (!confirm(`Are you sure you want to delete "${user.name}"? This action cannot be undone.`)) {
            return
        }

        setIsLoading(true)
        try {
            const result = await deleteUser(user.id)
            if (result.success) {
                setUsers(users.filter(u => u.id !== user.id))
                showNotification('success', 'User deleted successfully')
            } else {
                showNotification('error', result.error || 'Failed to delete user')
            }
        } catch {
            showNotification('error', 'An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8" suppressHydrationWarning>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">User Management</h1>
                        <p className="text-muted-foreground text-sm md:text-base mt-1 font-medium">Manage user accounts, roles, and credentials</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards - Positioned at top for visibility */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <GlassCard className="p-5 border-l-4 border-l-blue-500">
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Total Users</p>
                    <p className="text-3xl font-black text-foreground mt-2">{users.length}</p>
                </GlassCard>
                <GlassCard className="p-5 border-l-4 border-l-green-500">
                    <p className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider">Active</p>
                    <p className="text-3xl font-black text-foreground mt-2">{users.filter(u => u.active).length}</p>
                </GlassCard>
                <GlassCard className="p-5 border-l-4 border-l-red-500">
                    <p className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">Inactive</p>
                    <p className="text-3xl font-black text-foreground mt-2">{users.filter(u => !u.active).length}</p>
                </GlassCard>
                <GlassCard className="p-5 border-l-4 border-l-purple-500">
                    <p className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">Admins</p>
                    <p className="text-3xl font-black text-foreground mt-2">{users.filter(u => u.role === 'SUPERADMIN' || u.role === 'ADMIN').length}</p>
                </GlassCard>
            </div>

            {/* Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm ${notification.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400'
                            : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
                            }`}
                    >
                        {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="font-medium">{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters and Add Button */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-card border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium shadow-sm"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as Role | '')}
                    className="px-5 py-3.5 bg-card border border-input rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                >
                    <option value="">All Roles</option>
                    {ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                            {role.label}
                        </option>
                    ))}
                </select>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all whitespace-nowrap"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    <span>Add User</span>
                </motion.button>
            </div>

            {/* Users Table */}
            <GlassCard className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="text-muted-foreground" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">No users found</h3>
                            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md flex-shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">{user.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        checked={user.active}
                                        onChange={() => handleToggleStatus(user)}
                                        disabled={isLoading}
                                        size="sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                                        {user.role.replace(/_/g, ' ')}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <IconButton
                                            icon={<Key size={16} />}
                                            variant="warning"
                                            size="sm"
                                            onClick={() => openPasswordModal(user)}
                                            disabled={isLoading}
                                            title="Reset Password"
                                        />
                                        <IconButton
                                            icon={<Edit2 size={16} />}
                                            variant="primary"
                                            size="sm"
                                            onClick={() => openEditModal(user)}
                                            disabled={isLoading}
                                            title="Edit User"
                                        />
                                        <IconButton
                                            icon={<Trash2 size={16} />}
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(user)}
                                            disabled={isLoading}
                                            title="Delete User"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full bg-card">
                        <thead>
                            <tr className="border-b border-default bg-muted">
                                <th className="px-6 py-5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredUsers.map((user, index) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-card hover:bg-muted transition-all duration-200"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-foreground text-base">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-muted-foreground font-medium">{user.email}</td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                                            {user.role.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <ToggleSwitch
                                            checked={user.active}
                                            onChange={() => handleToggleStatus(user)}
                                            disabled={isLoading}
                                            size="md"
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2">
                                            <IconButton
                                                icon={<Key size={18} strokeWidth={2} />}
                                                variant="warning"
                                                onClick={() => openPasswordModal(user)}
                                                disabled={isLoading}
                                                title="Reset Password"
                                            />
                                            <IconButton
                                                icon={<Edit2 size={18} strokeWidth={2} />}
                                                variant="primary"
                                                onClick={() => openEditModal(user)}
                                                disabled={isLoading}
                                                title="Edit User"
                                            />
                                            <IconButton
                                                icon={<Trash2 size={18} strokeWidth={2} />}
                                                variant="danger"
                                                onClick={() => handleDelete(user)}
                                                disabled={isLoading}
                                                title="Delete User"
                                            />
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="hidden md:block p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="text-muted-foreground" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No users found</h3>
                        <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
                    </div>
                )}
            </GlassCard>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-default flex items-center justify-between bg-muted/50">
                                <h2 className="text-xl font-bold text-foreground">
                                    {modalMode === 'create' && 'Create New User'}
                                    {modalMode === 'edit' && 'Edit User'}
                                    {modalMode === 'password' && 'Reset Password'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Error display inside modal for better visibility */}
                                {modalError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400">
                                        <AlertCircle size={18} className="flex-shrink-0" />
                                        <span className="text-sm font-medium">{modalError}</span>
                                    </div>
                                )}

                                {modalMode !== 'password' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-bold text-foreground">Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-muted border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card transition-all"
                                                    placeholder="Enter full name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-sm font-bold text-foreground">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-muted border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card transition-all"
                                                    placeholder="Enter email address"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-sm font-bold text-foreground">Role</label>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <select
                                                    value={formData.role}
                                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-muted border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card transition-all appearance-none"
                                                    required
                                                >
                                                    {ROLES.map(role => (
                                                        <option key={role.value} value={role.value}>
                                                            {role.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {(modalMode === 'create' || modalMode === 'password') && (
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold text-foreground">
                                            {modalMode === 'password' ? 'New Password' : 'Password'}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-10 pr-12 py-2.5 bg-muted border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card transition-all"
                                                placeholder="Min. 6 characters"
                                                required={modalMode === 'create' || modalMode === 'password'}
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {modalMode === 'edit' && (
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold text-foreground">
                                            New Password <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-10 pr-12 py-2.5 bg-muted border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card transition-all"
                                                placeholder="Min. 6 characters"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {modalMode === 'password' && selectedUser && (
                                    <p className="text-sm text-muted-foreground">
                                        Resetting password for <span className="text-foreground font-bold">{selectedUser.name}</span>
                                    </p>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-muted border border-input text-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        type="submit"
                                        disabled={isLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                        ) : (
                                            <>
                                                {modalMode === 'create' && 'Create User'}
                                                {modalMode === 'edit' && 'Save Changes'}
                                                {modalMode === 'password' && 'Reset Password'}
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
