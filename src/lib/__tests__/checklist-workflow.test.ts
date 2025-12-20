import { describe, it, expect } from 'vitest'
import { getChecklistForCategory, getChecklistItemCount } from '../checklist-definitions'

/**
 * Checklist-Based Workflow Tests
 *
 * Tests for the new workflow restructuring implementation:
 * - Category-specific inspection checklists
 * - L2 Engineer coordination logic
 * - Parallel work validation
 * - Workflow routing with new checklist system
 */

// Type definitions matching Prisma enums
type DeviceCategory = 'LAPTOP' | 'DESKTOP' | 'WORKSTATION' | 'SERVER' | 'MONITOR' | 'STORAGE' | 'NETWORKING_CARD'
type DeviceStatus = 'RECEIVED' | 'WAITING_FOR_SPARES' | 'READY_FOR_REPAIR' | 'UNDER_REPAIR' | 'AWAITING_QC' | 'READY_FOR_STOCK'
type ChecklistStatus = 'PENDING' | 'PASS' | 'FAIL' | 'NOT_APPLICABLE'
type ParallelWorkStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type L3IssueType = 'MOTHERBOARD' | 'DOMAIN_LOCK' | 'BIOS_LOCK' | 'POWER_ON_ISSUE'

interface ChecklistItemResult {
  itemIndex: number
  itemText: string
  status: ChecklistStatus
  notes?: string
}

// Pure logic functions for testing (extracted from actions.ts)

/**
 * Determine device status after checklist-based inspection
 */
function determineNextStatusAfterChecklistInspection(data: {
  checklistItems: ChecklistItemResult[]
  sparesRequired: string
}): DeviceStatus {
  const hasFailedItems = data.checklistItems.some(item => item.status === 'FAIL')
  const repairRequired = hasFailedItems || Boolean(data.sparesRequired)

  if (repairRequired) {
    return data.sparesRequired ? 'WAITING_FOR_SPARES' : 'READY_FOR_REPAIR'
  } else {
    // If all pass and no spares, go directly to QC
    return 'AWAITING_QC'
  }
}

/**
 * Validate if L2 can send device to QC (all parallel work complete)
 */
function canSendToQC(device: {
  displayRepairRequired: boolean
  displayRepairCompleted: boolean
  batteryBoostRequired: boolean
  batteryBoostCompleted: boolean
  l3RepairRequired: boolean
  l3RepairCompleted: boolean
  paintRequired: boolean
  paintCompleted: boolean
}): { canSend: boolean; errors: string[] } {
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
  if (device.paintRequired && !device.paintCompleted) {
    errors.push('Paint work not completed')
  }

  return {
    canSend: errors.length === 0,
    errors
  }
}

/**
 * Check if device is ready for L2 to claim
 */
function isDeviceClaimable(device: {
  status: DeviceStatus
  hasRepairJob: boolean
  repairJobHasL2Engineer: boolean
}): { claimable: boolean; reason?: string } {
  if (!device.hasRepairJob) {
    return { claimable: false, reason: 'No repair job found for this device' }
  }

  if (device.repairJobHasL2Engineer) {
    return { claimable: false, reason: 'Device already assigned to another L2 Engineer' }
  }

  if (device.status !== 'READY_FOR_REPAIR' && device.status !== 'WAITING_FOR_SPARES') {
    return { claimable: false, reason: 'Device is not ready to be claimed for repair' }
  }

  return { claimable: true }
}

/**
 * Validate parallel work job status transitions
 */
function canStartParallelWork(currentStatus: ParallelWorkStatus): boolean {
  return currentStatus === 'PENDING'
}

function canCompleteParallelWork(currentStatus: ParallelWorkStatus): boolean {
  return currentStatus === 'IN_PROGRESS'
}

/**
 * Count checklist results by status
 */
function countChecklistStatuses(items: ChecklistItemResult[]): {
  pass: number
  fail: number
  notApplicable: number
  pending: number
} {
  return {
    pass: items.filter(i => i.status === 'PASS').length,
    fail: items.filter(i => i.status === 'FAIL').length,
    notApplicable: items.filter(i => i.status === 'NOT_APPLICABLE').length,
    pending: items.filter(i => i.status === 'PENDING').length
  }
}

