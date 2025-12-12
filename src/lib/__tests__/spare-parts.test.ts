import { describe, it, expect } from 'vitest'

/**
 * Spare Parts Management Tests
 *
 * Tests for spare parts inventory logic including stock management,
 * issuance validation, and low stock alerts.
 */

// Pure logic functions for spare parts management
function validatePartCode(partCode: string): boolean {
    // Part code should be non-empty and uppercase with allowed characters
    if (!partCode || partCode.trim().length === 0) return false
    // Allow alphanumeric, hyphens, and underscores
    return /^[A-Z0-9\-_]+$/i.test(partCode.trim())
}

function calculateNewStock(currentStock: number, adjustment: number): number {
    return currentStock + adjustment
}

function isValidStockAdjustment(currentStock: number, adjustment: number): boolean {
    const newStock = calculateNewStock(currentStock, adjustment)
    return newStock >= 0
}

function isLowStock(currentStock: number, minStock: number): boolean {
    return currentStock <= minStock
}

function isOverstock(currentStock: number, maxStock: number): boolean {
    return currentStock > maxStock
}

function getStockStatus(
    currentStock: number,
    minStock: number,
    maxStock: number
): 'LOW' | 'NORMAL' | 'OVERSTOCK' {
    if (isLowStock(currentStock, minStock)) return 'LOW'
    if (isOverstock(currentStock, maxStock)) return 'OVERSTOCK'
    return 'NORMAL'
}

function validateStockLevels(
    minStock: number,
    maxStock: number,
    currentStock: number
): { valid: boolean; error?: string } {
    if (minStock < 0) {
        return { valid: false, error: 'Minimum stock cannot be negative' }
    }
    if (maxStock < 0) {
        return { valid: false, error: 'Maximum stock cannot be negative' }
    }
    if (currentStock < 0) {
        return { valid: false, error: 'Current stock cannot be negative' }
    }
    if (minStock > maxStock) {
        return { valid: false, error: 'Minimum stock cannot exceed maximum stock' }
    }
    return { valid: true }
}

function canIssuePart(availableStock: number, requestedQuantity: number): boolean {
    return availableStock >= requestedQuantity && requestedQuantity > 0
}

function formatBinLocation(rack: string, shelf: string, position: string): string {
    return `${rack.toUpperCase()}-${shelf}-${position}`
}

function parseBinLocation(binLocation: string): { rack: string; shelf: string; position: string } | null {
    const parts = binLocation.split('-')
    if (parts.length !== 3) return null
    return {
        rack: parts[0],
        shelf: parts[1],
        position: parts[2]
    }
}

