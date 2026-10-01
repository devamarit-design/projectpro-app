import { SubProject, Expense, ExpenseCategory } from "@/context/project-context"

export type AuditCategory = ExpenseCategory

export interface MisclassifiedExpenseItem {
    expense: Expense
    detectedKeyword: string
    currentCategory: string
    suggestedCategory: AuditCategory
    subProjectName: string
    reason: string
}

export interface MissingSlipItem {
    expense: Expense
    subProjectName: string
}

export interface DuplicateRiskItem {
    expenseA: Expense
    expenseB: Expense
    reason: string
    subProjectName: string
}

export interface SubProjectCostStat {
    subProjectId: string
    subProjectName: string
    totalAmount: number
    expenseCount: number
    fuelAmount: number
    laborAmount: number
    materialAmount: number
    subcontractAmount: number
    otherAmount: number
    percentageOfTotal: number
}

export interface CategoryBreakdownStat {
    category: AuditCategory
    label: string
    totalAmount: number
    percentage: number
    itemCount: number
    color: string
}

export interface ProjectAuditResult {
    projectId: string
    analyzedAt: string
    totalExpensesCount: number
    totalExpensesAmount: number
    financialHealthScore: number // 0 - 100
    healthGrade: "A" | "B" | "C" | "D"

    // 1. Category Misclassification
    misclassifiedItems: MisclassifiedExpenseItem[]
    misclassifiedCount: number
    misclassifiedTotalAmount: number

    // 2. Missing Receipts / Slips
    missingSlips: MissingSlipItem[]
    missingSlipsCount: number
    missingSlipsTotalAmount: number

    // 3. Potential Duplicates
    duplicateRisks: DuplicateRiskItem[]
    duplicateRisksCount: number

    // 4. Fuel & Logistics Audit (Tracked inside "Other" category)
    totalFuelExpense: number
    recordedFuelCount: number
    hiddenFuelCount: number
    hiddenFuelExpense: number
    fuelSubprojects: {
        subProjectId: string
        subProjectName: string
        fuelTotal: number
        items: Expense[]
    }[]

    // 5. Cost Structure & Sub-project Breakdown
    categoryBreakdown: CategoryBreakdownStat[]
    subProjectStats: SubProjectCostStat[]

    // 6. AI Strategic Recommendations
    strategicInsights: string[]
}

// -------------------------------------------------------------
// AUDIT DICTIONARIES & RULESETS
// -------------------------------------------------------------

const FUEL_KEYWORDS = [
    "น้ำมัน", "ดีเซล", "เบนซิน", "แก๊สโซฮอล์", "ปตท", "ptt", "บางจาก",
    "shell", "เชลล์", "esso", "เอสโซ่", "caltex", "คาลเท็กซ์", "เติมน้ำมัน",
    "fuel", "gasoline", "diesel"
]

// เบี้ยเลี้ยงพนักงานออฟฟิศ/ผู้บริหาร จัดอยู่ในหมวด "Other"
const OFFICE_ALLOWANCE_KEYWORDS = [
    "เบี้ยเลี้ยง", "เบี้ยเลี้ยงบอส", "เบี้ยเลี้ยงพนักงาน", "เบี้ยเลี้ยงช่าง",
    "ค่าเบี้ยเลี้ยง", "allowance", "per diem"
]

// ค่าแรงช่าง/คนงานหน้างาน จัดอยู่ในหมวด "Labor"
const LABOR_KEYWORDS = [
    "ค่าแรง", "ค่าช่าง", "โอที", " ot", "ค่าล่วงเวลา", "รายวัน",
    "ค่าจ้าง", "เหมาวัน", "ค่าคนงาน", "ค่าแรงช่าง", "wages", "labor"
]

const EQUIPMENT_RENTAL_KEYWORDS = [
    "เช่าแม็คโคร", "แม็คโคร", "แมคโคร", "รถขุด", "รถดัมพ์", "เช่านั่งร้าน",
    "นั่งร้าน", "เครื่องตบดิน", "เครื่องสูบน้ำ", "เช่าเครน", "ค่าโมบายเครน",
    "เช่าเครื่องจักร", "rental", "equipment"
]

