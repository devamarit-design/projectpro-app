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
        console.warn("Firebase Storage upload failed, falling back to Base64:", error)
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
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

/**
 * Uploads an image with a generated thumbnail.
 * Keeps the original file as is.
 */
export async function uploadWithThumbnail(file: File, path: string): Promise<UploadResult> {
    try {
        // 1. Upload Original
        const originalUrlPromise = uploadImage(file, path)

        // 2. Generate Thumbnail (Client-side)
        const options = {
            maxSizeMB: 0.5, // Max 500KB for thumbnail
            maxWidthOrHeight: 800, // Max 800px width/height
            useWebWorker: true
        }

        let thumbnailFile: File | null = null
        try {
            thumbnailFile = await imageCompression(file, options)
        } catch (error) {
            console.error("Thumbnail generation failed, using original", error)
            thumbnailFile = file // Fallback
        }

        // 3. Upload Thumbnail
        // Rename to distinguish
        const thumbName = `thumb_${file.name}`
        // Create a new file object with the new name if possible, or just pass path with prefix
        // Since uploadImage uses file.name, let's create a new File
        const finalThumbFile = new File([thumbnailFile], thumbName, { type: thumbnailFile.type })

        const thumbnailUrlPromise = uploadImage(finalThumbFile, path)

        const [originalUrl, thumbnailUrl] = await Promise.all([originalUrlPromise, thumbnailUrlPromise])

        return { originalUrl, thumbnailUrl }

    } catch (error) {
        console.error("Upload with thumbnail failed", error)
        throw error
    }
}
