'use client'

import { parseReportedIssues } from '@/lib/utils'
import { AlertCircle, FileText, Wrench, Paintbrush } from 'lucide-react'

interface ReportedIssuesDisplayProps {
    issues: string | null | undefined
    className?: string
    compact?: boolean
}

export default function ReportedIssuesDisplay({
    issues,
    className = '',
    compact = false
}: ReportedIssuesDisplayProps) {
    const parsed = parseReportedIssues(issues)

    if (parsed.failedItems.length === 0 && !parsed.notes && !parsed.raw) {
        return (
            <div className={`text-sm text-muted-foreground ${className}`}>
                No issues reported
            </div>
        )
    }

    if (compact) {
        // Compact view for cards/lists
        return (
            <div className={`text-sm ${className}`}>
                {parsed.failedItems.length > 0 && (
                    <div className="flex items-start gap-2">
                        <AlertCircle size={14} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">
                            {parsed.failedItems.length} issue{parsed.failedItems.length !== 1 ? 's' : ''} found
                        </span>
                    </div>
                )}
            </div>
        )
    }

    // Full view with details
    return (
        <div className={`space-y-3 ${className}`}>
            {/* Failed Items */}
            {parsed.failedItems.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                        <AlertCircle size={16} />
                        <span>Issues Found ({parsed.failedItems.length})</span>
                    </div>
                    <ul className="space-y-2">
                        {parsed.failedItems.map((item, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 p-2 rounded border border-red-100 dark:border-red-500/30"
                            >
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 dark:bg-red-500/30 text-red-800 dark:text-red-400 text-xs flex items-center justify-center font-medium">
                                    {item.index || idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground">{item.text}</p>
                                    {item.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                            Note: {item.notes}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Legacy format display */}
            {parsed.type === 'legacy' && (
                <div className="space-y-2">
                    {parsed.functional && (
                        <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-500/10 p-2 rounded border border-yellow-100 dark:border-yellow-500/30">
                            <Wrench size={14} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-xs font-medium text-yellow-800 dark:text-yellow-400">Functional Issues:</span>
                                <p className="text-sm text-foreground">{parsed.functional}</p>
                            </div>
                        </div>
                    )}
                    {parsed.cosmetic && (
                        <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-500/10 p-2 rounded border border-purple-100 dark:border-purple-500/30">
                            <Paintbrush size={14} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-xs font-medium text-purple-800 dark:text-purple-400">Cosmetic Issues:</span>
                                <p className="text-sm text-foreground">{parsed.cosmetic}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Overall Notes */}
            {parsed.notes && (
                <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-500/10 p-2 rounded border border-blue-100 dark:border-blue-500/30">
                    <FileText size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-400">Inspector Notes:</span>
                        <p className="text-sm text-foreground">{parsed.notes}</p>
                    </div>
                </div>
            )}

            {/* Raw fallback for unknown formats */}
            {parsed.type === 'unknown' && parsed.raw && parsed.failedItems.length === 0 && (
                <div className="bg-muted p-2 rounded border border-default">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{parsed.raw}</p>
                </div>
            )}
        </div>
    )
}
