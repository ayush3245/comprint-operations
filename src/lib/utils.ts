import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Parsed reported issues structure
 */
export interface ParsedIssues {
    type: 'checklist' | 'legacy' | 'unknown'
    failedItems: Array<{
        index?: number
        text: string
        notes?: string
    }>
    notes?: string
    functional?: string
    cosmetic?: string
    raw?: string
}

/**
 * Parse reported issues JSON string into structured format
 * Handles both checklist format and legacy format
 */
export function parseReportedIssues(reportedIssues: string | null | undefined): ParsedIssues {
    if (!reportedIssues) {
        return { type: 'unknown', failedItems: [] }
    }

    try {
        const parsed = JSON.parse(reportedIssues)

        // Check for checklist format: { failedItems: [...], notes: "..." }
        if (parsed.failedItems && Array.isArray(parsed.failedItems)) {
            return {
                type: 'checklist',
                failedItems: parsed.failedItems.map((item: string | { itemIndex?: number; itemText?: string; notes?: string }) => {
                    // Handle string format: "[3] Item text: notes"
                    if (typeof item === 'string') {
                        const match = item.match(/^\[(\d+)\]\s*(.+?)(?::\s*(.+))?$/)
                        if (match) {
                            return {
                                index: parseInt(match[1]),
                                text: match[2].trim(),
                                notes: match[3]?.trim()
                            }
                        }
                        return { text: item }
                    }
                    // Handle object format
                    return {
                        index: item.itemIndex,
                        text: item.itemText || '',
                        notes: item.notes
                    }
                }),
                notes: parsed.notes
            }
        }

        // Check for legacy format: { functional: "...", cosmetic: "..." }
        if (parsed.functional !== undefined || parsed.cosmetic !== undefined) {
            const items: ParsedIssues['failedItems'] = []
            if (parsed.functional) {
                items.push({ text: `Functional: ${parsed.functional}` })
            }
            if (parsed.cosmetic) {
                items.push({ text: `Cosmetic: ${parsed.cosmetic}` })
            }
            return {
                type: 'legacy',
                failedItems: items,
                functional: parsed.functional,
                cosmetic: parsed.cosmetic
            }
        }

        // Unknown JSON format - return raw
        return {
            type: 'unknown',
            failedItems: [],
            raw: reportedIssues
        }
    } catch {
        // Not valid JSON - treat as plain text
        return {
            type: 'unknown',
            failedItems: [{ text: reportedIssues }],
            raw: reportedIssues
        }
    }
}
