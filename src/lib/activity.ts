import { prisma } from './db'

export type ActivityAction =
    | 'CREATED_INWARD'
    | 'UPDATED_BATCH'
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
    | 'UPDATED_OUTWARD'
    // L2 Engineer coordination actions
    | 'CLAIMED_DEVICE'
    | 'SENT_TO_DISPLAY'
    | 'SENT_TO_BATTERY'
    | 'SENT_TO_L3'
    | 'SENT_TO_PAINT'
    | 'COMPLETED_DISPLAY_BY_L2'
    | 'COMPLETED_BATTERY_BY_L2'
    | 'COLLECTED_FROM_DISPLAY'
    | 'COLLECTED_FROM_BATTERY'
    | 'COLLECTED_FROM_L3'
    | 'L2_SENT_TO_QC'
    // Technician actions
    | 'STARTED_DISPLAY_REPAIR'
    | 'COMPLETED_DISPLAY_REPAIR'
    | 'STARTED_BATTERY_BOOST'
    | 'COMPLETED_BATTERY_BOOST'
    | 'STARTED_L3_REPAIR'
    | 'COMPLETED_L3_REPAIR'
    // QC actions
    | 'UPDATED_CHECKLIST_ITEM'
    // L2 spare parts
    | 'REQUESTED_SPARES'
    // Warehouse spares actions
    | 'ISSUED_SPARES'
    // Admin actions
    | 'MIGRATION'

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
