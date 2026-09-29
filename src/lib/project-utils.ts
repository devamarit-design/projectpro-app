import { Expense, ExpenseCategory, IncomeDocument } from "@/context/project-context"

/**
 * Calculates total expenses per project from actual expense data.
 * Correctly handles split bill expenses and items without double counting.
 */
export function getExpensesByProject(expenses: Expense[]): Record<string, number> {
    const expensesByProject: Record<string, number> = {}
    expenses.forEach(expense => {
        if (expense.isDeleted || expense.status === 'Unpaid') return

        if (expense.items && expense.items.length > 0) {
            expense.items.forEach(item => {
                const pid = item.projectId || expense.projectId
                if (pid) {
                    expensesByProject[pid] = (expensesByProject[pid] || 0) + (Number(item.amount) || 0)
                }
            })
        } else if (expense.projectId) {
            expensesByProject[expense.projectId] = (expensesByProject[expense.projectId] || 0) + (expense.totalValue || 0)
        }
    })
    return expensesByProject
}

/**
 * Calculates total expense amount for a single project.
 */
export function getExpenseAmountForProject(expense: Expense, projectId: string): number {
    if (expense.isDeleted || expense.status === 'Unpaid') return 0

    if (expense.items && expense.items.length > 0) {
        return expense.items.reduce((sum, item) => {
            const pid = item.projectId || expense.projectId
            return pid === projectId ? sum + (Number(item.amount) || 0) : sum
        }, 0)
    }
    return expense.projectId === projectId ? (expense.totalValue || 0) : 0
}

/**
 * Calculates total expense amount for a specific category within a project.
 */
export function getCategoryExpenseForProject(
    expenses: Expense[],
    projectId: string,
    category: ExpenseCategory
): number {
    return expenses.reduce((total, expense) => {
        if (expense.isDeleted || expense.status === 'Unpaid') return total

        if (expense.items && expense.items.length > 0) {
            const itemSum = expense.items.reduce((sum, item) => {
                const pid = item.projectId || expense.projectId
                const cat = expense.category || item.category
                if (pid === projectId && cat === category) {
                    return sum + (Number(item.amount) || 0)
                }
                return sum
            }, 0)
            return total + itemSum
        } else if (expense.projectId === projectId && expense.category === category) {
            return total + (expense.totalValue || 0)
        }

        return total
    }, 0)
}

/**
 * Checks if an expense matches a search query across all possible fields:
 * - Title (หัวข้อ / ชื่อรายการ)
 * - Description (รายละเอียดระดับเอกสาร: description, note, notes, remark, remarks, details)
 * - Items (รายละเอียดสินค้า / บริการ: item.description, item.name, item.category)
 * - Payee (ผู้รับเงิน)
 * - PaidBy (ผู้สำรองจ่าย)
 * - Vendor (ร้านค้า / เจ้าหนี้)
 * - Category (หมวดหมู่: Material, Labor, Sub-contract, Other / ภาษาไทย)
 * - Status (สถานะ: Paid, Pending, Advanced, Credit, Unpaid / ภาษาไทย)
 * - Amount & TotalValue (จำนวนเงิน)
 * - Date (วันที่)
 * - Project / Sub-project / Creator name
 * 
 * Supports multi-keyword search (separated by space) where each keyword must match.
 */
