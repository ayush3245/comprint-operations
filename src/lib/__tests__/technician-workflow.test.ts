import { describe, it, expect } from 'vitest'

/**
 * Technician Workflow Tests
 *
 * Tests for the parallel work technician pages:
 * - L3 Engineer repair queue (L3RepairJob)
 * - Display Technician queue (DisplayRepairJob)
 * - Battery Technician queue (BatteryBoostJob)
 *
 * These tests validate the state transitions, job filtering,
 * and error handling for specialized technician workflows.
 */

// Type definitions matching Prisma enums
type ParallelWorkStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type L3IssueType = 'MOTHERBOARD' | 'DOMAIN_LOCK' | 'BIOS_LOCK' | 'POWER_ON_ISSUE'

interface L3RepairJob {
  id: string
  deviceId: string
  issueType: L3IssueType
  description: string | null
  status: ParallelWorkStatus
  assignedToId: string | null
  startedAt: Date | null
  completedAt: Date | null
  resolution: string | null
  notes: string | null
}

interface DisplayRepairJob {
  id: string
  deviceId: string
  reportedIssues: string | null
  status: ParallelWorkStatus
  assignedToId: string | null
  startedAt: Date | null
  completedAt: Date | null
  notes: string | null
  completedByL2: boolean
}

interface BatteryBoostJob {
  id: string
  deviceId: string
  initialCapacity: string | null
  targetCapacity: string | null
  finalCapacity: string | null
  status: ParallelWorkStatus
  assignedToId: string | null
  startedAt: Date | null
  completedAt: Date | null
  notes: string | null
  completedByL2: boolean
}

// Pure logic functions extracted from actions.ts for testing

/**
 * Validate if L3 repair job can be started
 */
function canStartL3Repair(job: {
  status: ParallelWorkStatus
  assignedToId: string | null
}): { canStart: boolean; error?: string } {
  if (job.status !== 'PENDING') {
    return { canStart: false, error: 'Job is not in pending status' }
  }
  return { canStart: true }
}

/**
 * Validate if L3 repair job can be completed
 */
function canCompleteL3Repair(job: {
  status: ParallelWorkStatus
  assignedToId: string | null
}, technicianId: string): { canComplete: boolean; error?: string } {
  if (job.status !== 'IN_PROGRESS') {
    return { canComplete: false, error: 'Job is not in progress' }
  }
  if (job.assignedToId && job.assignedToId !== technicianId) {
    return { canComplete: false, error: 'Job is assigned to another technician' }
  }
  return { canComplete: true }
}

/**
 * Validate if display repair job can be started
 */
function canStartDisplayRepair(job: {
  status: ParallelWorkStatus
  assignedToId: string | null
}): { canStart: boolean; error?: string } {
  if (job.status !== 'PENDING') {
    return { canStart: false, error: 'Job is not in pending status' }
  }
  return { canStart: true }
}

/**
 * Validate if display repair job can be completed
 */
function canCompleteDisplayRepair(job: {
  status: ParallelWorkStatus
  assignedToId: string | null
}, technicianId: string): { canComplete: boolean; error?: string } {
  if (job.status !== 'IN_PROGRESS') {
    return { canComplete: false, error: 'Job is not in progress' }
  }
  if (job.assignedToId && job.assignedToId !== technicianId) {
    return { canComplete: false, error: 'Job is assigned to another technician' }
  }
  return { canComplete: true }
}

/**
 * Validate if battery boost job can be started
 */
function canStartBatteryBoost(job: {
  status: ParallelWorkStatus
  assignedToId: string | null
}): { canStart: boolean; error?: string } {
  if (job.status !== 'PENDING') {
    return { canStart: false, error: 'Job is not in pending status' }
  }
  return { canStart: true }
}

/**
 * Validate if battery boost job can be completed
 */
function canCompleteBatteryBoost(job: {
  status: ParallelWorkStatus
  assignedToId: string | null
}, technicianId: string): { canComplete: boolean; error?: string } {
  if (job.status !== 'IN_PROGRESS') {
    return { canComplete: false, error: 'Job is not in progress' }
  }
  if (job.assignedToId && job.assignedToId !== technicianId) {
    return { canComplete: false, error: 'Job is assigned to another technician' }
  }
  return { canComplete: true }
}

/**
 * Filter jobs by technician ID
 */
