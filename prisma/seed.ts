import 'dotenv/config'
import { PrismaClient, Role } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
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