export function matchesExpenseSearch(
    expense: Expense,
    searchQuery: string,
    context?: {
        projectName?: string
        subProjectName?: string
        createdByName?: string
    }
): boolean {
    if (!searchQuery || !searchQuery.trim()) return true

    // Split search query into individual keywords (space-delimited)
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return true

    // Gather all searchable text strings for this expense
    const texts: string[] = []

    // 1. Basic Expense fields
    if (expense.title) texts.push(expense.title)
    if (expense.payee) texts.push(expense.payee)
    if (expense.paidBy) texts.push(expense.paidBy)
    if (expense.vendor) texts.push(expense.vendor)
    if (expense.date) texts.push(expense.date)
    if (expense.category) {
        texts.push(expense.category)
        if (expense.category === 'Material') texts.push('วัสดุ', 'ค่าวัสดุ')
        if (expense.category === 'Labor') texts.push('ค่าแรง', 'แรงงาน')
        if (expense.category === 'Sub-contract') texts.push('เหมาช่วง', 'ผู้รับเหมาช่วง', 'ค่าเหมา')
        if (expense.category === 'Other') texts.push('อื่นๆ', 'ทั่วไป')
    }
    if (expense.status) {
        texts.push(expense.status)
        if (expense.status === 'Paid') texts.push('จ่ายแล้ว', 'ชำระแล้ว')
        if (expense.status === 'Pending') texts.push('รอจ่าย', 'รอชำระ')
        if (expense.status === 'Advanced') texts.push('สำรอง', 'สำรองจ่าย')
        if (expense.status === 'Credit') texts.push('เครดิต', 'เจ้าหนี้')
        if (expense.status === 'Unpaid') texts.push('ยกเลิก')
    }
    if (expense.amount) texts.push(expense.amount)
    if (expense.totalValue !== undefined) texts.push(expense.totalValue.toString())

    // 2. Possible root-level description / note fields (from legacy data, API, or migrations)
    const expAny = expense as Record<string, any>
    if (expAny.description && typeof expAny.description === 'string') texts.push(expAny.description)
    if (expAny.note && typeof expAny.note === 'string') texts.push(expAny.note)
    if (expAny.notes && typeof expAny.notes === 'string') texts.push(expAny.notes)
    if (expAny.remark && typeof expAny.remark === 'string') texts.push(expAny.remark)
    if (expAny.remarks && typeof expAny.remarks === 'string') texts.push(expAny.remarks)
    if (expAny.details && typeof expAny.details === 'string') texts.push(expAny.details)

    // 3. Items breakdown (รายละเอียดสินค้า / บริการ / รายการย่อย)
    if (Array.isArray(expense.items)) {
        for (const item of expense.items) {
            if (item.description) texts.push(item.description)
            const itemAny = item as Record<string, any>
            if (itemAny.name) texts.push(itemAny.name)
            if (itemAny.note) texts.push(itemAny.note)
            if (itemAny.details) texts.push(itemAny.details)
            if (item.category) texts.push(item.category)
            if (item.amount !== undefined) texts.push(item.amount.toString())
            if (item.quantity !== undefined) texts.push(item.quantity.toString())
            if (item.unitPrice !== undefined) texts.push(item.unitPrice.toString())
        }
    }

    // 4. Context info (Project, Subproject, Creator)
    if (context?.projectName) texts.push(context.projectName)
    if (context?.subProjectName) texts.push(context.subProjectName)
    if (context?.createdByName) texts.push(context.createdByName)

    // Lowercase everything once
    const unifiedHaystack = texts.join(' ').toLowerCase()

    // Every token must be present somewhere in the haystack
    return tokens.every(token => unifiedHaystack.includes(token))
}

/**
 * Returns a short snippet of the matched detail (item description, note, vendor, etc.)
 * when an expense matches the search query. This gives users immediate visual confirmation
 * that the search matched within the details/breakdown of the expense.
 */
export function getExpenseMatchedDetailSnippet(
    expense: Expense,
    searchQuery: string
): string | null {
    if (!searchQuery || !searchQuery.trim()) return null

    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return null

    // Check if any item description matched
    if (Array.isArray(expense.items) && expense.items.length > 0) {
        const matchedItems = expense.items.filter(item => {
            const desc = (item.description || (item as any).name || '').toLowerCase()
            return desc && tokens.some(token => desc.includes(token))
        })

        if (matchedItems.length > 0) {
            const firstDesc = matchedItems[0].description || (matchedItems[0] as any).name || ''
            if (matchedItems.length === 1) {
                return firstDesc
            }
            return `${firstDesc} (และอีก ${matchedItems.length - 1} รายการ)`
        }
    }

    // Check root-level note / description
    const expAny = expense as Record<string, any>
    const noteText = expAny.description || expAny.note || expAny.notes || expAny.remark || expAny.remarks || expAny.details
    if (noteText && typeof noteText === 'string') {
        const lowerNote = noteText.toLowerCase()
        if (tokens.some(token => lowerNote.includes(token))) {
            return noteText.length > 60 ? noteText.slice(0, 57) + '...' : noteText
        }
    }

    // Check vendor (if distinct from payee)
    if (expense.vendor && expense.vendor !== expense.payee) {
        const lowerVendor = expense.vendor.toLowerCase()
        if (tokens.some(token => lowerVendor.includes(token))) {
            return `ร้านค้า: ${expense.vendor}`
        }
    }

    return null
}

/**
 * Checks if an income document matches a search query across all possible fields:
 * - Document number (เลขที่เอกสาร)
 * - Type (ประเภท: Quotation, Invoice, Receipt / QT, INV, REC / ภาษาไทย)
 * - Status (สถานะ / ภาษาไทย)
 * - Customer name (ชื่อลูกค้า)
 * - Simple mode items (item.name, item.description)
 * - Zone mode sections & items (section.name, item.name, item.description)
 * - Notes & remarks (note, remarks, paymentDetails)
 * - Date (วันที่)
 * - GrandTotal / Total / Subtotal (จำนวนเงิน)
 * - Project name
 *
 * Supports multi-keyword search.
 */
