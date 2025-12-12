import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../password'

describe('password helpers', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'mySecurePassword123'
            const hash = await hashPassword(password)

            expect(hash).toBeDefined()
            expect(hash).not.toBe(password)
            expect(hash.length).toBeGreaterThan(0)
        })

        it('should generate different hashes for the same password', async () => {
            const password = 'mySecurePassword123'
            const hash1 = await hashPassword(password)
            const hash2 = await hashPassword(password)

            // bcrypt generates different hashes due to random salt
            expect(hash1).not.toBe(hash2)
        })

        it('should handle empty password', async () => {
            const hash = await hashPassword('')
            expect(hash).toBeDefined()
            expect(hash.length).toBeGreaterThan(0)
        })

        it('should handle special characters', async () => {
            const password = 'p@$$w0rd!#$%^&*()'
            const hash = await hashPassword(password)
            expect(hash).toBeDefined()
        })

        it('should handle unicode characters', async () => {
            const password = 'пароль密码'
            const hash = await hashPassword(password)
            expect(hash).toBeDefined()
        })

        it('should handle very long passwords', async () => {
            const password = 'a'.repeat(1000)
            const hash = await hashPassword(password)
            expect(hash).toBeDefined()
        })
    })

    describe('verifyPassword', () => {
        it('should verify correct password', async () => {
            const password = 'mySecurePassword123'
            const hash = await hashPassword(password)

            const isValid = await verifyPassword(password, hash)
            expect(isValid).toBe(true)
        })

        it('should reject incorrect password', async () => {
            const password = 'mySecurePassword123'
            const hash = await hashPassword(password)

            const isValid = await verifyPassword('wrongPassword', hash)
            expect(isValid).toBe(false)
        })

        it('should reject similar but different password', async () => {
            const password = 'mySecurePassword123'
            const hash = await hashPassword(password)

            const isValid = await verifyPassword('mySecurePassword124', hash)
            expect(isValid).toBe(false)
        })

        it('should reject empty password against valid hash', async () => {
            const password = 'mySecurePassword123'
            const hash = await hashPassword(password)

            const isValid = await verifyPassword('', hash)
            expect(isValid).toBe(false)
        })

        it('should handle case sensitivity', async () => {
            const password = 'MyPassword'
            const hash = await hashPassword(password)

            const isValidUpper = await verifyPassword('MYPASSWORD', hash)
            const isValidLower = await verifyPassword('mypassword', hash)

            expect(isValidUpper).toBe(false)
            expect(isValidLower).toBe(false)
        })

        it('should verify empty password if hashed empty', async () => {
            const hash = await hashPassword('')
            const isValid = await verifyPassword('', hash)
            expect(isValid).toBe(true)
        })
    })
})
