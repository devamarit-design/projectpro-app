import { SubProject, Expense, ProjectTask } from "@/context/project-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

export interface SubProjectPresetItem {
    id: string
    name: string
    description?: string
    category?: "Preparation" | "Structure" | "Architecture" | "Systems" | "Finishing" | "Admin" | "Logistics"
}

export interface SubProjectPresetGroup {
    id: string
    name: string
    description: string
    isDefault?: boolean
    items: SubProjectPresetItem[]
}

// Built-in presets designed specifically for Thai construction contractors
export const DEFAULT_PRESET_GROUPS: SubProjectPresetGroup[] = [
    {
        id: "standard-construction",
        name: "งานก่อสร้างบ้านและอาคารมาตรฐาน",
        description: "หมวดงานมาตรฐานสำหรับงานสร้างบ้าน อาคารพาณิชย์ และงานก่อสร้างทั่วไป",
        isDefault: true,
        items: [
            { id: "sp-1", name: "งานวางผังและเตรียมพื้นที่", description: "งานรังวัด วางผัง วางหมุด ปรับระดับผิวดิน และขุดเปิดหน้างาน", category: "Preparation" },
            { id: "sp-2", name: "งานเจาะเสาเข็มและทดสอบ", description: "งานตอกเสาเข็ม/เจาะเสาเข็ม และทดสอบความสมบูรณ์เสาเข็ม", category: "Structure" },
            { id: "sp-3", name: "งานฐานรากและคานคอดิน", description: "งานขุดฐานราก เทคอนกรีตหยาบ หล่อตอม่อ และคานคอดิน", category: "Structure" },
            { id: "sp-4", name: "งานโครงสร้าง คาน-เสา-พื้น", description: "งานแบบหล่อ งานผูกเหล็ก และเทคอนกรีตโครงสร้างทุกชั้น", category: "Structure" },
            { id: "sp-5", name: "งานโครงหลังคาและมุงหลังคา", description: "งานติดตั้งโครงเหล็กหลังคา ฉนวนกันความร้อน และวัสดุมุงหลังคา", category: "Structure" },
            { id: "sp-6", name: "งานก่ออิฐฉาบปูนและผนัง", description: "งานก่ออิฐมวลเบา/มอญ งานจับเซี้ยม และงานฉาบปูนผิวเรียบ", category: "Architecture" },
            { id: "sp-7", name: "งานระบบไฟฟ้าและสื่อสาร", description: "งานเดินท่อร้อยสายไฟ ตู้คอนซูเมอร์ สวิตช์ ปลั๊ก และโคมไฟ", category: "Systems" },
            { id: "sp-8", name: "งานระบบประปาและสุขาภิบาล", description: "งานเดินท่อน้ำดี น้ำเสีย ท่ออากาศ ถังบำบัด และงานติดตั้งสุขภัณฑ์", category: "Systems" },
            { id: "sp-9", name: "งานฝ้าเพดาน ประตู-หน้าต่าง", description: "งานโครงฝ้า แผ่นยิปซัม งานติดตั้งวงกบ ประตู และหน้าต่างอลูมิเนียม", category: "Architecture" },
            { id: "sp-10", name: "งานปูกระเบื้องและตกแต่งผิว", description: "งานปรับระดับพื้น ปูกระเบื้องพื้น ผนัง และบันได", category: "Finishing" },
            { id: "sp-11", name: "งานทาสีภายในและภายนอก", description: "งานโป๊วผิว งานรองพื้นปูนเก่า/ใหม่ และงานทาสีจริงทุกเฉด", category: "Finishing" },
            { id: "sp-12", name: "แคมป์คนงานและการจัดการหน้างาน", description: "ค่าสร้างแคมป์พัก น้ำ-ไฟชั่วคราว เบี้ยเลี้ยง และสิ่งอำนวยความสะดวก", category: "Admin" },
            { id: "sp-13", name: "ค่าน้ำมันและยานพาหนะ", description: "ค่าน้ำมันเชื้อเพลิงรถยนต์ รถบรรทุก เครื่องจักร และการเดินทางหน้างาน", category: "Logistics" },
            { id: "sp-14", name: "งานเบ็ดเตล็ดและส่วนกลาง", description: "ค่าใช้จ่ายส่วนกลาง อุปกรณ์ความปลอดภัย (PPE) และอื่นๆ", category: "Admin" }
        ]
    },
    {
        id: "interior-renovation",
        name: "งานรีโนเวทและตกแต่งภายใน",
        description: "สำหรับงานตกแต่งภายใน คอนโด ทาวน์โฮม หรือปรับปรุงอาคารเดิม",
        isDefault: false,
        items: [
            { id: "sp-int-1", name: "งานรื้อถอนและป้องกันความเสียหาย", description: "รื้อผนังเดิม พื้นเดิม และคลุมผ้าใบป้องกันพื้นที่", category: "Preparation" },
            { id: "sp-int-2", name: "งานกั้นห้องและผนังเบา", description: "งานโครงผนังเบา แผ่นยิปซัม/สมาร์ทบอร์ด งานฉาบรอยต่อ", category: "Architecture" },
            { id: "sp-int-3", name: "งานปรับปรุงระบบไฟฟ้าและแสงสว่าง", description: "งานระบบไฟ ตกแต่งไฟซ่อน ไฟหลืบ และจุดจ่ายไฟใหม่", category: "Systems" },
            { id: "sp-int-4", name: "งานปรับปรุงระบบประปาและห้องน้ำ", description: "งานระบบน้ำ และติดตั้งสุขภัณฑ์ห้องน้ำ", category: "Systems" },
            { id: "sp-int-5", name: "งานฝ้าเพดานและตกแต่งผนัง", description: "งานฝ้าหลุม ระแนงไม้ วอลล์เปเปอร์ และงานกรุผนัง", category: "Finishing" },
            { id: "sp-int-6", name: "งานเฟอร์นิเจอร์ Built-in", description: "ตู้เสื้อผ้า เคาน์เตอร์ครัว ชั้นวางทีวี และงานไม้ตกแต่ง", category: "Finishing" },
            { id: "sp-int-7", name: "งานทาสีและเก็บรายละเอียด", description: "งานทาสีเก็บขอบ ยาแนว และทำความสะอาดส่งมอบงาน", category: "Finishing" },
            { id: "sp-int-8", name: "ค่าน้ำมันและการขนส่งอุปกรณ์", description: "ค่าน้ำมันรถรับ-ส่งทีมช่าง และค่าขนย้ายวัสดุตกแต่ง", category: "Logistics" }
        ]
    }
]