export function matchesIncomeSearch(
    income: IncomeDocument,
    searchQuery: string,
    context?: {
        customerName?: string
        projectName?: string
    }
): boolean {
    if (!searchQuery || !searchQuery.trim()) return true

    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return true

    const texts: string[] = []

    if (income.documentNumber) texts.push(income.documentNumber)
    if (income.date) texts.push(income.date)
    if (income.type) {
        texts.push(income.type)
        if (income.type === 'Quotation') texts.push('QT', 'ใบเสนอราคา')
        if (income.type === 'Invoice') texts.push('INV', 'ใบแจ้งหนี้', 'บิลเรียกเก็บ')
        if (income.type === 'Receipt') texts.push('REC', 'ใบเสร็จ', 'ใบเสร็จรับเงิน')
    }
    if (income.status) {
        texts.push(income.status)
        if (income.status === 'Draft') texts.push('ฉบับร่าง')
        if (income.status === 'Sent') texts.push('ส่งแล้ว')
        if (income.status === 'Accepted') texts.push('อนุมัติแล้ว', 'ตกลง')
        if (income.status === 'Invoiced') texts.push('ออกใบแจ้งหนี้แล้ว', 'แจ้งหนี้แล้ว')
        if (income.status === 'Paid') texts.push('ชำระแล้ว', 'จ่ายแล้ว')
        if (income.status === 'Void') texts.push('ยกเลิก')
    }
    if (income.grandTotal !== undefined) texts.push(income.grandTotal.toString())
    if (income.total !== undefined) texts.push(income.total.toString())
    if (income.subtotal !== undefined) texts.push(income.subtotal.toString())
    if (income.note) texts.push(income.note)
    if (income.remarks) texts.push(income.remarks)
    if (income.paymentDetails) texts.push(income.paymentDetails)

    // Items in Simple mode
    if (Array.isArray(income.items)) {
        for (const item of income.items) {
            if (item.name) texts.push(item.name)
            if (item.description) texts.push(item.description)
            if (item.unit) texts.push(item.unit)
            if (item.unitPrice !== undefined) texts.push(item.unitPrice.toString())
            if (item.total !== undefined) texts.push(item.total.toString())
        }
    }

    // Sections and items in Zone mode
    if (Array.isArray(income.sections)) {
        for (const section of income.sections) {
            if (section.name) texts.push(section.name)
            if (Array.isArray(section.items)) {
                for (const item of section.items) {
                    if (item.name) texts.push(item.name)
                    if (item.description) texts.push(item.description)
                    if (item.unit) texts.push(item.unit)
                    if (item.unitPrice !== undefined) texts.push(item.unitPrice.toString())
                    if (item.total !== undefined) texts.push(item.total.toString())
                }
            }
        }
    }

    if (context?.customerName) texts.push(context.customerName)
    if (context?.projectName) texts.push(context.projectName)

    const unifiedHaystack = texts.join(' ').toLowerCase()
    return tokens.every(token => unifiedHaystack.includes(token))
}

/**
 * Returns a short snippet of the matched detail in an IncomeDocument.
 */
export function getIncomeMatchedDetailSnippet(
    income: IncomeDocument,
    searchQuery: string
): string | null {
    if (!searchQuery || !searchQuery.trim()) return null

    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return null

    // Check simple items
    if (Array.isArray(income.items) && income.items.length > 0) {
        const matched = income.items.find(item => {
            const text = `${item.name || ''} ${item.description || ''}`.toLowerCase()
            return tokens.some(token => text.includes(token))
        })
        if (matched) {
            return matched.name || matched.description || null
        }
    }

    // Check zone sections and items
    if (Array.isArray(income.sections) && income.sections.length > 0) {
        for (const section of income.sections) {
            if (Array.isArray(section.items)) {
                const matched = section.items.find(item => {
                    const text = `${item.name || ''} ${item.description || ''}`.toLowerCase()
                    return tokens.some(token => text.includes(token))
                })
                if (matched) {
                    return `${section.name}: ${matched.name || matched.description}`
                }
            }
            if (section.name && tokens.some(t => section.name.toLowerCase().includes(t))) {
                return `โซน: ${section.name}`
            }
        }
    }

    // Check note / remarks
    if (income.note && tokens.some(t => income.note!.toLowerCase().includes(t))) {
        return income.note.length > 60 ? income.note.slice(0, 57) + '...' : income.note
    }
    if (income.remarks && tokens.some(t => income.remarks!.toLowerCase().includes(t))) {
        return income.remarks.length > 60 ? income.remarks.slice(0, 57) + '...' : income.remarks
    }

    return null
}

