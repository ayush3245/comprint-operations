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
        { name: 'Repair Eng', email: 'repair@comprint.com', role: Role.REPAIR_ENGINEER },
        { name: 'Paint Tech', email: 'paint@comprint.com', role: Role.PAINT_SHOP_TECHNICIAN },
        { name: 'QC Eng', email: 'qc@comprint.com', role: Role.QC_ENGINEER },
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
    console.log('Email: superadmin@comprint.com')
    console.log('Password: password123')
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
