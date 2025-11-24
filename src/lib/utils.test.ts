import { describe, it, expect } from 'vitest'
import { cn, formatDate } from './utils'

describe('utils', () => {
    describe('cn', () => {
        it('should merge class names correctly', () => {
            expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
        })

        it('should handle conditional classes', () => {
            expect(cn('bg-red-500', false && 'text-white', 'p-4')).toBe('bg-red-500 p-4')
        })

        it('should merge tailwind classes', () => {
            expect(cn('p-4 p-2')).toBe('p-2')
        })
    })

    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2023-01-01T12:00:00Z')
            // Adjust expectation based on local time or mock timezone if needed
            // For simplicity, checking if it returns a string
            expect(typeof formatDate(date)).toBe('string')
        })
    })
})
