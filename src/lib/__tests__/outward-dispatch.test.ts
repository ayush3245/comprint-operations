import { describe, it, expect } from 'vitest'

/**
 * Outward Dispatch Tests
 *
 * Tests for outward/dispatch business logic including validation,
 * status transitions, and stock movement rules.
 */

type DeviceStatus =
    | 'RECEIVED'
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

type OutwardType = 'SALES' | 'RENTAL'
type MovementType = 'INWARD' | 'MOVE' | 'SALES_OUTWARD' | 'RENTAL_OUTWARD' | 'RETURN_TO_VENDOR' | 'SCRAP'

interface OutwardData {
    type: OutwardType
    customer: string
    reference: string
    shippingDetails?: string
    packedById?: string
    checkedById?: string
    deviceIds: string[]
}

interface Device {
    id: string
    barcode: string
    status: DeviceStatus
    grade?: 'A' | 'B' | null
}

// Validation functions
function validateOutwardData(data: OutwardData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.type || !['SALES', 'RENTAL'].includes(data.type)) {
        errors.push('Invalid outward type')
    }

    if (!data.customer || data.customer.trim().length === 0) {
        errors.push('Customer name is required')
    }

    if (!data.reference || data.reference.trim().length === 0) {
        errors.push('Reference (Invoice/Rental Ref) is required')
    }

    if (!data.deviceIds || data.deviceIds.length === 0) {
        errors.push('At least one device must be selected')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

function canDeviceBeDispatched(device: Device): boolean {
    return device.status === 'READY_FOR_STOCK'
}

function filterDispatchableDevices(devices: Device[]): Device[] {
    return devices.filter(canDeviceBeDispatched)
}

function getDevicesNotDispatchable(devices: Device[]): Device[] {
    return devices.filter(d => !canDeviceBeDispatched(d))
}

function getNewStatusForOutward(outwardType: OutwardType): DeviceStatus {
    return outwardType === 'SALES' ? 'STOCK_OUT_SOLD' : 'STOCK_OUT_RENTAL'
}

function getMovementTypeForOutward(outwardType: OutwardType): MovementType {
    return outwardType === 'SALES' ? 'SALES_OUTWARD' : 'RENTAL_OUTWARD'
}

function generateOutwardId(year: number, count: number): string {
    return `OUT-${year}-${(count + 1).toString().padStart(4, '0')}`
}

function validateShippingDetails(details: string | undefined): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []

    if (!details || details.trim().length === 0) {
        warnings.push('Shipping details are empty - consider adding carrier and tracking info')
    } else {
        // Check for common shipping info
        const hasCarrier = /fedex|ups|dhl|bluedart|dtdc|gati/i.test(details)
        const hasTracking = /\d{8,}/i.test(details) // Most tracking numbers have 8+ digits

        if (!hasCarrier) {
            warnings.push('No carrier name detected')
        }
        if (!hasTracking) {
            warnings.push('No tracking number detected')
        }
    }

    return {
        valid: true, // Shipping details are optional
        warnings
    }
}

function validateDualVerification(packedById?: string, checkedById?: string): { valid: boolean; warning?: string } {
    if (!packedById && !checkedById) {
        return { valid: true, warning: 'Both Packed By and Checked By are empty' }
    }

    if (packedById && checkedById && packedById === checkedById) {
        return { valid: true, warning: 'Same person packed and checked - consider dual verification' }
    }

    return { valid: true }
}

