
import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
    // Only compress images
    if (!file.type.startsWith('image/')) {
        return file;
    }

    try {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/jpeg' // Force convert to JPEG
        };
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error("Image compression failed:", error);
        return file; // Return original if compression fails
    }
};
