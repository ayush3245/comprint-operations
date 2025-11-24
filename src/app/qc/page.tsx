'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'

export default function QCSearchPage() {
    const router = useRouter()
    const [barcode, setBarcode] = useState('')

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (barcode.trim()) {
            router.push(`/qc/${barcode.trim()}`)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-20">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Quality Control</h1>
                <p className="text-gray-500 mt-2">Scan device barcode for final QC</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Scan Barcode..."
                        className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        autoFocus
                    />
                    <ClipboardCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />

                    <button
                        type="submit"
                        className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                        Start QC
                    </button>
                </form>
            </div>
        </div>
    )
}
