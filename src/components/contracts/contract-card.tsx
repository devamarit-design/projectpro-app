"use client"

import * as React from "react"
import {
    FileText,
    CheckCircle2,
    Clock,
    FolderKanban,
    User2,
    Calendar,
    ArrowUpRight,
    Printer,
    Edit3,
    Archive,
    ArchiveRestore,
    Split,
    AlertCircle,
    ChevronRight,
    Sparkles
} from "lucide-react"
import type { Contract, Project, Worker } from "@/context/project-context"
import {
    fmtBaht,
    fmtNum,
    thDateShort,
    getContractStats,
    getInstallmentState,
    DEFAULT_CONTRACT_TITLE
} from "@/lib/contract-utils"
import { cn } from "@/lib/utils"

interface ContractCardProps {
    contract: Contract
    project?: Project
    worker?: Worker
    onClick: () => void
    onPreview?: (e: React.MouseEvent) => void
    onEdit?: (e: React.MouseEvent) => void
    onArchive?: (e: React.MouseEvent) => void
    onUnarchive?: (e: React.MouseEvent) => void
}

export function ContractCard({
    contract,
    project,
    worker,
    onClick,
    onPreview,
    onEdit,
    onArchive,
    onUnarchive
}: ContractCardProps) {
    const stats = React.useMemo(() => getContractStats(contract), [contract])
    const isCompleted = contract.status === "Completed"
    const isArchived = Boolean(contract.isArchived)
    const docNo = contract.documentNumber || `CT-${contract.id.slice(0, 8)}`

    // Find next pending or partial installment to highlight
    const nextInstallment = React.useMemo(() => {
        if (!contract.installments || contract.installments.length === 0) return null
        for (let i = 0; i < contract.installments.length; i++) {
            const inst = contract.installments[i]
            const state = getInstallmentState(inst, i)
            if (state !== "Paid") {
                return {
                    index: i + 1,
                    inst,
                    state
                }
            }
        }
        return null
    }, [contract.installments])

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onClick()
                }
            }}
            className={cn(
                "group relative flex flex-col justify-between rounded-2xl border bg-card/90 backdrop-blur-sm p-5",
                "hover:shadow-xl hover:border-primary/50 transition-all duration-200 cursor-pointer text-left overflow-hidden",
                isCompleted
                    ? "border-emerald-500/30 hover:shadow-emerald-500/5"
                    : isArchived
                    ? "border-amber-500/30 bg-muted/20"
                    : "border-border/80 hover:shadow-primary/5"
            )}
        >
            {/* Top decorative gradient glow on hover */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-300 pointer-events-none" />

            {/* Top Row: Badges & Quick Action Icons */}
            <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {/* Doc Number Badge */}
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/25 shrink-0 shadow-2xs">
                            {docNo}
                        </span>

                        {/* Status Badge */}
                        {isArchived ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-1">
                                <Archive className="w-3 h-3" />
                                <span>คลังเก็บถาวร</span>
                            </span>
                        ) : isCompleted ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>จบสัญญาแล้ว</span>
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>กำลังดำเนินการ</span>
                            </span>
                        )}
                    </div>

                    {/* Contract Type Pill */}
                    {contract.contractType && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/50 shrink-0 truncate max-w-[120px]">
                            {contract.contractType}
                        </span>
                    )}
                </div>

                {/* Contract Title */}
                <div>
                    <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {contract.title || DEFAULT_CONTRACT_TITLE}
                    </h3>
                </div>

                {/* Worker & Project Meta */}
                <div className="space-y-1.5 text-xs">
                    {/* Worker */}
                    <div className="flex items-center gap-2 text-foreground/90 font-medium">
                        <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <User2 className="w-3 h-3" />
                        </div>
                        <span className="truncate">
                            <span className="text-muted-foreground font-normal">ช่าง:</span> {worker?.name || "ไม่ระบุช่าง"}
                        </span>
                    </div>

                    {/* Project */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-5 h-5 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0 border border-border/50">
                            <FolderKanban className="w-3 h-3" />
                        </div>
                        <span className="truncate">
                            <span className="font-normal">โครงการ:</span> {project?.name || "ไม่ระบุโครงการ"}
                        </span>
                    </div>
                </div>

                {/* Financial & Milestone Progress Box */}
                <div className="pt-2">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2.5">
                        {/* Progress Header */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-muted-foreground flex items-center gap-1">
                                <span>ความคืบหน้างวดงาน</span>
                                <span className="font-bold text-foreground">
                                    ({stats.paidInstallments}/{stats.installmentCount} งวด)
                                </span>
                            </span>
                            <span
                                className={cn(
                                    "font-bold tabular-nums",
                                    isCompleted || stats.progress >= 100
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-foreground"
                                )}
                            >
                                {Math.round(stats.progress)}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden relative border border-border/40">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isCompleted || stats.progress >= 100
                                        ? "bg-emerald-500"
                                        : "bg-gradient-to-r from-blue-500 to-emerald-500"
                                )}
                                style={{ width: `${Math.min(100, Math.max(stats.progress, 0))}%` }}
                            />
                        </div>

                        {/* 3 Metrics Row */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40 text-[11px]">
                            <div>
                                <span className="text-[10px] text-muted-foreground block">มูลค่าสัญญา</span>
                                <span className="font-bold tabular-nums text-foreground block truncate">
                                    {fmtBaht(stats.total)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">จ่ายแล้ว</span>
                                <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 block truncate">
                                    {fmtBaht(stats.drawn)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block">คงเหลือ</span>
                                <span
                                    className={cn(
                                        "font-bold tabular-nums block truncate",
                                        stats.remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                                    )}
                                >
                                    {fmtBaht(stats.remaining)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Milestone Hint (if not completed and has pending) */}
                {!isCompleted && nextInstallment && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5 px-0.5">
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">
                            งวดถัดไป: <b>งวดที่ {nextInstallment.index}</b> ({fmtBaht(nextInstallment.inst.amount)})
                            {nextInstallment.inst.dueDate && (
                                <span className="ml-1 text-muted-foreground/80">
                                    • กำหนด {thDateShort(nextInstallment.inst.dueDate)}
                                </span>
                            )}
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom Actions & Date Footer */}
            <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between gap-2 relative z-10 text-xs">
                {/* Date snippet */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>
                        {thDateShort(contract.startDate)} - {thDateShort(contract.endDate)}
                    </span>
                </div>

                {/* Quick actions on the right */}
                <div className="flex items-center gap-1.5">
                    {onPreview && (
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation()
                                onPreview(e)
                            }}
                            className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="ดูตัวอย่าง / พิมพ์เอกสารสัญญา"
                        >
                            <Printer className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {onEdit && (
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation()
                                onEdit(e)
                            }}
                            className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="แก้ไขสัญญา"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* View Details Callout */}
                    <div className="flex items-center gap-1 pl-1 text-primary font-bold text-xs group-hover:translate-x-0.5 transition-transform">
                        <span>ดูรายละเอียด</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </div>
        </div>
    )
}
