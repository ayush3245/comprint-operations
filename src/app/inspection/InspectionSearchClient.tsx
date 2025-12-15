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
                <h1 className="text-3xl font-bold text-gray-800">Device Inspection</h1>
                <p className="text-gray-500 mt-2">Scan or enter device barcode to begin inspection</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSearch} className="relative">
                    <div className="relative group">
                        <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder="Scan Barcode..."
                            className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-900"
                            autoFocus
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Start Inspection
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
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
