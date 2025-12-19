import { getPaintPanels, updatePanelStatus, bulkUpdatePanelStatus } from '@/lib/actions'
import { checkRole } from '@/lib/auth'
import PaintClient from './PaintClient'

export default async function PaintPage() {
    await checkRole(['PAINT_SHOP_TECHNICIAN', 'ADMIN'])
    const panels = await getPaintPanels()

    async function handleUpdateStatus(panelId: string, status: 'IN_PAINT' | 'READY_FOR_COLLECTION') {
        'use server'
        await updatePanelStatus(panelId, status)
    }

    async function handleBulkUpdateStatus(panelIds: string[], status: 'IN_PAINT' | 'READY_FOR_COLLECTION') {
        'use server'
        return await bulkUpdatePanelStatus(panelIds, status)
    }

    return (
        <PaintClient
            panels={panels}
            onUpdateStatus={handleUpdateStatus}
            onBulkUpdateStatus={handleBulkUpdateStatus}
        />
    )
}