describe('Spare Parts Validation', () => {
    describe('validatePartCode', () => {
        it('should accept valid part codes', () => {
            expect(validatePartCode('KB-DELL-001')).toBe(true)
            expect(validatePartCode('SCR_M2_001')).toBe(true)
            expect(validatePartCode('RAM16GB')).toBe(true)
        })

        it('should reject empty part codes', () => {
            expect(validatePartCode('')).toBe(false)
            expect(validatePartCode('   ')).toBe(false)
        })

        it('should handle special characters in part codes', () => {
            // These might be invalid depending on business rules
            expect(validatePartCode('KB-DELL-001')).toBe(true)
            expect(validatePartCode('PART_001_A')).toBe(true)
        })
    })

    describe('validateStockLevels', () => {
        it('should accept valid stock levels', () => {
            const result = validateStockLevels(5, 100, 50)
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it('should reject negative minimum stock', () => {
            const result = validateStockLevels(-1, 100, 50)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('Minimum')
        })

        it('should reject negative maximum stock', () => {
            const result = validateStockLevels(0, -1, 50)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('Maximum')
        })

        it('should reject negative current stock', () => {
            const result = validateStockLevels(0, 100, -1)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('Current')
        })

        it('should reject min > max', () => {
            const result = validateStockLevels(100, 50, 25)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('exceed')
        })

        it('should accept min = max', () => {
            const result = validateStockLevels(50, 50, 50)
            expect(result.valid).toBe(true)
        })

        it('should accept zero values', () => {
            const result = validateStockLevels(0, 100, 0)
            expect(result.valid).toBe(true)
        })
    })
})

describe('Stock Calculations', () => {
    describe('calculateNewStock', () => {
        it('should add positive adjustment', () => {
            expect(calculateNewStock(10, 5)).toBe(15)
        })

        it('should subtract negative adjustment', () => {
            expect(calculateNewStock(10, -3)).toBe(7)
        })

        it('should handle zero adjustment', () => {
            expect(calculateNewStock(10, 0)).toBe(10)
        })

        it('should handle zero current stock', () => {
            expect(calculateNewStock(0, 5)).toBe(5)
        })
    })

    describe('isValidStockAdjustment', () => {
        it('should accept adjustment that keeps stock positive', () => {
            expect(isValidStockAdjustment(10, -5)).toBe(true)
        })

        it('should accept adjustment that brings stock to zero', () => {
            expect(isValidStockAdjustment(10, -10)).toBe(true)
        })

        it('should reject adjustment that makes stock negative', () => {
            expect(isValidStockAdjustment(10, -11)).toBe(false)
        })

        it('should always accept positive adjustments', () => {
            expect(isValidStockAdjustment(0, 100)).toBe(true)
            expect(isValidStockAdjustment(50, 50)).toBe(true)
        })
    })
})

describe('Stock Status', () => {
    describe('isLowStock', () => {
        it('should return true when stock at minimum', () => {
            expect(isLowStock(5, 5)).toBe(true)
        })

        it('should return true when stock below minimum', () => {
            expect(isLowStock(3, 5)).toBe(true)
        })

        it('should return false when stock above minimum', () => {
            expect(isLowStock(10, 5)).toBe(false)
        })

        it('should handle zero minimum', () => {
            expect(isLowStock(0, 0)).toBe(true)
            expect(isLowStock(1, 0)).toBe(false)
        })
    })

    describe('isOverstock', () => {
        it('should return true when stock exceeds maximum', () => {
            expect(isOverstock(101, 100)).toBe(true)
        })

        it('should return false when stock at maximum', () => {
            expect(isOverstock(100, 100)).toBe(false)
        })

        it('should return false when stock below maximum', () => {
            expect(isOverstock(50, 100)).toBe(false)
        })
    })

    describe('getStockStatus', () => {
        it('should return LOW when at or below minimum', () => {
            expect(getStockStatus(5, 5, 100)).toBe('LOW')
            expect(getStockStatus(3, 5, 100)).toBe('LOW')
        })

        it('should return OVERSTOCK when above maximum', () => {
            expect(getStockStatus(101, 5, 100)).toBe('OVERSTOCK')
        })

        it('should return NORMAL when between min and max', () => {
            expect(getStockStatus(50, 5, 100)).toBe('NORMAL')
        })

        it('should return NORMAL when at maximum', () => {
            expect(getStockStatus(100, 5, 100)).toBe('NORMAL')
        })

        it('should return NORMAL just above minimum', () => {
            expect(getStockStatus(6, 5, 100)).toBe('NORMAL')
        })
    })
})

describe('Part Issuance', () => {
    describe('canIssuePart', () => {
        it('should allow issuing when stock is sufficient', () => {
            expect(canIssuePart(10, 5)).toBe(true)
        })

        it('should allow issuing exact stock', () => {
            expect(canIssuePart(10, 10)).toBe(true)
        })

        it('should reject issuing more than available', () => {
            expect(canIssuePart(10, 11)).toBe(false)
        })

        it('should reject zero quantity', () => {
            expect(canIssuePart(10, 0)).toBe(false)
        })

        it('should reject negative quantity', () => {
            expect(canIssuePart(10, -1)).toBe(false)
        })

        it('should reject issuing from zero stock', () => {
            expect(canIssuePart(0, 1)).toBe(false)
        })
    })
})

describe('Bin Location', () => {
    describe('formatBinLocation', () => {
        it('should format bin location correctly', () => {
            expect(formatBinLocation('a', '1', '1')).toBe('A-1-1')
            expect(formatBinLocation('B', '2', '3')).toBe('B-2-3')
        })

        it('should uppercase rack identifier', () => {
            expect(formatBinLocation('c', '1', '1')).toBe('C-1-1')
        })
    })

    describe('parseBinLocation', () => {
        it('should parse valid bin location', () => {
            const result = parseBinLocation('A-1-1')
            expect(result).toEqual({
                rack: 'A',
                shelf: '1',
                position: '1'
            })
        })

        it('should handle complex shelf/position identifiers', () => {
            const result = parseBinLocation('B-12-34')
            expect(result).toEqual({
                rack: 'B',
                shelf: '12',
                position: '34'
            })
        })

        it('should return null for invalid format', () => {
            expect(parseBinLocation('A-1')).toBeNull()
            expect(parseBinLocation('A-1-1-1')).toBeNull()
            expect(parseBinLocation('A11')).toBeNull()
        })
    })
})

describe('Compatible Models', () => {
    function parseCompatibleModels(models: string | null): string[] {
        if (!models) return []
        return models.split(',').map(m => m.trim()).filter(m => m.length > 0)
    }

    function isCompatible(deviceModel: string, compatibleModels: string | null): boolean {
        const models = parseCompatibleModels(compatibleModels)
        if (models.length === 0) return true // No restrictions
        return models.some(m =>
            deviceModel.toLowerCase().includes(m.toLowerCase()) ||
            m.toLowerCase().includes(deviceModel.toLowerCase())
        )
    }

    describe('parseCompatibleModels', () => {
        it('should parse comma-separated models', () => {
            const result = parseCompatibleModels('Latitude 5520, Latitude 5530, Latitude 5540')
            expect(result).toEqual(['Latitude 5520', 'Latitude 5530', 'Latitude 5540'])
        })

        it('should trim whitespace', () => {
            const result = parseCompatibleModels('  Model A  ,  Model B  ')
            expect(result).toEqual(['Model A', 'Model B'])
        })

        it('should handle null', () => {
            expect(parseCompatibleModels(null)).toEqual([])
        })

        it('should filter empty strings', () => {
            const result = parseCompatibleModels('Model A, , Model B')
            expect(result).toEqual(['Model A', 'Model B'])
        })
    })

    describe('isCompatible', () => {
        it('should match exact model', () => {
            expect(isCompatible('Latitude 5520', 'Latitude 5520, Latitude 5530')).toBe(true)
        })

        it('should match partial model', () => {
            expect(isCompatible('Latitude 5520', 'Latitude, ThinkPad')).toBe(true)
        })

        it('should return true for null compatible models', () => {
            expect(isCompatible('Any Model', null)).toBe(true)
        })

        it('should return false for incompatible model', () => {
            expect(isCompatible('ThinkPad T480', 'Latitude 5520, Latitude 5530')).toBe(false)
        })

        it('should be case insensitive', () => {
            expect(isCompatible('LATITUDE 5520', 'latitude 5520')).toBe(true)
        })
    })
})
