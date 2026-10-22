"use client"

import * as React from "react"
import {
    FileText,
    Printer,
    CheckCircle2,
    Plus,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Trash2,
    Receipt,
    Clock,
    Split,
    AlertCircle,
    XCircle,
    RotateCcw,
    FolderKanban,
    User2,
    Check,
    Calendar,
    ArrowUpRight,
    Archive,
    ArchiveRestore,
    AlertTriangle
} from "lucide-react"
import type { Contract, Project, Worker, ContractInstallment } from "@/context/project-context"
import {
    fmtBaht,
    fmtNum,
    thDateShort,
    getContractStats,
    getInstallmentDrawn,
    getInstallmentState,
    getDraws,
    DEFAULT_CONTRACT_TITLE
} from "@/lib/contract-utils"
import { cn } from "@/lib/utils"

interface ContractDetailViewProps {
    contract: Contract
    project?: Project
    worker?: Worker
    allContracts?: Contract[]
    onBack: () => void
    onSelectContract?: (contractId: string) => void
    onEdit: (contract: Contract) => void
    onPreview: (contract: Contract) => void
    onToggleStatus: (contract: Contract) => void
    onArchive: (contract: Contract) => void
    onUnarchive: (contract: Contract) => void
    onDelete: (contractId: string) => void
    onOpenVoucher: (data: { contract: Contract; installment: any; index: number; draw?: any }) => void
    onOpenDrawTarget: (target: { contract: Contract; index: number }) => void
    onCancelDraw: (contractId: string, installmentId: string, drawId: string, drawLabel: string) => void
    onMarkPaidQuick: (contractId: string, installmentId: string, drawId: string, drawLabel: string) => void
}

