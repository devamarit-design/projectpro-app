"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
    Receipt, FileText, Plus, Search, CheckCircle2, Clock,
    Printer, Trash2, ArrowUpRight, Filter, ChevronRight,
    Building2, User2, Calendar, Edit3, Check, RotateCcw
} from "lucide-react"
import { toast } from "sonner"
import { useProjects, Contract, ContractInstallment, ContractDraw } from "@/context/project-context"
import { useFinance } from "@/context/finance-context"
import { PaymentVoucherDialog } from "@/components/contracts/payment-voucher-dialog"
import { AddVoucherDialog } from "@/components/contracts/add-voucher-dialog"
import { cn } from "@/lib/utils"
import { fmtBaht, thDateShort, getDraws, todayISO } from "@/lib/contract-utils"

interface FlatVoucher {
    id: string
    contract: Contract
    installment: ContractInstallment
    installmentIndex: number
    draw: ContractDraw
    isStandalone: boolean
    voucherNumber: string
    title: string
    workerId: string
    projectId: string
    amount: number
    date: string
    paymentDate?: string
    status: "Paid" | "Pending"
    createdAt: string
}

export default function VouchersPage() {
    const { contracts, projects, workers } = useProjects()
    const { markDrawAsPaid, cancelDraw, deleteContract } = useFinance()

    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [voucherPreviewData, setVoucherPreviewData] = useState<{
        contract: Contract
        installment: ContractInstallment
        installmentIndex: number
        draw: ContractDraw
    } | null>(null)

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "standalone" | "contract">("all")
    const [filterProjectId, setFilterProjectId] = useState<string>("all")

    // Extract all vouchers (draws) from all active contracts
    const allVouchers = useMemo(() => {
        const list: FlatVoucher[] = []
        contracts.forEach(c => {
            if (c.isDeleted) return

            (c.installments || []).forEach((inst, instIdx) => {
                const draws = getDraws(inst, instIdx)
                draws.forEach(draw => {
                    const voucherNo =
                        draw.voucherNumber ||
                        (c.isStandaloneVoucher
                            ? (c.documentNumber || `PV-${draw.label}`)
                            : `PV-${c.documentNumber || "CT"}-${draw.label}`)

                    list.push({
                        id: `${c.id}_${inst.id}_${draw.id}`,
                        contract: c,
                        installment: inst,
                        installmentIndex: instIdx,
                        draw,
                        isStandalone: Boolean(c.isStandaloneVoucher),
                        voucherNumber: voucherNo,
                        title: c.isStandaloneVoucher
                            ? c.title
                            : `${inst.description || "งวดงาน"} (งวดที่ ${draw.label})`,
                        workerId: c.workerId,
                        projectId: c.projectId,
                        amount: Number(draw.amount) || 0,
                        date: draw.date || (draw.createdAt ? draw.createdAt.slice(0, 10) : todayISO()),
                        paymentDate: draw.paymentDate,
                        status: draw.expenseStatus === "Paid" ? "Paid" : "Pending",
                        createdAt: draw.createdAt || c.createdAt
                    })
                })
            })
        })

        // Sort descending by date
        return list.sort((a, b) => {
            const timeA = new Date(a.date || a.createdAt).getTime()
            const timeB = new Date(b.date || b.createdAt).getTime()
            return timeB - timeA
        })
    }, [contracts])

    // Filtered list
    const filteredVouchers = useMemo(() => {
        return allVouchers.filter(v => {
            // Search match
            const project = projects.find(p => p.id === v.projectId)
            const worker = workers.find(w => w.id === v.workerId)
            const q = searchQuery.toLowerCase().trim()

            const matchesSearch =
                !q ||
                v.voucherNumber.toLowerCase().includes(q) ||
                v.title.toLowerCase().includes(q) ||
                (project?.name.toLowerCase().includes(q) ?? false) ||
                (worker?.name.toLowerCase().includes(q) ?? false) ||
                (v.contract.documentNumber?.toLowerCase().includes(q) ?? false)

            // Status match
            const matchesStatus =
                filterStatus === "all" ||
                (filterStatus === "pending" && v.status === "Pending") ||
                (filterStatus === "paid" && v.status === "Paid") ||
                (filterStatus === "standalone" && v.isStandalone) ||
                (filterStatus === "contract" && !v.isStandalone)

            // Project match
            const matchesProject = filterProjectId === "all" || v.projectId === filterProjectId

            return matchesSearch && matchesStatus && matchesProject
        })
    }, [allVouchers, searchQuery, filterStatus, filterProjectId, projects, workers])

    // Metric summaries
    const metrics = useMemo(() => {
        let totalAmt = 0
        let pendingCount = 0
        let pendingAmt = 0
        let paidCount = 0
        let paidAmt = 0
        let standaloneCount = 0
        let standaloneAmt = 0

        allVouchers.forEach(v => {
            totalAmt += v.amount
            if (v.status === "Pending") {
                pendingCount++
                pendingAmt += v.amount
            } else {
                paidCount++
                paidAmt += v.amount
            }
            if (v.isStandalone) {
                standaloneCount++
                standaloneAmt += v.amount
            }
        })

        return {
            totalCount: allVouchers.length,
            totalAmt,
            pendingCount,
            pendingAmt,
            paidCount,
            paidAmt,
            standaloneCount,
            standaloneAmt
        }
    }, [allVouchers])

    // Action handlers
    const handleQuickMarkPaid = async (v: FlatVoucher) => {
        try {
            await markDrawAsPaid(v.contract.id, v.installment.id, v.draw.id)
            toast.success(`เปลี่ยนสถานะใบเบิก ${v.voucherNumber} เป็นจ่ายแล้ว`, {
                description: `บันทึกตัดยอด ${fmtBaht(v.amount)} เข้าบัญชีรายจ่ายเรียบร้อย`
            })
        } catch (e: any) {
            toast.error(e?.message || "ไม่สามารถเปลี่ยนสถานะได้")
        }
    }

    const handleDeleteVoucher = async (v: FlatVoucher) => {
        const msg = v.isStandalone
            ? `ต้องการลบใบเบิกงวด ${v.voucherNumber} (${v.title}) ใช่หรือไม่?\nรายจ่ายที่เกี่ยวข้องจะถูกย้ายไปถังขยะ`
            : `ต้องการยกเลิกการเบิกงวด ${v.voucherNumber} ใช่หรือไม่?\nรายจ่ายที่สร้างจะถูกลบ`

        if (!confirm(msg)) return

        try {
            if (v.isStandalone) {
                await deleteContract(v.contract.id)
            } else {
                await cancelDraw(v.contract.id, v.installment.id, v.draw.id)
            }
            toast.success(`ลบใบเบิกงวด ${v.voucherNumber} เรียบร้อย`)
        } catch (e: any) {
            toast.error(e?.message || "ไม่สามารถลบใบเบิกงวดได้")
        }
    }

    return (
        <div className="space-y-6 pb-24 max-w-7xl mx-auto">
            {/* Dialogs */}
            <AddVoucherDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={(contractId, drawId, contract, draw) => {
                    const inst = contract.installments[0]
                    setVoucherPreviewData({
                        contract,
                        installment: inst,
                        installmentIndex: 0,
                        draw
                    })
                }}
            />

            {voucherPreviewData && (
                <PaymentVoucherDialog
                    isOpen={!!voucherPreviewData}
                    onClose={() => setVoucherPreviewData(null)}
                    contract={voucherPreviewData.contract}
                    installment={voucherPreviewData.installment}
                    installmentIndex={voucherPreviewData.installmentIndex}
                    draw={voucherPreviewData.draw}
                />
            )}

            {/* Page Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <span>ใบเบิกงวด (Payment Vouchers)</span>
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                            {allVouchers.length} ใบ
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                        จัดการใบเบิกงวดงานทั้งหมด ทั้งแบบผูกกับสัญญาจ้าง และใบเบิกงวดเดียว/ไม่มีสัญญา พร้อมออกเอกสารและบันทึกเป็นรายจ่ายอัตโนมัติ
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/contracts"
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-foreground text-xs sm:text-sm transition-all"
                    >
                        <FileText className="w-4 h-4 text-violet-500" />
                        <span>สัญญาจ้างทั้งหมด</span>
                    </Link>

                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-xs sm:text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ออกใบเบิกงวดใหม่</span>
                    </button>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-border/80 bg-card/60 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                        <span>ใบเบิกงวดทั้งหมด</span>
                        <Receipt className="w-4 h-4 text-violet-500" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                        {fmtBaht(metrics.totalAmt)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {metrics.totalCount} รายการในระบบ
                    </p>
                </div>

                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-medium">
                        <span>รอจ่าย (Pending)</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {fmtBaht(metrics.pendingAmt)}
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        {metrics.pendingCount} ใบ รอดำเนินการจ่าย
                    </p>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                        <span>จ่ายแล้ว (Paid)</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {fmtBaht(metrics.paidAmt)}
                    </p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        {metrics.paidCount} ใบ ตัดยอดเป็นรายจ่ายแล้ว
                    </p>
                </div>

                <div className="p-4 rounded-2xl border border-border/80 bg-card/60 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                        <span>ไม่มีสัญญา (งวดเดียว)</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-bold">Quick</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                        {fmtBaht(metrics.standaloneAmt)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {metrics.standaloneCount} ใบ ช่างงวดเดียว
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative min-w-[220px]">
                        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาเลขที่ PV, ช่าง, โครงการ..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* Project Filter */}
                    <select
                        value={filterProjectId}
                        onChange={e => setFilterProjectId(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="all">ทุกโครงการ</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filter Tabs */}
                <div className="flex p-0.5 rounded-xl bg-muted border border-border text-xs overflow-x-auto">
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={cn(
                            "px-3 py-1 rounded-lg font-medium transition whitespace-nowrap",
                            filterStatus === "all" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                        )}
                    >
                        ทั้งหมด ({allVouchers.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus("pending")}
                        className={cn(
                            "px-3 py-1 rounded-lg font-medium transition whitespace-nowrap",
                            filterStatus === "pending" ? "bg-background text-amber-700 dark:text-amber-300 shadow-sm font-semibold" : "text-muted-foreground"
                        )}
                    >
                        รอจ่าย ({metrics.pendingCount})
                    </button>
                    <button
                        onClick={() => setFilterStatus("paid")}
                        className={cn(
                            "px-3 py-1 rounded-lg font-medium transition whitespace-nowrap",
                            filterStatus === "paid" ? "bg-background text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold" : "text-muted-foreground"
                        )}
                    >
                        จ่ายแล้ว ({metrics.paidCount})
                    </button>
                    <button
                        onClick={() => setFilterStatus("standalone")}
                        className={cn(
                            "px-3 py-1 rounded-lg font-medium transition whitespace-nowrap",
                            filterStatus === "standalone" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                        )}
                    >
                        งวดเดียว (ไม่มีสัญญา) ({metrics.standaloneCount})
                    </button>
                    <button
                        onClick={() => setFilterStatus("contract")}
                        className={cn(
                            "px-3 py-1 rounded-lg font-medium transition whitespace-nowrap",
                            filterStatus === "contract" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                        )}
                    >
                        จากสัญญาจ้าง ({allVouchers.length - metrics.standaloneCount})
                    </button>
                </div>
            </div>

            {/* Vouchers List */}
            <div className="space-y-2.5">
                {filteredVouchers.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/40 space-y-3">
                        <Receipt className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
                        <h3 className="font-bold text-base text-foreground">ไม่พบรายการใบเบิกงวด</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            ยังไม่มีใบเบิกงวดที่ตรงกับเงื่อนไขการค้นหา คุณสามารถกดปุ่ม "ออกใบเบิกงวดใหม่" เพื่อสร้างใบเบิกสำหรับช่างได้ทันที
                        </p>
                        <button
                            onClick={() => setIsAddOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-xs shadow"
                        >
                            <Plus className="w-4 h-4" /> ออกใบเบิกงวดใหม่
                        </button>
                    </div>
                ) : (
                    filteredVouchers.map(v => {
                        const project = projects.find(p => p.id === v.projectId)
                        const worker = workers.find(w => w.id === v.workerId)
                        const isPaid = v.status === "Paid"

                        return (
                            <div
                                key={v.id}
                                className="rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all shadow-sm"
                            >
                                <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    {/* Left Badges & Title */}
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Voucher Number */}
                                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-mono shrink-0">
                                                {v.voucherNumber}
                                            </span>

                                            {/* Origin Badge */}
                                            {v.isStandalone ? (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 shrink-0">
                                                    งวดเดียว (ไม่มีสัญญา)
                                                </span>
                                            ) : (
                                                <Link
                                                    href="/contracts"
                                                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:underline shrink-0"
                                                    title="เปิดดูสัญญาจ้าง"
                                                >
                                                    สัญญา: {v.contract.documentNumber || "CT"} (งวด {v.draw.label})
                                                </Link>
                                            )}

                                            {/* Status Badge */}
                                            <span
                                                className={cn(
                                                    "px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0 flex items-center gap-1",
                                                    isPaid
                                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                                )}
                                            >
                                                {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                <span>{isPaid ? "จ่ายแล้ว" : "รอจ่าย"}</span>
                                            </span>

                                            {/* Worker */}
                                            {worker && (
                                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                                                    ช่าง: {worker.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Milestone Title */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-sm text-foreground">
                                                {v.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                • โครงการ: {project?.name || "ไม่ระบุโครงการ"}
                                            </span>
                                        </div>

                                        {/* Date Info */}
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                            <span>วันที่เบิก: <b className="text-foreground">{thDateShort(v.date)}</b></span>
                                            {v.paymentDate && (
                                                <>
                                                    <span>•</span>
                                                    <span>จ่ายเมื่อ: <b className="text-foreground">{thDateShort(v.paymentDate)}</b></span>
                                                </>
                                            )}
                                            {v.draw.note && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate max-w-xs text-muted-foreground">หมายเหตุ: {v.draw.note}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle & Right: Amount + Actions */}
                                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                                        {/* Amount */}
                                        <div className="text-right">
                                            <span className="text-[10px] text-muted-foreground block">ยอดเงินเบิก</span>
                                            <span className="font-extrabold text-base sm:text-lg tabular-nums text-foreground">
                                                {fmtBaht(v.amount)}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            {/* Quick Pay Button */}
                                            {!isPaid && (
                                                <button
                                                    onClick={() => handleQuickMarkPaid(v)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-600/20 transition active:scale-95"
                                                    title="เปลี่ยนสถานะเป็นจ่ายแล้ว (สร้างรายจ่ายเข้าบัญชี)"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>จ่ายแล้ว</span>
                                                </button>
                                            )}

                                            {/* Preview & Print Button */}
                                            <button
                                                onClick={() => {
                                                    setVoucherPreviewData({
                                                        contract: v.contract,
                                                        installment: v.installment,
                                                        installmentIndex: v.installmentIndex,
                                                        draw: v.draw
                                                    })
                                                }}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted text-foreground transition"
                                                title="ดูตัวอย่าง / พิมพ์เอกสารใบเบิกงวด"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">ดูตัวอย่าง / พิมพ์</span>
                                            </button>

                                            {/* Delete / Cancel Button */}
                                            <button
                                                onClick={() => handleDeleteVoucher(v)}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
                                                title="ลบ / ยกเลิกใบเบิกงวดนี้"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
