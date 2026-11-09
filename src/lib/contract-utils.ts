import type { Contract, ContractInstallment, ContractDraw, Project, Worker, CompanyProfile } from "@/context/project-context"

// ─────────────────────────────────────────────────────────────
// Constants / defaults
// ─────────────────────────────────────────────────────────────

export const CONTRACT_TYPES = ["ค่าแรง", "ค่าแรง + วัสดุ", "วัสดุ", "เหมารวม"] as const

export const DEFAULT_CONTRACT_TITLE = "สัญญาจ้างเหมางาน"

export const DEFAULT_COMPANY_NAME = "บริษัท แบบบ้านสวย จำกัด"
export const DEFAULT_COMPANY_ADDRESS = "119 ถนนศรีรองเมือง ตำบลวัดใหม่ อำเภอเมือง จังหวัดจันทบุรี 22000"

export function getCompanyAddress(addr?: string): string {
    if (!addr || addr.includes("ศรีรองเมือง") || addr.includes("เกาะขวาง") || addr.includes("ตลาดขวัญ") || addr.trim().length === 0) {
        return DEFAULT_COMPANY_ADDRESS
    }
    return addr
}

export const DEFAULT_WARRANTY = "รับประกันผลงานเป็นเวลา 1 ปี นับแต่วันส่งมอบงานงวดสุดท้าย"

export const DEFAULT_PAYMENT_TERMS =
    "ผู้ว่าจ้างจะชำระค่าจ้างตามงวดงานที่กำหนดในเอกสารแนบท้ายสัญญา 1 ภายใน 5 วันทำการ หลังจากผู้ว่าจ้างได้ตรวจรับงานงวดนั้นเรียบร้อยแล้ว ผู้ว่าจ้างอาจพิจารณาเบิกจ่ายระหว่างงวดได้ตามความก้าวหน้าของงานจริง"

export const DEFAULT_GENERAL_CONDITIONS = `1. มาตรฐานฝีมือแรงงานและคุณภาพงาน
ผู้รับจ้างต้องดำเนินงานด้วยความประณีต ถูกต้องตามแบบและหลักวิศวกรรม หากงานไม่ได้มาตรฐาน ผู้รับจ้างต้องแก้ไขให้แล้วเสร็จโดยไม่คิดค่าใช้จ่ายเพิ่ม
2. การรักษาความสะอาดและความปลอดภัย
ผู้รับจ้างต้องรักษาความสะอาดบริเวณหน้างานทุกวัน และสวมอุปกรณ์ป้องกันความปลอดภัย (PPE) ตลอดการทำงาน ความเสียหายหรืออุบัติเหตุที่เกิดจากความประมาทของผู้รับจ้าง ผู้รับจ้างต้องรับผิดชอบเอง
3. ความรับผิดชอบต่อทรัพย์สิน
หากผู้รับจ้างทำให้ทรัพย์สินของผู้ว่าจ้างหรือบุคคลที่สามเสียหาย ผู้รับจ้างต้องชดใช้ค่าเสียหายตามจริง
4. ระยะเวลาและค่าปรับ
หากผู้รับจ้างส่งมอบงานล่าช้ากว่ากำหนดโดยไม่มีเหตุอันสมควร ผู้ว่าจ้างมีสิทธิ์ปรับเป็นรายวัน วันละ 500 บาท จนกว่างานจะแล้วเสร็จ
5. สิทธิ์ในการบอกเลิกสัญญาของผู้ว่าจ้าง
ผู้ว่าจ้างมีสิทธิ์บอกเลิกสัญญาได้ทันทีหากผู้รับจ้าง (ก) ละทิ้งงานเกิน 7 วันติดต่อกัน (ข) งานไม่ได้คุณภาพและไม่แก้ไขภายในเวลาที่กำหนด (ค) ประพฤติผิดกฎระเบียบหน้างานอย่างร้ายแรง
6. ผลของการบอกเลิกสัญญา
เมื่อมีการบอกเลิกสัญญา ผู้ว่าจ้างจะชำระค่าจ้างเฉพาะงานที่ทำแล้วเสร็จและผ่านการตรวจรับเท่านั้น และมีสิทธิ์ว่าจ้างผู้อื่นทำงานต่อ โดยผู้รับจ้างเดิมต้องรับผิดชอบค่าใช้จ่ายส่วนเกินที่เกิดขึ้น
7. การระงับข้อพิพาท
หากเกิดข้อพิพาท คู่สัญญาตกลงเจรจาโดยสุจริตใจก่อน หากไม่สามารถตกลงกันได้ ให้ใช้กฎหมายไทยและศาลไทยเป็นผู้ชี้ขาด`

// ─────────────────────────────────────────────────────────────
// Number / date formatting
// ─────────────────────────────────────────────────────────────

