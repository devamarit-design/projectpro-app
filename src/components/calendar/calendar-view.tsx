"use client"

import React, { useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import AddExpenseDialog from "@/components/expenses/add-expense-dialog"
import { Plus, CheckSquare, Receipt, X, CreditCard, FileText, Layers } from "lucide-react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Filter, FolderKanban, ChevronDown, LayoutGrid, List } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import "@/styles/calendar.css"
import { CalendarEventSheet } from "./calendar-event-sheet"
import { cn } from "@/lib/utils"

interface CalendarEvent {
    id: string
    title: string
    start: string
    end?: string
    allDay?: boolean
    backgroundColor?: string
    borderColor?: string
    textColor?: string
    extendedProps: {
        type: "voucher" | "installment" | "contract" | "task"
        projectId?: string
        projectName?: string
        priority?: string
        status?: string
        assignedTo?: string | string[]
        amount?: number
        contractTitle?: string
        workerId?: string
        description?: string
    }
}

export function CalendarView() {
    const router = useRouter()
    const { tasks, contracts, projects, users, workers, currentUser, currentTeam } = useProjects()
    const { t, locale } = useTranslation()

    const isManagerOrAbove = useMemo(() => {
        const uRole = currentUser?.role
        const tRole = currentTeam?.role
        return (
            uRole === "Manager" || uRole === "Admin" || uRole === "Owner" ||
            tRole === "Manager" || tRole === "Admin" || tRole === "Owner"
        )
    }, [currentUser, currentTeam])

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [projectFilter, setProjectFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [groupBy, setGroupBy] = useState<"project" | "type" | "assignee">("type")
    const calendarRef = useRef<FullCalendar>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isFiltersOpen, setIsFiltersOpen] = useState(true)
    const [isAddContractOpen, setIsAddContractOpen] = useState(false)
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [isSelectionOpen, setIsSelectionOpen] = useState(false)
    const [clickedDate, setClickedDate] = useState<string>("")
    const [showCompleted, setShowCompleted] = useState(false)

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile) {
                setIsFiltersOpen(false)
            } else {
                setIsFiltersOpen(true)
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Helper to get color based on group mode
    const getEventColor = (item: any, type: 'voucher' | 'installment' | 'contract') => {
        if (groupBy === 'type') {
            if (type === 'voucher') return item.status === 'Paid' ? '#10b981' : '#f59e0b'
            if (type === 'contract') return '#8b5cf6'
            return '#3b82f6' // Installment
        }
        if (groupBy === 'assignee') {
            const assigneeId = item.workerId
            if (!assigneeId) return '#9ca3af'
            let hash = 0
            for (let i = 0; i < assigneeId.length; i++) {
                hash = assigneeId.charCodeAt(i) + ((hash << 5) - hash)
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase()
            return '#' + "00000".substring(0, 6 - c.length) + c
        }
        // Default to Project
        const projectId = item.projectId
        if (!projectId) return '#6b7280'
        const colors = ['#ec4899', '#8b5cf6', '#10b981', '#f97316', '#06b6d4']
        let hash = 0
        for (let i = 0; i < projectId.length; i++) {
            hash = projectId.charCodeAt(i) + ((hash << 5) - hash)
        }
        return colors[Math.abs(hash) % colors.length]
    }

    // Build calendar events from contracts, installment milestones, and payment vouchers
    const events: CalendarEvent[] = useMemo(() => {
        const calendarEvents: CalendarEvent[] = []

        const matchesProject = (projectId?: string) => {
            if (projectFilter === "all") return true
            return projectId === projectFilter
        }

        contracts.forEach((contract) => {
            if (contract.isArchived || contract.isDeleted) return
            if (!matchesProject(contract.projectId)) return

            const project = projects.find(p => p.id === contract.projectId)
            const worker = workers.find(w => w.id === contract.workerId)
            const projName = project?.name || "โครงการทั่วไป"
            const workerName = worker?.name || "ช่าง/ผู้รับเหมา"

            const isStandalone = Boolean(
                contract.isStandaloneVoucher ||
                contract.contractType === "ใบเบิกงวด (ไม่มีสัญญา)" ||
                contract.documentNumber?.startsWith("PV")
            )

            // 1. Contract Start Date (ONLY for real multi-milestone contracts, NOT standalone single vouchers)
            if (!isStandalone && contract.startDate && (typeFilter === "all" || typeFilter === "contract")) {
                const sDate = contract.startDate.split("T")[0]
                if (sDate) {
                    calendarEvents.push({
                        id: `contract-start-${contract.id}`,
                        title: `📜 เริ่มสัญญา: ${contract.title} (${workerName})`,
                        start: sDate,
                        allDay: true,
                        backgroundColor: "#8b5cf6",
                        borderColor: "#8b5cf6",
                        textColor: "#ffffff",
                        extendedProps: {
                            type: "contract",
                            projectId: contract.projectId,
                            projectName: projName,
                            status: contract.status || "Active",
                            amount: contract.totalAmount,
                            contractTitle: contract.title,
                            workerId: contract.workerId,
                            description: `สัญญาจ้างเลขที่ ${contract.documentNumber || ""} • ${contract.title} • ผู้รับเหมา: ${workerName} • มูลค่ารวม: ฿${(contract.totalAmount || 0).toLocaleString()}`
                        }
                    })
                }
            }

            // 2. Contract End Date (ONLY for real multi-milestone contracts)
            if (!isStandalone && contract.endDate && contract.endDate !== contract.startDate && (typeFilter === "all" || typeFilter === "contract")) {
                const eDate = contract.endDate.split("T")[0]
                if (eDate) {
                    calendarEvents.push({
                        id: `contract-end-${contract.id}`,
                        title: `🏁 สิ้นสุดสัญญา: ${contract.title} (${workerName})`,
                        start: eDate,
                        allDay: true,
                        backgroundColor: "#6366f1",
                        borderColor: "#6366f1",
                        textColor: "#ffffff",
                        extendedProps: {
                            type: "contract",
                            projectId: contract.projectId,
                            projectName: projName,
                            status: contract.status || "Active",
                            amount: contract.totalAmount,
                            contractTitle: contract.title,
                            workerId: contract.workerId,
                            description: `กำหนดสิ้นสุดสัญญา ${contract.documentNumber || ""} • ผู้รับเหมา: ${workerName}`
                        }
                    })
                }
            }

            // 3. Installments and Payment Vouchers (Draws)
            contract.installments?.forEach((installment, instIdx) => {
                const instLabel = instIdx + 1

                // 3.1 Payment Vouchers / Draws (Payment date or voucher date)
                if (isManagerOrAbove && installment.draws && installment.draws.length > 0) {
                    installment.draws.forEach((draw) => {
                        if (typeFilter !== "all" && typeFilter !== "voucher") return
                        const targetDate = (draw.paymentDate || draw.date || "").split("T")[0]
                        if (!targetDate) return
                        if (!showCompleted && draw.expenseStatus === "Paid") return

                        const isPaid = draw.expenseStatus === "Paid"
                        const drawColor = isPaid ? "#10b981" : "#f59e0b"
                        calendarEvents.push({
                            id: `draw-${contract.id}-${installment.id}-${draw.id}`,
                            title: `💰 ใบเบิก ${draw.voucherNumber || draw.label || instLabel}: ${workerName} (฿${(draw.amount || 0).toLocaleString()})`,
                            start: targetDate,
                            allDay: true,
                            backgroundColor: drawColor,
                            borderColor: drawColor,
                            textColor: "#ffffff",
                            extendedProps: {
                                type: "voucher",
                                projectId: contract.projectId,
                                projectName: projName,
                                status: draw.expenseStatus || "Pending",
                                amount: draw.amount,
                                contractTitle: contract.title,
                                workerId: contract.workerId,
                                description: `${draw.voucherNumber ? `ใบสำคัญจ่าย ${draw.voucherNumber} • ` : ""}งวด ${draw.label || instLabel}: ${installment.description || ""} (${isPaid ? "จ่ายแล้ว" : "รอการจ่ายเงิน"})${draw.paymentDate ? ` • กำหนดจ่าย: ${draw.paymentDate}` : ""}`,
                            },
                        })
                    })
                }

                // 3.2 Installment Milestones (Scheduled dueDate - ONLY if not standalone AND remaining un-drawn amount > 0)
                if (!isStandalone && installment.dueDate) {
                    if (typeFilter !== "all" && typeFilter !== "installment") return
                    const totalDrawn = (installment.draws || []).reduce((sum, d) => sum + (d.amount || 0), 0)
                    const remainingAmount = Math.max(0, (installment.amount || 0) - totalDrawn)

                    if (remainingAmount <= 0) return // Fully drawn, do not duplicate as milestone
                    if (!showCompleted && installment.status === "Paid") return
                    const targetDate = installment.dueDate.split("T")[0]
                    if (!targetDate) return

                    calendarEvents.push({
                        id: `installment-${contract.id}-${installment.id}`,
                        title: `📑 งวดที่ ${instLabel}: ${installment.description || "ส่งมอบงาน"} (รอเบิก ฿${remainingAmount.toLocaleString()})`,
                        start: targetDate,
                        allDay: true,
                        backgroundColor: "#3b82f6",
                        borderColor: "#3b82f6",
                        textColor: "#ffffff",
                        extendedProps: {
                            type: "installment",
                            projectId: contract.projectId,
                            projectName: projName,
                            status: installment.status || "Pending",
                            amount: remainingAmount,
                            contractTitle: contract.title,
                            workerId: contract.workerId,
                            description: `กำหนดส่งมอบงวดงาน ${instLabel}: ${installment.description || ""} • ผู้รับเหมา: ${workerName} • ยอดคงเหลือรอเบิก: ฿${remainingAmount.toLocaleString()}`,
                        },
                    })
                }
            })
        })

        return calendarEvents
    }, [contracts, projects, workers, projectFilter, typeFilter, groupBy, isManagerOrAbove, showCompleted])

    const handleEventClick = (info: { event: { id: string } }) => {
        const event = events.find(e => e.id === info.event.id)
        if (event) setSelectedEvent(event)
    }

    const handleDateClick = (arg: DateClickArg) => {
        setClickedDate(arg.dateStr)
        setIsSelectionOpen(true)
    }

    const openAddContract = () => {
        setIsSelectionOpen(false)
        setIsAddContractOpen(true)
    }

    const openAddExpense = () => {
        setIsSelectionOpen(false)
        setIsAddExpenseOpen(true)
    }

    const renderDayCell = (arg: any) => {
        const isMobile = window.innerWidth < 768
        if (isMobile) return arg.dayNumberText

        return (
            <div className="relative w-full h-full flex flex-col items-end pr-2 pt-1 group">
                <span className="text-sm font-medium z-10">{arg.dayNumberText}</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row h-auto min-h-[85vh] lg:h-[calc(100vh-140px)] gap-6 p-1 relative">
            {/* Selection Dialog */}
            {isSelectionOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsSelectionOpen(false)}>
                    <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm scale-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">ดำเนินการในวันที่ {format(new Date(clickedDate), "d MMM yyyy", { locale: locale === "th" ? th : undefined })}</h3>
                            <button onClick={() => setIsSelectionOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={openAddContract}
                                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border-2 border-transparent hover:border-purple-500/20 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-xs">สร้างสัญญา</span>
                            </button>
                            <button
                                onClick={openAddExpense}
                                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 border-2 border-transparent hover:border-orange-500/20 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-xs">บันทึกรายจ่าย</span>
                            </button>
                            {isManagerOrAbove && (
                                <button
                                    onClick={() => {
                                        setIsSelectionOpen(false)
                                        router.push(`/vouchers/new?date=${clickedDate}&paymentDate=${clickedDate}`)
                                    }}
                                    className="col-span-2 flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-bold text-xs text-foreground block">ออกใบเบิกงวด (New Voucher)</span>
                                        <span className="text-[10.5px] text-muted-foreground">บันทึกค่างวด/กำหนดจ่ายเงินในวันที่เลือก</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className={`
                flex-shrink-0 
                ${isMobile ? "w-full" : "w-64"} 
                transition-all duration-300 ease-in-out
            `}>
                <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
                    <div
                        className="flex items-center justify-between cursor-pointer lg:cursor-default"
                        onClick={() => isMobile && setIsFiltersOpen(!isFiltersOpen)}
                    >
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            {t.common?.search || "ตัวกรอง/Filters"}
                        </h3>
                        {isMobile && (
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isFiltersOpen ? "rotate-180" : ""}`} />
                        )}
                    </div>

                    <div className={`space-y-5 overflow-hidden transition-all duration-300 ${isFiltersOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"}`}>
                        <div className="space-y-3 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium pl-1">Project</label>
                                <div className="relative">
                                    <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                                    <select
                                        value={projectFilter}
                                        onChange={(e) => setProjectFilter(e.target.value)}
                                        className="w-full h-10 pl-9 pr-8 rounded-xl border border-input bg-background/50 hover:bg-background/80 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="all">{t.tasks?.filters?.all_projects || "All Projects"}</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium pl-1">ประเภท (Type)</label>
                                <div className="relative">
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full h-10 pl-3 pr-8 rounded-xl border border-input bg-background/50 hover:bg-background/80 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="all">ทั้งหมด (All Events)</option>
                                        <option value="voucher">💰 ใบเบิกงวด (Payment Vouchers)</option>
                                        <option value="installment">📑 งวดสัญญา (Milestones)</option>
                                        <option value="contract">📜 สัญญาจ้าง (Contracts)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium pl-1">Color By</label>
                                <div className="grid grid-cols-3 gap-1 p-1 bg-muted/30 rounded-lg">
                                    {(['project', 'type', 'assignee'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setGroupBy(mode)}
                                            className={`
                                                px-2 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all
                                                ${groupBy === mode
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:bg-background/50'}
                                            `}
                                        >
                                            {mode === 'project' ? 'Project' : mode === 'type' ? 'Type' : 'User'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Toggle Show Completed */}
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className={`
                                    relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75
                                    ${showCompleted ? 'bg-primary' : 'bg-muted'}
                                `}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`
                                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                                        ${showCompleted ? 'translate-x-4' : 'translate-x-0'}
                                    `}
                                />
                            </button>
                            <span className="text-xs font-medium cursor-pointer" onClick={() => setShowCompleted(!showCompleted)}>
                                Show Completed/Paid
                            </span>
                        </div>

                        <div className="h-px bg-border/50" />

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Legend</h3>
                            <div className="space-y-2">
                                {groupBy === 'type' ? (
                                    <>
                                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                            <span className="text-xs sm:text-sm font-medium">ใบเบิกงวด (Vouchers)</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                                            <span className="text-xs sm:text-sm font-medium">งวดสัญญา (Milestones)</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                                            <span className="text-xs sm:text-sm font-medium">สัญญาจ้าง (Contracts)</span>
                                        </div>
                                    </>
                                ) : groupBy === 'project' ? (
                                    <p className="text-xs text-muted-foreground italic pl-2">Colored by Project ID hash</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic pl-2">Colored by Contractor/Worker hash</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Calendar Area */}
            <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col gap-4">

                {/* Overdue Tasks Section */}
                {
                    (() => {
                        const today = new Date().toISOString().split('T')[0]
                        const overdueTasks = events.filter(e =>
                            e.extendedProps.type === 'task' &&
                            e.extendedProps.status !== 'Done' &&
                            e.start < today
                        ).sort((a, b) => a.start.localeCompare(b.start))

                        if (overdueTasks.length === 0) return null

                        return (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex-shrink-0 animate-in slide-in-from-top duration-300">
                                <h3 className="text-red-500 font-bold mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    {(t.common as any)?.overdue || "Overdue Tasks"} ({overdueTasks.length})
                                </h3>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {overdueTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedEvent(task)}
                                            className="flex-shrink-0 bg-background/60 hover:bg-background border border-red-500/20 hover:border-red-500/50 rounded-xl p-3 min-w-[200px] max-w-[250px] cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/10 active:scale-[0.98]"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-bold uppercase text-red-500 tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded">
                                                    {format(new Date(task.start), "d MMM", { locale: locale === "th" ? th : undefined })}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                                            <p className="text-xs text-muted-foreground truncate">{task.extendedProps.projectName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })()
                }

                <div className="glass-card rounded-2xl p-1 min-h-[60vh] lg:min-h-0 h-full shadow-sm flex flex-col flex-1 overflow-hidden">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,listMonth",
                        }}
                        locale={locale === "th" ? "th" : "en"}
                        events={events}
                        eventClick={handleEventClick}
                        dateClick={handleDateClick}
                        dayCellContent={renderDayCell}
                        height={isMobile ? "auto" : "100%"}
                        dayMaxEvents={3}
                        eventDisplay="block"
                        navLinks={true}
                        selectable={true}
                        buttonText={{
                            today: locale === "th" ? "วันนี้" : "Today",
                            month: locale === "th" ? "เดือน" : "Month",
                            week: locale === "th" ? "สัปดาห์" : "Week",
                            list: locale === "th" ? "รายการ" : "List"
                        }}
                        views={{
                            dayGridMonth: {
                                titleFormat: { year: 'numeric', month: 'long' }
                            },
                            listMonth: {
                                listDaySideFormat: false,
                            },
                        }}
                        eventOrder="-start"
                        eventContent={(arg) => {
                            const { event, view } = arg
                            const isTimeGrid = view.type.startsWith('timeGrid')
                            const isList = view.type.startsWith('list')

                            if (isList) {
                                // Support multi-assign array
                                const assignedIds = Array.isArray(event.extendedProps.assignedTo)
                                    ? event.extendedProps.assignedTo
                                    : (event.extendedProps.assignedTo ? [event.extendedProps.assignedTo] : [])
                                const assigneeNames = assignedIds
                                    .map(id => users.find(u => u.id === id)?.name || id)
                                    .filter(Boolean)
                                const assigneeDisplay = assigneeNames.length > 2
                                    ? `${assigneeNames[0]} +${assigneeNames.length - 1}`
                                    : assigneeNames.join(", ")

                                return (
                                    <div className="flex flex-col py-0.5">
                                        <div className="font-semibold">{event.title}</div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{event.extendedProps.projectName}</span>
                                            {assigneeDisplay && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                                    <span className="text-primary/80">
                                                        👤 {assigneeDisplay}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            }

                            if (isTimeGrid && !event.allDay) {
                                return (
                                    <div className="w-full h-full p-1 overflow-hidden items-center justify-center flex">
                                        <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="rotate-180 flex items-center justify-center gap-1 font-semibold text-xs tracking-wide h-full max-h-full">
                                            <span className="whitespace-nowrap">{event.title}</span>
                                        </div>
                                    </div>
                                )
                            }

                            // Default Month View
                            return (
                                <div className="flex flex-col h-full w-full overflow-hidden p-1">
                                    <div className="flex items-center gap-1 font-semibold text-xs truncate">
                                        <span className="truncate">{event.title}</span>
                                    </div>
                                </div>
                            )
                        }}
                        windowResize={(arg) => {
                            const mobile = window.innerWidth < 768
                            setIsMobile(mobile)
                        }}
                    />
                </div>
            </div>

            {/* Custom Event Detail Sheet */}
            <CalendarEventSheet
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
            />

            {/* Add Contract Dialog */}
            <AddContractDialog
                isOpen={isAddContractOpen}
                onClose={() => setIsAddContractOpen(false)}
                defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
                defaultStartDate={clickedDate}
            />

            {/* Add Expense Dialog */}
            <AddExpenseDialog
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
                defaultDate={clickedDate}
            />
        </div>
    )
}