describe('Outward Data Validation', () => {
    describe('validateOutwardData', () => {
        it('should pass with valid sales outward data', () => {
            const result = validateOutwardData({
                type: 'SALES',
                customer: 'Acme Corp',
                reference: 'INV-001',
                deviceIds: ['device-1', 'device-2']
            })
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should pass with valid rental outward data', () => {
            const result = validateOutwardData({
                type: 'RENTAL',
                customer: 'Beta Inc',
                reference: 'RENTAL-2025-001',
                deviceIds: ['device-1']
            })
            expect(result.valid).toBe(true)
        })

        it('should fail without type', () => {
            const result = validateOutwardData({
                type: '' as OutwardType,
                customer: 'Acme Corp',
                reference: 'INV-001',
                deviceIds: ['device-1']
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Invalid outward type')
        })

        it('should fail with invalid type', () => {
            const result = validateOutwardData({
                type: 'INVALID' as OutwardType,
                customer: 'Acme Corp',
                reference: 'INV-001',
                deviceIds: ['device-1']
            })
            expect(result.valid).toBe(false)
        })

        it('should fail without customer', () => {
            const result = validateOutwardData({
                type: 'SALES',
                customer: '',
                reference: 'INV-001',
                deviceIds: ['device-1']
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Customer name is required')
        })

        it('should fail without reference', () => {
            const result = validateOutwardData({
                type: 'SALES',
                customer: 'Acme Corp',
                reference: '',
                deviceIds: ['device-1']
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Reference (Invoice/Rental Ref) is required')
        })

        it('should fail with empty device list', () => {
            const result = validateOutwardData({
                type: 'SALES',
                customer: 'Acme Corp',
                reference: 'INV-001',
                deviceIds: []
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('At least one device must be selected')
        })

        it('should collect all validation errors', () => {
            const result = validateOutwardData({
                type: '' as OutwardType,
                customer: '',
                reference: '',
                deviceIds: []
            })
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThanOrEqual(4)
        })
    })
})

describe('Device Dispatch Eligibility', () => {
    describe('canDeviceBeDispatched', () => {
        it('should allow READY_FOR_STOCK devices', () => {
            const device: Device = { id: '1', barcode: 'L-DEL-001', status: 'READY_FOR_STOCK', grade: 'A' }
            expect(canDeviceBeDispatched(device)).toBe(true)
        })

        it('should reject devices in other statuses', () => {
            const statuses: DeviceStatus[] = [
                'RECEIVED', 'WAITING_FOR_SPARES',
                'READY_FOR_REPAIR', 'UNDER_REPAIR', 'IN_PAINT_SHOP',
                'AWAITING_QC', 'STOCK_OUT_SOLD', 'STOCK_OUT_RENTAL'
            ]

            statuses.forEach(status => {
                const device: Device = { id: '1', barcode: 'L-DEL-001', status }
                expect(canDeviceBeDispatched(device)).toBe(false)
            })
        })
    })

    describe('filterDispatchableDevices', () => {
        it('should filter only READY_FOR_STOCK devices', () => {
            const devices: Device[] = [
                { id: '1', barcode: 'L-001', status: 'READY_FOR_STOCK', grade: 'A' },
                { id: '2', barcode: 'L-002', status: 'UNDER_REPAIR' },
                { id: '3', barcode: 'L-003', status: 'READY_FOR_STOCK', grade: 'B' },
                { id: '4', barcode: 'L-004', status: 'AWAITING_QC' }
            ]

            const dispatchable = filterDispatchableDevices(devices)
            expect(dispatchable).toHaveLength(2)
            expect(dispatchable.map(d => d.id)).toEqual(['1', '3'])
        })

        it('should return empty array if no devices are dispatchable', () => {
            const devices: Device[] = [
                { id: '1', barcode: 'L-001', status: 'UNDER_REPAIR' },
                { id: '2', barcode: 'L-002', status: 'AWAITING_QC' }
            ]

            const dispatchable = filterDispatchableDevices(devices)
            expect(dispatchable).toHaveLength(0)
        })
    })

    describe('getDevicesNotDispatchable', () => {
        it('should identify non-dispatchable devices', () => {
            const devices: Device[] = [
                { id: '1', barcode: 'L-001', status: 'READY_FOR_STOCK', grade: 'A' },
                { id: '2', barcode: 'L-002', status: 'UNDER_REPAIR' },
                { id: '3', barcode: 'L-003', status: 'AWAITING_QC' }
            ]

            const notDispatchable = getDevicesNotDispatchable(devices)
            expect(notDispatchable).toHaveLength(2)
            expect(notDispatchable.map(d => d.id)).toEqual(['2', '3'])
        })
    })
})

describe('Status Transitions', () => {
    describe('getNewStatusForOutward', () => {
        it('should return STOCK_OUT_SOLD for sales', () => {
            expect(getNewStatusForOutward('SALES')).toBe('STOCK_OUT_SOLD')
        })

        it('should return STOCK_OUT_RENTAL for rental', () => {
            expect(getNewStatusForOutward('RENTAL')).toBe('STOCK_OUT_RENTAL')
        })
    })

    describe('getMovementTypeForOutward', () => {
        it('should return SALES_OUTWARD for sales', () => {
            expect(getMovementTypeForOutward('SALES')).toBe('SALES_OUTWARD')
        })

        it('should return RENTAL_OUTWARD for rental', () => {
            expect(getMovementTypeForOutward('RENTAL')).toBe('RENTAL_OUTWARD')
        })
    })
})

describe('Outward ID Generation', () => {
    describe('generateOutwardId', () => {
        it('should generate correct format', () => {
            expect(generateOutwardId(2025, 0)).toBe('OUT-2025-0001')
            expect(generateOutwardId(2025, 99)).toBe('OUT-2025-0100')
            expect(generateOutwardId(2025, 999)).toBe('OUT-2025-1000')
        })

        it('should handle year transitions', () => {
            expect(generateOutwardId(2024, 0)).toBe('OUT-2024-0001')
            expect(generateOutwardId(2025, 0)).toBe('OUT-2025-0001')
        })
    })
})

describe('Shipping Details Validation', () => {
    describe('validateShippingDetails', () => {
        it('should warn when empty', () => {
            const result = validateShippingDetails('')
            expect(result.valid).toBe(true)
            expect(result.warnings.length).toBeGreaterThan(0)
        })

        it('should detect carrier names', () => {
            const result = validateShippingDetails('FedEx - 123456789')
            expect(result.valid).toBe(true)
            expect(result.warnings.some(w => w.includes('carrier'))).toBe(false)
        })

        it('should warn when no carrier detected', () => {
            const result = validateShippingDetails('123456789')
            expect(result.warnings.some(w => w.includes('carrier'))).toBe(true)
        })

        it('should detect tracking numbers', () => {
            const result = validateShippingDetails('FedEx - 123456789')
            expect(result.warnings.some(w => w.includes('tracking'))).toBe(false)
        })

        it('should warn when no tracking detected', () => {
            const result = validateShippingDetails('FedEx - 1234')
            expect(result.warnings.some(w => w.includes('tracking'))).toBe(true)
        })
    })
})

describe('Dual Verification', () => {
    describe('validateDualVerification', () => {
        it('should warn when both empty', () => {
            const result = validateDualVerification(undefined, undefined)
            expect(result.valid).toBe(true)
            expect(result.warning).toBeDefined()
        })

        it('should warn when same person', () => {
            const result = validateDualVerification('user-1', 'user-1')
            expect(result.valid).toBe(true)
            expect(result.warning).toContain('Same person')
        })

        it('should pass with different people', () => {
            const result = validateDualVerification('user-1', 'user-2')
            expect(result.valid).toBe(true)
            expect(result.warning).toBeUndefined()
        })

        it('should pass with only packed by', () => {
            const result = validateDualVerification('user-1', undefined)
            expect(result.valid).toBe(true)
        })
    })
})

describe('Stock Movement Integration', () => {
    interface StockMovement {
        deviceId: string
        type: MovementType
        fromLocation: string
        reference: string
        userId: string
    }

    function createStockMovement(
        deviceId: string,
        outwardType: OutwardType,
        fromLocation: string,
        outwardId: string,
        userId: string
    ): StockMovement {
        return {
            deviceId,
            type: getMovementTypeForOutward(outwardType),
            fromLocation,
            reference: outwardId,
            userId
        }
    }

    it('should create stock movement for sales', () => {
        const movement = createStockMovement('device-1', 'SALES', 'Warehouse', 'OUT-2025-0001', 'user-1')
        expect(movement.type).toBe('SALES_OUTWARD')
        expect(movement.reference).toBe('OUT-2025-0001')
    })

    it('should create stock movement for rental', () => {
        const movement = createStockMovement('device-1', 'RENTAL', 'Warehouse', 'OUT-2025-0002', 'user-1')
        expect(movement.type).toBe('RENTAL_OUTWARD')
    })
})
