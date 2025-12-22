import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, getPOAgingAlertEmail } from '@/lib/email'

// This endpoint checks for Purchase Orders that haven't been addressed for 10+ days
// Recommended schedule: Once daily (e.g., 8 AM)
// Example cron: 0 8 * * *

const AGING_THRESHOLD_DAYS = 10

async function checkAndSendPOAgingAlerts() {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - AGING_THRESHOLD_DAYS)

    // Find unaddressed POs older than threshold
    const agingPOs = await prisma.purchaseOrder.findMany({
        where: {
            isAddressed: false,
            createdAt: { lte: thresholdDate }
        },
        include: {
            createdBy: { select: { name: true } }
        }
    })

    if (agingPOs.length === 0) {
        return { alertsSent: 0, message: 'No aging POs found' }
    }

    // Send alerts to warehouse manager
    const warehouseManagerEmail = process.env.WAREHOUSE_MANAGER_EMAIL
    if (!warehouseManagerEmail) {
        return { alertsSent: 0, message: 'WAREHOUSE_MANAGER_EMAIL not configured' }
    }

    let alertsSent = 0
    for (const po of agingPOs) {
        const ageDays = Math.floor((Date.now() - po.createdAt.getTime()) / (1000 * 60 * 60 * 24))

        try {
            const emailContent = getPOAgingAlertEmail({
                poNumber: po.poNumber,
                supplierCode: po.supplierCode,
                expectedDevices: po.expectedDevices,
                createdAt: po.createdAt,
                daysOld: ageDays
            })

            await sendEmail({
                to: warehouseManagerEmail,
                subject: emailContent.subject,
                html: emailContent.html
            })

            alertsSent++
        } catch (error) {
            console.error(`[PO-Aging] Failed to send alert for PO ${po.poNumber}:`, error)
        }
    }

    return {
        alertsSent,
        totalAgingPOs: agingPOs.length,
        message: `Sent ${alertsSent} aging alerts for ${agingPOs.length} overdue POs`
    }
}

export async function GET(request: NextRequest) {
    // Verify cron secret if configured
    // Supports both Vercel's Authorization header and custom x-cron-secret header
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    const providedSecret = authHeader?.replace('Bearer ', '') || cronSecret

    if (process.env.CRON_SECRET && providedSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await checkAndSendPOAgingAlerts()

        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('[Cron] PO aging check error:', error)
        return NextResponse.json(
            { error: 'Failed to process PO aging alerts' },
            { status: 500 }
        )
    }
}

// Also support POST for webhook-style triggers
export async function POST(request: NextRequest) {
    return GET(request)
}
