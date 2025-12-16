'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, ScanLine, AlertCircle } from 'lucide-react'

import { Suspense } from 'react'
import ConfettiTrigger from '@/components/ui/ConfettiTrigger'
import BarcodeScanner from '@/components/BarcodeScanner'

export default function QCSearchClient() {
    const router = useRouter()
    const [barcode, setBarcode] = useState('')
    const [showScanner, setShowScanner] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!barcode.trim()) {
            setError('Please enter or scan a barcode first')
            return
        }
        setError(null)
        router.push(`/qc/${barcode.trim()}`)
    }

    function handleBarcodeDetected(detectedBarcode: string) {
        setBarcode(detectedBarcode)
        setShowScanner(false)
        router.push(`/qc/${detectedBarcode}`)
    }

    return (
        <div className="max-w-md mx-auto mt-20">
            <Suspense fallback={null}>
                <ConfettiTrigger />
            </Suspense>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground">Quality Control</h1>
                <p className="text-muted-foreground mt-2">Scan device barcode for final QC</p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-soft border border-default">
                <form onSubmit={handleSearch} className="relative">
                    <div className="relative group">
                        <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder="Scan Barcode..."
                            className="w-full pl-12 pr-4 py-4 text-lg bg-secondary/50 border-2 border-input rounded-xl focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                            autoFocus
                        />
                        <ClipboardCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-destructive">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20 transition-all duration-200"
                    >
                        Start QC
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium transition-colors"
                        >
                            <ScanLine size={20} />
                            Scan Barcode from Image/PDF
                        </button>
                    </div>
                </form>
            </div>

            {showScanner && (
                <BarcodeScanner
                    onBarcodeDetected={handleBarcodeDetected}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    )
}
