'use client'

import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

export async function registerThaiFonts() {
    if (fontsRegistered) return true

    try {
        // Register fonts using standard URLs
        // React-pdf handles the loading internally
        Font.register({
            family: 'THSarabunNew',
            fonts: [
                { src: '/fonts/THSarabunNew.ttf' },
                { src: '/fonts/THSarabunNew-Bold.ttf', fontWeight: 700 },
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
