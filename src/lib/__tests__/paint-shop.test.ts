import { describe, it, expect } from 'vitest'

/**
 * Paint Shop Tests
 *
 * Tests for paint shop business logic including panel management,
 * status transitions, and workflow coordination with repair.
 */

type PaintStatus = 'AWAITING_PAINT' | 'IN_PAINT' | 'READY_FOR_COLLECTION' | 'FITTED'
type DeviceStatus =
    | 'RECEIVED'
    | 'UNDER_REPAIR'
    | 'IN_PAINT_SHOP'
    | 'AWAITING_QC'
    | 'READY_FOR_STOCK'

interface Device {
    id: string
    status: DeviceStatus
    repairRequired: boolean
    paintRequired: boolean
    repairCompleted: boolean
    paintCompleted: boolean
}

interface PaintPanel {
    id: string
    deviceId: string
    panelType: string
    status: PaintStatus
}

// Panel types commonly used
const PANEL_TYPES = [
    'Top Cover',
    'Bottom Cover',
    'Palmrest',
    'Bezel',
    'Hinge Cover',
    'LCD Back'
]

// Panel status validation
function isValidPanelStatus(status: string): status is PaintStatus {
    return ['AWAITING_PAINT', 'IN_PAINT', 'READY_FOR_COLLECTION', 'FITTED'].includes(status)
}

function getNextPanelStatus(currentStatus: PaintStatus): PaintStatus | null {
    const transitions: Record<PaintStatus, PaintStatus | null> = {
        'AWAITING_PAINT': 'IN_PAINT',
        'IN_PAINT': 'READY_FOR_COLLECTION',
        'READY_FOR_COLLECTION': 'FITTED',
        'FITTED': null // Final state
    }
    return transitions[currentStatus]
}

function canTransitionPanelStatus(from: PaintStatus, to: PaintStatus): boolean {
    const allowedTransitions: Record<PaintStatus, PaintStatus[]> = {
        'AWAITING_PAINT': ['IN_PAINT'],
        'IN_PAINT': ['READY_FOR_COLLECTION'],
        'READY_FOR_COLLECTION': ['FITTED'],
        'FITTED': [] // No transitions allowed
    }
    return allowedTransitions[from].includes(to)
}

function arePanelsReadyForCollection(panels: PaintPanel[]): boolean {
    return panels.length > 0 && panels.every(p => p.status === 'READY_FOR_COLLECTION' || p.status === 'FITTED')
}

function arePanelsComplete(panels: PaintPanel[]): boolean {
    return panels.length > 0 && panels.every(p => p.status === 'FITTED')
}

function getPanelsByStatus(panels: PaintPanel[], status: PaintStatus): PaintPanel[] {
    return panels.filter(p => p.status === status)
}

function getActivePaintPanels(panels: PaintPanel[]): PaintPanel[] {
    return panels.filter(p => p.status === 'AWAITING_PAINT' || p.status === 'IN_PAINT')
}

function shouldShowInPaintShop(device: Device, panels: PaintPanel[]): boolean {
    // Only show in paint shop if:
    // 1. Repair is NOT required, OR
    // 2. Repair IS required AND repair is completed
    const repairConditionMet = !device.repairRequired || device.repairCompleted

    // AND device has active paint panels
    const hasActivePanels = panels.some(p => p.status === 'AWAITING_PAINT' || p.status === 'IN_PAINT')

    return repairConditionMet && hasActivePanels
}

function determineNextStatusAfterAllPanelsComplete(device: Device): DeviceStatus {
    if (device.repairRequired && !device.repairCompleted) {
        return 'UNDER_REPAIR' // Back to repair station
    }
    return 'AWAITING_QC' // Proceed to QC
}

describe('Panel Type Validation', () => {
    describe('PANEL_TYPES', () => {
        it('should have standard panel types', () => {
            expect(PANEL_TYPES).toContain('Top Cover')
            expect(PANEL_TYPES).toContain('Bottom Cover')
            expect(PANEL_TYPES).toContain('Palmrest')
            expect(PANEL_TYPES).toContain('Bezel')
        })

        it('should have at least 4 panel types', () => {
            expect(PANEL_TYPES.length).toBeGreaterThanOrEqual(4)
        })
    })
})

