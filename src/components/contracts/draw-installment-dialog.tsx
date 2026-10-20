"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { X, Wallet, Split, CheckCircle2, Clock, Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Contract } from "@/context/project-context"
import { useFinance } from "@/context/finance-context"
import { cn } from "@/lib/utils"
import { fmtBaht, getDraws, getInstallmentDrawn, nextDrawLabel, todayISO } from "@/lib/contract-utils"

interface DrawInstallmentDialogProps {
    isOpen: boolean
    onClose: () => void
    contract: Contract
    installmentIndex: number
    workerName?: string
}

export function DrawInstallmentDialog({ isOpen, onClose, contract, installmentIndex, workerName }: DrawInstallmentDialogProps) {
    const { drawInstallment } = useFinance()
    const inst = contract.installments[installmentIndex]

    const drawn = inst ? getInstallmentDrawn(inst, installmentIndex) : 0
    const remaining = inst ? Math.max(0, inst.amount - drawn) : 0
    const hasDraws = inst ? getDraws(inst, installmentIndex).length > 0 : false

    const [mode, setMode] = useState<"full" | "partial">("full")
    const [amount, setAmount] = useState<number>(remaining)
    const [date, setDate] = useState(todayISO())
    const [note, setNote] = useState("")
    const [expenseStatus, setExpenseStatus] = useState<"Paid" | "Pending">("Paid")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setMode(hasDraws ? "partial" : "full")
        setAmount(hasDraws ? remaining : remaining)
        setDate(todayISO())
        setNote("")
        setExpenseStatus("Paid")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, contract.id, installmentIndex])

    const effectiveAmount = mode === "full" ? remaining : amount
    const label = useMemo(() => inst ? nextDrawLabel(inst, installmentIndex, effectiveAmount) : "", [inst, installmentIndex, effectiveAmount])
    const invalid = effectiveAmount <= 0 || effectiveAmount > remaining + 0.009
    const afterRemaining = Math.max(0, remaining - (Number(effectiveAmount) || 0))

    if (!isOpen || !inst || typeof document === "undefined") return null

    const handleSubmit = async () => {
        if (invalid || saving) return
        setSaving(true)
        try {
            const res = await drawInstallment(contract.id, inst.id, {
                amount: effectiveAmount,
                date,
                note: note.trim() || undefined,
                expenseStatus
            })
            toast.success(`เบิกงวดที่ ${res?.label ?? label} สำเร็จ`, {
                description: `สร้างรายจ่าย ${fmtBaht(effectiveAmount)} (${expenseStatus === "Paid" ? "จ่ายแล้ว" : "ค้างจ่าย"}) เรียบร้อย`
            })
            onClose()
        } catch (e: any) {
            toast.error(e?.message || "เบิกงวดไม่สำเร็จ")
        } finally {
            setSaving(false)
        }
    }

    const quick = [25, 50, 75]

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => !saving && onClose()} />
            <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-card/95 backdrop-blur px-5 pt-5 pb-4 border-b border-border">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-300 font-semibold">{contract.documentNumber || "สัญญา"}</span>
                                {workerName && <span className="truncate">ผู้รับจ้าง: {workerName}</span>}
                            </div>
                            <h2 className="text-lg font-bold leading-snug">เบิกงวดที่ {installmentIndex + 1}</h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">{inst.description}</p>
                        </div>
                        <button onClick={onClose} disabled={saving} className="p-2 -mr-2 rounded-full hover:bg-muted text-muted-foreground" aria-label="ปิด">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Installment summary */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="rounded-xl bg-muted/50 p-2.5">
                            <p className="text-[10px] text-muted-foreground">มูลค่างวด</p>
                            <p className="font-bold text-sm">{fmtBaht(inst.amount)}</p>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-2.5">
                            <p className="text-[10px] text-muted-foreground">เบิกแล้ว</p>
                            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{fmtBaht(drawn)}</p>
                        </div>
                        <div className="rounded-xl bg-amber-500/10 p-2.5">
                            <p className="text-[10px] text-amber-700 dark:text-amber-300">คงเหลือเบิกได้</p>
                            <p className="font-bold text-sm text-amber-700 dark:text-amber-300">{fmtBaht(remaining)}</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-5">
                    {/* Mode */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setMode("full")}
                            className={cn(
                                "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                                mode === "full" ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20" : "border-border hover:bg-muted/50"
                            )}
                        >
                            <Wallet className={cn("w-5 h-5 shrink-0", mode === "full" ? "text-emerald-600" : "text-muted-foreground")} />
                            <div>
                                <p className="text-sm font-semibold">{hasDraws ? "เบิกส่วนที่เหลือ" : "เบิกเต็มงวด"}</p>
                                <p className="text-[11px] text-muted-foreground">{fmtBaht(remaining)}</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode("partial"); if (amount <= 0 || amount > remaining) setAmount(Math.round(remaining / 2)) }}
                            className={cn(
                                "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                                mode === "partial" ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20" : "border-border hover:bg-muted/50"
                            )}
                        >
                            <Split className={cn("w-5 h-5 shrink-0", mode === "partial" ? "text-violet-600" : "text-muted-foreground")} />
                            <div>
                                <p className="text-sm font-semibold">เบิกย่อย (ระหว่างงวด)</p>
                                <p className="text-[11px] text-muted-foreground">เช่น งวด {installmentIndex + 1}.1, {installmentIndex + 1}.2</p>
                            </div>
                        </button>
                    </div>

                    {mode === "partial" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <label htmlFor="draw-amount" className="text-xs font-semibold text-muted-foreground">จำนวนเงินที่เบิก</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">฿</span>
                                <input
                                    id="draw-amount"
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    max={remaining}
                                    value={amount || ""}
                                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                    className={cn(
                                        "w-full pl-9 pr-4 py-3 rounded-xl bg-muted/40 border text-xl font-bold tabular-nums focus:outline-none focus:ring-2",
                                        invalid ? "border-red-400 focus:ring-red-400/30" : "border-border focus:ring-violet-500/30"
                                    )}
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {quick.map(p => (
                                    <button key={p} type="button" onClick={() => setAmount(Math.round(remaining * p / 100))}
                                        className="px-3 py-1 rounded-full text-xs font-medium border border-border hover:bg-muted transition-colors">
                                        {p}% · {fmtBaht(Math.round(remaining * p / 100))}
                                    </button>
                                ))}
                            </div>
                            {effectiveAmount > remaining + 0.009 && (
                                <p className="text-xs text-red-500">ยอดเบิกเกินคงเหลือของงวด ({fmtBaht(remaining)})</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="draw-date" className="text-xs font-semibold text-muted-foreground">วันที่เบิก</label>
                            <input id="draw-date" type="date" value={date} onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">สถานะรายจ่าย</span>
                            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/50">
                                <button type="button" onClick={() => setExpenseStatus("Paid")}
                                    className={cn("flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                        expenseStatus === "Paid" ? "bg-emerald-500 text-white shadow" : "text-muted-foreground")}>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> จ่ายแล้ว
                                </button>
                                <button type="button" onClick={() => setExpenseStatus("Pending")}
                                    className={cn("flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                        expenseStatus === "Pending" ? "bg-amber-500 text-white shadow" : "text-muted-foreground")}>
                                    <Clock className="w-3.5 h-3.5" /> ค้างจ่าย
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="draw-note" className="text-xs font-semibold text-muted-foreground">หมายเหตุ (ไม่บังคับ)</label>
                        <input id="draw-note" value={note} onChange={e => setNote(e.target.value)}
                            placeholder="เช่น ผลงานคืบหน้า 50%, ฐานรากเสร็จ 4 จุด"
                            className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-sm" />
                    </div>

                    {/* Preview */}
                    <div className="rounded-2xl border border-dashed border-border p-4 bg-gradient-to-br from-violet-500/5 to-emerald-500/5">
                        <p className="text-[11px] text-muted-foreground mb-1">จะสร้างรายจ่าย (หมวด ผู้รับเหมาช่วง)</p>
                        <p className="text-sm font-semibold leading-snug">{contract.documentNumber} งวดที่ {label} - {inst.description}</p>
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-2xl font-extrabold tabular-nums">{fmtBaht(effectiveAmount || 0)}</span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                คงเหลือหลังเบิก <ArrowRight className="w-3 h-3" /> <b className="text-foreground">{fmtBaht(afterRemaining)}</b>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-card/95 backdrop-blur px-5 py-4 border-t border-border flex gap-3">
                    <button onClick={onClose} disabled={saving} className="flex-1 py-3 rounded-xl font-medium hover:bg-muted transition-colors">ยกเลิก</button>
                    <button
                        onClick={handleSubmit}
                        disabled={invalid || saving}
                        className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                        ยืนยันเบิกงวดที่ {label}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
