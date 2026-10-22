"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useProjects, Contract, ContractInstallment, ContractDraw } from "@/context/project-context"
import { useFinance } from "@/context/finance-context"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import { ContractPreviewDialog } from "@/components/contracts/contract-preview-dialog"
import { PaymentVoucherDialog } from "@/components/contracts/payment-voucher-dialog"
import { DrawInstallmentDialog } from "@/components/contracts/draw-installment-dialog"
import { ContractCard } from "@/components/contracts/contract-card"
import { ContractDetailView } from "@/components/contracts/contract-detail-view"
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
    RotateCcw,
    FolderKanban,
    User2,
    Check,
    Calendar,
    Archive,
    ArchiveRestore,
    AlertTriangle,
    LayoutGrid,
    LayoutList,
    Wallet,
    Layers,
    AlertCircle
} from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    fmtBaht,
    thDateShort,
    getContractStats,
    DEFAULT_CONTRACT_TITLE
} from "@/lib/contract-utils"

function ContractsContent() {
    const { contracts, projects, workers, deleteContract, updateContract, archiveContract, unarchiveContract } = useProjects()
    const { cancelDraw, markDrawAsPaid } = useFinance()
    const { t } = useTranslation()
    const searchParams = useSearchParams()

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
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // Sync selected contract with URL ?id= parameter
    useEffect(() => {
        const id = searchParams.get("id")
        if (id) {
            setSelectedContractId(id)
        } else {
            setSelectedContractId(null)
        }
    }, [searchParams])

    const handleSelectContract = (id: string) => {
        setSelectedContractId(id)
        const params = new URLSearchParams(window.location.search)
        params.set("id", id)
        window.history.pushState(null, "", `?${params.toString()}`)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleBackToOverview = () => {
        setSelectedContractId(null)
        const params = new URLSearchParams(window.location.search)
        params.delete("id")
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
        window.history.pushState(null, "", newUrl)
    }

    // Keyboard ESC to go back to overview if viewing sub-page
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && selectedContractId) {
                handleBackToOverview()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedContractId])

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

    // Active selected contract for detail sub-page view
    const selectedContract = useMemo(() => {
        if (!selectedContractId) return null
        return contracts.find(c => c.id === selectedContractId && !c.isDeleted) || null
    }, [selectedContractId, contracts])

    // Aggregated KPI stats across all non-archived contracts
    const overviewStats = useMemo(() => {
        let totalValue = 0
        let totalDrawn = 0
        let activeValue = 0
        let activeCount = 0

        nonArchivedContracts.forEach(c => {
            const stats = getContractStats(c)
            totalValue += stats.total
            totalDrawn += stats.drawn
            if (c.status !== "Completed") {
                activeCount++
                activeValue += stats.total
            }
        })

        const totalRemaining = Math.max(0, totalValue - totalDrawn)
        const overallProgress = totalValue > 0 ? Math.round((totalDrawn / totalValue) * 100) : 0

        return {
            totalContracts: nonArchivedContracts.length,
            activeCount,
            completedCount: nonArchivedContracts.length - activeCount,
            archivedCount: archivedContracts.length,
            totalValue,
            totalDrawn,
            totalRemaining,
            overallProgress
        }
    }, [nonArchivedContracts, archivedContracts])

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

    // Archive / Unarchive Contract
    const handleArchiveContract = async (contract: Contract) => {
        const docNo = contract.documentNumber || `CT-${contract.id.slice(0, 8)}`
        if (!confirm(`ต้องการย้ายสัญญา ${docNo} ไปที่คลังเก็บถาวร (Archive) ใช่หรือไม่?\nสัญญาจะไม่แสดงในรายการ 'ทั้งหมด'`)) return
        try {
            await archiveContract(contract.id)
            if (selectedContractId === contract.id) handleBackToOverview()
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
                                className="flex-1 py-2.5 rounded-xl font-medium hover:bg-muted transition-colors text-sm cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => {
                                    if (showDeleteConfirm) {
                                        deleteContract(showDeleteConfirm)
                                        if (selectedContractId === showDeleteConfirm) handleBackToOverview()
                                        setShowDeleteConfirm(null)
                                        toast.success("ย้ายสัญญาไปที่ถังขยะแล้ว")
                                    }
                                }}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 text-sm cursor-pointer"
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
                                className="flex-1 py-2.5 rounded-xl font-medium border border-border hover:bg-muted text-foreground transition text-xs sm:text-sm text-center cursor-pointer"
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
                                className="flex-1 py-2.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition text-xs sm:text-sm text-center cursor-pointer"
                            >
                                ยืนยันจบสัญญา (ตัดยอด)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────────────────────── */}
            {/* VIEW MODE: EITHER SUB-PAGE DETAIL VIEW OR OVERVIEW CARDS VIEW                */}
            {/* ───────────────────────────────────────────────────────────────────────────── */}
            {selectedContract ? (
                /* Sub-page Detail View (หน้าย่อยรายละเอียดสัญญา) */
                <ContractDetailView
                    contract={selectedContract}
                    project={projects.find(p => p.id === selectedContract.projectId)}
                    worker={workers.find(w => w.id === selectedContract.workerId)}
                    allContracts={filteredContracts}
                    onBack={handleBackToOverview}
                    onSelectContract={handleSelectContract}
                    onEdit={handleEdit}
                    onPreview={setPreviewContract}
                    onToggleStatus={handleInitiateCloseContract}
                    onArchive={handleArchiveContract}
                    onUnarchive={handleUnarchiveContract}
                    onDelete={setShowDeleteConfirm}
                    onOpenVoucher={setVoucherData}
                    onOpenDrawTarget={setDrawTarget}
                    onCancelDraw={handleCancelDraw}
                    onMarkPaidQuick={handleMarkPaidQuick}
                />
            ) : (
                /* Overview View: Cards Grid of Contracts (เปิดมาเห็นเป็น Card แต่ละอัน) */
                <div className="space-y-6">
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
                                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-foreground text-xs sm:text-sm transition-all shadow-2xs"
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
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>สร้างสัญญาใหม่</span>
                            </button>
                        </div>
                    </div>

                    {/* Executive KPI Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* Total Contracts */}
                        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">สัญญาทั้งหมด</span>
                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                                    <FileText className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
                                    {overviewStats.totalContracts}
                                </span>
                                <span className="text-xs text-muted-foreground">สัญญา</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                <span>กำลังดำเนินการ {overviewStats.activeCount}</span>
                                <span className="text-muted-foreground/60">•</span>
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                <span>จบแล้ว {overviewStats.completedCount}</span>
                            </div>
                        </div>

                        {/* Total Contract Value */}
                        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">มูลค่าว่าจ้างรวม</span>
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <Wallet className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums block truncate">
                                    {fmtBaht(overviewStats.totalValue)}
                                </span>
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground truncate">
                                จากสัญญางานทั้งหมดในระบบ
                            </p>
                        </div>

                        {/* Paid Amount & Progress */}
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 shadow-xs relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    จ่ายตามงวดแล้ว
                                </span>
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums block truncate">
                                    {fmtBaht(overviewStats.totalDrawn)}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                                <span>ความคืบหน้ารวม</span>
                                <span className="font-bold tabular-nums">{overviewStats.overallProgress}%</span>
                            </div>
                        </div>

                        {/* Remaining to be drawn */}
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 shadow-xs relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                    ยอดคงเหลือรอเบิก
                                </span>
                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums block truncate">
                                    {fmtBaht(overviewStats.totalRemaining)}
                                </span>
                            </div>
                            <p className="mt-2 text-[11px] text-amber-700/80 dark:text-amber-300/80 truncate">
                                ยอดที่ยังไม่ได้เบิกจ่ายครบตามงวด
                            </p>
                        </div>
                    </div>

                    {/* Filter, Search & Layout Controls Bar */}
                    <div className="p-3 sm:p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Search input */}
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="ค้นหาสัญญา, ช่าง, โครงการ..."
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                />
                            </div>

                            {/* Status Filter Tabs & Layout Switcher */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Status tabs */}
                                <div className="flex p-0.5 rounded-xl bg-muted/80 border border-border text-xs">
                                    <button
                                        onClick={() => setFilterStatus("all")}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer",
                                            filterStatus === "all" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span>ทั้งหมด</span>
                                        <span className="text-[10px] opacity-75 font-mono">({nonArchivedContracts.length})</span>
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus("active")}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer",
                                            filterStatus === "active" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span>ดำเนินการ</span>
                                        <span className="text-[10px] opacity-75 font-mono">({activeContracts.length})</span>
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus("completed")}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer",
                                            filterStatus === "completed" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span>จบสัญญา</span>
                                        <span className="text-[10px] opacity-75 font-mono">({completedContracts.length})</span>
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus("archived")}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer",
                                            filterStatus === "archived" ? "bg-background text-amber-700 dark:text-amber-300 shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="คลังเก็บสัญญาถาวร (ซ่อนจากทั้งหมด)"
                                    >
                                        <Archive className="w-3.5 h-3.5" />
                                        <span>คลังเก็บ</span>
                                        <span className="text-[10px] opacity-75 font-mono">({archivedContracts.length})</span>
                                    </button>
                                </div>

                                {/* View Mode Toggle (Grid Cards vs Compact List) */}
                                <div className="flex p-0.5 rounded-xl bg-muted/80 border border-border">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={cn(
                                            "p-1.5 rounded-lg transition cursor-pointer",
                                            viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="มุมมองการ์ด (Cards)"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={cn(
                                            "p-1.5 rounded-lg transition cursor-pointer",
                                            viewMode === "list" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="มุมมองตารางรายการ (List)"
                                    >
                                        <LayoutList className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Project Filter (if multiple projects exist) */}
                        {projects.length > 0 && (
                            <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-xs">
                                <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                                    <FolderKanban className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>กรองตามโครงการ:</span>
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setFilterProjectId("all")}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-xs transition cursor-pointer",
                                            filterProjectId === "all"
                                                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                                                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        ทุกโครงการ
                                    </button>
                                    {projects.map(p => {
                                        const count = nonArchivedContracts.filter(c => c.projectId === p.id).length
                                        if (count === 0 && filterProjectId !== p.id) return null
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setFilterProjectId(p.id)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer",
                                                    filterProjectId === p.id
                                                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                )}
                                            >
                                                <span className="truncate max-w-[140px]">{p.name}</span>
                                                <span className="text-[10px] opacity-75 font-mono">({count})</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Archive tab banner */}
                    {filterStatus === "archived" && (
                        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>
                                    <b>คลังเก็บสัญญาถาวร (Archive):</b> สัญญาในหน้านี้จะไม่แสดงในรายการ <b>"ทั้งหมด"</b> คุณสามารถกด <b>กู้คืน</b> เพื่อนำกลับมา หรือดูรายละเอียดได้ตามปกติ
                                </span>
                            </div>
                            <span className="font-semibold text-right shrink-0">{archivedContracts.length} สัญญาในคลังเก็บ</span>
                        </div>
                    )}

                    {/* Contracts Render Section: Grid or List */}
                    {filteredContracts.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/40 space-y-3">
                            {filterStatus === "archived" ? (
                                <>
                                    <Archive className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
                                    <h3 className="font-bold text-lg">ไม่มีสัญญาในคลังเก็บถาวร</h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        คุณสามารถกดปุ่ม "เก็บถาวร" ที่หน้าสัญญาเพื่อย้ายสัญญาที่จบงานแล้วหรือไม่ได้ใช้งานมาเก็บไว้ที่นี่ได้
                                    </p>
                                </>
                            ) : searchQuery || filterProjectId !== "all" || filterStatus !== "all" ? (
                                <>
                                    <Search className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
                                    <h3 className="font-bold text-lg">ไม่พบสัญญาที่ตรงกับเงื่อนไข</h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูรายการสัญญาอื่นๆ
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSearchQuery("")
                                            setFilterStatus("all")
                                            setFilterProjectId("all")
                                        }}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted transition cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>ล้างตัวกรองทั้งหมด</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
                                    <h3 className="font-bold text-lg">ยังไม่มีสัญญาจ้าง</h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        เริ่มสร้างสัญญาจ้างเหมางานแรกสำหรับโครงการของคุณ กำหนดงวดงาน และเริ่มเบิกจ่ายเข้าสู่ระบบรายจ่ายได้ทันที
                                    </p>
                                    <button
                                        onClick={() => setIsAddOpen(true)}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow text-sm cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" /> สร้างสัญญาใหม่
                                    </button>
                                </>
                            )}
                        </div>
                    ) : viewMode === "grid" ? (
                        /* CARDS GRID VIEW */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                            {filteredContracts.map(c => {
                                const project = projects.find(p => p.id === c.projectId)
                                const worker = workers.find(w => w.id === c.workerId)
                                return (
                                    <ContractCard
                                        key={c.id}
                                        contract={c}
                                        project={project}
                                        worker={worker}
                                        onClick={() => handleSelectContract(c.id)}
                                        onPreview={() => setPreviewContract(c)}
                                        onEdit={() => handleEdit(c)}
                                        onArchive={() => handleArchiveContract(c)}
                                        onUnarchive={() => handleUnarchiveContract(c)}
                                    />
                                )
                            })}
                        </div>
                    ) : (
                        /* COMPACT ROWS LIST VIEW */
                        <div className="space-y-2">
                            {filteredContracts.map(c => {
                                const project = projects.find(p => p.id === c.projectId)
                                const worker = workers.find(w => w.id === c.workerId)
                                const stats = getContractStats(c)
                                const isCompleted = c.status === "Completed"
                                const docNo = c.documentNumber || `CT-${c.id.slice(0, 8)}`

                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => handleSelectContract(c.id)}
                                        className="rounded-xl border border-border/80 bg-card hover:border-primary/50 transition-all p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group hover:shadow-md"
                                    >
                                        {/* Left Info */}
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0 font-mono">
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

                                            <span className="font-bold text-sm text-foreground truncate ml-1 group-hover:text-primary transition-colors">
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
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        setPreviewContract(c)
                                                    }}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition cursor-pointer"
                                                    title="ดูตัวอย่าง / พิมพ์"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">ดูตัวอย่าง</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        handleEdit(c)
                                                    }}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition cursor-pointer"
                                                    title="แก้ไข"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">แก้ไข</span>
                                                </button>

                                                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                                                    <span>ดูรายละเอียด ({stats.installmentCount} งวด)</span>
                                                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function ContractsPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-muted-foreground">กำลังโหลด...</div>}>
            <ContractsContent />
        </Suspense>
    )
}
