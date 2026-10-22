import type { Contract, ContractInstallment, ContractDraw, Project, Worker, CompanyProfile } from "@/context/project-context"

// ─────────────────────────────────────────────────────────────
// Constants / defaults
// ─────────────────────────────────────────────────────────────

export const CONTRACT_TYPES = ["ค่าแรง", "ค่าแรง + วัสดุ", "วัสดุ", "เหมารวม"] as const

export const DEFAULT_CONTRACT_TITLE = "สัญญาจ้างเหมางาน"

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

    const logo = org.logo
        ? `<img src="${esc(org.logo)}" class="logo" alt="logo"/>`
        : ""

    const header = (subtitle: string, rightRows: [string, string][]) => `
      <div class="hdr">
        <div>
          <div class="org">${esc(org.name || "ชื่อบริษัท")}</div>
          <div class="muted">${subtitle}</div>
        </div>
        <div class="hdr-r">
          ${logo}
          <table class="meta">${rightRows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join("")}</table>
        </div>
      </div>
      <div class="rule"></div>`

    const conditionsHtml = conditions.split("\n").map(line => {
        const t = line.trim()
        if (!t) return ""
        return /^\d+\./.test(t) ? `<div class="c-h">${esc(t)}</div>` : `<div class="c-b">${esc(t)}</div>`
    }).join("")

    const rows = installments.map((inst, i) => {
        const pct = total > 0 ? Math.round((inst.amount / total) * 1000) / 10 : 0
        return `<tr>
          <td class="c">${i + 1}</td>
          <td><b>${esc(inst.description)}</b>${inst.details ? `<div class="sm">${nl2br(inst.details)}</div>` : ""}${inst.paymentDetails ? `<div class="sm">งานส่งมอบ: ${nl2br(inst.paymentDetails)}</div>` : ""}</td>
          <td class="c sm">${inst.dueDate ? thDateLong(inst.dueDate) : "-"}</td>
          <td class="c">${pct}%</td>
          <td class="r"><b>${fmtBaht(inst.amount)}</b></td>
        </tr>`
    }).join("")

    const sign = (role: string, name: string) => `
      <div class="sig">
        <div class="sig-line"></div>
        <div>( ${esc(name || "...................................................")} )</div>
        <div class="muted">${esc(role)}</div>
        <div class="muted">วันที่ ......../......../............</div>
      </div>`

    const signatures = `
      <div class="sigs">
        ${sign("ผู้ว่าจ้าง", org.signatureName || org.name || "")}
        ${sign("ผู้รับจ้าง", workerName)}
        ${sign("พยาน", "")}
        ${sign("พยาน", "")}
      </div>`

    const page1 = `
    <section class="page">
      <div class="hdr">
        <div>
          <div class="org">${esc(org.name || "ชื่อบริษัท")}</div>
          <div class="muted">${nl2br(org.address || "")}</div>
          ${org.phone ? `<div class="muted">โทร. ${esc(org.phone)}${org.taxId ? ` · เลขประจำตัวผู้เสียภาษี ${esc(org.taxId)}` : ""}</div>` : ""}
        </div>
        <div class="hdr-r">
          ${logo}
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
          <div><b>${esc(org.name || "-")}</b></div>
          <div class="sm">สำนักงาน: ${esc(org.address || "-")}</div>
          ${org.phone ? `<div class="sm">โทรศัพท์: ${esc(org.phone)}</div>` : ""}
        </div>
        <div>
          <div class="lbl">ฝ่ายผู้รับจ้าง / ผู้รับเหมาช่วง (ช่าง)</div>
          <div><b>${esc(workerName)}</b></div>
          <div class="sm">ข้อมูลวิชาชีพ: ${esc(worker?.role || "-")} · ประเภท: ${esc(contractType)}</div>
          ${worker?.phone ? `<div class="sm">โทรศัพท์: ${esc(worker.phone)}</div>` : ""}
          <div class="sm">สถานที่ปฏิบัติงาน: โครงการ ${esc(projectName)}${project?.location ? ` (${esc(project.location)})` : ""}</div>
        </div>
      </div>

      <div class="sec">สาระสำคัญและข้อตกลงแห่งสัญญา (Terms &amp; Conditions)</div>
      <div class="box terms">
        <p><b>ข้อ 1. วัตถุประสงค์แห่งการจ้างเหมา:</b><br/>ผู้ว่าจ้างตกลงจ้างและผู้รับจ้างตกลงรับจ้างทำงาน <b>${esc(contractType)}</b> ณ สถานที่ก่อสร้าง โครงการ <b>${esc(projectName)}</b> ตามแบบแปลน รายการประกอบแบบ และคำแนะนำของวิศวกรหรือผู้ควบคุมงานของผู้ว่าจ้าง</p>
        <p><b>ข้อ 2. ขอบเขตงาน / สิ่งที่รวมในสัญญา (Inclusions):</b><br/>${nl2br(scope || "-")}${c.inclusions ? `<br/>${nl2br(c.inclusions)}` : ""}</p>
        <p><b>ข้อ 3. สิ่งที่ไม่รวมในสัญญา (Exclusions):</b><br/>${nl2br(c.exclusions || "-")}</p>
        <p><b>ข้อ 4. มูลค่าการจ้างตามสัญญา:</b><br/>ทั้งสองฝ่ายตกลงค่าจ้างเหมางานตามสัญญานี้ เป็นจำนวนเงินทั้งสิ้น <span class="pill">${fmtNum(total)} บาท</span> (${bahtText(total)})</p>
        <p><b>ข้อ 5. เงื่อนไขการชำระเงินตามงวดงาน:</b><br/>ชำระเงินแบ่งเป็น <b>${installments.length} งวดงาน</b> ตามรายละเอียดในเอกสารแนบท้ายสัญญา 1 ${esc(c.paymentTerms || DEFAULT_PAYMENT_TERMS)}</p>
        <p><b>ข้อ 6. การรับประกันผลงาน:</b><br/>${nl2br(c.warranty || DEFAULT_WARRANTY)}</p>
        <p><b>ข้อ 7. ระยะเวลาดำเนินงาน:</b><br/>เริ่มงานวันที่ ${thDateLong(c.startDate)} และแล้วเสร็จภายในวันที่ ${thDateLong(c.endDate)}</p>
        <p><b>ข้อ 8. เงื่อนไขทั่วไป และการบอกเลิกสัญญา:</b><br/>ทั้งสองฝ่ายตกลงปฏิบัติตาม <b>"เอกสารแนบท้ายสัญญา 2"</b> ซึ่งถือเป็นส่วนหนึ่งของสัญญานี้</p>
        ${notes ? `<p><b>หมายเหตุ:</b><br/>${nl2br(notes)}</p>` : ""}
      </div>
      <p class="sm" style="margin-top:10px">สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาได้อ่านและเข้าใจข้อความโดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน</p>
      ${signatures}
    </section>`

    const page2 = `
    <section class="page">
      ${header(`เอกสารแนบท้ายสัญญาเลขที่: ${esc(docNo)}<br/>โครงการ: ${esc(projectName)} · ผู้รับจ้าง: ${esc(workerName)}`, [["อ้างอิงสัญญา", docNo], ["มูลค่าจ้างรวม", fmtBaht(total)]])}
      <h2>เอกสารแนบท้ายสัญญา 1: แผนการส่งมอบงานและการจ่ายเงินตามงวดงาน</h2>
      <div class="sub">(ANNEX 1: MILESTONE PAYMENT SCHEDULE &amp; DELIVERABLES)</div>
      <table class="tbl">
        <thead><tr><th style="width:48px">งวดที่</th><th>รายละเอียดงานที่ต้องส่งมอบ (Deliverables)</th><th style="width:110px">กำหนดเสร็จ</th><th style="width:60px">สัดส่วน</th><th style="width:110px">จำนวนเงิน (บาท)</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" class="c muted">ไม่มีงวดงาน</td></tr>`}</tbody>
        <tfoot><tr><td colspan="3" class="r"><b>รวมมูลค่างานจ้างทั้งสิ้นตามสัญญา (${bahtText(total)}):</b></td><td class="c"><b>100%</b></td><td class="r"><b>${fmtBaht(total)}</b></td></tr></tfoot>
      </table>
      <p class="sm muted" style="margin-top:8px">* การเบิกจ่ายระหว่างงวด (เช่น งวดที่ 5.1, 5.2) ให้เป็นไปตามความก้าวหน้าของงานจริงและได้รับอนุมัติจากผู้ว่าจ้าง โดยยอดรวมของการเบิกย่อยต้องไม่เกินมูลค่าของงวดนั้น</p>
    </section>`

    const page3 = `
    <section class="page">
      ${header(`เอกสารแนบท้ายสัญญาเลขที่: ${esc(docNo)}<br/>โครงการ: ${esc(projectName)} · ผู้รับจ้าง: ${esc(workerName)}`, [["อ้างอิงสัญญา", docNo], ["วันที่", thDateLong(signDate)]])}
      <h2>เอกสารแนบท้ายสัญญา 2: เงื่อนไข ข้อตกลง และการยกเลิกสัญญาจ้างเหมางาน</h2>
      <div class="sub">(ANNEX 2: GENERAL CONDITIONS, WORK QUALITY, SAFETY &amp; CONTRACT TERMINATION)</div>
      <div class="box terms">${conditionsHtml}</div>
      <div class="sigs two">
        ${sign("ผู้ว่าจ้าง", org.signatureName || org.name || "")}
        ${sign("ผู้รับจ้าง", workerName)}
      </div>
    </section>`

    return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/>
<title>${esc(docNo)} - ${esc(c.title || DEFAULT_CONTRACT_TITLE)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e5e7eb; }
  body { font-family: 'Sarabun', sans-serif; color: #111827; font-size: 12.5px; line-height: 1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; margin: 16px auto; padding: 16mm 15mm; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,.15); position: relative; }
  .hdr { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
  .hdr-r { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .logo { height: 40px; max-width: 120px; object-fit: contain; }
  .org { font-size: 17px; font-weight: 700; }
  .muted { color: #6b7280; font-size: 11px; }
  .meta { border: 1px solid #e5e7eb; border-radius: 6px; font-size: 11px; border-collapse: separate; padding: 4px 8px; }
  .meta td { padding: 1px 4px; } .meta td:first-child { color: #6b7280; } .meta td:last-child { text-align: right; }
  .rule { border-top: 2px solid #111827; margin: 12px 0 14px; }
  h1 { text-align: center; font-size: 20px; margin: 0; }
  h2 { text-align: center; font-size: 16px; margin: 0; }
  .sub { text-align: center; color: #6b7280; font-size: 11px; margin-bottom: 14px; }
  .sec { background: #ecfdf5; color: #065f46; font-weight: 700; padding: 4px 10px; border-left: 3px solid #10b981; margin: 12px 0 6px; font-size: 12px; }
  .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .lbl { color: #059669; font-weight: 600; font-size: 11.5px; }
  .sm { font-size: 11px; color: #374151; }
  .terms p { margin: 0 0 7px; }
  .pill { display: inline-block; border: 1px solid #10b981; background: #ecfdf5; color: #065f46; padding: 0 8px; border-radius: 6px; font-weight: 700; }
  .c-h { font-weight: 700; margin-top: 6px; }
  .c-b { padding-left: 14px; color: #374151; }
  .tbl { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 12px; }
  .tbl th { background: #f3f4f6; padding: 6px; border-bottom: 1px solid #d1d5db; }
  .tbl td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .tbl tfoot td { background: #ecfdf5; color: #065f46; border-top: 1px solid #10b981; }
  .c { text-align: center; } .r { text-align: right; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 40px; margin-top: 26px; page-break-inside: avoid; }
  .sig { text-align: center; font-size: 12px; }
  .sig-line { border-bottom: 1px dotted #111; height: 34px; margin: 0 20px 4px; }
  @media print {
    html, body { background: #fff; }
    .page { margin: 0; box-shadow: none; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
  }
</style></head><body>${page1}${page2}${page3}</body></html>`
}
