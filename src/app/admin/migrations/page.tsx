import { checkRole } from '@/lib/auth'
import MigrationsClient from './MigrationsClient'

export default async function MigrationsPage() {
    await checkRole(['ADMIN', 'SUPERADMIN'])

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Data Migrations</h1>
            <p className="text-muted-foreground mb-6">
                Run one-time data migrations to fix legacy data issues.
            </p>
            <MigrationsClient />
        </div>
    )
}
