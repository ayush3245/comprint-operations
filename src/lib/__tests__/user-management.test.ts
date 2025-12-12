import { describe, it, expect } from 'vitest'

/**
 * User Management Tests
 *
 * Tests for user management logic including role validation,
 * permission checks, and self-action prevention.
 */

type Role =
    | 'SUPERADMIN'
    | 'ADMIN'
    | 'MIS_WAREHOUSE_EXECUTIVE'
    | 'WAREHOUSE_MANAGER'
    | 'INSPECTION_ENGINEER'
    | 'REPAIR_ENGINEER'
    | 'PAINT_SHOP_TECHNICIAN'
    | 'QC_ENGINEER'

interface User {
    id: string
    email: string
    name: string
    role: Role
    active: boolean
}

// User validation functions
function validateEmail(email: string): boolean {
    if (!email || email.trim().length === 0) return false
    // Simple email regex - should match most valid emails
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())
}

function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password) {
        return { valid: false, error: 'Password is required' }
    }
    if (password.length < 6) {
        return { valid: false, error: 'Password must be at least 6 characters' }
    }
    return { valid: true }
}

function validateName(name: string): boolean {
    if (!name || name.trim().length === 0) return false
    return name.trim().length >= 2
}

function isValidRole(role: string): role is Role {
    const validRoles = [
        'SUPERADMIN', 'ADMIN', 'MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER',
        'INSPECTION_ENGINEER', 'REPAIR_ENGINEER', 'PAINT_SHOP_TECHNICIAN', 'QC_ENGINEER'
    ]
    return validRoles.includes(role)
}

function canAccessAllFeatures(role: Role): boolean {
    return role === 'SUPERADMIN'
}

function canManageUsers(role: Role): boolean {
    return role === 'SUPERADMIN'
}

function canSelfDeactivate(currentUserId: string, targetUserId: string): boolean {
    return currentUserId !== targetUserId
}

function canSelfChangeRole(currentUserId: string, targetUserId: string): boolean {
    return currentUserId !== targetUserId
}

function canDeleteUser(currentUserId: string, targetUserId: string): boolean {
    return currentUserId !== targetUserId
}

function getRoleDisplayName(role: Role): string {
    const displayNames: Record<Role, string> = {
        SUPERADMIN: 'Super Admin',
        ADMIN: 'Admin',
        MIS_WAREHOUSE_EXECUTIVE: 'MIS/Warehouse Executive',
        WAREHOUSE_MANAGER: 'Warehouse Manager',
        INSPECTION_ENGINEER: 'Inspection Engineer',
        REPAIR_ENGINEER: 'Repair Engineer',
        PAINT_SHOP_TECHNICIAN: 'Paint Shop Technician',
        QC_ENGINEER: 'QC Engineer'
    }
    return displayNames[role]
}

function getModuleAccessByRole(role: Role): string[] {
    const moduleAccess: Record<Role, string[]> = {
        SUPERADMIN: ['*'], // All modules
        ADMIN: ['dashboard', 'inward', 'inspection', 'repair', 'paint', 'qc', 'outward', 'inventory', 'spares', 'reports'],
        MIS_WAREHOUSE_EXECUTIVE: ['dashboard', 'inward', 'inventory'],
        WAREHOUSE_MANAGER: ['dashboard', 'inventory', 'outward', 'spares', 'reports'],
        INSPECTION_ENGINEER: ['dashboard', 'inspection'],
        REPAIR_ENGINEER: ['dashboard', 'repair'],
        PAINT_SHOP_TECHNICIAN: ['dashboard', 'paint'],
        QC_ENGINEER: ['dashboard', 'qc']
    }
    return moduleAccess[role]
}

function canAccessModule(role: Role, module: string): boolean {
    const access = getModuleAccessByRole(role)
    if (access.includes('*')) return true
    return access.includes(module)
}

