import { prisma } from './db'
import {
    sendEmail,
    getTATApproachingEmail,
    getTATBreachedEmail,
    getSparesRequestedEmail,
    getQCFailedEmail,
    getPaintReadyEmail
} from './email'

// Notify warehouse managers about spares requests
export async function notifySparesRequested(params: {
    deviceBarcode: string
    deviceModel: string
    sparesRequired: string
    requestedBy: string
}) {
    const { deviceBarcode, deviceModel, sparesRequired, requestedBy } = params

    // Get all warehouse managers and admins
    const recipients = await prisma.user.findMany({
        where: {
            active: true,
            role: { in: ['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN'] }
        },
        select: { email: true, name: true }
    })

    const results = await Promise.all(
        recipients.map(async (recipient) => {
            const template = getSparesRequestedEmail({
                recipientName: recipient.name,
                deviceBarcode,
                deviceModel,
                sparesRequired,
                requestedBy
            })
            return sendEmail({
                to: recipient.email,
                subject: template.subject,
                html: template.html
            })
        })
    )

    console.log(`[Notifications] Spares requested: notified ${results.length} recipients`)
    return results
}

// Notify repair engineer about QC failure
export async function notifyQCFailed(params: {
    deviceBarcode: string
    deviceModel: string
    remarks: string
    qcEngineer: string
    repairEngId: string | null
}) {
    const { deviceBarcode, deviceModel, remarks, qcEngineer, repairEngId } = params

    if (!repairEngId) {
        console.log('[Notifications] QC failed: no repair engineer assigned')
        return []
    }

    const repairEng = await prisma.user.findUnique({
        where: { id: repairEngId },
        select: { email: true, name: true }
    })

    if (!repairEng) {
        console.log('[Notifications] QC failed: repair engineer not found')
        return []
    }

    const template = getQCFailedEmail({
        recipientName: repairEng.name,
        deviceBarcode,
        deviceModel,
        remarks: remarks || 'No remarks provided',
        qcEngineer
    })

    const result = await sendEmail({
        to: repairEng.email,
        subject: template.subject,
        html: template.html
    })

    console.log(`[Notifications] QC failed: notified ${repairEng.name}`)
    return [result]
}

// Notify repair engineer about paint panels ready
export async function notifyPaintReady(params: {
    deviceBarcode: string
    deviceModel: string
    panels: string[]
    repairEngId: string | null
}) {
    const { deviceBarcode, deviceModel, panels, repairEngId } = params

    if (!repairEngId) {
        console.log('[Notifications] Paint ready: no repair engineer assigned')
        return []
    }

    const repairEng = await prisma.user.findUnique({
        where: { id: repairEngId },
        select: { email: true, name: true }
    })

    if (!repairEng) {
        console.log('[Notifications] Paint ready: repair engineer not found')
        return []
    }

    const template = getPaintReadyEmail({
        recipientName: repairEng.name,
        deviceBarcode,
        deviceModel,
        panels
    })

    const result = await sendEmail({
        to: repairEng.email,
        subject: template.subject,
        html: template.html
    })

    console.log(`[Notifications] Paint ready: notified ${repairEng.name}`)
    return [result]
}

// Notify about TAT approaching (24 hours before deadline)
export async function notifyTATApproaching(params: {
    deviceBarcode: string
    deviceModel: string
    dueDate: Date
    hoursRemaining: number
    repairEngId: string | null
}) {
    const { deviceBarcode, deviceModel, dueDate, hoursRemaining, repairEngId } = params

    const recipients: { email: string; name: string }[] = []

    // Notify assigned repair engineer
    if (repairEngId) {
        const repairEng = await prisma.user.findUnique({
            where: { id: repairEngId },
            select: { email: true, name: true }
        })
        if (repairEng) recipients.push(repairEng)
    }

    // Also notify admins
    const admins = await prisma.user.findMany({
        where: {
            active: true,
            role: { in: ['ADMIN', 'WAREHOUSE_MANAGER'] }
        },
        select: { email: true, name: true }
    })
    recipients.push(...admins)

    // Deduplicate by email
    const uniqueRecipients = recipients.filter(
        (r, i, arr) => arr.findIndex(x => x.email === r.email) === i
    )

    const results = await Promise.all(
        uniqueRecipients.map(async (recipient) => {
            const template = getTATApproachingEmail({
                recipientName: recipient.name,
                deviceBarcode,
                deviceModel,
                dueDate,
                hoursRemaining
            })
            return sendEmail({
                to: recipient.email,
                subject: template.subject,
                html: template.html
            })
        })
    )

    console.log(`[Notifications] TAT approaching: notified ${results.length} recipients`)
    return results
}