describe('Checklist Definitions', () => {
  describe('getChecklistForCategory', () => {
    it('should return 20 items for LAPTOP category', () => {
      const checklist = getChecklistForCategory('LAPTOP')
      expect(checklist).toHaveLength(20)
    })

    it('should return 20 items for DESKTOP category', () => {
      const checklist = getChecklistForCategory('DESKTOP')
      expect(checklist).toHaveLength(20)
    })

    it('should return 20 items for WORKSTATION category', () => {
      const checklist = getChecklistForCategory('WORKSTATION')
      expect(checklist).toHaveLength(20)
    })

    it('should return 20 items for SERVER category', () => {
      const checklist = getChecklistForCategory('SERVER')
      expect(checklist).toHaveLength(20)
    })

    it('should return 20 items for MONITOR category', () => {
      const checklist = getChecklistForCategory('MONITOR')
      expect(checklist).toHaveLength(20)
    })

    it('should return 20 items for STORAGE category', () => {
      const checklist = getChecklistForCategory('STORAGE')
      expect(checklist).toHaveLength(20)
    })

    it('should return 20 items for NETWORKING_CARD category', () => {
      const checklist = getChecklistForCategory('NETWORKING_CARD')
      expect(checklist).toHaveLength(20)
    })

    it('should have sequential indices starting from 1', () => {
      const checklist = getChecklistForCategory('LAPTOP')
      checklist.forEach((item, idx) => {
        expect(item.index).toBe(idx + 1)
      })
    })

    it('should have non-empty text for all items', () => {
      const categories: DeviceCategory[] = ['LAPTOP', 'DESKTOP', 'WORKSTATION', 'SERVER', 'MONITOR', 'STORAGE', 'NETWORKING_CARD']

      categories.forEach(category => {
        const checklist = getChecklistForCategory(category)
        checklist.forEach(item => {
          expect(item.text).toBeTruthy()
          expect(item.text.length).toBeGreaterThan(0)
        })
      })
    })

    it('should have unique item texts within a category', () => {
      const checklist = getChecklistForCategory('LAPTOP')
      const texts = checklist.map(item => item.text)
      const uniqueTexts = new Set(texts)
      expect(uniqueTexts.size).toBe(texts.length)
    })
  })

  describe('getChecklistItemCount', () => {
    it('should return correct count for all categories', () => {
      const categories: DeviceCategory[] = ['LAPTOP', 'DESKTOP', 'WORKSTATION', 'SERVER', 'MONITOR', 'STORAGE', 'NETWORKING_CARD']

      categories.forEach(category => {
        expect(getChecklistItemCount(category)).toBe(20)
      })
    })
  })

  describe('Category-Specific Checklist Content', () => {
    it('LAPTOP should include battery health check', () => {
      const checklist = getChecklistForCategory('LAPTOP')
      const hasBatteryCheck = checklist.some(item =>
        item.text.toLowerCase().includes('battery')
      )
      expect(hasBatteryCheck).toBe(true)
    })

    it('LAPTOP should include screen/display checks', () => {
      const checklist = getChecklistForCategory('LAPTOP')
      const hasScreenCheck = checklist.some(item =>
        item.text.toLowerCase().includes('lcd') ||
        item.text.toLowerCase().includes('screen') ||
        item.text.toLowerCase().includes('pixel')
      )
      expect(hasScreenCheck).toBe(true)
    })

    it('SERVER should include RAID controller check', () => {
      const checklist = getChecklistForCategory('SERVER')
      const hasRaidCheck = checklist.some(item =>
        item.text.toLowerCase().includes('raid')
      )
      expect(hasRaidCheck).toBe(true)
    })

    it('MONITOR should include dead pixel test', () => {
      const checklist = getChecklistForCategory('MONITOR')
      const hasPixelTest = checklist.some(item =>
        item.text.toLowerCase().includes('dead pixel') ||
        item.text.toLowerCase().includes('stuck pixel')
      )
      expect(hasPixelTest).toBe(true)
    })

    it('STORAGE should include SMART status check', () => {
      const checklist = getChecklistForCategory('STORAGE')
      const hasSmartCheck = checklist.some(item =>
        item.text.toLowerCase().includes('smart')
      )
      expect(hasSmartCheck).toBe(true)
    })

    it('NETWORKING_CARD should include throughput test', () => {
      const checklist = getChecklistForCategory('NETWORKING_CARD')
      const hasThroughputTest = checklist.some(item =>
        item.text.toLowerCase().includes('throughput')
      )
      expect(hasThroughputTest).toBe(true)
    })
  })
})

