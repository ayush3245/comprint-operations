'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { login } from '@/lib/auth-actions'
import { useTheme } from '@/components/ThemeProvider'

export default function LoginPage() {
    const router = useRouter()
    const { theme, setTheme, resolvedTheme } = useTheme()
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
            console.log('Attempting login with:', email)
            const result = await login(email, password)
            console.log('Login result:', result)

            if (result.success) {
                router.push('/dashboard')
                router.refresh()
            } else {
                setError(result.error || 'Login failed')
            }
        } catch (err) {
            console.error('Login error caught:', err)
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 dark:from-indigo-500/10 dark:to-violet-500/10" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

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
                <div className="bg-card/80 backdrop-blur-xl border border-default rounded-2xl shadow-soft p-8">
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-3xl font-black tracking-tighter font-brand text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400"
                        >
                            COMPRINT
                        </motion.h1>
                        <p className="text-muted-foreground mt-2 text-sm font-medium tracking-wide">
                            Operations Portal
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
                                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                                    className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
    )
}
