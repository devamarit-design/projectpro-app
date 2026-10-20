"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
    Plus,
    Trash2,
    FileText,
    Save,
    X,
    ChevronDown,
    AlertTriangle,
    Wand2,
    Lock,
    RotateCcw,
    Hash,
    Calendar,
    Briefcase,
    Building2,
    CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { useProjects, Contract, ContractInstallment } from "@/context/project-context"
import SearchableCombobox from "@/components/ui/searchable-combobox"
import { cn } from "@/lib/utils"
import {
    CONTRACT_TYPES,
    DEFAULT_CONTRACT_TITLE,
    DEFAULT_GENERAL_CONDITIONS,
    DEFAULT_PAYMENT_TERMS,
    DEFAULT_WARRANTY,
    fmtBaht,
    fmtNum,
    bahtText,
    getInstallmentDrawn,
    splitLegacyScope,
    generateContractNumber,
    todayISO
} from "@/lib/contract-utils"

interface InstallmentRow extends ContractInstallment {
    _key: string
}

interface AddContractDialogProps {
    isOpen: boolean
    onClose: () => void
    initialData?: Contract
    defaultProjectId?: string
}

const newKey = () => Math.random().toString(36).slice(2, 10)

const blankInstallment = (n: number): InstallmentRow => ({
    _key: newKey(),
    id: newKey(),
    description: n === 1 ? "เตรียมงานและงานโครงสร้างฐานราก" : "",
    details: "",
    paymentDetails: "",
    amount: 0,
    dueDate: "",
    status: "Pending",
    draws: []
})

const inputCls =
    "w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition"
const labelCls = "text-xs font-semibold text-muted-foreground flex items-center gap-1.5"

function Section({
    title,
    subtitle,
    children,
    defaultOpen = true,
    badge
}: {
    title: string
    subtitle?: string
    children: React.ReactNode
    defaultOpen?: boolean
    badge?: React.ReactNode
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <section className="rounded-2xl border border-border bg-card/70 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-muted/20 hover:bg-muted/40 transition text-left"
            >
                <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        {title}
                    </h3>
                    {badge}
                    {subtitle && <span className="text-xs text-muted-foreground hidden md:inline">• {subtitle}</span>}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </button>
            {open && <div className="p-5 space-y-4 animate-in fade-in">{children}</div>}
        </section>
    )
}