describe('Checklist-Based Inspection Logic', () => {
  describe('determineNextStatusAfterChecklistInspection', () => {
    it('should route to READY_FOR_REPAIR when items fail and no spares needed', () => {
      const result = determineNextStatusAfterChecklistInspection({
        checklistItems: [
          { itemIndex: 1, itemText: 'Screen check', status: 'PASS' },
          { itemIndex: 2, itemText: 'Keyboard check', status: 'FAIL' },
          { itemIndex: 3, itemText: 'Battery check', status: 'PASS' }
        ],
        sparesRequired: ''
      })
      expect(result).toBe('READY_FOR_REPAIR')
    })

    it('should route to WAITING_FOR_SPARES when items fail and spares needed', () => {
      const result = determineNextStatusAfterChecklistInspection({
        checklistItems: [
          { itemIndex: 1, itemText: 'Screen check', status: 'FAIL' },
          { itemIndex: 2, itemText: 'Keyboard check', status: 'PASS' }
        ],
        sparesRequired: 'LCD-001, KB-002'
      })
      expect(result).toBe('WAITING_FOR_SPARES')
    })

    it('should route to AWAITING_QC when all items pass', () => {
      const result = determineNextStatusAfterChecklistInspection({
        checklistItems: [
          { itemIndex: 1, itemText: 'Screen check', status: 'PASS' },
          { itemIndex: 2, itemText: 'Keyboard check', status: 'PASS' },
          { itemIndex: 3, itemText: 'Battery check', status: 'PASS' }
        ],
        sparesRequired: ''
      })
      expect(result).toBe('AWAITING_QC')
    })

    it('should route to AWAITING_QC when items are NOT_APPLICABLE', () => {
      const result = determineNextStatusAfterChecklistInspection({
        checklistItems: [
          { itemIndex: 1, itemText: 'Screen check', status: 'PASS' },
          { itemIndex: 2, itemText: 'GPU check', status: 'NOT_APPLICABLE' },
          { itemIndex: 3, itemText: 'Battery check', status: 'PASS' }
        ],
        sparesRequired: ''
      })
      expect(result).toBe('AWAITING_QC')
    })

    it('should route to WAITING_FOR_SPARES even if all items pass but spares needed', () => {
      const result = determineNextStatusAfterChecklistInspection({
        checklistItems: [
          { itemIndex: 1, itemText: 'Screen check', status: 'PASS' },
          { itemIndex: 2, itemText: 'Keyboard check', status: 'PASS' }
        ],
        sparesRequired: 'RAM-001' // Upgrade scenario
      })
      expect(result).toBe('WAITING_FOR_SPARES')
    })
  })

  describe('countChecklistStatuses', () => {
    it('should correctly count all status types', () => {
      const items: ChecklistItemResult[] = [
        { itemIndex: 1, itemText: 'Test 1', status: 'PASS' },
        { itemIndex: 2, itemText: 'Test 2', status: 'PASS' },
        { itemIndex: 3, itemText: 'Test 3', status: 'FAIL' },
        { itemIndex: 4, itemText: 'Test 4', status: 'NOT_APPLICABLE' },
        { itemIndex: 5, itemText: 'Test 5', status: 'PENDING' }
      ]

      const counts = countChecklistStatuses(items)

      expect(counts.pass).toBe(2)
      expect(counts.fail).toBe(1)
      expect(counts.notApplicable).toBe(1)
      expect(counts.pending).toBe(1)
    })

    it('should handle all same status', () => {
      const items: ChecklistItemResult[] = [
        { itemIndex: 1, itemText: 'Test 1', status: 'PASS' },
        { itemIndex: 2, itemText: 'Test 2', status: 'PASS' },
        { itemIndex: 3, itemText: 'Test 3', status: 'PASS' }
      ]

      const counts = countChecklistStatuses(items)

      expect(counts.pass).toBe(3)
      expect(counts.fail).toBe(0)
      expect(counts.notApplicable).toBe(0)
      expect(counts.pending).toBe(0)
    })

    it('should handle empty checklist', () => {
      const counts = countChecklistStatuses([])

      expect(counts.pass).toBe(0)
      expect(counts.fail).toBe(0)
      expect(counts.notApplicable).toBe(0)
      expect(counts.pending).toBe(0)
    })
  })
})

