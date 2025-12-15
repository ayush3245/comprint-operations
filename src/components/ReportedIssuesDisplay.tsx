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
            <div className={`text-sm text-gray-500 ${className}`}>
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
                        <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
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
                    <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
                        <AlertCircle size={16} />
                        <span>Issues Found ({parsed.failedItems.length})</span>
                    </div>
                    <ul className="space-y-2">
                        {parsed.failedItems.map((item, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-2 bg-red-50 p-2 rounded border border-red-100"
                            >
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 text-red-800 text-xs flex items-center justify-center font-medium">
                                    {item.index || idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800">{item.text}</p>
                                    {item.notes && (
                                        <p className="text-xs text-gray-600 mt-1 italic">
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
                        <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded border border-yellow-100">
                            <Wrench size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-xs font-medium text-yellow-800">Functional Issues:</span>
                                <p className="text-sm text-gray-700">{parsed.functional}</p>
                            </div>
                        </div>
                    )}
                    {parsed.cosmetic && (
                        <div className="flex items-start gap-2 bg-purple-50 p-2 rounded border border-purple-100">
                            <Paintbrush size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-xs font-medium text-purple-800">Cosmetic Issues:</span>
                                <p className="text-sm text-gray-700">{parsed.cosmetic}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Overall Notes */}
            {parsed.notes && (
                <div className="flex items-start gap-2 bg-blue-50 p-2 rounded border border-blue-100">
                    <FileText size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-xs font-medium text-blue-800">Inspector Notes:</span>
                        <p className="text-sm text-gray-700">{parsed.notes}</p>
                    </div>
                </div>
            )}

            {/* Raw fallback for unknown formats */}
            {parsed.type === 'unknown' && parsed.raw && parsed.failedItems.length === 0 && (
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{parsed.raw}</p>
                </div>
            )}
        </div>
    )
}
