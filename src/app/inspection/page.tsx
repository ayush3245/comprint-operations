import { checkRole } from '@/lib/auth'
import InspectionSearchClient from './InspectionSearchClient'

export default async function InspectionPage() {
    await checkRole(['INSPECTION_ENGINEER', 'ADMIN'])
    return <InspectionSearchClient />
}