describe('L2 Engineer Workflow Logic', () => {
  describe('isDeviceClaimable', () => {
    it('should allow claiming device in READY_FOR_REPAIR status', () => {
      const result = isDeviceClaimable({
        status: 'READY_FOR_REPAIR',
        hasRepairJob: true,
        repairJobHasL2Engineer: false
      })

      expect(result.claimable).toBe(true)
    })

    it('should allow claiming device in WAITING_FOR_SPARES status', () => {
      const result = isDeviceClaimable({
        status: 'WAITING_FOR_SPARES',
        hasRepairJob: true,
        repairJobHasL2Engineer: false
      })

      expect(result.claimable).toBe(true)
    })

    it('should block claiming if no repair job exists', () => {
      const result = isDeviceClaimable({
        status: 'READY_FOR_REPAIR',
        hasRepairJob: false,
        repairJobHasL2Engineer: false
      })

      expect(result.claimable).toBe(false)
      expect(result.reason).toContain('No repair job')
    })

    it('should block claiming if already assigned to L2', () => {
      const result = isDeviceClaimable({
        status: 'READY_FOR_REPAIR',
        hasRepairJob: true,
        repairJobHasL2Engineer: true
      })

      expect(result.claimable).toBe(false)
      expect(result.reason).toContain('already assigned')
    })

    it('should block claiming for devices not ready for repair', () => {
      const invalidStatuses: DeviceStatus[] = ['RECEIVED', 'UNDER_REPAIR', 'AWAITING_QC', 'READY_FOR_STOCK']

      invalidStatuses.forEach(status => {
        const result = isDeviceClaimable({
          status,
          hasRepairJob: true,
          repairJobHasL2Engineer: false
        })

        expect(result.claimable).toBe(false)
        expect(result.reason).toContain('not ready')
      })
    })
  })

  describe('canSendToQC', () => {
    it('should allow sending to QC when no parallel work required', () => {
      const result = canSendToQC({
        displayRepairRequired: false,
        displayRepairCompleted: false,
        batteryBoostRequired: false,
        batteryBoostCompleted: false,
        l3RepairRequired: false,
        l3RepairCompleted: false,
        paintRequired: false,
        paintCompleted: false
      })

      expect(result.canSend).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow sending to QC when all parallel work completed', () => {
      const result = canSendToQC({
        displayRepairRequired: true,
        displayRepairCompleted: true,
        batteryBoostRequired: true,
        batteryBoostCompleted: true,
        l3RepairRequired: true,
        l3RepairCompleted: true,
        paintRequired: true,
        paintCompleted: true
      })

      expect(result.canSend).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should block if display repair not completed', () => {
      const result = canSendToQC({
        displayRepairRequired: true,
        displayRepairCompleted: false,
        batteryBoostRequired: false,
        batteryBoostCompleted: false,
        l3RepairRequired: false,
        l3RepairCompleted: false,
        paintRequired: false,
        paintCompleted: false
      })

      expect(result.canSend).toBe(false)
      expect(result.errors).toContain('Display repair not completed')
    })

    it('should block if battery boost not completed', () => {
      const result = canSendToQC({
        displayRepairRequired: false,
        displayRepairCompleted: false,
        batteryBoostRequired: true,
        batteryBoostCompleted: false,
        l3RepairRequired: false,
        l3RepairCompleted: false,
        paintRequired: false,
        paintCompleted: false
      })

      expect(result.canSend).toBe(false)
      expect(result.errors).toContain('Battery boost not completed')
    })

    it('should block if L3 repair not completed', () => {
      const result = canSendToQC({
        displayRepairRequired: false,
        displayRepairCompleted: false,
        batteryBoostRequired: false,
        batteryBoostCompleted: false,
        l3RepairRequired: true,
        l3RepairCompleted: false,
        paintRequired: false,
        paintCompleted: false
      })

      expect(result.canSend).toBe(false)
      expect(result.errors).toContain('L3 repair not completed')
    })

    it('should block if paint not completed', () => {
      const result = canSendToQC({
        displayRepairRequired: false,
        displayRepairCompleted: false,
        batteryBoostRequired: false,
        batteryBoostCompleted: false,
        l3RepairRequired: false,
        l3RepairCompleted: false,
        paintRequired: true,
        paintCompleted: false
      })

      expect(result.canSend).toBe(false)
      expect(result.errors).toContain('Paint work not completed')
    })

    it('should return multiple errors when multiple works incomplete', () => {
      const result = canSendToQC({
        displayRepairRequired: true,
        displayRepairCompleted: false,
        batteryBoostRequired: true,
        batteryBoostCompleted: false,
        l3RepairRequired: true,
        l3RepairCompleted: false,
        paintRequired: true,
        paintCompleted: false
      })

      expect(result.canSend).toBe(false)
      expect(result.errors).toHaveLength(4)
      expect(result.errors).toContain('Display repair not completed')
      expect(result.errors).toContain('Battery boost not completed')
      expect(result.errors).toContain('L3 repair not completed')
      expect(result.errors).toContain('Paint work not completed')
    })
  })
})

