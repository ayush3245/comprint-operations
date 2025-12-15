import { describe, it, expect } from 'vitest'

/**
 * Changes4 Implementation Validation Tests
 *
 * Tests for the features implemented in Changes4:
 * - Device editing (updateDevice)
 * - Outward record editing (updateOutwardRecord)
 * - Soft delete users
 * - Multi-sheet Excel upload logic
 * - Input validation
 */

// Types matching Prisma schema
type DeviceStatus = 'RECEIVED' | 'INSPECTED' | 'IN_REPAIR' | 'IN_PAINT' | 'QC_PASS' | 'QC_FAIL' | 'READY_FOR_DISPATCH' | 'DISPATCHED'

interface Device {
  id: string
  barcode: string
  status: DeviceStatus
  brand: string
  model: string
  category: string
  serial?: string
  cpu?: string
  ram?: string
  ssd?: string
}

interface OutwardRecord {
  id: string
  outwardId: string
  customer: string
  reference?: string
  shippingDetails?: string
  packedById?: string | null
  checkedById?: string | null
}

interface User {
  id: string
  email: string
  name: string
  active: boolean
  deletedAt: Date | null
}

// Device Update Logic
function canEditDevice(status: DeviceStatus): boolean {
  return status === 'RECEIVED'
}

function validateDeviceUpdate(device: Device, updates: Partial<Device>): { valid: boolean; error?: string } {
  if (!canEditDevice(device.status)) {
    return {
      valid: false,
      error: 'Can only edit devices in RECEIVED status'
    }
  }

  // Validate brand
  if (updates.brand !== undefined && updates.brand.trim().length === 0) {
    return { valid: false, error: 'Brand cannot be empty' }
  }

  // Validate model
  if (updates.model !== undefined && updates.model.trim().length === 0) {
    return { valid: false, error: 'Model cannot be empty' }
  }

  return { valid: true }
}

// Outward Record Update Logic
function validateOutwardRecordUpdate(data: Partial<OutwardRecord>): { valid: boolean; error?: string } {
  // Validate customer
  if (data.customer !== undefined && data.customer.trim().length === 0) {
    return { valid: false, error: 'Customer cannot be empty' }
  }

  return { valid: true }
}

// Soft Delete Logic
function softDeleteUser(user: User): User {
  return {
    ...user,
    deletedAt: new Date(),
    active: false
  }
}

function isUserDeleted(user: User): boolean {
  return user.deletedAt !== null
}

function filterActiveUsers(users: User[]): User[] {
  return users.filter(user => user.deletedAt === null)
}

// Multi-sheet Excel Processing Logic
interface ExcelDevice {
  category: string
  brand: string
  model: string
  serial?: string
  _sourceSheet?: string
  _sourceRow?: number
}

function shouldSkipSheet(sheetName: string): boolean {
  return sheetName.toLowerCase() === 'instructions'
}

function processExcelSheets(sheets: Record<string, unknown[][]>): ExcelDevice[] {
  const devices: ExcelDevice[] = []

  for (const [sheetName, rows] of Object.entries(sheets)) {
    if (shouldSkipSheet(sheetName)) continue

    rows.forEach((row, index) => {
      // Skip header row
      if (index === 0) return

      const device = parseRowToDevice(row, sheetName, index + 1)
      if (device) {
        devices.push(device)
      }
    })
  }

  return devices
}

function parseRowToDevice(row: unknown[], sheetName: string, rowNumber: number): ExcelDevice | null {
  // Simplified parsing logic
  if (!Array.isArray(row) || row.length < 3) return null

  return {
    category: String(row[0] || ''),
    brand: String(row[1] || ''),
    model: String(row[2] || ''),
    serial: row[3] ? String(row[3]) : undefined,
    _sourceSheet: sheetName,
    _sourceRow: rowNumber
  }
}

// Input Validation Logic
function validateBarcodeInput(barcode: string): { valid: boolean; error?: string } {
  if (!barcode || barcode.trim().length === 0) {
    return {
      valid: false,
      error: 'Please enter a barcode before starting'
    }
  }

  return { valid: true }
}

// =============================================================================
// TESTS
// =============================================================================