export function ContractDetailView({
    contract: c,
    project,
    worker,
    allContracts = [],
    onBack,
    onSelectContract,
    onEdit,
    onPreview,
    onToggleStatus,
    onArchive,
    onUnarchive,
    onDelete,
    onOpenVoucher,
    onOpenDrawTarget,
    onCancelDraw,
    onMarkPaidQuick
}: ContractDetailViewProps) {
    const stats = React.useMemo(() => getContractStats(c), [c])
    const isCompleted = c.status === "Completed"
    const docNo = c.documentNumber || `CT-${c.id.slice(0, 8)}`

    // Navigation between contracts in current list
    const currentIndex = allContracts.findIndex(item => item.id === c.id)
    const prevContract = currentIndex > 0 ? allContracts[currentIndex - 1] : null
    const nextContract = currentIndex >= 0 && currentIndex < allContracts.length - 1 ? allContracts[currentIndex + 1] : null

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Top Sub-page Header & Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-foreground text-xs sm:text-sm shadow-xs transition active:scale-95 group cursor-pointer"
                        title="กลับไปหน้ารวมสัญญา (ESC)"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span>กลับไปหน้ารวมสัญญา</span>
                    </button>

                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border-l border-border/60 pl-3">
                        <span>สัญญาจ้างเหมางาน</span>
                        <span>/</span>
                        <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                            {docNo}
                        </span>
                    </div>
                </div>

                {/* Contract Switcher (Prev / Next) if multiple contracts */}
                {allContracts.length > 1 && onSelectContract && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground self-end sm:self-center">
                        <span className="text-[11px] font-mono mr-1">
                            {currentIndex + 1} / {allContracts.length}
                        </span>
                        <button
                            type="button"
                            disabled={!prevContract}
                            onClick={() => prevContract && onSelectContract(prevContract.id)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                            title={prevContract ? `สัญญาก่อนหน้า: ${prevContract.documentNumber || prevContract.title}` : ""}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            disabled={!nextContract}
                            onClick={() => nextContract && onSelectContract(nextContract.id)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                            title={nextContract ? `สัญญาถัดไป: ${nextContract.documentNumber || nextContract.title}` : ""}
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Main Contract Detail Container */}
            <div className="bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden transition-all">
                {/* Detail Card Header Bar */}
                <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                    {/* Left Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-md text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-mono">
                            {docNo}
                        </span>
                        {worker && (
                            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                                <span className="text-muted-foreground font-normal">ช่าง:</span> {worker.name}
                            </span>
                        )}
                        <span
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-semibold border",
                                isCompleted
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                    : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                            )}
                        >
                            {isCompleted ? "จบสัญญาแล้ว" : "กำลังดำเนินการ"}
                        </span>
                        {c.isArchived && (
                            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Archive className="w-3.5 h-3.5" />
                                <span>คลังเก็บถาวร</span>
                            </span>
                        )}
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onToggleStatus(c)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95 cursor-pointer",
                                isCompleted
                                    ? "bg-muted hover:bg-muted/80 text-foreground border-border"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            )}
                            title={isCompleted ? "เปิดสัญญาอีกครั้ง (กำลังดำเนินการ)" : "จบสัญญา (ตรวจสอบยอดคงเหลือ)"}
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isCompleted ? "เปิดสัญญาใหม่" : "จบสัญญา"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onPreview(c)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition active:scale-95 cursor-pointer"
                            title="ดูตัวอย่าง / พิมพ์เอกสารสัญญา"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>ดูตัวอย่าง / พิมพ์</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onEdit(c)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition active:scale-95 cursor-pointer"
                            title="แก้ไขสัญญาและงวดงาน"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไขงวดงาน</span>
                        </button>

                        {c.isArchived ? (
                            <button
                                type="button"
                                onClick={() => onUnarchive(c)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow shadow-violet-600/20 transition active:scale-95 cursor-pointer"
                                title="กู้คืนสัญญาให้กลับไปแสดงใน 'ทั้งหมด'"
                            >
                                <ArchiveRestore className="w-3.5 h-3.5" />
                                <span>กู้คืน</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onArchive(c)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition active:scale-95 cursor-pointer"
                                title="ย้ายสัญญาไปที่คลังเก็บถาวร (Archive)"
                            >
                                <Archive className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">เก็บถาวร</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Contract Title & Project Info */}
                <div className="p-4 sm:p-6 space-y-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                            {c.title || DEFAULT_CONTRACT_TITLE}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                            <span>
                                โครงการ: <b className="text-foreground">{project?.name || "ไม่ระบุโครงการ"}</b>
                            </span>
                            <span>•</span>
                            <span>
                                ประเภท: <b className="text-foreground">{c.contractType || "ช่าง/ค่าแรง + ค่าวัสดุ"}</b>
                            </span>
                        </p>
                    </div>

                    {/* 4 Stat Summary Boxes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5">
                            <p className="text-[11px] text-muted-foreground font-medium">มูลค่าว่าจ้างตามสัญญา</p>
                            <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5 tabular-nums">
                                {fmtBaht(stats.total)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5">
                            <p className="text-[11px] text-muted-foreground font-medium">แบ่งงวดงาน</p>
                            <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                                {stats.installmentCount} งวด
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5">
                            <p className="text-[11px] text-muted-foreground font-medium">งวดที่จ่ายแล้ว</p>
                            <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                                {stats.paidInstallments}/{stats.installmentCount} งวด
                                {stats.partialInstallments > 0 && (
                                    <span className="text-xs text-blue-500 font-normal ml-1">
                                        (เบิกย่อย {stats.partialInstallments})
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                                ยอดจ่ายตามงวดแล้ว
                            </p>
                            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                                {fmtBaht(stats.drawn)}
                            </p>
                        </div>
                    </div>

                    {/* Milestone Installments List */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                แผนการส่งมอบงานและการเบิกจ่าย
                            </h3>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                คลิก "เบิกงวด" เพื่อเลือกเบิกเต็มงวด หรือเบิกย่อย (เช่น 5.1, 5.2)
                            </span>
                        </div>

                        <div className="space-y-3">
                            {c.installments.map((inst, idx) => {
                                const state = getInstallmentState(inst, idx)
                                const drawn = getInstallmentDrawn(inst, idx)
                                const remaining = Math.max(0, inst.amount - drawn)
                                const draws = getDraws(inst, idx)
                                const isPaid = state === "Paid"
                                const isPartial = state === "Partial"

                                return (
                                    <div
                                        key={inst.id || idx}
                                        className={cn(
                                            "rounded-xl border p-4 transition-all space-y-3",
                                            isPaid
                                                ? "border-emerald-500/30 bg-emerald-500/5"
                                                : isPartial
                                                ? "border-blue-500/30 bg-blue-500/5"
                                                : "border-border/80 bg-card hover:border-border"
                                        )}
                                    >
                                        {/* Installment Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-sm sm:text-base text-foreground">
                                                        งวดที่ {idx + 1} ({inst.description || "งวดงาน"} (ยอดเงิน {fmtNum(inst.amount)} บาท))
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                                                            isPaid
                                                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                                                : isPartial
                                                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                                        )}
                                                    >
                                                        {isPaid
                                                            ? "จ่ายครบแล้ว"
                                                            : isPartial
                                                            ? `เบิกแล้วบางส่วน (${fmtBaht(drawn)})`
                                                            : "รอดำเนินการ"}
                                                    </span>
                                                </div>

                                                {/* Condition / Scope */}
                                                {inst.details && (
                                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                        {inst.details}
                                                    </p>
                                                )}
                                                {inst.paymentDetails && (
                                                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                                        <b className="text-foreground">เงื่อนไขการจ่าย:</b> {inst.paymentDetails}
                                                    </p>
                                                )}

                                                {/* Due Date & Deliverable snippet */}
                                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                                                    <span>
                                                        กำหนดจ่าย: <b className="text-foreground">{thDateShort(inst.dueDate)}</b>
                                                    </span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-foreground">{fmtBaht(inst.amount)}</span>
                                                    {remaining > 0 && remaining < inst.amount && (
                                                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                            (คงเหลือเบิกได้ {fmtBaht(remaining)})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Actions */}
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                {/* Payment Voucher Action */}
                                                {remaining > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenVoucher({ contract: c, installment: inst, index: idx })}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                                                        title="ออกใบเบิกงวด / ใบสำคัญจ่าย (Payment Voucher)"
                                                    >
                                                        <Receipt className="w-3.5 h-3.5" />
                                                        <span>ออกใบเบิกงวด</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const latestDraw = draws[draws.length - 1]
                                                            onOpenVoucher({ contract: c, installment: inst, index: idx, draw: latestDraw })
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                                                        title="ดูใบสำคัญจ่าย (Payment Voucher)"
                                                    >
                                                        <Receipt className="w-3.5 h-3.5" />
                                                        <span>ดูใบเบิกงวด</span>
                                                    </button>
                                                )}

                                                {/* Quick Draw / Pay Button */}
                                                {remaining > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenDrawTarget({ contract: c, index: idx })}
                                                        className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
                                                        title="เบิกด่วน (Quick Draw)"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sub-draws (การเบิกย่อย เช่น งวดที่ 5.1, 5.2) */}
                                        {draws.length > 0 && (
                                            <div className="pt-2 border-t border-border/50">
                                                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                                                    <Split className="w-3 h-3 text-violet-500" />
                                                    ประวัติการเบิกในงวดนี้ ({draws.length} ครั้ง):
                                                </p>
                                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {draws.map(d => {
                                                        const isPaid = d.expenseStatus === "Paid"
                                                        return (
                                                            <div
                                                                key={d.id}
                                                                className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/60 hover:border-border text-xs group transition"
                                                            >
                                                                <div
                                                                    className="min-w-0 flex-1 cursor-pointer"
                                                                    onClick={() => onOpenVoucher({ contract: c, installment: inst, index: idx, draw: d })}
                                                                    title="คลิกเพื่อดู/พิมพ์ใบสำคัญจ่าย"
                                                                >
                                                                    <div className="flex items-center gap-1.5 font-bold">
                                                                        <span className="px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-600 text-[10px]">
                                                                            งวด {d.label}
                                                                        </span>
                                                                        {d.voucherNumber && (
                                                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                                                {d.voucherNumber}
                                                                            </span>
                                                                        )}
                                                                        <span>{fmtBaht(d.amount)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 pt-0.5 text-[10px]">
                                                                        <span
                                                                            className={cn(
                                                                                "px-1.5 py-0.2 rounded font-semibold",
                                                                                isPaid
                                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                                            )}
                                                                        >
                                                                            {isPaid ? "✓ จ่ายแล้ว" : "⏳ รอจ่าย"}
                                                                        </span>
                                                                        <span className="text-muted-foreground truncate">
                                                                            {thDateShort(d.date)} {d.note ? `• ${d.note}` : ""}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-1 ml-2">
                                                                    {!isPaid && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onMarkPaidQuick(c.id, inst.id, d.id, d.label)}
                                                                            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold text-[10px] transition cursor-pointer"
                                                                            title="เปลี่ยนสถานะเป็นจ่ายแล้วทันที"
                                                                        >
                                                                            จ่ายแล้ว
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onOpenVoucher({ contract: c, installment: inst, index: idx, draw: d })}
                                                                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition cursor-pointer"
                                                                        title="เปิดใบสำคัญจ่าย (Payment Voucher)"
                                                                    >
                                                                        <Receipt className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onCancelDraw(c.id, inst.id, d.id, d.label)}
                                                                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                                                                        title="ยกเลิกการเบิกครั้งนี้ (ลบรายจ่าย)"
                                                                    >
                                                                        <XCircle className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Contract Card Footer */}
                    <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span>
                                เริ่มสัญญา: <b className="text-foreground">{thDateShort(c.startDate)}</b>
                            </span>
                            <span>•</span>
                            <span>
                                สิ้นสุด: <b className="text-foreground">{thDateShort(c.endDate)}</b>
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onDelete(c.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบสัญญา</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
