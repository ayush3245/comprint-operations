import { cookies } from 'next/headers'
import { prisma } from './db'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) return null

    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    return user
}

export async function requireUser() {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }
    return user
}

export async function login(userId: string) {
    const cookieStore = await cookies()
    cookieStore.set('userId', userId)
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('userId')
    redirect('/login')
}