const WELFARE_FOOD_KEYWORDS = [
    "ค่าน้ำดื่ม", "น้ำดื่ม", "น้ำแข็ง", "อาหารกลางวัน", "ข้าวกล่อง", "กาแฟ",
    "m-150", "m150", "ข้าวเลี้ยงช่าง", "เลี้ยงคนงาน", "อาหารช่าง"
]

const SUBCONTRACT_KEYWORDS = [
    "เหมาปูกระเบื้อง", "ช่างทาสีเหมา", "เหมาเดินสายไฟ", "เหมาฝ้า",
    "ค่าเหมาติดตั้ง", "เหมาติดตั้ง", "ค่าจ้างเหมา", "sub-contract", "subcontract"
]

function matchKeywords(text: string, keywords: string[]): string | null {
    if (!text) return null
    const lower = text.toLowerCase()
    for (const kw of keywords) {
        if (lower.includes(kw)) {
            return kw
        }
    }
    return null
}

/**
 * Execute deep financial & cost audit on a project's expenses
 */
export function auditComprehensiveProjectExpenses(
    projectId: string,
    subProjects: SubProject[],
    expenses: Expense[]
): ProjectAuditResult {
    const projectExpenses = expenses.filter(e => e.projectId === projectId && !e.isDeleted)
    const spMap = new Map<string, string>()
    subProjects.forEach(sp => spMap.set(sp.id, sp.name))

    const getSpName = (spId?: string) => {
        if (!spId || spId === "unassigned") return "ค่าใช้จ่ายส่วนกลาง (General)"
        return spMap.get(spId) || "โปรเจคย่อย"
    }

    let totalAmount = 0
    let missingSlipsTotalAmount = 0
    const missingSlips: MissingSlipItem[] = []
    const misclassifiedItems: MisclassifiedExpenseItem[] = []

    // Fuel metrics
    let totalFuelExpense = 0
    let recordedFuelCount = 0
    let hiddenFuelCount = 0
    let hiddenFuelExpense = 0
    const subProjectFuelMap = new Map<string, { total: number; items: Expense[] }>()

    // Category breakdown totals - strictly the 4 canonical categories
    const catTotals: Record<AuditCategory, { amount: number; count: number }> = {
        Material: { amount: 0, count: 0 },
        Labor: { amount: 0, count: 0 },
        "Sub-contract": { amount: 0, count: 0 },
        Other: { amount: 0, count: 0 },
    }

    // Subproject stats map
    const spCostMap = new Map<string, {
        totalAmount: number
        expenseCount: number
        fuel: number
        labor: number
        material: number
        subcontract: number
        other: number
    }>()

    // 1. Process individual expenses
    projectExpenses.forEach(exp => {
        const amount = exp.totalValue || 0
        totalAmount += amount

        const rawCat = (exp.category as string) || "Material"
        const currentCat: AuditCategory =
            rawCat === "Material" || rawCat === "Labor" || rawCat === "Sub-contract"
                ? rawCat
                : "Other"

        catTotals[currentCat].amount += amount
        catTotals[currentCat].count += 1

        // Subproject stats
        const spId = exp.subProjectId || "unassigned"
        const currentSpStat = spCostMap.get(spId) || {
            totalAmount: 0,
            expenseCount: 0,
            fuel: 0,
            labor: 0,
            material: 0,
            subcontract: 0,
            other: 0
        }
        currentSpStat.totalAmount += amount
        currentSpStat.expenseCount += 1
        if (currentCat === "Labor") currentSpStat.labor += amount
        else if (currentCat === "Material") currentSpStat.material += amount
        else if (currentCat === "Sub-contract") currentSpStat.subcontract += amount
        else currentSpStat.other += amount

        // Check Missing Slip: Has no receiptImage or receiptFile and amount >= 500
        const hasReceipt = Boolean(exp.receiptImage || (exp as any).receiptFile)
        if (!hasReceipt && amount >= 500) {
            missingSlips.push({
                expense: exp,
                subProjectName: getSpName(exp.subProjectId)
            })
            missingSlipsTotalAmount += amount
        }

        // Search text: title + payee + item descriptions
        let combinedText = exp.title || ""
        if (exp.payee) combinedText += " " + exp.payee
        if (exp.items && exp.items.length > 0) {
            combinedText += " " + exp.items.map(i => i.description || "").join(" ")
        }

        // Check Misclassifications
        // A. Check for non-standard categories in DB (e.g. legacy "Fuel" or "Equipment")
        if (rawCat === "Fuel" || rawCat === "Equipment") {
            misclassifiedItems.push({
                expense: exp,
                detectedKeyword: rawCat,
                currentCategory: rawCat,
                suggestedCategory: "Other",
                subProjectName: getSpName(exp.subProjectId),
                reason: `ระบบใช้ 4 หมวดหมู่หลัก (Material, Labor, Sub-contract, Other) หมวด "${rawCat}" ควรปรับเป็น Other`
            })
        }

        // B. FUEL check: Fuel and vehicles belong in "Other"
        const fuelKw = matchKeywords(combinedText, FUEL_KEYWORDS)
        const isFuel = fuelKw !== null || rawCat === "Fuel"

        if (isFuel) {
            totalFuelExpense += amount
            currentSpStat.fuel += amount

            // Fuel belongs in "Other"
            if (rawCat === "Other") {
                recordedFuelCount++
            } else if (rawCat !== "Fuel") {
                // Erroneously placed in Material, Labor, or Sub-contract
                hiddenFuelCount++
                hiddenFuelExpense += amount
                misclassifiedItems.push({
                    expense: exp,
                    detectedKeyword: fuelKw || "น้ำมัน",
                    currentCategory: rawCat,
                    suggestedCategory: "Other",
                    subProjectName: getSpName(exp.subProjectId),
                    reason: `ตรวจพบคำว่า "${fuelKw || "น้ำมัน"}" ที่เกี่ยวกับค่าน้ำมันและยานพาหนะ ควรจัดอยู่ในหมวด Other (ปัจจุบันอยู่ ${rawCat})`
                })
            }

            const currentFuelSp = subProjectFuelMap.get(spId) || { total: 0, items: [] }
            currentFuelSp.total += amount
            currentFuelSp.items.push(exp)
            subProjectFuelMap.set(spId, currentFuelSp)
        }

        // C. OFFICE ALLOWANCE check: Allowances belong in "Other" (for office/executives)
        const allowanceKw = matchKeywords(combinedText, OFFICE_ALLOWANCE_KEYWORDS)
        if (allowanceKw) {
            // Allowance belongs in "Other". If it is in Material, Labor, or Sub-contract, suggest Other
            if (rawCat !== "Other" && rawCat !== "Fuel" && rawCat !== "Equipment") {
                misclassifiedItems.push({
                    expense: exp,
                    detectedKeyword: allowanceKw,
                    currentCategory: rawCat,
                    suggestedCategory: "Other",
                    subProjectName: getSpName(exp.subProjectId),
                    reason: `ตรวจพบคำว่า "${allowanceKw}" ซึ่งเป็นเบี้ยเลี้ยงพนักงานออฟฟิศ/ผู้บริหาร ควรจัดอยู่ในหมวด Other (ไม่ใช่ ${rawCat})`
                })
            }
        }

        // D. LABOR check: Construction site labor belongs in "Labor"
        // Note: Office allowances were already handled above and do NOT trigger Labor
        if (rawCat !== "Labor") {
            const laborKw = matchKeywords(combinedText, LABOR_KEYWORDS)
            if (laborKw && !fuelKw && !allowanceKw && !misclassifiedItems.some(m => m.expense.id === exp.id)) {
                if (rawCat === "Material" || (rawCat === "Other" && (laborKw.includes("แรง") || laborKw.includes("คนงาน") || laborKw.includes("ช่าง")))) {
                    misclassifiedItems.push({
                        expense: exp,
                        detectedKeyword: laborKw,
                        currentCategory: rawCat,
                        suggestedCategory: "Labor",
                        subProjectName: getSpName(exp.subProjectId),
                        reason: `ตรวจพบคำว่า "${laborKw}" ที่เกี่ยวกับค่าแรงช่าง/คนงานหน้างาน แต่ถูกจัดเป็นหมวด ${rawCat}`
                    })
                }
            }
        }

        // E. EQUIPMENT / MACHINE RENTAL check
        if (rawCat === "Material") {
            const equipKw = matchKeywords(combinedText, EQUIPMENT_RENTAL_KEYWORDS)
            if (equipKw && !fuelKw && !allowanceKw && !misclassifiedItems.some(m => m.expense.id === exp.id)) {
                misclassifiedItems.push({
                    expense: exp,
                    detectedKeyword: equipKw,
                    currentCategory: rawCat,
                    suggestedCategory: "Sub-contract",
                    subProjectName: getSpName(exp.subProjectId),
                    reason: `ตรวจพบคำว่า "${equipKw}" ซึ่งเป็นค่าเช่าเครื่องจักร/อุปกรณ์ ควรแยกจากค่าวัสดุ`
                })
            }
        }

        // F. WELFARE & FOOD check
        if (rawCat === "Material") {
            const foodKw = matchKeywords(combinedText, WELFARE_FOOD_KEYWORDS)
            if (foodKw && !fuelKw && !allowanceKw && !misclassifiedItems.some(m => m.expense.id === exp.id)) {
                misclassifiedItems.push({
                    expense: exp,
                    detectedKeyword: foodKw,
                    currentCategory: rawCat,
                    suggestedCategory: "Other",
                    subProjectName: getSpName(exp.subProjectId),
                    reason: `ตรวจพบคำว่า "${foodKw}" ซึ่งเป็นสวัสดิการอาหาร/เครื่องดื่มคนงาน ควรบันทึกในหมวด Other`
                })
            }
        }

        // G. SUBCONTRACT check
        if (rawCat === "Material" || rawCat === "Labor") {
            const subKw = matchKeywords(combinedText, SUBCONTRACT_KEYWORDS)
            if (subKw && !fuelKw && !allowanceKw && !misclassifiedItems.some(m => m.expense.id === exp.id)) {
                misclassifiedItems.push({
                    expense: exp,
                    detectedKeyword: subKw,
                    currentCategory: rawCat,
                    suggestedCategory: "Sub-contract",
                    subProjectName: getSpName(exp.subProjectId),
                    reason: `ตรวจพบคำว่า "${subKw}" ซึ่งเป็นงานจ้างเหมาบริการเฉพาะทาง`
                })
            }
        }

        spCostMap.set(spId, currentSpStat)
    })

    // 2. Check Duplicate Risks
    // Focus strictly on the SAME DATE, because routine recurring expenses (e.g. fuel, per diem allowances)
    // naturally happen periodically on different days with identical amounts/payees.
    const duplicateRisks: DuplicateRiskItem[] = []
    for (let i = 0; i < projectExpenses.length; i++) {
        for (let j = i + 1; j < projectExpenses.length; j++) {
            const a = projectExpenses[i]
            const b = projectExpenses[j]
            if (!a.totalValue || a.totalValue <= 0) continue
            if (a.totalValue !== b.totalValue) continue

            const dateA = a.date ? a.date.trim() : ""
            const dateB = b.date ? b.date.trim() : ""

            // If both transactions have dates and the dates are DIFFERENT -> routine separate transactions, NOT duplicate
            if (dateA && dateB && dateA !== dateB) {
                continue
            }

            const cleanTitleA = a.title.trim().toLowerCase()
            const cleanTitleB = b.title.trim().toLowerCase()
            const isSameTitle = cleanTitleA.length > 2 && cleanTitleA === cleanTitleB

            const cleanPayeeA = a.payee ? a.payee.trim().toLowerCase() : ""
            const cleanPayeeB = b.payee ? b.payee.trim().toLowerCase() : ""
            const isSamePayee = cleanPayeeA.length > 2 && cleanPayeeA === cleanPayeeB

            const isSameDate = (dateA && dateB && dateA === dateB) || (!dateA && !dateB)
            const isOneMissingDate = (!dateA && dateB) || (dateA && !dateB)

            if (isSameDate && isSameTitle) {
                duplicateRisks.push({
                    expenseA: a,
                    expenseB: b,
                    reason: `ชื่อรายการ "${a.title}" และยอด ฿${a.totalValue.toLocaleString()} ตรงกันในวันเดียวกัน (${dateA || "ไม่ระบุวัน"})`,
                    subProjectName: getSpName(a.subProjectId)
                })
            } else if (isSameDate && isSamePayee) {
                duplicateRisks.push({
                    expenseA: a,
                    expenseB: b,
                    reason: `ผู้รับเงิน "${a.payee}" และยอด ฿${a.totalValue.toLocaleString()} ตรงกันในวันเดียวกัน (${dateA || "ไม่ระบุวัน"})`,
                    subProjectName: getSpName(a.subProjectId)
                })
            } else if (isOneMissingDate && isSameTitle && isSamePayee) {
                duplicateRisks.push({
                    expenseA: a,
                    expenseB: b,
                    reason: `ชื่อ "${a.title}" ยอด ฿${a.totalValue.toLocaleString()} และผู้รับ "${a.payee}" ตรงกัน (รายการหนึ่งไม่ได้ระบุวันที่)`,
                    subProjectName: getSpName(a.subProjectId)
                })
            }
        }
    }

    // 3. Category Breakdown Stats
    const CATEGORY_COLORS: Record<AuditCategory, string> = {
        Material: "#3b82f6", // blue
        Labor: "#f59e0b", // amber
        "Sub-contract": "#8b5cf6", // purple
        Other: "#64748b", // slate
    }

    const CATEGORY_LABELS: Record<AuditCategory, string> = {
        Material: "ค่าวัสดุ (Material)",
        Labor: "ค่าแรง (Labor)",
        "Sub-contract": "ค่าเหมาช่วง (Sub-contract)",
        Other: "อื่นๆ / น้ำมัน / เบี้ยเลี้ยง (Other)",
    }

    const categoryBreakdown: CategoryBreakdownStat[] = (Object.keys(catTotals) as AuditCategory[])
        .map(cat => {
            const data = catTotals[cat]
            return {
                category: cat,
                label: CATEGORY_LABELS[cat] || cat,
                totalAmount: data.amount,
                percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
                itemCount: data.count,
                color: CATEGORY_COLORS[cat] || "#94a3b8"
            }
        })
        .filter(c => c.totalAmount > 0 || c.itemCount > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount)

    // 4. Subproject Stats
    const subProjectStats: SubProjectCostStat[] = Array.from(spCostMap.entries()).map(([spId, stat]) => ({
        subProjectId: spId,
        subProjectName: getSpName(spId),
        totalAmount: stat.totalAmount,
        expenseCount: stat.expenseCount,
        fuelAmount: stat.fuel,
        laborAmount: stat.labor,
        materialAmount: stat.material,
        subcontractAmount: stat.subcontract,
        otherAmount: stat.other,
        percentageOfTotal: totalAmount > 0 ? (stat.totalAmount / totalAmount) * 100 : 0
    })).sort((a, b) => b.totalAmount - a.totalAmount)

    // 5. Fuel Subproject Breakdown
    const fuelSubprojects = Array.from(subProjectFuelMap.entries()).map(([spId, data]) => ({
        subProjectId: spId,
        subProjectName: getSpName(spId),
        fuelTotal: data.total,
        items: data.items
    })).sort((a, b) => b.fuelTotal - a.fuelTotal)

    // 6. Calculate Financial Health Score (0-100)
    let penalty = 0
    // Misclassification penalty
    penalty += Math.min(misclassifiedItems.length * 5, 25)
    // Missing slips penalty
    const missingSlipsRatio = projectExpenses.length > 0 ? (missingSlips.length / projectExpenses.length) : 0
    penalty += Math.min(Math.round(missingSlipsRatio * 35), 35)
    // Duplicate risk penalty
    penalty += Math.min(duplicateRisks.length * 8, 20)

    const healthScore = Math.max(10, Math.min(100, 100 - penalty))
    const healthGrade: "A" | "B" | "C" | "D" =
        healthScore >= 85 ? "A" :
        healthScore >= 70 ? "B" :
        healthScore >= 50 ? "C" : "D"

    // 7. Synthesize Strategic AI Insights
    const strategicInsights: string[] = []

    if (misclassifiedItems.length > 0) {
        strategicInsights.push(
            `พบรายการที่อาจลงหมวดหมู่ผิด ${misclassifiedItems.length} รายการ (มูลค่ารวม ฿${misclassifiedItems.reduce((s, m) => s + (m.expense.totalValue || 0), 0).toLocaleString()}) แนะนำให้กดปรับหมวดหมู่ทันทีเพื่อให้กราฟสัดส่วนต้นทุนสะท้อนความจริง`
        )
    }

    if (missingSlips.length > 0) {
        strategicInsights.push(
            `มีค่าใช้จ่าย ${missingSlips.length} รายการ (มูลค่า ฿${missingSlipsTotalAmount.toLocaleString()}) ที่ยังไม่แนบรูปใบเสร็จ/สลิปโอน ควรเร่งรัดให้ทีมงานแนบหลักฐานเพื่อป้องกันปัญหาตรวจบัญชีภาษี`
        )
    }

    if (duplicateRisks.length > 0) {
        strategicInsights.push(
            `พบความเสี่ยงจ่ายซ้ำซ้อน ${duplicateRisks.length} จุด กรุณาตรวจสอบรายการที่มีชื่อหรือยอดตรงกันในวันใกล้เคียงเพื่อป้องกันเงินรั่วไหล`
        )
    }

    if (subProjectStats.length > 0) {
        const topSp = subProjectStats[0]
        strategicInsights.push(
            `หมวดงานที่ใช้จ่ายสูงสุดคือ "${topSp.subProjectName}" ยอด ฿${topSp.totalAmount.toLocaleString()} (${topSp.percentageOfTotal.toFixed(1)}% ของโครงการ)`
        )
    }

    if (totalFuelExpense > 0) {
        strategicInsights.push(
            `มีต้นทุนค่าน้ำมันและยานพาหนะรวม ฿${totalFuelExpense.toLocaleString()} (จัดอยู่ในหมวด Other) กระจายใน ${fuelSubprojects.length} หมวดงาน ${hiddenFuelCount > 0 ? `(มีค่าน้ำมันค้างในหมวดอื่นที่ไม่ใช่ Other ฿${hiddenFuelExpense.toLocaleString()})` : ""}`
        )
    }

    if (strategicInsights.length === 0) {
        strategicInsights.push("บันทึกค่าใช้จ่ายทั้งหมดมีความสมบูรณ์ เอกสารและหมวดหมู่ถูกต้องตามมาตรฐานเรียบร้อย")
    }

    return {
        projectId,
        analyzedAt: new Date().toISOString(),
        totalExpensesCount: projectExpenses.length,
        totalExpensesAmount: totalAmount,
        financialHealthScore: healthScore,
        healthGrade,
        misclassifiedItems,
        misclassifiedCount: misclassifiedItems.length,
        misclassifiedTotalAmount: misclassifiedItems.reduce((s, m) => s + (m.expense.totalValue || 0), 0),
        missingSlips,
        missingSlipsCount: missingSlips.length,
        missingSlipsTotalAmount,
        duplicateRisks,
        duplicateRisksCount: duplicateRisks.length,
        totalFuelExpense,
        recordedFuelCount,
        hiddenFuelCount,
        hiddenFuelExpense,
        fuelSubprojects,
        categoryBreakdown,
        subProjectStats,
        strategicInsights
    }
}
