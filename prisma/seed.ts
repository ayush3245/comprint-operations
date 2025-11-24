import 'dotenv/config'
import { PrismaClient, Role } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
    const users = [
        { name: 'Admin User', role: Role.ADMIN },
        { name: 'Warehouse Exec', role: Role.MIS_WAREHOUSE_EXECUTIVE },
        { name: 'Warehouse Mgr', role: Role.WAREHOUSE_MANAGER },
        { name: 'Inspection Eng', role: Role.INSPECTION_ENGINEER },
        { name: 'Repair Eng', role: Role.REPAIR_ENGINEER },
        { name: 'Paint Tech', role: Role.PAINT_SHOP_TECHNICIAN },
        { name: 'QC Eng', role: Role.QC_ENGINEER },
    ]

    for (const user of users) {
        const existing = await prisma.user.findFirst({
            where: { name: user.name }
        })

        if (!existing) {
            await prisma.user.create({
                data: {
                    name: user.name,
                    role: user.role,
                    active: true
                }
            })
            console.log(`Created user: ${user.name} (${user.role})`)
        }
    }
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
