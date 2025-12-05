import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearData() {
  console.log('Starting data deletion...')
  console.log('⚠️  USER ACCOUNTS WILL BE PRESERVED ⚠️')
  console.log('')

  try {
    // Delete in order to respect foreign key constraints

    console.log('Deleting ActivityLog...')
    const activityLogs = await prisma.activityLog.deleteMany({})
    console.log(`✓ Deleted ${activityLogs.count} activity logs`)

    console.log('Deleting StockMovement...')
    const stockMovements = await prisma.stockMovement.deleteMany({})
    console.log(`✓ Deleted ${stockMovements.count} stock movements`)

    console.log('Deleting OutwardRecord...')
    const outwardRecords = await prisma.outwardRecord.deleteMany({})
    console.log(`✓ Deleted ${outwardRecords.count} outward records`)

    console.log('Deleting QCRecord...')
    const qcRecords = await prisma.qCRecord.deleteMany({})
    console.log(`✓ Deleted ${qcRecords.count} QC records`)

    console.log('Deleting PaintPanel...')
    const paintPanels = await prisma.paintPanel.deleteMany({})
    console.log(`✓ Deleted ${paintPanels.count} paint panels`)

    console.log('Deleting RepairJob...')
    const repairJobs = await prisma.repairJob.deleteMany({})
    console.log(`✓ Deleted ${repairJobs.count} repair jobs`)

    console.log('Deleting Device...')
    const devices = await prisma.device.deleteMany({})
    console.log(`✓ Deleted ${devices.count} devices`)

    console.log('Deleting InwardBatch...')
    const inwardBatches = await prisma.inwardBatch.deleteMany({})
    console.log(`✓ Deleted ${inwardBatches.count} inward batches`)

    console.log('Deleting SparePart...')
    const spareParts = await prisma.sparePart.deleteMany({})
    console.log(`✓ Deleted ${spareParts.count} spare parts`)

    console.log('')
    console.log('✅ Data deletion completed successfully!')
    console.log('✓ User accounts have been preserved')

  } catch (error) {
    console.error('❌ Error during data deletion:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

clearData()
  .then(() => {
    console.log('')
    console.log('Script completed successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