const LOCAL_STORAGE_KEY = "hipsloth_subproject_presets"

/**
 * Load preset groups from Firestore or LocalStorage with default fallback
 */
export async function loadSubProjectPresets(orgId?: string): Promise<SubProjectPresetGroup[]> {
    if (typeof window !== "undefined") {
        try {
            const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (cached) {
                const parsed = JSON.parse(cached)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed
                }
            }
        } catch (e) {
            console.warn("Could not read subproject presets from localStorage", e)
        }
    }

    if (orgId && db) {
        try {
            const docRef = doc(db, "subproject_presets", orgId)
            const snap = await getDoc(docRef)
            if (snap.exists() && snap.data()?.presets) {
                const list = snap.data().presets as SubProjectPresetGroup[]
                if (typeof window !== "undefined") {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
                }
                return list
            }
        } catch (e) {
            console.warn("Could not read presets from Firestore", e)
        }
    }

    return DEFAULT_PRESET_GROUPS
}

/**
 * Save preset groups to Firestore and LocalStorage
 */
export async function saveSubProjectPresets(orgId: string | undefined, presets: SubProjectPresetGroup[]): Promise<void> {
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets))
        } catch (e) {
            console.warn("Could not cache presets to localStorage", e)
        }
    }

    if (orgId && db) {
        try {
            const docRef = doc(db, "subproject_presets", orgId)
            await setDoc(docRef, { presets, updatedAt: new Date().toISOString() }, { merge: true })
        } catch (e) {
            console.error("Failed to save presets to Firestore", e)
        }
    }
}

/**
 * Convert preset items into SubProject objects for a new or existing project
 */
export function createSubProjectsFromPreset(presetItems: SubProjectPresetItem[]): SubProject[] {
    return presetItems.map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        name: item.name,
        description: item.description || "Created from standard preset",
        status: "Planning" as const
    }))
}

// -------------------------------------------------------------
// DUPLICATE & SIMILARITY DETECTION
// -------------------------------------------------------------

export interface DuplicateCluster {
    canonicalName: string
    primaryId: string
    duplicates: {
        id: string
        name: string
        expenseCount: number
        totalExpense: number
    }[]
    reason: "exact" | "punctuation" | "semantic"
}

// Normalize Thai string for comparison (removes spaces, slashes, punctuation, common prefixes)
function normalizeThai(str: string): string {
    return str
        .toLowerCase()
        .replace(/[\s\/\,\.\-_]/g, "")
        .replace(/^(งาน|เมื่อ|การ)/, "")
        .trim()
}

/**
 * Detect duplicate and suspiciously similar sub-projects in a project
 */
