"use client"

import React, { useMemo, useState, useEffect, useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import AddTaskDialog from "@/components/tasks/add-task-dialog"
import AddExpenseDialog from "@/components/expenses/add-expense-dialog"
import { Plus, CheckSquare, Receipt, X } from "lucide-react"
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
        type: "task" | "installment"
        projectId?: string
        projectName?: string
        priority?: string
        status?: string
        assignedTo?: string | string[]
        amount?: number
        contractTitle?: string
        workerId?: string
        description?: string // Added description
    }
}

export function CalendarView() {
    const { tasks, contracts, projects, users, workers } = useProjects()
    const { t, locale } = useTranslation()
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [projectFilter, setProjectFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [groupBy, setGroupBy] = useState<"project" | "type" | "assignee">("type")
    const calendarRef = useRef<FullCalendar>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isFiltersOpen, setIsFiltersOpen] = useState(true)
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<any>(null) // State for editing
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [isSelectionOpen, setIsSelectionOpen] = useState(false)
    const [clickedDate, setClickedDate] = useState<string>("")
    const [showCompleted, setShowCompleted] = useState(false) // New state for toggling completed items

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            // Mobile check only for UI state, not view switching
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
    const getEventColor = (item: any, type: 'task' | 'installment') => {
        if (groupBy === 'type') {
            return type === 'task' ? '#3b82f6' : '#f59e0b' // Blue for Task, Amber for Installment
        }
        if (groupBy === 'assignee') {
            let assigneeId = type === 'task' ? item.assignedTo : item.workerId

            // Handle array assignees (take first one)
            if (Array.isArray(assigneeId)) {
                assigneeId = assigneeId[0]
            }

            if (!assigneeId) return '#9ca3af' // Gray for unassigned
            // Generate distinct color from ID string
            let hash = 0;
            for (let i = 0; i < assigneeId.length; i++) {
                hash = assigneeId.charCodeAt(i) + ((hash << 5) - hash);
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return '#' + "00000".substring(0, 6 - c.length) + c;
        }
        // Default to Project
        const projectId = item.projectId
        if (!projectId) return '#6b7280'
        // Mock project colors or generate hash
        const colors = ['#ec4899', '#8b5cf6', '#10b981', '#f97316', '#06b6d4']
        let hash = 0;
        for (let i = 0; i < projectId.length; i++) {
            hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length]
    }

    // Build calendar events from tasks and contract installments
    const events: CalendarEvent[] = useMemo(() => {
        const calendarEvents: CalendarEvent[] = []

        // Filter function for projects
        const matchesProject = (projectId?: string) => {
            if (projectFilter === "all") return true
            return projectId === projectFilter
        }

        tasks.forEach((task) => {
            if (!task.dueDate || !matchesProject(task.projectId)) return
            if (typeFilter !== "all" && typeFilter !== "task") return

            // Hide completed if toggle is off
            if (!showCompleted && task.status === "Done") return

            const project = projects.find(p => p.id === task.projectId)
            const color = getEventColor(task, 'task')

            calendarEvents.push({
                id: `task-${task.id}`,
                title: task.title,
                start: task.startDate || task.dueDate,
                end: task.endDate,
                allDay: !task.startDate?.includes('T') && !task.dueDate?.includes('T'),
                backgroundColor: color,
                borderColor: color,
                textColor: "#ffffff",
                extendedProps: {
                    type: "task",
                    projectId: task.projectId,
                    projectName: project?.name,
                    priority: task.priority,
                    status: task.status,
                    assignedTo: task.assignedTo, // Pass raw (string | string[])
                    description: task.description, // Pass description
                },
            })
        })

        // Add contract installments
        contracts.forEach((contract) => {
            if (!matchesProject(contract.projectId)) return
            if (typeFilter !== "all" && typeFilter !== "installment") return

            // Hide paid/completed if toggle is off
            // Assuming Installment.status has "Paid"
            const project = projects.find(p => p.id === contract.projectId)
            contract.installments.forEach((installment) => {
                if (!installment.dueDate) return
                if (!showCompleted && installment.status === "Paid") return
                const item = { ...installment, projectId: contract.projectId, workerId: contract.workerId }
                const color = getEventColor(item, 'installment')
                calendarEvents.push({
                    id: `installment-${contract.id}-${installment.id}`,
                    title: installment.description,
                    start: installment.dueDate,
                    allDay: true,
                    backgroundColor: color,
                    borderColor: color,
                    textColor: "#ffffff",
                    extendedProps: {
                        type: "installment",
                        projectId: contract.projectId,
                        projectName: project?.name,
                        status: installment.status,
                        amount: installment.amount,
                        contractTitle: contract.title,
                        workerId: contract.workerId,
                    },
                })
            })
        })

        return calendarEvents
    }, [tasks, contracts, projects, workers, projectFilter, typeFilter, groupBy])

    const handleEventClick = (info: { event: { id: string } }) => {
        const event = events.find(e => e.id === info.event.id)
        if (event) setSelectedEvent(event)
    }

    const handleDateClick = (arg: DateClickArg) => {
        setClickedDate(arg.dateStr)
        setIsSelectionOpen(true)
    }

    const openAddTask = () => {
        setTaskToEdit(null) // Reset edit state
        setIsSelectionOpen(false)
        setIsAddTaskOpen(true)
    }

    const openAddExpense = () => {
        setIsSelectionOpen(false)
        setIsAddExpenseOpen(true)
    }

    const renderDayCell = (arg: any) => {
        const date = arg.date
        const eventsOnDay = events.filter(e => {
            const eDate = new Date(e.start)
            return eDate.getDate() === date.getDate() &&
                eDate.getMonth() === date.getMonth() &&
                eDate.getFullYear() === date.getFullYear()
        })

        const isMobile = window.innerWidth < 768
        if (isMobile) return arg.dayNumberText

        return (
            <div className="relative w-full h-full flex flex-col items-end pr-2 pt-1 group">
                <span className="text-sm font-medium z-10">{arg.dayNumberText}</span>
            </div>
        )
    }

    const handleEditTask = (task: any) => {
        setTaskToEdit(task)
        setSelectedEvent(null) // Close sheet
        setIsAddTaskOpen(true) // Open dialog
    }

    return (
        <div className="flex flex-col lg:flex-row h-auto min-h-[85vh] lg:h-[calc(100vh-140px)] gap-6 p-1 relative">
            {/* ... (keep Selection Dialog) */}
            {isSelectionOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsSelectionOpen(false)}>
                    {/* ... layout ... */}
                    <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm scale-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Add to {format(new Date(clickedDate), "d MMM yyyy", { locale: locale === "th" ? th : undefined })}</h3>
                            <button onClick={() => setIsSelectionOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={openAddTask}
                                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border-2 border-transparent hover:border-primary/20 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-sm">New Task</span>
                            </button>
                            <button
                                onClick={openAddExpense}
                                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 border-2 border-transparent hover:border-orange-500/20 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-sm">New Expense</span>
                            </button>
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
                                <label className="text-xs font-medium pl-1">Type</label>
                                <div className="relative">
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full h-10 pl-3 pr-8 rounded-xl border border-input bg-background/50 hover:bg-background/80 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="all">{t.calendar?.all_events || "All Events"}</option>
                                        <option value="task">📋 {t.common?.tasks || "Tasks"}</option>
                                        <option value="installment">💰 {t.calendar?.payments || "Payments"}</option>
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
                                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                                            <span className="text-xs sm:text-sm font-medium">{t.common?.tasks || "Tasks"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                                            <span className="text-xs sm:text-sm font-medium">{t.calendar?.payments || "Payments"}</span>
                                        </div>
                                    </>
                                ) : groupBy === 'project' ? (
                                    <p className="text-xs text-muted-foreground italic pl-2">Colored by Project ID hash</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic pl-2">Colored by User ID hash</p>
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
                                            className="flex-shrink-0 bg-background/60 hover:bg-background border border-red-500/20 rounded-xl p-3 min-w-[200px] max-w-[250px] cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/10"
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

            {/* Custom Event Detail Sheet with Edit/Delete */}
            <CalendarEventSheet
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onEdit={handleEditTask}
            />

            {/* Add/Edit Task Dialog */}
            <AddTaskDialog
                isOpen={isAddTaskOpen}
                onClose={() => {
                    setIsAddTaskOpen(false)
                    setTaskToEdit(null) // Clear edit mode
                }}
                defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
                defaultDate={clickedDate}
                taskToEdit={taskToEdit} // Pass editing task
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
