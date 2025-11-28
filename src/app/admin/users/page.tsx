import { checkRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import UserManagementClient from './UserManagementClient'

export default async function UserManagementPage() {
    await checkRole(['SUPERADMIN'])

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: [
            { role: 'asc' },
            { name: 'asc' }
        ]
    })

    return <UserManagementClient users={users} />
}