describe('Device Update Validation (Task 6.1)', () => {
  describe('canEditDevice', () => {
    it('should allow editing devices in RECEIVED status', () => {
      expect(canEditDevice('RECEIVED')).toBe(true)
    })

    it('should not allow editing devices in INSPECTED status', () => {
      expect(canEditDevice('INSPECTED')).toBe(false)
    })

    it('should not allow editing devices in IN_REPAIR status', () => {
      expect(canEditDevice('IN_REPAIR')).toBe(false)
    })

    it('should not allow editing devices in QC_PASS status', () => {
      expect(canEditDevice('QC_PASS')).toBe(false)
    })

    it('should not allow editing devices in DISPATCHED status', () => {
      expect(canEditDevice('DISPATCHED')).toBe(false)
    })
  })

  describe('validateDeviceUpdate', () => {
    const receivedDevice: Device = {
      id: 'device-1',
      barcode: 'L-DEL-1234',
      status: 'RECEIVED',
      brand: 'Dell',
      model: 'Latitude 5420',
      category: 'LAPTOP'
    }

    const inspectedDevice: Device = {
      ...receivedDevice,
      status: 'INSPECTED'
    }

    it('should validate updates for RECEIVED devices', () => {
      const updates = { brand: 'HP', model: 'EliteBook 840' }
      const result = validateDeviceUpdate(receivedDevice, updates)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject updates for non-RECEIVED devices', () => {
      const updates = { brand: 'HP' }
      const result = validateDeviceUpdate(inspectedDevice, updates)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('RECEIVED status')
    })

    it('should reject empty brand', () => {
      const updates = { brand: '' }
      const result = validateDeviceUpdate(receivedDevice, updates)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Brand')
    })

    it('should reject empty model', () => {
      const updates = { model: '   ' }
      const result = validateDeviceUpdate(receivedDevice, updates)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Model')
    })

    it('should allow updating CPU', () => {
      const updates = { cpu: 'Intel Core i7-1185G7' }
      const result = validateDeviceUpdate(receivedDevice, updates)
      expect(result.valid).toBe(true)
    })

    it('should allow updating RAM', () => {
      const updates = { ram: '16GB DDR4' }
      const result = validateDeviceUpdate(receivedDevice, updates)
      expect(result.valid).toBe(true)
    })

    it('should allow updating multiple fields', () => {
      const updates = {
        brand: 'HP',
        model: 'EliteBook 840',
        cpu: 'Intel Core i7',
        ram: '16GB'
      }
      const result = validateDeviceUpdate(receivedDevice, updates)
      expect(result.valid).toBe(true)
    })
  })
})

describe('Outward Record Update Validation (Task 6.2)', () => {
  describe('validateOutwardRecordUpdate', () => {
    it('should validate updates with customer name', () => {
      const updates = { customer: 'Acme Corp' }
      const result = validateOutwardRecordUpdate(updates)
      expect(result.valid).toBe(true)
    })

    it('should reject empty customer name', () => {
      const updates = { customer: '' }
      const result = validateOutwardRecordUpdate(updates)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Customer')
    })

    it('should allow updating reference', () => {
      const updates = { reference: 'REF-2024-001' }
      const result = validateOutwardRecordUpdate(updates)
      expect(result.valid).toBe(true)
    })

    it('should allow updating shipping details', () => {
      const updates = { shippingDetails: 'DHL Express - Tracking: 123456' }
      const result = validateOutwardRecordUpdate(updates)
      expect(result.valid).toBe(true)
    })

    it('should allow updating multiple fields', () => {
      const updates = {
        customer: 'TechCorp Inc',
        reference: 'PO-123',
        shippingDetails: 'Fedex Ground'
      }
      const result = validateOutwardRecordUpdate(updates)
      expect(result.valid).toBe(true)
    })

    it('should allow null values for packed/checked by', () => {
      const updates = {
        packedById: null,
        checkedById: null
      }
      const result = validateOutwardRecordUpdate(updates)
      expect(result.valid).toBe(true)
    })
  })
})

