'use server'

import { prisma } from './db'
import { InwardType, DeviceStatus, Role, Ownership, MovementType, Grade, QCStatus, RepairStatus, OutwardType, ChecklistStatus, ChecklistStage, L3IssueType, ParallelWorkStatus, RackStage } from '@prisma/client'
import { getChecklistForCategory } from './checklist-definitions'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { logActivity } from './activity'
import { notifySparesRequested, notifyQCFailed, notifyPaintReady } from './notifications'

// --- Inward Actions ---

export async function createInwardBatch(data: {
  type: InwardType
  date?: string  // ISO date string from date input
  poInvoiceNo?: string
  supplier?: string
  customer?: string
  rentalRef?: string
  emailSubject?: string
  emailThreadId?: string
  createdById?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const count = await prisma.inwardBatch.count()
  const batchId = `BATCH-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`

  // Parse date or use current date
  const batchDate = data.date ? new Date(data.date) : new Date()

  const batch = await prisma.inwardBatch.create({
    data: {
      batchId,
      type: data.type,
      date: batchDate,
      poInvoiceNo: data.poInvoiceNo,
      supplier: data.supplier,
      customer: data.customer,
      rentalRef: data.rentalRef,
      emailSubject: data.emailSubject,
      emailThreadId: data.emailThreadId,
      createdById: user.id
    }
  })

  revalidatePath('/inward')

  await logActivity({
    action: 'CREATED_INWARD',
    details: `Created batch ${batchId} (${data.type})`,
    userId: user.id,
    metadata: { batchId: batch.id }
  })

  return batch
}

export async function updateInwardBatch(
  batchId: string,
  data: {
    date?: string
    poInvoiceNo?: string
    supplier?: string
    customer?: string
    rentalRef?: string
    emailSubject?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Verify batch exists
  const batch = await prisma.inwardBatch.findUnique({
    where: { batchId }
  })
  if (!batch) throw new Error('Batch not found')

  // Parse date if provided
  const updateData: Record<string, unknown> = {}
  if (data.date) updateData.date = new Date(data.date)
  if (data.poInvoiceNo !== undefined) updateData.poInvoiceNo = data.poInvoiceNo
  if (data.supplier !== undefined) updateData.supplier = data.supplier
  if (data.customer !== undefined) updateData.customer = data.customer
  if (data.rentalRef !== undefined) updateData.rentalRef = data.rentalRef
  if (data.emailSubject !== undefined) updateData.emailSubject = data.emailSubject

  const updated = await prisma.inwardBatch.update({
    where: { batchId },
    data: updateData
  })

  await logActivity({
    action: 'UPDATED_BATCH',
    details: `Updated batch ${batchId}`,
    userId: user.id,
    metadata: { batchId: batch.id, changes: data }
  })

  revalidatePath('/inward')
  revalidatePath(`/inward/${batchId}`)

  return updated
}

export async function addDeviceToBatch(batchId: string, data: {
  category: 'LAPTOP' | 'DESKTOP' | 'WORKSTATION' | 'SERVER' | 'MONITOR' | 'STORAGE' | 'NETWORKING_CARD'
  brand: string
  model: string
  // Laptop/Desktop/Workstation fields
  cpu?: string
  ram?: string
  ssd?: string
  gpu?: string
  screenSize?: string
  // Server fields
  formFactor?: string
  raidController?: string
  networkPorts?: string
  // Monitor fields
  monitorSize?: string
  resolution?: string
  panelType?: string
  refreshRate?: string
  monitorPorts?: string
  // Storage fields
  storageType?: string
  capacity?: string
  storageFormFactor?: string
  interface?: string
  rpm?: string
  // Networking card fields
  nicSpeed?: string
  portCount?: string
  connectorType?: string
  nicInterface?: string
  bracketType?: string
  // Common fields
  serial?: string
  ownership: Ownership
}) {
  // Category prefix for barcode
  const categoryPrefixes: Record<string, string> = {
    LAPTOP: 'L',
    DESKTOP: 'D',
    WORKSTATION: 'W',
    SERVER: 'S',
    MONITOR: 'M',
    STORAGE: 'ST',
    NETWORKING_CARD: 'N'
  }
  const prefix = categoryPrefixes[data.category] || data.category.substring(0, 1)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const barcode = `${prefix}-${data.brand.substring(0, 3).toUpperCase()}-${random}`

  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.create({
    data: {
      barcode,
      inwardBatchId: batchId,
      status: DeviceStatus.RECEIVED,
      ...data
    }
  })

  await prisma.stockMovement.create({
    data: {
      deviceId: device.id,
      type: MovementType.INWARD,
      userId: user.id,
      reference: batchId,
      toLocation: 'Receiving Area'
    }
  })

  // Auto-assign device to appropriate rack based on status
  await autoAssignDeviceToRack(device.id)

  revalidatePath(`/inward/${batchId}`)
  return device
}

export async function updateDevice(deviceId: string, data: {
  brand?: string
  model?: string
  // Laptop/Desktop/Workstation fields
  cpu?: string
  ram?: string
  ssd?: string
  gpu?: string
  screenSize?: string
  // Server fields
  formFactor?: string
  raidController?: string
  networkPorts?: string
  // Monitor fields
  monitorSize?: string
  resolution?: string
  panelType?: string
  refreshRate?: string
  monitorPorts?: string
  // Storage fields
  storageType?: string
  capacity?: string
  storageFormFactor?: string
  interface?: string
  rpm?: string
  // Networking card fields
  nicSpeed?: string
  portCount?: string
  connectorType?: string
  nicInterface?: string
  bracketType?: string
  // Common fields
  serial?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Get the device to find its batch for revalidation
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: { inwardBatchId: true, barcode: true }
  })

  if (!device) throw new Error('Device not found')

  // Only allow editing devices in RECEIVED status
  const existingDevice = await prisma.device.findUnique({
    where: { id: deviceId },
    select: { status: true }
  })

  if (existingDevice?.status !== 'RECEIVED') {
    throw new Error('Can only edit devices in RECEIVED status')
  }

  const updatedDevice = await prisma.device.update({
    where: { id: deviceId },
    data
  })

  // Revalidate the batch page
  if (device.inwardBatchId) {
    const batch = await prisma.inwardBatch.findUnique({
      where: { id: device.inwardBatchId },
      select: { batchId: true }
    })
    if (batch) {
      revalidatePath(`/inward/${batch.batchId}`)
    }
  }

  return updatedDevice
}

export async function bulkUploadDevices(batchId: string, devices: Array<{
  category: string
  brand: string
  model: string
  // Common fields
  cpu?: string
  ram?: string
  ssd?: string
  gpu?: string
  screenSize?: string
  serial?: string
  // Server fields
  formFactor?: string
  raidController?: string
  networkPorts?: string
  // Monitor fields
  monitorSize?: string
  resolution?: string
  panelType?: string
  refreshRate?: string
  monitorPorts?: string
  // Storage fields
  storageType?: string
  capacity?: string
  storageFormFactor?: string
  interface?: string
  rpm?: string
  // Networking card fields
  nicSpeed?: string
  portCount?: string
  connectorType?: string
  nicInterface?: string
  bracketType?: string
}>) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Get batch to determine ownership
  const batch = await prisma.inwardBatch.findUnique({
    where: { id: batchId }
  })
  if (!batch) throw new Error('Batch not found')

  const ownership = batch.type === 'REFURB_PURCHASE' ? Ownership.REFURB_STOCK : Ownership.RENTAL_RETURN

  const validCategories = ['LAPTOP', 'DESKTOP', 'WORKSTATION', 'SERVER', 'MONITOR', 'STORAGE', 'NETWORKING_CARD']

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string; data: any }>
  }

  for (let i = 0; i < devices.length; i++) {
    const deviceData = devices[i]
    try {
      // Validate category
      const category = deviceData.category.toUpperCase().replace(' ', '_')
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid category: ${deviceData.category}. Valid categories: ${validCategories.join(', ')}`)
      }

      // Validate required fields
      if (!deviceData.brand || !deviceData.model) {
        throw new Error('Brand and Model are required')
      }

      await addDeviceToBatch(batchId, {
        category: category as 'LAPTOP' | 'DESKTOP' | 'WORKSTATION' | 'SERVER' | 'MONITOR' | 'STORAGE' | 'NETWORKING_CARD',
        brand: deviceData.brand.trim(),
        model: deviceData.model.trim(),
        cpu: deviceData.cpu?.trim(),
        ram: deviceData.ram?.trim(),
        ssd: deviceData.ssd?.trim(),
        gpu: deviceData.gpu?.trim(),
        screenSize: deviceData.screenSize?.trim(),
        serial: deviceData.serial?.trim(),
        // Server fields
        formFactor: deviceData.formFactor?.trim(),
        raidController: deviceData.raidController?.trim(),
        networkPorts: deviceData.networkPorts?.trim(),
        // Monitor fields
        monitorSize: deviceData.monitorSize?.trim(),
        resolution: deviceData.resolution?.trim(),
        panelType: deviceData.panelType?.trim(),
        refreshRate: deviceData.refreshRate?.trim(),
        monitorPorts: deviceData.monitorPorts?.trim(),
        // Storage fields
        storageType: deviceData.storageType?.trim(),
        capacity: deviceData.capacity?.trim(),
        storageFormFactor: deviceData.storageFormFactor?.trim(),
        interface: deviceData.interface?.trim(),
        rpm: deviceData.rpm?.trim(),
        // Networking card fields
        nicSpeed: deviceData.nicSpeed?.trim(),
        portCount: deviceData.portCount?.trim(),
        connectorType: deviceData.connectorType?.trim(),
        nicInterface: deviceData.nicInterface?.trim(),
        bracketType: deviceData.bracketType?.trim(),
        ownership
      })

      results.success++
    } catch (error) {
      results.failed++
      results.errors.push({
        row: i + 2, // +2 because Excel is 1-indexed and has header row
        error: error instanceof Error ? error.message : 'Unknown error',
        data: deviceData
      })
    }
  }

  revalidatePath(`/inward/${batchId}`)
  return results
}

// --- Inspection Actions ---

/**
 * Checklist item result from inspection form
 */
interface ChecklistItemResult {
  itemIndex: number
  itemText: string
  status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE'
  notes?: string
}

/**
 * Submit inspection with category-specific checklist
 * This is the new checklist-based inspection function
 */
export async function submitInspectionWithChecklist(deviceId: string, data: {
  inspectionEngId: string
  checklistItems: ChecklistItemResult[]
  sparesRequired: string
  overallNotes?: string
  paintPanels?: string[]
}) {
  // Get device to determine category
  const device = await prisma.device.findUnique({
    where: { id: deviceId }
  })
  if (!device) throw new Error('Device not found')

  // Create inspection checklist items
  for (const item of data.checklistItems) {
    await prisma.inspectionChecklistItem.create({
      data: {
        deviceId,
        itemIndex: item.itemIndex,
        itemText: item.itemText,
        status: item.status as ChecklistStatus,
        notes: item.notes,
        checkedById: data.inspectionEngId,
        checkedAt: new Date(),
        checkedAtStage: ChecklistStage.INSPECTION
      }
    })
  }

  // Determine if any items failed (requires repair)
  const hasFailedItems = data.checklistItems.some(item => item.status === 'FAIL')
  const repairRequired = hasFailedItems || Boolean(data.sparesRequired)
  const paintRequired = data.paintPanels && data.paintPanels.length > 0

  // Determine next status - always goes to L2 Engineer for coordination if repair needed
  let nextStatus: DeviceStatus
  if (repairRequired || paintRequired) {
    nextStatus = data.sparesRequired ? DeviceStatus.WAITING_FOR_SPARES : DeviceStatus.READY_FOR_REPAIR
  } else {
    // If all pass and no spares and no paint, go directly to QC
    nextStatus = DeviceStatus.AWAITING_QC
  }

  // Update device with workflow flags and status
  // Note: paintRequired flag is set but NO panels are created yet
  // L2 Engineer must explicitly send panels to paint
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: nextStatus,
      repairRequired: repairRequired || paintRequired,
      repairCompleted: !(repairRequired || paintRequired),
      paintRequired: paintRequired,
      paintCompleted: !paintRequired
    }
  })

  // Note: Paint panels are NOT created here - they are only created when
  // L2 Engineer explicitly sends them via sendPanelsToPaint()
  // The recommended panels are stored in the repair job for L2 to review

  // Create repair job if repair or paint is needed
  let repairJob = null
  if (repairRequired || paintRequired) {
    const count = await prisma.repairJob.count()
    const jobId = `JOB-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`

    // Collect failed items as reported issues
    const failedItems = data.checklistItems
      .filter(item => item.status === 'FAIL')
      .map(item => `[${item.itemIndex}] ${item.itemText}${item.notes ? `: ${item.notes}` : ''}`)

    repairJob = await prisma.repairJob.create({
      data: {
        jobId,
        deviceId,
        inspectionEngId: data.inspectionEngId,
        reportedIssues: JSON.stringify({
          failedItems,
          notes: data.overallNotes
        }),
        sparesRequired: data.sparesRequired,
        // Store recommended paint panels as JSON for L2 to review and send
        recommendedPaintPanels: paintRequired ? JSON.stringify(data.paintPanels) : null,
        status: data.sparesRequired ? 'WAITING_FOR_SPARES' : 'READY_FOR_REPAIR'
      }
    })
  }

  // Auto-assign device to appropriate rack based on new status
  await autoAssignDeviceToRack(deviceId)

  revalidatePath('/inspection')
  revalidatePath('/l2-repair')

  const user = await getCurrentUser()
  if (user) {
    const failedCount = data.checklistItems.filter(i => i.status === 'FAIL').length
    const passedCount = data.checklistItems.filter(i => i.status === 'PASS').length
    const paintPanelCount = data.paintPanels?.length || 0
    const statusDescription = (repairRequired || paintRequired) ? 'for L2 repair' : 'for QC'
    const paintInfo = paintPanelCount > 0 ? `, ${paintPanelCount} paint panels` : ''
    await logActivity({
      action: 'COMPLETED_INSPECTION',
      details: `Inspected device (${passedCount} pass, ${failedCount} fail${paintInfo}), routed ${statusDescription}`,
      userId: user.id,
      metadata: {
        repairJobId: repairJob?.id,
        deviceId,
        nextStatus,
        passedCount,
        failedCount,
        totalItems: data.checklistItems.length,
        paintPanels: data.paintPanels || []
      }
    })
  }

  // Send notification if spares are required
  if (data.sparesRequired && repairJob) {
    const inspector = await prisma.user.findUnique({
      where: { id: data.inspectionEngId },
      select: { name: true }
    })
    notifySparesRequested({
      deviceBarcode: device.barcode,
      deviceModel: device.model,
      sparesRequired: data.sparesRequired,
      requestedBy: inspector?.name || 'Unknown'
    }).catch(err => console.error('Failed to send spares notification:', err))
  }

  return { repairJob, nextStatus }
}

/**
 * Get checklist items for a device (if already created)
 */
export async function getDeviceChecklistItems(deviceId: string) {
  return await prisma.inspectionChecklistItem.findMany({
    where: { deviceId },
    include: {
      checkedBy: { select: { name: true } }
    },
    orderBy: { itemIndex: 'asc' }
  })
}

/**
 * Legacy inspection function - kept for backward compatibility
 * @deprecated Use submitInspectionWithChecklist instead
 */
export async function submitInspection(deviceId: string, data: {
  inspectionEngId: string
  reportedIssues: string
  cosmeticIssues: string
  paintRequired: boolean
  paintPanels: string[]
  sparesRequired: string
}) {
  // Determine if repair is actually needed based on reported issues
  const hasIssues = data.reportedIssues && data.reportedIssues.trim().length > 0
  const repairRequired = hasIssues || Boolean(data.sparesRequired)
  const paintRequired = data.paintRequired && data.paintPanels.length > 0

  // Determine next status based on workflow logic
  // Paint is now parallel work coordinated by L2, so device goes to L2 first
  let nextStatus: DeviceStatus
  if (repairRequired || paintRequired) {
    // If repair or paint is needed, L2 Engineer coordinates
    nextStatus = data.sparesRequired ? DeviceStatus.WAITING_FOR_SPARES : DeviceStatus.READY_FOR_REPAIR
  } else {
    // If neither repair nor paint needed, go directly to QC
    nextStatus = DeviceStatus.AWAITING_QC
  }

  // Update device with workflow flags and status
  // Note: paintRequired flag is set but NO panels are created yet
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: nextStatus,
      repairRequired: repairRequired || paintRequired,
      paintRequired,
      repairCompleted: !(repairRequired || paintRequired),
      paintCompleted: !paintRequired
    }
  })

  // Create repair job if repair or paint is needed (L2 coordinates all)
  let repairJob = null
  if (repairRequired || paintRequired) {
    const count = await prisma.repairJob.count()
    const jobId = `JOB-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`

    repairJob = await prisma.repairJob.create({
      data: {
        jobId,
        deviceId,
        inspectionEngId: data.inspectionEngId,
        reportedIssues: JSON.stringify({
          functional: data.reportedIssues,
          cosmetic: data.cosmeticIssues
        }),
        sparesRequired: data.sparesRequired,
        // Store recommended paint panels for L2 to review and send
        recommendedPaintPanels: paintRequired ? JSON.stringify(data.paintPanels) : null,
        status: data.sparesRequired ? 'WAITING_FOR_SPARES' : 'READY_FOR_REPAIR'
      }
    })
  }

  // Note: Paint panels are NOT created here - they are only created when
  // L2 Engineer explicitly sends them via sendPanelsToPaint()

  // Auto-assign device to appropriate rack based on new status
  await autoAssignDeviceToRack(deviceId)

  revalidatePath(`/inspection`)

  const user = await getCurrentUser()
  if (user) {
    const statusDescription = repairRequired ? 'for repair' : paintRequired ? 'for paint' : 'for QC'
    await logActivity({
      action: 'COMPLETED_INSPECTION',
      details: `Inspected device, routed ${statusDescription}`,
      userId: user.id,
      metadata: { repairJobId: repairJob?.id, deviceId, nextStatus }
    })
  }

  // Send notification if spares are required
  if (data.sparesRequired && repairJob) {
    const deviceForNotif = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { barcode: true, model: true }
    })
    const inspector = await prisma.user.findUnique({
      where: { id: data.inspectionEngId },
      select: { name: true }
    })
    if (deviceForNotif) {
      notifySparesRequested({
        deviceBarcode: deviceForNotif.barcode,
        deviceModel: deviceForNotif.model,
        sparesRequired: data.sparesRequired,
        requestedBy: inspector?.name || 'Unknown'
      }).catch(err => console.error('Failed to send spares notification:', err))
    }
  }

  return repairJob
}

export async function getDeviceByBarcode(barcode: string) {
  return await prisma.device.findUnique({
    where: { barcode },
    include: {
      inwardBatch: true,
      repairJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      qcRecords: true
    }
  })
}

/**
 * Get device data with full checklist and parallel work status for QC validation
 */
export async function getDeviceForQC(barcode: string) {
  return await prisma.device.findUnique({
    where: { barcode },
    include: {
      inwardBatch: true,
      repairJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          l2Engineer: { select: { name: true } },
          inspectionEng: { select: { name: true } }
        }
      },
      qcRecords: true,
      inspectionChecklist: {
        orderBy: { itemIndex: 'asc' },
        include: {
          checkedBy: { select: { name: true } }
        }
      },
      displayRepairJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      batteryBoostJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      l3RepairJobs: {
        orderBy: { createdAt: 'desc' }
      },
      paintPanels: true
    }
  })
}

// --- Spares Actions ---

export async function getSparesRequests() {
  return await prisma.repairJob.findMany({
    where: {
      status: 'WAITING_FOR_SPARES'
    },
    include: {
      device: true,
      inspectionEng: true
    },
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * Parse spare parts string to extract part codes and quantities
 * Supports formats: "PART001, PART002" or "PART001:2, PART002:1" or "PART001 x2, PART002"
 */
function parseSparesString(sparesString: string): Array<{ partCode: string; quantity: number }> {
  if (!sparesString || !sparesString.trim()) return []

  return sparesString.split(',').map(part => {
    const trimmed = part.trim()
    // Check for "PART:qty" format
    if (trimmed.includes(':')) {
      const [code, qty] = trimmed.split(':')
      return { partCode: code.trim(), quantity: parseInt(qty.trim()) || 1 }
    }
    // Check for "PART x2" or "PART X2" format
    const xMatch = trimmed.match(/(.+?)\s*[xX]\s*(\d+)$/)
    if (xMatch) {
      return { partCode: xMatch[1].trim(), quantity: parseInt(xMatch[2]) || 1 }
    }
    // Default: single item
    return { partCode: trimmed, quantity: 1 }
  }).filter(item => item.partCode.length > 0)
}

/**
 * Validate that all requested spare parts are in stock
 * Returns validation result with details on what's missing
 */
export async function validateSparesInStock(sparesString: string): Promise<{
  valid: boolean
  items: Array<{
    partCode: string
    requested: number
    available: number
    found: boolean
  }>
  errors: string[]
}> {
  const requestedParts = parseSparesString(sparesString)
  const errors: string[] = []
  const items: Array<{
    partCode: string
    requested: number
    available: number
    found: boolean
  }> = []

  for (const { partCode, quantity } of requestedParts) {
    const sparePart = await prisma.sparePart.findFirst({
      where: { partCode: { equals: partCode, mode: 'insensitive' } }
    })

    if (!sparePart) {
      items.push({ partCode, requested: quantity, available: 0, found: false })
      errors.push(`Part "${partCode}" not found in inventory`)
    } else if (sparePart.currentStock < quantity) {
      items.push({ partCode, requested: quantity, available: sparePart.currentStock, found: true })
      errors.push(`Insufficient stock for "${partCode}": requested ${quantity}, available ${sparePart.currentStock}`)
    } else {
      items.push({ partCode, requested: quantity, available: sparePart.currentStock, found: true })
    }
  }

  return {
    valid: errors.length === 0,
    items,
    errors
  }
}

/**
 * Issue spare parts for a repair job
 * Validates stock availability and deducts from inventory
 */
export async function issueSpares(jobId: string, sparesIssued: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Validate stock availability first
  const validation = await validateSparesInStock(sparesIssued)
  if (!validation.valid) {
    throw new Error(`Cannot issue spares: ${validation.errors.join('; ')}`)
  }

  // Get the job for logging
  const job = await prisma.repairJob.findUnique({
    where: { id: jobId },
    include: { device: true }
  })
  if (!job) throw new Error('Repair job not found')

  // Use a transaction to deduct stock and update job
  await prisma.$transaction(async (tx) => {
    // Deduct stock for each part
    const parsedParts = parseSparesString(sparesIssued)
    for (const { partCode, quantity } of parsedParts) {
      await tx.sparePart.updateMany({
        where: { partCode: { equals: partCode, mode: 'insensitive' } },
        data: { currentStock: { decrement: quantity } }
      })
    }

    // Update repair job
    await tx.repairJob.update({
      where: { id: jobId },
      data: {
        sparesIssued,
        status: 'READY_FOR_REPAIR'
      }
    })

    // Update device status
    await tx.device.update({
      where: { id: job.deviceId },
      data: { status: 'READY_FOR_REPAIR' }
    })
  })

  // Log activity
  await logActivity({
    action: 'ISSUED_SPARES',
    details: `Issued spares for ${job.device.barcode}: ${sparesIssued}`,
    userId: user.id,
    metadata: {
      jobId,
      deviceId: job.deviceId,
      deviceBarcode: job.device.barcode,
      sparesIssued
    }
  })

  // Auto-assign device to appropriate rack based on new status
  await autoAssignDeviceToRack(job.deviceId)

  revalidatePath('/spares')
  revalidatePath('/l2-repair')
}

// --- Repair Actions ---

export async function getRepairJobs(userId: string) {
  return await prisma.repairJob.findMany({
    where: {
      OR: [
        {
          repairEngId: userId,
          status: { in: ['READY_FOR_REPAIR', 'WAITING_FOR_SPARES', 'UNDER_REPAIR', 'IN_PAINT_SHOP'] }
        },
        {
          status: { in: ['READY_FOR_REPAIR', 'WAITING_FOR_SPARES'] },
          repairEngId: null
        }
      ]
    },
    include: {
      device: {
        include: {
          paintPanels: true,
          qcRecords: {
            orderBy: { completedAt: 'desc' },
            take: 1
          }
        }
      }
    },
    orderBy: { status: 'asc' }
  })
}

export async function startRepair(jobId: string, userId: string) {
  const activeJobs = await prisma.repairJob.count({
    where: {
      repairEngId: userId,
      status: 'UNDER_REPAIR'
    }
  })

  if (activeJobs >= 10) {
    throw new Error('Max 10 active jobs allowed')
  }

  const tatDueDate = new Date()
  tatDueDate.setDate(tatDueDate.getDate() + 5)

  await prisma.repairJob.update({
    where: { id: jobId },
    data: {
      repairEngId: userId,
      status: 'UNDER_REPAIR',
      repairStartDate: new Date(),
      tatDueDate
    }
  })

  const job = await prisma.repairJob.findUnique({ where: { id: jobId } })
  if (job) {
    await prisma.device.update({
      where: { id: job.deviceId },
      data: { status: 'UNDER_REPAIR' }
    })
    // Auto-assign device to appropriate rack based on new status
    await autoAssignDeviceToRack(job.deviceId)
  }

  revalidatePath('/repair')
}

export async function completeRepair(jobId: string, notes: string) {
  const job = await prisma.repairJob.findUnique({
    where: { id: jobId },
    include: { device: true }
  })

  if (!job) throw new Error('Repair job not found')

  // Mark repair as completed
  await prisma.device.update({
    where: { id: job.deviceId },
    data: { repairCompleted: true }
  })

  // Determine next status
  // Note: Paint is now parallel work coordinated by L2, NOT a separate stage
  // Device only goes to QC when ALL parallel work (including paint) is complete
  const device = job.device
  let nextDeviceStatus: DeviceStatus
  let nextJobStatus: string

  // Check if paint is required but not yet sent/completed
  const paintPending = device.paintRequired && !device.paintCompleted

  if (paintPending) {
    // Paint is still pending - device stays UNDER_REPAIR for L2 to coordinate
    // L2 must send panels to paint and collect them before sending to QC
    nextDeviceStatus = DeviceStatus.UNDER_REPAIR
    nextJobStatus = 'UNDER_REPAIR'
  } else {
    // No paint pending or paint already completed, go to QC
    nextDeviceStatus = DeviceStatus.AWAITING_QC
    nextJobStatus = 'AWAITING_QC'
  }

  await prisma.repairJob.update({
    where: { id: jobId },
    data: {
      status: nextJobStatus as any,
      repairEndDate: new Date(),
      notes
    }
  })

  await prisma.device.update({
    where: { id: job.deviceId },
    data: {
      status: nextDeviceStatus,
      repairCompleted: true  // Mark repair work as done
    }
  })

  revalidatePath('/repair')
  revalidatePath('/l2-repair')

  const user = await getCurrentUser()
  if (user) {
    const destination = paintPending ? 'L2 for paint coordination' : 'QC'
    await logActivity({
      action: 'COMPLETED_REPAIR',
      details: `Completed repair, ${paintPending ? 'awaiting paint work' : 'sent to QC'}`,
      userId: user.id,
      metadata: { jobId, nextStatus: nextDeviceStatus, paintPending }
    })
  }
}

/**
 * @deprecated Use sendPanelsToPaint instead
 * Legacy function - kept for backward compatibility
 * Note: Device status no longer changes to IN_PAINT_SHOP
 * Paint is parallel work, device stays UNDER_REPAIR
 */
export async function sendToPaint(jobId: string) {
  // Note: We no longer change status to IN_PAINT_SHOP
  // Paint is parallel work coordinated by L2
  // The actual panels should be sent via sendPanelsToPaint
  revalidatePath('/repair')
  revalidatePath('/l2-repair')
}

export async function collectFromPaint(jobId: string) {
  const job = await prisma.repairJob.findUnique({
    where: { id: jobId },
    include: { device: { include: { paintPanels: true } } }
  })

  if (!job) return

  // Update all panels to FITTED
  await prisma.paintPanel.updateMany({
    where: { deviceId: job.deviceId },
    data: { status: 'FITTED' }
  })

  // Mark paint as completed
  await prisma.device.update({
    where: { id: job.deviceId },
    data: { paintCompleted: true }
  })

  // Determine next status based on repair completion
  const device = job.device
  let nextDeviceStatus: DeviceStatus
  let nextJobStatus: RepairStatus
  let destination: string

  if (device.repairRequired && !device.repairCompleted) {
    // Repair is required but not completed, send back to repair
    nextDeviceStatus = DeviceStatus.UNDER_REPAIR
    nextJobStatus = RepairStatus.UNDER_REPAIR
    destination = 'repair station'
  } else {
    // Repair completed or not required, go to QC
    nextDeviceStatus = DeviceStatus.AWAITING_QC
    nextJobStatus = RepairStatus.AWAITING_QC
    destination = 'QC'
  }

  await prisma.device.update({
    where: { id: job.deviceId },
    data: { status: nextDeviceStatus }
  })

  await prisma.repairJob.update({
    where: { id: jobId },
    data: { status: nextJobStatus }
  })

  revalidatePath('/repair')
  revalidatePath('/paint')

  const user = await getCurrentUser()
  if (user) {
    await logActivity({
      action: 'COLLECTED_FROM_PAINT',
      details: `Collected device from paint shop, sent to ${destination}`,
      userId: user.id,
      metadata: { jobId, deviceId: job.deviceId, nextStatus: nextDeviceStatus }
    })
  }
}

// --- L2 Engineer Coordination Actions ---

/**
 * L2 Engineer claims a device for repair coordination.
 * The L2 Engineer owns the device throughout the repair cycle.
 */
export async function claimDeviceForL2(deviceId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  if (user.role !== Role.L2_ENGINEER && user.role !== Role.REPAIR_ENGINEER && user.role !== Role.SUPERADMIN && user.role !== Role.ADMIN) {
    throw new Error('Only L2 Engineers can claim devices')
  }

  // Check device is in a claimable state
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      repairJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!device) throw new Error('Device not found')
  if (device.status !== DeviceStatus.READY_FOR_REPAIR && device.status !== DeviceStatus.WAITING_FOR_SPARES) {
    throw new Error('Device is not ready to be claimed for repair')
  }

  // Update the repair job with L2 engineer assignment
  const repairJob = device.repairJobs[0]
  if (!repairJob) throw new Error('No repair job found for this device')

  await prisma.repairJob.update({
    where: { id: repairJob.id },
    data: {
      l2EngineerId: user.id,
      status: RepairStatus.UNDER_REPAIR,
      repairStartDate: new Date()
    }
  })

  await prisma.device.update({
    where: { id: deviceId },
    data: { status: DeviceStatus.UNDER_REPAIR }
  })

  // Auto-assign device to appropriate rack based on new status
  await autoAssignDeviceToRack(deviceId)

  revalidatePath('/l2-repair')
  revalidatePath('/repair')

  await logActivity({
    action: 'CLAIMED_DEVICE',
    details: `L2 Engineer claimed device ${device.barcode} for repair coordination`,
    userId: user.id,
    metadata: { deviceId, repairJobId: repairJob.id }
  })

  return repairJob
}

/**
 * Get devices assigned to a specific L2 Engineer
 */
export async function getL2AssignedDevices(l2EngineerId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const engineerId = l2EngineerId || user.id

  return await prisma.repairJob.findMany({
    where: {
      l2EngineerId: engineerId,
      // Exclude jobs that are already sent to QC or closed
      status: { notIn: [RepairStatus.AWAITING_QC, RepairStatus.REPAIR_CLOSED] }
    },
    include: {
      inspectionEng: { select: { name: true } },
      device: {
        include: {
          inspectionChecklist: {
            orderBy: { itemIndex: 'asc' },
            include: {
              checkedBy: { select: { name: true } }
            }
          },
          displayRepairJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          batteryBoostJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          l3RepairJobs: {
            orderBy: { createdAt: 'desc' }
          },
          paintPanels: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * L2 Engineer sends device to Display Technician
 */
export async function sendToDisplayRepair(deviceId: string, reportedIssues: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.findUnique({ where: { id: deviceId } })
  if (!device) throw new Error('Device not found')

  // Create display repair job
  const displayJob = await prisma.displayRepairJob.create({
    data: {
      deviceId,
      reportedIssues,
      status: ParallelWorkStatus.PENDING
    }
  })

  // Mark device as requiring display repair
  await prisma.device.update({
    where: { id: deviceId },
    data: { displayRepairRequired: true }
  })

  revalidatePath('/l2-repair')
  revalidatePath('/display-repair')

  await logActivity({
    action: 'SENT_TO_DISPLAY',
    details: `Sent device ${device.barcode} for display repair`,
    userId: user.id,
    metadata: { deviceId, displayJobId: displayJob.id }
  })

  return displayJob
}

/**
 * L2 Engineer sends device to Battery Technician
 */
export async function sendToBatteryBoost(deviceId: string, initialCapacity: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.findUnique({ where: { id: deviceId } })
  if (!device) throw new Error('Device not found')

  // Create battery boost job
  const batteryJob = await prisma.batteryBoostJob.create({
    data: {
      deviceId,
      initialCapacity,
      targetCapacity: '70%', // Minimum acceptable capacity
      status: ParallelWorkStatus.PENDING
    }
  })

  // Mark device as requiring battery boost
  await prisma.device.update({
    where: { id: deviceId },
    data: { batteryBoostRequired: true }
  })

  revalidatePath('/l2-repair')
  revalidatePath('/battery-boost')

  await logActivity({
    action: 'SENT_TO_BATTERY',
    details: `Sent device ${device.barcode} for battery boost (initial: ${initialCapacity})`,
    userId: user.id,
    metadata: { deviceId, batteryJobId: batteryJob.id, initialCapacity }
  })

  return batteryJob
}

/**
 * L2 Engineer sends device to L3 Engineer for major repairs
 */
export async function sendToL3Repair(deviceId: string, issueType: L3IssueType, description: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.findUnique({ where: { id: deviceId } })
  if (!device) throw new Error('Device not found')

  // Create L3 repair job
  const l3Job = await prisma.l3RepairJob.create({
    data: {
      deviceId,
      issueType,
      description,
      status: ParallelWorkStatus.PENDING
    }
  })

  // Mark device as requiring L3 repair
  await prisma.device.update({
    where: { id: deviceId },
    data: { l3RepairRequired: true }
  })

  revalidatePath('/l2-repair')
  revalidatePath('/l3-repair')

  await logActivity({
    action: 'SENT_TO_L3',
    details: `Sent device ${device.barcode} to L3 for ${issueType}`,
    userId: user.id,
    metadata: { deviceId, l3JobId: l3Job.id, issueType }
  })

  return l3Job
}

/**
 * L2 Engineer sends panels to Paint Shop
 */
export async function sendPanelsToPaint(deviceId: string, panels: string[]) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.findUnique({ where: { id: deviceId } })
  if (!device) throw new Error('Device not found')

  if (panels.length === 0) {
    throw new Error('Please select at least one panel')
  }

  // Create paint panels
  await prisma.paintPanel.createMany({
    data: panels.map(panel => ({
      deviceId,
      panelType: panel,
      status: 'AWAITING_PAINT'
    }))
  })

  // Mark device as requiring paint
  await prisma.device.update({
    where: { id: deviceId },
    data: { paintRequired: true }
  })

  revalidatePath('/l2-repair')
  revalidatePath('/paint')

  await logActivity({
    action: 'SENT_TO_PAINT',
    details: `Sent ${panels.length} panel(s) from device ${device.barcode} for painting`,
    userId: user.id,
    metadata: { deviceId, panels }
  })
}

/**
 * L2 Engineer completes display repair themselves
 */
export async function completeDisplayRepairByL2(deviceId: string, notes: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.findUnique({ where: { id: deviceId } })
  if (!device) throw new Error('Device not found')

  // Check if there's an existing display job and complete it
  const existingJob = await prisma.displayRepairJob.findFirst({
    where: { deviceId, status: { not: ParallelWorkStatus.COMPLETED } }
  })

  if (existingJob) {
    await prisma.displayRepairJob.update({
      where: { id: existingJob.id },
      data: {
        status: ParallelWorkStatus.COMPLETED,
        completedAt: new Date(),
        completedByL2: true,
        notes
      }
    })
  } else {
    // Create a new completed job
    await prisma.displayRepairJob.create({
      data: {
        deviceId,
        status: ParallelWorkStatus.COMPLETED,
        completedAt: new Date(),
        completedByL2: true,
        notes
      }
    })
  }

  // Mark display as completed
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      displayRepairRequired: true,
      displayRepairCompleted: true
    }
  })

  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COMPLETED_DISPLAY_BY_L2',
    details: `L2 Engineer completed display repair for device ${device.barcode}`,
    userId: user.id,
    metadata: { deviceId }
  })
}

/**
 * L2 Engineer completes battery boost themselves
 */
export async function completeBatteryBoostByL2(deviceId: string, finalCapacity: string, notes: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.findUnique({ where: { id: deviceId } })
  if (!device) throw new Error('Device not found')

  // Check if there's an existing battery job and complete it
  const existingJob = await prisma.batteryBoostJob.findFirst({
    where: { deviceId, status: { not: ParallelWorkStatus.COMPLETED } }
  })

  if (existingJob) {
    await prisma.batteryBoostJob.update({
      where: { id: existingJob.id },
      data: {
        status: ParallelWorkStatus.COMPLETED,
        completedAt: new Date(),
        completedByL2: true,
        finalCapacity,
        notes
      }
    })
  } else {
    // Create a new completed job
    await prisma.batteryBoostJob.create({
      data: {
        deviceId,
        status: ParallelWorkStatus.COMPLETED,
        completedAt: new Date(),
        completedByL2: true,
        finalCapacity,
        notes
      }
    })
  }

  // Mark battery as completed
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      batteryBoostRequired: true,
      batteryBoostCompleted: true
    }
  })

  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COMPLETED_BATTERY_BY_L2',
    details: `L2 Engineer completed battery boost for device ${device.barcode} (${finalCapacity})`,
    userId: user.id,
    metadata: { deviceId, finalCapacity }
  })
}

/**
 * L2 Engineer collects completed display repair
 */
export async function collectFromDisplayRepair(deviceId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const displayJob = await prisma.displayRepairJob.findFirst({
    where: {
      deviceId,
      status: ParallelWorkStatus.COMPLETED
    },
    orderBy: { completedAt: 'desc' }
  })

  if (!displayJob) {
    throw new Error('No completed display repair job found')
  }

  await prisma.device.update({
    where: { id: deviceId },
    data: { displayRepairCompleted: true }
  })

  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COLLECTED_FROM_DISPLAY',
    details: 'Collected device from display repair',
    userId: user.id,
    metadata: { deviceId, displayJobId: displayJob.id }
  })
}

/**
 * L2 Engineer collects completed battery boost
 */
export async function collectFromBatteryBoost(deviceId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const batteryJob = await prisma.batteryBoostJob.findFirst({
    where: {
      deviceId,
      status: ParallelWorkStatus.COMPLETED
    },
    orderBy: { completedAt: 'desc' }
  })

  if (!batteryJob) {
    throw new Error('No completed battery boost job found')
  }

  await prisma.device.update({
    where: { id: deviceId },
    data: { batteryBoostCompleted: true }
  })

  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COLLECTED_FROM_BATTERY',
    details: `Collected device from battery boost (final: ${batteryJob.finalCapacity})`,
    userId: user.id,
    metadata: { deviceId, batteryJobId: batteryJob.id, finalCapacity: batteryJob.finalCapacity }
  })
}

/**
 * L2 Engineer collects completed L3 repair
 */
export async function collectFromL3Repair(deviceId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const l3Job = await prisma.l3RepairJob.findFirst({
    where: {
      deviceId,
      status: ParallelWorkStatus.COMPLETED
    },
    orderBy: { completedAt: 'desc' }
  })

  if (!l3Job) {
    throw new Error('No completed L3 repair job found')
  }

  await prisma.device.update({
    where: { id: deviceId },
    data: { l3RepairCompleted: true }
  })

  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COLLECTED_FROM_L3',
    details: `Collected device from L3 repair (${l3Job.issueType})`,
    userId: user.id,
    metadata: { deviceId, l3JobId: l3Job.id, issueType: l3Job.issueType }
  })
}

/**
 * L2 Engineer sends device to QC after all parallel work is complete
 */
export async function l2SendToQC(deviceId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      repairJobs: {
        where: { l2EngineerId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      paintPanels: true
    }
  })

  if (!device) throw new Error('Device not found')

  // Check if all paint panels are complete (READY_FOR_COLLECTION or FITTED)
  const allPaintPanelsComplete = device.paintPanels.length > 0 &&
    device.paintPanels.every(p => p.status === 'READY_FOR_COLLECTION' || p.status === 'FITTED')
  const paintComplete = device.paintCompleted || allPaintPanelsComplete

  // Validate all parallel work is complete
  const errors: string[] = []

  if (device.displayRepairRequired && !device.displayRepairCompleted) {
    errors.push('Display repair not completed')
  }
  if (device.batteryBoostRequired && !device.batteryBoostCompleted) {
    errors.push('Battery boost not completed')
  }
  if (device.l3RepairRequired && !device.l3RepairCompleted) {
    errors.push('L3 repair not completed')
  }
  if (device.paintRequired && !paintComplete) {
    errors.push('Paint work not completed')
  }

  if (errors.length > 0) {
    throw new Error(`Cannot send to QC: ${errors.join(', ')}`)
  }

  // If paint panels are complete but flag not set, update it now
  if (device.paintRequired && allPaintPanelsComplete && !device.paintCompleted) {
    await prisma.paintPanel.updateMany({
      where: { deviceId },
      data: { status: 'FITTED' }
    })
  }

  // Update device status
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: DeviceStatus.AWAITING_QC,
      repairCompleted: true,
      paintCompleted: device.paintRequired ? true : device.paintCompleted
    }
  })

  // Update repair job status
  const repairJob = device.repairJobs[0]
  if (repairJob) {
    await prisma.repairJob.update({
      where: { id: repairJob.id },
      data: {
        status: RepairStatus.AWAITING_QC,
        repairEndDate: new Date()
      }
    })
  }

  // Auto-assign device to appropriate rack based on new status
  await autoAssignDeviceToRack(deviceId)

  revalidatePath('/l2-repair')
  revalidatePath('/qc')

  await logActivity({
    action: 'L2_SENT_TO_QC',
    details: `L2 Engineer sent device ${device.barcode} to QC`,
    userId: user.id,
    metadata: { deviceId, repairJobId: repairJob?.id }
  })
}

/**
 * Get devices that L2 has completed and sent to QC (read-only view)
 */
export async function getL2CompletedDevices(l2EngineerId: string) {
  return await prisma.device.findMany({
    where: {
      repairJobs: {
        some: {
          l2EngineerId,
          status: { in: [RepairStatus.AWAITING_QC, RepairStatus.REPAIR_CLOSED] }
        }
      }
    },
    include: {
      repairJobs: {
        where: { l2EngineerId },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          l2Engineer: { select: { name: true } },
          inspectionEng: { select: { name: true } }
        }
      },
      qcRecords: {
        orderBy: { completedAt: 'desc' },
        take: 1,
        include: {
          qcEng: { select: { name: true } }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 50 // Limit to last 50 for performance
  })
}

/**
 * L2 Engineer completes display work directly (without dispatching)
 */
export async function l2CompleteDisplayWork(deviceId: string, notes?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  if (!['L2_ENGINEER', 'REPAIR_ENGINEER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
    throw new Error('Only L2 Engineers can complete display work')
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId }
  })

  if (!device) throw new Error('Device not found')

  // Create a completed display repair job
  await prisma.displayRepairJob.create({
    data: {
      deviceId,
      status: ParallelWorkStatus.COMPLETED,
      assignedToId: user.id,
      startedAt: new Date(),
      completedAt: new Date(),
      completedByL2: true,
      notes: notes || 'Completed by L2 Engineer directly'
    }
  })

  // Update device flags
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      displayRepairRequired: true,
      displayRepairCompleted: true
    }
  })

  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COMPLETED_DISPLAY_BY_L2',
    details: `L2 Engineer completed display work directly for device ${device.barcode}`,
    userId: user.id,
    metadata: { deviceId }
  })
}

/**
 * L2 Engineer completes battery boost directly (without dispatching)
 */
export async function l2CompleteBatteryWork(
  deviceId: string,
  finalCapacity: string,
  notes?: string
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  if (!['L2_ENGINEER', 'REPAIR_ENGINEER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
    throw new Error('Only L2 Engineers can complete battery work')
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId }
  })

  if (!device) throw new Error('Device not found')

  // Create a completed battery boost job
  await prisma.batteryBoostJob.create({
    data: {
      deviceId,
      status: ParallelWorkStatus.COMPLETED,
      initialCapacity: 'N/A',
      targetCapacity: finalCapacity,
      finalCapacity,
      assignedToId: user.id,
      startedAt: new Date(),
      completedAt: new Date(),
      completedByL2: true,
      notes: notes || 'Completed by L2 Engineer directly'
    }
  })

  // Update device flags
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      batteryBoostRequired: true,
      batteryBoostCompleted: true
    }
  })

  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COMPLETED_BATTERY_BY_L2',
    details: `L2 Engineer completed battery work directly for device ${device.barcode} (${finalCapacity})`,
    userId: user.id,
    metadata: { deviceId, finalCapacity }
  })
}

/**
 * L2 Engineer requests additional spare parts
 */
export async function l2RequestSpares(
  deviceId: string,
  sparesRequired: string,
  notes?: string
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  if (!['L2_ENGINEER', 'REPAIR_ENGINEER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
    throw new Error('Only L2 Engineers can request spare parts')
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      repairJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!device) throw new Error('Device not found')

  const repairJob = device.repairJobs[0]
  if (!repairJob) throw new Error('No repair job found for this device')

  // Append to existing spares (don't overwrite)
  const existingSpares = repairJob.sparesRequired || ''
  const updatedSpares = existingSpares
    ? `${existingSpares}\n[L2 Request] ${sparesRequired}`
    : sparesRequired

  // Update repair job with new spares request
  await prisma.repairJob.update({
    where: { id: repairJob.id },
    data: {
      sparesRequired: updatedSpares,
      notes: notes
        ? `${repairJob.notes || ''}\n[L2 Spares Request] ${notes}`
        : repairJob.notes,
      status: RepairStatus.WAITING_FOR_SPARES
    }
  })

  // Update device status
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: DeviceStatus.WAITING_FOR_SPARES
    }
  })

  // Auto-assign device to appropriate rack based on new status
  await autoAssignDeviceToRack(deviceId)

  revalidatePath('/l2-repair')
  revalidatePath('/inventory')

  await logActivity({
    action: 'REQUESTED_SPARES',
    details: `L2 Engineer requested spares for device ${device.barcode}: ${sparesRequired}`,
    userId: user.id,
    metadata: { deviceId, sparesRequired }
  })

  // Send notification
  notifySparesRequested({
    deviceBarcode: device.barcode,
    deviceModel: device.model,
    sparesRequired,
    requestedBy: user.name || 'L2 Engineer'
  }).catch(err => console.error('Failed to send spares notification:', err))
}

/**
 * Get parallel work status summary for a device
 */
export async function getDeviceParallelWorkStatus(deviceId: string) {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      displayRepairJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      batteryBoostJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      l3RepairJobs: {
        orderBy: { createdAt: 'desc' }
      },
      paintPanels: true
    }
  })

  if (!device) throw new Error('Device not found')

  const allPaintComplete = device.paintPanels.every(
    p => p.status === 'READY_FOR_COLLECTION' || p.status === 'FITTED'
  )

  return {
    display: {
      required: device.displayRepairRequired,
      completed: device.displayRepairCompleted,
      job: device.displayRepairJobs[0] || null
    },
    battery: {
      required: device.batteryBoostRequired,
      completed: device.batteryBoostCompleted,
      job: device.batteryBoostJobs[0] || null
    },
    l3: {
      required: device.l3RepairRequired,
      completed: device.l3RepairCompleted,
      jobs: device.l3RepairJobs
    },
    paint: {
      required: device.paintRequired,
      completed: device.paintCompleted || allPaintComplete,
      panels: device.paintPanels
    },
    readyForQC: (
      (!device.displayRepairRequired || device.displayRepairCompleted) &&
      (!device.batteryBoostRequired || device.batteryBoostCompleted) &&
      (!device.l3RepairRequired || device.l3RepairCompleted) &&
      (!device.paintRequired || device.paintCompleted || allPaintComplete)
    )
  }
}

// --- Display Technician Actions ---

/**
 * Get display repair jobs for a technician
 */
export async function getDisplayRepairJobs(technicianId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const whereClause: { status?: { in: ParallelWorkStatus[] }; assignedToId?: string | null } = {
    status: { in: [ParallelWorkStatus.PENDING, ParallelWorkStatus.IN_PROGRESS] }
  }

  // If technician ID provided, show their jobs; otherwise show unassigned or user's own
  if (technicianId) {
    whereClause.assignedToId = technicianId
  }

  return await prisma.displayRepairJob.findMany({
    where: whereClause,
    include: {
      device: {
        include: {
          repairJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              l2Engineer: { select: { name: true } }
            }
          }
        }
      },
      assignedTo: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * Display Technician starts working on a display repair
 */
export async function startDisplayRepair(jobId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const job = await prisma.displayRepairJob.findUnique({
    where: { id: jobId }
  })

  if (!job) throw new Error('Display repair job not found')
  if (job.status !== ParallelWorkStatus.PENDING) {
    throw new Error('Job is not in pending status')
  }

  await prisma.displayRepairJob.update({
    where: { id: jobId },
    data: {
      status: ParallelWorkStatus.IN_PROGRESS,
      assignedToId: user.id,
      startedAt: new Date()
    }
  })

  revalidatePath('/display-repair')

  await logActivity({
    action: 'STARTED_DISPLAY_REPAIR',
    details: 'Started display repair job',
    userId: user.id,
    metadata: { jobId, deviceId: job.deviceId }
  })
}

/**
 * Display Technician completes a display repair
 */
export async function completeDisplayRepair(jobId: string, notes: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const job = await prisma.displayRepairJob.findUnique({
    where: { id: jobId },
    include: { device: true }
  })

  if (!job) throw new Error('Display repair job not found')
  if (job.status !== ParallelWorkStatus.IN_PROGRESS) {
    throw new Error('Job is not in progress')
  }

  await prisma.displayRepairJob.update({
    where: { id: jobId },
    data: {
      status: ParallelWorkStatus.COMPLETED,
      completedAt: new Date(),
      notes
    }
  })

  revalidatePath('/display-repair')
  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COMPLETED_DISPLAY_REPAIR',
    details: `Completed display repair for device ${job.device.barcode}`,
    userId: user.id,
    metadata: { jobId, deviceId: job.deviceId }
  })
}

// --- Battery Technician Actions ---

/**
 * Get battery boost jobs for a technician
 */
export async function getBatteryBoostJobs(technicianId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const whereClause: { status?: { in: ParallelWorkStatus[] }; assignedToId?: string | null } = {
    status: { in: [ParallelWorkStatus.PENDING, ParallelWorkStatus.IN_PROGRESS] }
  }

  if (technicianId) {
    whereClause.assignedToId = technicianId
  }

  return await prisma.batteryBoostJob.findMany({
    where: whereClause,
    include: {
      device: {
        include: {
          repairJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              l2Engineer: { select: { name: true } }
            }
          }
        }
      },
      assignedTo: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * Battery Technician starts working on a battery boost
 */
export async function startBatteryBoost(jobId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const job = await prisma.batteryBoostJob.findUnique({
    where: { id: jobId }
  })

  if (!job) throw new Error('Battery boost job not found')
  if (job.status !== ParallelWorkStatus.PENDING) {
    throw new Error('Job is not in pending status')
  }

  await prisma.batteryBoostJob.update({
    where: { id: jobId },
    data: {
      status: ParallelWorkStatus.IN_PROGRESS,
      assignedToId: user.id,
      startedAt: new Date()
    }
  })

  revalidatePath('/battery-boost')

  await logActivity({
    action: 'STARTED_BATTERY_BOOST',
    details: `Started battery boost job (initial: ${job.initialCapacity})`,
    userId: user.id,
    metadata: { jobId, deviceId: job.deviceId, initialCapacity: job.initialCapacity }
  })
}

/**
 * Battery Technician completes a battery boost
 */
export async function completeBatteryBoost(jobId: string, finalCapacity: string, notes: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const job = await prisma.batteryBoostJob.findUnique({
    where: { id: jobId },
    include: { device: true }
  })

  if (!job) throw new Error('Battery boost job not found')
  if (job.status !== ParallelWorkStatus.IN_PROGRESS) {
    throw new Error('Job is not in progress')
  }

  await prisma.batteryBoostJob.update({
    where: { id: jobId },
    data: {
      status: ParallelWorkStatus.COMPLETED,
      completedAt: new Date(),
      finalCapacity,
      notes
    }
  })

  revalidatePath('/battery-boost')
  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COMPLETED_BATTERY_BOOST',
    details: `Completed battery boost for device ${job.device.barcode} (${job.initialCapacity} -> ${finalCapacity})`,
    userId: user.id,
    metadata: { jobId, deviceId: job.deviceId, initialCapacity: job.initialCapacity, finalCapacity }
  })
}

// --- L3 Engineer Actions ---

/**
 * Get L3 repair jobs for an engineer
 */
export async function getL3RepairJobs(engineerId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const whereClause: { status?: { in: ParallelWorkStatus[] }; assignedToId?: string | null } = {
    status: { in: [ParallelWorkStatus.PENDING, ParallelWorkStatus.IN_PROGRESS] }
  }

  if (engineerId) {
    whereClause.assignedToId = engineerId
  }

  return await prisma.l3RepairJob.findMany({
    where: whereClause,
    include: {
      device: {
        include: {
          repairJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              l2Engineer: { select: { name: true } }
            }
          }
        }
      },
      assignedTo: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * L3 Engineer starts working on a major repair
 */
export async function startL3Repair(jobId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const job = await prisma.l3RepairJob.findUnique({
    where: { id: jobId }
  })

  if (!job) throw new Error('L3 repair job not found')
  if (job.status !== ParallelWorkStatus.PENDING) {
    throw new Error('Job is not in pending status')
  }

  await prisma.l3RepairJob.update({
    where: { id: jobId },
    data: {
      status: ParallelWorkStatus.IN_PROGRESS,
      assignedToId: user.id,
      startedAt: new Date()
    }
  })

  revalidatePath('/l3-repair')

  await logActivity({
    action: 'STARTED_L3_REPAIR',
    details: `Started L3 repair job (${job.issueType})`,
    userId: user.id,
    metadata: { jobId, deviceId: job.deviceId, issueType: job.issueType }
  })
}

/**
 * L3 Engineer completes a major repair
 */
export async function completeL3Repair(jobId: string, resolution: string, notes: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const job = await prisma.l3RepairJob.findUnique({
    where: { id: jobId },
    include: { device: true }
  })

  if (!job) throw new Error('L3 repair job not found')
  if (job.status !== ParallelWorkStatus.IN_PROGRESS) {
    throw new Error('Job is not in progress')
  }

  await prisma.l3RepairJob.update({
    where: { id: jobId },
    data: {
      status: ParallelWorkStatus.COMPLETED,
      completedAt: new Date(),
      resolution,
      notes
    }
  })

  // Check if all L3 jobs for this device are complete
  const pendingL3Jobs = await prisma.l3RepairJob.count({
    where: {
      deviceId: job.deviceId,
      status: { not: ParallelWorkStatus.COMPLETED }
    }
  })

  // If all L3 jobs complete, we could auto-mark l3RepairCompleted
  // But per workflow, L2 should collect - so we don't auto-update

  revalidatePath('/l3-repair')
  revalidatePath('/l2-repair')

  await logActivity({
    action: 'COMPLETED_L3_REPAIR',
    details: `Completed L3 repair (${job.issueType}) for device ${job.device.barcode}`,
    userId: user.id,
    metadata: { jobId, deviceId: job.deviceId, issueType: job.issueType, resolution }
  })
}

/**
 * Get available devices ready for L2 claiming (unassigned, ready for repair)
 */
export async function getDevicesReadyForL2() {
  return await prisma.device.findMany({
    where: {
      status: { in: [DeviceStatus.READY_FOR_REPAIR, DeviceStatus.WAITING_FOR_SPARES] },
      repairJobs: {
        some: {
          l2EngineerId: null
        }
      }
    },
    include: {
      inwardBatch: true,
      repairJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          inspectionEng: { select: { name: true } }
        }
      },
      inspectionChecklist: {
        orderBy: { itemIndex: 'asc' },
        include: {
          checkedBy: { select: { name: true } }
        }
      }
    },
    orderBy: { updatedAt: 'asc' }
  })
}

// --- Paint Actions ---

export async function getPaintPanels() {
  // Paint is parallel work - show all panels that need painting
  // regardless of repair status (L2 coordinates when to send panels)
  return await prisma.paintPanel.findMany({
    where: {
      status: { in: ['AWAITING_PAINT', 'IN_PAINT'] }
    },
    include: {
      device: true
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function updatePanelStatus(panelId: string, status: 'IN_PAINT' | 'READY_FOR_COLLECTION' | 'FITTED') {
  const panel = await prisma.paintPanel.update({
    where: { id: panelId },
    data: { status }
  })

  // Check if all panels for this device are now complete (READY_FOR_COLLECTION or FITTED)
  const allPanels = await prisma.paintPanel.findMany({
    where: { deviceId: panel.deviceId }
  })

  const allPanelsComplete = allPanels.every(p =>
    p.status === 'READY_FOR_COLLECTION' || p.status === 'FITTED'
  )

  if (allPanelsComplete) {
    // Mark paint as completed
    await prisma.device.update({
      where: { id: panel.deviceId },
      data: { paintCompleted: true }
    })

    // Get device to check repair status
    const device = await prisma.device.findUnique({
      where: { id: panel.deviceId }
    })

    if (!device) return

    // Determine next status based on repair completion
    let nextDeviceStatus: DeviceStatus
    let nextJobStatus: RepairStatus
    let destination: string

    if (device.repairRequired && !device.repairCompleted) {
      // Repair required but not completed - mark panels as ready for collection
      // Don't move to QC yet, wait for repair engineer to collect
      await prisma.paintPanel.updateMany({
        where: { deviceId: panel.deviceId },
        data: { status: 'READY_FOR_COLLECTION' }
      })

      // Notify repair engineer that paint panels are ready
      const repairJob = await prisma.repairJob.findFirst({
        where: { deviceId: panel.deviceId },
        orderBy: { createdAt: 'desc' }
      })
      const panelTypes = allPanels.map(p => p.panelType)
      notifyPaintReady({
        deviceBarcode: device.barcode,
        deviceModel: device.model,
        panels: panelTypes,
        repairEngId: repairJob?.repairEngId || null
      }).catch(err => console.error('Failed to send paint ready notification:', err))

      return // Exit early - repair engineer will collect and complete repair
    } else {
      // Repair completed or not required, go to QC
      nextDeviceStatus = DeviceStatus.AWAITING_QC
      nextJobStatus = RepairStatus.AWAITING_QC
      destination = 'QC'

      // Mark all panels as FITTED since we're moving to QC
      await prisma.paintPanel.updateMany({
        where: { deviceId: panel.deviceId },
        data: { status: 'FITTED' }
      })
    }

    await prisma.device.update({
      where: { id: panel.deviceId },
      data: { status: nextDeviceStatus }
    })

    // Update associated repair job if exists
    const repairJob = await prisma.repairJob.findFirst({
      where: { deviceId: panel.deviceId },
      orderBy: { createdAt: 'desc' }
    })

    if (repairJob) {
      await prisma.repairJob.update({
        where: { id: repairJob.id },
        data: { status: nextJobStatus }
      })
    }

    const user = await getCurrentUser()
    if (user) {
      await logActivity({
        action: 'COMPLETED_PAINT',
        details: `All paint panels completed, sent to ${destination}`,
        userId: user.id,
        metadata: { deviceId: panel.deviceId, nextStatus: nextDeviceStatus }
      })
    }
  }

  revalidatePath('/paint')
  revalidatePath('/qc')
}

export async function bulkUpdatePanelStatus(panelIds: string[], status: 'IN_PAINT' | 'READY_FOR_COLLECTION') {
  // Process each panel individually to ensure proper device status updates
  for (const panelId of panelIds) {
    await updatePanelStatus(panelId, status)
  }

  revalidatePath('/paint')
  return { success: true, count: panelIds.length }
}

// --- QC Actions ---

export async function submitQC(deviceId: string, data: {
  qcEngId: string
  checklistResults: string
  remarks: string
  finalGrade: 'A' | 'B' | null
  status: 'PASSED' | 'FAILED_REWORK'
}) {
  // Validate device is ready for QC
  const device = await prisma.device.findUnique({
    where: { id: deviceId }
  })

  if (!device) {
    throw new Error('Device not found')
  }

  // Check if device status is AWAITING_QC
  if (device.status !== DeviceStatus.AWAITING_QC) {
    throw new Error('Device is not ready for QC. Current status: ' + device.status)
  }

  // Validate all required stages are completed
  if (device.repairRequired && !device.repairCompleted) {
    throw new Error('Device requires repair which is not yet completed')
  }

  if (device.paintRequired && !device.paintCompleted) {
    throw new Error('Device requires painting which is not yet completed')
  }

  await prisma.qCRecord.create({
    data: {
      deviceId,
      qcEngId: data.qcEngId,
      checklistResults: data.checklistResults,
      remarks: data.remarks,
      finalGrade: data.finalGrade === 'A' ? Grade.A : Grade.B,
      status: data.status === 'PASSED' ? QCStatus.PASSED : QCStatus.FAILED_REWORK
    }
  })

  if (data.status === 'PASSED') {
    // QC Passed - mark as ready for stock
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.READY_FOR_STOCK,
        grade: data.finalGrade === 'A' ? Grade.A : Grade.B
      }
    })

    // Close the repair job
    const repairJob = await prisma.repairJob.findFirst({
      where: { deviceId },
      orderBy: { createdAt: 'desc' }
    })

    if (repairJob) {
      await prisma.repairJob.update({
        where: { id: repairJob.id },
        data: { status: RepairStatus.REPAIR_CLOSED }
      })
    }

    // Auto-assign device to appropriate rack based on new status
    await autoAssignDeviceToRack(deviceId)
  } else {
    // QC Failed - reset workflow flags and send back to inspection/repair
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.READY_FOR_REPAIR,
        repairCompleted: false,
        paintCompleted: device.paintRequired ? false : true
      }
    })

    // Re-open the last repair job with QC failure notes
    const lastJob = await prisma.repairJob.findFirst({
      where: { deviceId },
      orderBy: { createdAt: 'desc' }
    })

    if (lastJob) {
      const qcFailureNotes = `QC FAILED - REWORK REQUIRED\nQC Remarks: ${data.remarks || 'None'}\nChecklist: ${data.checklistResults || 'N/A'}`
      const existingNotes = lastJob.notes || ''

      await prisma.repairJob.update({
        where: { id: lastJob.id },
        data: {
          status: RepairStatus.READY_FOR_REPAIR,
          notes: existingNotes ? `${existingNotes}\n\n${qcFailureNotes}` : qcFailureNotes
        }
      })
    }

    // Auto-assign device to appropriate rack based on new status
    await autoAssignDeviceToRack(deviceId)
  }

  revalidatePath('/qc')
  revalidatePath('/inventory')
  revalidatePath('/repair')

  const user = await getCurrentUser()
  if (user) {
    await logActivity({
      action: 'COMPLETED_QC',
      details: `QC ${data.status} for device ${deviceId}`,
      userId: user.id,
      metadata: { deviceId, status: data.status }
    })
  }

  // Send notification if QC failed
  if (data.status === 'FAILED_REWORK') {
    const repairJob = await prisma.repairJob.findFirst({
      where: { deviceId },
      orderBy: { createdAt: 'desc' }
    })
    const qcEngineer = await prisma.user.findUnique({
      where: { id: data.qcEngId },
      select: { name: true }
    })

    notifyQCFailed({
      deviceBarcode: device.barcode,
      deviceModel: device.model,
      remarks: data.remarks,
      qcEngineer: qcEngineer?.name || 'Unknown',
      repairEngId: repairJob?.repairEngId || null
    }).catch(err => console.error('Failed to send QC failure notification:', err))
  }
}

// Update checklist item status (QC Engineer can toggle items during review)
export async function updateChecklistItemStatus(
  itemId: string,
  status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE',
  notes?: string
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Verify user is QC_ENGINEER or has admin access
  if (!['QC_ENGINEER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
    throw new Error('Only QC Engineers can update checklist items during QC')
  }

  // Get the checklist item to verify it exists
  const existingItem = await prisma.inspectionChecklistItem.findUnique({
    where: { id: itemId },
    include: { device: true }
  })

  if (!existingItem) {
    throw new Error('Checklist item not found')
  }

  // Verify device is in QC stage
  if (existingItem.device.status !== DeviceStatus.AWAITING_QC) {
    throw new Error('Can only update checklist items when device is in QC stage')
  }

  // Update the checklist item
  const updatedItem = await prisma.inspectionChecklistItem.update({
    where: { id: itemId },
    data: {
      status: status as ChecklistStatus,
      notes: notes !== undefined ? notes : existingItem.notes,
      checkedById: user.id,
      checkedAt: new Date(),
      checkedAtStage: ChecklistStage.QC
    }
  })

  await logActivity({
    action: 'UPDATED_CHECKLIST_ITEM',
    details: `Updated checklist item ${existingItem.itemIndex} to ${status} for device ${existingItem.device.barcode}`,
    userId: user.id,
    metadata: {
      deviceId: existingItem.deviceId,
      itemId,
      oldStatus: existingItem.status,
      newStatus: status
    }
  })

  revalidatePath('/qc')
  revalidatePath(`/qc/${existingItem.device.barcode}`)

  return updatedItem
}

// --- Warehouse Actions ---

export async function getInventory() {
  // Show all devices in warehouse - excluding only those that are sold/rented/scrapped
  return await prisma.device.findMany({
    where: {
      status: {
        notIn: [
          DeviceStatus.STOCK_OUT_SOLD,
          DeviceStatus.STOCK_OUT_RENTAL,
          DeviceStatus.SCRAPPED
        ]
      }
    },
    include: {
      inwardBatch: true,
      repairJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      paintPanels: true
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function searchInventory(params: {
  search?: string
  category?: string
  ownership?: string
  status?: string
  grade?: string
  sortBy?: 'barcode' | 'brand' | 'model' | 'updatedAt' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}) {
  const {
    search = '',
    category,
    ownership,
    status,
    grade,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 25
  } = params

  // Build where clause
  const where: any = {
    status: {
      notIn: [
        DeviceStatus.STOCK_OUT_SOLD,
        DeviceStatus.STOCK_OUT_RENTAL,
        DeviceStatus.SCRAPPED
      ]
    }
  }

  // Search filter
  if (search) {
    where.OR = [
      { barcode: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Category filter
  if (category) {
    where.category = category
  }

  // Ownership filter
  if (ownership) {
    where.ownership = ownership
  }

  // Status filter (override default exclusion)
  if (status) {
    where.status = status
  }

  // Grade filter
  if (grade) {
    where.grade = grade
  }

  // Execute queries in parallel
  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      include: {
        inwardBatch: true,
        repairJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        rack: {
          select: {
            id: true,
            rackCode: true,
            stage: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.device.count({ where })
  ])

  return {
    devices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

// --- Outward Actions ---

export async function getReadyForStockDevices() {
  return await prisma.device.findMany({
    where: {
      status: DeviceStatus.READY_FOR_STOCK
    },
    include: {
      inwardBatch: true
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getUsers() {
  return await prisma.user.findMany({
    where: {
      active: true
    },
    select: {
      id: true,
      name: true,
      role: true
    },
    orderBy: { name: 'asc' }
  })
}

export async function getOutwardRecords() {
  return await prisma.outwardRecord.findMany({
    include: {
      devices: true,
      packedBy: {
        select: { name: true }
      },
      checkedBy: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createOutward(data: {
  type: 'SALES' | 'RENTAL'
  customer: string
  reference: string
  shippingDetails?: string
  packedById?: string
  checkedById?: string
  deviceIds: string[]
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  if (data.deviceIds.length === 0) {
    throw new Error('Please select at least one device')
  }

  // Verify all devices are READY_FOR_STOCK
  const devices = await prisma.device.findMany({
    where: {
      id: { in: data.deviceIds },
      status: DeviceStatus.READY_FOR_STOCK
    }
  })

  if (devices.length !== data.deviceIds.length) {
    throw new Error('Some selected devices are not ready for dispatch')
  }

  // Generate outward ID
  const count = await prisma.outwardRecord.count()
  const outwardId = `OUT-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`

  // Create outward record
  const outwardRecord = await prisma.outwardRecord.create({
    data: {
      outwardId,
      type: data.type === 'SALES' ? OutwardType.SALES : OutwardType.RENTAL,
      customer: data.customer,
      reference: data.reference,
      shippingDetails: data.shippingDetails,
      packedById: data.packedById,
      checkedById: data.checkedById
    }
  })

  // Update devices and create stock movements
  const newStatus = data.type === 'SALES' ? DeviceStatus.STOCK_OUT_SOLD : DeviceStatus.STOCK_OUT_RENTAL
  const movementType = data.type === 'SALES' ? MovementType.SALES_OUTWARD : MovementType.RENTAL_OUTWARD

  for (const device of devices) {
    await prisma.device.update({
      where: { id: device.id },
      data: {
        status: newStatus,
        outwardRecordId: outwardRecord.id
      }
    })

    await prisma.stockMovement.create({
      data: {
        deviceId: device.id,
        type: movementType,
        fromLocation: device.location || 'Warehouse',
        reference: outwardId,
        userId: user.id
      }
    })

    // Remove device from rack (it's leaving the system)
    await autoAssignDeviceToRack(device.id)
  }

  revalidatePath('/outward')
  revalidatePath('/inventory')

  await logActivity({
    action: 'CREATED_OUTWARD',
    details: `Created ${data.type} outward ${outwardId} for ${data.customer} with ${data.deviceIds.length} device(s)`,
    userId: user.id,
    metadata: {
      outwardId: outwardRecord.id,
      type: data.type,
      customer: data.customer,
      deviceCount: data.deviceIds.length
    }
  })

  return outwardRecord
}

export async function updateOutwardRecord(outwardId: string, data: {
  customer?: string
  reference?: string
  shippingDetails?: string
  packedById?: string | null
  checkedById?: string | null
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const existingRecord = await prisma.outwardRecord.findUnique({
    where: { id: outwardId }
  })

  if (!existingRecord) {
    throw new Error('Outward record not found')
  }

  const updatedRecord = await prisma.outwardRecord.update({
    where: { id: outwardId },
    data: {
      customer: data.customer,
      reference: data.reference,
      shippingDetails: data.shippingDetails,
      packedById: data.packedById,
      checkedById: data.checkedById
    }
  })

  revalidatePath('/outward')

  await logActivity({
    action: 'UPDATED_OUTWARD',
    details: `Updated outward record ${existingRecord.outwardId}`,
    userId: user.id,
    metadata: {
      outwardId: existingRecord.id,
      changes: data
    }
  })

  return updatedRecord
}

// --- Spare Parts Management Actions ---

export async function getSpareParts() {
  return await prisma.sparePart.findMany({
    orderBy: { partCode: 'asc' }
  })
}

export async function getSparePartById(id: string) {
  return await prisma.sparePart.findUnique({
    where: { id }
  })
}

export async function createSparePart(data: {
  partCode: string
  description: string
  category: string
  compatibleModels?: string
  minStock?: number
  maxStock?: number
  currentStock?: number
  binLocation?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Check if part code already exists
  const existing = await prisma.sparePart.findUnique({
    where: { partCode: data.partCode }
  })
  if (existing) {
    throw new Error('Part code already exists')
  }

  const sparePart = await prisma.sparePart.create({
    data: {
      partCode: data.partCode,
      description: data.description,
      category: data.category,
      compatibleModels: data.compatibleModels,
      minStock: data.minStock || 0,
      maxStock: data.maxStock || 100,
      currentStock: data.currentStock || 0,
      binLocation: data.binLocation
    }
  })

  revalidatePath('/admin/spares')
  return sparePart
}

export async function updateSparePart(id: string, data: {
  partCode?: string
  description?: string
  category?: string
  compatibleModels?: string
  minStock?: number
  maxStock?: number
  currentStock?: number
  binLocation?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // If changing part code, check for duplicates
  if (data.partCode) {
    const existing = await prisma.sparePart.findFirst({
      where: {
        partCode: data.partCode,
        id: { not: id }
      }
    })
    if (existing) {
      throw new Error('Part code already exists')
    }
  }

  const sparePart = await prisma.sparePart.update({
    where: { id },
    data
  })

  revalidatePath('/admin/spares')
  return sparePart
}

export async function deleteSparePart(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  await prisma.sparePart.delete({
    where: { id }
  })

  revalidatePath('/admin/spares')
}

export async function adjustSpareStock(id: string, adjustment: number, reason: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const sparePart = await prisma.sparePart.findUnique({
    where: { id }
  })
  if (!sparePart) throw new Error('Spare part not found')

  const newStock = sparePart.currentStock + adjustment
  if (newStock < 0) {
    throw new Error('Stock cannot go below zero')
  }

  await prisma.sparePart.update({
    where: { id },
    data: { currentStock: newStock }
  })

  await logActivity({
    action: 'MOVED_STOCK',
    details: `Adjusted stock for ${sparePart.partCode}: ${adjustment > 0 ? '+' : ''}${adjustment} (${reason})`,
    userId: user.id,
    metadata: { sparePartId: id, adjustment, reason, newStock }
  })

  revalidatePath('/admin/spares')
}

export async function getLowStockParts() {
  const parts = await prisma.sparePart.findMany({
    orderBy: { currentStock: 'asc' }
  })
  // Filter parts where current stock is at or below minimum
  return parts.filter(part => part.currentStock <= part.minStock)
}

// --- Dashboard Stats ---

export interface DashboardStats {
  pending: number
  inProgress: number
  completed: number
}

/**
 * Get dashboard statistics for a user based on their role
 * Returns counts of pending, in-progress, and completed items
 */
export async function getUserDashboardStats(userId: string, role: Role): Promise<DashboardStats> {
  switch (role) {
    case Role.L2_ENGINEER:
    case Role.REPAIR_ENGINEER: {
      const [pending, inProgress, completed] = await Promise.all([
        // Pending: devices ready for L2 to claim (no L2 assigned yet)
        prisma.device.count({
          where: {
            status: DeviceStatus.READY_FOR_REPAIR,
            repairJobs: { none: { l2EngineerId: { not: null } } }
          }
        }),
        // In Progress: devices currently assigned to this L2 (not closed or in QC)
        prisma.repairJob.count({
          where: {
            l2EngineerId: userId,
            status: { notIn: [RepairStatus.REPAIR_CLOSED, RepairStatus.AWAITING_QC] }
          }
        }),
        // Completed: devices this L2 has finished (in QC or closed)
        prisma.repairJob.count({
          where: {
            l2EngineerId: userId,
            status: { in: [RepairStatus.REPAIR_CLOSED, RepairStatus.AWAITING_QC] }
          }
        })
      ])
      return { pending, inProgress, completed }
    }

    case Role.INSPECTION_ENGINEER: {
      const [pending, inProgress, completed] = await Promise.all([
        // Pending: devices awaiting inspection (PENDING_INSPECTION or RECEIVED)
        prisma.device.count({
          where: { status: { in: [DeviceStatus.RECEIVED, DeviceStatus.PENDING_INSPECTION] } }
        }),
        // In Progress: devices with repair jobs created by this inspector but still in inspection phase
        prisma.repairJob.count({
          where: {
            inspectionEngId: userId,
            status: RepairStatus.PENDING_INSPECTION
          }
        }),
        // Completed: devices inspected by this user (repair job exists past inspection)
        prisma.repairJob.count({
          where: {
            inspectionEngId: userId,
            status: { notIn: [RepairStatus.PENDING_INSPECTION] }
          }
        })
      ])
      return { pending, inProgress, completed }
    }

    case Role.QC_ENGINEER: {
      const [pending, completed] = await Promise.all([
        // Pending: devices awaiting QC
        prisma.device.count({
          where: { status: DeviceStatus.AWAITING_QC }
        }),
        // Completed: QC records created by this user
        prisma.qCRecord.count({
          where: { qcEngId: userId }
        })
      ])
      // For QC, "in progress" is the same as pending since QC is typically done in one session
      return { pending, inProgress: 0, completed }
    }

    case Role.DISPLAY_TECHNICIAN: {
      const [pending, inProgress, completed] = await Promise.all([
        // Pending: display jobs waiting to be picked up
        prisma.displayRepairJob.count({
          where: { status: ParallelWorkStatus.PENDING }
        }),
        // In Progress: display jobs being worked on by this user
        prisma.displayRepairJob.count({
          where: {
            status: ParallelWorkStatus.IN_PROGRESS,
            assignedToId: userId
          }
        }),
        // Completed: display jobs completed by this user
        prisma.displayRepairJob.count({
          where: {
            status: ParallelWorkStatus.COMPLETED,
            assignedToId: userId
          }
        })
      ])
      return { pending, inProgress, completed }
    }

    case Role.BATTERY_TECHNICIAN: {
      const [pending, inProgress, completed] = await Promise.all([
        // Pending: battery jobs waiting to be picked up
        prisma.batteryBoostJob.count({
          where: { status: ParallelWorkStatus.PENDING }
        }),
        // In Progress: battery jobs being worked on by this user
        prisma.batteryBoostJob.count({
          where: {
            status: ParallelWorkStatus.IN_PROGRESS,
            assignedToId: userId
          }
        }),
        // Completed: battery jobs completed by this user
        prisma.batteryBoostJob.count({
          where: {
            status: ParallelWorkStatus.COMPLETED,
            assignedToId: userId
          }
        })
      ])
      return { pending, inProgress, completed }
    }

    case Role.L3_ENGINEER: {
      const [pending, inProgress, completed] = await Promise.all([
        // Pending: L3 jobs waiting to be picked up
        prisma.l3RepairJob.count({
          where: { status: ParallelWorkStatus.PENDING }
        }),
        // In Progress: L3 jobs being worked on by this user
        prisma.l3RepairJob.count({
          where: {
            status: ParallelWorkStatus.IN_PROGRESS,
            assignedToId: userId
          }
        }),
        // Completed: L3 jobs completed by this user
        prisma.l3RepairJob.count({
          where: {
            status: ParallelWorkStatus.COMPLETED,
            assignedToId: userId
          }
        })
      ])
      return { pending, inProgress, completed }
    }

    default:
      // For admin and other roles, return zeros
      return { pending: 0, inProgress: 0, completed: 0 }
  }
}

/**
 * Migration: Fix legacy paint panels that were auto-created by inspection
 *
 * Before the paint workflow fix, inspection would create PaintPanel records directly.
 * Now, inspection only stores recommendations and L2 must explicitly send panels.
 *
 * This function:
 * 1. Finds devices with AWAITING_PAINT panels that were auto-created
 * 2. Moves panel types to recommendedPaintPanels on the repair job
 * 3. Deletes the premature paint panel records
 */
export async function migrateLegacyPaintPanels() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    throw new Error('Unauthorized - Admin only')
  }

  // Find all paint panels that are in AWAITING_PAINT status
  // These are likely auto-created by the old inspection flow
  const awaitingPanels = await prisma.paintPanel.findMany({
    where: {
      status: 'AWAITING_PAINT'
    },
    include: {
      device: {
        include: {
          repairJobs: {
            where: {
              status: { notIn: ['REPAIR_CLOSED'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }
    }
  })

  // Group panels by device
  const devicePanels = new Map<string, { deviceId: string; panels: string[]; repairJobId: string | null }>()

  for (const panel of awaitingPanels) {
    const existing = devicePanels.get(panel.deviceId)
    const repairJobId = panel.device.repairJobs[0]?.id || null

    if (existing) {
      existing.panels.push(panel.panelType)
    } else {
      devicePanels.set(panel.deviceId, {
        deviceId: panel.deviceId,
        panels: [panel.panelType],
        repairJobId
      })
    }
  }

  let migratedCount = 0
  const migratedDevices: string[] = []

  // Process each device
  for (const [deviceId, data] of devicePanels) {
    if (!data.repairJobId) continue

    // Check if repair job already has recommendedPaintPanels
    const repairJob = await prisma.repairJob.findUnique({
      where: { id: data.repairJobId },
      select: { recommendedPaintPanels: true }
    })

    // Only migrate if recommendedPaintPanels is not already set
    if (!repairJob?.recommendedPaintPanels) {
      // Store panel types in recommendedPaintPanels
      await prisma.repairJob.update({
        where: { id: data.repairJobId },
        data: {
          recommendedPaintPanels: JSON.stringify(data.panels)
        }
      })
    }

    // Delete the premature paint panel records
    await prisma.paintPanel.deleteMany({
      where: {
        deviceId,
        status: 'AWAITING_PAINT'
      }
    })

    // Get device barcode for logging
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { barcode: true }
    })

    migratedCount++
    migratedDevices.push(device?.barcode || deviceId)
  }

  // Log the migration
  await logActivity({
    action: 'MIGRATION',
    details: `Migrated ${migratedCount} devices from legacy paint panel flow`,
    userId: user.id,
    metadata: { migratedDevices }
  })

  revalidatePath('/l2-repair')
  revalidatePath('/paint')

  return {
    success: true,
    migratedCount,
    migratedDevices
  }
}

// --- Device History Actions ---

export type DeviceHistoryEvent = {
  type: string
  description: string
  user: { id: string; name: string; role: string } | null
  date: Date
  details?: Record<string, unknown>
}

export type DeviceHistory = {
  device: {
    id: string
    barcode: string
    brand: string
    model: string
    category: string
    status: string
    grade: string | null
    ownership: string
    cpu: string | null
    ram: string | null
    ssd: string | null
    gpu: string | null
    screenSize: string | null
    createdAt: Date
    updatedAt: Date
  }
  timeline: DeviceHistoryEvent[]
}

/**
 * Get complete device history with all users who worked on it
 */
export async function getDeviceHistory(deviceId: string): Promise<DeviceHistory | null> {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      inwardBatch: {
        include: {
          createdBy: { select: { id: true, name: true, role: true } }
        }
      },
      repairJobs: {
        orderBy: { createdAt: 'asc' },
        include: {
          inspectionEng: { select: { id: true, name: true, role: true } },
          repairEng: { select: { id: true, name: true, role: true } },
          l2Engineer: { select: { id: true, name: true, role: true } }
        }
      },
      displayRepairJobs: {
        orderBy: { createdAt: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, role: true } }
        }
      },
      batteryBoostJobs: {
        orderBy: { createdAt: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, role: true } }
        }
      },
      l3RepairJobs: {
        orderBy: { createdAt: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, role: true } }
        }
      },
      paintPanels: {
        orderBy: { createdAt: 'asc' },
        include: {
          technician: { select: { id: true, name: true, role: true } }
        }
      },
      qcRecords: {
        orderBy: { completedAt: 'asc' },
        include: {
          qcEng: { select: { id: true, name: true, role: true } }
        }
      },
      movements: {
        orderBy: { date: 'asc' },
        include: {
          user: { select: { id: true, name: true, role: true } }
        }
      }
    }
  })

  if (!device) return null

  // Build timeline of events
  const timeline: DeviceHistoryEvent[] = []

  // 1. Device received (inward batch creation)
  timeline.push({
    type: 'RECEIVED',
    description: `Device received via batch ${device.inwardBatch.batchId}`,
    user: device.inwardBatch.createdBy,
    date: device.inwardBatch.createdAt,
    details: {
      batchId: device.inwardBatch.batchId,
      batchType: device.inwardBatch.type
    }
  })

  // 2. Repair jobs (inspection and L2 work)
  for (const job of device.repairJobs) {
    if (job.inspectionEng) {
      timeline.push({
        type: 'INSPECTED',
        description: 'Device inspected',
        user: job.inspectionEng,
        date: job.createdAt,
        details: {
          jobId: job.jobId,
          reportedIssues: job.reportedIssues
        }
      })
    }

    if (job.l2Engineer && job.repairStartDate) {
      timeline.push({
        type: 'L2_REPAIR_STARTED',
        description: 'L2 Engineer started repair',
        user: job.l2Engineer,
        date: job.repairStartDate,
        details: { jobId: job.jobId }
      })
    }

    if (job.l2Engineer && job.repairEndDate) {
      timeline.push({
        type: 'L2_REPAIR_COMPLETED',
        description: 'L2 Engineer completed repair',
        user: job.l2Engineer,
        date: job.repairEndDate,
        details: { jobId: job.jobId }
      })
    }
  }

  // 3. Display repair jobs
  for (const job of device.displayRepairJobs) {
    if (job.startedAt && job.assignedTo) {
      timeline.push({
        type: 'DISPLAY_REPAIR_STARTED',
        description: 'Display repair started',
        user: job.assignedTo,
        date: job.startedAt,
        details: { reportedIssues: job.reportedIssues }
      })
    }
    if (job.completedAt && job.assignedTo) {
      timeline.push({
        type: 'DISPLAY_REPAIR_COMPLETED',
        description: job.completedByL2 ? 'Display repair completed by L2' : 'Display repair completed',
        user: job.assignedTo,
        date: job.completedAt,
        details: { notes: job.notes }
      })
    }
  }

  // 4. Battery boost jobs
  for (const job of device.batteryBoostJobs) {
    if (job.startedAt && job.assignedTo) {
      timeline.push({
        type: 'BATTERY_BOOST_STARTED',
        description: `Battery boost started (Initial: ${job.initialCapacity})`,
        user: job.assignedTo,
        date: job.startedAt,
        details: { initialCapacity: job.initialCapacity, targetCapacity: job.targetCapacity }
      })
    }
    if (job.completedAt && job.assignedTo) {
      timeline.push({
        type: 'BATTERY_BOOST_COMPLETED',
        description: `Battery boost completed (Final: ${job.finalCapacity})`,
        user: job.assignedTo,
        date: job.completedAt,
        details: { finalCapacity: job.finalCapacity, notes: job.notes }
      })
    }
  }

  // 5. L3 repair jobs
  for (const job of device.l3RepairJobs) {
    if (job.startedAt && job.assignedTo) {
      timeline.push({
        type: 'L3_REPAIR_STARTED',
        description: `L3 repair started (${job.issueType.replace(/_/g, ' ')})`,
        user: job.assignedTo,
        date: job.startedAt,
        details: { issueType: job.issueType, description: job.description }
      })
    }
    if (job.completedAt && job.assignedTo) {
      timeline.push({
        type: 'L3_REPAIR_COMPLETED',
        description: `L3 repair completed (${job.issueType.replace(/_/g, ' ')})`,
        user: job.assignedTo,
        date: job.completedAt,
        details: { resolution: job.resolution, notes: job.notes }
      })
    }
  }

  // 6. Paint work
  const paintByTechnician = new Map<string, { user: typeof device.paintPanels[0]['technician']; panels: string[]; date: Date }>()
  for (const panel of device.paintPanels) {
    if (panel.technician && panel.completedAt) {
      const key = panel.technician.id
      if (paintByTechnician.has(key)) {
        paintByTechnician.get(key)!.panels.push(panel.panelType)
      } else {
        paintByTechnician.set(key, {
          user: panel.technician,
          panels: [panel.panelType],
          date: panel.completedAt
        })
      }
    }
  }
  for (const [, data] of paintByTechnician) {
    timeline.push({
      type: 'PAINT_COMPLETED',
      description: `Paint completed for: ${data.panels.join(', ')}`,
      user: data.user,
      date: data.date,
      details: { panels: data.panels }
    })
  }

  // 7. QC records
  for (const qc of device.qcRecords) {
    timeline.push({
      type: qc.status === 'PASSED' ? 'QC_PASSED' : 'QC_FAILED',
      description: qc.status === 'PASSED'
        ? `QC passed - Grade ${qc.finalGrade}`
        : 'QC failed - Sent for rework',
      user: qc.qcEng,
      date: qc.completedAt,
      details: {
        grade: qc.finalGrade,
        status: qc.status,
        remarks: qc.remarks
      }
    })
  }

  // 8. Stock movements
  for (const movement of device.movements) {
    timeline.push({
      type: `MOVEMENT_${movement.type}`,
      description: `${movement.type.replace(/_/g, ' ')}: ${movement.fromLocation || 'N/A'} → ${movement.toLocation || 'N/A'}`,
      user: movement.user,
      date: movement.date,
      details: {
        type: movement.type,
        fromLocation: movement.fromLocation,
        toLocation: movement.toLocation,
        reference: movement.reference
      }
    })
  }

  // Sort timeline by date
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    device: {
      id: device.id,
      barcode: device.barcode,
      brand: device.brand,
      model: device.model,
      category: device.category,
      status: device.status,
      grade: device.grade,
      ownership: device.ownership,
      cpu: device.cpu,
      ram: device.ram,
      ssd: device.ssd,
      gpu: device.gpu,
      screenSize: device.screenSize,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt
    },
    timeline
  }
}

/**
 * Get device history by barcode
 */
export async function getDeviceHistoryByBarcode(barcode: string): Promise<DeviceHistory | null> {
  const device = await prisma.device.findUnique({
    where: { barcode },
    select: { id: true }
  })
  if (!device) return null
  return getDeviceHistory(device.id)
}

// --- Profile Actions ---

export async function getUserProfile() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  return await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePicture: true,
      role: true,
      createdAt: true
    }
  })
}

export async function updateUserProfile(data: {
  name?: string
  phone?: string
  profilePicture?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Only allow updating name, phone, and profilePicture
  const updateData: { name?: string; phone?: string; profilePicture?: string } = {}

  if (data.name !== undefined && data.name.trim().length > 0) {
    updateData.name = data.name.trim()
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone.trim() || null
  }
  if (data.profilePicture !== undefined) {
    updateData.profilePicture = data.profilePicture || null
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePicture: true,
      role: true
    }
  })

  await logActivity({
    action: 'UPDATED_PROFILE',
    details: `Updated profile settings`,
    userId: user.id,
    metadata: { updatedFields: Object.keys(updateData) }
  })

  revalidatePath('/profile')
  return updatedUser
}

// --- Rack Management Actions ---

const RACK_STAGE_PREFIX: Record<RackStage, string> = {
  RECEIVED: 'RCV',
  WAITING_FOR_REPAIR: 'WFR',
  UNDER_REPAIR: 'URP',
  AWAITING_QC: 'AQC',
  READY_FOR_DISPATCH: 'RFD'
}

/**
 * Get all racks with their device counts
 */
export async function getRacks() {
  return await prisma.rack.findMany({
    include: {
      _count: {
        select: { devices: true }
      }
    },
    orderBy: [{ stage: 'asc' }, { rackCode: 'asc' }]
  })
}

/**
 * Get racks by stage with detailed device info
 */
export async function getRacksByStage(stage: RackStage) {
  return await prisma.rack.findMany({
    where: { stage, isActive: true },
    include: {
      devices: {
        select: {
          id: true,
          barcode: true,
          brand: true,
          model: true,
          category: true,
          status: true
        }
      },
      _count: {
        select: { devices: true }
      }
    },
    orderBy: { rackCode: 'asc' }
  })
}

/**
 * Get a single rack with all devices
 */
export async function getRackById(rackId: string) {
  return await prisma.rack.findUnique({
    where: { id: rackId },
    include: {
      devices: {
        select: {
          id: true,
          barcode: true,
          brand: true,
          model: true,
          category: true,
          status: true,
          grade: true
        }
      }
    }
  })
}

/**
 * Create a new rack
 */
export async function createRack(data: {
  stage: RackStage
  location?: string
  capacity?: number
}) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'SUPERADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)) {
    throw new Error('Unauthorized - Admin only')
  }

  // Generate rack code based on stage
  const prefix = RACK_STAGE_PREFIX[data.stage]
  const existingCount = await prisma.rack.count({
    where: { stage: data.stage }
  })
  const rackCode = `${prefix}-${(existingCount + 1).toString().padStart(3, '0')}`

  const rack = await prisma.rack.create({
    data: {
      rackCode,
      stage: data.stage,
      location: data.location,
      capacity: data.capacity || 10
    }
  })

  await logActivity({
    action: 'CREATED_RACK',
    details: `Created rack ${rackCode} for stage ${data.stage}`,
    userId: user.id,
    metadata: { rackId: rack.id, stage: data.stage }
  })

  revalidatePath('/admin/racks')
  return rack
}

/**
 * Update a rack
 */
export async function updateRack(rackId: string, data: {
  location?: string
  capacity?: number
  isActive?: boolean
}) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'SUPERADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)) {
    throw new Error('Unauthorized - Admin only')
  }

  const rack = await prisma.rack.update({
    where: { id: rackId },
    data
  })

  await logActivity({
    action: 'UPDATED_RACK',
    details: `Updated rack ${rack.rackCode}`,
    userId: user.id,
    metadata: { rackId, changes: data }
  })

  revalidatePath('/admin/racks')
  return rack
}

/**
 * Delete a rack (only if empty)
 */
export async function deleteRack(rackId: string) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'SUPERADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)) {
    throw new Error('Unauthorized - Admin only')
  }

  const rack = await prisma.rack.findUnique({
    where: { id: rackId },
    include: { _count: { select: { devices: true } } }
  })

  if (!rack) throw new Error('Rack not found')
  if (rack._count.devices > 0) {
    throw new Error('Cannot delete rack with devices. Please move devices first.')
  }

  await prisma.rack.delete({
    where: { id: rackId }
  })

  await logActivity({
    action: 'DELETED_RACK',
    details: `Deleted rack ${rack.rackCode}`,
    userId: user.id,
    metadata: { rackId, rackCode: rack.rackCode }
  })

  revalidatePath('/admin/racks')
}

/**
 * Assign device to a rack
 */
export async function assignDeviceToRack(deviceId: string, rackId: string | null) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { rack: true }
  })
  if (!device) throw new Error('Device not found')

  if (rackId) {
    const rack = await prisma.rack.findUnique({
      where: { id: rackId },
      include: { _count: { select: { devices: true } } }
    })

    if (!rack) throw new Error('Rack not found')
    if (!rack.isActive) throw new Error('Rack is not active')
    if (rack._count.devices >= rack.capacity) {
      throw new Error(`Rack ${rack.rackCode} is full (${rack.capacity}/${rack.capacity})`)
    }
  }

  const updatedDevice = await prisma.device.update({
    where: { id: deviceId },
    data: {
      rackId,
      location: rackId ? undefined : device.location // Clear location if removing from rack
    },
    include: { rack: true }
  })

  // Update location field with rack code for quick reference
  if (rackId && updatedDevice.rack) {
    await prisma.device.update({
      where: { id: deviceId },
      data: { location: updatedDevice.rack.rackCode }
    })
  }

  await logActivity({
    action: 'ASSIGNED_TO_RACK',
    details: rackId
      ? `Assigned device ${device.barcode} to rack ${updatedDevice.rack?.rackCode}`
      : `Removed device ${device.barcode} from rack ${device.rack?.rackCode}`,
    userId: user.id,
    metadata: { deviceId, rackId, previousRackId: device.rackId }
  })

  revalidatePath('/inventory')
  revalidatePath('/admin/racks')
  return updatedDevice
}

/**
 * Move device to appropriate rack based on status
 * This is called automatically when device status changes
 */
export async function autoAssignDeviceToRack(deviceId: string) {
  const device = await prisma.device.findUnique({
    where: { id: deviceId }
  })
  if (!device) return

  // Map device status to rack stage
  let targetStage: RackStage | null = null

  switch (device.status) {
    case DeviceStatus.RECEIVED:
    case DeviceStatus.PENDING_INSPECTION:
      targetStage = RackStage.RECEIVED
      break
    case DeviceStatus.WAITING_FOR_SPARES:
    case DeviceStatus.READY_FOR_REPAIR:
      targetStage = RackStage.WAITING_FOR_REPAIR
      break
    case DeviceStatus.UNDER_REPAIR:
    case DeviceStatus.IN_PAINT_SHOP:
      targetStage = RackStage.UNDER_REPAIR
      break
    case DeviceStatus.AWAITING_QC:
    case DeviceStatus.QC_FAILED_REWORK:
      targetStage = RackStage.AWAITING_QC
      break
    case DeviceStatus.READY_FOR_STOCK:
    case DeviceStatus.QC_PASSED:
      targetStage = RackStage.READY_FOR_DISPATCH
      break
    default:
      // Device is out of system (sold, rented, scrapped) - remove from rack
      if (device.rackId) {
        await prisma.device.update({
          where: { id: deviceId },
          data: { rackId: null }
        })
      }
      return
  }

  // Find an available rack for the target stage
  const availableRack = await prisma.rack.findFirst({
    where: {
      stage: targetStage,
      isActive: true
    },
    include: {
      _count: { select: { devices: true } }
    },
    orderBy: { rackCode: 'asc' }
  })

  // Find a rack that has space
  const racksWithSpace = await prisma.rack.findMany({
    where: {
      stage: targetStage,
      isActive: true
    },
    include: {
      _count: { select: { devices: true } }
    },
    orderBy: { rackCode: 'asc' }
  })

  const rackWithSpace = racksWithSpace.find(r => r._count.devices < r.capacity)

  if (rackWithSpace && device.rackId !== rackWithSpace.id) {
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        rackId: rackWithSpace.id,
        location: rackWithSpace.rackCode
      }
    })
  }
}

/**
 * Initialize default racks (5 per stage)
 */
export async function initializeDefaultRacks() {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    throw new Error('Unauthorized - Admin only')
  }

  const stages = Object.values(RackStage) as RackStage[]
  let createdCount = 0

  for (const stage of stages) {
    const existingCount = await prisma.rack.count({ where: { stage } })
    const toCreate = Math.max(0, 5 - existingCount)

    for (let i = 0; i < toCreate; i++) {
      const prefix = RACK_STAGE_PREFIX[stage]
      const number = existingCount + i + 1
      const rackCode = `${prefix}-${number.toString().padStart(3, '0')}`

      await prisma.rack.create({
        data: {
          rackCode,
          stage,
          capacity: 10
        }
      })
      createdCount++
    }
  }

  await logActivity({
    action: 'INITIALIZED_RACKS',
    details: `Initialized ${createdCount} default racks`,
    userId: user.id,
    metadata: { createdCount }
  })

  revalidatePath('/admin/racks')
  return { success: true, createdCount }
}

/**
 * Get rack overview stats
 */
export async function getRackStats() {
  const racks = await prisma.rack.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { devices: true } }
    }
  })

  const stats: Record<RackStage, { total: number; used: number; capacity: number }> = {
    RECEIVED: { total: 0, used: 0, capacity: 0 },
    WAITING_FOR_REPAIR: { total: 0, used: 0, capacity: 0 },
    UNDER_REPAIR: { total: 0, used: 0, capacity: 0 },
    AWAITING_QC: { total: 0, used: 0, capacity: 0 },
    READY_FOR_DISPATCH: { total: 0, used: 0, capacity: 0 }
  }

  for (const rack of racks) {
    stats[rack.stage].total++
    stats[rack.stage].used += rack._count.devices
    stats[rack.stage].capacity += rack.capacity
  }

  return stats
}
