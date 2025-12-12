import { describe, it, expect } from 'vitest'

/**
 * QC Inspection Tests
 *
 * Tests for Quality Control business logic including checklist validation,
 * grading rules, and rework flow.
 */

type DeviceStatus =
    | 'RECEIVED'
    | 'PENDING_INSPECTION'
    | 'WAITING_FOR_SPARES'
    | 'READY_FOR_REPAIR'
    | 'UNDER_REPAIR'
    | 'IN_PAINT_SHOP'
    | 'AWAITING_QC'
    | 'QC_PASSED'
    | 'QC_FAILED_REWORK'
    | 'READY_FOR_STOCK'
    | 'STOCK_OUT_SOLD'
    | 'STOCK_OUT_RENTAL'
    | 'SCRAPPED'

type Grade = 'A' | 'B'
type QCStatus = 'PASSED' | 'FAILED_REWORK'

interface Device {
    id: string
    status: DeviceStatus
    repairRequired: boolean
    paintRequired: boolean
    repairCompleted: boolean
    paintCompleted: boolean
}

interface QCData {
    qcEngId: string
    checklistResults: string
    remarks: string
    finalGrade: Grade | null
    status: QCStatus
}

interface ChecklistItem {
    id: string
    category: 'functional' | 'cosmetic'
    name: string
    passed: boolean
    notes?: string
}

// QC validation functions
function canPerformQC(device: Device): { allowed: boolean; reason?: string } {
    if (device.status !== 'AWAITING_QC') {
        return { allowed: false, reason: `Device is not ready for QC. Current status: ${device.status}` }
    }

    if (device.repairRequired && !device.repairCompleted) {
        return { allowed: false, reason: 'Device requires repair which is not yet completed' }
    }

    if (device.paintRequired && !device.paintCompleted) {
        return { allowed: false, reason: 'Device requires painting which is not yet completed' }
    }

    return { allowed: true }
}

