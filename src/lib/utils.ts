import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Generate document number in format: PREFIX-YYYYMMDD-XXX
 * PREFIX: QT (Quotation), IN (Invoice), RC (Receipt)
 * XXX: Sequential number for that day
 */
export function generateNextDocumentNumber(
    type: string,
    incomes: { type: string, documentNumber: string, date?: string }[],
    forDate: string = new Date().toISOString().split('T')[0]
) {
    const prefixMap: Record<string, string> = {
        'Quotation': 'QT',
        'Invoice': 'IN',
        'Receipt': 'RC'
    }
    const prefix = prefixMap[type] || 'DOC'

    // Format date as YYYYMMDD
    const dateParts = forDate.split('-')
    const dateStr = dateParts.join('')  // 20260116

    // Filter documents of same type and same date
    const docsForToday = incomes.filter(d => {
        if (d.type !== type) return false
        // Check if document number starts with prefix and contains today's date
        if (d.documentNumber && d.documentNumber.startsWith(`${prefix}-${dateStr}`)) {
            return true
        }
        // Also check by date field if available
        if (d.date && d.date.startsWith(forDate)) {
            return true
        }
        return false
    })

    if (docsForToday.length === 0) return `${prefix}-${dateStr}-001`

    // Extract sequence numbers from existing documents
    const numbers = docsForToday.map(d => {
        const parts = d.documentNumber.split('-')
        if (parts.length >= 3) {
            const num = parseInt(parts[2])
            return isNaN(num) ? 0 : num
        }
        return 0
    })

    const max = Math.max(...numbers, 0)
    const next = max + 1
    return `${prefix}-${dateStr}-${next.toString().padStart(3, '0')}`
}

export function getGoogleMapsUrl(address: string | undefined | null) {
    if (!address || address === "-" || address === "ไม่มีที่อยู่") return null
    if (address.startsWith("http://") || address.startsWith("https://")) return address
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
