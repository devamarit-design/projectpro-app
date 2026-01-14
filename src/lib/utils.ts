import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function generateNextDocumentNumber(type: string, incomes: any[]) {
    const prefixMap: Record<string, string> = {
        'Quotation': 'QT',
        'Invoice': 'IV',
        'Receipt': 'RC'
    }
    const prefix = prefixMap[type] || 'DOC'

    const docs = incomes.filter(d => d.type === type)

    if (docs.length === 0) return `${prefix}-001`

    const numbers = docs.map(d => {
        const parts = d.documentNumber.split('-')
        const num = parseInt(parts[parts.length - 1])
        return isNaN(num) ? 0 : num
    })

    const max = Math.max(...numbers, 0)
    const next = max + 1
    return `${prefix}-${next.toString().padStart(3, '0')}`
}
