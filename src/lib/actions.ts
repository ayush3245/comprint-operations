'use server'

import { prisma } from './db'
import { InwardType, DeviceStatus, Role, Ownership, MovementType, Grade, QCStatus, RepairStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { logActivity } from './activity'

// --- Inward Actions ---

export async function createInwardBatch(data: {
  type: InwardType
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

  const batch = await prisma.inwardBatch.create({
    data: {
      batchId,
      ...data,
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

export async function addDeviceToBatch(batchId: string, data: {
  category: 'LAPTOP' | 'DESKTOP' | 'WORKSTATION'
  brand: string
  model: string
  cpu?: string
  ram?: string
  ssd?: string
  gpu?: string
  screenSize?: string
  serial?: string
  ownership: Ownership
}) {
  const shortCat = data.category.substring(0, 1)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const barcode = `${shortCat}-${data.brand.substring(0, 3).toUpperCase()}-${random}`

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

  revalidatePath(`/inward/${batchId}`)
  return device
}

export async function bulkUploadDevices(batchId: string, devices: Array<{
  category: string
  brand: string
  model: string
  cpu?: string
  ram?: string
  ssd?: string
  gpu?: string
  screenSize?: string
  serial?: string
}>) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Get batch to determine ownership
  const batch = await prisma.inwardBatch.findUnique({
    where: { id: batchId }
  })
  if (!batch) throw new Error('Batch not found')

  const ownership = batch.type === 'REFURB_PURCHASE' ? Ownership.REFURB_STOCK : Ownership.RENTAL_RETURN

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string; data: any }>
  }

  for (let i = 0; i < devices.length; i++) {
    const deviceData = devices[i]
    try {
      // Validate category
      const category = deviceData.category.toUpperCase()
      if (!['LAPTOP', 'DESKTOP', 'WORKSTATION'].includes(category)) {
        throw new Error(`Invalid category: ${deviceData.category}`)
      }

      // Validate required fields
      if (!deviceData.brand || !deviceData.model) {
        throw new Error('Brand and Model are required')
      }

      await addDeviceToBatch(batchId, {
        category: category as 'LAPTOP' | 'DESKTOP' | 'WORKSTATION',
        brand: deviceData.brand.trim(),
        model: deviceData.model.trim(),
        cpu: deviceData.cpu?.trim(),
        ram: deviceData.ram?.trim(),
        ssd: deviceData.ssd?.trim(),
        gpu: deviceData.gpu?.trim(),
        screenSize: deviceData.screenSize?.trim(),
        serial: deviceData.serial?.trim(),
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
  let nextStatus: DeviceStatus
  if (repairRequired) {
    // If repair is needed, check if spares are required first
    nextStatus = data.sparesRequired ? DeviceStatus.WAITING_FOR_SPARES : DeviceStatus.READY_FOR_REPAIR
  } else if (paintRequired) {
    // If no repair but paint is needed, go to paint
    nextStatus = DeviceStatus.IN_PAINT_SHOP
  } else {
    // If neither repair nor paint needed, go directly to QC
    nextStatus = DeviceStatus.AWAITING_QC
  }

  // Update device with workflow flags and status
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: nextStatus,
      repairRequired,
      paintRequired,
      repairCompleted: !repairRequired, // If not required, mark as completed
      paintCompleted: !paintRequired    // If not required, mark as completed
    }
  })

  // Only create repair job if repair is actually needed
  let repairJob = null
  if (repairRequired) {
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
        status: data.sparesRequired ? 'WAITING_FOR_SPARES' : 'READY_FOR_REPAIR'
      }
    })
  }

  // Create paint panels if painting is required
  if (paintRequired) {
    await prisma.paintPanel.createMany({
      data: data.paintPanels.map(panel => ({
        deviceId,
        panelType: panel,
        status: 'AWAITING_PAINT'
      }))
    })
  }

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

export async function issueSpares(jobId: string, sparesIssued: string) {
  await prisma.repairJob.update({
    where: { id: jobId },
    data: {
      sparesIssued,
      status: 'READY_FOR_REPAIR'
    }
  })

  const job = await prisma.repairJob.findUnique({ where: { id: jobId } })
  if (job) {
    await prisma.device.update({
      where: { id: job.deviceId },
      data: { status: 'READY_FOR_REPAIR' }
    })
  }

  revalidatePath('/spares')
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

  // Determine next status based on paint requirement
  const device = job.device
  let nextDeviceStatus: DeviceStatus
  let nextJobStatus: string

  if (device.paintRequired && !device.paintCompleted) {
    // Paint is required and not yet completed, send to paint shop
    nextDeviceStatus = DeviceStatus.IN_PAINT_SHOP
    nextJobStatus = 'IN_PAINT_SHOP'
  } else {
    // Paint not required or already completed, go to QC
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
    data: { status: nextDeviceStatus }
  })

  revalidatePath('/repair')

  const user = await getCurrentUser()
  if (user) {
    const destination = nextDeviceStatus === DeviceStatus.IN_PAINT_SHOP ? 'paint shop' : 'QC'
    await logActivity({
      action: 'COMPLETED_REPAIR',
      details: `Completed repair, sent to ${destination}`,
      userId: user.id,
      metadata: { jobId, nextStatus: nextDeviceStatus }
    })
  }
}

export async function sendToPaint(jobId: string) {
  await prisma.repairJob.update({
    where: { id: jobId },
    data: { status: 'IN_PAINT_SHOP' }
  })

  const job = await prisma.repairJob.findUnique({ where: { id: jobId } })
  if (job) {
    await prisma.device.update({
      where: { id: job.deviceId },
      data: { status: 'IN_PAINT_SHOP' }
    })
  }

  revalidatePath('/repair')
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

// --- Paint Actions ---

export async function getPaintPanels() {
  const panels = await prisma.paintPanel.findMany({
    where: {
      status: { in: ['AWAITING_PAINT', 'IN_PAINT'] }
    },
    include: {
      device: true
    },
    orderBy: { createdAt: 'asc' }
  })

  // Filter out panels where device requires repair but repair is not yet completed
  return panels.filter(panel => {
    const device = panel.device
    // Only show in paint shop if:
    // 1. Repair is NOT required, OR
    // 2. Repair IS required AND repair is completed
    return !device.repairRequired || device.repairCompleted
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