describe('Email Validation', () => {
    describe('validateEmail', () => {
        it('should accept valid emails', () => {
            expect(validateEmail('test@example.com')).toBe(true)
            expect(validateEmail('user.name@domain.org')).toBe(true)
            expect(validateEmail('user+tag@domain.co.uk')).toBe(true)
        })

        it('should reject invalid emails', () => {
            expect(validateEmail('')).toBe(false)
            expect(validateEmail('invalid')).toBe(false)
            expect(validateEmail('invalid@')).toBe(false)
            expect(validateEmail('@domain.com')).toBe(false)
            expect(validateEmail('test @example.com')).toBe(false)
        })

        it('should handle whitespace', () => {
            expect(validateEmail('  test@example.com  ')).toBe(true)
            expect(validateEmail('   ')).toBe(false)
        })

        it('should be case insensitive', () => {
            expect(validateEmail('TEST@EXAMPLE.COM')).toBe(true)
            expect(validateEmail('Test@Example.COM')).toBe(true)
        })
    })
})

describe('Password Validation', () => {
    describe('validatePassword', () => {
        it('should accept valid passwords', () => {
            const result = validatePassword('password123')
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it('should accept exactly 6 characters', () => {
            const result = validatePassword('123456')
            expect(result.valid).toBe(true)
        })

        it('should reject short passwords', () => {
            const result = validatePassword('12345')
            expect(result.valid).toBe(false)
            expect(result.error).toContain('at least 6')
        })

        it('should reject empty passwords', () => {
            const result = validatePassword('')
            expect(result.valid).toBe(false)
            expect(result.error).toContain('required')
        })

        it('should accept long passwords', () => {
            const result = validatePassword('a'.repeat(100))
            expect(result.valid).toBe(true)
        })

        it('should accept special characters', () => {
            const result = validatePassword('p@$$w0rd!')
            expect(result.valid).toBe(true)
        })
    })
})

describe('Name Validation', () => {
    describe('validateName', () => {
        it('should accept valid names', () => {
            expect(validateName('John Doe')).toBe(true)
            expect(validateName('AB')).toBe(true)
        })

        it('should reject empty names', () => {
            expect(validateName('')).toBe(false)
            expect(validateName('   ')).toBe(false)
        })

        it('should reject single character names', () => {
            expect(validateName('A')).toBe(false)
        })
    })
})

describe('Role Validation', () => {
    describe('isValidRole', () => {
        it('should accept all valid roles', () => {
            const roles = [
                'SUPERADMIN', 'ADMIN', 'MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER',
                'INSPECTION_ENGINEER', 'REPAIR_ENGINEER', 'PAINT_SHOP_TECHNICIAN', 'QC_ENGINEER'
            ]
            roles.forEach(role => {
                expect(isValidRole(role)).toBe(true)
            })
        })

        it('should reject invalid roles', () => {
            expect(isValidRole('INVALID')).toBe(false)
            expect(isValidRole('USER')).toBe(false)
            expect(isValidRole('MANAGER')).toBe(false)
        })
    })

    describe('getRoleDisplayName', () => {
        it('should return human readable role names', () => {
            expect(getRoleDisplayName('SUPERADMIN')).toBe('Super Admin')
            expect(getRoleDisplayName('MIS_WAREHOUSE_EXECUTIVE')).toBe('MIS/Warehouse Executive')
            expect(getRoleDisplayName('QC_ENGINEER')).toBe('QC Engineer')
        })
    })
})

describe('Permission Checks', () => {
    describe('canAccessAllFeatures', () => {
        it('should return true for SUPERADMIN', () => {
            expect(canAccessAllFeatures('SUPERADMIN')).toBe(true)
        })

        it('should return false for other roles', () => {
            expect(canAccessAllFeatures('ADMIN')).toBe(false)
            expect(canAccessAllFeatures('REPAIR_ENGINEER')).toBe(false)
        })
    })

    describe('canManageUsers', () => {
        it('should return true only for SUPERADMIN', () => {
            expect(canManageUsers('SUPERADMIN')).toBe(true)
            expect(canManageUsers('ADMIN')).toBe(false)
        })
    })

    describe('canAccessModule', () => {
        it('should allow SUPERADMIN to access all modules', () => {
            expect(canAccessModule('SUPERADMIN', 'dashboard')).toBe(true)
            expect(canAccessModule('SUPERADMIN', 'admin')).toBe(true)
            expect(canAccessModule('SUPERADMIN', 'anything')).toBe(true)
        })

        it('should allow REPAIR_ENGINEER only repair and dashboard', () => {
            expect(canAccessModule('REPAIR_ENGINEER', 'dashboard')).toBe(true)
            expect(canAccessModule('REPAIR_ENGINEER', 'repair')).toBe(true)
            expect(canAccessModule('REPAIR_ENGINEER', 'qc')).toBe(false)
            expect(canAccessModule('REPAIR_ENGINEER', 'admin')).toBe(false)
        })

        it('should allow WAREHOUSE_MANAGER appropriate modules', () => {
            expect(canAccessModule('WAREHOUSE_MANAGER', 'inventory')).toBe(true)
            expect(canAccessModule('WAREHOUSE_MANAGER', 'outward')).toBe(true)
            expect(canAccessModule('WAREHOUSE_MANAGER', 'spares')).toBe(true)
            expect(canAccessModule('WAREHOUSE_MANAGER', 'repair')).toBe(false)
        })

        it('should allow QC_ENGINEER only QC and dashboard', () => {
            expect(canAccessModule('QC_ENGINEER', 'dashboard')).toBe(true)
            expect(canAccessModule('QC_ENGINEER', 'qc')).toBe(true)
            expect(canAccessModule('QC_ENGINEER', 'repair')).toBe(false)
        })
    })
})

describe('Self-Action Prevention', () => {
    describe('canSelfDeactivate', () => {
        it('should prevent deactivating own account', () => {
            expect(canSelfDeactivate('user-1', 'user-1')).toBe(false)
        })

        it('should allow deactivating other accounts', () => {
            expect(canSelfDeactivate('user-1', 'user-2')).toBe(true)
        })
    })

    describe('canSelfChangeRole', () => {
        it('should prevent changing own role', () => {
            expect(canSelfChangeRole('user-1', 'user-1')).toBe(false)
        })

        it('should allow changing other user roles', () => {
            expect(canSelfChangeRole('user-1', 'user-2')).toBe(true)
        })
    })

    describe('canDeleteUser', () => {
        it('should prevent self-deletion', () => {
            expect(canDeleteUser('user-1', 'user-1')).toBe(false)
        })

        it('should allow deleting other users', () => {
            expect(canDeleteUser('user-1', 'user-2')).toBe(true)
        })
    })
})

describe('Module Access by Role', () => {
    describe('getModuleAccessByRole', () => {
        it('should return * for SUPERADMIN', () => {
            const access = getModuleAccessByRole('SUPERADMIN')
            expect(access).toContain('*')
        })

        it('should return dashboard for all roles', () => {
            const roles: Role[] = [
                'ADMIN', 'MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER',
                'INSPECTION_ENGINEER', 'REPAIR_ENGINEER', 'PAINT_SHOP_TECHNICIAN', 'QC_ENGINEER'
            ]
            roles.forEach(role => {
                const access = getModuleAccessByRole(role)
                expect(access).toContain('dashboard')
            })
        })

        it('should give ADMIN comprehensive access', () => {
            const access = getModuleAccessByRole('ADMIN')
            expect(access).toContain('inward')
            expect(access).toContain('inspection')
            expect(access).toContain('repair')
            expect(access).toContain('qc')
            expect(access).toContain('outward')
        })
    })
})

describe('User Data Sanitization', () => {
    function sanitizeEmail(email: string): string {
        return email.toLowerCase().trim()
    }

    function sanitizeName(name: string): string {
        return name.trim()
    }

    it('should lowercase and trim email', () => {
        expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
    })

    it('should trim name', () => {
        expect(sanitizeName('  John Doe  ')).toBe('John Doe')
    })
})