export function detectDuplicateSubProjects(
    subProjects: SubProject[],
    expenses: Expense[]
): DuplicateCluster[] {
    if (!subProjects || subProjects.length <= 1) return []

    const clusters: DuplicateCluster[] = []
    const visited = new Set<string>()

    // Precalculate expense totals per subproject
    const expenseStats: Record<string, { count: number; total: number }> = {}
    subProjects.forEach(sp => {
        const spExpenses = expenses.filter(e => e.subProjectId === sp.id && !e.isDeleted)
        expenseStats[sp.id] = {
            count: spExpenses.length,
            total: spExpenses.reduce((sum, e) => sum + (e.totalValue || 0), 0)
        }
    })

    for (let i = 0; i < subProjects.length; i++) {
        const a = subProjects[i]
        if (visited.has(a.id)) continue

        const matching: { id: string; name: string; expenseCount: number; totalExpense: number; reason: "exact" | "punctuation" | "semantic" }[] = []
        const normA = normalizeThai(a.name)

        for (let j = i + 1; j < subProjects.length; j++) {
            const b = subProjects[j]
            if (visited.has(b.id)) continue

            const normB = normalizeThai(b.name)
            let matchReason: "exact" | "punctuation" | "semantic" | null = null

            // 1. Exact Name Match (e.g. "งานเจาะเสาเข็ม" & "งานเจาะเสาเข็ม")
            if (a.name.trim().toLowerCase() === b.name.trim().toLowerCase()) {
                matchReason = "exact"
            }
            // 2. Normalized Punctuation / Slashes (e.g. "งานวางผัง" & "งานวางผัง/วางหมุด")
            else if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
                // If substring match is significant
                const minLen = Math.min(normA.length, normB.length)
                if (minLen >= 4) {
                    matchReason = "punctuation"
                }
            }
            // 3. Known Thai construction semantic aliases
            else if (
                (normA.includes("แคมป์") && (normB.includes("แคมป์") || normB.includes("ที่พักคนงาน"))) ||
                (normA.includes("เสาเข็ม") && normB.includes("เสาเข็ม")) ||
                (normA.includes("วางผัง") && (normB.includes("วางหมุด") || normB.includes("วางผัง"))) ||
                (normA.includes("ฐานราก") && (normB.includes("ตอม่อ") || normB.includes("ฟุตติ้ง")))
            ) {
                matchReason = "semantic"
            }

            if (matchReason) {
                visited.add(b.id)
                matching.push({
                    id: b.id,
                    name: b.name,
                    expenseCount: expenseStats[b.id]?.count || 0,
                    totalExpense: expenseStats[b.id]?.total || 0,
                    reason: matchReason
                })
            }
        }

        if (matching.length > 0) {
            visited.add(a.id)
            // Primary is usually the one with the cleaner/shorter name or highest expense
            clusters.push({
                canonicalName: a.name,
                primaryId: a.id,
                duplicates: matching,
                reason: matching[0].reason
            })
        }
    }

    return clusters
}

// -------------------------------------------------------------
// FUEL & EXPENSE CORRELATION DETECTOR
// -------------------------------------------------------------

export interface FuelAnalysisResult {
    totalFuelExpense: number
    recordedFuelCount: number
    hiddenFuelCount: number
    hiddenFuelExpense: number
    subProjectsWithFuel: {
        subProjectId: string
        subProjectName: string
        fuelTotal: number
        items: Expense[]
    }[]
    misclassifiedItems: {
        expense: Expense
        detectedKeyword: string
        currentCategory: string
        suggestedCategory: "Fuel"
        subProjectName: string
    }[]
    correlationInsights: string[]
}

const FUEL_KEYWORDS = [
    "น้ำมัน", "ดีเซล", "เบนซิน", "แก๊สโซฮอล์", "ปตท", "ptt", "บางจาก",
    "shell", "เชลล์", "esso", "เอสโซ่", "caltex", "คาลเท็กซ์", "เติมน้ำมัน",
    "fuel", "gasoline", "diesel"
]

export function isFuelRelatedText(text: string): { isFuel: boolean; keyword?: string } {
    if (!text) return { isFuel: false }
    const lower = text.toLowerCase()
    for (const kw of FUEL_KEYWORDS) {
        if (lower.includes(kw)) {
            return { isFuel: true, keyword: kw }
        }
    }
    return { isFuel: false }
}

/**
 * Scan all expenses in a project to audit fuel costs and cross-correlate sub-projects
 */
