import { describe, it, expect } from 'vitest'

/**
 * Device Validation Tests
 *
 * Tests for device data validation including category-specific field validation,
 * required fields, and data integrity rules.
 */

type DeviceCategory = 'LAPTOP' | 'DESKTOP' | 'WORKSTATION' | 'SERVER' | 'MONITOR' | 'STORAGE' | 'NETWORKING_CARD'

interface DeviceData {
    category: DeviceCategory
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
}

// Validation functions
function validateRequiredFields(data: Partial<DeviceData>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.category) {
        errors.push('Category is required')
    }
    if (!data.brand || data.brand.trim().length === 0) {
        errors.push('Brand is required')
    }
    if (!data.model || data.model.trim().length === 0) {
        errors.push('Model is required')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

function isValidCategory(category: string): category is DeviceCategory {
    const validCategories = [
        'LAPTOP', 'DESKTOP', 'WORKSTATION', 'SERVER',
        'MONITOR', 'STORAGE', 'NETWORKING_CARD'
    ]
    return validCategories.includes(category.toUpperCase().replace(' ', '_'))
}

function normalizeCategory(category: string): DeviceCategory | null {
    const normalized = category.toUpperCase().replace(/\s+/g, '_')
    if (isValidCategory(normalized)) {
        return normalized as DeviceCategory
    }
    return null
}

function getCategorySpecificFields(category: DeviceCategory): string[] {
    const fieldsByCategory: Record<DeviceCategory, string[]> = {
        LAPTOP: ['cpu', 'ram', 'ssd', 'gpu', 'screenSize'],
        DESKTOP: ['cpu', 'ram', 'ssd', 'gpu'],
        WORKSTATION: ['cpu', 'ram', 'ssd', 'gpu'],
        SERVER: ['cpu', 'ram', 'formFactor', 'raidController', 'networkPorts'],
        MONITOR: ['monitorSize', 'resolution', 'panelType', 'refreshRate', 'monitorPorts'],
        STORAGE: ['storageType', 'capacity', 'storageFormFactor', 'interface', 'rpm'],
        NETWORKING_CARD: ['nicSpeed', 'portCount', 'connectorType', 'nicInterface', 'bracketType']
    }
    return fieldsByCategory[category] || []
}

function isComputeCategory(category: DeviceCategory): boolean {
    return ['LAPTOP', 'DESKTOP', 'WORKSTATION', 'SERVER'].includes(category)
}

function validateSerial(serial: string | undefined): boolean {
    if (!serial) return true // Serial is optional
    // Serial should be alphanumeric and reasonable length
    return /^[A-Za-z0-9\-_]{3,50}$/.test(serial.trim())
}

function validateStorageRPM(storageType: string | undefined, rpm: string | undefined): { valid: boolean; warning?: string } {
    if (storageType === 'HDD' && !rpm) {
        return { valid: true, warning: 'RPM is recommended for HDD' }
    }
    if (storageType === 'SSD' && rpm) {
        return { valid: true, warning: 'RPM is not applicable for SSD' }
    }
    if (storageType === 'NVMe' && rpm) {
        return { valid: true, warning: 'RPM is not applicable for NVMe' }
    }
    return { valid: true }
}

function validateResolution(resolution: string | undefined): boolean {
    if (!resolution) return true
    // Should match format like "1920x1080" or "1920×1080"
    return /^\d{3,5}[x×]\d{3,5}$/i.test(resolution.trim())
}

function validateRefreshRate(refreshRate: string | undefined): boolean {
    if (!refreshRate) return true
    // Should contain a number and Hz
    return /^\d+\s*Hz$/i.test(refreshRate.trim())
}

describe('Required Field Validation', () => {
    describe('validateRequiredFields', () => {
        it('should pass with all required fields', () => {
            const result = validateRequiredFields({
                category: 'LAPTOP',
                brand: 'Dell',
                model: 'Latitude 5520'
            })
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should fail without category', () => {
            const result = validateRequiredFields({
                brand: 'Dell',
                model: 'Latitude 5520'
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Category is required')
        })

        it('should fail without brand', () => {
            const result = validateRequiredFields({
                category: 'LAPTOP',
                model: 'Latitude 5520'
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Brand is required')
        })

        it('should fail with empty brand', () => {
            const result = validateRequiredFields({
                category: 'LAPTOP',
                brand: '   ',
                model: 'Latitude 5520'
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Brand is required')
        })

        it('should fail without model', () => {
            const result = validateRequiredFields({
                category: 'LAPTOP',
                brand: 'Dell'
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Model is required')
        })

        it('should collect all errors', () => {
            const result = validateRequiredFields({})
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThanOrEqual(3)
        })
    })
})

describe('Category Validation', () => {
    describe('isValidCategory', () => {
        it('should accept all valid categories', () => {
            expect(isValidCategory('LAPTOP')).toBe(true)
            expect(isValidCategory('DESKTOP')).toBe(true)
            expect(isValidCategory('WORKSTATION')).toBe(true)
            expect(isValidCategory('SERVER')).toBe(true)
            expect(isValidCategory('MONITOR')).toBe(true)
            expect(isValidCategory('STORAGE')).toBe(true)
            expect(isValidCategory('NETWORKING_CARD')).toBe(true)
        })

        it('should reject invalid categories', () => {
            expect(isValidCategory('PRINTER')).toBe(false)
            expect(isValidCategory('TABLET')).toBe(false)
            expect(isValidCategory('PHONE')).toBe(false)
        })

        it('should handle case insensitivity', () => {
            expect(isValidCategory('laptop')).toBe(true)
            expect(isValidCategory('Laptop')).toBe(true)
            expect(isValidCategory('LAPTOP')).toBe(true)
        })
    })

    describe('normalizeCategory', () => {
        it('should normalize lowercase to uppercase', () => {
            expect(normalizeCategory('laptop')).toBe('LAPTOP')
        })

        it('should replace spaces with underscores', () => {
            expect(normalizeCategory('networking card')).toBe('NETWORKING_CARD')
        })

        it('should return null for invalid category', () => {
            expect(normalizeCategory('printer')).toBeNull()
        })

        it('should handle mixed case', () => {
            expect(normalizeCategory('Desktop')).toBe('DESKTOP')
        })
    })

    describe('isComputeCategory', () => {
        it('should return true for compute categories', () => {
            expect(isComputeCategory('LAPTOP')).toBe(true)
            expect(isComputeCategory('DESKTOP')).toBe(true)
            expect(isComputeCategory('WORKSTATION')).toBe(true)
            expect(isComputeCategory('SERVER')).toBe(true)
        })

        it('should return false for non-compute categories', () => {
            expect(isComputeCategory('MONITOR')).toBe(false)
            expect(isComputeCategory('STORAGE')).toBe(false)
            expect(isComputeCategory('NETWORKING_CARD')).toBe(false)
        })
    })
})

describe('Category-Specific Fields', () => {
    describe('getCategorySpecificFields', () => {
        it('should return laptop fields', () => {
            const fields = getCategorySpecificFields('LAPTOP')
            expect(fields).toContain('cpu')
            expect(fields).toContain('ram')
            expect(fields).toContain('screenSize')
        })

        it('should return server fields', () => {
            const fields = getCategorySpecificFields('SERVER')
            expect(fields).toContain('formFactor')
            expect(fields).toContain('raidController')
            expect(fields).toContain('networkPorts')
        })

        it('should return monitor fields', () => {
            const fields = getCategorySpecificFields('MONITOR')
            expect(fields).toContain('monitorSize')
            expect(fields).toContain('resolution')
            expect(fields).toContain('panelType')
            expect(fields).toContain('refreshRate')
        })

        it('should return storage fields', () => {
            const fields = getCategorySpecificFields('STORAGE')
            expect(fields).toContain('storageType')
            expect(fields).toContain('capacity')
            expect(fields).toContain('rpm')
        })

        it('should return networking card fields', () => {
            const fields = getCategorySpecificFields('NETWORKING_CARD')
            expect(fields).toContain('nicSpeed')
            expect(fields).toContain('portCount')
            expect(fields).toContain('connectorType')
        })
    })
})

describe('Serial Number Validation', () => {
    describe('validateSerial', () => {
        it('should accept valid serials', () => {
            expect(validateSerial('ABC123')).toBe(true)
            expect(validateSerial('SN-12345-XYZ')).toBe(true)
            expect(validateSerial('A1B2C3D4E5')).toBe(true)
        })

        it('should accept undefined serial (optional)', () => {
            expect(validateSerial(undefined)).toBe(true)
        })

        it('should reject too short serials', () => {
            expect(validateSerial('AB')).toBe(false)
        })

        it('should reject serials with special characters', () => {
            expect(validateSerial('ABC@123')).toBe(false)
            expect(validateSerial('ABC#123')).toBe(false)
        })
    })
})

describe('Storage Validation', () => {
    describe('validateStorageRPM', () => {
        it('should warn when HDD has no RPM', () => {
            const result = validateStorageRPM('HDD', undefined)
            expect(result.valid).toBe(true)
            expect(result.warning).toContain('RPM')
        })

        it('should warn when SSD has RPM', () => {
            const result = validateStorageRPM('SSD', '7200')
            expect(result.valid).toBe(true)
            expect(result.warning).toContain('not applicable')
        })

        it('should warn when NVMe has RPM', () => {
            const result = validateStorageRPM('NVMe', '7200')
            expect(result.valid).toBe(true)
            expect(result.warning).toContain('not applicable')
        })

        it('should pass when HDD has RPM', () => {
            const result = validateStorageRPM('HDD', '7200')
            expect(result.valid).toBe(true)
            expect(result.warning).toBeUndefined()
        })
    })
})

describe('Monitor Validation', () => {
    describe('validateResolution', () => {
        it('should accept valid resolutions', () => {
            expect(validateResolution('1920x1080')).toBe(true)
            expect(validateResolution('2560x1440')).toBe(true)
            expect(validateResolution('3840x2160')).toBe(true)
        })

        it('should accept unicode multiplication sign', () => {
            expect(validateResolution('1920×1080')).toBe(true)
        })

        it('should accept undefined (optional)', () => {
            expect(validateResolution(undefined)).toBe(true)
        })

        it('should reject invalid formats', () => {
            expect(validateResolution('1920 x 1080')).toBe(false)
            expect(validateResolution('1080p')).toBe(false)
            expect(validateResolution('Full HD')).toBe(false)
        })
    })

    describe('validateRefreshRate', () => {
        it('should accept valid refresh rates', () => {
            expect(validateRefreshRate('60Hz')).toBe(true)
            expect(validateRefreshRate('75Hz')).toBe(true)
            expect(validateRefreshRate('144Hz')).toBe(true)
            expect(validateRefreshRate('240 Hz')).toBe(true)
        })

        it('should accept undefined (optional)', () => {
            expect(validateRefreshRate(undefined)).toBe(true)
        })

        it('should reject invalid formats', () => {
            expect(validateRefreshRate('60')).toBe(false)
            expect(validateRefreshRate('sixty hertz')).toBe(false)
        })
    })
})

describe('Bulk Upload Validation', () => {
    type BulkDeviceData = {
        category: string
        brand: string
        model: string
        [key: string]: string | undefined
    }

    function validateBulkDevice(data: BulkDeviceData): { valid: boolean; errors: string[] } {
        const errors: string[] = []

        // Validate category
        const normalizedCategory = normalizeCategory(data.category)
        if (!normalizedCategory) {
            errors.push(`Invalid category: ${data.category}`)
        }

        // Validate required fields
        if (!data.brand || data.brand.trim().length === 0) {
            errors.push('Brand is required')
        }
        if (!data.model || data.model.trim().length === 0) {
            errors.push('Model is required')
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    it('should validate a valid bulk device', () => {
        const result = validateBulkDevice({
            category: 'Laptop',
            brand: 'Dell',
            model: 'Latitude 5520',
            cpu: 'Intel i7',
            ram: '16GB'
        })
        expect(result.valid).toBe(true)
    })

    it('should fail for invalid category in bulk', () => {
        const result = validateBulkDevice({
            category: 'InvalidCategory',
            brand: 'Dell',
            model: 'Latitude 5520'
        })
        expect(result.valid).toBe(false)
        expect(result.errors[0]).toContain('Invalid category')
    })

    it('should fail for missing brand in bulk', () => {
        const result = validateBulkDevice({
            category: 'Laptop',
            brand: '',
            model: 'Latitude 5520'
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Brand is required')
    })
})
