'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Sun, Moon,
    Package, CheckCircle, Cpu, Shield
} from 'lucide-react'
import { login } from '@/lib/auth-actions'
import { useTheme } from '@/components/ThemeProvider'

export default function LoginPage() {
    const router = useRouter()
    const { setTheme, resolvedTheme } = useTheme()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const result = await login(email, password)

            if (result.success) {
                router.push('/dashboard')
                router.refresh()
            } else {
                setError(result.error || 'Login failed')
            }
        } catch {
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Section - Branded Area (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
                {/* Animated Background Shapes */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Header */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-4xl font-black tracking-tight font-brand text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                COMPRINT
                            </h1>
                            <p className="text-slate-400 mt-2 text-lg font-medium">
                                Operations Management System
                            </p>
                        </motion.div>
                    </div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <Package size={20} className="text-indigo-400" />
                                    </div>
                                    <span className="text-2xl font-bold text-white">5000+</span>
                                </div>
                                <p className="text-sm text-slate-400">Devices Processed</p>
                            </div>
                            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <CheckCircle size={20} className="text-green-400" />
                                    </div>
                                    <span className="text-2xl font-bold text-white">98%</span>
                                </div>
                                <p className="text-sm text-slate-400">QC Pass Rate</p>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3 mt-8">
                            <div className="flex items-center gap-3 text-slate-300">
                                <Cpu size={18} className="text-indigo-400" />
                                <span className="text-sm">Multi-stage Repair Workflow</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <Shield size={18} className="text-violet-400" />
                                <span className="text-sm">Role-Based Access Control</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <Package size={18} className="text-blue-400" />
                                <span className="text-sm">Real-time Inventory Tracking</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-slate-500 text-sm"
                    >
                        <p>Version 1.2.1</p>
                        <p className="mt-1">Warehouse Management System</p>
                    </motion.div>
                </div>
            </div>

            {/* Right Section - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background relative overflow-hidden">
                {/* Background gradient effects (visible on all screens) */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 dark:from-indigo-500/10 dark:to-violet-500/10" />
                <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl lg:hidden" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl lg:hidden" />

                {/* Theme toggle button */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-4 right-4 p-2.5 rounded-xl bg-card border border-default shadow-soft text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                    aria-label="Toggle theme"
                >
                    {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md relative z-10"
                >
                    {/* Mobile Brand Header */}
                    <div className="text-center mb-8 lg:hidden">
                        <h1 className="text-3xl font-black tracking-tighter font-brand text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400">
                            COMPRINT
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm font-medium tracking-wide">
                            Operations Portal
                        </p>
                    </div>

                    <div className="bg-card/80 backdrop-blur-xl border border-default rounded-2xl shadow-soft p-8">
                        {/* Desktop Header */}
                        <div className="hidden lg:block text-center mb-8">
                            <h2 className="text-2xl font-bold text-foreground">
                                Welcome back
                            </h2>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Sign in to your account to continue
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                                >
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
                                        placeholder="Enter your email"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
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

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        <span>Sign In</span>
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </div>

                    <p className="text-center text-muted-foreground text-xs mt-6">
                        Contact your administrator if you need access
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
