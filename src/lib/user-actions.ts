'use server'

import { prisma } from './db'
import { hashPassword } from './password'
import { getCurrentUser } from './auth'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export type UserFormData = {
    name: string
    email: string
    password?: string
    role: Role
    active?: boolean
}

export type ActionResult = {
    success: boolean
    error?: string
}

async function requireSuperAdmin() {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPERADMIN') {
        throw new Error('Unauthorized: SUPERADMIN access required')
    }
    return user
}

export async function getAllUsers() {
    await requireSuperAdmin()

    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: [
            { role: 'asc' },
            { name: 'asc' }
        ]
    })
}

export async function getUserById(id: string) {
    await requireSuperAdmin()

    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
        }
    })
}

export async function createUser(data: UserFormData): Promise<ActionResult> {
    try {
        await requireSuperAdmin()

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase().trim() }
        })

        if (existingUser) {
            return { success: false, error: 'A user with this email already exists' }
        }

        if (!data.password) {
            return { success: false, error: 'Password is required' }
        }

        if (data.password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' }
        }

        const hashedPassword = await hashPassword(data.password)

        await prisma.user.create({
            data: {
                name: data.name.trim(),
                email: data.email.toLowerCase().trim(),
                password: hashedPassword,
                role: data.role,
                active: data.active ?? true,
            }
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error creating user:', error)
        return { success: false, error: 'Failed to create user' }
    }
}

export async function updateUser(id: string, data: Partial<UserFormData>): Promise<ActionResult> {
    try {
        const currentUser = await requireSuperAdmin()

        // Prevent superadmin from deactivating themselves
        if (currentUser.id === id && data.active === false) {
            return { success: false, error: 'You cannot deactivate your own account' }
        }

        // Prevent superadmin from changing their own role
        if (currentUser.id === id && data.role && data.role !== 'SUPERADMIN') {
            return { success: false, error: 'You cannot change your own role' }
        }

        // Check if email is being changed and already exists
        if (data.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: data.email.toLowerCase().trim() }
            })
            if (existingUser && existingUser.id !== id) {
                return { success: false, error: 'A user with this email already exists' }
            }
        }

        const updateData: Record<string, unknown> = {}

        if (data.name) updateData.name = data.name.trim()
        if (data.email) updateData.email = data.email.toLowerCase().trim()
        if (data.role) updateData.role = data.role
        if (typeof data.active === 'boolean') updateData.active = data.active

        // Only update password if provided
        if (data.password && data.password.length > 0) {
            if (data.password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters' }
            }
            updateData.password = await hashPassword(data.password)
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error updating user:', error)
        return { success: false, error: 'Failed to update user' }
    }
}

export async function deleteUser(id: string): Promise<ActionResult> {
    try {
        const currentUser = await requireSuperAdmin()

        // Prevent self-deletion
        if (currentUser.id === id) {
            return { success: false, error: 'You cannot delete your own account' }
        }

        // Check if user has any related records
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                createdBatches: { take: 1 },
                inspections: { take: 1 },
                repairs: { take: 1 },
                paintWork: { take: 1 },
                qcInspections: { take: 1 },
                movements: { take: 1 },
                packedOutwards: { take: 1 },
                checkedOutwards: { take: 1 },
            }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        // Check if user has any related data
        const hasRelations =
            user.createdBatches.length > 0 ||
            user.inspections.length > 0 ||
            user.repairs.length > 0 ||
            user.paintWork.length > 0 ||
            user.qcInspections.length > 0 ||
            user.movements.length > 0 ||
            user.packedOutwards.length > 0 ||
            user.checkedOutwards.length > 0

        if (hasRelations) {
            return {
                success: false,
                error: 'Cannot delete user with existing records. Deactivate the user instead.'
            }
        }

        await prisma.user.delete({
            where: { id }
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error deleting user:', error)
        return { success: false, error: 'Failed to delete user' }
    }
}

export async function toggleUserStatus(id: string): Promise<ActionResult> {
    try {
        const currentUser = await requireSuperAdmin()

        // Prevent self-deactivation
        if (currentUser.id === id) {
            return { success: false, error: 'You cannot deactivate your own account' }
        }

        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        await prisma.user.update({
            where: { id },
            data: { active: !user.active }
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error toggling user status:', error)
        return { success: false, error: 'Failed to update user status' }
    }
}

export async function resetUserPassword(id: string, newPassword: string): Promise<ActionResult> {
    try {
        await requireSuperAdmin()

        if (newPassword.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' }
        }

        const hashedPassword = await hashPassword(newPassword)

        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error resetting password:', error)
        return { success: false, error: 'Failed to reset password' }
    }
}
