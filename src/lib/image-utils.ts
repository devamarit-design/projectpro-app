/**
 * Compresses and resizes an image file to ensure it's optimized for web usage.
 * @param file The original file object
 * @param maxWidth The maximum width of the output image (default: 800px)
 * @param quality The quality of the JPEG output (0.0 to 1.0, default: 0.8)
 * @returns A Promise resolving to a Blob
 */
export async function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        const reader = new FileReader()

        reader.onload = (e) => {
            image.src = e.target?.result as string
        }

        reader.onerror = (e) => reject(e)

        image.onload = () => {
            const canvas = document.createElement("canvas")
            let width = image.width
            let height = image.height

            // Resize if wider than maxWidth
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("Failed to get canvas context"))
                return
            }

            // Draw and compress
            ctx.drawImage(image, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error("Canvas to Blob conversion failed"))
                    }
                },
                "image/jpeg",
                quality
            )
        }

        reader.readAsDataURL(file)
    })
}