// Notify about TAT breach
export async function notifyTATBreached(params: {
    deviceBarcode: string
    deviceModel: string
    dueDate: Date
    daysOverdue: number
    repairEngId: string | null
}) {
    const { deviceBarcode, deviceModel, dueDate, daysOverdue, repairEngId } = params

    const recipients: { email: string; name: string }[] = []

    // Notify assigned repair engineer
    if (repairEngId) {
        const repairEng = await prisma.user.findUnique({
            where: { id: repairEngId },
            select: { email: true, name: true }
        })
        if (repairEng) recipients.push(repairEng)
    }

    // Notify all admins and managers for breached TAT
    const managers = await prisma.user.findMany({
        where: {
            active: true,
            role: { in: ['ADMIN', 'WAREHOUSE_MANAGER', 'SUPERADMIN'] }
        },
        select: { email: true, name: true }
    })
    recipients.push(...managers)

    // Deduplicate by email
    const uniqueRecipients = recipients.filter(
        (r, i, arr) => arr.findIndex(x => x.email === r.email) === i
    )

    const results = await Promise.all(
        uniqueRecipients.map(async (recipient) => {
            const template = getTATBreachedEmail({
                recipientName: recipient.name,
                deviceBarcode,
                deviceModel,
                dueDate,
                daysOverdue
            })
            return sendEmail({
                to: recipient.email,
                subject: template.subject,
                html: template.html
            })
        })
    )

    console.log(`[Notifications] TAT breached: notified ${results.length} recipients`)
    return results
}

// Check and send TAT notifications (to be called by cron/scheduled job)
export async function checkAndSendTATNotifications() {
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find jobs approaching TAT (within 24 hours but not yet breached)
    const approachingJobs = await prisma.repairJob.findMany({
        where: {
            status: { in: ['UNDER_REPAIR', 'IN_PAINT_SHOP', 'AWAITING_QC'] },
            tatDueDate: {
                gt: now,
                lte: in24Hours
            }
        },
        include: {
            device: { select: { barcode: true, model: true } },
            repairEng: { select: { id: true } }
        }
    })

    // Find jobs that have breached TAT
    const breachedJobs = await prisma.repairJob.findMany({
        where: {
            status: { in: ['UNDER_REPAIR', 'IN_PAINT_SHOP', 'AWAITING_QC'] },
            tatDueDate: { lt: now }
        },
        include: {
            device: { select: { barcode: true, model: true } },
            repairEng: { select: { id: true } }
        }
    })

    console.log(`[TAT Check] Found ${approachingJobs.length} approaching, ${breachedJobs.length} breached`)

    // Send approaching notifications
    for (const job of approachingJobs) {
        if (job.tatDueDate) {
            const hoursRemaining = Math.ceil((job.tatDueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
            await notifyTATApproaching({
                deviceBarcode: job.device.barcode,
                deviceModel: job.device.model,
                dueDate: job.tatDueDate,
                hoursRemaining,
                repairEngId: job.repairEng?.id || null
            })
        }
    }

    // Send breach notifications
    for (const job of breachedJobs) {
        if (job.tatDueDate) {
            const daysOverdue = Math.ceil((now.getTime() - job.tatDueDate.getTime()) / (1000 * 60 * 60 * 24))
            await notifyTATBreached({
                deviceBarcode: job.device.barcode,
                deviceModel: job.device.model,
                dueDate: job.tatDueDate,
                daysOverdue,
                repairEngId: job.repairEng?.id || null
            })
        }
    }

    return {
        approaching: approachingJobs.length,
        breached: breachedJobs.length
    }
}
