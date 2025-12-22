import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// This route serves files stored in the database
// Path format: /api/files/bucket/filename

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params

        if (!path || path.length < 2) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
        }

        // Reconstruct the key from path segments
        const key = path.join('/')
        const bucket = path[0]

        // Fetch file from database
        const file = await prisma.storedFile.findFirst({
            where: { key }
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Return file with appropriate headers
        return new NextResponse(file.data, {
            headers: {
                'Content-Type': file.contentType,
                'Content-Length': file.size.toString(),
                'Content-Disposition': `inline; filename="${file.fileName}"`,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        })
    } catch (error) {
        console.error('File serve error:', error)
        return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
    }
}
