'use server'

import { Client } from 'minio'

// Lazy initialization to avoid errors when env vars are not set
let minioClientInstance: Client | null = null

function getMinioClient(): Client | null {
  if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
    console.warn('MinIO not configured. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY environment variables.')
    return null
  }

  if (!minioClientInstance) {
    minioClientInstance = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    })
  }

  return minioClientInstance
}

const BUCKET_NAME = process.env.MINIO_BUCKET || 'comprint-operations'

export type UploadFolder = 'purchase-orders' | 'delivery-challans'

export async function ensureBucketExists(): Promise<boolean> {
  const client = getMinioClient()
  if (!client) return false

  try {
    const exists = await client.bucketExists(BUCKET_NAME)
    if (!exists) {
      await client.makeBucket(BUCKET_NAME)
      console.log(`Bucket ${BUCKET_NAME} created successfully`)
    }
    return true
  } catch (error) {
    console.error('Error ensuring bucket exists:', error)
    return false
  }
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folder: UploadFolder,
  contentType?: string
): Promise<{ success: true; url: string; objectName: string } | { success: false; error: string }> {
  const client = getMinioClient()
  if (!client) {
    return { success: false, error: 'MinIO not configured' }
  }

  try {
    await ensureBucketExists()

    // Sanitize filename and create object name with timestamp
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const objectName = `${folder}/${Date.now()}-${sanitizedName}`

    const metaData = contentType ? { 'Content-Type': contentType } : {}

    await client.putObject(BUCKET_NAME, objectName, fileBuffer, fileBuffer.length, metaData)

    // Generate a presigned URL for immediate access
    const url = await getPresignedUrl(objectName)

    return {
      success: true,
      url: url || `${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${objectName}`,
      objectName,
    }
  } catch (error) {
    console.error('Error uploading file to MinIO:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

export async function getPresignedUrl(objectName: string, expirySeconds: number = 24 * 60 * 60): Promise<string | null> {
  const client = getMinioClient()
  if (!client) return null

  try {
    return await client.presignedGetObject(BUCKET_NAME, objectName, expirySeconds)
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return null
  }
}

export async function deleteFile(objectName: string): Promise<boolean> {
  const client = getMinioClient()
  if (!client) return false

  try {
    await client.removeObject(BUCKET_NAME, objectName)
    return true
  } catch (error) {
    console.error('Error deleting file from MinIO:', error)
    return false
  }
}

export async function fileExists(objectName: string): Promise<boolean> {
  const client = getMinioClient()
  if (!client) return false

  try {
    await client.statObject(BUCKET_NAME, objectName)
    return true
  } catch {
    return false
  }
}

export async function isMinioConfigured(): Promise<boolean> {
  return !!(process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY)
}
