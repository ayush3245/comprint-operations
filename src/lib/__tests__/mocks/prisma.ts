import { vi } from 'vitest'

/**
 * Mock Prisma Client for testing
 *
 * This module provides a mock implementation of the Prisma client
 * that can be used in unit tests without connecting to a real database.
 */

// Mock data factories
export const mockUser = (overrides = {}) => ({
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: 'REPAIR_ENGINEER' as const,
    active: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
})

export const mockDevice = (overrides = {}) => ({
    id: 'device-1',
    barcode: 'L-DEL-1234',
    category: 'LAPTOP' as const,
    brand: 'Dell',
    model: 'Latitude 5520',
    cpu: 'Intel i7',
    ram: '16GB',
    ssd: '512GB',
    gpu: null,
    screenSize: '15.6"',
    serial: 'SN123456',
    conditionNotes: null,
    ownership: 'REFURB_STOCK' as const,
    status: 'RECEIVED' as const,
    location: null,
    grade: null,
    repairRequired: false,
    paintRequired: false,
    repairCompleted: false,
    paintCompleted: false,
    poInvoiceNo: null,
    rentalRef: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    inwardBatchId: 'batch-1',
    outwardRecordId: null,
    ...overrides
})

export const mockInwardBatch = (overrides = {}) => ({
    id: 'batch-1',
    batchId: 'BATCH-2025-0001',
    type: 'REFURB_PURCHASE' as const,
    date: new Date('2025-01-01'),
    poInvoiceNo: 'PO-001',
    supplier: 'Acme Corp',
    customer: null,
    rentalRef: null,
    emailSubject: null,
    emailThreadId: null,
    createdById: 'user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
})

export const mockRepairJob = (overrides = {}) => ({
    id: 'job-1',
    jobId: 'JOB-2025-0001',
    deviceId: 'device-1',
    inspectionEngId: 'user-inspector',
    repairEngId: null,
    reportedIssues: '{"functional": "Screen flickering", "cosmetic": ""}',
    rootCause: null,
    sparesRequired: null,
    sparesIssued: null,
    station: null,
    repairStartDate: null,
    repairEndDate: null,
    tatDueDate: null,
    status: 'READY_FOR_REPAIR' as const,
    notes: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
})

export const mockPaintPanel = (overrides = {}) => ({
    id: 'panel-1',
    deviceId: 'device-1',
    panelType: 'Top Cover',
    status: 'AWAITING_PAINT' as const,
    technicianId: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
})

export const mockQCRecord = (overrides = {}) => ({
    id: 'qc-1',
    deviceId: 'device-1',
    qcEngId: 'user-qc',
    inspectionEngName: 'Inspector Name',
    repairEngName: 'Repair Engineer Name',
    checklistResults: '{"functional": {}, "cosmetic": {}}',
    attachments: null,
    remarks: '',
    finalGrade: 'A' as const,
    status: 'PASSED' as const,
    completedAt: new Date('2025-01-01'),
    ...overrides
})

export const mockOutwardRecord = (overrides = {}) => ({
    id: 'outward-1',
    outwardId: 'OUT-2025-0001',
    type: 'SALES' as const,
    customer: 'Customer Corp',
    reference: 'INV-001',
    date: new Date('2025-01-01'),
    shippingDetails: 'FedEx - 123456789',
    packedById: 'user-1',
    checkedById: 'user-2',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
})

export const mockSparePart = (overrides = {}) => ({
    id: 'spare-1',
    partCode: 'KB-DELL-001',
    description: 'Dell Laptop Keyboard',
    category: 'Keyboard',
    compatibleModels: 'Latitude 5520, Latitude 5530',
    minStock: 5,
    maxStock: 50,
    currentStock: 20,
    binLocation: 'A-1-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
})

export const mockActivityLog = (overrides = {}) => ({
    id: 'log-1',
    action: 'CREATED_INWARD',
    details: 'Created batch BATCH-2025-0001',
    userId: 'user-1',
    metadata: '{"batchId": "batch-1"}',
    createdAt: new Date('2025-01-01'),
    ...overrides
})

export const mockStockMovement = (overrides = {}) => ({
    id: 'movement-1',
    deviceId: 'device-1',
    type: 'INWARD' as const,
    fromLocation: null,
    toLocation: 'Receiving Area',
    reference: 'BATCH-2025-0001',
    userId: 'user-1',
    date: new Date('2025-01-01'),
    ...overrides
})

// Mock Prisma client
export const createMockPrismaClient = () => ({
    user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    device: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    inwardBatch: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    repairJob: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    paintPanel: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    qCRecord: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    outwardRecord: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    sparePart: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    stockMovement: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    activityLog: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    $transaction: vi.fn(callback => callback(createMockPrismaClient())),
    $connect: vi.fn(),
    $disconnect: vi.fn()
})

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>