describe('Parallel Work Status Transitions', () => {
  describe('canStartParallelWork', () => {
    it('should allow starting work from PENDING status', () => {
      expect(canStartParallelWork('PENDING')).toBe(true)
    })

    it('should not allow starting work from IN_PROGRESS status', () => {
      expect(canStartParallelWork('IN_PROGRESS')).toBe(false)
    })

    it('should not allow starting work from COMPLETED status', () => {
      expect(canStartParallelWork('COMPLETED')).toBe(false)
    })

    it('should not allow starting work from CANCELLED status', () => {
      expect(canStartParallelWork('CANCELLED')).toBe(false)
    })
  })

  describe('canCompleteParallelWork', () => {
    it('should allow completing work from IN_PROGRESS status', () => {
      expect(canCompleteParallelWork('IN_PROGRESS')).toBe(true)
    })

    it('should not allow completing work from PENDING status', () => {
      expect(canCompleteParallelWork('PENDING')).toBe(false)
    })

    it('should not allow completing work from COMPLETED status', () => {
      expect(canCompleteParallelWork('COMPLETED')).toBe(false)
    })

    it('should not allow completing work from CANCELLED status', () => {
      expect(canCompleteParallelWork('CANCELLED')).toBe(false)
    })
  })
})

describe('L3 Issue Types', () => {
  const validIssueTypes: L3IssueType[] = ['MOTHERBOARD', 'DOMAIN_LOCK', 'BIOS_LOCK', 'POWER_ON_ISSUE']

  it('should have exactly 4 L3 issue types', () => {
    expect(validIssueTypes).toHaveLength(4)
  })

  it('should validate all L3 issue types are defined', () => {
    validIssueTypes.forEach(issueType => {
      expect(typeof issueType).toBe('string')
      expect(issueType.length).toBeGreaterThan(0)
    })
  })

  it('should represent major repair issues only', () => {
    // L3 issues should be critical/complex repairs
    const criticalIssues = ['MOTHERBOARD', 'DOMAIN_LOCK', 'BIOS_LOCK', 'POWER_ON_ISSUE']
    expect(validIssueTypes).toEqual(criticalIssues)
  })
})