export function auditProjectExpenses(
    projectId: string,
    subProjects: SubProject[],
    expenses: Expense[]
): FuelAnalysisResult {
    const projectExpenses = expenses.filter(e => e.projectId === projectId && !e.isDeleted)
    const spMap = new Map<string, string>()
    subProjects.forEach(sp => spMap.set(sp.id, sp.name))

    let totalFuelExpense = 0
    let recordedFuelCount = 0
    let hiddenFuelCount = 0
    let hiddenFuelExpense = 0

    const subProjectFuelMap = new Map<string, { total: number; items: Expense[] }>()
    const misclassifiedItems: FuelAnalysisResult["misclassifiedItems"] = []

    projectExpenses.forEach(exp => {
        const titleFuel = isFuelRelatedText(exp.title)
        const isCategorizedFuel = (exp.category as any) === "Fuel" || (exp as any).category === "fuel"

        // Check inside items if split
        let hasSplitFuel = false
        if (exp.items && exp.items.length > 0) {
            exp.items.forEach(it => {
                if ((it.category as any) === "Fuel" || isFuelRelatedText(it.description).isFuel) {
                    hasSplitFuel = true
                }
            })
        }

        const isFuel = isCategorizedFuel || titleFuel.isFuel || hasSplitFuel

        if (isFuel) {
            const amount = exp.totalValue || 0
            totalFuelExpense += amount

            if (isCategorizedFuel) {
                recordedFuelCount++
            } else {
                hiddenFuelCount++
                hiddenFuelExpense += amount
                misclassifiedItems.push({
                    expense: exp,
                    detectedKeyword: titleFuel.keyword || "fuel item",
                    currentCategory: exp.category,
                    suggestedCategory: "Fuel",
                    subProjectName: exp.subProjectId ? (spMap.get(exp.subProjectId) || "โปรเจคย่อยไม่ทราบชื่อ") : "ค่าใช้จ่ายส่วนกลาง (General)"
                })
            }

            // Track by subproject
            const spId = exp.subProjectId || "unassigned"
            const current = subProjectFuelMap.get(spId) || { total: 0, items: [] }
            current.total += amount
            current.items.push(exp)
            subProjectFuelMap.set(spId, current)
        }
    })

    const subProjectsWithFuel = Array.from(subProjectFuelMap.entries()).map(([spId, data]) => ({
        subProjectId: spId,
        subProjectName: spId === "unassigned" ? "ค่าใช้จ่ายส่วนกลาง (General)" : (spMap.get(spId) || "โปรเจคย่อย"),
        fuelTotal: data.total,
        items: data.items
    })).sort((a, b) => b.fuelTotal - a.fuelTotal)

    // Build intelligent correlation insights
    const correlationInsights: string[] = []

    if (hiddenFuelCount > 0) {
        correlationInsights.push(
            `พบรายการค่าน้ำมัน ${hiddenFuelCount} รายการ (มูลค่า ฿${hiddenFuelExpense.toLocaleString()}) ที่ถูกบันทึกเป็นหมวดหมู่อื่น (เช่น ${misclassifiedItems[0]?.currentCategory}) ทำให้ในกราฟแสดงยอดค่าน้ำมันต่ำกว่าความเป็นจริง`
        )
    }

    if (subProjectsWithFuel.length > 1) {
        const topSP = subProjectsWithFuel[0]
        correlationInsights.push(
            `ค่าน้ำมันกระจายอยู่ใน ${subProjectsWithFuel.length} โปรเจคย่อย โดยพบมากที่สุดใน "${topSP.subProjectName}" จำนวน ฿${topSP.fuelTotal.toLocaleString()}`
        )
    }

    if (subProjectsWithFuel.some(s => s.subProjectName.includes("เสาเข็ม"))) {
        correlationInsights.push(
            "พบค่าน้ำมันในหมวดงานเจาะเสาเข็ม ซึ่งมีความเกี่ยวเนื่องกับการใช้เครื่องจักรเจาะ/ปั่นลมหน้างานโดยตรง"
        )
    }

    if (subProjectsWithFuel.some(s => s.subProjectName.includes("แคมป์"))) {
        correlationInsights.push(
            "พบค่าน้ำมันในหมวดแคมป์คนงาน ซึ่งเกี่ยวเนื่องกับการรับ-ส่งคนงานและการเดินทางไปซื้ออุปกรณ์ด่วน"
        )
    }

    if (correlationInsights.length === 0) {
        correlationInsights.push("บันทึกค่าน้ำมันในระบบถูกต้องเรียบร้อยและสอดคล้องกับหมวดหมู่")
    }

    return {
        totalFuelExpense,
        recordedFuelCount,
        hiddenFuelCount,
        hiddenFuelExpense,
        subProjectsWithFuel,
        misclassifiedItems,
        correlationInsights
    }
}
