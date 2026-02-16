import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
    // Only compress images
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
        return file;
    }

    try {
        let fileToCompress = file;

        // Check if it's a HEIC file
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });

            // Handle case where heic2any returns an array of blobs
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            // Create a new File object from the blob
            fileToCompress = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                type: 'image/jpeg'
            });
        }

        const options = {
            maxSizeMB: 0.3, // 300KB limit (aggressive compression for speed)
            maxWidthOrHeight: 1280, // Optimized for mobile/web viewing
            useWebWorker: true,
            fileType: 'image/jpeg', // Force convert to JPEG
            initialQuality: 0.7 // Start at 70% quality
        };
        const compressedFile = await imageCompression(fileToCompress, options);
        return compressedFile;
    } catch (error) {
        console.error("Image compression/conversion failed:", error);
        return file; // Return original if compression fails
    }
};
