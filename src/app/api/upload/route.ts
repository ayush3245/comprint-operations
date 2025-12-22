import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { storage, type StorageBucket, getActiveStorageProvider } from '@/lib/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_TYPES: Record<StorageBucket, string[]> = {
    'purchase-orders': ['application/pdf'],
    'delivery-challans': ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Parse form data
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const folder = formData.get('folder') as StorageBucket | null

        // Validate inputs
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!folder || !['purchase-orders', 'delivery-challans'].includes(folder)) {
            return NextResponse.json(
                { error: 'Invalid folder. Must be "purchase-orders" or "delivery-challans"' },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ALLOWED_TYPES[folder]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload using storage abstraction
        const result = await storage.upload(folder, file.name, buffer, file.type)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Upload failed' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            key: result.key,
            fileName: result.fileName,
            size: result.size,
            type: result.contentType,
            provider: getActiveStorageProvider()
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        )
    }
}
