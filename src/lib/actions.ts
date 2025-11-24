'use server'

import { prisma } from './db'
import { InwardType, DeviceStatus, Role, Ownership, MovementType, Grade, QCStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'

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
  return batch
}

export async function addDeviceToBatch(batchId: string, data: {
  category: 'LAPTOP' | 'DESKTOP' | 'WORKSTATION'
  brand: string
  model: string
  config?: string
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

// --- Inspection Actions ---

export async function submitInspection(deviceId: string, data: {
  inspectionEngId: string
  reportedIssues: string
  cosmeticIssues: string
  paintRequired: boolean
  paintPanels: string[]
  sparesRequired: string
}) {
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: data.sparesRequired ? DeviceStatus.WAITING_FOR_SPARES : DeviceStatus.READY_FOR_REPAIR
    }
  })

  const count = await prisma.repairJob.count()
  const jobId = `JOB-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`

  const repairJob = await prisma.repairJob.create({
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

  if (data.paintRequired && data.paintPanels.length > 0) {
    await prisma.paintPanel.createMany({
      data: data.paintPanels.map(panel => ({
        deviceId,
        panelType: panel,
        status: 'AWAITING_PAINT'
      }))
    })
  }

  revalidatePath(`/inspection`)
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
        { repairEngId: userId },
        { status: 'READY_FOR_REPAIR', repairEngId: null }
      ]
    },
    include: {
      device: true
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
  await prisma.repairJob.update({
    where: { id: jobId },
    data: {
      status: 'AWAITING_QC',
      repairEndDate: new Date(),
      notes
    }
  })

  const job = await prisma.repairJob.findUnique({ where: { id: jobId } })
  if (job) {
    await prisma.device.update({
      where: { id: job.deviceId },
      data: { status: 'AWAITING_QC' }
    })
  }

  revalidatePath('/repair')
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

// --- Paint Actions ---

export async function getPaintPanels() {
  return await prisma.paintPanel.findMany({
    where: {
      status: { not: 'FITTED' }
    },
    include: {
      device: true
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function updatePanelStatus(panelId: string, status: 'IN_PAINT' | 'READY_FOR_COLLECTION' | 'FITTED') {
  await prisma.paintPanel.update({
    where: { id: panelId },
    data: { status }
  })
  revalidatePath('/paint')
}

// --- QC Actions ---

export async function submitQC(deviceId: string, data: {
  qcEngId: string
  checklistResults: string
  remarks: string
  finalGrade: 'A' | 'B' | null
  status: 'PASSED' | 'FAILED_REWORK'
}) {
  await prisma.qcRecord.create({
    data: {
      deviceId,
      qcEngId: data.qcEngId,
      checklistResults: data.checklistResults,
      remarks: data.remarks,
      finalGrade: data.finalGrade === 'A' ? Grade.A : Grade.B,
      status: data.status === 'PASSED' ? QCStatus.PASSED : QCStatus.FAILED_REWORK
    }
  })

  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: data.status === 'PASSED' ? DeviceStatus.READY_FOR_STOCK : DeviceStatus.QC_FAILED_REWORK,
      grade: data.status === 'PASSED' && data.finalGrade ? (data.finalGrade === 'A' ? Grade.A : Grade.B) : null
    }
  })

  if (data.status === 'FAILED_REWORK') {
    // Re-open repair job or create new? 
    // Requirement: "Device is sent back into the repair pipeline"
    // Let's find the last repair job and re-open it or set status to READY_FOR_REPAIR
    const lastJob = await prisma.repairJob.findFirst({
      where: { deviceId },
      orderBy: { createdAt: 'desc' }
    })

    if (lastJob) {
      await prisma.repairJob.update({
        where: { id: lastJob.id },
        data: { status: 'READY_FOR_REPAIR' }
      })
    }
  }

  revalidatePath('/qc')
}

// --- Warehouse Actions ---

export async function getInventory() {
  return await prisma.device.findMany({
    where: {
      status: 'READY_FOR_STOCK'
    },
    include: {
      inwardBatch: true
    },
    orderBy: { updatedAt: 'desc' }
  })
}
