# Email Notifications - Future Enhancement

## Overview
Automated email notifications to keep stakeholders informed about device lifecycle events and system alerts.

## Proposed Email Triggers

### 1. **Inward Batch Created**
- **Recipient:** Warehouse Manager, MIS Warehouse Executive
- **Trigger:** When a new inward batch is created
- **Content:**
  - Batch ID
  - Type (Refurb Purchase / Rental Return)
  - Number of devices
  - PO/Invoice number or Customer details
  - Created by (user name)

### 2. **Device Ready for Inspection**
- **Recipient:** Inspection Engineers
- **Trigger:** When devices are in `PENDING_INSPECTION` status
- **Content:**
  - List of device barcodes
  - Batch ID
  - Number of devices pending
  - Link to inspection dashboard

### 3. **Waiting for Spares**
- **Recipient:** Warehouse Manager, Admin
- **Trigger:** When device status changes to `WAITING_FOR_SPARES`
- **Content:**
  - Device barcode
  - Required spares list
  - Device details (brand, model)
  - Days waiting

### 4. **Device Ready for QC**
- **Recipient:** QC Engineers
- **Trigger:** When device status changes to `AWAITING_QC`
- **Content:**
  - Device barcode
  - Completed stages (inspection, repair, paint)
  - Device specifications
  - Link to QC page

### 5. **QC Failed**
- **Recipient:** Warehouse Manager, Repair Engineers
- **Trigger:** When device fails QC
- **Content:**
  - Device barcode
  - QC failure reasons
  - Required actions
  - Device details

### 6. **Device Ready for Dispatch**
- **Recipient:** Warehouse Manager, Customer (for rental returns)
- **Trigger:** When device status changes to `READY_FOR_STOCK`
- **Content:**
  - Device barcode
  - Final grade
  - Device specifications
  - Collection/dispatch instructions

### 7. **Low Stock Alert**
- **Recipient:** Admin, Warehouse Manager
- **Trigger:** When inventory of a specific category/grade falls below threshold
- **Content:**
  - Category affected
  - Current stock count
  - Recommended action
  - Recent outward movements

### 8. **Rental Return Reminder**
- **Recipient:** Customer
- **Trigger:** X days before rental return due date
- **Content:**
  - Rental reference
  - Devices to be returned
  - Return deadline
  - Return instructions

### 9. **Daily Summary Report**
- **Recipient:** Admin, Warehouse Manager
- **Trigger:** Daily at configured time (e.g., 6 PM)
- **Content:**
  - Devices processed today
  - Current status breakdown
  - Pending actions
  - Alerts and bottlenecks

### 10. **User Account Created/Modified**
- **Recipient:** New user, Admin
- **Trigger:** When user account is created or role changed
- **Content:**
  - Welcome message / Change notification
  - Login credentials (for new users)
  - Role and permissions
  - System access link

## Technical Implementation Plan

### Phase 1: Email Service Setup

#### Option A: Resend (Recommended)
```bash
npm install resend
```

**Pros:**
- Modern API design
- Built-in React Email support
- Good deliverability
- Generous free tier (3,000 emails/month)

**Configuration:**
```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string[]
  subject: string
  html: string
}) {
  return await resend.emails.send({
    from: 'Comprint Operations <notifications@comprint.com>',
    to,
    subject,
    html
  })
}
```

#### Option B: Nodemailer
```bash
npm install nodemailer @types/nodemailer
```

**Pros:**
- Works with any SMTP provider
- More control over configuration
- No vendor lock-in

**Configuration:**
```typescript
// lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string[]
  subject: string
  html: string
}) {
  return await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: to.join(', '),
    subject,
    html
  })
}
```

### Phase 2: Email Templates

Create reusable React Email components:

```bash
npm install @react-email/components
```

**Example Template:**
```typescript
// emails/DeviceReadyForQC.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text
} from '@react-email/components'

interface DeviceReadyForQCProps {
  deviceBarcode: string
  brand: string
  model: string
  qcUrl: string
}

export default function DeviceReadyForQC({
  deviceBarcode,
  brand,
  model,
  qcUrl
}: DeviceReadyForQCProps) {
  return (
    <Html>
      <Head />
      <Preview>Device {deviceBarcode} is ready for quality control</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Device Ready for QC</Heading>
          <Text style={text}>
            A device has completed all required stages and is ready for quality control inspection.
          </Text>
          <Section style={deviceInfo}>
            <Text><strong>Barcode:</strong> {deviceBarcode}</Text>
            <Text><strong>Device:</strong> {brand} {model}</Text>
          </Section>
          <Button style={button} href={qcUrl}>
            Start QC Inspection
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }
const container = { margin: '0 auto', padding: '20px 0 48px' }
const h1 = { color: '#333', fontSize: '24px' }
const text = { color: '#555', fontSize: '14px', lineHeight: '24px' }
const deviceInfo = { backgroundColor: '#f0f0f0', padding: '16px', borderRadius: '4px' }
const button = { backgroundColor: '#3b82f6', color: '#fff', padding: '12px 20px', borderRadius: '4px' }
```

