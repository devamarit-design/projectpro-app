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
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const storageRef = ref(storage, `${path}/${fileName}`)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
}

/**
 * Upload multiple images to Firebase Storage
 * @param files - Array of files to upload
 * @param path - The storage path
 * @returns Array of download URLs
 */
export async function uploadMultipleImages(files: File[], path: string): Promise<string[]> {
    const uploadPromises = files.map(file => uploadImage(file, path))
    return Promise.all(uploadPromises)
}