describe('Panel Status Validation', () => {
    describe('isValidPanelStatus', () => {
        it('should accept all valid statuses', () => {
            expect(isValidPanelStatus('AWAITING_PAINT')).toBe(true)
            expect(isValidPanelStatus('IN_PAINT')).toBe(true)
            expect(isValidPanelStatus('READY_FOR_COLLECTION')).toBe(true)
            expect(isValidPanelStatus('FITTED')).toBe(true)
        })

        it('should reject invalid statuses', () => {
            expect(isValidPanelStatus('PENDING')).toBe(false)
            expect(isValidPanelStatus('DONE')).toBe(false)
            expect(isValidPanelStatus('')).toBe(false)
        })
    })
})

describe('Panel Status Transitions', () => {
    describe('getNextPanelStatus', () => {
        it('should return IN_PAINT after AWAITING_PAINT', () => {
            expect(getNextPanelStatus('AWAITING_PAINT')).toBe('IN_PAINT')
        })

        it('should return READY_FOR_COLLECTION after IN_PAINT', () => {
            expect(getNextPanelStatus('IN_PAINT')).toBe('READY_FOR_COLLECTION')
        })

        it('should return FITTED after READY_FOR_COLLECTION', () => {
            expect(getNextPanelStatus('READY_FOR_COLLECTION')).toBe('FITTED')
        })

        it('should return null after FITTED (final state)', () => {
            expect(getNextPanelStatus('FITTED')).toBeNull()
        })
    })

    describe('canTransitionPanelStatus', () => {
        it('should allow valid forward transitions', () => {
            expect(canTransitionPanelStatus('AWAITING_PAINT', 'IN_PAINT')).toBe(true)
            expect(canTransitionPanelStatus('IN_PAINT', 'READY_FOR_COLLECTION')).toBe(true)
            expect(canTransitionPanelStatus('READY_FOR_COLLECTION', 'FITTED')).toBe(true)
        })

        it('should reject invalid transitions', () => {
            expect(canTransitionPanelStatus('AWAITING_PAINT', 'READY_FOR_COLLECTION')).toBe(false)
            expect(canTransitionPanelStatus('AWAITING_PAINT', 'FITTED')).toBe(false)
            expect(canTransitionPanelStatus('IN_PAINT', 'FITTED')).toBe(false)
        })

        it('should reject backward transitions', () => {
            expect(canTransitionPanelStatus('IN_PAINT', 'AWAITING_PAINT')).toBe(false)
            expect(canTransitionPanelStatus('FITTED', 'IN_PAINT')).toBe(false)
        })

        it('should reject transitions from FITTED', () => {
            expect(canTransitionPanelStatus('FITTED', 'AWAITING_PAINT')).toBe(false)
            expect(canTransitionPanelStatus('FITTED', 'IN_PAINT')).toBe(false)
            expect(canTransitionPanelStatus('FITTED', 'READY_FOR_COLLECTION')).toBe(false)
        })
    })
})

describe('Panel Collection', () => {
    describe('arePanelsReadyForCollection', () => {
        it('should return true when all panels ready', () => {
            const panels: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top Cover', status: 'READY_FOR_COLLECTION' },
                { id: '2', deviceId: 'd1', panelType: 'Bottom Cover', status: 'READY_FOR_COLLECTION' }
            ]
            expect(arePanelsReadyForCollection(panels)).toBe(true)
        })

        it('should return true when panels are fitted', () => {
            const panels: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top Cover', status: 'FITTED' },
                { id: '2', deviceId: 'd1', panelType: 'Bottom Cover', status: 'FITTED' }
            ]
            expect(arePanelsReadyForCollection(panels)).toBe(true)
        })

        it('should return true for mix of ready and fitted', () => {
            const panels: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top Cover', status: 'READY_FOR_COLLECTION' },
                { id: '2', deviceId: 'd1', panelType: 'Bottom Cover', status: 'FITTED' }
            ]
            expect(arePanelsReadyForCollection(panels)).toBe(true)
        })

        it('should return false when any panel still in progress', () => {
            const panels: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top Cover', status: 'READY_FOR_COLLECTION' },
                { id: '2', deviceId: 'd1', panelType: 'Bottom Cover', status: 'IN_PAINT' }
            ]
            expect(arePanelsReadyForCollection(panels)).toBe(false)
        })

        it('should return false for empty panels array', () => {
            expect(arePanelsReadyForCollection([])).toBe(false)
        })
    })

    describe('arePanelsComplete', () => {
        it('should return true only when all panels are FITTED', () => {
            const panels: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top Cover', status: 'FITTED' },
                { id: '2', deviceId: 'd1', panelType: 'Bottom Cover', status: 'FITTED' }
            ]
            expect(arePanelsComplete(panels)).toBe(true)
        })

        it('should return false when not all panels FITTED', () => {
            const panels: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top Cover', status: 'FITTED' },
                { id: '2', deviceId: 'd1', panelType: 'Bottom Cover', status: 'READY_FOR_COLLECTION' }
            ]
            expect(arePanelsComplete(panels)).toBe(false)
        })
    })
})