export const fmtBaht = (n: number) => `฿${(Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
export const fmtNum = (n: number) => (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })

const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
const TH_MONTHS_LONG = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]

function parseDate(d?: string): Date | null {
    if (!d) return null
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
    const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d)
    return isNaN(date.getTime()) ? null : date
}

/** "20 ต.ค. 69" */
export function thDateShort(d?: string): string {
    const date = parseDate(d)
    if (!date) return "-"
    return `${date.getDate()} ${TH_MONTHS_SHORT[date.getMonth()]} ${String(date.getFullYear() + 543).slice(-2)}`
}

/** "20 ตุลาคม 2569" */
export function thDateLong(d?: string): string {
    const date = parseDate(d)
    if (!date) return "-"
    return `${date.getDate()} ${TH_MONTHS_LONG[date.getMonth()]} ${date.getFullYear() + 543}`
}

export const todayISO = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Thai baht text, e.g. 70000 → "เจ็ดหมื่นบาทถ้วน" */
export function bahtText(input: number): string {
    const num = Math.round((Number(input) || 0) * 100) / 100
    if (num === 0) return "ศูนย์บาทถ้วน"
    const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"]
    const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"]
    const readInt = (s: string): string => {
        if (s.length > 6) {
            const head = s.slice(0, s.length - 6)
            const tail = s.slice(-6)
            return readInt(head) + "ล้าน" + (Number(tail) ? readInt(tail.replace(/^0+/, "")) : "")
        }
        let out = ""
        const len = s.length
        for (let i = 0; i < len; i++) {
            const d = Number(s[i])
            const pos = len - i - 1
            if (d === 0) continue
            if (pos === 0 && d === 1 && len > 1) out += "เอ็ด"
            else if (pos === 1 && d === 2) out += "ยี่"
            else if (pos === 1 && d === 1) out += ""
            else out += digits[d]
            out += units[pos]
        }
        return out
    }
    const [intPart, decPart = "00"] = num.toFixed(2).split(".")
    const baht = Number(intPart) ? readInt(intPart) + "บาท" : ""
    const satang = Number(decPart) ? readInt(String(Number(decPart))) + "สตางค์" : "ถ้วน"
    return baht + satang
}

// ─────────────────────────────────────────────────────────────
// Installment / draw calculations
// ─────────────────────────────────────────────────────────────

export type InstallmentState = "Pending" | "Partial" | "Paid"

/** Draws for an installment, including a synthetic draw for legacy "Paid" installments. */
export function getDraws(inst: ContractInstallment, index: number): ContractDraw[] {
    if (inst.draws && inst.draws.length > 0) return inst.draws
    if (inst.status === "Paid") {
        return [{
            id: `legacy-${inst.id || index + 1}`,
            label: String(index + 1),
            amount: inst.amount,
            date: (inst.paidAt || "").slice(0, 10),
            expenseId: inst.expenseId,
            expenseStatus: "Paid",
            createdAt: inst.paidAt || ""
        }]
    }
    return []
}

export function getInstallmentDrawn(inst: ContractInstallment, index: number): number {
    return getDraws(inst, index).reduce((s, d) => s + (Number(d.amount) || 0), 0)
}

export function getInstallmentState(inst: ContractInstallment, index: number): InstallmentState {
    const drawn = getInstallmentDrawn(inst, index)
    if (drawn <= 0) return "Pending"
    if (drawn + 0.009 >= (Number(inst.amount) || 0)) return "Paid"
    return "Partial"
}

export function isInstallmentOverdue(inst: ContractInstallment, index: number): boolean {
    if (getInstallmentState(inst, index) === "Paid") return false
    const due = parseDate(inst.dueDate)
    if (!due) return false
    const today = parseDate(todayISO())!
    return due < today
}

/** Next draw label: "5" when drawing the full amount at once, otherwise "5.1", "5.2", ... */
export function nextDrawLabel(inst: ContractInstallment, index: number, amount: number): string {
    const n = index + 1
    const existing = inst.draws || []
    if (existing.length === 0 && amount + 0.009 >= inst.amount) return String(n)
    // If first draw was a full label "5" (shouldn't normally happen), continue with .2
    return `${n}.${existing.length + 1}`
}

export interface ContractStats {
    total: number
    drawn: number
    paid: number
    pendingPayment: number
    remaining: number
    installmentCount: number
    paidInstallments: number
    partialInstallments: number
    progress: number // 0..100
}

export function getContractStats(c: Contract): ContractStats {
    const installments = c.installments || []
    let drawn = 0, paid = 0, paidInstallments = 0, partialInstallments = 0
    installments.forEach((inst, i) => {
        const draws = getDraws(inst, i)
        draws.forEach(d => {
            drawn += Number(d.amount) || 0
            if (d.expenseStatus !== "Pending") paid += Number(d.amount) || 0
        })
        const st = getInstallmentState(inst, i)
        if (st === "Paid") paidInstallments++
        else if (st === "Partial") partialInstallments++
    })
    const total = Number(c.totalAmount) || installments.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    return {
        total,
        drawn,
        paid,
        pendingPayment: drawn - paid,
        remaining: Math.max(0, total - drawn),
        installmentCount: installments.length,
        paidInstallments,
        partialInstallments,
        progress: total > 0 ? Math.min(100, Math.round((drawn / total) * 100)) : 0
    }
}

/** Split legacy scope ("... --- หมายเหตุ --- ...") into scope + notes */
export function splitLegacyScope(scope: string = ""): { scope: string; notes: string } {
    const parts = scope.split("--- หมายเหตุ ---")
    return { scope: (parts[0] || "").trim(), notes: (parts[1] || "").trim() }
}

export function generateContractNumber(existing: Contract[]): string {
    const now = new Date()
    const thaiDate = new Date(now.getTime() + (7 * 60 * 60 * 1000))
    const yyyymmdd = `${thaiDate.getUTCFullYear()}${String(thaiDate.getUTCMonth() + 1).padStart(2, "0")}${String(thaiDate.getUTCDate()).padStart(2, "0")}`
    const prefix = `CT-${yyyymmdd}`

    // Find highest sequence for today
    let maxSeq = 0
    existing.forEach(c => {
        const doc = c.documentNumber || ""
        if (doc === prefix) {
            if (maxSeq < 1) maxSeq = 1
        } else if (doc.startsWith(`${prefix}-`)) {
            const parts = doc.split("-")
            const seq = parseInt(parts[parts.length - 1], 10)
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
        }
    })

    const nextSeq = String(maxSeq + 1).padStart(2, "0")
    return `${prefix}-${nextSeq}`
}

export function generateVoucherNumber(existingContracts: Contract[] = []): string {
    const now = new Date()
    const thaiDate = new Date(now.getTime() + (7 * 60 * 60 * 1000))
    const thaiYearShort = String(thaiDate.getUTCFullYear() + 543).slice(-2)
    const mm = String(thaiDate.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(thaiDate.getUTCDate()).padStart(2, "0")
    const prefix = `PV${thaiYearShort}${mm}${dd}`

    let maxSeq = 0
    existingContracts.forEach(c => {
        (c.installments || []).forEach(inst => {
            (inst.draws || []).forEach(d => {
                const vn = d.voucherNumber || ""
                if (vn.startsWith(prefix)) {
                    const tail = vn.slice(prefix.length).replace(/^[-\s]/, "")
                    const num = parseInt(tail, 10)
                    if (!isNaN(num) && num > maxSeq) maxSeq = num
                }
            })
        })
    })

    const nextSeq = String(maxSeq + 1).padStart(2, "0")
    return `${prefix}-${nextSeq}`
}

export interface VoucherPrintInput {
    docNumber: string
    requestDate: string
    paymentDate?: string
    status?: "Paid" | "Pending"
    workerName: string
    workerPhone?: string
    projectName: string
    categoryOrPipe?: string
    responsibleRole?: string
    items: Array<{
        description: string
        amount: number
        notes?: string
    }>
    totalAmount: number
    totalContractAmount: number
    installmentLabel: string
    installmentAmount: number
    remainingAmount: number
    org: Partial<CompanyProfile>
    signatures: {
        requester?: { name?: string; label?: string }
        inspector?: { name?: string; label?: string }
        accountant?: { name?: string; label?: string }
        payer?: { name?: string; label?: string }
    }
}

export function generateVoucherHTML(data: VoucherPrintInput): string {
    const org = data.org || {}
    const items = data.items || []
    const minRows = 4
    const emptyRowCount = Math.max(0, minRows - items.length)

    const itemRows = items.map((it, idx) => `
        <tr>
            <td style="text-align: center; border: 1px solid #111; padding: 6px 4px;">${idx + 1}</td>
            <td style="border: 1px solid #111; padding: 6px 10px; word-break: break-word;">${esc(it.description)}</td>
            <td style="text-align: right; border: 1px solid #111; padding: 6px 10px; font-weight: 600; white-space: nowrap;">${fmtNum(it.amount)}</td>
            <td style="text-align: center; border: 1px solid #111; padding: 6px 8px; color: #444;">${esc(it.notes || "")}</td>
        </tr>
    `).join("")

    const emptyRows = Array(emptyRowCount).fill(0).map((_, i) => `
        <tr>
            <td style="text-align: center; border: 1px solid #111; padding: 6px 4px; color: #bbb;">${items.length + i + 1}</td>
            <td style="border: 1px solid #111; padding: 6px 10px; height: 26px;">&nbsp;</td>
            <td style="border: 1px solid #111; padding: 6px 10px;">&nbsp;</td>
            <td style="border: 1px solid #111; padding: 6px 8px;">&nbsp;</td>
        </tr>
    `).join("")

    const logoHtml = org.logo
        ? `<img src="${esc(org.logo)}" style="max-height: 56px; max-width: 140px; object-fit: contain; margin-bottom: 4px;" alt="Logo" />`
        : `<div style="width: 44px; height: 44px; border-radius: 50%; background: #ea580c; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 20px;">🏠</div>`

    return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<title>ใบสำคัญจ่าย - ${esc(data.docNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; }
    body {
        margin: 0;
        padding: 0;
        background: #f3f4f6;
        font-family: 'Sarabun', sans-serif;
        font-size: 13px;
        line-height: 1.45;
        color: #111;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .sheet {
        width: 210mm;
        min-height: 297mm;
        margin: 16px auto;
        padding: 14mm 16mm 14mm;
        background: #fff;
        box-shadow: 0 4px 24px rgba(0,0,0,0.12);
        position: relative;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .title-header {
        text-align: center;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin-bottom: 14px;
    }
    .hdr-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 12px;
    }
    .company-box {
        flex: 1;
        font-size: 12px;
    }
    .company-name {
        font-size: 15px;
        font-weight: 700;
        color: #000;
        margin-bottom: 3px;
    }
    .meta-box {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }
    .meta-table {
        border-collapse: collapse;
        font-size: 12px;
        margin-top: 4px;
    }
    .meta-table td {
        padding: 2px 4px;
    }
    .meta-table td:first-child {
        color: #333;
        font-weight: 600;
        text-align: right;
    }
    .meta-table td:last-child {
        padding-left: 8px;
        font-weight: 700;
        text-align: left;
    }
    .info-section {
        margin: 12px 0 16px;
        font-size: 13px;
    }
    .info-line {
        display: flex;
        align-items: baseline;
        margin-bottom: 6px;
    }
    .info-lbl {
        font-weight: 700;
        white-space: nowrap;
        margin-right: 8px;
    }
    .info-val {
        flex: 1;
        border-bottom: 1px dotted #555;
        padding-bottom: 1px;
    }
    .items-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #111;
        margin-bottom: 12px;
        font-size: 12px;
        table-layout: fixed;
    }
    .items-table th {
        border: 1px solid #111;
        background: #fafafa;
        padding: 6px 4px;
        font-weight: 700;
        text-align: center;
    }
    .items-table td {
        border: 1px solid #111;
    }
    .summary-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        margin-top: 4px;
        margin-bottom: 16px;
    }
    .summary-table td {
        padding: 3px 0;
    }
    .summary-dots {
        border-bottom: 1px dotted #555;
        padding: 0 8px;
        display: inline-block;
        min-width: 110px;
        text-align: right;
        font-weight: 700;
    }
    .sigs-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-top: auto;
        padding-top: 14px;
        border-top: 1px solid #111;
        page-break-inside: avoid;
    }
    .sig-block {
        text-align: center;
        font-size: 11px;
    }
    .sig-dots {
        border-bottom: 1px dotted #222;
        display: inline-block;
        width: 100%;
        max-width: 120px;
        margin: 0 auto;
        height: 18px;
    }
    .sig-name {
        margin-top: 4px;
        font-weight: 700;
        color: #111;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    @media print {
        body { background: #fff; }
        .sheet {
            box-shadow: none;
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: auto;
            page-break-after: avoid;
        }
    }
</style>
</head>
<body>
<div class="sheet">
    <div class="title-header">ใบสำคัญจ่าย (PAYMENT VOUCHER)</div>
    
    <div class="hdr-row">
        <div class="company-box">
            <div class="company-name">${esc(org.name || "ชื่อบริษัท")}</div>
            <div>${esc(org.address || "")}</div>
            <div>${org.phone ? `โทร. ${esc(org.phone)}` : ""}</div>
        </div>
        <div class="meta-box">
            ${logoHtml}
            <table class="meta-table">
                <tr>
                    <td>เลขที่เอกสาร:</td>
                    <td>${esc(data.docNumber)}</td>
                </tr>
                <tr>
                    <td>วันที่เบิกจ่าย:</td>
                    <td>${esc(data.requestDate)}</td>
                </tr>
                <tr>
                    <td>วันที่จ่ายเงิน:</td>
                    <td>${esc(data.paymentDate || "___/___/___")}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="info-section">
        <div class="info-line">
            <span class="info-lbl">ชื่อผู้รับเงิน / พนักงาน :</span>
            <span class="info-val">${esc(data.workerName)}${data.workerPhone ? ` (โทร. ${esc(data.workerPhone)})` : ""}</span>
        </div>
        <div class="info-line">
            <span class="info-lbl">โครงการ :</span>
            <span class="info-val">${esc(data.projectName)}</span>
        </div>
        <div class="info-line">
            <span class="info-lbl">ไปป์/ประเภท :</span>
            <span class="info-val" style="margin-right: 20px;">${esc(data.categoryOrPipe || "-")}</span>
            <span class="info-lbl">หน้าที่รับผิดชอบ :</span>
            <span class="info-val">${esc(data.responsibleRole || "ผู้รับเหมาช่วง")}</span>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 45px;">ลำดับ</th>
                <th>รายละเอียดรายการเบิกจ่าย</th>
                <th style="width: 120px;">จำนวนเงิน<br/>(บาท)</th>
                <th style="width: 90px;">หมายเหตุ</th>
            </tr>
        </thead>
        <tbody>
            ${itemRows}
            ${emptyRows}
            <tr>
                <td colspan="2" style="border: 1px solid #111; padding: 7px 10px; text-align: center; font-weight: 700;">
                    รวมเงินเบิกทั้งสิ้น
                </td>
                <td style="border: 1px solid #111; padding: 7px 10px; text-align: right; font-weight: 700;">
                    ${fmtNum(data.totalAmount)}
                </td>
                <td style="border: 1px solid #111; padding: 7px 8px; text-align: center; font-size: 11px;">
                    บาท
                </td>
            </tr>
            <tr>
                <td colspan="2" style="border: 1px solid #111; padding: 6px 10px; text-align: center; color: #444; font-size: 12px;">
                    ยอดเงินตัวหนังสือ
                </td>
                <td colspan="2" style="border: 1px solid #111; padding: 6px 10px; text-align: center; font-weight: 700;">
                    (${bahtText(data.totalAmount)})
                </td>
            </tr>
        </tbody>
    </table>

    <table class="summary-table">
        <tr>
            <td style="width: 140px;">ยอดรวมค่าจ้างทั้งหมด :</td>
            <td><span class="summary-dots">${fmtNum(data.totalContractAmount)}</span> บาท</td>
        </tr>
        <tr>
            <td>เบิกจ่ายค่าจ้างงวดที่ :</td>
            <td>
                <span style="border-bottom: 1px dotted #555; padding: 0 12px; font-weight: 700;">${esc(data.installmentLabel)}</span>
                <span style="margin-left: 18px; margin-right: 6px;">เป็นจำนวน :</span>
                <span class="summary-dots">${fmtNum(data.installmentAmount)}</span> บาท
            </td>
        </tr>
        <tr>
            <td>คงเหลือค่าจ้างเบิกจ่ายในครั้งต่อไป :</td>
            <td><span class="summary-dots">${fmtNum(data.remainingAmount)}</span> บาท</td>
        </tr>
    </table>

    <div class="sigs-grid">
        <div class="sig-block">
            <div>ลงชื่อ <span class="sig-dots"></span> ${esc(data.signatures.requester?.label || "ผู้ขอเบิกจ่าย (ผู้จัดทำเอกสาร)")}</div>
            <div class="sig-name">(${esc(data.signatures.requester?.name || "..................................................")})</div>
        </div>
        <div class="sig-block">
            <div>ลงชื่อ <span class="sig-dots"></span> ${esc(data.signatures.inspector?.label || "ผู้ตรวจสอบ")}</div>
            <div class="sig-name">(${esc(data.signatures.inspector?.name || "..................................................")})</div>
        </div>
        <div class="sig-block">
            <div>ลงชื่อ <span class="sig-dots"></span> ${esc(data.signatures.accountant?.label || "ฝ่ายบัญชี")}</div>
            <div class="sig-name">(${esc(data.signatures.accountant?.name || "..................................................")})</div>
        </div>
        <div class="sig-block">
            <div>ลงชื่อ <span class="sig-dots"></span> ${esc(data.signatures.payer?.label || "ผู้จ่ายเงิน")}</div>
            <div class="sig-name">(${esc(data.signatures.payer?.name || "..................................................")})</div>
        </div>
    </div>
</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────
// Printable HTML document (3 pages: contract, annex 1, annex 2)
// ─────────────────────────────────────────────────────────────

const esc = (s: unknown) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const nl2br = (s: unknown) => esc(s).replace(/\n/g, "<br/>")

export interface ContractPrintInput {
    contract: Contract
    project?: Project
    worker?: Worker
    org: Partial<CompanyProfile>
}

export function generateContractHTML({ contract: c, project, worker, org }: ContractPrintInput): string {
    const { scope, notes: legacyNotes } = splitLegacyScope(c.scope)
    const notes = c.notes ?? legacyNotes
    const total = Number(c.totalAmount) || 0
    const docNo = c.documentNumber || c.id.slice(0, 8).toUpperCase()
    const signDate = c.signDate || c.startDate || (c.createdAt || "").slice(0, 10)
    const projectName = project?.name || "-"
    const workerName = worker?.name || "-"
    const contractType = c.contractType || "ค่าแรง"
    const installments = c.installments || []
    const conditions = (c.generalConditions || DEFAULT_GENERAL_CONDITIONS).trim()
    const displayAddress = getCompanyAddress(org.address)
    const companyName = org.name || DEFAULT_COMPANY_NAME

    const logo = org.logo
        ? `<img src="${esc(org.logo)}" class="logo" alt="logo"/>`
        : `<div class="logo-fallback">${esc(companyName.charAt(0) || "B")}</div>`

    const header = (subtitle: string, rightRows: [string, string][]) => `
      <div class="hdr">
        <div class="hdr-l">
          <div class="logo-wrap">${logo}</div>
          <div class="org-info">
            <div class="org">${esc(companyName)}</div>
            <div class="muted">${subtitle}</div>
          </div>
        </div>
        <div class="hdr-r">
          <table class="meta">${rightRows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join("")}</table>
        </div>
      </div>
      <div class="rule"></div>`

    const conditionBlocks: string[] = []
    let currentBlock = ""
    for (const rawLine of conditions.split("\n")) {
        const t = rawLine.trim()
        if (!t) continue
        if (/^\d+\./.test(t)) {
            if (currentBlock) conditionBlocks.push(`<div class="c-item">${currentBlock}</div>`)
            currentBlock = `<div class="c-h">${esc(t)}</div>`
        } else {
            currentBlock += `<div class="c-b">${esc(t)}</div>`
        }
    }
    if (currentBlock) conditionBlocks.push(`<div class="c-item">${currentBlock}</div>`)
    const conditionsHtml = conditionBlocks.join("")

    const rows = installments.map((inst, i) => {
        const pct = total > 0 ? Math.round((inst.amount / total) * 1000) / 10 : 0
        return `<tr>
          <td class="c"><b>${i + 1}</b></td>
          <td><div class="inst-title">${esc(inst.description)}</div>${inst.details ? `<div class="sm">${nl2br(inst.details)}</div>` : ""}${inst.paymentDetails ? `<div class="sm inst-pay"><b>เงื่อนไขจ่าย:</b> ${nl2br(inst.paymentDetails)}</div>` : ""}</td>
          <td class="c sm">${inst.dueDate ? thDateLong(inst.dueDate) : "-"}</td>
          <td class="c"><b>${pct}%</b></td>
          <td class="r"><b>${fmtBaht(inst.amount)}</b></td>
        </tr>`
    }).join("")

    const sign = (role: string, name: string) => `
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-name">( ${esc(name || "...................................................")} )</div>
        <div class="muted">${esc(role)}</div>
        <div class="muted">วันที่ ........ / ........ / ................</div>
      </div>`

    const signatures = `
      <div class="sigs">
        ${sign("ฝ่ายผู้ว่าจ้าง", org.signatureName || org.name || "")}
        ${sign("ฝ่ายผู้รับจ้าง / ผู้แทนช่าง", workerName)}
        ${sign("พยาน", "")}
        ${sign("พยาน", "")}
      </div>`

    const twoSignatures = `
      <div class="sigs two">
        ${sign("ฝ่ายผู้ว่าจ้าง", org.signatureName || org.name || "")}
        ${sign("ฝ่ายผู้รับจ้าง / ผู้แทนช่าง", workerName)}
      </div>`

    const page1 = `
    <section class="page page-contract">
      <div class="page-top">
        <div class="hdr">
          <div class="hdr-l">
            <div class="logo-wrap">${logo}</div>
            <div class="org-info">
              <div class="org">${esc(companyName)}</div>
              <div class="muted">${nl2br(displayAddress)}</div>
              ${org.phone ? `<div class="muted">โทร. ${esc(org.phone)}${org.taxId ? ` · เลขประจำตัวผู้เสียภาษี ${esc(org.taxId)}` : ""}</div>` : ""}
            </div>
          </div>
          <div class="hdr-r">
            <table class="meta">
              <tr><td>เลขที่สัญญา</td><td><b>${esc(docNo)}</b></td></tr>
              <tr><td>วันที่ทำสัญญา</td><td><b>${thDateLong(signDate)}</b></td></tr>
              <tr><td>โครงการ</td><td><b>${esc(projectName)}</b></td></tr>
            </table>
          </div>
        </div>
        <div class="rule"></div>
        <h1>${esc(c.title || DEFAULT_CONTRACT_TITLE)}</h1>
        <div class="sub">(SUBCONTRACTOR AGREEMENT)</div>

        <div class="sec">ข้อมูลคู่สัญญา (Parties to Agreement)</div>
        <div class="box grid2">
          <div>
            <div class="lbl">ฝ่ายผู้ว่าจ้าง (บริษัทฯ)</div>
            <div class="party-name"><b>${esc(companyName)}</b></div>
            <div class="sm">สำนักงาน: ${esc(displayAddress)}</div>
            ${org.phone ? `<div class="sm">โทรศัพท์: ${esc(org.phone)}</div>` : ""}
          </div>
          <div>
            <div class="lbl">ฝ่ายผู้รับจ้าง / ผู้รับเหมาช่วง (ช่าง)</div>
            <div class="party-name"><b>${esc(workerName)}</b></div>
            <div class="sm">ข้อมูลวิชาชีพ: ${esc(worker?.role || "ช่างรับเหมา")} · ประเภท: ${esc(contractType)}</div>
            ${worker?.phone ? `<div class="sm">โทรศัพท์: ${esc(worker.phone)}</div>` : ""}
            <div class="sm">สถานที่ปฏิบัติงาน: โครงการ ${esc(projectName)}${project?.location ? ` (${esc(project.location)})` : ""}</div>
          </div>
        </div>

        <div class="sec">สาระสำคัญและข้อตกลงแห่งสัญญา (Terms &amp; Conditions)</div>
        <div class="box terms">
          <div class="term-item">
            <div class="term-h">ข้อ 1. วัตถุประสงค์แห่งการจ้างเหมา:</div>
            <div class="term-b">ผู้ว่าจ้างตกลงจ้างและผู้รับจ้างตกลงรับจ้างทำงาน <b>${esc(contractType)}</b> ณ สถานที่ก่อสร้าง โครงการ <b>${esc(projectName)}</b> ตามแบบแปลน รายการประกอบแบบ และคำแนะนำของวิศวกรหรือผู้ควบคุมงานของผู้ว่าจ้าง</div>
          </div>
          <div class="term-item">
            <div class="term-h">ข้อ 2. ขอบเขตงาน / สิ่งที่รวมในสัญญา (Inclusions):</div>
            <div class="term-b">${nl2br(scope || "-")}${c.inclusions ? `<br/>${nl2br(c.inclusions)}` : ""}</div>
          </div>
          <div class="term-item">
            <div class="term-h">ข้อ 3. สิ่งที่ไม่รวมในสัญญา (Exclusions):</div>
            <div class="term-b">${nl2br(c.exclusions || "-")}</div>
          </div>
          <div class="term-item">
            <div class="term-h">ข้อ 4. มูลค่าการจ้างตามสัญญา:</div>
            <div class="term-b">ทั้งสองฝ่ายตกลงค่าจ้างเหมางานตามสัญญานี้ เป็นจำนวนเงินทั้งสิ้น <span class="pill">${fmtNum(total)} บาท</span> (${bahtText(total)})</div>
          </div>
          <div class="term-item">
            <div class="term-h">ข้อ 5. เงื่อนไขการชำระเงินตามงวดงาน:</div>
            <div class="term-b">ชำระเงินแบ่งเป็น <b>${installments.length} งวดงาน</b> ตามรายละเอียดในเอกสารแนบท้ายสัญญา 1 ${esc(c.paymentTerms || DEFAULT_PAYMENT_TERMS)}</div>
          </div>
          <div class="term-item">
            <div class="term-h">ข้อ 6. การรับประกันผลงาน:</div>
            <div class="term-b">${nl2br(c.warranty || DEFAULT_WARRANTY)}</div>
          </div>
          <div class="term-item">
            <div class="term-h">ข้อ 7. ระยะเวลาดำเนินงาน:</div>
            <div class="term-b">เริ่มงานวันที่ ${thDateLong(c.startDate)} และแล้วเสร็จภายในวันที่ ${thDateLong(c.endDate)}</div>
          </div>
          <div class="term-item">
            <div class="term-h">ข้อ 8. เงื่อนไขทั่วไป และการบอกเลิกสัญญา:</div>
            <div class="term-b">ทั้งสองฝ่ายตกลงผูกพันและปฏิบัติตามมาตรฐานฝีมือช่าง ความปลอดภัย การควบคุมงาน และสิทธิการบอกเลิกสัญญาตามที่ระบุไว้ใน <b>"เอกสารแนบท้ายสัญญา 2"</b> ซึ่งถือเป็นส่วนหนึ่งของสัญญานี้</div>
          </div>
          ${notes ? `<div class="term-item"><div class="term-h">หมายเหตุ:</div><div class="term-b">${nl2br(notes)}</div></div>` : ""}
        </div>
      </div>

      <div class="page-bottom">
        <p class="closing">สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาได้อ่านและเข้าใจข้อความโดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน</p>
        ${signatures}
      </div>
    </section>`

    const page2 = `
    <section class="page">
      <div class="page-top">
        ${header(`เอกสารแนบท้ายสัญญาเลขที่: ${esc(docNo)}<br/>โครงการ: ${esc(projectName)} · ผู้รับจ้าง: ${esc(workerName)}`, [["อ้างอิงสัญญา", docNo], ["มูลค่าจ้างรวม", fmtBaht(total)]])}
        <h2>เอกสารแนบท้ายสัญญา 1: แผนการส่งมอบงานและการจ่ายเงินตามงวดงาน</h2>
        <div class="sub">(ANNEX 1: MILESTONE PAYMENT SCHEDULE &amp; DELIVERABLES)</div>
        <table class="tbl">
          <thead><tr><th style="width:52px">งวดที่</th><th>รายละเอียดงานที่ต้องส่งมอบ (Deliverables)</th><th style="width:120px">กำหนดเสร็จ</th><th style="width:68px">สัดส่วน</th><th style="width:125px">จำนวนเงิน (บาท)</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5" class="c muted">ไม่มีงวดงาน</td></tr>`}</tbody>
          <tfoot><tr><td colspan="3" class="r"><b>รวมมูลค่างานจ้างทั้งสิ้นตามสัญญา (${bahtText(total)}):</b></td><td class="c"><b>100%</b></td><td class="r"><b>${fmtBaht(total)}</b></td></tr></tfoot>
        </table>

        <div class="sec" style="margin-top:14px">หลักเกณฑ์และเงื่อนไขการตรวจรับงานและการเบิกจ่ายเงิน (Payment &amp; Inspection Terms)</div>
        <div class="box terms annex1-terms">
          <div class="term-item">
            <div class="term-h">1. การแจ้งส่งมอบและตรวจรับงาน:</div>
            <div class="term-b">เมื่อผู้รับจ้างดำเนินงานในแต่ละงวดแล้วเสร็จ ต้องแจ้งให้ผู้ว่าจ้างหรือผู้ควบคุมงานเข้าทำการตรวจรับงาน โดยผลงานต้องมีความถูกต้องครบถ้วนตามแบบแปลนและได้มาตรฐานฝีมือช่าง</div>
          </div>
          <div class="term-item">
            <div class="term-h">2. การอนุมัติชำระเงินค่างวด:</div>
            <div class="term-b">${esc(c.paymentTerms || DEFAULT_PAYMENT_TERMS)}</div>
          </div>
          <div class="term-item">
            <div class="term-h">3. การเบิกจ่ายเงินระหว่างงวด (Partial Draw):</div>
            <div class="term-b">กรณีที่มีความจำเป็นต้องเบิกจ่ายเงินระหว่างงวด (เช่น งวดที่ 1.1, 1.2) ให้เป็นไปตามความก้าวหน้าของงานจริงที่เกิดขึ้นหน้างานและได้รับอนุมัติจากผู้ว่าจ้าง โดยยอดรวมของการเบิกย่อยทั้งหมดต้องไม่เกินมูลค่าของงวดงานนั้นๆ</div>
          </div>
          <div class="term-item">
            <div class="term-h">4. เอกสารประกอบการรับเงิน:</div>
            <div class="term-b">ในการรับชำระเงินทุกครั้ง ผู้รับจ้างต้องส่งมอบรูปถ่ายความก้าวหน้าของงาน และลงลายมือชื่อในใบสำคัญรับเงิน (Payment Voucher) ของผู้ว่าจ้างไว้เป็นหลักฐาน</div>
          </div>
        </div>
      </div>

      <div class="page-bottom">
        <p class="closing">คู่สัญญาทั้งสองฝ่ายได้ตรวจสอบตารางงวดงานและเงื่อนไขการเบิกจ่ายข้างต้นถูกต้องตรงกันแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญ</p>
        ${twoSignatures}
      </div>
    </section>`

    const page3 = `
    <section class="page">
      <div class="page-top">
        ${header(`เอกสารแนบท้ายสัญญาเลขที่: ${esc(docNo)}<br/>โครงการ: ${esc(projectName)} · ผู้รับจ้าง: ${esc(workerName)}`, [["อ้างอิงสัญญา", docNo], ["วันที่", thDateLong(signDate)]])}
        <h2>เอกสารแนบท้ายสัญญา 2: เงื่อนไข ข้อตกลง และการยกเลิกสัญญาจ้างเหมางาน</h2>
        <div class="sub">(ANNEX 2: GENERAL CONDITIONS, WORK QUALITY, SAFETY &amp; CONTRACT TERMINATION)</div>
        <div class="box terms annex-terms">${conditionsHtml}</div>
      </div>
      <div class="page-bottom">
        <p class="closing">คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจเงื่อนไขและข้อตกลงในเอกสารแนบท้ายสัญญานี้โดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญ</p>
        ${twoSignatures}
      </div>
    </section>`

    return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/>
<title>${esc(docNo)} - ${esc(c.title || DEFAULT_CONTRACT_TITLE)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e5e7eb; }
  body { font-family: 'Sarabun', sans-serif; color: #0f172a; font-size: 11.5px; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
    width: 210mm;
    height: 296mm;
    max-height: 296mm;
    margin: 16px auto;
    padding: 12mm 15mm 14mm;
    background: #fff;
    box-shadow: 0 8px 30px rgba(0,0,0,.15);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .page-top {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .page-bottom {
    margin-top: 10px;
    flex-shrink: 0;
  }
  .hdr { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
  .hdr-l { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .logo-wrap { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .logo { height: 48px; max-width: 115px; object-fit: contain; }
  .logo-fallback { width: 42px; height: 42px; border-radius: 50%; background: #0f172a; color: #fff; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; }
  .org-info { min-width: 0; }
  .org { font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.25; }
  .muted { color: #64748b; font-size: 10.5px; line-height: 1.4; }
  .hdr-r { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
  .meta { border: 1px solid #cbd5e1; border-radius: 6px; font-size: 10.5px; border-collapse: separate; padding: 4px 10px; background: #f8fafc; }
  .meta td { padding: 1.5px 5px; } .meta td:first-child { color: #64748b; white-space: nowrap; } .meta td:last-child { text-align: right; }
  .rule { border-top: 2px solid #0f172a; margin: 9px 0 10px; }
  h1 { text-align: center; font-size: 18px; font-weight: 700; margin: 0; color: #0f172a; }
  h2 { text-align: center; font-size: 15.5px; font-weight: 700; margin: 0; color: #0f172a; }
  .sub { text-align: center; color: #64748b; font-size: 10px; font-weight: 500; margin-bottom: 8px; }
  .sec { background: #ecfdf5; color: #065f46; font-weight: 700; padding: 4px 10px; border-left: 3.5px solid #10b981; margin: 8px 0 6px; font-size: 11.5px; }
  .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 9px 12px; background: #ffffff; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
  .party-name { font-size: 12px; color: #0f172a; margin-bottom: 1px; }
  .lbl { color: #059669; font-weight: 700; font-size: 11px; margin-bottom: 2px; }
  .sm { font-size: 10.5px; color: #334155; line-height: 1.42; }
  .terms {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 12px 14px;
    font-size: 11px;
    line-height: 1.42;
    color: #1e293b;
  }
  .term-item { margin: 0; }
  .term-h { font-weight: 700; color: #0f172a; margin-bottom: 1px; }
  .term-b { padding-left: 10px; color: #334155; }
  .annex1-terms {
    justify-content: space-around;
    padding: 14px 16px;
    font-size: 11px;
    line-height: 1.5;
  }
  .annex-terms {
    justify-content: space-between;
    padding: 14px 16px;
    font-size: 11.5px;
    line-height: 1.55;
  }
  .c-item { margin: 0; }
  .c-h { font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .c-b { padding-left: 14px; color: #334155; }
  .pill { display: inline-block; border: 1px solid #10b981; background: #ecfdf5; color: #065f46; padding: 0 7px; border-radius: 4px; font-weight: 700; }
  .tbl { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11.5px; margin-top: 4px; }
  .tbl th { background: #f1f5f9; padding: 8px 10px; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; }
  .tbl td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: top; }
  .tbl tfoot td { background: #ecfdf5; color: #065f46; border-top: 1.5px solid #10b981; padding: 9px 10px; font-size: 12px; }
  .inst-title { font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .inst-pay { margin-top: 3px; padding: 3px 6px; background: #ecfdf5; color: #065f46; border-radius: 4px; }
  .c { text-align: center; } .r { text-align: right; }
  .closing { font-size: 10.5px; color: #475569; margin: 0 0 8px; text-align: center; line-height: 1.4; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 40px; padding-top: 8px; border-top: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid; }
  .sigs.two { padding-top: 12px; }
  .sig { text-align: center; font-size: 11px; }
  .sig-line { border-bottom: 1px dotted #475569; height: 28px; margin: 0 20px 4px; }
  .sig-name { font-weight: 600; font-size: 11px; color: #0f172a; }
  @media print {
    html, body { background: #fff; margin: 0; padding: 0; }
    .page {
      width: 210mm !important;
      height: 296mm !important;
      max-height: 296mm !important;
      margin: 0 !important;
      padding: 12mm 15mm 14mm !important;
      box-shadow: none !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
  }
</style></head><body>${page1}${page2}${page3}</body></html>`
}
