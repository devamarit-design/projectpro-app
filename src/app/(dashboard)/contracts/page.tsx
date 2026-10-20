"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useProjects, Contract, ContractInstallment, ContractDraw } from "@/context/project-context"
import { useFinance } from "@/context/finance-context"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import { ContractPreviewDialog } from "@/components/contracts/contract-preview-dialog"
import { PaymentVoucherDialog } from "@/components/contracts/payment-voucher-dialog"
import { DrawInstallmentDialog } from "@/components/contracts/draw-installment-dialog"
import {
    FileText,
    Printer,
    CheckCircle2,
    Plus,
    ChevronDown,
    ChevronUp,
    Edit3,
    Trash2,
    Receipt,
    Search,
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
import { useTranslation } from "@/lib/i18n-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    fmtBaht,
    fmtNum,
    thDateShort,
    thDateLong,
    getContractStats,
    getInstallmentDrawn,
    getInstallmentState,
    getDraws,
    splitLegacyScope,
    DEFAULT_CONTRACT_TITLE
} from "@/lib/contract-utils"

export default function ContractsPage() {
    const { contracts, projects, workers, deleteContract, updateContract, archiveContract, unarchiveContract, currentTeam } = useProjects()
    const { cancelDraw, markDrawAsPaid } = useFinance()
    const { t } = useTranslation()

    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [previewContract, setPreviewContract] = useState<Contract | null>(null)
    const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined)
    const [voucherData, setVoucherData] = useState<{
        contract: Contract
        installment: any
        index: number
        draw?: any
    } | null>(null)
    const [drawTarget, setDrawTarget] = useState<{ contract: Contract; index: number } | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

    // Close contract confirmation (when remaining unpaid balance exists)
    const [closeConfirmTarget, setCloseConfirmTarget] = useState<{
        contract: Contract
        remaining: number
        drawn: number
        total: number
    } | null>(null)

    // Selection & Filter states
    const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "archived">("all")
    const [filterProjectId, setFilterProjectId] = useState<string>("all")

    // Filter counts (Exclude standalone 1-milestone vouchers which belong in /vouchers)
    const nonArchivedContracts = useMemo(() => contracts.filter(c => !c.isDeleted && !c.isArchived && !c.isStandaloneVoucher), [contracts])
    const archivedContracts = useMemo(() => contracts.filter(c => !c.isDeleted && c.isArchived && !c.isStandaloneVoucher), [contracts])
    const activeContracts = useMemo(() => nonArchivedContracts.filter(c => c.status !== "Completed"), [nonArchivedContracts])
    const completedContracts = useMemo(() => nonArchivedContracts.filter(c => c.status === "Completed"), [nonArchivedContracts])

    // Filtered contracts list (Note: "ทั้งหมด" excludes archived and standalone vouchers!)
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            if (c.isDeleted || c.isStandaloneVoucher) return false

            // Archive rule: Archive tab shows ONLY archived; all other tabs show ONLY non-archived
            if (filterStatus === "archived") {
                if (!c.isArchived) return false
            } else {
                if (c.isArchived) return false
            }

            const matchesSearch =
                (c.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (projects.find(p => p.id === c.projectId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (workers.find(w => w.id === c.workerId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

            const matchesStatus =
                filterStatus === "all" ||
                filterStatus === "archived" ||
                (filterStatus === "completed" && c.status === "Completed") ||
                (filterStatus === "active" && c.status !== "Completed")

            const matchesProject = filterProjectId === "all" || c.projectId === filterProjectId

            return matchesSearch && matchesStatus && matchesProject
        })
    }, [contracts, searchQuery, filterStatus, filterProjectId, projects, workers])

    // Currently featured/expanded contract at the top
    const activeContract = useMemo(() => {
        if (selectedContractId) {
            const found = contracts.find(c => c.id === selectedContractId && !c.isDeleted)
            if (found) return found
        }
        return filteredContracts.length > 0 ? filteredContracts[0] : null
    }, [selectedContractId, contracts, filteredContracts])

    const handleEdit = (contract: Contract) => {
        setEditingContract(contract)
        setIsAddOpen(true)
    }

    const handleCloseAdd = () => {
        setIsAddOpen(false)
        setEditingContract(undefined)
    }

    // Close or Re-open Contract
    const handleInitiateCloseContract = (contract: Contract) => {
        if (contract.status === "Completed") {
            // Already completed -> Reopen
            updateContract(contract.id, { status: "Active" })
            toast.success(`เปิดสัญญา ${contract.documentNumber || ""} เป็นกำลังดำเนินการ`)
            return
        }

        const stats = getContractStats(contract)
        if (stats.remaining > 0.009) {
            // Unfinished balance: warn user and let them choose whether to cut remainder or cancel
            setCloseConfirmTarget({
                contract,
                remaining: stats.remaining,
                drawn: stats.drawn,
                total: stats.total
            })
        } else {
            // Paid 100%: mark completed directly
            updateContract(contract.id, { status: "Completed" })
            toast.success(`จบสัญญา ${contract.documentNumber || ""} เรียบร้อย (จ่ายครบตามสัญญา)`)
        }
    }

    const handleToggleContractStatus = async (contract: Contract) => {
        handleInitiateCloseContract(contract)
    }

    // Archive / Unarchive Contract
    const handleArchiveContract = async (contract: Contract) => {
        const docNo = contract.documentNumber || `CT-${contract.id.slice(0, 8)}`
        if (!confirm(`ต้องการย้ายสัญญา ${docNo} ไปที่คลังเก็บถาวร (Archive) ใช่หรือไม่?\nสัญญาจะไม่แสดงในรายการ 'ทั้งหมด'`)) return
        try {
            await archiveContract(contract.id)
            if (selectedContractId === contract.id) setSelectedContractId(null)
            toast.success(`ย้ายสัญญา ${docNo} ไปที่คลังเก็บถาวรแล้ว`, {
                description: "คุณสามารถดูหรือกู้คืนได้ที่แท็บ 'คลังเก็บ (Archive)'"
            })
        } catch (e: any) {
            toast.error("ไม่สามารถย้ายสัญญาได้")
        }
    }

    const handleUnarchiveContract = async (contract: Contract) => {
        const docNo = contract.documentNumber || `CT-${contract.id.slice(0, 8)}`
        try {
            await unarchiveContract(contract.id)
            toast.success(`กู้คืนสัญญา ${docNo} จากคลังเก็บเรียบร้อย`, {
                description: "สัญญากลับมาแสดงในรายการ 'ทั้งหมด' แล้ว"
            })
        } catch (e: any) {
            toast.error("ไม่สามารถกู้คืนสัญญาได้")
        }
    }

    const handleCancelDraw = async (contractId: string, installmentId: string, drawId: string, drawLabel: string) => {
        if (!confirm(`ต้องการยกเลิกการเบิกงวดที่ ${drawLabel} ใช่หรือไม่? รายจ่ายที่สร้างจะถูกลบ`)) return
        try {
            await cancelDraw(contractId, installmentId, drawId)
            toast.success(`ยกเลิกการเบิกงวดที่ ${drawLabel} เรียบร้อย`)
        } catch (e: any) {
            toast.error(e?.message || "ไม่สามารถยกเลิกได้")
        }
    }

    const handleMarkPaidQuick = async (contractId: string, installmentId: string, drawId: string, drawLabel: string) => {
        try {
            await markDrawAsPaid(contractId, installmentId, drawId)
            toast.success(`เปลี่ยนสถานะงวด ${drawLabel} เป็นจ่ายแล้ว`, {
                description: "อัปเดตสถานะในใบเบิกงวดและตัดยอดเป็นรายจ่ายเรียบร้อย"
            })
        } catch (e: any) {
            toast.error(e?.message || "ไม่สามารถเปลี่ยนสถานะได้")
        }
    }

    return (
        <div className="space-y-6 pb-24 max-w-7xl mx-auto">
            {/* Dialogs */}
            <AddContractDialog
                isOpen={isAddOpen}
                onClose={handleCloseAdd}
                initialData={editingContract}
            />

            {previewContract && (
                <ContractPreviewDialog
                    isOpen={!!previewContract}
                    contract={previewContract}
                    onClose={() => setPreviewContract(null)}
                    onEdit={() => handleEdit(previewContract)}
                />
            )}

            {voucherData && (
                <PaymentVoucherDialog
                    isOpen={!!voucherData}
                    onClose={() => setVoucherData(null)}
                    contract={voucherData.contract}
                    installment={voucherData.installment}
                    installmentIndex={voucherData.index}
                    draw={voucherData.draw}
                />
            )}

            {drawTarget && (
                <DrawInstallmentDialog
                    isOpen={!!drawTarget}
                    onClose={() => setDrawTarget(null)}
                    contract={drawTarget.contract}
                    installmentIndex={drawTarget.index}
                    workerName={workers.find(w => w.id === drawTarget.contract.workerId)?.name}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteConfirm(null)} />
                    <div className="relative bg-card border border-border p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">ยืนยันการลบสัญญา?</h3>
                            <p className="text-muted-foreground text-sm">
                                สัญญานี้จะถูกย้ายไปถังขยะ คุณสามารถกู้คืนได้ภายหลังจากหน้าถังขยะ
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium hover:bg-muted transition-colors text-sm"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => {
                                    if (showDeleteConfirm) {
                                        deleteContract(showDeleteConfirm)
                                        if (selectedContractId === showDeleteConfirm) setSelectedContractId(null)
                                        setShowDeleteConfirm(null)
                                        toast.success("ย้ายสัญญาไปที่ถังขยะแล้ว")
                                    }
                                }}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 text-sm"
                            >
                                ลบสัญญา
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Contract Confirmation Dialog (When unpaid balance exists) */}
            {closeConfirmTarget && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in" onClick={() => setCloseConfirmTarget(null)} />
                    <div className="relative bg-card border border-border p-6 rounded-2xl w-full max-w-md space-y-5 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-foreground">จบสัญญา (ตัดยอดคงเหลือ)</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {closeConfirmTarget.contract.documentNumber} • {closeConfirmTarget.contract.title}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                                <span>แจ้งเตือน: ค่างวดงานยังเบิกจ่ายไม่ครบ</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                สัญญานี้ยังมีค่างวดงานที่ยังไม่ได้เบิกจ่ายครบตามสัญญา หากคุณเลือกจบสัญญา ระบบจะตัดยอดคงเหลือที่เหลืออยู่ไปเลย และปรับสถานะเป็น "จบสัญญาแล้ว"
                            </p>

                            <div className="pt-2 border-t border-amber-500/20 space-y-1.5 text-xs">
                                <div className="flex justify-between py-0.5">
                                    <span className="text-muted-foreground">มูลค่าสัญญา:</span>
                                    <span className="font-semibold text-foreground">{fmtBaht(closeConfirmTarget.total)}</span>
                                </div>
                                <div className="flex justify-between py-0.5">
                                    <span className="text-muted-foreground">เบิกจ่ายแล้ว:</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {fmtBaht(closeConfirmTarget.drawn)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-dashed border-amber-500/30">
                                    <span className="text-amber-700 dark:text-amber-300">ยอดคงเหลือที่จะตัดจบ:</span>
                                    <span className="text-amber-700 dark:text-amber-300 font-extrabold">{fmtBaht(closeConfirmTarget.remaining)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setCloseConfirmTarget(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium border border-border hover:bg-muted text-foreground transition text-xs sm:text-sm text-center"
                            >
                                ยังไม่จบ (กลับไปทำต่อ)
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const c = closeConfirmTarget.contract
                                    const rem = closeConfirmTarget.remaining
                                    await updateContract(c.id, { status: "Completed" })
                                    setCloseConfirmTarget(null)
                                    toast.success(`จบสัญญา ${c.documentNumber || ""} เรียบร้อย`, {
                                        description: `ตัดยอดคงเหลือ ${fmtBaht(rem)} เรียบร้อย`
                                    })
                                }}
                                className="flex-1 py-2.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition text-xs sm:text-sm text-center"
                            >
                                ยืนยันจบสัญญา (ตัดยอด)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        {t.contracts?.title || "สัญญาจ้างเหมางาน"}
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                            {nonArchivedContracts.length} สัญญา
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                        บริหารสัญญาจ้างเหมาช่าง แบ่งงวดงาน และออกเบิกจ่ายส่งเข้าเป็นรายจ่ายอัตโนมัติ
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/vouchers"
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-foreground text-xs sm:text-sm transition-all"
                        title="ดูและจัดการใบเบิกงวดทั้งหมด รวมถึงช่างที่มีงวดเดียวไม่ต้องทำสัญญา"
                    >
                        <Receipt className="w-4 h-4 text-emerald-500" />
                        <span>ใบเบิกงวด</span>
                    </Link>
                    <button
                        onClick={() => {
                            setEditingContract(undefined)
                            setIsAddOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>สร้างสัญญาใหม่</span>
                    </button>
                </div>
            </div>

            {/* ───────────────────────────────────────────────────────────────────────────── */}
            {/* FEATURED / EXPANDED CONTRACT CARD (BBSPM Style) */}
            {/* ───────────────────────────────────────────────────────────────────────────── */}
            {activeContract ? (
                (() => {
                    const c = activeContract
                    const project = projects.find(p => p.id === c.projectId)
                    const worker = workers.find(w => w.id === c.workerId)
                    const stats = getContractStats(c)
                    const isCompleted = c.status === "Completed"
                    const docNo = c.documentNumber || `CT-${c.id.slice(0, 8)}`

                    return (
                        <div className="bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden transition-all">
                            {/* Card Header Bar */}
                            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                                {/* Left Badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-md text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                        {docNo}
                                    </span>
                                    {worker && (
                                        <span className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                                            <span className="text-muted-foreground">ช่าง:</span> {worker.name}
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
                                </div>

                                {/* Right Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleInitiateCloseContract(c)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95",
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
                                        onClick={() => setPreviewContract(c)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition active:scale-95"
                                        title="ดูตัวอย่าง / พิมพ์เอกสารสัญญา"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>ดูตัวอย่าง / พิมพ์</span>
                                    </button>

                                    <button
                                        onClick={() => handleEdit(c)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition active:scale-95"
                                        title="แก้ไขสัญญาและงวดงาน"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>แก้ไขงวดงาน</span>
                                    </button>

                                    {c.isArchived ? (
                                        <button
                                            onClick={() => handleUnarchiveContract(c)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow shadow-violet-600/20 transition active:scale-95"
                                            title="กู้คืนสัญญาให้กลับไปแสดงใน 'ทั้งหมด'"
                                        >
                                            <ArchiveRestore className="w-3.5 h-3.5" />
                                            <span>กู้คืน</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleArchiveContract(c)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition active:scale-95"
                                            title="ย้ายสัญญาไปที่คลังเก็บถาวร (Archive)"
                                        >
                                            <Archive className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">เก็บถาวร</span>
                                        </button>
                                    )}

                                    {selectedContractId && (
                                        <button
                                            onClick={() => setSelectedContractId(null)}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition"
                                            title="ย่อรายละเอียด"
                                        >
                                            ย่อ
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
                                        <span>โครงการ: <b className="text-foreground">{project?.name || "ไม่ระบุโครงการ"}</b></span>
                                        <span>•</span>
                                        <span>ประเภท: <b className="text-foreground">{c.contractType || "ช่าง/ค่าแรง + ค่าวัสดุ"}</b></span>
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
                                        <span className="text-xs text-muted-foreground">
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
                                                                <span>กำหนดจ่าย: <b className="text-foreground">{thDateShort(inst.dueDate)}</b></span>
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
                                                            {/* Payment Voucher Action: Main Workflow Button */}
                                                            {remaining > 0 ? (
                                                                <button
                                                                    onClick={() => setVoucherData({ contract: c, installment: inst, index: idx })}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow shadow-amber-500/20 active:scale-95 transition"
                                                                    title="ออกใบเบิกงวด / ใบสำคัญจ่าย (Payment Voucher)"
                                                                >
                                                                    <Receipt className="w-3.5 h-3.5" />
                                                                    <span>ออกใบเบิกงวด</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        const latestDraw = draws[draws.length - 1]
                                                                        setVoucherData({ contract: c, installment: inst, index: idx, draw: latestDraw })
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                                                                    title="ดูใบสำคัญจ่าย (Payment Voucher)"
                                                                >
                                                                    <Receipt className="w-3.5 h-3.5" />
                                                                    <span>ดูใบเบิกงวด</span>
                                                                </button>
                                                            )}

                                                            {/* Quick Draw / Pay Button (Optional quick modal) */}
                                                            {remaining > 0 && (
                                                                <button
                                                                    onClick={() => setDrawTarget({ contract: c, index: idx })}
                                                                    className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
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
                                                                                onClick={() => setVoucherData({ contract: c, installment: inst, index: idx, draw: d })}
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
                                                                                        onClick={() => handleMarkPaidQuick(c.id, inst.id, d.id, d.label)}
                                                                                        className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold text-[10px] transition"
                                                                                        title="เปลี่ยนสถานะเป็นจ่ายแล้วทันที"
                                                                                    >
                                                                                        จ่ายแล้ว
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => setVoucherData({ contract: c, installment: inst, index: idx, draw: d })}
                                                                                    className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition"
                                                                                    title="เปิดใบสำคัญจ่าย (Payment Voucher)"
                                                                                >
                                                                                    <Receipt className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleCancelDraw(c.id, inst.id, d.id, d.label)}
                                                                                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
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
                                        <span>เริ่มสัญญา: <b className="text-foreground">{thDateShort(c.startDate)}</b></span>
                                        <span>•</span>
                                        <span>สิ้นสุด: <b className="text-foreground">{thDateShort(c.endDate)}</b></span>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteConfirm(c.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 rounded-lg transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>ลบสัญญา</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })()
            ) : (
                <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/40 space-y-3">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                    <h3 className="font-bold text-lg">ยังไม่มีสัญญาจ้าง</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        เริ่มสร้างสัญญาจ้างเหมางานแรกสำหรับโครงการของคุณ กำหนดงวดงาน และเริ่มเบิกจ่ายเข้าสู่ระบบรายจ่ายได้ทันที
                    </p>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow text-sm"
                    >
                        <Plus className="w-4 h-4" /> สร้างสัญญาใหม่
                    </button>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────────────────────── */}
            {/* CONTRACTS LIST (BBSPM Rows) */}
            {/* ───────────────────────────────────────────────────────────────────────────── */}
            <div className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">รายการสัญญาทั้งหมด</h2>
                        <p className="text-xs text-muted-foreground">คลิก "ดูรายละเอียด" เพื่อเปิดและจัดการงวดงาน</p>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search input */}
                        <div className="relative min-w-[180px]">
                            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาสัญญา, ช่าง, โครงการ..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Status filter */}
                        <div className="flex p-0.5 rounded-lg bg-muted border border-border text-xs">
                            <button
                                onClick={() => setFilterStatus("all")}
                                className={cn(
                                    "px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5",
                                    filterStatus === "all" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                                )}
                            >
                                <span>ทั้งหมด</span>
                                <span className="text-[10px] opacity-75 font-mono">({nonArchivedContracts.length})</span>
                            </button>
                            <button
                                onClick={() => setFilterStatus("active")}
                                className={cn(
                                    "px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5",
                                    filterStatus === "active" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                                )}
                            >
                                <span>ดำเนินการ</span>
                                <span className="text-[10px] opacity-75 font-mono">({activeContracts.length})</span>
                            </button>
                            <button
                                onClick={() => setFilterStatus("completed")}
                                className={cn(
                                    "px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5",
                                    filterStatus === "completed" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                                )}
                            >
                                <span>จบสัญญา</span>
                                <span className="text-[10px] opacity-75 font-mono">({completedContracts.length})</span>
                            </button>
                            <button
                                onClick={() => setFilterStatus("archived")}
                                className={cn(
                                    "px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5",
                                    filterStatus === "archived" ? "bg-background text-amber-700 dark:text-amber-300 shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                                )}
                                title="คลังเก็บสัญญาถาวร (ซ่อนจากทั้งหมด)"
                            >
                                <Archive className="w-3 h-3" />
                                <span>คลังเก็บ</span>
                                <span className="text-[10px] opacity-75 font-mono">({archivedContracts.length})</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Archive info banner when viewing archived tab */}
                {filterStatus === "archived" && (
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>
                                <b>คลังเก็บสัญญาถาวร (Archive):</b> สัญญาในหน้านี้จะไม่แสดงในรายการ <b>"ทั้งหมด"</b> คุณสามารถกด <b>กู้คืน</b> เพื่อนำกลับมา หรือจัดการได้ตามปกติ
                            </span>
                        </div>
                        <span className="font-semibold text-right shrink-0">{archivedContracts.length} สัญญาในคลังเก็บ</span>
                    </div>
                )}

                {/* Rows list */}
                <div className="space-y-2">
                    {filteredContracts.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card/40 space-y-2">
                            {filterStatus === "archived" ? (
                                <>
                                    <Archive className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                                    <p className="text-sm font-medium text-muted-foreground">ไม่มีสัญญาในคลังเก็บถาวร</p>
                                    <p className="text-xs text-muted-foreground">คุณสามารถกดปุ่ม "เก็บถาวร" ที่รายการสัญญาเพื่อย้ายมาเก็บที่นี่ได้</p>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                                    <p className="text-sm font-medium text-muted-foreground">ไม่พบรายการสัญญาที่ตรงกับเงื่อนไข</p>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredContracts.map(c => {
                            const project = projects.find(p => p.id === c.projectId)
                            const worker = workers.find(w => w.id === c.workerId)
                            const stats = getContractStats(c)
                            const isCompleted = c.status === "Completed"
                            const isSelected = activeContract?.id === c.id
                            const docNo = c.documentNumber || `CT-${c.id.slice(0, 8)}`

                            return (
                                <div
                                    key={c.id}
                                    className={cn(
                                        "rounded-xl border transition-all bg-card hover:border-primary/40",
                                        isSelected ? "border-primary/60 ring-1 ring-primary/30 shadow-md" : "border-border/80"
                                    )}
                                >
                                    <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        {/* Left Info */}
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                                                {docNo}
                                            </span>
                                            {worker && (
                                                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                                                    ช่าง: {worker.name}
                                                </span>
                                            )}

                                            {c.isArchived ? (
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0 flex items-center gap-1">
                                                    <Archive className="w-3 h-3" />
                                                    คลังเก็บถาวร
                                                </span>
                                            ) : (
                                                <span
                                                    className={cn(
                                                        "px-2.5 py-0.5 rounded text-xs font-semibold border shrink-0",
                                                        isCompleted
                                                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                                            : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                                    )}
                                                >
                                                    {isCompleted ? "จบสัญญา" : "กำลังดำเนินการ"}
                                                </span>
                                            )}

                                            <span className="font-bold text-sm text-foreground truncate ml-1">
                                                {c.title || DEFAULT_CONTRACT_TITLE}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                • โครงการ: {project?.name || "ไม่ระบุ"}
                                            </span>
                                        </div>

                                        {/* Middle & Right: Amounts + Actions */}
                                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                                            <div className="flex items-center gap-4 text-xs">
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground block">มูลค่าจ้าง</span>
                                                    <span className="font-bold tabular-nums text-foreground">{fmtBaht(stats.total)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground block">งวดงาน</span>
                                                    <span className="font-semibold text-foreground">
                                                        {stats.paidInstallments}/{stats.installmentCount} งวดจ่ายแล้ว
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground block">จ่ายแล้ว</span>
                                                    <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                        {fmtBaht(stats.drawn)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 ml-auto">
                                                {/* Close or Reopen Quick Action */}
                                                {isCompleted ? (
                                                    <button
                                                        onClick={() => handleInitiateCloseContract(c)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted text-muted-foreground transition active:scale-95"
                                                        title="เปิดสัญญาอีกครั้ง (กำลังดำเนินการ)"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span className="hidden lg:inline">เปิดสัญญา</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleInitiateCloseContract(c)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95"
                                                        title="จบสัญญา (ตัดยอดคงเหลือหากยังจ่ายไม่ครบ)"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span className="hidden lg:inline">จบสัญญา</span>
                                                    </button>
                                                )}

                                                {/* Archive / Unarchive Action */}
                                                {c.isArchived ? (
                                                    <button
                                                        onClick={() => handleUnarchiveContract(c)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition active:scale-95"
                                                        title="กู้คืนสัญญาให้ออกจากคลังเก็บ"
                                                    >
                                                        <ArchiveRestore className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">กู้คืน</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleArchiveContract(c)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition active:scale-95"
                                                        title="ย้ายสัญญาไปที่คลังเก็บถาวร (Archive) - ไม่แสดงใน 'ทั้งหมด'"
                                                    >
                                                        <Archive className="w-3.5 h-3.5" />
                                                        <span className="hidden xl:inline">เก็บถาวร</span>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setPreviewContract(c)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition"
                                                    title="ดูตัวอย่าง / พิมพ์"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">ดูตัวอย่าง / พิมพ์</span>
                                                </button>

                                                <button
                                                    onClick={() => handleEdit(c)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition"
                                                    title="แก้ไข"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">แก้ไข</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedContractId(isSelected ? null : c.id)
                                                        window.scrollTo({ top: 0, behavior: "smooth" })
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition",
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground shadow"
                                                            : "bg-primary/10 text-primary hover:bg-primary/20"
                                                    )}
                                                >
                                                    <span>
                                                        {isSelected ? "ซ่อนรายละเอียด" : `ดูรายละเอียด (${stats.installmentCount} งวด)`}
                                                    </span>
                                                    {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
        </div>
    )
}
