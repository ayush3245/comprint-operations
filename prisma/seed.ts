import 'dotenv/config'
import { PrismaClient, Role, DeviceCategory } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

interface POItem {
    category: DeviceCategory
    brand: string
    model: string
    quantity: number
    rate?: number
}

interface POData {
    poNumber: string
    supplierCode: string
    supplierName: string
    expectedDevices: number
    expectedItems: POItem[]
}

async function generatePurchaseOrderPDF(po: POData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

    let y = height - 50

    // Header
    page.drawText('PURCHASE ORDER', {
        x: 220,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
    })

    y -= 40

    // Company Info Box
    page.drawRectangle({
        x: 40,
        y: y - 80,
        width: 250,
        height: 90,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
    })

    page.drawText('Invoice To', { x: 45, y: y - 5, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
    page.drawText('COMPRINT TECH-SOLUTIONS (I) PRIVATE LIMITED', { x: 45, y: y - 18, size: 9, font: fontBold })
    page.drawText('Sagar Complex Building No F2', { x: 45, y: y - 30, size: 8, font: fontRegular })
    page.drawText('Gala No 10 11 Mankholi kalyan by pass road', { x: 45, y: y - 42, size: 8, font: fontRegular })
    page.drawText('Bhiwandi 421302', { x: 45, y: y - 54, size: 8, font: fontRegular })
    page.drawText('GSTIN/UIN: 27AAHCC0360R2ZA', { x: 45, y: y - 66, size: 8, font: fontRegular })

    // PO Details Box
    page.drawRectangle({
        x: 305,
        y: y - 80,
        width: 250,
        height: 90,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
    })

    page.drawText('Voucher No.', { x: 310, y: y - 5, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
    page.drawText(po.poNumber, { x: 310, y: y - 18, size: 10, font: fontBold })

    page.drawText('Dated', { x: 450, y: y - 5, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
    page.drawText(date, { x: 450, y: y - 18, size: 9, font: fontRegular })

    page.drawText('Mode/Terms of Payment', { x: 450, y: y - 35, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
    page.drawText('30 Days', { x: 450, y: y - 48, size: 9, font: fontBold })

    page.drawText('Terms of Delivery', { x: 310, y: y - 55, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
    page.drawText('Delivery - Bhiwandi', { x: 310, y: y - 68, size: 9, font: fontBold })

    y -= 110

    // Supplier Info
    page.drawRectangle({
        x: 40,
        y: y - 70,
        width: 515,
        height: 80,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
    })

    page.drawText('Supplier (Bill from)', { x: 45, y: y - 5, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
    page.drawText(po.supplierName, { x: 45, y: y - 20, size: 11, font: fontBold })
    page.drawText(`Supplier Code: ${po.supplierCode}`, { x: 45, y: y - 35, size: 9, font: fontRegular })
    page.drawText('State Name: Maharashtra, Code: 27', { x: 45, y: y - 50, size: 8, font: fontRegular })

    y -= 100

    // Items Table Header
    const tableTop = y
    page.drawRectangle({
        x: 40,
        y: tableTop - 25,
        width: 515,
        height: 25,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
    })

    page.drawText('Sl', { x: 45, y: tableTop - 17, size: 8, font: fontBold })
    page.drawText('Description of Goods', { x: 70, y: tableTop - 17, size: 8, font: fontBold })
    page.drawText('Due on', { x: 280, y: tableTop - 17, size: 8, font: fontBold })
    page.drawText('Quantity', { x: 340, y: tableTop - 17, size: 8, font: fontBold })
    page.drawText('Rate', { x: 410, y: tableTop - 17, size: 8, font: fontBold })
    page.drawText('Amount', { x: 490, y: tableTop - 17, size: 8, font: fontBold })

    // Items
    let itemY = tableTop - 25
    let totalAmount = 0
    let slNo = 1

    for (const item of po.expectedItems) {
        const rate = item.rate || Math.floor(Math.random() * 50000) + 20000
        const amount = rate * item.quantity
        totalAmount += amount

        const rowHeight = 50
        page.drawRectangle({
            x: 40,
            y: itemY - rowHeight,
            width: 515,
            height: rowHeight,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
        })

        page.drawText(slNo.toString(), { x: 45, y: itemY - 20, size: 9, font: fontRegular })
        page.drawText(`${item.brand} ${item.model}`, { x: 70, y: itemY - 15, size: 10, font: fontBold })
        page.drawText(`Category: ${item.category}`, { x: 70, y: itemY - 28, size: 8, font: fontRegular })
        page.drawText(`Refurbished ${item.brand} ${item.model}`, { x: 70, y: itemY - 40, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
        page.drawText(date, { x: 280, y: itemY - 20, size: 9, font: fontRegular })
        page.drawText(`${item.quantity}.00 No`, { x: 340, y: itemY - 20, size: 9, font: fontRegular })
        page.drawText(`${rate.toLocaleString('en-IN')}`, { x: 400, y: itemY - 20, size: 9, font: fontRegular })
        page.drawText(`${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, { x: 480, y: itemY - 20, size: 9, font: fontRegular })

        itemY -= rowHeight
        slNo++
    }

    // Tax rows
    const cgst = totalAmount * 0.09
    const sgst = totalAmount * 0.09
    const grandTotal = totalAmount + cgst + sgst

    itemY -= 5
    page.drawText('INPUT CGST @9%', { x: 280, y: itemY, size: 9, font: fontRegular })
    page.drawText(`${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, { x: 480, y: itemY, size: 9, font: fontRegular })

    itemY -= 15
    page.drawText('INPUT SGST @9%', { x: 280, y: itemY, size: 9, font: fontRegular })
    page.drawText(`${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, { x: 480, y: itemY, size: 9, font: fontRegular })

    // Total
    itemY -= 30
    page.drawRectangle({
        x: 40,
        y: itemY - 25,
        width: 515,
        height: 25,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
    })

    page.drawText('Total', { x: 280, y: itemY - 17, size: 10, font: fontBold })
    page.drawText(`${po.expectedDevices}.00 No`, { x: 340, y: itemY - 17, size: 10, font: fontBold })
    page.drawText(`Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, { x: 465, y: itemY - 17, size: 10, font: fontBold })

    // Footer
    itemY -= 60
    page.drawText('Amount Chargeable (in words)', { x: 45, y: itemY, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
    page.drawText(`INR ${numberToWords(Math.round(grandTotal))} Only`, { x: 45, y: itemY - 15, size: 10, font: fontBold })

    // Signature
    page.drawText('for COMPRINT TECH-SOLUTIONS (I) PRIVATE LIMITED', { x: 350, y: 80, size: 8, font: fontRegular })
    page.drawText('Authorised Signatory', { x: 420, y: 50, size: 8, font: fontRegular })

    // Computer generated note
    page.drawText('This is a Computer Generated Document', { x: 200, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) })

    return await pdfDoc.save()
}

function numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    if (num === 0) return 'Zero'

    const convertLessThanThousand = (n: number): string => {
        if (n === 0) return ''
        if (n < 20) return ones[n]
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '')
    }

    const crore = Math.floor(num / 10000000)
    const lakh = Math.floor((num % 10000000) / 100000)
    const thousand = Math.floor((num % 100000) / 1000)
    const remainder = num % 1000

    let result = ''
    if (crore) result += convertLessThanThousand(crore) + ' Crore '
    if (lakh) result += convertLessThanThousand(lakh) + ' Lakh '
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand '
    if (remainder) result += convertLessThanThousand(remainder)

    return result.trim()
}

async function main() {
    // Default password for all users (should be changed after first login)
    const defaultPassword = await hashPassword('password123')

    const users = [
        { name: 'Super Admin', email: 'superadmin@comprint.com', role: Role.SUPERADMIN },
        { name: 'Admin User', email: 'admin@comprint.com', role: Role.ADMIN },
        { name: 'Warehouse Exec', email: 'warehouse.exec@comprint.com', role: Role.MIS_WAREHOUSE_EXECUTIVE },
        { name: 'Warehouse Mgr', email: 'warehouse.mgr@comprint.com', role: Role.WAREHOUSE_MANAGER },
        { name: 'Inspection Eng', email: 'inspection@comprint.com', role: Role.INSPECTION_ENGINEER },
        // L2 Engineer - Device repair coordinator (new role, replaces REPAIR_ENGINEER)
        { name: 'L2 Engineer', email: 'l2@comprint.com', role: Role.L2_ENGINEER },
        // L3 Engineer - Major repairs (motherboard, locks, power issues)
        { name: 'L3 Engineer', email: 'l3@comprint.com', role: Role.L3_ENGINEER },
        // Display Technician - Screen/display repairs
        { name: 'Display Tech', email: 'display@comprint.com', role: Role.DISPLAY_TECHNICIAN },
        // Battery Technician - Battery boosting/replacement
        { name: 'Battery Tech', email: 'battery@comprint.com', role: Role.BATTERY_TECHNICIAN },
        { name: 'Paint Tech', email: 'paint@comprint.com', role: Role.PAINT_SHOP_TECHNICIAN },
        { name: 'QC Eng', email: 'qc@comprint.com', role: Role.QC_ENGINEER },
        // Keep deprecated REPAIR_ENGINEER for backward compatibility with existing data
        { name: 'Repair Eng (Legacy)', email: 'repair@comprint.com', role: Role.REPAIR_ENGINEER },
    ]

    for (const user of users) {
        const existing = await prisma.user.findFirst({
            where: { email: user.email }
        })

        if (!existing) {
            await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    password: defaultPassword,
                    role: user.role,
                    active: true
                }
            })
            console.log(`Created user: ${user.name} (${user.role}) - Email: ${user.email}`)
        } else {
            console.log(`User already exists: ${user.name} (${user.role})`)
        }
    }

    console.log('\n=== Default Login Credentials ===')
    console.log('Password for all users: password123')
    console.log('')
    console.log('Admin Accounts:')
    console.log('  superadmin@comprint.com (SUPERADMIN)')
    console.log('  admin@comprint.com (ADMIN)')
    console.log('')
    console.log('Workflow Accounts:')
    console.log('  warehouse.exec@comprint.com (MIS_WAREHOUSE_EXECUTIVE)')
    console.log('  warehouse.mgr@comprint.com (WAREHOUSE_MANAGER)')
    console.log('  inspection@comprint.com (INSPECTION_ENGINEER)')
    console.log('  l2@comprint.com (L2_ENGINEER - Coordinator)')
    console.log('  l3@comprint.com (L3_ENGINEER - Major Repairs)')
    console.log('  display@comprint.com (DISPLAY_TECHNICIAN)')
    console.log('  battery@comprint.com (BATTERY_TECHNICIAN)')
    console.log('  paint@comprint.com (PAINT_SHOP_TECHNICIAN)')
    console.log('  qc@comprint.com (QC_ENGINEER)')
    console.log('================================\n')

    // Seed sample Purchase Orders
    await seedPurchaseOrders()
}

async function seedPurchaseOrders() {
    // Get admin user for createdById
    const adminUser = await prisma.user.findFirst({
        where: { role: Role.ADMIN }
    })

    if (!adminUser) {
        console.log('No admin user found - skipping PO seeding. Run user seeding first.')
        return
    }

    const samplePOs: POData[] = [
        {
            poNumber: 'CTPO2526050001',
            supplierCode: 'SUP-DELL',
            supplierName: 'Dell Technologies India Pvt Ltd',
            expectedDevices: 2,
            expectedItems: [
                { category: DeviceCategory.LAPTOP, brand: 'Dell', model: 'Latitude 5520', quantity: 1, rate: 45000 },
                { category: DeviceCategory.LAPTOP, brand: 'Dell', model: 'Latitude 5530', quantity: 1, rate: 52000 }
            ]
        },
        {
            poNumber: 'CTPO2526050002',
            supplierCode: 'SUP-HP',
            supplierName: 'HP India Pvt Ltd',
            expectedDevices: 2,
            expectedItems: [
                { category: DeviceCategory.DESKTOP, brand: 'HP', model: 'ProDesk 400 G7', quantity: 1, rate: 35000 },
                { category: DeviceCategory.MONITOR, brand: 'HP', model: 'E24 G4', quantity: 1, rate: 12000 }
            ]
        },
        {
            poNumber: 'CTPO2526050003',
            supplierCode: 'SUP-LEN',
            supplierName: 'Lenovo India Pvt Ltd',
            expectedDevices: 2,
            expectedItems: [
                { category: DeviceCategory.LAPTOP, brand: 'Lenovo', model: 'ThinkPad T14', quantity: 1, rate: 48000 },
                { category: DeviceCategory.LAPTOP, brand: 'Lenovo', model: 'ThinkPad X1 Carbon', quantity: 1, rate: 78000 }
            ]
        }
    ]

    for (const po of samplePOs) {
        const existing = await prisma.purchaseOrder.findFirst({
            where: { poNumber: po.poNumber }
        })

        if (!existing) {
            // Generate PDF
            console.log(`Generating PDF for ${po.poNumber}...`)
            const pdfBytes = await generatePurchaseOrderPDF(po)

            // Store PDF in database
            const pdfKey = `purchase-orders/${Date.now()}-${po.poNumber}.pdf`
            await prisma.storedFile.create({
                data: {
                    bucket: 'purchase-orders',
                    key: pdfKey,
                    fileName: `${po.poNumber}.pdf`,
                    contentType: 'application/pdf',
                    size: pdfBytes.length,
                    data: new Uint8Array(pdfBytes)
                }
            })

            const pdfUrl = `/api/files/${pdfKey}`

            // Create PO with PDF URL
            await prisma.purchaseOrder.create({
                data: {
                    poNumber: po.poNumber,
                    supplierCode: po.supplierCode,
                    supplierName: po.supplierName,
                    expectedDevices: po.expectedDevices,
                    pdfUrl: pdfUrl,
                    isAddressed: false,
                    createdById: adminUser.id,
                    expectedItems: {
                        create: po.expectedItems.map(item => ({
                            category: item.category,
                            brand: item.brand,
                            model: item.model,
                            quantity: item.quantity
                        }))
                    }
                }
            })
            console.log(`Created Purchase Order: ${po.poNumber} with PDF`)
        } else {
            console.log(`Purchase Order already exists: ${po.poNumber}`)
        }
    }

    console.log('\n=== Sample Purchase Orders ===')
    for (const po of samplePOs) {
        console.log(`${po.poNumber}: ${po.supplierName} (${po.expectedDevices} devices)`)
    }
    console.log('All POs have sample PDF documents attached')
    console.log('==============================\n')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
