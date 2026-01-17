'use client'

import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

export async function registerThaiFonts() {
    if (fontsRegistered) return true

    try {
        // Fetch fonts as ArrayBuffer - this is the most reliable method
        const [regularRes, boldRes] = await Promise.all([
            fetch('/fonts/THSarabunNew.ttf'),
            fetch('/fonts/THSarabunNew-Bold.ttf')
        ])

        if (!regularRes.ok || !boldRes.ok) {
            console.error('Failed to fetch font files')
            return false
        }

        const regularBuffer = await regularRes.arrayBuffer()
        const boldBuffer = await boldRes.arrayBuffer()

        Font.register({
            family: 'THSarabunNew',
            fonts: [
                { src: regularBuffer as unknown as string },
                { src: boldBuffer as unknown as string, fontWeight: 700 },
            ],
        })

        fontsRegistered = true
        console.log('Thai fonts registered successfully')
        return true
    } catch (error) {
        console.error('Failed to register Thai fonts:', error)
        return false
    }
}

export const THAI_FONT_FAMILY = 'THSarabunNew'
export const FALLBACK_FONT_FAMILY = 'Helvetica'