describe('Panel Filtering', () => {
    const samplePanels: PaintPanel[] = [
        { id: '1', deviceId: 'd1', panelType: 'Top Cover', status: 'AWAITING_PAINT' },
        { id: '2', deviceId: 'd1', panelType: 'Bottom Cover', status: 'IN_PAINT' },
        { id: '3', deviceId: 'd1', panelType: 'Palmrest', status: 'READY_FOR_COLLECTION' },
        { id: '4', deviceId: 'd1', panelType: 'Bezel', status: 'FITTED' }
    ]

    describe('getPanelsByStatus', () => {
        it('should filter by AWAITING_PAINT', () => {
            const result = getPanelsByStatus(samplePanels, 'AWAITING_PAINT')
            expect(result).toHaveLength(1)
            expect(result[0].panelType).toBe('Top Cover')
        })

        it('should filter by IN_PAINT', () => {
            const result = getPanelsByStatus(samplePanels, 'IN_PAINT')
            expect(result).toHaveLength(1)
            expect(result[0].panelType).toBe('Bottom Cover')
        })

        it('should return empty array when no matches', () => {
            const allFitted: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top', status: 'FITTED' }
            ]
            const result = getPanelsByStatus(allFitted, 'AWAITING_PAINT')
            expect(result).toHaveLength(0)
        })
    })

    describe('getActivePaintPanels', () => {
        it('should return only AWAITING_PAINT and IN_PAINT panels', () => {
            const result = getActivePaintPanels(samplePanels)
            expect(result).toHaveLength(2)
            expect(result.map(p => p.status)).toEqual(['AWAITING_PAINT', 'IN_PAINT'])
        })

        it('should return empty when no active panels', () => {
            const completedPanels: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top', status: 'FITTED' },
                { id: '2', deviceId: 'd1', panelType: 'Bottom', status: 'READY_FOR_COLLECTION' }
            ]
            const result = getActivePaintPanels(completedPanels)
            expect(result).toHaveLength(0)
        })
    })
})

describe('Paint Shop Visibility', () => {
    describe('shouldShowInPaintShop', () => {
        const activePanels: PaintPanel[] = [
            { id: '1', deviceId: 'd1', panelType: 'Top Cover', status: 'AWAITING_PAINT' }
        ]

        it('should show when repair not required and has active panels', () => {
            const device: Device = {
                id: 'd1',
                status: 'IN_PAINT_SHOP',
                repairRequired: false,
                paintRequired: true,
                repairCompleted: false,
                paintCompleted: false
            }
            expect(shouldShowInPaintShop(device, activePanels)).toBe(true)
        })

        it('should show when repair completed and has active panels', () => {
            const device: Device = {
                id: 'd1',
                status: 'IN_PAINT_SHOP',
                repairRequired: true,
                paintRequired: true,
                repairCompleted: true,
                paintCompleted: false
            }
            expect(shouldShowInPaintShop(device, activePanels)).toBe(true)
        })

        it('should NOT show when repair required but not completed', () => {
            const device: Device = {
                id: 'd1',
                status: 'IN_PAINT_SHOP',
                repairRequired: true,
                paintRequired: true,
                repairCompleted: false,
                paintCompleted: false
            }
            expect(shouldShowInPaintShop(device, activePanels)).toBe(false)
        })

        it('should NOT show when no active panels', () => {
            const device: Device = {
                id: 'd1',
                status: 'IN_PAINT_SHOP',
                repairRequired: false,
                paintRequired: true,
                repairCompleted: false,
                paintCompleted: false
            }
            const completedPanels: PaintPanel[] = [
                { id: '1', deviceId: 'd1', panelType: 'Top', status: 'FITTED' }
            ]
            expect(shouldShowInPaintShop(device, completedPanels)).toBe(false)
        })
    })
})