export function AddContractDialog({ isOpen, onClose, initialData, defaultProjectId }: AddContractDialogProps) {
    const { contracts, projects, workers, addContract, updateContract } = useProjects()

    // Form States
    const [documentNumber, setDocumentNumber] = useState("")
    const [projectId, setProjectId] = useState("")
    const [workerId, setWorkerId] = useState("")
    const [title, setTitle] = useState(DEFAULT_CONTRACT_TITLE)
    const [contractType, setContractType] = useState<string>(CONTRACT_TYPES[0])
    const [signDate, setSignDate] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [scope, setScope] = useState("")
    const [inclusions, setInclusions] = useState("")
    const [exclusions, setExclusions] = useState("")
    const [totalInput, setTotalInput] = useState<number>(0)
    const [installments, setInstallments] = useState<InstallmentRow[]>([blankInstallment(1)])
    const [warranty, setWarranty] = useState(DEFAULT_WARRANTY)
    const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS)
    const [generalConditions, setGeneralConditions] = useState(DEFAULT_GENERAL_CONDITIONS)
    const [notes, setNotes] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        if (initialData) {
            const legacy = splitLegacyScope(initialData.scope)
            setDocumentNumber(initialData.documentNumber || generateContractNumber(contracts))
            setProjectId(initialData.projectId)
            setWorkerId(initialData.workerId)
            setTitle(initialData.title || DEFAULT_CONTRACT_TITLE)
            setContractType(initialData.contractType || CONTRACT_TYPES[0])
            setSignDate(initialData.signDate || initialData.startDate || "")
            setStartDate(initialData.startDate || "")
            setEndDate(initialData.endDate || "")
            setScope(legacy.scope)
            setInclusions(initialData.inclusions || "")
            setExclusions(initialData.exclusions || "")
            setNotes(initialData.notes ?? legacy.notes)
            setWarranty(initialData.warranty || DEFAULT_WARRANTY)
            setPaymentTerms(initialData.paymentTerms || DEFAULT_PAYMENT_TERMS)
            setGeneralConditions(initialData.generalConditions || DEFAULT_GENERAL_CONDITIONS)
            setInstallments((initialData.installments || []).map(i => ({ ...i, _key: newKey(), draws: i.draws || [] })))
            setTotalInput(initialData.totalAmount || 0)
        } else {
            setDocumentNumber(generateContractNumber(contracts))
            setProjectId(defaultProjectId || projects[0]?.id || "")
            setWorkerId("")
            setTitle(DEFAULT_CONTRACT_TITLE)
            setContractType(CONTRACT_TYPES[0])
            setSignDate(todayISO())
            setStartDate(todayISO())
            setEndDate("")
            setScope("")
            setInclusions("")
            setExclusions("")
            setNotes("")
            setWarranty(DEFAULT_WARRANTY)
            setPaymentTerms(DEFAULT_PAYMENT_TERMS)
            setGeneralConditions(DEFAULT_GENERAL_CONDITIONS)
            setInstallments([blankInstallment(1)])
            setTotalInput(0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialData?.id])

    const sumInstallments = useMemo(
        () => installments.reduce((s, i) => s + (Number(i.amount) || 0), 0),
        [installments]
    )
    const total = totalInput > 0 ? totalInput : sumInstallments
    const mismatch = totalInput > 0 && Math.abs(totalInput - sumInstallments) > 0.009

    const updateRow = (key: string, patch: Partial<InstallmentRow>) =>
        setInstallments(rows => rows.map(r => (r._key === key ? { ...r, ...patch } : r)))

    const setPercent = (key: string, pct: number) => {
        if (total <= 0) return
        updateRow(key, { amount: Math.round((total * pct) / 100) })
    }

    const moveRow = (idx: number, dir: -1 | 1) =>
        setInstallments(rows => {
            const j = idx + dir
            if (j < 0 || j >= rows.length) return rows
            const next = [...rows]
            ;[next[idx], next[j]] = [next[j], next[idx]]
            return next
        })

    /** Split total evenly across installments that haven't been drawn yet */
    const autoSplit = () => {
        if (totalInput <= 0) {
            toast.error("กรุณาระบุมูลค่าสัญญารวมก่อน")
            return
        }
        const locked = installments.filter((r, i) => getInstallmentDrawn(r, i) > 0)
        const lockedSum = locked.reduce((s, r) => s + r.amount, 0)
        const free = installments.filter((r, i) => getInstallmentDrawn(r, i) <= 0)
        if (free.length === 0) return
        const each = Math.floor((totalInput - lockedSum) / free.length)
        let leftover = totalInput - lockedSum - each * free.length
        setInstallments(rows =>
            rows.map((r, i) => {
                if (getInstallmentDrawn(r, i) > 0) return r
                const extra = leftover > 0 ? leftover : 0
                leftover = 0
                return { ...r, amount: each + extra }
            })
        )
        toast.success(`แบ่งจำนวนเงินเท่ากันใน ${free.length} งวดงานเรียบร้อย`)
    }

    const handleSave = async () => {
        const cleanDocNo = documentNumber.trim()
        if (!cleanDocNo) return toast.error("กรุณาระบุเลขที่สัญญา")
        if (!projectId) return toast.error("กรุณาเลือกโครงการ")
        if (!workerId) return toast.error("กรุณาเลือกผู้รับจ้าง (ช่าง)")
        if (installments.length === 0) return toast.error("ต้องมีอย่างน้อย 1 งวดงาน")
        if (installments.some(i => !i.description.trim())) return toast.error("กรุณาระบุชื่องวดงานให้ครบถ้วน")
        const under = installments.findIndex((r, i) => r.amount + 0.009 < getInstallmentDrawn(r, i))
        if (under >= 0) return toast.error(`งวดที่ ${under + 1} มียอดน้อยกว่าที่เบิกไปแล้ว`)

        const cleanInstallments: ContractInstallment[] = installments.map(({ _key, ...rest }) => ({
            ...rest,
            description: rest.description.trim(),
            amount: Number(rest.amount) || 0
        }))

        const payload = {
            documentNumber: cleanDocNo,
            projectId,
            workerId,
            title: title.trim() || DEFAULT_CONTRACT_TITLE,
            contractType,
            signDate,
            startDate,
            endDate,
            scope: scope.trim(),
            inclusions: inclusions.trim(),
            exclusions: exclusions.trim(),
            warranty: warranty.trim(),
            paymentTerms: paymentTerms.trim(),
            generalConditions: generalConditions.trim(),
            notes: notes.trim(),
            totalAmount: sumInstallments,
            installments: cleanInstallments
        }

        setSaving(true)
        try {
            if (initialData) await updateContract(initialData.id, payload)
            else await addContract(payload)
            toast.success(initialData ? "บันทึกการแก้ไขสัญญาแล้ว" : `สร้างสัญญา ${cleanDocNo} เรียบร้อย`)
            onClose()
        } catch (e: any) {
            toast.error(e?.message || "บันทึกไม่สำเร็จ")
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen || typeof document === "undefined") return null

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-6xl xl:max-w-7xl h-[94vh] max-h-[96vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                {/* ─────────────────────────────────────────────────────────────
                    HEADER
                   ───────────────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-muted/20 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold leading-tight">
                                {initialData ? "แก้ไขสัญญาจ้างเหมางาน" : "สร้างสัญญาจ้างเหมางานใหม่"}
                            </h2>
                            <p className="text-xs text-muted-foreground truncate">
                                กำหนดรายละเอียดสัญญา ขอบเขตงาน และตารางงวดงานสำหรับเบิกจ่าย
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                            aria-label="ปิด"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    BODY (Scrollable)
                   ───────────────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 custom-scrollbar">
                    {/* SECTION 1: ข้อมูลทั่วไป */}
                    <Section
                        title="1. ข้อมูลทั่วไป"
                        subtitle="เลขที่สัญญา, โครงการ, ช่างผู้รับเหมา และกำหนดการ"
                        badge={
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                {documentNumber || "CT-yyyymmdd-ลำดับ"}
                            </span>
                        }
                    >
                        {/* Row 1: Document number, Project, Worker, Contract Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="ct-docno" className={labelCls}>
                                        <Hash className="w-3.5 h-3.5 text-violet-500" />
                                        <span>เลขที่สัญญา *</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setDocumentNumber(generateContractNumber(contracts))}
                                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                        title="สร้างเลขที่สัญญาตามลำดับใหม่อัตโนมัติ"
                                    >
                                        <RotateCcw className="w-2.5 h-2.5" /> รีเซ็ต
                                    </button>
                                </div>
                                <input
                                    id="ct-docno"
                                    value={documentNumber}
                                    onChange={e => setDocumentNumber(e.target.value)}
                                    placeholder="เช่น CT-20261020-01"
                                    className={cn(inputCls, "font-bold text-violet-600 dark:text-violet-400 tracking-wider")}
                                />
                                <p className="text-[10px] text-muted-foreground">เริ่มต้น CT-yyyymmdd-ลำดับ (แก้ไขได้)</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelCls}>
                                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                                    <span>โครงการ *</span>
                                </label>
                                <SearchableCombobox
                                    options={projects.map(p => ({ value: p.id, label: p.name, description: p.customer }))}
                                    value={projectId}
                                    onChange={setProjectId}
                                    placeholder="เลือกโครงการ..."
                                    searchPlaceholder="ค้นหาโครงการ..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelCls}>
                                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>ผู้รับจ้าง / ช่าง *</span>
                                </label>
                                <SearchableCombobox
                                    options={workers.map(w => ({ value: w.id, label: w.name, description: w.role }))}
                                    value={workerId}
                                    onChange={setWorkerId}
                                    placeholder="เลือกช่างผู้รับงาน..."
                                    searchPlaceholder="ค้นหาช่าง..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="ct-type" className={labelCls}>
                                    <span>ประเภทงาน</span>
                                </label>
                                <input
                                    id="ct-type"
                                    list="ct-type-list"
                                    value={contractType}
                                    onChange={e => setContractType(e.target.value)}
                                    className={inputCls}
                                    placeholder="เช่น ค่าแรง, ค่าแรง + ค่าวัสดุ"
                                />
                                <datalist id="ct-type-list">
                                    {CONTRACT_TYPES.map(t => (
                                        <option key={t} value={t} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* Row 2: Title, Sign Date, Start Date, End Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                            <div className="space-y-1.5">
                                <label htmlFor="ct-title" className={labelCls}>
                                    <span>ชื่อสัญญา / หัวข้องาน</span>
                                </label>
                                <input
                                    id="ct-title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="เช่น สัญญาจ้างเหมางานก่อสร้าง"
                                    className={inputCls}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="ct-sign" className={labelCls}>
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>วันที่ทำสัญญา</span>
                                </label>
                                <input
                                    id="ct-sign"
                                    type="date"
                                    value={signDate}
                                    onChange={e => setSignDate(e.target.value)}
                                    className={inputCls}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="ct-start" className={labelCls}>
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>เริ่มปฏิบัติงาน</span>
                                </label>
                                <input
                                    id="ct-start"
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className={inputCls}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="ct-end" className={labelCls}>
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>กำหนดแล้วเสร็จ</span>
                                </label>
                                <input
                                    id="ct-end"
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* SECTION 2: ขอบเขตงาน */}
                    <Section
                        title="2. ขอบเขตงานและรายการประกอบ"
                        subtitle="รายละเอียดงานที่จะดำเนินการ สิ่งที่รวม และสิ่งที่ไม่รวมในสัญญา"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5 lg:col-span-1">
                                <label htmlFor="ct-scope" className={labelCls}>
                                    <span>ขอบเขตงาน (Scope of Work)</span>
                                </label>
                                <textarea
                                    id="ct-scope"
                                    value={scope}
                                    onChange={e => setScope(e.target.value)}
                                    rows={5}
                                    placeholder={
                                        "ระบุรายละเอียดงานที่ต้องทำตามสัญญา เช่น\n- งานขุดดิน ปรับระดับ และเทลีน\n- งานผูกเหล็กและหล่อคอนกรีตฐานราก"
                                    }
                                    className={inputCls}
                                />
                            </div>

                            <div className="space-y-1.5 lg:col-span-1">
                                <label htmlFor="ct-inc" className={labelCls}>
                                    <span>สิ่งที่รวมในสัญญา (Inclusions)</span>
                                </label>
                                <textarea
                                    id="ct-inc"
                                    value={inclusions}
                                    onChange={e => setInclusions(e.target.value)}
                                    rows={5}
                                    placeholder="เช่น ค่าแรงช่าง, เครื่องมือและอุปกรณ์ก่อสร้าง, นั่งร้าน, การทำความสะอาดหน้างาน"
                                    className={inputCls}
                                />
                            </div>

                            <div className="space-y-1.5 lg:col-span-1">
                                <label htmlFor="ct-exc" className={labelCls}>
                                    <span>สิ่งที่ไม่รวมในสัญญา (Exclusions)</span>
                                </label>
                                <textarea
                                    id="ct-exc"
                                    value={exclusions}
                                    onChange={e => setExclusions(e.target.value)}
                                    rows={5}
                                    placeholder="เช่น วัสดุหลัก (ผู้ว่าจ้างเป็นผู้จัดหา), งานระบบไฟฟ้าภายใน, งานตกแต่งพิเศษ"
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* SECTION 3: มูลค่าและตารางงวดงาน (Wide Milestone Table) */}
                    <Section
                        title="3. มูลค่าสัญญาและแผนแบ่งงวดงาน"
                        subtitle="กำหนดตารางงวดงาน สำหรับส่งมอบและออกเบิกจ่ายเข้าสู่ระบบรายจ่าย"
                        badge={
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {installments.length} งวด • รวม {fmtBaht(sumInstallments)}
                            </span>
                        }
                    >
                        {/* Control bar above table */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/70">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="space-y-1 min-w-[200px]">
                                    <label htmlFor="ct-total" className="text-[11px] font-bold text-muted-foreground uppercase">
                                        มูลค่าสัญญารวม (ใช้คำนวณ %)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                                            ฿
                                        </span>
                                        <input
                                            id="ct-total"
                                            type="number"
                                            inputMode="decimal"
                                            value={totalInput || ""}
                                            placeholder={String(sumInstallments || "")}
                                            onChange={e => setTotalInput(parseFloat(e.target.value) || 0)}
                                            className={cn(inputCls, "pl-7 py-1.5 font-bold text-base tabular-nums")}
                                        />
                                    </div>
                                </div>

                                <div className="hidden sm:block border-l border-border/80 h-9" />

                                <div className="text-xs space-y-0.5">
                                    <span className="text-muted-foreground block text-[11px]">ยอดรวมทุกงวดขณะนี้:</span>
                                    <span className="font-extrabold text-base text-foreground tabular-nums">
                                        {fmtBaht(sumInstallments)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={autoSplit}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold shadow-sm transition active:scale-95"
                                    title="คำนวณยอดเงินหารเท่ากันทุกงวดที่ยังไม่ได้เบิก"
                                >
                                    <Wand2 className="w-3.5 h-3.5 text-violet-500" />
                                    <span>แบ่งเท่ากันทุกงวด</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setInstallments(rows => [...rows, blankInstallment(rows.length + 1)])}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:opacity-90 active:scale-95 transition"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>เพิ่มงวดงาน</span>
                                </button>
                            </div>
                        </div>

                        {/* Mismatch Alert */}
                        {mismatch && (
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs border border-amber-500/20">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    ผลรวมยอดเงินของทุกงวด <b>{fmtBaht(sumInstallments)}</b> ไม่เท่ากับมูลค่าสัญญารวมที่ระบุ{" "}
                                    <b>{fmtBaht(totalInput)}</b> (ผลต่าง {fmtBaht(Math.abs(totalInput - sumInstallments))}) — เมื่อกดบันทึก มูลค่าสัญญาจะยึดตามผลรวมของงวดงาน
                                </div>
                            </div>
                        )}

                        {/* Desktop-optimized Milestone Table */}
                        <div className="border border-border rounded-xl overflow-x-auto shadow-sm">
                            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-muted/60 text-muted-foreground border-b border-border font-bold">
                                        <th className="py-2.5 px-3 w-16 text-center">งวด</th>
                                        <th className="py-2.5 px-3 min-w-[220px]">ชื่องวดงาน *</th>
                                        <th className="py-2.5 px-3 min-w-[220px]">รายละเอียดงานในงวด</th>
                                        <th className="py-2.5 px-3 min-w-[200px]">งานส่งมอบ / เงื่อนไขเบิก</th>
                                        <th className="py-2.5 px-3 w-36">กำหนดเสร็จ</th>
                                        <th className="py-2.5 px-3 w-20 text-center">%</th>
                                        <th className="py-2.5 px-3 w-36 text-right">จำนวนเงิน (฿) *</th>
                                        <th className="py-2.5 px-2 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {installments.map((row, idx) => {
                                        const drawn = getInstallmentDrawn(row, idx)
                                        const locked = drawn > 0
                                        const pct = total > 0 ? Math.round((row.amount / total) * 1000) / 10 : 0

                                        return (
                                            <tr
                                                key={row._key}
                                                className={cn(
                                                    "transition hover:bg-muted/30",
                                                    locked && "bg-emerald-500/5"
                                                )}
                                            >
                                                {/* Sequence + Move buttons */}
                                                <td className="py-2.5 px-2 text-center align-top">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-extrabold text-sm text-violet-600 dark:text-violet-400">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="flex gap-1 mt-1 text-[9px] text-muted-foreground">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveRow(idx, -1)}
                                                                disabled={idx === 0}
                                                                className="hover:text-foreground disabled:opacity-20 p-0.5"
                                                                title="เลื่อนขึ้น"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveRow(idx, 1)}
                                                                disabled={idx === installments.length - 1}
                                                                className="hover:text-foreground disabled:opacity-20 p-0.5"
                                                                title="เลื่อนลง"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Milestone Title */}
                                                <td className="py-2.5 px-2 align-top">
                                                    <input
                                                        value={row.description}
                                                        onChange={e => updateRow(row._key, { description: e.target.value })}
                                                        placeholder="เช่น งานโครงสร้างชั้น 1 แล้วเสร็จ"
                                                        className={cn(inputCls, "font-semibold")}
                                                    />
                                                    {locked && (
                                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                                                            เบิกแล้ว {fmtBaht(drawn)}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Details */}
                                                <td className="py-2.5 px-2 align-top">
                                                    <textarea
                                                        value={row.details || ""}
                                                        onChange={e => updateRow(row._key, { details: e.target.value })}
                                                        rows={2}
                                                        placeholder="รายละเอียดงานในงวดนี้"
                                                        className={cn(inputCls, "text-xs py-1.5")}
                                                    />
                                                </td>

                                                {/* Deliverables */}
                                                <td className="py-2.5 px-2 align-top">
                                                    <textarea
                                                        value={row.paymentDetails || ""}
                                                        onChange={e => updateRow(row._key, { paymentDetails: e.target.value })}
                                                        rows={2}
                                                        placeholder="เงื่อนไขตรวจรับ เช่น ตรวจสอบงานเหล็กและเทคอนกรีต"
                                                        className={cn(inputCls, "text-xs py-1.5")}
                                                    />
                                                </td>

                                                {/* Due Date */}
                                                <td className="py-2.5 px-2 align-top">
                                                    <input
                                                        type="date"
                                                        value={row.dueDate}
                                                        onChange={e => updateRow(row._key, { dueDate: e.target.value })}
                                                        className={cn(inputCls, "text-xs")}
                                                    />
                                                </td>

                                                {/* Percentage */}
                                                <td className="py-2.5 px-2 align-top">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            value={pct || ""}
                                                            placeholder="0"
                                                            disabled={total <= 0}
                                                            onChange={e => setPercent(row._key, parseFloat(e.target.value) || 0)}
                                                            className={cn(inputCls, "text-right pr-5 tabular-nums text-xs")}
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
                                                            %
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="py-2.5 px-2 align-top">
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">
                                                            ฿
                                                        </span>
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            value={row.amount || ""}
                                                            placeholder="0"
                                                            onChange={e => updateRow(row._key, { amount: parseFloat(e.target.value) || 0 })}
                                                            className={cn(
                                                                inputCls,
                                                                "pl-6 text-right font-bold text-foreground tabular-nums text-sm"
                                                            )}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Delete Action */}
                                                <td className="py-2.5 px-2 align-top text-center">
                                                    <button
                                                        type="button"
                                                        disabled={locked || installments.length <= 1}
                                                        onClick={() => setInstallments(rows => rows.filter(r => r._key !== row._key))}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-20 transition"
                                                        title={locked ? "ไม่สามารถลบได้ เนื่องจากมีการเบิกจ่ายแล้ว" : "ลบงวดงาน"}
                                                    >
                                                        {locked ? <Lock className="w-4 h-4 text-emerald-600" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/40 font-bold border-t-2 border-border text-foreground">
                                        <td colSpan={5} className="py-3 px-4 text-right">
                                            รวมทั้งสิ้นตามงวดงาน:
                                        </td>
                                        <td className="py-3 px-2 text-center text-xs">
                                            {total > 0 ? `${Math.round((sumInstallments / total) * 100)}%` : "100%"}
                                        </td>
                                        <td className="py-3 px-2 text-right text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            {fmtBaht(sumInstallments)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Section>

                    {/* SECTION 4: เงื่อนไขและเอกสารแนบท้าย */}
                    <Section
                        title="4. เงื่อนไขสัญญาและเอกสารแนบท้าย"
                        subtitle="การตรวจรับ, การจ่ายเงิน, การรับประกันผลงาน และเงื่อนไขทั่วไป (ANNEX 2)"
                        defaultOpen={false}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="ct-pay" className={labelCls}>
                                    <span>เงื่อนไขการตรวจรับและชำระเงิน (ข้อ 5)</span>
                                </label>
                                <textarea
                                    id="ct-pay"
                                    value={paymentTerms}
                                    onChange={e => setPaymentTerms(e.target.value)}
                                    rows={3}
                                    className={inputCls}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="ct-war" className={labelCls}>
                                    <span>การรับประกันผลงาน (ข้อ 6)</span>
                                </label>
                                <textarea
                                    id="ct-war"
                                    value={warranty}
                                    onChange={e => setWarranty(e.target.value)}
                                    rows={3}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="ct-gc" className={labelCls}>
                                    <span>เอกสารแนบท้ายสัญญา 2: เงื่อนไข ข้อตกลง และการยกเลิกสัญญาจ้างเหมางาน</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setGeneralConditions(DEFAULT_GENERAL_CONDITIONS)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    คืนค่าเริ่มต้น
                                </button>
                            </div>
                            <textarea
                                id="ct-gc"
                                value={generalConditions}
                                onChange={e => setGeneralConditions(e.target.value)}
                                rows={8}
                                className={cn(inputCls, "text-xs font-mono leading-relaxed")}
                            />
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label htmlFor="ct-notes" className={labelCls}>
                                <span>หมายเหตุเพิ่มเติม</span>
                            </label>
                            <textarea
                                id="ct-notes"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                placeholder="ระบุข้อความหรือข้อตกลงพิเศษเพิ่มเติม (ถ้ามี)"
                                className={inputCls}
                            />
                        </div>
                    </Section>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    STICKY FOOTER
                   ───────────────────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/30 shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <span className="text-[11px] text-muted-foreground block">มูลค่าสัญญาสุทธิ</span>
                            <span className="text-xl font-extrabold text-foreground tabular-nums">
                                {fmtBaht(sumInstallments)}
                            </span>
                        </div>
                        <div className="hidden sm:block border-l border-border h-8" />
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                            ({bahtText(sumInstallments)})
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition"
                        >
                            ยกเลิก
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? "กำลังบันทึก..." : initialData ? "บันทึกการแก้ไข" : "สร้างสัญญาจ้าง"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