describe('Workflow Integration Scenarios', () => {
  describe('Complete L2 Workflow with Parallel Work', () => {
    it('should handle device with all parallel work types', () => {
      // Initial state after inspection
      const device = {
        displayRepairRequired: false,
        displayRepairCompleted: false,
        batteryBoostRequired: false,
        batteryBoostCompleted: false,
        l3RepairRequired: false,
        l3RepairCompleted: false,
        paintRequired: false,
        paintCompleted: false
      }

      // L2 identifies needs during inspection
      device.displayRepairRequired = true
      device.batteryBoostRequired = true
      device.l3RepairRequired = true
      device.paintRequired = true

      // Check cannot send to QC yet
      let qcCheck = canSendToQC(device)
      expect(qcCheck.canSend).toBe(false)
      expect(qcCheck.errors).toHaveLength(4)

      // Complete display repair
      device.displayRepairCompleted = true
      qcCheck = canSendToQC(device)
      expect(qcCheck.canSend).toBe(false)
      expect(qcCheck.errors).toHaveLength(3)

      // Complete battery boost
      device.batteryBoostCompleted = true
      qcCheck = canSendToQC(device)
      expect(qcCheck.canSend).toBe(false)
      expect(qcCheck.errors).toHaveLength(2)

      // Complete L3 repair
      device.l3RepairCompleted = true
      qcCheck = canSendToQC(device)
      expect(qcCheck.canSend).toBe(false)
      expect(qcCheck.errors).toHaveLength(1)

      // Complete paint
      device.paintCompleted = true
      qcCheck = canSendToQC(device)
      expect(qcCheck.canSend).toBe(true)
      expect(qcCheck.errors).toHaveLength(0)
    })

    it('should handle device with no parallel work needed', () => {
      const device = {
        displayRepairRequired: false,
        displayRepairCompleted: false,
        batteryBoostRequired: false,
        batteryBoostCompleted: false,
        l3RepairRequired: false,
        l3RepairCompleted: false,
        paintRequired: false,
        paintCompleted: false
      }

      const qcCheck = canSendToQC(device)
      expect(qcCheck.canSend).toBe(true)
      expect(qcCheck.errors).toHaveLength(0)
    })

    it('should handle device with only display repair needed', () => {
      const device = {
        displayRepairRequired: true,
        displayRepairCompleted: false,
        batteryBoostRequired: false,
        batteryBoostCompleted: false,
        l3RepairRequired: false,
        l3RepairCompleted: false,
        paintRequired: false,
        paintCompleted: false
      }

      // Before completion
      let qcCheck = canSendToQC(device)
      expect(qcCheck.canSend).toBe(false)
      expect(qcCheck.errors).toEqual(['Display repair not completed'])

      // After completion
      device.displayRepairCompleted = true
      qcCheck = canSendToQC(device)
      expect(qcCheck.canSend).toBe(true)
      expect(qcCheck.errors).toHaveLength(0)
    })
  })

  describe('Checklist-Based Inspection Routing', () => {
    it('should route laptop with battery failure to repair', () => {
      const laptopChecklist: ChecklistItemResult[] = [
        { itemIndex: 1, itemText: 'LCD screen check', status: 'PASS' },
        { itemIndex: 2, itemText: 'Dead pixel test', status: 'PASS' },
        { itemIndex: 3, itemText: 'Keyboard test', status: 'PASS' },
        { itemIndex: 8, itemText: 'Battery health check', status: 'FAIL', notes: '45% capacity' }
      ]

      const result = determineNextStatusAfterChecklistInspection({
        checklistItems: laptopChecklist,
        sparesRequired: ''
      })

      expect(result).toBe('READY_FOR_REPAIR')
    })

    it('should route monitor with dead pixels to repair', () => {
      const monitorChecklist: ChecklistItemResult[] = [
        { itemIndex: 1, itemText: 'Screen physical check', status: 'PASS' },
        { itemIndex: 2, itemText: 'Dead pixel test', status: 'FAIL', notes: '3 dead pixels found' },
        { itemIndex: 3, itemText: 'Backlight bleeding', status: 'PASS' }
      ]

      const result = determineNextStatusAfterChecklistInspection({
        checklistItems: monitorChecklist,
        sparesRequired: 'LCD-PANEL-001'
      })

      expect(result).toBe('WAITING_FOR_SPARES')
    })

    it('should route perfect condition device directly to QC', () => {
      const perfectChecklist: ChecklistItemResult[] = [
        { itemIndex: 1, itemText: 'Test 1', status: 'PASS' },
        { itemIndex: 2, itemText: 'Test 2', status: 'PASS' },
        { itemIndex: 3, itemText: 'Test 3', status: 'PASS' },
        { itemIndex: 4, itemText: 'Test 4', status: 'PASS' }
      ]

      const result = determineNextStatusAfterChecklistInspection({
        checklistItems: perfectChecklist,
        sparesRequired: ''
      })

      expect(result).toBe('AWAITING_QC')
    })
  })
})