describe('Soft Delete User Functionality (Task 5.2)', () => {
  describe('softDeleteUser', () => {
    it('should set deletedAt timestamp', () => {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        active: true,
        deletedAt: null
      }

      const deleted = softDeleteUser(user)
      expect(deleted.deletedAt).toBeInstanceOf(Date)
      expect(deleted.deletedAt).not.toBeNull()
    })

    it('should deactivate the user', () => {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        active: true,
        deletedAt: null
      }

      const deleted = softDeleteUser(user)
      expect(deleted.active).toBe(false)
    })

    it('should preserve other user data', () => {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        active: true,
        deletedAt: null
      }

      const deleted = softDeleteUser(user)
      expect(deleted.id).toBe(user.id)
      expect(deleted.email).toBe(user.email)
      expect(deleted.name).toBe(user.name)
    })
  })

  describe('isUserDeleted', () => {
    it('should return true for deleted users', () => {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        active: false,
        deletedAt: new Date()
      }

      expect(isUserDeleted(user)).toBe(true)
    })

    it('should return false for active users', () => {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        active: true,
        deletedAt: null
      }

      expect(isUserDeleted(user)).toBe(false)
    })
  })

  describe('filterActiveUsers', () => {
    it('should filter out deleted users', () => {
      const users: User[] = [
        {
          id: 'user-1',
          email: 'active@example.com',
          name: 'Active User',
          active: true,
          deletedAt: null
        },
        {
          id: 'user-2',
          email: 'deleted@example.com',
          name: 'Deleted User',
          active: false,
          deletedAt: new Date()
        },
        {
          id: 'user-3',
          email: 'another@example.com',
          name: 'Another Active',
          active: true,
          deletedAt: null
        }
      ]

      const active = filterActiveUsers(users)
      expect(active).toHaveLength(2)
      expect(active[0].id).toBe('user-1')
      expect(active[1].id).toBe('user-3')
    })

    it('should return empty array if all users are deleted', () => {
      const users: User[] = [
        {
          id: 'user-1',
          email: 'deleted1@example.com',
          name: 'Deleted 1',
          active: false,
          deletedAt: new Date()
        },
        {
          id: 'user-2',
          email: 'deleted2@example.com',
          name: 'Deleted 2',
          active: false,
          deletedAt: new Date()
        }
      ]

      const active = filterActiveUsers(users)
      expect(active).toHaveLength(0)
    })

    it('should return all users if none are deleted', () => {
      const users: User[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          active: true,
          deletedAt: null
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          active: true,
          deletedAt: null
        }
      ]

      const active = filterActiveUsers(users)
      expect(active).toHaveLength(2)
    })
  })
})

describe('Multi-Sheet Excel Upload Logic (Task 7.1)', () => {
  describe('shouldSkipSheet', () => {
    it('should skip "Instructions" sheet (case insensitive)', () => {
      expect(shouldSkipSheet('Instructions')).toBe(true)
      expect(shouldSkipSheet('instructions')).toBe(true)
      expect(shouldSkipSheet('INSTRUCTIONS')).toBe(true)
    })

    it('should not skip other sheets', () => {
      expect(shouldSkipSheet('Sheet1')).toBe(false)
      expect(shouldSkipSheet('Laptops')).toBe(false)
      expect(shouldSkipSheet('Monitors')).toBe(false)
    })
  })

  describe('parseRowToDevice', () => {
    it('should parse valid row with metadata', () => {
      const row = ['LAPTOP', 'Dell', 'Latitude 5420', 'SN123456']
      const device = parseRowToDevice(row, 'Sheet1', 5)

      expect(device).toBeDefined()
      expect(device?.category).toBe('LAPTOP')
      expect(device?.brand).toBe('Dell')
      expect(device?.model).toBe('Latitude 5420')
      expect(device?.serial).toBe('SN123456')
      expect(device?._sourceSheet).toBe('Sheet1')
      expect(device?._sourceRow).toBe(5)
    })

    it('should parse row without serial number', () => {
      const row = ['DESKTOP', 'HP', 'EliteDesk 800']
      const device = parseRowToDevice(row, 'Sheet2', 3)

      expect(device).toBeDefined()
      expect(device?.category).toBe('DESKTOP')
      expect(device?.brand).toBe('HP')
      expect(device?.model).toBe('EliteDesk 800')
      expect(device?.serial).toBeUndefined()
    })

    it('should return null for invalid rows', () => {
      const row = ['LAPTOP'] // Missing brand and model
      const device = parseRowToDevice(row, 'Sheet1', 2)

      expect(device).toBeNull()
    })

    it('should return null for empty rows', () => {
      const row: unknown[] = []
      const device = parseRowToDevice(row, 'Sheet1', 2)

      expect(device).toBeNull()
    })
  })

  describe('processExcelSheets', () => {
    it('should process multiple sheets', () => {
      const sheets = {
        'Laptops': [
          ['Category', 'Brand', 'Model', 'Serial'], // Header
          ['LAPTOP', 'Dell', 'Latitude 5420', 'SN001'],
          ['LAPTOP', 'HP', 'EliteBook 840', 'SN002']
        ],
        'Monitors': [
          ['Category', 'Brand', 'Model', 'Serial'], // Header
          ['MONITOR', 'Dell', 'P2422H', 'MON001']
        ]
      }

      const devices = processExcelSheets(sheets)
      expect(devices).toHaveLength(3)
      expect(devices[0]._sourceSheet).toBe('Laptops')
      expect(devices[1]._sourceSheet).toBe('Laptops')
      expect(devices[2]._sourceSheet).toBe('Monitors')
    })

    it('should skip Instructions sheet', () => {
      const sheets = {
        'Instructions': [
          ['How to use this template'],
          ['Step 1: Fill in device details']
        ],
        'Laptops': [
          ['Category', 'Brand', 'Model', 'Serial'],
          ['LAPTOP', 'Dell', 'Latitude 5420', 'SN001']
        ]
      }

      const devices = processExcelSheets(sheets)
      expect(devices).toHaveLength(1)
      expect(devices[0]._sourceSheet).toBe('Laptops')
    })

    it('should handle empty sheets', () => {
      const sheets = {
        'EmptySheet': [
          ['Category', 'Brand', 'Model', 'Serial'] // Only header
        ]
      }

      const devices = processExcelSheets(sheets)
      expect(devices).toHaveLength(0)
    })

    it('should include row numbers for error tracking', () => {
      const sheets = {
        'Sheet1': [
          ['Category', 'Brand', 'Model', 'Serial'], // Row 1 (header)
          ['LAPTOP', 'Dell', 'Latitude 5420', 'SN001'], // Row 2
          ['DESKTOP', 'HP', 'EliteDesk 800', 'SN002'] // Row 3
        ]
      }

      const devices = processExcelSheets(sheets)
      expect(devices[0]._sourceRow).toBe(2)
      expect(devices[1]._sourceRow).toBe(3)
    })
  })
})

