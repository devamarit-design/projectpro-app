'use client'

import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

export async function registerThaiFonts() {
    if (fontsRegistered) return true

    try {
        // Register Sarabun font (Google Fonts format - better React-PDF compatibility)
        Font.register({
            family: 'Sarabun',
            fonts: [
                { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 400 },
                { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 700 },
            ],
        })

        fontsRegistered = true
        console.log('Thai fonts registered successfully (Sarabun)')
        return true
    } catch (error) {
        console.error('Failed to register Thai fonts:', error)
        return false
    }
}

export const THAI_FONT_FAMILY = 'Sarabun'
export const FALLBACK_FONT_FAMILY = 'Helvetica'

