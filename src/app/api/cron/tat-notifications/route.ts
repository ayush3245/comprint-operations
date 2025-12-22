import { NextRequest, NextResponse } from 'next/server'
import { checkAndSendTATNotifications } from '@/lib/notifications'

// This endpoint can be called by a cron job service (Vercel Cron, Railway Cron, etc.)
// Recommended schedule: Every hour
// Example cron: 0 * * * *

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
        const result = await checkAndSendTATNotifications()

        return NextResponse.json({
            success: true,
            message: 'TAT notifications processed',
            approaching: result.approaching,
            breached: result.breached,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('[Cron] TAT notifications error:', error)
        return NextResponse.json(
            { error: 'Failed to process TAT notifications' },
            { status: 500 }
        )
    }
}

// Also support POST for webhook-style triggers
export async function POST(request: NextRequest) {
    return GET(request)
}
