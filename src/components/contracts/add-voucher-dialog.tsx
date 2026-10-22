"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import {
    X, Receipt, Plus, Trash2, Calendar, FolderKanban,
    User2, Sparkles, AlertCircle, CheckCircle2, Clock,
    DollarSign, FileText, ChevronDown, Check, ArrowUpRight
} from "lucide-react"
import { toast } from "sonner"
import { useProjects, Contract, ContractDraw } from "@/context/project-context"
import { useFinance } from "@/context/finance-context"
import { useSettings } from "@/context/settings-context"
import { cn } from "@/lib/utils"
import { bahtText, fmtBaht, generateVoucherNumber, todayISO } from "@/lib/contract-utils"

interface AddVoucherDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (contractId: string, drawId: string, contract: Contract, draw: ContractDraw) => void
    defaultProjectId?: string
    defaultWorkerId?: string
}

interface ItemRow {
    id: string
    description: string
    amount: number
    notes?: string
}

export function AddVoucherDialog({
    isOpen,
    onClose,
    onSuccess,
    defaultProjectId,
    defaultWorkerId
}: AddVoucherDialogProps) {
    const { projects, workers, contracts, addWorker } = useProjects()
    const { createStandaloneVoucher } = useFinance()
    const { orgProfile } = useSettings()

    // Form fields
    const [voucherNumber, setVoucherNumber] = useState("")
    const [projectId, setProjectId] = useState("")
    const [workerId, setWorkerId] = useState("")
    const [isNewWorker, setIsNewWorker] = useState(false)
    const [newWorkerName, setNewWorkerName] = useState("")
    const [newWorkerPhone, setNewWorkerPhone] = useState("")
    const [title, setTitle] = useState("")
    const [amount, setAmount] = useState<number>(0)
    const [date, setDate] = useState(todayISO())
    const [paymentDate, setPaymentDate] = useState("")
    const [expenseStatus, setExpenseStatus] = useState<"Paid" | "Pending">("Pending")
    const [note, setNote] = useState("")
    const [department, setDepartment] = useState("")
    const [responsibleRole, setResponsibleRole] = useState("ผู้รับเหมาช่วง")

    // Items table breakdown
    const [useItemBreakdown, setUseItemBreakdown] = useState(false)
    const [items, setItems] = useState<ItemRow[]>([])

    // Signatures
    const [signatures, setSignatures] = useState({
        requester: { name: "", label: "ผู้เบิกจ่าย" },
        inspector: { name: "", label: "ผู้ตรวจสอบ" },
        accountant: { name: "", label: "ฝ่ายบัญชี" },
        payer: { name: "", label: "ผู้จ่ายเงิน" }
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Reset and initialize when dialog opens
    useEffect(() => {
        if (!isOpen) return

        const initialDocNo = generateVoucherNumber(contracts)
        setVoucherNumber(initialDocNo)

        const initialProjectId = defaultProjectId || (projects[0]?.id || "")
        setProjectId(initialProjectId)

        const initialWorkerId = defaultWorkerId || (workers[0]?.id || "")
        setWorkerId(initialWorkerId)
        setIsNewWorker(false)
        setNewWorkerName("")
        setNewWorkerPhone("")

        setTitle("")
        setAmount(0)
        setDate(todayISO())
        setPaymentDate("")
        setExpenseStatus("Pending")
        setNote("")
        setDepartment("")
        setResponsibleRole("ผู้รับเหมาช่วง")
        setUseItemBreakdown(false)
        setItems([])

        const selectedWorker = workers.find(w => w.id === initialWorkerId)
        setSignatures({
            requester: { name: selectedWorker?.name || "", label: "ผู้เบิกจ่าย" },
            inspector: { name: orgProfile?.signatureName || orgProfile?.name || "", label: "ผู้ตรวจสอบ" },
            accountant: { name: "", label: "ฝ่ายบัญชี" },
            payer: { name: orgProfile?.name || "", label: "ผู้จ่ายเงิน" }
        })
    }, [isOpen, defaultProjectId, defaultWorkerId, contracts, projects, workers, orgProfile])

    // Update requester signature when worker changes
    useEffect(() => {
        if (isNewWorker) {
            setSignatures(prev => ({
                ...prev,
                requester: { ...prev.requester, name: newWorkerName }
            }))
        } else {
            const w = workers.find(item => item.id === workerId)
            if (w) {
                setSignatures(prev => ({
                    ...prev,
                    requester: { ...prev.requester, name: w.name }
                }))
                if (w.role) setResponsibleRole(w.role)
            }
        }
    }, [workerId, isNewWorker, newWorkerName, workers])

    // Calculate sum of items if item breakdown is enabled
    const totalItemAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    }, [items])

    const effectiveAmount = useItemBreakdown ? totalItemAmount : amount

    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            { id: Math.random().toString(36).slice(2, 8), description: "", amount: 0 }
        ])
    }

    const handleRemoveItem = (idx: number) => {
        setItems(prev => prev.filter((_, i) => i !== idx))
    }

    const handleItemChange = (idx: number, field: keyof ItemRow, val: any) => {
        setItems(prev => {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], [field]: val }
            return copy
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast.error("กรุณาระบุชื่องวดงาน หรือรายละเอียดงานที่ว่าจ้าง")
            return
        }

        if (!projectId) {
            toast.error("กรุณาเลือกโครงการ")
            return
        }

        let effectiveWorkerId = workerId
        if (isNewWorker) {
            if (!newWorkerName.trim()) {
                toast.error("กรุณากรอกชื่อช่าง / ผู้รับเหมา")
                return
            }
            try {
                // Create worker on the fly
                await addWorker({
                    name: newWorkerName.trim(),
                    role: responsibleRole || "ช่าง/ผู้รับเหมา",
                    phone: newWorkerPhone.trim() || undefined
                })
                // Find worker or fallback
                const created = workers.find(w => w.name.trim().toLowerCase() === newWorkerName.trim().toLowerCase())
                if (created) effectiveWorkerId = created.id
            } catch (err) {
                console.error(err)
            }
        }

        if (effectiveAmount <= 0) {
            toast.error("กรุณาระบุจำนวนเงินที่มากกว่า 0 บาท")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await createStandaloneVoucher({
                voucherNumber: voucherNumber.trim() || undefined,
                projectId,
                workerId: effectiveWorkerId,
                title: title.trim(),
                amount: effectiveAmount,
                date,
                paymentDate: paymentDate || (expenseStatus === "Paid" ? date : undefined),
                expenseStatus,
                note: note.trim() || undefined,
                department: department.trim() || undefined,
                responsibleRole,
                signatures,
                items: useItemBreakdown && items.length > 0 ? items : undefined
            })

            if (res) {
                toast.success(`ออกใบเบิกงวด ${res.voucherNumber} สำเร็จ`, {
                    description: `ยอดเงิน ${fmtBaht(effectiveAmount)} (${expenseStatus === "Paid" ? "บันทึกตัดเป็นรายจ่ายแล้ว" : "สถานะรอจ่าย"})`
                })

                // Find synthesized contract and draw to pass to success handler
                if (onSuccess) {
                    const fallbackContract: any = {
                        id: res.contractId,
                        documentNumber: res.voucherNumber,
                        projectId,
                        workerId: effectiveWorkerId,
                        title: title.trim(),
                        scope: note || title,
                        startDate: date,
                        endDate: paymentDate || date,
                        totalAmount: effectiveAmount,
                        status: expenseStatus === "Paid" ? "Completed" : "Active",
                        contractType: "ใบเบิกงวด (ไม่มีสัญญา)",
                        isStandaloneVoucher: true,
                        installments: [
                            {
                                id: "inst-1",
                                description: title.trim(),
                                amount: effectiveAmount,
                                dueDate: paymentDate || date,
                                status: expenseStatus === "Paid" ? "Paid" : "Pending",
                                draws: [
                                    {
                                        id: res.drawId,
                                        label: "1",
                                        voucherNumber: res.voucherNumber,
                                        amount: effectiveAmount,
                                        date,
                                        paymentDate,
                                        signatures,
                                        items: useItemBreakdown ? items : undefined,
                                        note,
                                        expenseId: res.expenseId,
                                        expenseStatus
                                    }
                                ]
                            }
                        ]
                    }
                    const fallbackDraw: any = fallbackContract.installments[0].draws[0]
                    onSuccess(res.contractId, res.drawId, fallbackContract, fallbackDraw)
                }
            }

            onClose()
        } catch (err: any) {
            toast.error(err?.message || "ไม่สามารถสร้างใบเบิกงวดได้")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen || typeof document === "undefined") return null

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
                onClick={() => !isSubmitting && onClose()}
            />

            <div className="relative bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                <span>ออกใบเบิกงวดใหม่</span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    งวดเดียว / ไม่มีสัญญา
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                สำหรับช่างที่มีงวดเดียว หรือไม่มีสัญญาจ้างเหมา ออกเอกสารและตัดเข้าเป็นรายจ่ายได้ทันที
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="/vouchers/new"
                            onClick={onClose}
                            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-primary hover:bg-primary/10 transition"
                        >
                            <span>เปิดหน้าเต็ม / ปรับแต่งขั้นสูง</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                    {/* Voucher Number & Status Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="font-semibold text-foreground block mb-1">
                                เลขที่เอกสาร (Voucher No.)
                            </label>
                            <input
                                type="text"
                                value={voucherNumber}
                                onChange={e => setVoucherNumber(e.target.value)}
                                placeholder="PV..."
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                        </div>

                        <div>
                            <label className="font-semibold text-foreground block mb-1">
                                สถานะการจ่าย
                            </label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted border border-border">
                                <button
                                    type="button"
                                    onClick={() => setExpenseStatus("Pending")}
                                    className={cn(
                                        "py-1.5 rounded-lg font-semibold transition text-xs flex items-center justify-center gap-1.5",
                                        expenseStatus === "Pending"
                                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>รอจ่าย (Pending)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpenseStatus("Paid")}
                                    className={cn(
                                        "py-1.5 rounded-lg font-semibold transition text-xs flex items-center justify-center gap-1.5",
                                        expenseStatus === "Paid"
                                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>จ่ายแล้ว (Paid)</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Project & Worker Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="font-semibold text-foreground block mb-1">
                                โครงการ <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            >
                                <option value="" disabled>-- เลือกโครงการ --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="font-semibold text-foreground">
                                    ช่าง / ผู้รับเหมา <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsNewWorker(!isNewWorker)}
                                    className="text-[11px] text-primary hover:underline font-medium"
                                >
                                    {isNewWorker ? "เลือกจากรายชื่อเดิม" : "+ เพิ่มช่างใหม่"}
                                </button>
                            </div>

                            {isNewWorker ? (
                                <div className="space-y-1.5">
                                    <input
                                        type="text"
                                        value={newWorkerName}
                                        onChange={e => setNewWorkerName(e.target.value)}
                                        placeholder="ชื่อช่าง / ร้าน / ผู้รับเหมา"
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={newWorkerPhone}
                                        onChange={e => setNewWorkerPhone(e.target.value)}
                                        placeholder="เบอร์โทรศัพท์ (ถ้ามี)"
                                        className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                                    />
                                </div>
                            ) : (
                                <select
                                    value={workerId}
                                    onChange={e => setWorkerId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    required
                                >
                                    <option value="" disabled>-- เลือกช่าง / ผู้รับเหมา --</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} {w.role ? `(${w.role})` : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Milestone / Job Title */}
                    <div>
                        <label className="font-semibold text-foreground block mb-1">
                            ชื่องวดงาน / งานที่ว่าจ้าง <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="เช่น ค่าแรงติดตั้งประตูม้วน, ค่าทาสีรั้วกำแพงรอบบ้าน, งานเทพื้นปูนทางเข้า"
                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>

                    {/* Amount & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="font-semibold text-foreground block mb-1">
                                ยอดเงินที่เบิก (บาท) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="any"
                                value={useItemBreakdown ? totalItemAmount : (amount || "")}
                                disabled={useItemBreakdown}
                                onChange={e => setAmount(Number(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                                required
                            />
                            {effectiveAmount > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                    ({bahtText(effectiveAmount)})
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="font-semibold text-foreground block mb-1">
                                วันที่ขอเบิก
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                        </div>

                        <div>
                            <label className="font-semibold text-foreground block mb-1">
                                วันที่นัดจ่าย / จ่ายเงิน
                            </label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Breakdown Items Toggle */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                            <span className="font-semibold text-foreground">
                                แยกรายการค่าใช้จ่ายย่อย (Optional)
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!useItemBreakdown && items.length === 0) {
                                        setItems([{ id: "item-1", description: title || "งวดงาน", amount }])
                                    }
                                    setUseItemBreakdown(!useItemBreakdown)
                                }}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border",
                                    useItemBreakdown
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-muted text-muted-foreground border-border hover:text-foreground"
                                )}
                            >
                                {useItemBreakdown ? "✓ เปิดใช้งานรายการย่อย" : "+ เพิ่มรายการย่อย"}
                            </button>
                        </div>

                        {useItemBreakdown && (
                            <div className="mt-3 space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3">
                                {items.map((it, idx) => (
                                    <div key={`add-voucher-item-${it.id || idx}-${idx}`} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={it.description}
                                            onChange={e => handleItemChange(idx, "description", e.target.value)}
                                            placeholder={`รายการที่ ${idx + 1}`}
                                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            step="any"
                                            value={it.amount || ""}
                                            onChange={e => handleItemChange(idx, "amount", Number(e.target.value) || 0)}
                                            placeholder="จำนวนเงิน"
                                            className="w-28 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-right font-semibold"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(idx)}
                                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> เพิ่มแถว
                                    </button>
                                    <span className="font-bold text-foreground">
                                        รวม: {fmtBaht(totalItemAmount)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Note & Remarks */}
                    <div>
                        <label className="font-semibold text-foreground block mb-1">
                            หมายเหตุ / ขอบเขตงานโดยย่อ
                        </label>
                        <textarea
                            rows={2}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="รายละเอียดเพิ่มเติม เงื่อนไขการจ่าย หรือบันทึกข้อความ..."
                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* Signatures Row */}
                    <div className="pt-2 border-t border-border/50">
                        <label className="font-semibold text-foreground block mb-2">
                            ผู้ลงนามในเอกสาร (พิมพ์หรือเลือกชื่อได้)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div>
                                <span className="text-muted-foreground block mb-1">ผู้เบิกจ่าย (ช่าง):</span>
                                <input
                                    type="text"
                                    value={signatures.requester.name}
                                    onChange={e => setSignatures({ ...signatures, requester: { ...signatures.requester, name: e.target.value } })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                                />
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">ผู้ตรวจสอบ:</span>
                                <input
                                    type="text"
                                    value={signatures.inspector.name}
                                    onChange={e => setSignatures({ ...signatures, inspector: { ...signatures.inspector, name: e.target.value } })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                                />
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">ฝ่ายบัญชี:</span>
                                <input
                                    type="text"
                                    value={signatures.accountant.name}
                                    onChange={e => setSignatures({ ...signatures, accountant: { ...signatures.accountant, name: e.target.value } })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                                />
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">ผู้จ่ายเงิน:</span>
                                <input
                                    type="text"
                                    value={signatures.payer.name}
                                    onChange={e => setSignatures({ ...signatures, payer: { ...signatures.payer, name: e.target.value } })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notice */}
                    {expenseStatus === "Paid" && (
                        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>
                                <b>สถานะจ่ายแล้ว:</b> เมื่อบันทึก ระบบจะลงบัญชีรายจ่ายในหมวด Sub-contract จำนวน {fmtBaht(effectiveAmount)} ให้โดยอัตโนมัติ
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-medium transition"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition flex items-center gap-2"
                        >
                            {isSubmitting ? "กำลังบันทึก..." : "ออกใบเบิกงวด"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
