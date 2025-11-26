import { checkRole } from '@/lib/auth'
import QCSearchClient from './QCSearchClient'

export default async function QCPage() {
    await checkRole(['QC_ENGINEER', 'ADMIN'])
    return <QCSearchClient />
}
