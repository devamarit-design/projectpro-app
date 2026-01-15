"use client"

import React, { useState, use, useEffect } from "react"
import {
    ChevronRight,
    Calendar,
    MapPin,
    DollarSign,
    Info,
    CheckCircle2,
    Plus,
    Check,
    Trash2,
    AlertCircle,
    LayoutDashboard,
    Receipt,
    CheckSquare,
    TrendingDown,
    Folder,
    File,
    Image as ImageIcon,
    FileText,
    FileSpreadsheet,
    Film,
    Upload,
    MoreVertical,
    Download,
    User,
    Filter
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { ProjectHeader } from "@/components/projects/project-header"
import { cn } from "@/lib/utils"
// Components
import AddExpenseDialog from "@/components/expenses/add-expense-dialog"
import ExpenseDetailSheet from "@/components/expenses/expense-detail-sheet"
import AddTaskDialog from "@/components/tasks/add-task-dialog"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useTranslation()
    const { getProject, addTask, deleteTask, toggleTask, expenses, files, addFile, currentUser, users, incomes } = useProjects()
    const [activeTab, setActiveTab] = useState("overview")
    const { id } = use(params)
    const project = getProject(id)

    const projectFiles = files.filter(f => f.projectId === id)


    // Expense State
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
    const [userFilter, setUserFilter] = useState<string>("all")
    const [monthFilter, setMonthFilter] = useState<string>("all")

    // 1. Get all raw data for this project
    const allProjectExpenses = expenses.filter(e => e.projectId === id || e.items?.some(i => i.projectId === id))
    const allProjectIncomes = incomes.filter(i => i.projectId === id && (i.status === 'Paid' || i.status === 'Accepted')) // Only count realized income for financials

    // 2. Extract available months from both expenses and incomes
    const availableMonths = Array.from(new Set([
        ...allProjectExpenses.map(e => e.date.substring(0, 7)),
        ...allProjectIncomes.map(i => i.date.substring(0, 7))
    ])).sort().reverse()

    // 3. Filter data based on selection
    const projectExpenses = monthFilter === "all"
        ? allProjectExpenses
        : allProjectExpenses.filter(e => e.date.startsWith(monthFilter))

    const projectIncomes = monthFilter === "all"
        ? allProjectIncomes
        : allProjectIncomes.filter(i => i.date.startsWith(monthFilter))

    // 4. Calculate Totals
    const totalExpenses = projectExpenses.reduce((sum, e) => sum + e.totalValue, 0)
    const totalIncome = projectIncomes.reduce((sum, i) => sum + i.grandTotal, 0)
    const totalProfit = totalIncome - totalExpenses

    useEffect(() => {
        // Scroll to top of both window and our custom scroll container
        window.scrollTo(0, 0)
        const container = document.getElementById("main-scroll-container")
        if (container) {
            container.scrollTo({ top: 0, behavior: 'instant' })
        }
    }, [id])

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="p-4 rounded-full bg-red-500/10 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold">Project Not Found</h1>
                <p className="text-muted-foreground">The project you are looking for does not exist.</p>
                <Link href="/projects" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">
                    Back to Projects
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <ProjectHeader project={project} />

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === "overview"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-background/50 hover:bg-muted/50 text-muted-foreground"
                    )}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    {t.projects.detail.tabs.overview}
                </button>
                <button
                    onClick={() => setActiveTab("financials")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === "financials"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-background/50 hover:bg-muted/50 text-muted-foreground"
                    )}
                >
                    <Receipt className="w-4 h-4" />
                    {t.projects.detail.tabs.financials}
                </button>
                <button
                    onClick={() => setActiveTab("tasks")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === "tasks"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-background/50 hover:bg-muted/50 text-muted-foreground"
                    )}
                >
                    <CheckSquare className="w-4 h-4" />
                    {t.projects.detail.tabs.tasks}
                </button>
                <button
                    onClick={() => setActiveTab("files")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === "files"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-background/50 hover:bg-muted/50 text-muted-foreground"
                    )}
                >
                    <Folder className="w-4 h-4" />
                    {t.projects.detail.tabs.files}
                </button>
            </div>

            {/* Tab Contents */}
            <div className="glass-card rounded-2xl p-6 min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="glass-card p-6 rounded-2xl space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" />
                                {t.projects.detail.overview.description}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {project.description || t.projects.detail.overview.no_desc}
                            </p>
                        </div>

                        <div className="glass-card p-6 rounded-2xl space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                {t.projects.detail.overview.timeline}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-muted-foreground text-sm font-medium">{t.projects.detail.overview.start_date}</span>
                                    <span className="font-bold">{project.startDate}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-muted-foreground text-sm font-medium">{t.projects.detail.overview.end_date}</span>
                                    <span className="font-bold">{project.endDate}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground text-sm font-medium">{t.projects.detail.overview.current_status}</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary self-start rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="space-y-6">
                        {/* Month Filter */}
                        <div className="flex justify-end">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <select
                                    value={monthFilter}
                                    onChange={(e) => setMonthFilter(e.target.value)}
                                    className="pl-9 pr-8 py-2 bg-muted/50 border border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[150px]"
                                >
                                    <option value="all">{t.projects.detail.financials.month_filter}</option>
                                    {availableMonths.map(month => (
                                        <option key={month} value={month}>
                                            {new Date(month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* High Level Stats */}
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-primary hover:translate-y-[-2px] transition-transform">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.projects.detail.financials.contract_value}</p>
                                <p className="text-xl md:text-2xl font-black">{project.budget}</p>
                            </div>
                            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-green-500 hover:translate-y-[-2px] transition-transform">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.projects.detail.financials.received}</p>
                                <p className="text-xl md:text-2xl font-black text-green-500">฿{totalIncome.toLocaleString()}</p>
                            </div>
                            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-red-500 hover:translate-y-[-2px] transition-transform">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.projects.detail.financials.total_expenses}</p>
                                <p className="text-xl md:text-2xl font-black text-red-500">฿{totalExpenses.toLocaleString()}</p>
                            </div>
                            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-500 hover:translate-y-[-2px] transition-transform">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.projects.detail.financials.profit_est}</p>
                                <p className={cn(
                                    "text-xl md:text-2xl font-black",
                                    totalProfit >= 0 ? "text-blue-500" : "text-red-500"
                                )}>
                                    ฿{totalProfit.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Detailed Expense Breakdown */}
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                            <div className="glass-card p-4 rounded-xl border border-white/5 bg-orange-500/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-orange-500/20 text-orange-500">
                                        <TrendingDown className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold text-orange-400 uppercase tracking-wider">{t.projects.detail.financials.material}</p>
                                </div>
                                <p className="text-2xl font-black text-orange-500">
                                    ฿{projectExpenses.filter(e => e.category === 'Material').reduce((sum, e) => sum + e.totalValue, 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {projectExpenses.filter(e => e.category === 'Material').length} {t.projects.detail.financials.transactions_count}
                                </p>
                            </div>

                            <div className="glass-card p-4 rounded-xl border border-white/5 bg-blue-500/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">{t.projects.detail.financials.labor}</p>
                                </div>
                                <p className="text-2xl font-black text-blue-500">
                                    ฿{projectExpenses.filter(e => e.category === 'Labor').reduce((sum, e) => sum + e.totalValue, 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {projectExpenses.filter(e => e.category === 'Labor').length} {t.projects.detail.financials.transactions_count}
                                </p>
                            </div>

                            <div className="glass-card p-4 rounded-xl border border-white/5 bg-purple-500/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                                        <TrendingDown className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold text-purple-400 uppercase tracking-wider">{t.projects.detail.financials.subcontract}</p>
                                </div>
                                <p className="text-2xl font-black text-purple-500">
                                    ฿{projectExpenses.filter(e => e.category === 'Sub-contract').reduce((sum, e) => sum + e.totalValue, 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {projectExpenses.filter(e => e.category === 'Sub-contract').length} {t.projects.detail.financials.transactions_count}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-lg">{t.projects.detail.financials.history}</h4>
                                <button
                                    onClick={() => setIsAddExpenseOpen(true)}
                                    className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-primary/20"
                                >
                                    <Plus className="w-4 h-4" /> {t.projects.detail.financials.add_expense}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {projectExpenses.length > 0 ? (
                                    projectExpenses.map((expense) => (
                                        <div
                                            key={expense.id}
                                            onClick={() => setSelectedExpenseId(expense.id)}
                                            className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
                                                    expense.category === 'Material' ? "bg-blue-500/10 text-blue-500" :
                                                        expense.category === 'Labor' ? "bg-orange-500/10 text-orange-500" :
                                                            expense.category === 'Sub-contract' ? "bg-purple-500/10 text-purple-500" :
                                                                "bg-gray-500/10 text-gray-500"
                                                )}>
                                                    {expense.category[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold group-hover:text-primary transition-colors">{expense.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{expense.date}</span>
                                                        <span>•</span>
                                                        <span>{expense.payee || t.projects.detail.financials.no_payee}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-base">{expense.amount}</p>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                    expense.status === 'Paid' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                        expense.status === 'Pending' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                            "bg-red-500/10 text-red-500 border-red-500/20"
                                                )}>
                                                    {expense.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="glass-card p-8 rounded-3xl min-h-[200px] flex flex-col items-center justify-center text-center space-y-4 border border-white/5">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                            <DollarSign className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="max-w-xs space-y-2">
                                            <p className="text-sm text-muted-foreground">{t.projects.detail.financials.empty_expenses}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="space-y-6">
                        {/* Quick Add Task */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {(currentUser?.role === 'Owner' || currentUser?.role === 'Admin') && (
                                    <div className="relative w-48 z-10">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <select
                                            value={userFilter}
                                            onChange={(e) => setUserFilter(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2.5 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                                        >
                                            <option value="all">{t.projects.detail.tasks.all_users}</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.name}>{u.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <MoreVertical className="w-4 h-4 text-muted-foreground rotate-90" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsAddTaskOpen(true)}
                                className="h-10 px-5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{t.projects.detail.tasks.add_task}</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-0">
                            <div className="flex gap-6 h-[85vh] min-h-[800px] min-w-[800px] pb-4 px-1">
                                {(["Todo", "In Progress", "Done"] as const).map((status) => {
                                    // Use project.tasks for base, then filter by status AND permissions
                                    const baseTasks = project.tasks || []

                                    const statusTasks = baseTasks.filter(task => {
                                        // 1. Status Check
                                        if (task.status !== status) return false

                                        // 2. Permission Check
                                        const isAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin'

                                        if (isAdmin) {
                                            // Admin: Filter by userFilter if set
                                            if (userFilter !== "all") {
                                                return task.assignedTo === userFilter
                                            }
                                            return true
                                        } else {
                                            // User: Only own tasks
                                            return task.assignedTo === currentUser?.name
                                        }
                                    })

                                    const priorityColors: Record<string, string> = {
                                        High: "bg-red-500/10 text-red-500 border-red-500/20",
                                        Medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
                                        Low: "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                    }

                                    const statusColors: Record<string, string> = {
                                        Todo: "bg-slate-500",
                                        "In Progress": "bg-blue-500",
                                        Done: "bg-green-500"
                                    }

                                    const getStatusTranslation = (status: string) => {
                                        switch (status) {
                                            case 'Todo': return t.projects.detail.tasks.status.todo
                                            case 'In Progress': return t.projects.detail.tasks.status.in_progress
                                            case 'Done': return t.projects.detail.tasks.status.done
                                            default: return status
                                        }
                                    }

                                    return (
                                        <div key={status} className="flex-1 flex flex-col h-full bg-muted/30 dark:bg-muted/10 rounded-2xl border border-white/5 overflow-hidden">
                                            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-muted/20 backdrop-blur-sm">
                                                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full shadow-lg ring-2 ring-opacity-20", statusColors[status].replace('bg-', 'ring-'))} style={{ backgroundColor: 'currentColor' }} />
                                                    <span className={cn(status === 'Todo' ? 'text-slate-500' : status === 'In Progress' ? 'text-blue-500' : 'text-green-500')}>{getStatusTranslation(status)}</span>
                                                    <span className="ml-1 text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border border-white/5 font-medium">
                                                        {statusTasks.length}
                                                    </span>
                                                </h3>
                                            </div>

                                            <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
                                                {statusTasks.map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className={cn(
                                                            "glass-card w-full p-4 rounded-xl border border-white/5 hover:border-primary/20 hover:-translate-y-1 cursor-pointer transition-all group relative overflow-hidden bg-card/50",
                                                            task.status === 'Done' && "opacity-75"
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border",
                                                                priorityColors[task.priority]
                                                            )}>
                                                                {task.priority || t.projects.detail.tasks.priority.low}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => toggleTask(project.id, task.id)}
                                                                    className={cn(
                                                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                                        task.status === 'Done' ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 hover:border-primary"
                                                                    )}
                                                                >
                                                                    {task.status === 'Done' && <Check className="w-3 h-3" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteTask(project.id, task.id)}
                                                                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <h4 className={cn("font-semibold text-sm mb-2 group-hover:text-primary transition-colors leading-snug", task.status === 'Done' && "line-through text-muted-foreground")}>
                                                            {task.title}
                                                        </h4>

                                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                                                                    {/* Simple Avatar */}
                                                                    <span className="text-[10px] font-bold text-primary">
                                                                        {(task.assignedTo || "U").charAt(0)}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[80px]">{task.assignedTo || t.projects.detail.tasks.unassigned}</span>
                                                            </div>
                                                            <div className={cn(
                                                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight",
                                                                task.status === 'Done' ? 'text-green-500' : 'text-orange-500'
                                                            )}>
                                                                {task.dueDate && <Calendar className="w-3 h-3" />}
                                                                {task.dueDate}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {statusTasks.length === 0 && (
                                                    <div className="h-24 rounded-xl border-2 border-dashed border-muted flex items-center justify-center p-4 text-center opacity-50">
                                                        <p className="text-xs text-muted-foreground font-medium">{t.projects.detail.tasks.empty}</p>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setIsAddTaskOpen(true)}
                                                    className="w-full py-3 border border-dashed border-primary/20 bg-primary/5 rounded-xl text-xs font-bold uppercase tracking-widest text-primary/70 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2 group mt-2"
                                                >
                                                    <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                                                    {t.projects.detail.tasks.add_task}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}


                {activeTab === 'files' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-lg flex items-center gap-2">
                                <Folder className="w-5 h-5 text-primary" />
                                {t.projects.detail.files.title}
                            </h4>
                            <button
                                onClick={() => {
                                    const fName = prompt(t.projects.detail.files.enter_file_name)
                                    if (fName) {
                                        addFile({
                                            name: fName,
                                            url: "#",
                                            type: "other",
                                            size: "1.0 MB",
                                            projectId: project.id
                                        })
                                    }
                                }}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                <Upload className="w-4 h-4" /> {t.projects.detail.files.upload}
                            </button>
                        </div>

                        {projectFiles.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {projectFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="group relative bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/5 hover:border-white/10 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center gap-3"
                                    >
                                        <div className="p-4 rounded-2xl bg-muted/20 group-hover:bg-muted/30 transition-colors w-full aspect-square flex items-center justify-center">
                                            {(() => {
                                                switch (file.type) {
                                                    case 'image': return <ImageIcon className="w-10 h-10 text-blue-500" />
                                                    case 'pdf': return <FileText className="w-10 h-10 text-red-500" />
                                                    case 'spreadsheet': return <FileSpreadsheet className="w-10 h-10 text-green-500" />
                                                    case 'video': return <Film className="w-10 h-10 text-purple-500" />
                                                    default: return <File className="w-10 h-10 text-gray-500" />
                                                }
                                            })()}
                                        </div>
                                        <div className="w-full">
                                            <p className="font-bold text-sm truncate w-full" title={file.name}>{file.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{file.size} • {file.uploadedAt}</p>
                                        </div>
                                        <button className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-muted/20 border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-4">
                                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                                    <Folder className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <div className="max-w-xs mx-auto space-y-1">
                                    <p className="font-bold">{t.projects.detail.files.no_files}</p>
                                    <p className="text-sm text-muted-foreground">{t.projects.detail.files.no_files_sub}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* Dialogs */}
            <AddExpenseDialog
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                defaultProjectId={project.id}
            />

            <AddTaskDialog
                isOpen={isAddTaskOpen}
                onClose={() => setIsAddTaskOpen(false)}
                defaultProjectId={project.id}
            />

            <ExpenseDetailSheet
                expenseId={selectedExpenseId}
                onClose={() => setSelectedExpenseId(null)}
            />
        </div >
    )
}
