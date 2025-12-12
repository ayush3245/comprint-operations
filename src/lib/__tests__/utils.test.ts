import { describe, it, expect } from 'vitest'
import { cn, formatDate } from '../utils'

describe('utils', () => {
    describe('cn (class name merger)', () => {
        it('should merge class names correctly', () => {
            expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
        })

        it('should handle conditional classes with false', () => {
            expect(cn('bg-red-500', false && 'text-white', 'p-4')).toBe('bg-red-500 p-4')
        })

        it('should handle conditional classes with true', () => {
            expect(cn('bg-red-500', true && 'text-white', 'p-4')).toBe('bg-red-500 text-white p-4')
        })

        it('should merge tailwind classes (last wins)', () => {
            expect(cn('p-4 p-2')).toBe('p-2')
        })

        it('should handle conflicting tailwind classes', () => {
            expect(cn('p-4', 'p-8')).toBe('p-8')
        })

        it('should handle undefined values', () => {
            expect(cn('bg-red-500', undefined, 'p-4')).toBe('bg-red-500 p-4')
        })

        it('should handle null values', () => {
            expect(cn('bg-red-500', null, 'p-4')).toBe('bg-red-500 p-4')
        })

        it('should handle empty string', () => {
            expect(cn('bg-red-500', '', 'p-4')).toBe('bg-red-500 p-4')
        })

        it('should handle array of classes', () => {
            expect(cn(['bg-red-500', 'text-white'])).toBe('bg-red-500 text-white')
        })

        it('should handle object notation', () => {
            expect(cn({ 'bg-red-500': true, 'text-white': false })).toBe('bg-red-500')
        })

        it('should handle complex combinations', () => {
            const isActive = true
            const isDisabled = false
            expect(
                cn(
                    'base-class',
                    isActive && 'active-class',
                    isDisabled && 'disabled-class',
                    ['array-class'],
                    { 'object-class': true }
                )
            ).toBe('base-class active-class array-class object-class')
        })

        it('should handle no arguments', () => {
            expect(cn()).toBe('')
        })

        it('should handle responsive classes', () => {
            expect(cn('p-4', 'md:p-8', 'lg:p-12')).toBe('p-4 md:p-8 lg:p-12')
        })

        it('should handle hover/focus states', () => {
            expect(cn('bg-blue-500', 'hover:bg-blue-600', 'focus:ring-2')).toBe(
                'bg-blue-500 hover:bg-blue-600 focus:ring-2'
            )
        })
    })

    describe('formatDate', () => {
        it('should format a Date object', () => {
            const date = new Date('2025-01-15T10:30:00Z')
            const formatted = formatDate(date)

            expect(typeof formatted).toBe('string')
            expect(formatted.length).toBeGreaterThan(0)
        })

        it('should format a date string', () => {
            const dateString = '2025-01-15T10:30:00Z'
            const formatted = formatDate(dateString)

            expect(typeof formatted).toBe('string')
            expect(formatted.length).toBeGreaterThan(0)
        })

        it('should include day in output', () => {
            const date = new Date('2025-01-15T10:30:00Z')
            const formatted = formatDate(date)

            // Should contain a day number (1-31)
            expect(formatted).toMatch(/\d{1,2}/)
        })

        it('should include month in output', () => {
            const date = new Date('2025-01-15T10:30:00Z')
            const formatted = formatDate(date)

            // Should contain a month abbreviation
            expect(formatted).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
        })

        it('should include year in output', () => {
            const date = new Date('2025-01-15T10:30:00Z')
            const formatted = formatDate(date)

            expect(formatted).toContain('2025')
        })

        it('should include time in output', () => {
            const date = new Date('2025-01-15T10:30:00Z')
            const formatted = formatDate(date)

            // Should contain a colon (time separator)
            expect(formatted).toContain(':')
        })

        it('should handle different months', () => {
            const dates = [
                '2025-01-01',
                '2025-06-15',
                '2025-12-31'
            ]

            dates.forEach(dateStr => {
                const formatted = formatDate(dateStr)
                expect(typeof formatted).toBe('string')
            })
        })

        it('should handle start of day', () => {
            const date = new Date('2025-01-15T00:00:00Z')
            const formatted = formatDate(date)
            expect(typeof formatted).toBe('string')
        })

        it('should handle end of day', () => {
            const date = new Date('2025-01-15T23:59:59Z')
            const formatted = formatDate(date)
            expect(typeof formatted).toBe('string')
        })
    })
})
