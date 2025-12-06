import { Resend } from 'resend'

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@comprint.com'
const APP_NAME = 'Comprint Operations'

// Lazy initialization - only create client when needed and API key exists
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null
    }
    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY)
    }
    return resendClient
}

export type NotificationType =
    | 'TAT_APPROACHING'
    | 'TAT_BREACHED'
    | 'SPARES_REQUESTED'
    | 'QC_FAILED'
    | 'PAINT_READY'

interface SendEmailParams {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    const resend = getResendClient()

    if (!resend) {
        console.log('[Email] Skipping email - RESEND_API_KEY not configured')
        console.log('[Email] Would send to:', to, 'Subject:', subject)
        return { success: true, skipped: true }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `${APP_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject,
            html
        })

        if (error) {
            console.error('[Email] Failed to send:', error)
            return { success: false, error }
        }

        console.log('[Email] Sent successfully:', data?.id)
        return { success: true, id: data?.id }
    } catch (error) {
        console.error('[Email] Error:', error)
        return { success: false, error }
    }
}

// Email Templates
export function getTATApproachingEmail(params: {
    recipientName: string
    deviceBarcode: string
    deviceModel: string
    dueDate: Date
    hoursRemaining: number
}) {
    const { recipientName, deviceBarcode, deviceModel, dueDate, hoursRemaining } = params

    return {
        subject: `TAT Alert: Device ${deviceBarcode} due in ${hoursRemaining} hours`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #1f2937; margin-top: 0;">TAT Deadline Approaching</h2>
                    <p style="color: #4b5563;">Hi ${recipientName},</p>
                    <p style="color: #4b5563;">The following device is approaching its TAT deadline:</p>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                        <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceBarcode}</p>
                        <p style="margin: 5px 0;"><strong>Model:</strong> ${deviceModel}</p>
                        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}</p>
                        <p style="margin: 5px 0; color: #F59E0B;"><strong>Time Remaining:</strong> ${hoursRemaining} hours</p>
                    </div>

                    <p style="color: #4b5563;">Please prioritize this device to meet the SLA.</p>
                </div>
                <div style="background: #1f2937; padding: 15px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">${APP_NAME} - Automated Notification</p>
                </div>
            </div>
        `
    }
}

export function getTATBreachedEmail(params: {
    recipientName: string
    deviceBarcode: string
    deviceModel: string
    dueDate: Date
    daysOverdue: number
}) {
    const { recipientName, deviceBarcode, deviceModel, dueDate, daysOverdue } = params

    return {
        subject: `URGENT: TAT Breached - Device ${deviceBarcode} is ${daysOverdue} days overdue`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #DC2626; margin-top: 0;">TAT BREACHED</h2>
                    <p style="color: #4b5563;">Hi ${recipientName},</p>
                    <p style="color: #4b5563;">The following device has exceeded its TAT deadline:</p>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #EF4444;">
                        <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceBarcode}</p>
                        <p style="margin: 5px 0;"><strong>Model:</strong> ${deviceModel}</p>
                        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
                        <p style="margin: 5px 0; color: #EF4444;"><strong>Days Overdue:</strong> ${daysOverdue}</p>
                    </div>

                    <p style="color: #DC2626; font-weight: bold;">Immediate action required!</p>
                </div>
                <div style="background: #1f2937; padding: 15px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">${APP_NAME} - Automated Notification</p>
                </div>
            </div>
        `
    }
}

export function getSparesRequestedEmail(params: {
    recipientName: string
    deviceBarcode: string
    deviceModel: string
    sparesRequired: string
    requestedBy: string
}) {
    const { recipientName, deviceBarcode, deviceModel, sparesRequired, requestedBy } = params

    return {
        subject: `Spares Request: ${deviceBarcode} needs parts`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #1f2937; margin-top: 0;">Spares Request</h2>
                    <p style="color: #4b5563;">Hi ${recipientName},</p>
                    <p style="color: #4b5563;">A new spares request has been submitted:</p>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3B82F6;">
                        <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceBarcode}</p>
                        <p style="margin: 5px 0;"><strong>Model:</strong> ${deviceModel}</p>
                        <p style="margin: 5px 0;"><strong>Required Spares:</strong></p>
                        <p style="margin: 5px 0; padding: 10px; background: #f3f4f6; border-radius: 4px;">${sparesRequired}</p>
                        <p style="margin: 5px 0;"><strong>Requested By:</strong> ${requestedBy}</p>
                    </div>

                    <p style="color: #4b5563;">Please review and issue the required spares.</p>
                </div>
                <div style="background: #1f2937; padding: 15px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">${APP_NAME} - Automated Notification</p>
                </div>
            </div>
        `
    }
}

export function getQCFailedEmail(params: {
    recipientName: string
    deviceBarcode: string
    deviceModel: string
    remarks: string
    qcEngineer: string
}) {
    const { recipientName, deviceBarcode, deviceModel, remarks, qcEngineer } = params

    return {
        subject: `QC Failed: ${deviceBarcode} requires rework`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #D97706; margin-top: 0;">QC Failed - Rework Required</h2>
                    <p style="color: #4b5563;">Hi ${recipientName},</p>
                    <p style="color: #4b5563;">A device has failed QC and requires rework:</p>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                        <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceBarcode}</p>
                        <p style="margin: 5px 0;"><strong>Model:</strong> ${deviceModel}</p>
                        <p style="margin: 5px 0;"><strong>QC Engineer:</strong> ${qcEngineer}</p>
                        <p style="margin: 5px 0;"><strong>Remarks:</strong></p>
                        <p style="margin: 5px 0; padding: 10px; background: #FEF3C7; border-radius: 4px;">${remarks}</p>
                    </div>

                    <p style="color: #4b5563;">Please address the issues and resubmit for QC.</p>
                </div>
                <div style="background: #1f2937; padding: 15px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">${APP_NAME} - Automated Notification</p>
                </div>
            </div>
        `
    }
}

export function getPaintReadyEmail(params: {
    recipientName: string
    deviceBarcode: string
    deviceModel: string
    panels: string[]
}) {
    const { recipientName, deviceBarcode, deviceModel, panels } = params

    return {
        subject: `Paint Ready: ${deviceBarcode} panels ready for collection`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #059669; margin-top: 0;">Paint Panels Ready</h2>
                    <p style="color: #4b5563;">Hi ${recipientName},</p>
                    <p style="color: #4b5563;">Paint panels are ready for collection:</p>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981;">
                        <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceBarcode}</p>
                        <p style="margin: 5px 0;"><strong>Model:</strong> ${deviceModel}</p>
                        <p style="margin: 5px 0;"><strong>Ready Panels:</strong></p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            ${panels.map(p => `<li style="color: #059669;">${p}</li>`).join('')}
                        </ul>
                    </div>

                    <p style="color: #4b5563;">Please collect the panels from the paint shop.</p>
                </div>
                <div style="background: #1f2937; padding: 15px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">${APP_NAME} - Automated Notification</p>
                </div>
            </div>
        `
    }
}
