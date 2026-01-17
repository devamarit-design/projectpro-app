import { IncomeDocument, IncomeItem, IncomeSection } from "@/context/project-context"

export interface PageItem {
    type: 'item' | 'header'
    data: IncomeItem | IncomeSection
    originalIndex: number // Zero-based absolute index in the flattened list
    description?: string
    quantity?: number
    unit?: string
    unitPrice?: number
    total?: number
}

export interface DocumentPage {
    pageNumber: number
    items: PageItem[]
    isLast: boolean
    isFirst: boolean
}

interface PaginationConfig {
    itemsPerPage: number
    itemsFirstPage?: number // If first page has large header
}

/**
 * Flattens the document items into a single list of PageItems.
 * This handles both Simple (flat items) and Zone (sections) modes.
 */
export const flattenDocumentItems = (document: IncomeDocument): PageItem[] => {
    let allItems: PageItem[] = []

    if (document.mode === "Simple" && document.items) {
        allItems = document.items.map(item => ({
            type: 'item',
            data: item,
            // Map common fields for easier consumption
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            total: item.total
        } as PageItem))
    } else if (document.mode === "Zone" && document.sections) {
        document.sections.forEach(sec => {
            // Add Section Header
            allItems.push({
                type: 'header',
                data: sec,
                description: sec.name
            } as PageItem)

            // Add Section Items
            sec.items.forEach(item => {
                allItems.push({
                    type: 'item',
                    data: item,
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    total: item.total
                } as PageItem)
            })
        })
    }

    // Assign original indices
    return allItems.map((item, index) => ({ ...item, originalIndex: index }))
}

/**
 * Paginates the flattened items into pages, respecting:
 * 1. Manual page breaks (indices in manualBreaks array)
 * 2. Visual limits (itemsPerPage)
 */
export const paginateItems = (
    flatItems: PageItem[],
    manualBreaks: number[] = [],
    config: PaginationConfig = { itemsPerPage: 15 }
): DocumentPage[] => {
    const pages: DocumentPage[] = []
    let currentItems: PageItem[] = []

    const itemsPerRegularPage = config.itemsPerPage
    const itemsFirstPage = config.itemsFirstPage ?? config.itemsPerPage

    flatItems.forEach((item, index) => {
        currentItems.push(item)

        // Check conditions to break page:
        // 1. Manual Break requested at this index
        const isManualBreak = manualBreaks.includes(item.originalIndex)

        // 2. Max items reached for CURRENT page
        const isFirstPage = pages.length === 0
        const limit = isFirstPage ? itemsFirstPage : itemsPerRegularPage
        const isFullPage = currentItems.length >= limit

        if (isManualBreak || isFullPage) {
            // Push current page
            pages.push({
                pageNumber: pages.length + 1,
                items: [...currentItems],
                isLast: false, // Will calculate later
                isFirst: pages.length === 0
            })
            currentItems = [] // Reset for next page
        }
    })

    // Push remaining items if any
    if (currentItems.length > 0 || pages.length === 0) {
        pages.push({
            pageNumber: pages.length + 1,
            items: [...currentItems],
            isLast: true,
            isFirst: pages.length === 0
        })
    } else {
        // If we broke exactly at the end, the last page we pushed is actually the last one
        if (pages.length > 0) {
            pages[pages.length - 1].isLast = true
        }
    }

    // Double check isLast property for all pages
    pages.forEach((page, idx) => {
        page.isLast = idx === pages.length - 1
        page.isFirst = idx === 0
    })

    return pages
}