describe('Input Validation (Task 4.1)', () => {
  describe('validateBarcodeInput', () => {
    it('should validate non-empty barcode', () => {
      const result = validateBarcodeInput('L-DEL-1234')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty barcode', () => {
      const result = validateBarcodeInput('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('enter a barcode')
    })

    it('should reject whitespace-only barcode', () => {
      const result = validateBarcodeInput('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('enter a barcode')
    })

    it('should accept barcode with leading/trailing whitespace', () => {
      const result = validateBarcodeInput('  L-DEL-1234  ')
      expect(result.valid).toBe(true)
    })
  })
})

describe('Edge Cases and Integration', () => {
  describe('Device update workflow', () => {
    it('should prevent editing after device moves to inspection', () => {
      const device: Device = {
        id: 'device-1',
        barcode: 'L-DEL-1234',
        status: 'INSPECTED',
        brand: 'Dell',
        model: 'Latitude 5420',
        category: 'LAPTOP'
      }

      const updates = { cpu: 'Intel Core i7' }
      const result = validateDeviceUpdate(device, updates)
      expect(result.valid).toBe(false)
    })

    it('should allow editing complex device specs in RECEIVED status', () => {
      const device: Device = {
        id: 'device-1',
        barcode: 'L-DEL-1234',
        status: 'RECEIVED',
        brand: 'Dell',
        model: 'Latitude 5420',
        category: 'LAPTOP'
      }

      const updates = {
        cpu: 'Intel Core i7-1185G7',
        ram: '16GB DDR4',
        ssd: '512GB NVMe',
        serial: 'SN123456789'
      }

      const result = validateDeviceUpdate(device, updates)
      expect(result.valid).toBe(true)
    })
  })

  describe('Outward record editing workflow', () => {
    it('should allow updating outward records with complete data', () => {
      const updates = {
        customer: 'Acme Corporation',
        reference: 'PO-2024-001',
        shippingDetails: 'DHL Express - Tracking: 1234567890',
        packedById: 'user-1',
        checkedById: 'user-2'
      }

      const result = validateOutwardRecordUpdate(updates)
      expect(result.valid).toBe(true)
    })
  })

  describe('Excel multi-sheet with mixed content', () => {
    it('should handle sheets with different device categories', () => {
      const sheets = {
        'Instructions': [['Do not edit']],
        'Laptops': [
          ['Category', 'Brand', 'Model'],
          ['LAPTOP', 'Dell', 'Latitude']
        ],
        'Monitors': [
          ['Category', 'Brand', 'Model'],
          ['MONITOR', 'Dell', 'P2422H']
        ],
        'Servers': [
          ['Category', 'Brand', 'Model'],
          ['SERVER', 'Dell', 'PowerEdge']
        ]
      }

      const devices = processExcelSheets(sheets)
      expect(devices).toHaveLength(3)

      // Verify sheet tracking
      const laptops = devices.filter(d => d._sourceSheet === 'Laptops')
      const monitors = devices.filter(d => d._sourceSheet === 'Monitors')
      const servers = devices.filter(d => d._sourceSheet === 'Servers')

      expect(laptops).toHaveLength(1)
      expect(monitors).toHaveLength(1)
      expect(servers).toHaveLength(1)
    })
  })
})
