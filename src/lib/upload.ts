"use client"

import { storage } from "./firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

/**
 * Upload an image to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path (e.g., "projects/cover-images")
 * @returns The download URL of the uploaded image
 */
export async function uploadImage(file: File, path: string): Promise<string> {
    try {
        const timestamp = Date.now()
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const storageRef = ref(storage, `${path}/${fileName}`)

        await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(storageRef)

        return downloadURL
    } catch (error) {
        console.error("Firebase Storage upload failed:", error)
        throw error
    }
}

export async function uploadMultipleImages(files: File[], path: string): Promise<string[]> {
    const uploadPromises = files.map(file => uploadImage(file, path))
    return Promise.all(uploadPromises)
}

import imageCompression from 'browser-image-compression'

export interface UploadResult {
    originalUrl: string
    thumbnailUrl: string
}

export interface MultiUploadResult {
    originalUrls: string[]
    thumbnailUrl: string
}

/**
 * Compresses a receipt image aggressively so it never stores huge raw files (e.g. 5-10MB mobile photos).
 * Keeps text sharp while reducing file size to ~300-600KB max.
 */
export async function compressReceiptImage(file: File): Promise<File> {
    // If file is already small (e.g. < 250KB), return as is
    if (file.size <= 250 * 1024) return file

    try {
        const options = {
            maxSizeMB: 0.7, // Target < 700KB
            maxWidthOrHeight: 1600, // 1600px is crystal clear for reading tiny bill text
            useWebWorker: true,
            initialQuality: 0.8
        }
        const compressedBlob = await imageCompression(file, options)
        return new File([compressedBlob], file.name, { type: file.type || "image/jpeg" })
    } catch (err) {
        console.warn("Receipt compression failed, falling back to original file:", err)
        return file
    }
}

/**
 * Uploads an image with a generated thumbnail, compressing the main image if needed.
 */
export async function uploadWithThumbnail(file: File, path: string): Promise<UploadResult> {
    try {
        // Compress main file first so we don't store bloated multi-megabyte originals
        const processedFile = await compressReceiptImage(file)

        // 1. Upload Main Compressed Image
        const originalUrlPromise = uploadImage(processedFile, path)

        // 2. Generate Thumbnail (Client-side)
        const options = {
            maxSizeMB: 0.2, // Max 200KB for thumbnail
            maxWidthOrHeight: 600, // Max 600px width/height
            useWebWorker: true,
            initialQuality: 0.7
        }

        let thumbnailFile: File | null = null
        try {
            thumbnailFile = await imageCompression(processedFile, options)
        } catch (error) {
            console.error("Thumbnail generation failed, using processed file", error)
            thumbnailFile = processedFile // Fallback
        }

        // 3. Upload Thumbnail
        const thumbName = `thumb_${processedFile.name}`
        const finalThumbFile = new File([thumbnailFile], thumbName, { type: thumbnailFile.type || "image/jpeg" })
        const thumbnailUrlPromise = uploadImage(finalThumbFile, path)

        const [originalUrl, thumbnailUrl] = await Promise.all([originalUrlPromise, thumbnailUrlPromise])

        return { originalUrl, thumbnailUrl }
    } catch (error) {
        console.error("Upload with thumbnail failed", error)
        throw error
    }
}

/**
 * Uploads multiple receipt images, auto-compressing each one and generating a primary thumbnail.
 */
export async function uploadMultipleReceipts(files: File[], path: string): Promise<MultiUploadResult> {
    if (files.length === 0) {
        return { originalUrls: [], thumbnailUrl: "" }
    }

    try {
        // Process and upload all files in parallel
        const results = await Promise.all(
            files.map(file => uploadWithThumbnail(file, path))
        )

        return {
            originalUrls: results.map(r => r.originalUrl),
            thumbnailUrl: results[0]?.thumbnailUrl || results[0]?.originalUrl || ""
        }
    } catch (error) {
        console.error("uploadMultipleReceipts failed", error)
        throw error
    }
}

