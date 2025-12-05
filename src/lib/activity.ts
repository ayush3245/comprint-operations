import { prisma } from './db'

export type ActivityAction =
    | 'CREATED_INWARD'
    | 'COMPLETED_INSPECTION'
    | 'UPDATED_REPAIR'
    | 'COMPLETED_REPAIR'
    | 'COLLECTED_FROM_PAINT'
    | 'COMPLETED_PAINT'
    | 'COMPLETED_QC'
    | 'MOVED_STOCK'
    | 'CREATED_USER'
    | 'UPDATED_USER'
    | 'LOGIN'
    | 'CREATED_OUTWARD'

interface LogActivityParams {
    action: ActivityAction
    details?: string
    userId: string
    metadata?: Record<string, any>
}

export async function logActivity({ action, details, userId, metadata }: LogActivityParams) {
    try {
        await prisma.activityLog.create({
            data: {
                action,
                details,
                userId,
                metadata: metadata ? JSON.stringify(metadata) : undefined
            }
        })
    } catch (error) {
        console.error('Failed to log activity:', error)
        // Don't throw error to prevent blocking the main flow
    }
}

export async function getRecentActivity(limit = 10) {
    return await prisma.activityLog.findMany({
        take: limit,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            user: {
                select: {
                    name: true,
                    role: true
                }
            }
        }
    })
}
