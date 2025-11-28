'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from './db'
import { verifyPassword } from './password'

export type LoginResult = {
    success: boolean
    error?: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
    try {
        console.log('Login attempt for:', email)

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        })

        if (!user) {
            console.log('User not found:', email)
            return { success: false, error: 'Invalid email or password' }
        }

        if (!user.active) {
            console.log('User inactive:', email)
            return { success: false, error: 'Your account has been deactivated. Please contact the administrator.' }
        }

        const isValid = await verifyPassword(password, user.password)

        if (!isValid) {
            console.log('Invalid password for:', email)
            return { success: false, error: 'Invalid email or password' }
        }

        const cookieStore = await cookies()
        cookieStore.set('userId', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        console.log('Login successful for:', email)
        return { success: true }
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: 'An error occurred during login. Please try again.' }
    }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('userId')
    redirect('/login')
}
