"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Receipt,
    CreditCard,
    FileText,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    User,
    FolderKanban,
    Eye,
    Filter,
    Layers,
    BadgePercent
} from "lucide-react"
import { useProjects, Contract, ContractInstallment, ContractDraw } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { cn } from "@/lib/utils"
import { fmtBaht, fmtNum } from "@/lib/contract-utils"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import AddExpenseDialog from "@/components/expenses/add-expense-dialog"

export interface CalendarSectionItem {
    id: string
    title: string
    date: string // yyyy-mm-dd
    type: "voucher" | "installment" | "contract"
    subType?: "start" | "end" | "draw" | "milestone"
    projectId?: string
    projectName?: string
    amount?: number
    status?: string // Paid, Pending, Active, Completed, etc.
    workerId?: string
    workerName?: string
    voucherNumber?: string
    installmentNumber?: string | number
    contractNumber?: string
    contractTitle?: string
    rawContract?: Contract
    rawInstallment?: ContractInstallment
    rawDraw?: ContractDraw
}

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

const THAI_DAY_NAMES = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

const padZero = (n: number) => String(n).padStart(2, "0")

export function OrganizationCalendarSection() {
    const router = useRouter()
    const { contracts, projects, workers, currentUser, currentTeam } = useProjects()
    const { locale } = useTranslation()

    // Manager / Admin / Owner permission check
    const isManagerOrAbove = useMemo(() => {
        const uRole = currentUser?.role
        const tRole = currentTeam?.role
        return (
            uRole === "Manager" || uRole === "Admin" || uRole === "Owner" ||
            tRole === "Manager" || tRole === "Admin" || tRole === "Owner"
        )
    }, [currentUser, currentTeam])

    // Current navigation month state
    const today = useMemo(() => new Date(), [])
    const todayStr = useMemo(() => {
        return `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`
    }, [today])

    const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()) // 0 - 11
    const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr)
    const [typeFilter, setTypeFilter] = useState<"all" | "voucher" | "installment" | "contract">("all")

    // Dialog state for adding contract / expense on clicked date
    const [isAddContractOpen, setIsAddContractOpen] = useState(false)
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)

    // Navigate Month
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(y => y - 1)
        } else {
            setCurrentMonth(m => m - 1)
        }
    }

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(y => y + 1)
        } else {
            setCurrentMonth(m => m + 1)
        }
    }

    const handleGoToday = () => {
        setCurrentYear(today.getFullYear())
        setCurrentMonth(today.getMonth())
        setSelectedDateStr(todayStr)
    }

    // Build unified events list strictly focused on Contracts, Installment Milestones, and Payment Vouchers
    const allItems: CalendarSectionItem[] = useMemo(() => {
        const items: CalendarSectionItem[] = []

        contracts.forEach(contract => {
            if (contract.isArchived || contract.isDeleted) return

            const proj = projects.find(p => p.id === contract.projectId)
            const worker = workers.find(w => w.id === contract.workerId)
            const projName = proj?.name || "โครงการทั่วไป"
            const workerName = worker?.name || "ผู้รับเหมา/ช่าง"
            const isStandalone = Boolean(
                contract.isStandaloneVoucher ||
                contract.contractType === "ใบเบิกงวด (ไม่มีสัญญา)" ||
                contract.documentNumber?.startsWith("PV")
            )

            // 1. Contract Start & End Dates (ONLY for real multi-milestone contracts, NOT standalone single vouchers)
            if (!isStandalone) {
                if (contract.startDate) {
                    const sDate = contract.startDate.split("T")[0]
                    if (sDate) {
                        items.push({
                            id: `contract-start-${contract.id}`,
                            title: `เริ่มสัญญา: ${contract.title}`,
                            date: sDate,
                            type: "contract",
                            subType: "start",
                            projectId: contract.projectId,
                            projectName: projName,
                            amount: contract.totalAmount,
                            status: contract.status || "Active",
                            workerId: contract.workerId,
                            workerName,
                            contractNumber: contract.documentNumber,
                            contractTitle: contract.title,
                            rawContract: contract
                        })
                    }
                }

                if (contract.endDate && contract.endDate !== contract.startDate) {
                    const eDate = contract.endDate.split("T")[0]
                    if (eDate) {
                        items.push({
                            id: `contract-end-${contract.id}`,
                            title: `สิ้นสุดสัญญา: ${contract.title}`,
                            date: eDate,
                            type: "contract",
                            subType: "end",
                            projectId: contract.projectId,
                            projectName: projName,
                            amount: contract.totalAmount,
                            status: contract.status || "Active",
                            workerId: contract.workerId,
                            workerName,
                            contractNumber: contract.documentNumber,
                            contractTitle: contract.title,
                            rawContract: contract
                        })
                    }
                }
            }

            // 2. Installments and Payment Vouchers (Draws)
            contract.installments?.forEach((inst, idx) => {
                const instLabel = idx + 1
                const hasDraws = Boolean(inst.draws && inst.draws.length > 0)

                // 2.1 Payment Vouchers / Draws (The actual disbursement records)
                if (hasDraws) {
                    inst.draws!.forEach(draw => {
                        const targetDate = (draw.paymentDate || draw.date || "").split("T")[0]
                        if (!targetDate) return

                        const isPaid = draw.expenseStatus === "Paid"
                        items.push({
                            id: `draw-${contract.id}-${inst.id}-${draw.id}`,
                            title: isStandalone 
                                ? `ใบเบิกงวด ${draw.voucherNumber || contract.documentNumber || ""}: ${contract.title}`
                                : `ใบเบิกงวด ${draw.voucherNumber || draw.label || instLabel}: ${inst.description || contract.title}`,
                            date: targetDate,
                            type: "voucher",
                            subType: "draw",
                            projectId: contract.projectId,
                            projectName: projName,
                            amount: draw.amount,
                            status: isPaid ? "Paid" : "Pending",
                            workerId: contract.workerId,
                            workerName,
                            voucherNumber: draw.voucherNumber || contract.documentNumber,
                            installmentNumber: draw.label || instLabel,
                            contractNumber: contract.documentNumber,
                            contractTitle: contract.title,
                            rawContract: contract,
                            rawInstallment: inst,
                            rawDraw: draw
                        })
                    })
                }

                // 2.2 Scheduled Milestone (ONLY if this installment hasn't been fully drawn yet, and NOT standalone voucher)
                if (!isStandalone && inst.dueDate) {
                    const targetDueDate = inst.dueDate.split("T")[0]
                    const totalDrawn = (inst.draws || []).reduce((sum, d) => sum + (d.amount || 0), 0)
                    const remainingAmount = Math.max(0, (inst.amount || 0) - totalDrawn)

                    // Only show milestone if there is remaining amount waiting to be drawn
                    if (targetDueDate && remainingAmount > 0) {
                        items.push({
                            id: `milestone-${contract.id}-${inst.id}`,
                            title: `งวดที่ ${instLabel}: ${inst.description || "ส่งมอบงาน"} (รอเบิก)`,
                            date: targetDueDate,
                            type: "installment",
                            subType: "milestone",
                            projectId: contract.projectId,
                            projectName: projName,
                            amount: remainingAmount,
                            status: inst.status || "Pending",
                            workerId: contract.workerId,
                            workerName,
                            installmentNumber: instLabel,
                            contractNumber: contract.documentNumber,
                            contractTitle: contract.title,
                            rawContract: contract,
                            rawInstallment: inst
                        })
                    }
                }
            })
        })

        return items
    }, [contracts, projects, workers])

    // Filter items based on active tab
    const filteredItems = useMemo(() => {
        if (typeFilter === "all") return allItems
        if (typeFilter === "voucher") return allItems.filter(i => i.type === "voucher")
        if (typeFilter === "installment") return allItems.filter(i => i.type === "installment")
        if (typeFilter === "contract") return allItems.filter(i => i.type === "contract")
        return allItems
    }, [allItems, typeFilter])

    // Group items by date string
    const itemsByDate = useMemo(() => {
        const map = new Map<string, CalendarSectionItem[]>()
        filteredItems.forEach(item => {
            const list = map.get(item.date) || []
            list.push(item)
            map.set(item.date, list)
        })
        return map
    }, [filteredItems])

    // Month summary calculations (for the current displayed month)
    const monthStats = useMemo(() => {
        const prefix = `${currentYear}-${padZero(currentMonth + 1)}`
        const monthItems = allItems.filter(i => i.date.startsWith(prefix))

        // Vouchers
        const voucherItems = monthItems.filter(i => i.type === "voucher")
        const voucherCount = voucherItems.length
        const totalVoucherAmount = voucherItems.reduce((acc, curr) => acc + (curr.amount || 0), 0)
        const paidVouchers = voucherItems.filter(v => v.status === "Paid")
        const paidAmount = paidVouchers.reduce((acc, curr) => acc + (curr.amount || 0), 0)
        const pendingVouchers = voucherItems.filter(v => v.status !== "Paid")
        const pendingAmount = pendingVouchers.reduce((acc, curr) => acc + (curr.amount || 0), 0)

        // Installment Milestones
        const milestoneItems = monthItems.filter(i => i.type === "installment")
        const milestoneCount = milestoneItems.length
        const totalMilestoneAmount = milestoneItems.reduce((acc, curr) => acc + (curr.amount || 0), 0)

        // Contracts
        const contractItems = monthItems.filter(i => i.type === "contract")
        const uniqueContractIds = new Set(contractItems.map(c => c.rawContract?.id).filter(Boolean))
        const activeContractsCount = uniqueContractIds.size

        return {
            voucherCount,
            totalVoucherAmount,
            paidAmount,
            pendingAmount,
            paidCount: paidVouchers.length,
            pendingCount: pendingVouchers.length,
            milestoneCount,
            totalMilestoneAmount,
            activeContractsCount
        }
    }, [allItems, currentYear, currentMonth])

    // Generate Calendar Grid Days
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
        const daysInMonth = lastDayOfMonth.getDate()
        const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun, 6 = Sat

        const days: Array<{
            dateStr: string
            dayNumber: number
            isCurrentMonth: boolean
            isToday: boolean
            isSelected: boolean
            items: CalendarSectionItem[]
        }> = []

        // Previous month padding
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
            const dStr = `${prevYear}-${padZero(prevMonth + 1)}-${padZero(dayNum)}`
            days.push({
                dateStr: dStr,
                dayNumber: dayNum,
                isCurrentMonth: false,
                isToday: dStr === todayStr,
                isSelected: dStr === selectedDateStr,
                items: itemsByDate.get(dStr) || []
            })
        }

        // Current month days
        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const dStr = `${currentYear}-${padZero(currentMonth + 1)}-${padZero(dayNum)}`
            days.push({
                dateStr: dStr,
                dayNumber: dayNum,
                isCurrentMonth: true,
                isToday: dStr === todayStr,
                isSelected: dStr === selectedDateStr,
                items: itemsByDate.get(dStr) || []
            })
        }

        // Next month padding to fill complete weeks
        const remainingCells = (7 - (days.length % 7)) % 7
        for (let i = 1; i <= remainingCells; i++) {
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
            const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
            const dStr = `${nextYear}-${padZero(nextMonth + 1)}-${padZero(i)}`
            days.push({
                dateStr: dStr,
                dayNumber: i,
                isCurrentMonth: false,
                isToday: dStr === todayStr,
                isSelected: dStr === selectedDateStr,
                items: itemsByDate.get(dStr) || []
            })
        }

        return days
    }, [currentYear, currentMonth, todayStr, selectedDateStr, itemsByDate])

    // Items for currently selected date
    const selectedDateItems = useMemo(() => {
        return itemsByDate.get(selectedDateStr) || []
    }, [itemsByDate, selectedDateStr])

    // Format selected date nicely in Thai
    const formattedSelectedDate = useMemo(() => {
        if (!selectedDateStr) return ""
        const [y, m, d] = selectedDateStr.split("-").map(Number)
        const dateObj = new Date(y, m - 1, d)
        const dayName = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"][dateObj.getDay()]
        return `${dayName}ที่ ${d} ${THAI_MONTHS[m - 1]} ${y + 543}`
    }, [selectedDateStr])

    // Upcoming contract/voucher events this week
    const upcomingEvents = useMemo(() => {
        const todayT = new Date(todayStr).getTime()
        return allItems
            .filter(i => {
                const itemT = new Date(i.date).getTime()
                return itemT >= todayT && itemT <= todayT + (14 * 24 * 60 * 60 * 1000)
            })
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5)
    }, [allItems, todayStr])

    return (
        <section className="w-full relative rounded-3xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-xl overflow-hidden transition-all">
            {/* Ambient background glow accents */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-7 space-y-6">
                {/* ─────────────────────────────────────────────────────────────
                    1. SECTION HEADER
                   ───────────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-sm shadow-emerald-500/10">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                                    ปฏิทินสัญญาและเบิกงวด (Contracts & Payment Calendar)
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {THAI_MONTHS[currentMonth]} {currentYear + 543}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                ภาพรวมสัญญาจ้าง กำหนดการส่งมอบงวดงาน และกำหนดการจ่ายเงินใบเบิกงวดผู้รับเหมา
                            </p>
                        </div>
                    </div>

                    {/* Actions: Navigation & Direct Link */}
                    <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                        {/* Month Steppers */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/70 border border-border">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition"
                                title="เดือนก่อนหน้า"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleGoToday}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-background text-foreground transition"
                            >
                                วันนี้
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition"
                                title="เดือนถัดไป"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Filter Tabs (เน้นสัญญาและใบเบิกงวด) */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/70 border border-border text-xs">
                            <button
                                type="button"
                                onClick={() => setTypeFilter("all")}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg font-semibold transition",
                                    typeFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                ทั้งหมด
                            </button>
                            <button
                                type="button"
                                onClick={() => setTypeFilter("voucher")}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5",
                                    typeFilter === "voucher" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                                <span>ใบเบิกงวด</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTypeFilter("installment")}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5",
                                    typeFilter === "installment" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Layers className="w-3.5 h-3.5 text-blue-500" />
                                <span>งวดสัญญา</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTypeFilter("contract")}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5",
                                    typeFilter === "contract" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <FileText className="w-3.5 h-3.5 text-purple-500" />
                                <span>สัญญาจ้าง</span>
                            </button>
                        </div>

                        {/* View Full Calendar Page */}
                        <Link
                            href="/calendar"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition shadow-xs"
                            title="เปิดหน้าปฏิทินเต็มจอ"
                        >
                            <span>ปฏิทินเต็ม</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    2. FINANCIAL & CONTRACT SUMMARY STATS BAR
                   ───────────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* Card 1: ยอดเบิกจ่ายเดือนนี้ */}
                    <div className="p-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                            <span className="text-[11px] text-muted-foreground block truncate">ยอดเบิกจ่ายเดือนนี้</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm truncate block font-mono">
                                {isManagerOrAbove ? fmtBaht(monthStats.totalVoucherAmount) : "สำหรับฝ่ายบริหาร"}
                            </span>
                        </div>
                    </div>

                    {/* Card 2: ใบเบิกงวดในเดือน */}
                    <div className="p-3.5 rounded-2xl border border-teal-500/20 bg-teal-500/5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
                            <Receipt className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                            <span className="text-[11px] text-muted-foreground block truncate">ใบเบิกงวดในเดือน</span>
                            <span className="font-bold text-foreground text-sm truncate block">
                                {monthStats.voucherCount} ใบ
                                {monthStats.paidCount > 0 && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1 font-normal">
                                        (จ่ายแล้ว {monthStats.paidCount})
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Card 3: งวดงานครบกำหนด */}
                    <div className="p-3.5 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                            <span className="text-[11px] text-muted-foreground block truncate">งวดครบกำหนดส่งมอบ</span>
                            <span className="font-bold text-foreground text-sm truncate block">
                                {monthStats.milestoneCount} งวด
                                {isManagerOrAbove && monthStats.totalMilestoneAmount > 0 && (
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 ml-1 font-mono font-normal">
                                        ({fmtNum(monthStats.totalMilestoneAmount)})
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Card 4: สัญญาจ้างที่เกี่ยวข้อง */}
                    <div className="p-3.5 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                            <span className="text-[11px] text-muted-foreground block truncate">สัญญาเริ่ม/สิ้นสุดเดือนนี้</span>
                            <span className="font-bold text-foreground text-sm truncate block">
                                {monthStats.activeContractsCount} สัญญา
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    3. MAIN BODY: SPLIT CALENDAR GRID (Left) + DAY AGENDA (Right)
                   ───────────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT (7/12): MONTH CALENDAR GRID */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-2">
                        {/* Day of Week Headers */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground pb-1">
                            {THAI_DAY_NAMES.map((name, i) => (
                                <div
                                    key={name}
                                    className={cn(
                                        "py-1.5 uppercase",
                                        i === 0 ? "text-rose-500" : i === 6 ? "text-indigo-400" : ""
                                    )}
                                >
                                    {name}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Day Cells */}
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                            {calendarDays.map(cell => {
                                const voucherItems = cell.items.filter(i => i.type === "voucher")
                                const milestoneItems = cell.items.filter(i => i.type === "installment")
                                const contractItems = cell.items.filter(i => i.type === "contract")

                                const hasEvents = cell.items.length > 0

                                return (
                                    <button
                                        key={cell.dateStr}
                                        type="button"
                                        onClick={() => setSelectedDateStr(cell.dateStr)}
                                        className={cn(
                                            "min-h-[76px] sm:min-h-[86px] p-1.5 sm:p-2 rounded-2xl border text-left transition-all flex flex-col justify-between group relative overflow-hidden",
                                            cell.isSelected
                                                ? "bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                                                : cell.isCurrentMonth
                                                    ? "bg-muted/30 hover:bg-muted/60 border-border/60 hover:border-border"
                                                    : "bg-muted/10 border-transparent text-muted-foreground/40 hover:bg-muted/20"
                                        )}
                                    >
                                        {/* Day Number Header */}
                                        <div className="flex items-center justify-between w-full">
                                            <span
                                                className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition",
                                                    cell.isToday
                                                        ? "bg-emerald-600 text-white shadow-xs font-black"
                                                        : cell.isSelected
                                                            ? "text-emerald-600 dark:text-emerald-400 font-black"
                                                            : cell.isCurrentMonth
                                                                ? "text-foreground"
                                                                : "text-muted-foreground/50"
                                                )}
                                            >
                                                {cell.dayNumber}
                                            </span>

                                            {/* Hover Quick Add indicator */}
                                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-500 transition p-0.5 rounded hover:bg-emerald-500/15">
                                                <Plus className="w-3 h-3" />
                                            </span>
                                        </div>

                                        {/* Events Preview inside Day Cell */}
                                        <div className="space-y-1 w-full mt-1">
                                            {/* 1. Payment Vouchers */}
                                            {voucherItems.slice(0, 1).map(v => (
                                                <div
                                                    key={v.id}
                                                    className={cn(
                                                        "px-1.5 py-0.5 rounded text-[9.5px] font-bold truncate flex items-center gap-1 shadow-2xs",
                                                        v.status === "Paid"
                                                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                                    )}
                                                    title={`ใบเบิก: ${v.title} ฿${(v.amount || 0).toLocaleString()}`}
                                                >
                                                    <CreditCard className="w-2.5 h-2.5 shrink-0" />
                                                    <span className="truncate">
                                                        {v.voucherNumber ? v.voucherNumber.replace(/^PV/, "") : `งวด ${v.installmentNumber}`}
                                                    </span>
                                                    {v.amount ? (
                                                        <span className="font-mono ml-auto">
                                                            ฿{Math.round(v.amount / 1000)}k
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ))}

                                            {/* 2. Installment Milestones (if no voucher or additional) */}
                                            {voucherItems.length === 0 && milestoneItems.slice(0, 1).map(m => (
                                                <div
                                                    key={m.id}
                                                    className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold truncate flex items-center gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25"
                                                    title={`ครบงวด: ${m.title}`}
                                                >
                                                    <Layers className="w-2.5 h-2.5 shrink-0 text-blue-500" />
                                                    <span className="truncate">งวด {m.installmentNumber}</span>
                                                </div>
                                            ))}

                                            {/* 3. Contract Start/End */}
                                            {voucherItems.length === 0 && milestoneItems.length === 0 && contractItems.slice(0, 1).map(c => (
                                                <div
                                                    key={c.id}
                                                    className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold truncate flex items-center gap-1 bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25"
                                                    title={c.title}
                                                >
                                                    <FileText className="w-2.5 h-2.5 shrink-0 text-purple-500" />
                                                    <span className="truncate">{c.contractTitle || "สัญญา"}</span>
                                                </div>
                                            ))}

                                            {/* Overflow badge if multiple items on that day */}
                                            {cell.items.length > 1 && (
                                                <span className="text-[9px] text-muted-foreground font-bold block pl-0.5">
                                                    +{cell.items.length - 1} รายการ
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* RIGHT (5/12): ACTIVE DAY AGENDA & QUICK ADD ACTIONS */}
                    <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-border bg-card/60 p-4 sm:p-5 space-y-4 shadow-sm">
                        {/* Selected Date Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    รายการประจำวัน
                                </span>
                                <h3 className="text-base font-bold text-foreground">
                                    {formattedSelectedDate}
                                </h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground">
                                {selectedDateItems.length} รายการ
                            </span>
                        </div>

                        {/* Quick Add Buttons on Selected Date (เน้นสัญญาและใบเบิกงวด) */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                                ดำเนินการในวันที่นี้:
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                                {/* Primary Action: New Payment Voucher */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.push(`/vouchers/new?date=${selectedDateStr}&paymentDate=${selectedDateStr}`)
                                    }}
                                    className="w-full p-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs group"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                                        <CreditCard className="w-3.5 h-3.5" />
                                    </div>
                                    <span>ออกใบเบิกงวด (Payment Voucher)</span>
                                </button>

                                {/* Secondary Actions: New Contract & Expense */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddContractOpen(true)}
                                        className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs group"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition">
                                            <FileText className="w-3.5 h-3.5" />
                                        </div>
                                        <span>สร้างสัญญา</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsAddExpenseOpen(true)}
                                        className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs group"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition">
                                            <Receipt className="w-3.5 h-3.5" />
                                        </div>
                                        <span>บันทึกจ่าย</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* List of Events on Selected Date */}
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                            {selectedDateItems.length > 0 ? (
                                selectedDateItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            if (item.type === "voucher") {
                                                router.push("/vouchers")
                                            } else if (item.rawContract?.id) {
                                                router.push(`/contracts?id=${item.rawContract.id}`)
                                            }
                                        }}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all text-xs cursor-pointer space-y-2",
                                            item.type === "voucher"
                                                ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/25"
                                                : item.type === "installment"
                                                    ? "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/25"
                                                    : "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/25"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 truncate">
                                                {item.type === "voucher" ? (
                                                    <span className="p-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                    </span>
                                                ) : item.type === "installment" ? (
                                                    <span className="p-1 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                                                        <Layers className="w-3.5 h-3.5" />
                                                    </span>
                                                ) : (
                                                    <span className="p-1 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                                <span className="font-bold text-foreground truncate">
                                                    {item.title}
                                                </span>
                                            </div>

                                            <span
                                                className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold shrink-0",
                                                    item.type === "contract"
                                                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                                        : item.type === "installment"
                                                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                            : item.status === "Paid"
                                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                )}
                                            >
                                                {item.type === "contract"
                                                    ? (item.subType === "start" ? "เริ่มสัญญา" : "สิ้นสุดสัญญา")
                                                    : item.type === "installment"
                                                        ? "รอเบิกงวด"
                                                        : (item.status === "Paid" ? "จ่ายแล้ว" : "รอจ่าย")
                                                }
                                            </span>
                                        </div>

                                        {/* Secondary Details */}
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                                            <div className="flex items-center gap-1 truncate max-w-[170px]">
                                                <FolderKanban className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{item.projectName}</span>
                                            </div>

                                            {item.amount ? (
                                                <span className={cn(
                                                    "font-bold font-mono",
                                                    item.type === "voucher"
                                                        ? (item.status === "Paid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")
                                                        : item.type === "installment"
                                                            ? "text-blue-600 dark:text-blue-400"
                                                            : "text-purple-600 dark:text-purple-400"
                                                )}>
                                                    {item.type === "contract" ? `มูลค่าสัญญา ${fmtBaht(item.amount)}` : fmtBaht(item.amount)}
                                                </span>
                                            ) : item.workerName ? (
                                                <span className="truncate max-w-[110px]">{item.workerName}</span>
                                            ) : null}
                                        </div>

                                        {item.workerName && item.amount && (
                                            <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                                                <User className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{item.workerName}</span>
                                                {item.contractNumber && (
                                                    <span className="ml-auto text-[10px] text-muted-foreground/70 font-mono">
                                                        {item.contractNumber}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2 text-muted-foreground">
                                    <Clock className="w-6 h-6 text-muted-foreground/50" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-foreground">
                                            ไม่มีกำหนดการในวันนี้
                                        </p>
                                        <p className="text-[11px]">
                                            คลิกปุ่มด้านบนเพื่อออกใบเบิกงวด หรือสร้างสัญญาจ้าง
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Upcoming Agenda if empty */}
                            {selectedDateItems.length === 0 && upcomingEvents.length > 0 && (
                                <div className="pt-2 border-t border-border/60 space-y-2">
                                    <span className="text-[11px] font-bold text-muted-foreground block">
                                        กำหนดการเร็วๆ นี้ (Next 14 Days):
                                    </span>
                                    <div className="space-y-1.5">
                                        {upcomingEvents.map(evt => (
                                            <div
                                                key={evt.id}
                                                onClick={() => setSelectedDateStr(evt.date)}
                                                className="p-2 rounded-lg bg-muted/30 hover:bg-muted/70 transition flex items-center justify-between gap-2 text-xs cursor-pointer"
                                            >
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <span className="font-mono text-[10.5px] text-muted-foreground shrink-0">
                                                        {evt.date.split("-").slice(1).join("/")}
                                                    </span>
                                                    <span className="truncate text-foreground font-medium">
                                                        {evt.title}
                                                    </span>
                                                </div>
                                                {evt.amount ? (
                                                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">
                                                        {fmtNum(evt.amount)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <AddContractDialog
                isOpen={isAddContractOpen}
                onClose={() => setIsAddContractOpen(false)}
                defaultStartDate={selectedDateStr}
            />

            <AddExpenseDialog
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                defaultDate={selectedDateStr}
            />
        </section>
    )
}