function validateQCData(data: QCData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.qcEngId || data.qcEngId.trim().length === 0) {
        errors.push('QC Engineer ID is required')
    }

    if (data.status === 'PASSED' && !data.finalGrade) {
        errors.push('Grade is required for passed devices')
    }

    if (data.status === 'PASSED' && data.finalGrade && !['A', 'B'].includes(data.finalGrade)) {
        errors.push('Grade must be A or B')
    }

    if (data.status === 'FAILED_REWORK' && (!data.remarks || data.remarks.trim().length === 0)) {
        errors.push('Remarks are required for failed devices')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

function isValidGrade(grade: string | null | undefined): grade is Grade {
    return grade === 'A' || grade === 'B'
}

function getNextStatusAfterQC(qcStatus: QCStatus): DeviceStatus {
    return qcStatus === 'PASSED' ? 'READY_FOR_STOCK' : 'READY_FOR_REPAIR'
}

function parseChecklistResults(jsonString: string): ChecklistItem[] {
    try {
        return JSON.parse(jsonString)
    } catch {
        return []
    }
}

function calculateChecklistPassRate(items: ChecklistItem[]): number {
    if (items.length === 0) return 0
    const passed = items.filter(item => item.passed).length
    return Math.round((passed / items.length) * 100)
}

function getFailedChecklistItems(items: ChecklistItem[]): ChecklistItem[] {
    return items.filter(item => !item.passed)
}

function formatQCFailureNotes(remarks: string, checklistResults: string): string {
    return `QC FAILED - REWORK REQUIRED\nQC Remarks: ${remarks || 'None'}\nChecklist: ${checklistResults || 'N/A'}`
}

function appendQCNotesToRepairJob(existingNotes: string | null, qcNotes: string): string {
    if (!existingNotes || existingNotes.trim().length === 0) {
        return qcNotes
    }
    return `${existingNotes}\n\n${qcNotes}`
}

describe('QC Eligibility', () => {
    describe('canPerformQC', () => {
        it('should allow QC for ready device', () => {
            const device: Device = {
                id: '1',
                status: 'AWAITING_QC',
                repairRequired: false,
                paintRequired: false,
                repairCompleted: false,
                paintCompleted: false
            }
            const result = canPerformQC(device)
            expect(result.allowed).toBe(true)
        })

        it('should allow QC when repair completed', () => {
            const device: Device = {
                id: '1',
                status: 'AWAITING_QC',
                repairRequired: true,
                paintRequired: false,
                repairCompleted: true,
                paintCompleted: false
            }
            const result = canPerformQC(device)
            expect(result.allowed).toBe(true)
        })

        it('should allow QC when paint completed', () => {
            const device: Device = {
                id: '1',
                status: 'AWAITING_QC',
                repairRequired: false,
                paintRequired: true,
                repairCompleted: false,
                paintCompleted: true
            }
            const result = canPerformQC(device)
            expect(result.allowed).toBe(true)
        })

        it('should reject when not in AWAITING_QC status', () => {
            const device: Device = {
                id: '1',
                status: 'UNDER_REPAIR',
                repairRequired: false,
                paintRequired: false,
                repairCompleted: false,
                paintCompleted: false
            }
            const result = canPerformQC(device)
            expect(result.allowed).toBe(false)
            expect(result.reason).toContain('not ready for QC')
        })

        it('should reject when repair not completed', () => {
            const device: Device = {
                id: '1',
                status: 'AWAITING_QC',
                repairRequired: true,
                paintRequired: false,
                repairCompleted: false,
                paintCompleted: false
            }
            const result = canPerformQC(device)
            expect(result.allowed).toBe(false)
            expect(result.reason).toContain('repair')
        })

        it('should reject when paint not completed', () => {
            const device: Device = {
                id: '1',
                status: 'AWAITING_QC',
                repairRequired: false,
                paintRequired: true,
                repairCompleted: false,
                paintCompleted: false
            }
            const result = canPerformQC(device)
            expect(result.allowed).toBe(false)
            expect(result.reason).toContain('painting')
        })
    })
})

describe('QC Data Validation', () => {
    describe('validateQCData', () => {
        it('should pass for valid passed data', () => {
            const result = validateQCData({
                qcEngId: 'qc-eng-1',
                checklistResults: '[]',
                remarks: '',
                finalGrade: 'A',
                status: 'PASSED'
            })
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should pass for valid failed data', () => {
            const result = validateQCData({
                qcEngId: 'qc-eng-1',
                checklistResults: '[]',
                remarks: 'Screen has dead pixels',
                finalGrade: null,
                status: 'FAILED_REWORK'
            })
            expect(result.valid).toBe(true)
        })

        it('should fail without QC engineer', () => {
            const result = validateQCData({
                qcEngId: '',
                checklistResults: '[]',
                remarks: '',
                finalGrade: 'A',
                status: 'PASSED'
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('QC Engineer ID is required')
        })

        it('should fail when passed without grade', () => {
            const result = validateQCData({
                qcEngId: 'qc-eng-1',
                checklistResults: '[]',
                remarks: '',
                finalGrade: null,
                status: 'PASSED'
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Grade is required for passed devices')
        })

        it('should fail when failed without remarks', () => {
            const result = validateQCData({
                qcEngId: 'qc-eng-1',
                checklistResults: '[]',
                remarks: '',
                finalGrade: null,
                status: 'FAILED_REWORK'
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Remarks are required for failed devices')
        })

        it('should fail with invalid grade', () => {
            const result = validateQCData({
                qcEngId: 'qc-eng-1',
                checklistResults: '[]',
                remarks: '',
                finalGrade: 'C' as Grade,
                status: 'PASSED'
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Grade must be A or B')
        })
    })
})

describe('Grade Validation', () => {
    describe('isValidGrade', () => {
        it('should accept A grade', () => {
            expect(isValidGrade('A')).toBe(true)
        })

        it('should accept B grade', () => {
            expect(isValidGrade('B')).toBe(true)
        })

        it('should reject invalid grades', () => {
            expect(isValidGrade('C')).toBe(false)
            expect(isValidGrade('D')).toBe(false)
            expect(isValidGrade('')).toBe(false)
        })

        it('should reject null and undefined', () => {
            expect(isValidGrade(null)).toBe(false)
            expect(isValidGrade(undefined)).toBe(false)
        })
    })
})

describe('Status Transitions', () => {
    describe('getNextStatusAfterQC', () => {
        it('should return READY_FOR_STOCK for passed', () => {
            expect(getNextStatusAfterQC('PASSED')).toBe('READY_FOR_STOCK')
        })

        it('should return READY_FOR_REPAIR for failed', () => {
            expect(getNextStatusAfterQC('FAILED_REWORK')).toBe('READY_FOR_REPAIR')
        })
    })
})

describe('Checklist Processing', () => {
    const sampleChecklist: ChecklistItem[] = [
        { id: '1', category: 'functional', name: 'Power On', passed: true },
        { id: '2', category: 'functional', name: 'Display', passed: true },
        { id: '3', category: 'functional', name: 'Keyboard', passed: false, notes: '3 keys not working' },
        { id: '4', category: 'cosmetic', name: 'Case Condition', passed: true },
        { id: '5', category: 'cosmetic', name: 'Screen Condition', passed: false, notes: 'Minor scratches' }
    ]

    describe('parseChecklistResults', () => {
        it('should parse valid JSON', () => {
            const json = JSON.stringify(sampleChecklist)
            const result = parseChecklistResults(json)
            expect(result).toHaveLength(5)
        })

        it('should return empty array for invalid JSON', () => {
            const result = parseChecklistResults('invalid')
            expect(result).toEqual([])
        })

        it('should return empty array for empty string', () => {
            const result = parseChecklistResults('')
            expect(result).toEqual([])
        })
    })

    describe('calculateChecklistPassRate', () => {
        it('should calculate pass rate correctly', () => {
            const rate = calculateChecklistPassRate(sampleChecklist)
            expect(rate).toBe(60) // 3 out of 5 passed
        })

        it('should return 0 for empty checklist', () => {
            expect(calculateChecklistPassRate([])).toBe(0)
        })

        it('should return 100 when all pass', () => {
            const allPassed = sampleChecklist.map(item => ({ ...item, passed: true }))
            expect(calculateChecklistPassRate(allPassed)).toBe(100)
        })

        it('should return 0 when all fail', () => {
            const allFailed = sampleChecklist.map(item => ({ ...item, passed: false }))
            expect(calculateChecklistPassRate(allFailed)).toBe(0)
        })
    })

    describe('getFailedChecklistItems', () => {
        it('should return failed items', () => {
            const failed = getFailedChecklistItems(sampleChecklist)
            expect(failed).toHaveLength(2)
            expect(failed.map(f => f.name)).toEqual(['Keyboard', 'Screen Condition'])
        })

        it('should return empty array when all pass', () => {
            const allPassed = sampleChecklist.map(item => ({ ...item, passed: true }))
            expect(getFailedChecklistItems(allPassed)).toHaveLength(0)
        })
    })
})

describe('QC Failure Notes', () => {
    describe('formatQCFailureNotes', () => {
        it('should format notes correctly', () => {
            const notes = formatQCFailureNotes('Screen issue', 'Checklist data')
            expect(notes).toContain('QC FAILED')
            expect(notes).toContain('REWORK REQUIRED')
            expect(notes).toContain('Screen issue')
        })

        it('should handle empty remarks', () => {
            const notes = formatQCFailureNotes('', '')
            expect(notes).toContain('None')
            expect(notes).toContain('N/A')
        })
    })

    describe('appendQCNotesToRepairJob', () => {
        it('should append to existing notes', () => {
            const existing = 'Previous repair notes'
            const qcNotes = 'QC failure notes'
            const result = appendQCNotesToRepairJob(existing, qcNotes)

            expect(result).toContain(existing)
            expect(result).toContain(qcNotes)
            expect(result.indexOf(existing)).toBeLessThan(result.indexOf(qcNotes))
        })

        it('should return just QC notes when no existing', () => {
            const result = appendQCNotesToRepairJob(null, 'QC notes')
            expect(result).toBe('QC notes')
        })

        it('should return just QC notes for empty string', () => {
            const result = appendQCNotesToRepairJob('', 'QC notes')
            expect(result).toBe('QC notes')
        })
    })
})

describe('QC Checklist Categories', () => {
    const functionalItems = [
        'Power On & Boot Sequence',
        'Display Quality (dead pixels, backlight, brightness)',
        'Keyboard Functionality (all keys)',
        'Touchpad/Trackpoint Operation',
        'Ports & Connectivity (USB, HDMI, Wi-Fi, Bluetooth, LAN, audio jack)',
        'Battery Health',
        'Adapter/Charging Verification',
        'Fan Noise & Thermal Performance',
        'Stress Test Results'
    ]

    const cosmeticItems = [
        'Overall Case Condition',
        'Paint Finish Quality',
        'Logo Condition',
        'Sticker Condition',
        'Screen Physical Condition'
    ]

    it('should have comprehensive functional checks', () => {
        expect(functionalItems.length).toBeGreaterThanOrEqual(9)
        expect(functionalItems.some(i => i.toLowerCase().includes('power'))).toBe(true)
        expect(functionalItems.some(i => i.toLowerCase().includes('display'))).toBe(true)
        expect(functionalItems.some(i => i.toLowerCase().includes('keyboard'))).toBe(true)
    })

    it('should have comprehensive cosmetic checks', () => {
        expect(cosmeticItems.length).toBeGreaterThanOrEqual(5)
        expect(cosmeticItems.some(i => i.toLowerCase().includes('paint'))).toBe(true)
    })
})

describe('Rework Flow', () => {
    interface ReworkState {
        deviceStatus: DeviceStatus
        repairCompleted: boolean
        paintCompleted: boolean
        repairJobStatus: string
    }

    function getStateAfterQCFailure(device: Device): ReworkState {
        return {
            deviceStatus: 'READY_FOR_REPAIR',
            repairCompleted: false,
            paintCompleted: device.paintRequired ? false : true,
            repairJobStatus: 'READY_FOR_REPAIR'
        }
    }

    it('should reset repair completed flag', () => {
        const device: Device = {
            id: '1',
            status: 'AWAITING_QC',
            repairRequired: true,
            paintRequired: false,
            repairCompleted: true,
            paintCompleted: false
        }

        const newState = getStateAfterQCFailure(device)
        expect(newState.repairCompleted).toBe(false)
    })

    it('should reset paint completed flag if paint was required', () => {
        const device: Device = {
            id: '1',
            status: 'AWAITING_QC',
            repairRequired: true,
            paintRequired: true,
            repairCompleted: true,
            paintCompleted: true
        }

        const newState = getStateAfterQCFailure(device)
        expect(newState.paintCompleted).toBe(false)
    })

    it('should keep paint completed true if paint was not required', () => {
        const device: Device = {
            id: '1',
            status: 'AWAITING_QC',
            repairRequired: true,
            paintRequired: false,
            repairCompleted: true,
            paintCompleted: false
        }

        const newState = getStateAfterQCFailure(device)
        expect(newState.paintCompleted).toBe(true)
    })

    it('should set device status to READY_FOR_REPAIR', () => {
        const device: Device = {
            id: '1',
            status: 'AWAITING_QC',
            repairRequired: true,
            paintRequired: true,
            repairCompleted: true,
            paintCompleted: true
        }

        const newState = getStateAfterQCFailure(device)
        expect(newState.deviceStatus).toBe('READY_FOR_REPAIR')
    })
})
