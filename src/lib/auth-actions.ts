'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(userId: string) {
    const cookieStore = await cookies()
    cookieStore.set('userId', userId)
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('userId')
    redirect('/login')
}