describe('Device Status After Paint', () => {
    describe('determineNextStatusAfterAllPanelsComplete', () => {
        it('should return AWAITING_QC when repair not required', () => {
            const device: Device = {
                id: 'd1',
                status: 'IN_PAINT_SHOP',
                repairRequired: false,
                paintRequired: true,
                repairCompleted: false,
                paintCompleted: false
            }
            expect(determineNextStatusAfterAllPanelsComplete(device)).toBe('AWAITING_QC')
        })

        it('should return AWAITING_QC when repair completed', () => {
            const device: Device = {
                id: 'd1',
                status: 'IN_PAINT_SHOP',
                repairRequired: true,
                paintRequired: true,
                repairCompleted: true,
                paintCompleted: false
            }
            expect(determineNextStatusAfterAllPanelsComplete(device)).toBe('AWAITING_QC')
        })

        it('should return UNDER_REPAIR when repair required but not completed', () => {
            const device: Device = {
                id: 'd1',
                status: 'IN_PAINT_SHOP',
                repairRequired: true,
                paintRequired: true,
                repairCompleted: false,
                paintCompleted: false
            }
            expect(determineNextStatusAfterAllPanelsComplete(device)).toBe('UNDER_REPAIR')
        })
    })
})

describe('Panel Creation', () => {
    function createPanelsForDevice(deviceId: string, panelTypes: string[]): Omit<PaintPanel, 'id'>[] {
        return panelTypes.map(panelType => ({
            deviceId,
            panelType,
            status: 'AWAITING_PAINT' as PaintStatus
        }))
    }

    it('should create panels with AWAITING_PAINT status', () => {
        const panels = createPanelsForDevice('d1', ['Top Cover', 'Bottom Cover'])
        expect(panels).toHaveLength(2)
        expect(panels.every(p => p.status === 'AWAITING_PAINT')).toBe(true)
    })

    it('should associate panels with device', () => {
        const panels = createPanelsForDevice('device-123', ['Palmrest'])
        expect(panels[0].deviceId).toBe('device-123')
    })

    it('should handle empty panel types', () => {
        const panels = createPanelsForDevice('d1', [])
        expect(panels).toHaveLength(0)
    })
})

describe('Panel Progress Calculation', () => {
    function calculatePanelProgress(panels: PaintPanel[]): {
        total: number
        awaiting: number
        inPaint: number
        ready: number
        fitted: number
        percentComplete: number
    } {
        const total = panels.length
        const awaiting = panels.filter(p => p.status === 'AWAITING_PAINT').length
        const inPaint = panels.filter(p => p.status === 'IN_PAINT').length
        const ready = panels.filter(p => p.status === 'READY_FOR_COLLECTION').length
        const fitted = panels.filter(p => p.status === 'FITTED').length

        const percentComplete = total > 0 ? Math.round((fitted / total) * 100) : 0

        return { total, awaiting, inPaint, ready, fitted, percentComplete }
    }

    it('should calculate progress correctly', () => {
        const panels: PaintPanel[] = [
            { id: '1', deviceId: 'd1', panelType: 'Top', status: 'FITTED' },
            { id: '2', deviceId: 'd1', panelType: 'Bottom', status: 'FITTED' },
            { id: '3', deviceId: 'd1', panelType: 'Palmrest', status: 'IN_PAINT' },
            { id: '4', deviceId: 'd1', panelType: 'Bezel', status: 'AWAITING_PAINT' }
        ]

        const progress = calculatePanelProgress(panels)
        expect(progress.total).toBe(4)
        expect(progress.fitted).toBe(2)
        expect(progress.percentComplete).toBe(50)
    })

    it('should return 100% when all fitted', () => {
        const panels: PaintPanel[] = [
            { id: '1', deviceId: 'd1', panelType: 'Top', status: 'FITTED' },
            { id: '2', deviceId: 'd1', panelType: 'Bottom', status: 'FITTED' }
        ]

        const progress = calculatePanelProgress(panels)
        expect(progress.percentComplete).toBe(100)
    })

    it('should return 0% for empty panels', () => {
        const progress = calculatePanelProgress([])
        expect(progress.percentComplete).toBe(0)
    })
})
