import { cookies } from 'next/headers'
import { prisma } from './db'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

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

export async function checkRole(allowedRoles: Role[]) {
    const user = await requireUser()
    if (!allowedRoles.includes(user.role)) {
        redirect('/dashboard?error=unauthorized')
    }
    return user
}


