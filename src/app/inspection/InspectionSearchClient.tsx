'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ScanLine, AlertCircle } from 'lucide-react'
import BarcodeScanner from '@/components/BarcodeScanner'

export default function InspectionSearchPage() {
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
        router.push(`/inspection/${barcode.trim()}`)
    }

    function handleBarcodeDetected(detectedBarcode: string) {
        setBarcode(detectedBarcode)
        setShowScanner(false)
        router.push(`/inspection/${detectedBarcode}`)
    }

    return (
        <div className="max-w-md mx-auto mt-20">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground">Device Inspection</h1>
                <p className="text-muted-foreground mt-2">Scan or enter device barcode to begin inspection</p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft border border-default">
                <form onSubmit={handleSearch} className="relative">
                    <div className="relative group">
                        <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder="Scan Barcode..."
                            className="w-full pl-12 pr-4 py-4 text-lg bg-secondary/50 border-2 border-input rounded-xl focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all duration-200 placeholder:text-muted-foreground text-foreground"
                            autoFocus
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-destructive">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Start Inspection
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium"
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
