"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Contract, ContractInstallment, ContractDraw, useProjects } from "@/context/project-context"
import { useFinance } from "@/context/finance-context"
import { useSettings } from "@/context/settings-context"
import { useOrganization } from "@/context/organization-context"
import {
    Printer, X, ZoomIn, ZoomOut, ArrowLeft, CheckCircle2, Clock,
    Save, Split, FileText, Eye, Plus, Trash2, Check,
    Sparkles, RefreshCw, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    bahtText, fmtBaht, fmtNum, generateVoucherHTML,
    generateVoucherNumber, getInstallmentDrawn,
    thDateLong, todayISO, VoucherPrintInput
} from "@/lib/contract-utils"

interface PaymentVoucherDialogProps {
    isOpen: boolean
    onClose: () => void
    contract: Contract
    installment: ContractInstallment
    installmentIndex: number
    draw?: ContractDraw
}

interface VoucherItem {
    id?: string
    description: string
    amount: number
    notes?: string
}

export function PaymentVoucherDialog({
    isOpen,
    onClose,
    contract,
    installment,
    installmentIndex,
    draw
}: PaymentVoucherDialogProps) {
    const { projects, workers, contracts, currentUser } = useProjects()
    const { drawInstallment, markDrawAsPaid, updateDraw } = useFinance()
    const { orgProfile } = useSettings()
    const { currentOrg } = useOrganization()

    const project = projects.find(p => p.id === contract.projectId)
    const worker = workers.find(w => w.id === contract.workerId)

    // View mode: 'split' | 'form' | 'preview'
    const [viewMode, setViewMode] = useState<"split" | "form" | "preview">("split")
    const [zoom, setZoom] = useState(0.72)
    const [isSaving, setIsSaving] = useState(false)
    const [isMarkingPaid, setIsMarkingPaid] = useState(false)

    // Calculate installment drawn / remaining amounts
    const drawnBefore = useMemo(() => {
        const draws = installment.draws || []
        // If editing an existing draw, exclude it from previous drawn calculation
        return draws
            .filter(d => !draw || d.id !== draw.id)
            .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    }, [installment, draw])

    const remainingForInstallment = Math.max(0, installment.amount - drawnBefore)

    // Form state
    const [docNumber, setDocNumber] = useState("")
    const [requestDate, setRequestDate] = useState(todayISO())
    const [paymentDate, setPaymentDate] = useState("")
    const [expenseStatus, setExpenseStatus] = useState<"Paid" | "Pending">("Pending")
    const [workerName, setWorkerName] = useState("")
    const [workerPhone, setWorkerPhone] = useState("")
    const [projectName, setProjectName] = useState("")
    const [categoryOrPipe, setCategoryOrPipe] = useState("")
    const [responsibleRole, setResponsibleRole] = useState("ผู้รับเหมาช่วง")
    const [installmentLabel, setInstallmentLabel] = useState("")
    const [items, setItems] = useState<VoucherItem[]>([])
    const [signatures, setSignatures] = useState({
        requester: { name: "", label: "ผู้เบิกจ่าย" },
        inspector: { name: "", label: "ผู้ตรวจสอบ" },
        accountant: { name: "", label: "ฝ่ายบัญชี" },
        payer: { name: "", label: "ผู้จ่ายเงิน" }
    })

    // Initialize or reset form data
    useEffect(() => {
        if (!isOpen) return

        const initialWorkerName = worker?.name || ""
        const initialWorkerPhone = worker?.phone || ""
        const initialProjectName = project?.name || ""
        const defaultRole = worker?.role || "ผู้รับเหมาช่วง"
        const defaultPipe = contract.contractType || contract.title || "งานเหมาโครงสร้าง"

        if (draw) {
            // Viewing / editing existing draw
            setDocNumber(draw.voucherNumber || generateVoucherNumber(contracts))
            setRequestDate(draw.date || todayISO())
            setPaymentDate(draw.paymentDate || "")
            setExpenseStatus(draw.expenseStatus || "Pending")
            setWorkerName(initialWorkerName)
            setWorkerPhone(initialWorkerPhone)
            setProjectName(initialProjectName)
            setCategoryOrPipe(draw.department || defaultPipe)
            setResponsibleRole(draw.responsibleRole || defaultRole)
            setInstallmentLabel(draw.label)

            if (draw.items && draw.items.length > 0) {
                setItems(draw.items.map((it, i) => ({
                    id: it.id || `item-${i}`,
                    description: it.description,
                    amount: it.amount,
                    notes: it.notes || ""
                })))
            } else {
                setItems([{
                    id: "item-0",
                    description: `เบิกงวดที่ ${draw.label}: ${installment.description}`,
                    amount: draw.amount,
                    notes: draw.note || `งวด ${draw.label}`
                }])
            }

            let savedSigs: any = null
            try {
                if (typeof window !== "undefined") {
                    savedSigs = JSON.parse(localStorage.getItem("hipsloth_voucher_last_signatures") || "null")
                }
            } catch (e) {}

            setSignatures({
                requester: {
                    name: draw.signatures?.requester?.name || savedSigs?.requester || currentUser?.name || "",
                    label: draw.signatures?.requester?.label || "ผู้ขอเบิกจ่าย (ผู้จัดทำเอกสาร)"
                },
                inspector: {
                    name: draw.signatures?.inspector?.name || savedSigs?.inspector || orgProfile?.signatureName || orgProfile?.name || "",
                    label: draw.signatures?.inspector?.label || "ผู้ตรวจสอบ"
                },
                accountant: {
                    name: draw.signatures?.accountant?.name || savedSigs?.accountant || "",
                    label: draw.signatures?.accountant?.label || "ฝ่ายบัญชี"
                },
                payer: {
                    name: draw.signatures?.payer?.name || savedSigs?.payer || orgProfile?.name || "",
                    label: draw.signatures?.payer?.label || "ผู้จ่ายเงิน"
                }
            })
        } else {
            // New Draw: default to Pending so user can print, get signatures, then mark Paid!
            const nextSeqNum = installmentIndex + 1
            const hasPriorDraws = (installment.draws || []).length > 0
            const nextLabel = hasPriorDraws
                ? `${nextSeqNum}.${(installment.draws || []).length + 1}`
                : String(nextSeqNum)

            const generatedDocNo = generateVoucherNumber(contracts)
            setDocNumber(generatedDocNo)
            setRequestDate(todayISO())
            setPaymentDate("")
            setExpenseStatus("Pending")
            setWorkerName(initialWorkerName)
            setWorkerPhone(initialWorkerPhone)
            setProjectName(initialProjectName)
            setCategoryOrPipe(defaultPipe)
            setResponsibleRole(defaultRole)
            setInstallmentLabel(nextLabel)

            const defaultAmount = remainingForInstallment
            setItems([{
                id: "item-0",
                description: `เบิกงวดที่ ${nextLabel}: ${installment.description}`,
                amount: defaultAmount,
                notes: `งวด ${nextLabel}`
            }])

            let savedSigs: any = null
            try {
                if (typeof window !== "undefined") {
                    savedSigs = JSON.parse(localStorage.getItem("hipsloth_voucher_last_signatures") || "null")
                }
            } catch (e) {}

            setSignatures({
                requester: {
                    name: savedSigs?.requester || currentUser?.name || "",
                    label: "ผู้ขอเบิกจ่าย (ผู้จัดทำเอกสาร)"
                },
                inspector: {
                    name: savedSigs?.inspector || orgProfile?.signatureName || orgProfile?.name || "",
                    label: "ผู้ตรวจสอบ"
                },
                accountant: {
                    name: savedSigs?.accountant || "",
                    label: "ฝ่ายบัญชี"
                },
                payer: {
                    name: savedSigs?.payer || orgProfile?.name || "",
                    label: "ผู้จ่ายเงิน"
                }
            })
        }
    }, [isOpen, contract.id, installment.id, draw?.id, orgProfile, contracts, currentUser])

    // Calculations
    const totalVoucherAmount = useMemo(() => {
        return items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
    }, [items])

    const totalContractAmount = contract.totalAmount || 0
    const remainingAfterThisDraw = Math.max(0, remainingForInstallment - totalVoucherAmount)

    // Handlers for Items
    const handleItemChange = (index: number, field: keyof VoucherItem, value: any) => {
        setItems(prev => {
            const next = [...prev]
            next[index] = { ...next[index], [field]: value }
            return next
        })

        // Auto-detect partial draw on amount edit if creating new draw
        if (field === "amount" && index === 0 && !draw) {
            const numVal = parseFloat(value) || 0
            const baseNum = installmentIndex + 1
            const currentDrawId = draw ? (draw as any).id : null
            const priorCount = (installment.draws || []).filter(d => !currentDrawId || d.id !== currentDrawId).length

            if (numVal > 0 && numVal < remainingForInstallment) {
                const subNum = priorCount + 1
                const newLabel = `${baseNum}.${subNum}`
                const pct = Math.round((numVal / remainingForInstallment) * 100)
                const remainingAfter = Math.max(0, remainingForInstallment - numVal)

                if (installmentLabel === String(baseNum)) {
                    setInstallmentLabel(newLabel)
                }

                setItems(prev => {
                    const copy = [...prev]
                    if (copy[0]) {
                        const curDesc = copy[0].description
                        let updatedDesc = curDesc
                        if (curDesc.startsWith(`เบิกงวดที่ ${baseNum}:`)) {
                            updatedDesc = `เบิกย่อยงวดที่ ${newLabel} (${pct}%): ${installment.description}`
                        }
                        const curNote = copy[0].notes || ""
                        let updatedNote = curNote
                        if (!curNote || curNote === `งวด ${baseNum}` || curNote.startsWith("เบิกย่อย")) {
                            updatedNote = `เบิกย่อย ${pct}% (งวดที่ ${newLabel}) ยอด ฿${fmtNum(numVal)} จากงวดเต็ม ฿${fmtNum(installment.amount)} ค้างเบิกอีก ฿${fmtNum(remainingAfter)}`
                        }
                        copy[0] = { ...copy[0], description: updatedDesc, notes: updatedNote }
                    }
                    return copy
                })
            } else if (numVal >= remainingForInstallment && priorCount === 0) {
                if (installmentLabel === `${baseNum}.1`) {
                    setInstallmentLabel(String(baseNum))
                    setItems(prev => {
                        const copy = [...prev]
                        if (copy[0]) {
                            copy[0] = {
                                ...copy[0],
                                description: `เบิกงวดที่ ${baseNum}: ${installment.description}`,
                                notes: `งวด ${baseNum}`
                            }
                        }
                        return copy
                    })
                }
            }
        }
    }

    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            {
                id: `item-${Date.now()}`,
                description: "",
                amount: 0,
                notes: ""
            }
        ])
    }

    const handleRemoveItem = (index: number) => {
        if (items.length <= 1) return
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    const handleApplyPercentage = (pct: number) => {
        const baseNum = installmentIndex + 1
        const currentDrawId = draw ? (draw as any).id : null
        const priorCount = (installment.draws || []).filter(d => !currentDrawId || d.id !== currentDrawId).length
        const calculated = Math.round(remainingForInstallment * (pct / 100))
        const remainingAfter = Math.max(0, remainingForInstallment - calculated)

        let newLabel = String(baseNum)
        let newDesc = ""
        let newNote = ""

        if (pct < 100 || priorCount > 0) {
            const subNum = priorCount + 1
            newLabel = `${baseNum}.${subNum}`
            newDesc = `เบิกย่อยงวดที่ ${newLabel} (${pct}%): ${installment.description || "งวดงาน"}`
            newNote = `เบิกย่อย ${pct}% (งวดที่ ${newLabel}) ยอด ฿${fmtNum(calculated)} จากงวดเต็ม ฿${fmtNum(installment.amount)} ค้างเบิกอีก ฿${fmtNum(remainingAfter)}`
        } else {
            newLabel = String(baseNum)
            newDesc = `เบิกงวดที่ ${newLabel}: ${installment.description || "งวดงาน"}`
            newNote = `งวด ${newLabel} (เต็มจำนวน 100%)`
        }

        setInstallmentLabel(newLabel)

        setItems(prev => {
            const copy = [...prev]
            if (copy.length === 0) {
                return [{ id: "item-0", description: newDesc, amount: calculated, notes: newNote }]
            }
            copy[0] = { ...copy[0], description: newDesc, amount: calculated, notes: newNote }
            return copy
        })

        toast.info(`แตกใบเบิกเป็นงวดย่อย ${newLabel} (${pct}%)`, {
            description: `ปรับรายละเอียดและเพิ่มหมายเหตุการเบิกย่อยให้อัตโนมัติ`
        })
    }

    // Prepare printable data
    const voucherPrintData: VoucherPrintInput = {
        docNumber: docNumber || "PV-XXXXXX",
        requestDate: thDateLong(requestDate),
        paymentDate: paymentDate ? thDateLong(paymentDate) : "",
        status: expenseStatus,
        workerName: workerName || "-",
        workerPhone: workerPhone || undefined,
        projectName: projectName || "-",
        categoryOrPipe: categoryOrPipe || "-",
        responsibleRole: responsibleRole || "ผู้รับเหมาช่วง",
        items: items.map(it => ({
            description: it.description || "-",
            amount: Number(it.amount) || 0,
            notes: it.notes || ""
        })),
        totalAmount: totalVoucherAmount,
        totalContractAmount,
        installmentLabel,
        installmentAmount: totalVoucherAmount,
        remainingAmount: remainingAfterThisDraw,
        org: orgProfile || {},
        signatures
    }

    // Print handler using standard browser print
    const handlePrint = () => {
        const printWindow = window.open("", "_blank")
        if (!printWindow) {
            toast.error("กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์เอกสาร")
            return
        }

        const html = generateVoucherHTML(voucherPrintData)
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print()
            }, 250)
        }
    }

    // Save document handler
    const handleSaveDocument = async () => {
        if (totalVoucherAmount <= 0) {
            toast.error("จำนวนเงินเบิกต้องมากกว่า 0 บาท")
            return
        }

        setIsSaving(true)
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem("hipsloth_voucher_last_signatures", JSON.stringify({
                    requester: signatures.requester.name,
                    inspector: signatures.inspector.name,
                    accountant: signatures.accountant.name,
                    payer: signatures.payer.name
                }))
            }
            if (draw) {
                // Update existing draw
                await updateDraw(contract.id, installment.id, draw.id, {
                    voucherNumber: docNumber,
                    amount: totalVoucherAmount,
                    date: requestDate,
                    paymentDate: paymentDate || undefined,
                    department: categoryOrPipe,
                    responsibleRole,
                    items: items.map(it => ({
                        description: it.description,
                        amount: Number(it.amount) || 0,
                        notes: it.notes
                    })),
                    signatures,
                    expenseStatus
                })
                toast.success("บันทึกใบสำคัญจ่ายเรียบร้อย")
                onClose()
            } else {
                // Create new draw
                const res = await drawInstallment(contract.id, installment.id, {
                    amount: totalVoucherAmount,
                    date: requestDate,
                    paymentDate: paymentDate || undefined,
                    voucherNumber: docNumber,
                    label: installmentLabel,
                    department: categoryOrPipe,
                    responsibleRole,
                    items: items.map(it => ({
                        description: it.description,
                        amount: Number(it.amount) || 0,
                        notes: it.notes
                    })),
                    signatures,
                    note: items[0]?.notes || undefined,
                    expenseStatus
                })

                toast.success(`ออกใบสำคัญจ่ายเลขที่ ${docNumber} สำเร็จ`, {
                    description: `สร้างรายการเบิกงวดที่ ${res?.label ?? installmentLabel} (${expenseStatus === "Paid" ? "จ่ายแล้ว" : "รอจ่าย"}) เรียบร้อย`
                })
                onClose()
            }
        } catch (e: any) {
            console.error("Save voucher error:", e)
            toast.error(e?.message || "บันทึกเอกสารไม่สำเร็จ")
        } finally {
            setIsSaving(false)
        }
    }

    // Quick Mark as Paid directly on the voucher
    const handleMarkAsPaid = async () => {
        const today = todayISO()
        setIsMarkingPaid(true)
        try {
            if (draw) {
                await markDrawAsPaid(contract.id, installment.id, draw.id, today)
                setExpenseStatus("Paid")
                setPaymentDate(today)
                toast.success("เปลี่ยนสถานะเป็น 'จ่ายแล้ว' เรียบร้อย!", {
                    description: `อัปเดตใบสำคัญจ่าย ${docNumber} และตัดยอดเป็นรายจ่ายเรียบร้อย`
                })
            } else {
                // If new draw, set status in local state and proceed
                setExpenseStatus("Paid")
                setPaymentDate(today)
                toast.success("เปลี่ยนสถานะเป็น 'จ่ายแล้ว' สำหรับใบเบิกนี้")
            }
        } catch (e: any) {
            console.error("Mark as paid error:", e)
            toast.error("ไม่สามารถเปลี่ยนสถานะได้")
        } finally {
            setIsMarkingPaid(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[120] flex flex-col bg-black/85 backdrop-blur-md animate-in fade-in overflow-hidden">
            {/* ───────────────────────────────────────────────────────────── */}
            {/* TOP NAVIGATION / ACTION BAR */}
            {/* ───────────────────────────────────────────────────────────── */}
            <header className="h-16 shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 text-white">
                {/* Left: Back + Document Number */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>กลับ</span>
                    </button>

                    <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="font-mono font-bold text-sm text-slate-100">{docNumber || "PV-XXXXXX"}</span>
                    </div>

                    {/* Status Pill in Header */}
                    <span
                        className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                            expenseStatus === "Paid"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        )}
                    >
                        {expenseStatus === "Paid" ? (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>จ่ายแล้ว (Paid)</span>
                            </>
                        ) : (
                            <>
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>รอจ่าย (Pending)</span>
                            </>
                        )}
                    </span>
                </div>

                {/* Center: 3-Way Segmented View Switcher */}
                <div className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                    <button
                        type="button"
                        onClick={() => setViewMode("split")}
                        className={cn(
                            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            viewMode === "split"
                                ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                                : "text-slate-300 hover:text-white"
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>สองฝั่ง (Split)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("form")}
                        className={cn(
                            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            viewMode === "form"
                                ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                                : "text-slate-300 hover:text-white"
                        )}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>เฉพาะฟอร์ม</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("preview")}
                        className={cn(
                            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            viewMode === "preview"
                                ? "bg-sky-500 text-white shadow-md font-bold"
                                : "text-slate-300 hover:text-white"
                        )}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ตัวอย่างเอกสาร A4</span>
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Primary Workflow Transition Button: "เปลี่ยนเป็นจ่ายแล้ว" */}
                    {expenseStatus === "Pending" && (
                        <button
                            type="button"
                            onClick={handleMarkAsPaid}
                            disabled={isMarkingPaid}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition"
                            title="เปลี่ยนสถานะใบเบิกงวดเป็นจ่ายแล้ว และตัดเป็นรายจ่ายทันที"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>เปลี่ยนเป็นจ่ายแล้ว</span>
                        </button>
                    )}

                    {/* Print / PDF Button */}
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 active:scale-95 transition"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">พิมพ์ / PDF</span>
                    </button>

                    {/* Save Document Button */}
                    <button
                        type="button"
                        onClick={handleSaveDocument}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>บันทึกเอกสาร</span>
                    </button>

                    {/* Close */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* MAIN WORKSPACE: FORM & LIVE A4 PREVIEW */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#1e232b]">
                {/* ── LEFT: EDITABLE FORM PANEL ── */}
                {(viewMode === "split" || viewMode === "form") && (
                    <div
                        className={cn(
                            "overflow-y-auto p-4 sm:p-6 space-y-6 text-foreground bg-card border-r border-border transition-all",
                            viewMode === "form" ? "w-full max-w-4xl mx-auto" : "w-full md:w-[48%] lg:w-[45%]"
                        )}
                    >
                        {/* Notice for Pending workflow */}
                        {expenseStatus === "Pending" ? (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
                                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1 text-xs">
                                    <p className="font-bold text-amber-700 dark:text-amber-300">
                                        สถานะ: รอจ่าย (พิมพ์เอกสารไปเซ็นอนุมัติ)
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        ออกใบสำคัญจ่ายนี้เพื่อพิมพ์หรือส่งตรวจรับ เมื่อจ่ายเงินจริงแล้ว สามารถกดปุ่ม{" "}
                                        <b className="text-foreground">"เปลี่ยนเป็นจ่ายแล้ว"</b> ด้านบนเพื่อตัดเข้าเป็นรายจ่ายอัตโนมัติ
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div className="space-y-1 text-xs">
                                    <p className="font-bold text-emerald-700 dark:text-emerald-300">
                                        สถานะ: จ่ายแล้ว (Paid)
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        ใบสำคัญจ่ายนี้ได้รับการชำระเงินแล้ว และบันทึกเป็นรายจ่ายในหมวดผู้รับเหมาช่วงเรียบร้อย
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SECTION 1: DOCUMENT META */}
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-primary" />
                                ข้อมูลเอกสาร & การเบิกจ่าย
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">เลขที่เอกสาร</label>
                                    <input
                                        value={docNumber}
                                        onChange={e => setDocNumber(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm font-mono font-bold"
                                        placeholder="PV691013-20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">งวดที่เบิก</label>
                                    <input
                                        value={installmentLabel}
                                        onChange={e => setInstallmentLabel(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm font-bold"
                                        placeholder="เช่น 1 หรือ 5.1"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">วันที่เบิกจ่าย</label>
                                    <input
                                        type="date"
                                        value={requestDate}
                                        onChange={e => setRequestDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">วันที่จ่ายเงิน (ถ้าจ่ายแล้ว)</label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={e => {
                                            setPaymentDate(e.target.value)
                                            if (e.target.value) setExpenseStatus("Paid")
                                        }}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm"
                                        placeholder="ระบุวันที่จ่ายจริง"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: PAYEE & PROJECT INFO */}
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-primary" />
                                ข้อมูลผู้รับเงิน & โครงการ
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">ชื่อผู้รับเงิน / พนักงาน</label>
                                    <input
                                        value={workerName}
                                        onChange={e => setWorkerName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm font-semibold"
                                        placeholder="ชื่อช่าง / ผู้รับเงิน"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">เบอร์โทรศัพท์</label>
                                    <input
                                        value={workerPhone}
                                        onChange={e => setWorkerPhone(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm"
                                        placeholder="เบอร์โทรติดต่อ"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">โครงการ</label>
                                    <input
                                        value={projectName}
                                        onChange={e => setProjectName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm"
                                        placeholder="ชื่อโครงการ"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">หน้าที่รับผิดชอบ</label>
                                    <input
                                        value={responsibleRole}
                                        onChange={e => setResponsibleRole(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm"
                                        placeholder="เช่น ผู้รับเหมาช่วง"
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">ไปป์ / ประเภทงาน</label>
                                    <input
                                        value={categoryOrPipe}
                                        onChange={e => setCategoryOrPipe(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm"
                                        placeholder="เช่น งานโครงสร้าง / เทพื้นคอนกรีต"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: ITEMS TABLE & AMOUNTS */}
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-primary" />
                                    รายการเบิกจ่ายเงิน (Items)
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>เพิ่มรายการ</span>
                                </button>
                            </div>

                            {/* Quick Percentages for partial draw */}
                            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Split className="w-3.5 h-3.5 text-violet-500" />
                                        <span>แตกงวดย่อย / เบิกตามเปอร์เซ็นต์ (Partial Draw)</span>
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        ยอดเต็มงวดนี้: <b className="text-foreground">{fmtBaht(remainingForInstallment)}</b>
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[25, 50, 75, 100].map((pct, pIdx) => {
                                        const val = Math.round(remainingForInstallment * (pct / 100))
                                        const baseNum = installmentIndex + 1
                                        const currentDrawId = draw ? (draw as any).id : null
                                        const priorCount = (installment.draws || []).filter(d => !currentDrawId || d.id !== currentDrawId).length
                                        const targetSubLabel = pct < 100 || priorCount > 0 ? `${baseNum}.${priorCount + 1}` : String(baseNum)

                                        return (
                                            <button
                                                key={`pct-${pct}-${pIdx}`}
                                                type="button"
                                                onClick={() => handleApplyPercentage(pct)}
                                                className={cn(
                                                    "p-2 rounded-lg text-left border transition text-xs flex flex-col justify-between hover:border-violet-500/40",
                                                    items[0]?.amount === val
                                                        ? "bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 font-bold shadow-sm"
                                                        : "bg-card border-border hover:bg-muted/50"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-[11px]">
                                                        {pct === 100 ? "เต็มงวด (100%)" : `เบิกย่อย ${pct}%`}
                                                    </span>
                                                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-violet-500/10 text-violet-600 font-mono">
                                                        งวด {targetSubLabel}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold mt-1 tabular-nums">
                                                    {fmtBaht(val)}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Item Inputs */}
                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={`pv-item-${item.id || idx}-${idx}`} className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-muted-foreground">รายการที่ {idx + 1}</span>
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            value={item.description}
                                            onChange={e => handleItemChange(idx, "description", e.target.value)}
                                            placeholder="รายละเอียดรายการเบิกจ่าย"
                                            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-muted-foreground">จำนวนเงิน (บาท)</label>
                                                <input
                                                    type="number"
                                                    value={item.amount || ""}
                                                    onChange={e => handleItemChange(idx, "amount", parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-bold text-right tabular-nums"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-muted-foreground">หมายเหตุ</label>
                                                <input
                                                    value={item.notes || ""}
                                                    onChange={e => handleItemChange(idx, "notes", e.target.value)}
                                                    placeholder="เช่น เบิกย่อย 50% หรือ มัดจำ"
                                                    className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-sm"
                                                />
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleItemChange(idx, "notes", `เบิกย่อยตามผลงานหน้างาน 50%`)}
                                                        className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition"
                                                    >
                                                        + เบิกตามหน้างาน
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleItemChange(idx, "notes", `เบิกค่าแรงล่วงหน้า (หักค้างจ่ายงวดถัดไป)`)}
                                                        className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition"
                                                    >
                                                        + ค่าแรงล่วงหน้า
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleItemChange(idx, "notes", `เบิกค่าซื้อวัสดุด่วนหน้างาน`)}
                                                        className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition"
                                                    >
                                                        + ค่าวัสดุด่วน
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Sum and Thai text */}
                            <div className="rounded-xl bg-muted/60 p-3.5 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-muted-foreground">รวมเงินเบิกทั้งสิ้น:</span>
                                    <span className="text-xl font-black text-foreground tabular-nums">
                                        {fmtBaht(totalVoucherAmount)}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground text-right italic">
                                    ({bahtText(totalVoucherAmount)})
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: CONTRACT SUMMARY */}
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm text-xs">
                            <h3 className="font-bold uppercase tracking-wider text-muted-foreground">
                                สรุปยอดตามสัญญา (Contract Balance)
                            </h3>
                            <div className="space-y-1.5 border-t border-border pt-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">ยอดรวมค่าจ้างทั้งหมด:</span>
                                    <span className="font-bold">{fmtBaht(totalContractAmount)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-t border-dashed border-border">
                                    <span className="text-muted-foreground">เบิกจ่ายค่าจ้างงวดนี้ ({installmentLabel}):</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmtBaht(totalVoucherAmount)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-t border-dashed border-border">
                                    <span className="text-muted-foreground">คงเหลือค่าจ้างเบิกจ่ายในครั้งต่อไป:</span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">{fmtBaht(remainingAfterThisDraw)}</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: SIGNATURES (4 Signatures) */}
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                ผู้ลงนาม (4 ลายเซ็นตามแบบเอกสาร)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                    <label className="text-muted-foreground">{signatures.requester.label}</label>
                                    <input
                                        value={signatures.requester.name}
                                        onChange={e => setSignatures({ ...signatures, requester: { ...signatures.requester, name: e.target.value } })}
                                        placeholder="ชื่อผู้เบิกจ่าย"
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground">{signatures.inspector.label}</label>
                                    <input
                                        value={signatures.inspector.name}
                                        onChange={e => setSignatures({ ...signatures, inspector: { ...signatures.inspector, name: e.target.value } })}
                                        placeholder="ชื่อผู้ตรวจสอบ"
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground">{signatures.accountant.label}</label>
                                    <input
                                        value={signatures.accountant.name}
                                        onChange={e => setSignatures({ ...signatures, accountant: { ...signatures.accountant, name: e.target.value } })}
                                        placeholder="ชื่อฝ่ายบัญชี"
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground">{signatures.payer.label}</label>
                                    <input
                                        value={signatures.payer.name}
                                        onChange={e => setSignatures({ ...signatures, payer: { ...signatures.payer, name: e.target.value } })}
                                        placeholder="ชื่อผู้จ่ายเงิน"
                                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── RIGHT: LIVE A4 DOCUMENT PREVIEW PANEL ── */}
                {(viewMode === "split" || viewMode === "preview") && (
                    <div
                        className={cn(
                            "flex-1 overflow-auto bg-[#2b323e] flex flex-col items-center relative transition-all",
                            viewMode === "preview" ? "w-full" : "w-full md:w-[52%] lg:w-[55%]"
                        )}
                    >
                        {/* Floating Zoom / Page Bar */}
                        <div className="sticky top-4 z-20 my-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl flex items-center gap-2 text-white text-xs">
                            <button
                                type="button"
                                onClick={() => setZoom(z => Math.max(0.4, z - 0.08))}
                                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                            <button
                                type="button"
                                onClick={() => setZoom(z => Math.min(1.4, z + 0.08))}
                                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <div className="h-4 w-px bg-slate-700" />
                            <button
                                type="button"
                                onClick={() => setZoom(0.72)}
                                className={cn(
                                    "px-2.5 py-0.5 rounded-full font-semibold transition",
                                    Math.abs(zoom - 0.72) < 0.04
                                        ? "bg-amber-500 text-slate-950 font-bold"
                                        : "hover:bg-slate-800 text-slate-300"
                                )}
                            >
                                พอดีจอ (Fit)
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoom(1.0)}
                                className={cn(
                                    "px-2 py-0.5 rounded-full font-semibold transition",
                                    zoom === 1.0 ? "bg-amber-500 text-slate-950 font-bold" : "hover:bg-slate-800 text-slate-300"
                                )}
                            >
                                100%
                            </button>
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                1 หน้ากระดาษ A4
                            </span>
                        </div>

                        {/* A4 Paper Canvas */}
                        <div className="pb-16 pt-4 flex justify-center w-full overflow-x-auto">
                            <div
                                style={{
                                    width: `${210 * zoom}mm`,
                                    height: `${297 * zoom}mm`,
                                    position: "relative",
                                    flexShrink: 0,
                                    boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)"
                                }}
                            >
                                <div
                                    className="bg-white text-black origin-top-left rounded-none relative select-text text-left border border-slate-300 flex flex-col justify-between"
                                    style={{
                                        width: "210mm",
                                        height: "297mm",
                                        maxHeight: "297mm",
                                        transform: `scale(${zoom})`,
                                        transformOrigin: "top left",
                                        padding: "14mm 16mm 14mm",
                                        boxSizing: "border-box",
                                        overflow: "hidden",
                                        fontFamily: "'Sarabun', sans-serif"
                                    }}
                                >
                                    <div className="flex-1 flex flex-col justify-start">
                                        {/* Title Centered */}
                                        <h1 className="text-center font-bold text-lg mb-3 tracking-wide">
                                            ใบสำคัญจ่าย (PAYMENT VOUCHER)
                                        </h1>

                                        {/* Header Row */}
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                            <div className="flex-1 text-xs">
                                                <div className="font-bold text-sm text-black mb-0.5">
                                                    {orgProfile?.name || "บริษัท แบบบ้านสวย จำกัด"}
                                                </div>
                                                <div className="text-gray-700 leading-snug">
                                                    {orgProfile?.address || "95/47 หมู่ที่ 1 ตำบลตลาดขวัญ อำเภอเมือง จังหวัดนนทบุรี 11000"}
                                                </div>
                                                {orgProfile?.phone && (
                                                    <div className="text-gray-700">โทร {orgProfile.phone}</div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {orgProfile?.logo ? (
                                                    <img
                                                        src={orgProfile.logo}
                                                        alt="Logo"
                                                        className="max-h-14 max-w-[130px] object-contain mb-1"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-xl mb-1 shadow">
                                                        🏠
                                                    </div>
                                                )}
                                                <table className="text-xs border-collapse">
                                                    <tbody>
                                                        <tr>
                                                            <td className="text-right text-gray-700 font-medium pr-2 py-0.5">เลขที่เอกสาร:</td>
                                                            <td className="font-bold text-left">{docNumber}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-right text-gray-700 font-medium pr-2 py-0.5">วันที่เบิกจ่าย:</td>
                                                            <td className="font-bold text-left">{thDateLong(requestDate)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-right text-gray-700 font-medium pr-2 py-0.5">วันที่จ่ายเงิน:</td>
                                                            <td className="font-bold text-left">{paymentDate ? thDateLong(paymentDate) : "___/___/___"}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Payee / Project Info Lines with Dotted Underline */}
                                        <div className="my-3 space-y-1.5 text-xs">
                                            <div className="flex items-baseline">
                                                <span className="font-bold shrink-0 mr-2">ชื่อผู้รับเงิน / พนักงาน :</span>
                                                <span className="flex-1 border-b border-dotted border-gray-600 pb-0.5">
                                                    {workerName || "-"}{workerPhone ? ` (โทร. ${workerPhone})` : ""}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline">
                                                <span className="font-bold shrink-0 mr-2">โครงการ :</span>
                                                <span className="flex-1 border-b border-dotted border-gray-600 pb-0.5">
                                                    {projectName || "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline">
                                                <span className="font-bold shrink-0 mr-2">ไปป์/ประเภท :</span>
                                                <span className="flex-1 border-b border-dotted border-gray-600 pb-0.5 mr-6">
                                                    {categoryOrPipe || "-"}
                                                </span>
                                                <span className="font-bold shrink-0 mr-2">หน้าที่รับผิดชอบ :</span>
                                                <span className="w-48 border-b border-dotted border-gray-600 pb-0.5">
                                                    {responsibleRole || "ผู้รับเหมาช่วง"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Items Table matching BBSPM Voucher layout */}
                                        <table className="w-full border-collapse border border-black text-xs my-2.5 table-fixed">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-black p-1.5 w-[6%] text-center font-bold">ลำดับ</th>
                                                    <th className="border border-black p-1.5 w-[58%] text-center font-bold">รายละเอียดรายการเบิกจ่าย</th>
                                                    <th className="border border-black p-1.5 w-[20%] text-center font-bold">จำนวนเงิน<br />(บาท)</th>
                                                    <th className="border border-black p-1.5 w-[16%] text-center font-bold">หมายเหตุ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => (
                                                    <tr key={`pv-preview-item-${item.id || idx}-${idx}`}>
                                                        <td className="border border-black p-1.5 text-center align-top">{idx + 1}</td>
                                                        <td className="border border-black p-1.5 font-normal align-top break-words">{item.description}</td>
                                                        <td className="border border-black p-1.5 text-right font-bold tabular-nums align-top whitespace-nowrap">
                                                            {fmtNum(item.amount)}
                                                        </td>
                                                        <td className="border border-black p-1.5 text-center text-gray-700 align-top">{item.notes || ""}</td>
                                                    </tr>
                                                ))}

                                                {/* Spacer empty rows for formal A4 voucher look */}
                                                {Array(Math.max(0, 4 - items.length)).fill(0).map((_, i) => (
                                                    <tr key={`pv-spacer-${i}`}>
                                                        <td className="border border-black p-1.5 text-center text-gray-300">{items.length + i + 1}</td>
                                                        <td className="border border-black p-1.5 h-6">&nbsp;</td>
                                                        <td className="border border-black p-1.5">&nbsp;</td>
                                                        <td className="border border-black p-1.5">&nbsp;</td>
                                                    </tr>
                                                ))}

                                                {/* Subtotal row */}
                                                <tr>
                                                    <td colSpan={2} className="border border-black p-1.5 text-center font-bold">
                                                        รวมเงินเบิกทั้งสิ้น
                                                    </td>
                                                    <td className="border border-black p-1.5 text-right font-black tabular-nums">
                                                        {fmtNum(totalVoucherAmount)}
                                                    </td>
                                                    <td className="border border-black p-1.5 text-center text-xs">
                                                        บาท
                                                    </td>
                                                </tr>

                                                {/* Thai Baht text row */}
                                                <tr>
                                                    <td colSpan={2} className="border border-black p-1.5 text-center text-gray-700">
                                                        ยอดเงินตัวหนังสือ
                                                    </td>
                                                    <td colSpan={2} className="border border-black p-1.5 text-center font-bold">
                                                        ({bahtText(totalVoucherAmount)})
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Summary Tracking Lines */}
                                        <div className="my-2.5 text-xs space-y-1">
                                            <div className="flex items-center">
                                                <span className="w-36 text-gray-800">ยอดรวมค่าจ้างทั้งหมด :</span>
                                                <span className="border-b border-dotted border-gray-600 px-3 min-w-[100px] text-right font-bold">
                                                    {fmtNum(totalContractAmount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-36 text-gray-800">เบิกจ่ายค่าจ้างงวดที่ :</span>
                                                <span className="border-b border-dotted border-gray-600 px-3 font-bold min-w-[40px] text-center">
                                                    {installmentLabel}
                                                </span>
                                                <span className="ml-4 mr-2 text-gray-800">เป็นจำนวน :</span>
                                                <span className="border-b border-dotted border-gray-600 px-3 min-w-[100px] text-right font-bold">
                                                    {fmtNum(totalVoucherAmount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-36 text-gray-800">คงเหลือค่าจ้างเบิกจ่ายในครั้งต่อไป :</span>
                                                <span className="border-b border-dotted border-gray-600 px-3 min-w-[100px] text-right font-bold">
                                                    {fmtNum(remainingAfterThisDraw)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4 Signature Boxes (4 columns in 1 row) */}
                                    <div className="shrink-0 pt-3 border-t border-black text-xs text-center">
                                        <div className="grid grid-cols-4 gap-2">
                                            {/* Signer 1: Requester */}
                                            <div className="space-y-1 px-1">
                                                <div className="h-8 flex items-end justify-center mb-1">
                                                    <div className="w-full max-w-[125px] border-b border-dotted border-black" />
                                                </div>
                                                <div className="font-bold text-[11px] truncate">
                                                    ({signatures.requester.name || "...................................."})
                                                </div>
                                                <div className="text-[10px] text-gray-700 leading-tight">{signatures.requester.label}</div>
                                                <div className="text-[9.5px] text-gray-500 mt-0.5">วันที่: ..... / ..... / .........</div>
                                            </div>

                                            {/* Signer 2: Inspector */}
                                            <div className="space-y-1 px-1">
                                                <div className="h-8 flex items-end justify-center mb-1">
                                                    <div className="w-full max-w-[125px] border-b border-dotted border-black" />
                                                </div>
                                                <div className="font-bold text-[11px] truncate">
                                                    ({signatures.inspector.name || "...................................."})
                                                </div>
                                                <div className="text-[10px] text-gray-700 leading-tight">{signatures.inspector.label}</div>
                                                <div className="text-[9.5px] text-gray-500 mt-0.5">วันที่: ..... / ..... / .........</div>
                                            </div>

                                            {/* Signer 3: Accountant */}
                                            <div className="space-y-1 px-1">
                                                <div className="h-8 flex items-end justify-center mb-1">
                                                    <div className="w-full max-w-[125px] border-b border-dotted border-black" />
                                                </div>
                                                <div className="font-bold text-[11px] truncate">
                                                    ({signatures.accountant.name || "...................................."})
                                                </div>
                                                <div className="text-[10px] text-gray-700 leading-tight">{signatures.accountant.label}</div>
                                                <div className="text-[9.5px] text-gray-500 mt-0.5">วันที่: ..... / ..... / .........</div>
                                            </div>

                                            {/* Signer 4: Payer */}
                                            <div className="space-y-1 px-1">
                                                <div className="h-8 flex items-end justify-center mb-1">
                                                    <div className="w-full max-w-[125px] border-b border-dotted border-black" />
                                                </div>
                                                <div className="font-bold text-[11px] truncate">
                                                    ({signatures.payer.name || "...................................."})
                                                </div>
                                                <div className="text-[10px] text-gray-700 leading-tight">{signatures.payer.label}</div>
                                                <div className="text-[9.5px] text-gray-500 mt-0.5">วันที่: ..... / ..... / .........</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status watermark badge */}
                                    {expenseStatus === "Paid" && (
                                        <div className="absolute top-6 right-6 border-2 border-emerald-600/40 text-emerald-700/60 font-black text-xs px-3 py-1 rounded rotate-[-8deg] uppercase tracking-wider select-none pointer-events-none">
                                            ✓ จ่ายเงินแล้ว (PAID)
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
