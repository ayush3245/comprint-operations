import { checkRole } from '@/lib/auth'
import {
    getL2AssignedDevices,
    getDevicesReadyForL2,
    claimDeviceForL2,
    sendToDisplayRepair,
    sendToBatteryBoost,
    sendToL3Repair,
    sendPanelsToPaint,
    completeDisplayRepairByL2,
    completeBatteryBoostByL2,
    collectFromDisplayRepair,
    collectFromBatteryBoost,
    collectFromL3Repair,
    collectFromPaint,
    l2SendToQC
} from '@/lib/actions'
import L2RepairClient from './L2RepairClient'
import type { L3IssueType } from '@prisma/client'

export default async function L2RepairPage() {
    const user = await checkRole(['L2_ENGINEER', 'REPAIR_ENGINEER', 'ADMIN', 'SUPERADMIN'])

    const [assignedDevices, availableDevices] = await Promise.all([
        getL2AssignedDevices(user.id),
        getDevicesReadyForL2()
    ])

    // Server actions
    async function handleClaimDevice(deviceId: string) {
        'use server'
        return await claimDeviceForL2(deviceId)
    }

    async function handleSendToDisplay(deviceId: string, reportedIssues: string) {
        'use server'
        return await sendToDisplayRepair(deviceId, reportedIssues)
    }

    async function handleSendToBattery(deviceId: string, initialCapacity: string) {
        'use server'
        return await sendToBatteryBoost(deviceId, initialCapacity)
    }

    async function handleSendToL3(deviceId: string, issueType: L3IssueType, description: string) {
        'use server'
        return await sendToL3Repair(deviceId, issueType, description)
    }

    async function handleSendToPaint(deviceId: string, panels: string[]) {
        'use server'
        return await sendPanelsToPaint(deviceId, panels)
    }

    async function handleCompleteDisplayByL2(deviceId: string, notes: string) {
        'use server'
        return await completeDisplayRepairByL2(deviceId, notes)
    }

    async function handleCompleteBatteryByL2(deviceId: string, finalCapacity: string, notes: string) {
        'use server'
        return await completeBatteryBoostByL2(deviceId, finalCapacity, notes)
    }

    async function handleCollectFromDisplay(deviceId: string) {
        'use server'
        return await collectFromDisplayRepair(deviceId)
    }

    async function handleCollectFromBattery(deviceId: string) {
        'use server'
        return await collectFromBatteryBoost(deviceId)
    }

    async function handleCollectFromL3(deviceId: string) {
        'use server'
        return await collectFromL3Repair(deviceId)
    }

    async function handleCollectFromPaint(jobId: string) {
        'use server'
        return await collectFromPaint(jobId)
    }

    async function handleSendToQC(deviceId: string) {
        'use server'
        return await l2SendToQC(deviceId)
    }

    return (
        <L2RepairClient
            assignedDevices={assignedDevices}
            availableDevices={availableDevices}
            userId={user.id}
            userName={user.name}
            onClaimDevice={handleClaimDevice}
            onSendToDisplay={handleSendToDisplay}
            onSendToBattery={handleSendToBattery}
            onSendToL3={handleSendToL3}
            onSendToPaint={handleSendToPaint}
            onCompleteDisplayByL2={handleCompleteDisplayByL2}
            onCompleteBatteryByL2={handleCompleteBatteryByL2}
            onCollectFromDisplay={handleCollectFromDisplay}
            onCollectFromBattery={handleCollectFromBattery}
            onCollectFromL3={handleCollectFromL3}
            onCollectFromPaint={handleCollectFromPaint}
            onSendToQC={handleSendToQC}
        />
    )
}
