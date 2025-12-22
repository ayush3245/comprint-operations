'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { verifyBatchShipment, overrideVerification } from '@/lib/actions'
import { VerificationStatus } from '@prisma/client'
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Lock
} from 'lucide-react'

interface VerificationPanelProps {
    batchId: string
    verificationStatus: VerificationStatus
    verificationResult: Record<string, unknown> | null
    isLocked: boolean
    hasPurchaseOrder: boolean
    deviceCount: number
    canOverride: boolean
}

export default function VerificationPanel({
    batchId,
    verificationStatus,
    verificationResult,
    isLocked,
    hasPurchaseOrder,
    deviceCount,
    canOverride
}: VerificationPanelProps) {
    const router = useRouter()
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [showOverrideForm, setShowOverrideForm] = useState(false)

    async function handleVerify() {
        if (deviceCount === 0) {
            toast.error('Add devices to the batch before verification')
            return
        }

        setLoading(true)
        try {
            const result = await verifyBatchShipment(batchId)
            toast.success(`Verification complete: ${result.status} (${result.matchPercentage.toFixed(1)}% match)`)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Verification failed')
        } finally {
            setLoading(false)
        }
    }

    async function handleOverride(formData: FormData) {
        const reason = formData.get('reason') as string
        if (!reason || reason.trim().length < 10) {
            toast.error('Please provide a detailed reason (at least 10 characters)')
            return
        }

        setLoading(true)
        try {
            await overrideVerification(batchId, reason)
            toast.success('Verification skipped')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to skip verification')
        } finally {
            setLoading(false)
            setShowOverrideForm(false)
        }
    }

    const getStatusBadge = () => {
        switch (verificationStatus) {
            case 'VERIFIED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <ShieldCheck size={16} />
                        Verified Shipment
                    </span>
                )
            case 'PARTIAL':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        <ShieldAlert size={16} />
                        Partial Shipment
                    </span>
                )
            case 'SKIPPED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                        <ShieldX size={16} />
                        Verification Skipped
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <AlertCircle size={16} />
                        Unverified Shipment
                    </span>
                )
        }
    }

    // If no PO linked, verification is not applicable
    if (!hasPurchaseOrder) {
        return null
    }

    return (
        <div className="bg-card p-6 rounded-lg shadow-soft border border-default">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Shipment Verification
                    {isLocked && <Lock size={16} className="text-muted-foreground" />}
                </h2>
                {getStatusBadge()}
            </div>

            {/* Verification Result */}
            {verificationResult && verificationStatus !== 'UNVERIFIED' && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Match Rate</p>
                            <p className="text-xl font-bold text-foreground">
                                {(verificationResult as { matchPercentage?: number }).matchPercentage?.toFixed(1) || 0}%
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Matched</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                {((verificationResult as { matched?: unknown[] }).matched || []).length}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Missing</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                {((verificationResult as { missing?: unknown[] }).missing || []).length}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Extra</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {((verificationResult as { extra?: unknown[] }).extra || []).length}
                            </p>
                        </div>
                    </div>

                    {/* Discrepancies */}
                    {((verificationResult as { discrepancies?: { type: string; description: string }[] }).discrepancies || []).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-default">
                            <p className="text-sm font-medium text-foreground mb-2">Discrepancies:</p>
                            <ul className="space-y-1">
                                {((verificationResult as { discrepancies?: { type: string; description: string }[] }).discrepancies || []).map((d, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <span>{d.description}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Locked Notice */}
            {isLocked && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Lock className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Batch is locked
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            This batch has been verified and is now read-only. You can still view details and print barcodes.
                        </p>
                    </div>
                </div>
            )}

            {/* Actions */}
            {verificationStatus === 'UNVERIFIED' && !isLocked && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleVerify}
                            disabled={loading || deviceCount === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <ShieldCheck size={16} />
                            )}
                            {loading ? 'Verifying...' : 'Send for Verification'}
                        </button>

                        {canOverride && (
                            <button
                                onClick={() => setShowOverrideForm(!showOverrideForm)}
                                className="px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors text-sm"
                            >
                                Skip Verification
                            </button>
                        )}
                    </div>

                    {deviceCount === 0 && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            <AlertCircle size={14} />
                            Add devices to the batch before verification
                        </p>
                    )}

                    {/* Override Form */}
                    {showOverrideForm && canOverride && (
                        <form action={handleOverride} className="p-4 bg-muted rounded-lg border border-input">
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Reason for skipping verification <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="reason"
                                required
                                rows={3}
                                minLength={10}
                                placeholder="Please provide a detailed reason for skipping verification..."
                                className="w-full px-3 py-2 bg-card border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none text-sm"
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowOverrideForm(false)}
                                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Submitting...' : 'Confirm Skip'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    )
}
