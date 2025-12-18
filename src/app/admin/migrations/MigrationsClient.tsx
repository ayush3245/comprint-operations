'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Paintbrush, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { migrateLegacyPaintPanels } from '@/lib/actions'

export default function MigrationsClient() {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const [result, setResult] = useState<{
        success: boolean
        migratedCount: number
        migratedDevices: string[]
    } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleMigratePaintPanels = () => {
        setError(null)
        setResult(null)

        startTransition(async () => {
            try {
                const res = await migrateLegacyPaintPanels()
                setResult(res)
                router.refresh()
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Migration failed')
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Paint Panel Migration */}
            <div className="bg-card rounded-lg border border-default p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                        <Paintbrush className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-foreground mb-1">
                            Fix Legacy Paint Panels
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Migrates devices that have paint panels auto-created by the old inspection flow.
                            This will move panel types to recommendations and delete the premature records,
                            allowing L2 Engineers to properly send panels to paint.
                        </p>

                        {/* Result */}
                        {result && (
                            <div className="mb-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                                    <CheckCircle size={18} />
                                    <span className="font-medium">Migration Complete</span>
                                </div>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Migrated {result.migratedCount} device(s)
                                </p>
                                {result.migratedDevices.length > 0 && (
                                    <div className="mt-2">
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            Devices:
                                        </span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {result.migratedDevices.map((barcode, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded text-xs font-mono"
                                                >
                                                    {barcode}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/30">
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <AlertCircle size={18} />
                                    <span className="font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleMigratePaintPanels}
                            disabled={isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Running Migration...
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    Run Migration
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
