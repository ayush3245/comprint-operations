import { prisma } from './db'

// =====================================================
// FILE STORAGE ABSTRACTION LAYER
// =====================================================

export type StorageBucket = 'purchase-orders' | 'delivery-challans'

export interface UploadResult {
    success: true
    url: string
    key: string
    fileName: string
    size: number
    contentType: string
}

export interface UploadError {
    success: false
    error: string
}

export interface FileStorage {
    upload(
        bucket: StorageBucket,
        fileName: string,
        data: Buffer,
        contentType: string
    ): Promise<UploadResult | UploadError>

    download(bucket: StorageBucket, key: string): Promise<Buffer | null>

    getUrl(bucket: StorageBucket, key: string): Promise<string | null>

    delete(bucket: StorageBucket, key: string): Promise<boolean>

    exists(bucket: StorageBucket, key: string): Promise<boolean>
}

// =====================================================
// DATABASE STORAGE IMPLEMENTATION
// =====================================================

class DatabaseStorage implements FileStorage {
    async upload(
        bucket: StorageBucket,
        fileName: string,
        data: Buffer,
        contentType: string
    ): Promise<UploadResult | UploadError> {
        try {
            // Sanitize filename and create unique key
            const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
            const key = `${bucket}/${Date.now()}-${sanitizedName}`

            // Store in database (convert Buffer to Uint8Array for Prisma)
            await prisma.storedFile.create({
                data: {
                    bucket,
                    key,
                    fileName: sanitizedName,
                    contentType,
                    size: data.length,
                    data: new Uint8Array(data)
                }
            })

            // Return URL that points to our file serving API
            // Don't encode slashes in the path
            const url = `/api/files/${key}`

            return {
                success: true,
                url,
                key,
                fileName: sanitizedName,
                size: data.length,
                contentType
            }
        } catch (error) {
            console.error('Database storage upload error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            }
        }
    }

    async download(bucket: StorageBucket, key: string): Promise<Buffer | null> {
        try {
            const file = await prisma.storedFile.findUnique({
                where: { bucket_key: { bucket, key } }
            })
            return file ? Buffer.from(file.data) : null
        } catch (error) {
            console.error('Database storage download error:', error)
            return null
        }
    }

    async getUrl(bucket: StorageBucket, key: string): Promise<string | null> {
        try {
            const file = await prisma.storedFile.findUnique({
                where: { bucket_key: { bucket, key } },
                select: { key: true }
            })
            return file ? `/api/files/${key}` : null
        } catch {
            return null
        }
    }

    async delete(bucket: StorageBucket, key: string): Promise<boolean> {
        try {
            await prisma.storedFile.delete({
                where: { bucket_key: { bucket, key } }
            })
            return true
        } catch {
            return false
        }
    }

    async exists(bucket: StorageBucket, key: string): Promise<boolean> {
        try {
            const file = await prisma.storedFile.findUnique({
                where: { bucket_key: { bucket, key } },
                select: { id: true }
            })
            return !!file
        } catch {
            return false
        }
    }
}

// =====================================================
// MINIO STORAGE IMPLEMENTATION (lazy loaded)
// =====================================================

class MinioStorage implements FileStorage {
    private client: any = null
    private bucketName: string
    private Client: any = null

    constructor() {
        this.bucketName = process.env.MINIO_BUCKET || 'comprint-operations'
    }

    private async getClient(): Promise<any | null> {
        if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
            return null
        }

        if (!this.client) {
            // Dynamic import to avoid issues when minio is not needed
            try {
                const minio = await import('minio')
                this.Client = minio.Client
                this.client = new this.Client({
                    endPoint: process.env.MINIO_ENDPOINT,
                    port: parseInt(process.env.MINIO_PORT || '9000'),
                    useSSL: process.env.MINIO_USE_SSL === 'true',
                    accessKey: process.env.MINIO_ACCESS_KEY,
                    secretKey: process.env.MINIO_SECRET_KEY,
                })
            } catch (error) {
                console.error('Failed to load minio client:', error)
                return null
            }
        }

        return this.client
    }

    private async ensureBucketExists(): Promise<boolean> {
        const client = await this.getClient()
        if (!client) return false

        try {
            const exists = await client.bucketExists(this.bucketName)
            if (!exists) {
                await client.makeBucket(this.bucketName)
            }
            return true
        } catch (error) {
            console.error('Error ensuring bucket exists:', error)
            return false
        }
    }

    async upload(
        bucket: StorageBucket,
        fileName: string,
        data: Buffer,
        contentType: string
    ): Promise<UploadResult | UploadError> {
        const client = await this.getClient()
        if (!client) {
            return { success: false, error: 'MinIO not configured' }
        }

        try {
            await this.ensureBucketExists()

            const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
            const key = `${bucket}/${Date.now()}-${sanitizedName}`

            await client.putObject(
                this.bucketName,
                key,
                data,
                data.length,
                { 'Content-Type': contentType }
            )

            // Generate presigned URL
            const url = await client.presignedGetObject(this.bucketName, key, 24 * 60 * 60)

            return {
                success: true,
                url,
                key,
                fileName: sanitizedName,
                size: data.length,
                contentType
            }
        } catch (error) {
            console.error('MinIO storage upload error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            }
        }
    }

    async download(bucket: StorageBucket, key: string): Promise<Buffer | null> {
        const client = await this.getClient()
        if (!client) return null

        try {
            const stream = await client.getObject(this.bucketName, key)
            const chunks: Buffer[] = []
            for await (const chunk of stream) {
                chunks.push(Buffer.from(chunk))
            }
            return Buffer.concat(chunks)
        } catch {
            return null
        }
    }

    async getUrl(bucket: StorageBucket, key: string): Promise<string | null> {
        const client = await this.getClient()
        if (!client) return null

        try {
            return await client.presignedGetObject(this.bucketName, key, 24 * 60 * 60)
        } catch {
            return null
        }
    }

    async delete(bucket: StorageBucket, key: string): Promise<boolean> {
        const client = await this.getClient()
        if (!client) return false

        try {
            await client.removeObject(this.bucketName, key)
            return true
        } catch {
            return false
        }
    }

    async exists(bucket: StorageBucket, key: string): Promise<boolean> {
        const client = await this.getClient()
        if (!client) return false

        try {
            await client.statObject(this.bucketName, key)
            return true
        } catch {
            return false
        }
    }
}

// =====================================================
// STORAGE PROVIDER SELECTION
// =====================================================

export type StorageProvider = 'database' | 'minio'

function getStorageProvider(): StorageProvider {
    const provider = process.env.STORAGE_PROVIDER as StorageProvider | undefined

    // If explicitly set, use that
    if (provider === 'minio' || provider === 'database') {
        return provider
    }

    // Default to database storage (safe fallback)
    return 'database'
}

function createStorage(): FileStorage {
    const provider = getStorageProvider()

    if (provider === 'minio') {
        console.log('[Storage] Using MinIO storage')
        return new MinioStorage()
    }

    console.log('[Storage] Using database storage')
    return new DatabaseStorage()
}

// Export singleton storage instance
export const storage: FileStorage = createStorage()

// Export for checking configuration
export function getActiveStorageProvider(): StorageProvider {
    return getStorageProvider()
}

export function isMinioConfigured(): boolean {
    return !!(
        process.env.MINIO_ENDPOINT &&
        process.env.MINIO_ACCESS_KEY &&
        process.env.MINIO_SECRET_KEY
    )
}