### Phase 3: Notification Service

```typescript
// lib/notifications.ts
import { sendEmail } from './email'
import { prisma } from './db'
import { render } from '@react-email/render'
import DeviceReadyForQC from '@/emails/DeviceReadyForQC'

export async function notifyDeviceReadyForQC(deviceId: string) {
  // Get device details
  const device = await prisma.device.findUnique({
    where: { id: deviceId }
  })

  if (!device) throw new Error('Device not found')

  // Get QC engineers
  const qcEngineers = await prisma.user.findMany({
    where: { role: 'QC_ENGINEER', active: true }
  })

  const emailHtml = render(DeviceReadyForQC({
    deviceBarcode: device.barcode,
    brand: device.brand,
    model: device.model,
    qcUrl: `${process.env.APP_URL}/qc/${device.barcode}`
  }))

  // Send emails
  await sendEmail({
    to: qcEngineers.map(u => u.email),
    subject: `Device ${device.barcode} Ready for QC`,
    html: emailHtml
  })

  // Log notification
  await prisma.notification.create({
    data: {
      type: 'DEVICE_READY_FOR_QC',
      deviceId: device.id,
      sentTo: qcEngineers.map(u => u.email),
      sentAt: new Date()
    }
  })
}
```

### Phase 4: Database Schema Updates

Add notification tracking to Prisma schema:

```prisma
model Notification {
  id        String   @id @default(cuid())
  type      String
  deviceId  String?
  batchId   String?
  sentTo    String[] // Array of email addresses
  sentAt    DateTime
  subject   String
  status    String   @default("SENT") // SENT, FAILED, PENDING
  error     String?

  device    Device?  @relation(fields: [deviceId], references: [id])
  batch     InwardBatch? @relation(fields: [batchId], references: [id])

  createdAt DateTime @default(now())
}
```

### Phase 5: Integration Points

Trigger notifications in existing actions:

```typescript
// In src/lib/actions.ts

export async function submitInspection(deviceId: string, data: any) {
  // ... existing inspection logic

  // Determine next status
  if (nextStatus === DeviceStatus.AWAITING_QC) {
    // Send QC notification
    await notifyDeviceReadyForQC(deviceId)
  } else if (nextStatus === DeviceStatus.WAITING_FOR_SPARES) {
    // Send spares notification
    await notifyWaitingForSpares(deviceId, data.sparesRequired)
  }

  // ... rest of function
}
```

## Environment Variables Required

```env
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# OR Email Service (SMTP/Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Comprint Operations <notifications@comprint.com>"

# Application URL for links
APP_URL=https://operations.comprint.com
```

## Configuration Settings

Add email notification preferences to user settings:

```typescript
// User preferences
interface NotificationPreferences {
  emailNotifications: boolean
  notificationTypes: string[] // Which notification types to receive
  digestMode: boolean // Receive daily digest instead of individual emails
  digestTime: string // Time for daily digest (e.g., "18:00")
}
```

## Testing Strategy

1. **Development:** Use email testing service (e.g., Mailtrap, Ethereal)
2. **Staging:** Send to test email addresses
3. **Production:** Gradual rollout with opt-in

## Cost Estimation

**Resend Free Tier:**
- 3,000 emails/month free
- $20/month for 50,000 emails

**Expected Usage:**
- ~10-50 notifications per day
- ~300-1,500 emails per month
- Well within free tier initially

## Future Enhancements

1. **SMS Notifications** for critical alerts
2. **Push Notifications** for web app
3. **Webhook Integration** for external systems
4. **Notification History** dashboard
5. **Email Analytics** (open rates, click rates)
6. **A/B Testing** for email templates
7. **Multi-language Support** for international teams

## Priority Ranking

1. **High Priority:**
   - Device Ready for QC
   - Waiting for Spares
   - QC Failed

2. **Medium Priority:**
   - Inward Batch Created
   - Device Ready for Inspection
   - Device Ready for Dispatch

3. **Low Priority:**
   - Daily Summary Report
   - Low Stock Alert
   - Rental Return Reminder

## Implementation Timeline

- **Week 1:** Email service setup and basic templates
- **Week 2:** High priority notifications
- **Week 3:** Medium priority notifications
- **Week 4:** Testing and refinement
- **Week 5:** Low priority notifications and advanced features

## Rollout Plan

1. Enable for admin users only
2. Gradual rollout by role (QC → Repair → Inspection → All)
3. Monitor deliverability and engagement
4. Gather feedback and iterate
5. Full rollout with opt-out option