function filterJobsByTechnician<T extends { assignedToId: string | null; status: ParallelWorkStatus }>(
  jobs: T[],
  technicianId: string
): { myJobs: T[]; pendingJobs: T[]; othersJobs: T[] } {
  return {
    myJobs: jobs.filter(j => j.assignedToId === technicianId && j.status === 'IN_PROGRESS'),
    pendingJobs: jobs.filter(j => j.status === 'PENDING'),
    othersJobs: jobs.filter(j => j.assignedToId !== technicianId && j.status === 'IN_PROGRESS')
  }
}

/**
 * Validate battery capacity format
 */
function isValidBatteryCapacity(capacity: string): boolean {
  // Should be in format like "85%" or "70"
  const match = capacity.match(/^(\d+)%?$/)
  if (!match) return false

  const value = parseInt(match[1])
  return value >= 0 && value <= 100
}

/**
 * Check if battery capacity meets target
 */
function doesBatteryMeetTarget(finalCapacity: string, targetCapacity: string): boolean {
  const final = parseInt(finalCapacity.replace('%', ''))
  const target = parseInt(targetCapacity.replace('%', ''))

  if (isNaN(final) || isNaN(target)) return false

  return final >= target
}

describe('L3 Repair Job Workflow', () => {
  describe('Job State Transitions', () => {
    it('should allow starting a PENDING L3 repair job', () => {
      const job = {
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canStartL3Repair(job)
      expect(result.canStart).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should prevent starting an IN_PROGRESS L3 repair job', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canStartL3Repair(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should prevent starting a COMPLETED L3 repair job', () => {
      const job = {
        status: 'COMPLETED' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canStartL3Repair(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should prevent starting a CANCELLED L3 repair job', () => {
      const job = {
        status: 'CANCELLED' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canStartL3Repair(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should allow completing an IN_PROGRESS L3 repair job by assigned technician', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canCompleteL3Repair(job, 'tech-001')
      expect(result.canComplete).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should prevent completing a PENDING L3 repair job', () => {
      const job = {
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canCompleteL3Repair(job, 'tech-001')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is not in progress')
    })

    it('should prevent completing a COMPLETED L3 repair job', () => {
      const job = {
        status: 'COMPLETED' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canCompleteL3Repair(job, 'tech-001')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is not in progress')
    })

    it('should prevent completing job assigned to another technician', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canCompleteL3Repair(job, 'tech-002')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is assigned to another technician')
    })
  })

  describe('L3 Issue Types', () => {
    const validIssueTypes: L3IssueType[] = ['MOTHERBOARD', 'DOMAIN_LOCK', 'BIOS_LOCK', 'POWER_ON_ISSUE']

    it('should have exactly 4 L3 issue types', () => {
      expect(validIssueTypes).toHaveLength(4)
    })

    it('should validate all issue types are major repairs', () => {
      // L3 issues are complex/critical repairs requiring specialized skills
      expect(validIssueTypes).toContain('MOTHERBOARD')
      expect(validIssueTypes).toContain('DOMAIN_LOCK')
      expect(validIssueTypes).toContain('BIOS_LOCK')
      expect(validIssueTypes).toContain('POWER_ON_ISSUE')
    })
  })

  describe('Job Filtering', () => {
    it('should filter L3 jobs by technician ID', () => {
      const jobs: Array<{ id: string; assignedToId: string | null; status: ParallelWorkStatus }> = [
        { id: 'job-1', assignedToId: 'tech-001', status: 'IN_PROGRESS' },
        { id: 'job-2', assignedToId: 'tech-002', status: 'IN_PROGRESS' },
        { id: 'job-3', assignedToId: null, status: 'PENDING' },
        { id: 'job-4', assignedToId: null, status: 'PENDING' },
        { id: 'job-5', assignedToId: 'tech-001', status: 'COMPLETED' }
      ]

      const filtered = filterJobsByTechnician(jobs, 'tech-001')

      expect(filtered.myJobs).toHaveLength(1)
      expect(filtered.myJobs[0].id).toBe('job-1')

      expect(filtered.pendingJobs).toHaveLength(2)
      expect(filtered.pendingJobs.map(j => j.id)).toEqual(['job-3', 'job-4'])

      expect(filtered.othersJobs).toHaveLength(1)
      expect(filtered.othersJobs[0].id).toBe('job-2')
    })

    it('should return empty arrays when no jobs match', () => {
      const jobs: Array<{ id: string; assignedToId: string | null; status: ParallelWorkStatus }> = []

      const filtered = filterJobsByTechnician(jobs, 'tech-001')

      expect(filtered.myJobs).toHaveLength(0)
      expect(filtered.pendingJobs).toHaveLength(0)
      expect(filtered.othersJobs).toHaveLength(0)
    })
  })
})

describe('Display Repair Job Workflow', () => {
  describe('Job State Transitions', () => {
    it('should allow starting a PENDING display repair job', () => {
      const job = {
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canStartDisplayRepair(job)
      expect(result.canStart).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should prevent starting an IN_PROGRESS display repair job', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canStartDisplayRepair(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should prevent starting a COMPLETED display repair job', () => {
      const job = {
        status: 'COMPLETED' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canStartDisplayRepair(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should allow completing an IN_PROGRESS display repair job by assigned technician', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canCompleteDisplayRepair(job, 'tech-001')
      expect(result.canComplete).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should prevent completing a PENDING display repair job', () => {
      const job = {
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canCompleteDisplayRepair(job, 'tech-001')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is not in progress')
    })

    it('should prevent completing job assigned to another technician', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canCompleteDisplayRepair(job, 'tech-002')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is assigned to another technician')
    })
  })

  describe('Job Filtering', () => {
    it('should filter display jobs by technician ID', () => {
      const jobs: Array<{ id: string; assignedToId: string | null; status: ParallelWorkStatus }> = [
        { id: 'disp-1', assignedToId: 'tech-003', status: 'IN_PROGRESS' },
        { id: 'disp-2', assignedToId: 'tech-004', status: 'IN_PROGRESS' },
        { id: 'disp-3', assignedToId: null, status: 'PENDING' },
        { id: 'disp-4', assignedToId: 'tech-003', status: 'COMPLETED' }
      ]

      const filtered = filterJobsByTechnician(jobs, 'tech-003')

      expect(filtered.myJobs).toHaveLength(1)
      expect(filtered.myJobs[0].id).toBe('disp-1')

      expect(filtered.pendingJobs).toHaveLength(1)
      expect(filtered.pendingJobs[0].id).toBe('disp-3')

      expect(filtered.othersJobs).toHaveLength(1)
      expect(filtered.othersJobs[0].id).toBe('disp-2')
    })
  })
})

describe('Battery Boost Job Workflow', () => {
  describe('Job State Transitions', () => {
    it('should allow starting a PENDING battery boost job', () => {
      const job = {
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canStartBatteryBoost(job)
      expect(result.canStart).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should prevent starting an IN_PROGRESS battery boost job', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canStartBatteryBoost(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should prevent starting a COMPLETED battery boost job', () => {
      const job = {
        status: 'COMPLETED' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canStartBatteryBoost(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should allow completing an IN_PROGRESS battery boost job by assigned technician', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canCompleteBatteryBoost(job, 'tech-001')
      expect(result.canComplete).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should prevent completing a PENDING battery boost job', () => {
      const job = {
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canCompleteBatteryBoost(job, 'tech-001')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is not in progress')
    })

    it('should prevent completing job assigned to another technician', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canCompleteBatteryBoost(job, 'tech-002')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is assigned to another technician')
    })
  })

  describe('Battery Capacity Validation', () => {
    it('should validate battery capacity with percentage sign', () => {
      expect(isValidBatteryCapacity('85%')).toBe(true)
      expect(isValidBatteryCapacity('70%')).toBe(true)
      expect(isValidBatteryCapacity('100%')).toBe(true)
      expect(isValidBatteryCapacity('0%')).toBe(true)
    })

    it('should validate battery capacity without percentage sign', () => {
      expect(isValidBatteryCapacity('85')).toBe(true)
      expect(isValidBatteryCapacity('70')).toBe(true)
      expect(isValidBatteryCapacity('100')).toBe(true)
      expect(isValidBatteryCapacity('0')).toBe(true)
    })

    it('should reject invalid battery capacity values', () => {
      expect(isValidBatteryCapacity('101%')).toBe(false)
      expect(isValidBatteryCapacity('-10%')).toBe(false)
      expect(isValidBatteryCapacity('abc')).toBe(false)
      expect(isValidBatteryCapacity('')).toBe(false)
      expect(isValidBatteryCapacity('50.5%')).toBe(false)
    })

    it('should check if final capacity meets target', () => {
      expect(doesBatteryMeetTarget('85%', '70%')).toBe(true)
      expect(doesBatteryMeetTarget('85', '70')).toBe(true)
      expect(doesBatteryMeetTarget('70%', '70%')).toBe(true)
      expect(doesBatteryMeetTarget('65%', '70%')).toBe(false)
    })

    it('should handle mixed formats in capacity comparison', () => {
      expect(doesBatteryMeetTarget('85%', '70')).toBe(true)
      expect(doesBatteryMeetTarget('85', '70%')).toBe(true)
      expect(doesBatteryMeetTarget('65', '70%')).toBe(false)
    })

    it('should handle invalid capacities in comparison', () => {
      expect(doesBatteryMeetTarget('abc', '70%')).toBe(false)
      expect(doesBatteryMeetTarget('85%', 'xyz')).toBe(false)
    })
  })

  describe('Job Filtering', () => {
    it('should filter battery jobs by technician ID', () => {
      const jobs: Array<{ id: string; assignedToId: string | null; status: ParallelWorkStatus }> = [
        { id: 'batt-1', assignedToId: 'tech-005', status: 'IN_PROGRESS' },
        { id: 'batt-2', assignedToId: 'tech-006', status: 'IN_PROGRESS' },
        { id: 'batt-3', assignedToId: null, status: 'PENDING' },
        { id: 'batt-4', assignedToId: null, status: 'PENDING' },
        { id: 'batt-5', assignedToId: 'tech-005', status: 'COMPLETED' }
      ]

      const filtered = filterJobsByTechnician(jobs, 'tech-005')

      expect(filtered.myJobs).toHaveLength(1)
      expect(filtered.myJobs[0].id).toBe('batt-1')

      expect(filtered.pendingJobs).toHaveLength(2)
      expect(filtered.pendingJobs.map(j => j.id)).toEqual(['batt-3', 'batt-4'])

      expect(filtered.othersJobs).toHaveLength(1)
      expect(filtered.othersJobs[0].id).toBe('batt-2')
    })
  })
})

describe('Parallel Work Integration Scenarios', () => {
  describe('Complete Technician Workflow', () => {
    it('should handle full L3 repair lifecycle', () => {
      const job = {
        id: 'l3-job-1',
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null as string | null
      }

      // Step 1: Start job
      const startResult = canStartL3Repair(job)
      expect(startResult.canStart).toBe(true)

      // Simulate starting
      job.status = 'IN_PROGRESS'
      job.assignedToId = 'tech-001'

      // Step 2: Try to complete
      const completeResult = canCompleteL3Repair(job, 'tech-001')
      expect(completeResult.canComplete).toBe(true)

      // Simulate completion
      job.status = 'COMPLETED'

      // Step 3: Verify cannot restart
      const restartResult = canStartL3Repair(job)
      expect(restartResult.canStart).toBe(false)
    })

    it('should handle full display repair lifecycle', () => {
      const job = {
        id: 'disp-job-1',
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null as string | null
      }

      // Step 1: Start job
      const startResult = canStartDisplayRepair(job)
      expect(startResult.canStart).toBe(true)

      // Simulate starting
      job.status = 'IN_PROGRESS'
      job.assignedToId = 'tech-003'

      // Step 2: Complete by correct technician
      const completeResult = canCompleteDisplayRepair(job, 'tech-003')
      expect(completeResult.canComplete).toBe(true)

      // Simulate completion
      job.status = 'COMPLETED'

      // Step 3: Verify cannot restart
      const restartResult = canStartDisplayRepair(job)
      expect(restartResult.canStart).toBe(false)
    })

    it('should handle full battery boost lifecycle with capacity validation', () => {
      const job = {
        id: 'batt-job-1',
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null as string | null,
        initialCapacity: '45%',
        targetCapacity: '70%',
        finalCapacity: null as string | null
      }

      // Step 1: Start job
      const startResult = canStartBatteryBoost(job)
      expect(startResult.canStart).toBe(true)

      // Simulate starting
      job.status = 'IN_PROGRESS'
      job.assignedToId = 'tech-005'

      // Step 2: Complete with valid final capacity
      job.finalCapacity = '85%'
      expect(isValidBatteryCapacity(job.finalCapacity)).toBe(true)
      expect(doesBatteryMeetTarget(job.finalCapacity, job.targetCapacity)).toBe(true)

      const completeResult = canCompleteBatteryBoost(job, 'tech-005')
      expect(completeResult.canComplete).toBe(true)

      // Simulate completion
      job.status = 'COMPLETED'

      // Step 3: Verify cannot restart
      const restartResult = canStartBatteryBoost(job)
      expect(restartResult.canStart).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should prevent invalid state transitions for L3 repair', () => {
      // PENDING -> COMPLETED (skipping IN_PROGRESS)
      const job = {
        status: 'PENDING' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canCompleteL3Repair(job, 'tech-001')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is not in progress')
    })

    it('should prevent invalid state transitions for display repair', () => {
      // COMPLETED -> IN_PROGRESS (backwards)
      const job = {
        status: 'COMPLETED' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canStartDisplayRepair(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should prevent invalid state transitions for battery boost', () => {
      // CANCELLED -> IN_PROGRESS
      const job = {
        status: 'CANCELLED' as ParallelWorkStatus,
        assignedToId: null
      }

      const result = canStartBatteryBoost(job)
      expect(result.canStart).toBe(false)
      expect(result.error).toBe('Job is not in pending status')
    })

    it('should prevent technician from completing another technician job (L3)', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-001'
      }

      const result = canCompleteL3Repair(job, 'tech-999')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is assigned to another technician')
    })

    it('should prevent technician from completing another technician job (Display)', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-003'
      }

      const result = canCompleteDisplayRepair(job, 'tech-999')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is assigned to another technician')
    })

    it('should prevent technician from completing another technician job (Battery)', () => {
      const job = {
        status: 'IN_PROGRESS' as ParallelWorkStatus,
        assignedToId: 'tech-005'
      }

      const result = canCompleteBatteryBoost(job, 'tech-999')
      expect(result.canComplete).toBe(false)
      expect(result.error).toBe('Job is assigned to another technician')
    })
  })

  describe('Multi-Technician Scenarios', () => {
    it('should handle multiple technicians working on different L3 jobs', () => {
      const jobs = [
        { id: 'l3-1', assignedToId: 'tech-001', status: 'IN_PROGRESS' as ParallelWorkStatus },
        { id: 'l3-2', assignedToId: 'tech-002', status: 'IN_PROGRESS' as ParallelWorkStatus },
        { id: 'l3-3', assignedToId: null, status: 'PENDING' as ParallelWorkStatus },
        { id: 'l3-4', assignedToId: null, status: 'PENDING' as ParallelWorkStatus }
      ]

      const tech1Jobs = filterJobsByTechnician(jobs, 'tech-001')
      expect(tech1Jobs.myJobs).toHaveLength(1)
      expect(tech1Jobs.myJobs[0].id).toBe('l3-1')
      expect(tech1Jobs.pendingJobs).toHaveLength(2)
      expect(tech1Jobs.othersJobs).toHaveLength(1)

      const tech2Jobs = filterJobsByTechnician(jobs, 'tech-002')
      expect(tech2Jobs.myJobs).toHaveLength(1)
      expect(tech2Jobs.myJobs[0].id).toBe('l3-2')
      expect(tech2Jobs.pendingJobs).toHaveLength(2)
      expect(tech2Jobs.othersJobs).toHaveLength(1)
    })

    it('should handle multiple technicians working on different display jobs', () => {
      const jobs = [
        { id: 'disp-1', assignedToId: 'tech-003', status: 'IN_PROGRESS' as ParallelWorkStatus },
        { id: 'disp-2', assignedToId: 'tech-004', status: 'IN_PROGRESS' as ParallelWorkStatus },
        { id: 'disp-3', assignedToId: null, status: 'PENDING' as ParallelWorkStatus }
      ]

      const tech3Jobs = filterJobsByTechnician(jobs, 'tech-003')
      expect(tech3Jobs.myJobs).toHaveLength(1)
      expect(tech3Jobs.othersJobs).toHaveLength(1)

      const tech4Jobs = filterJobsByTechnician(jobs, 'tech-004')
      expect(tech4Jobs.myJobs).toHaveLength(1)
      expect(tech4Jobs.othersJobs).toHaveLength(1)
    })

    it('should handle multiple technicians working on different battery jobs', () => {
      const jobs = [
        { id: 'batt-1', assignedToId: 'tech-005', status: 'IN_PROGRESS' as ParallelWorkStatus },
        { id: 'batt-2', assignedToId: 'tech-006', status: 'IN_PROGRESS' as ParallelWorkStatus },
        { id: 'batt-3', assignedToId: null, status: 'PENDING' as ParallelWorkStatus }
      ]

      const tech5Jobs = filterJobsByTechnician(jobs, 'tech-005')
      expect(tech5Jobs.myJobs).toHaveLength(1)
      expect(tech5Jobs.othersJobs).toHaveLength(1)

      const tech6Jobs = filterJobsByTechnician(jobs, 'tech-006')
      expect(tech6Jobs.myJobs).toHaveLength(1)
      expect(tech6Jobs.othersJobs).toHaveLength(1)
    })
  })
})
