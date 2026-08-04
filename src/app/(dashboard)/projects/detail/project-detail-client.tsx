"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { hasPermission } from "@/lib/permissions"
import {
    LayoutDashboard,
    Receipt,
    CheckSquare,
    Folder,
    Plus,
    Calendar,
    Info,
    MoreVertical,
    FileText,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Target,
    MapPin,
    User,
    Filter,
    Download,
    Upload,
    File,
    Image as ImageIcon,
    FileSpreadsheet,
    Film,
    AlertCircle,
    ChevronRight,
    ChevronDown,
    Check,
    Layers
} from "lucide-react"
import { IncomeDocument } from "@/context/project-context"
import Link from "next/link"
import { ProjectHeader } from "@/components/projects/project-header"
import { cn, getGoogleMapsUrl } from "@/lib/utils"
import { getExpenseAmountForProject, getCategoryExpenseForProject } from "@/lib/project-utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
// Components
import AddExpenseDialog from "@/components/expenses/add-expense-dialog"
import ExpenseDetailSheet from "@/components/expenses/expense-detail-sheet"
import AddTaskDialog from "@/components/tasks/add-task-dialog"
import { AddWorkDialog } from "@/components/modals/add-work-dialog"
import { AddIncomeDialog } from "@/components/income/add-income-dialog"

import { TaskBoard } from "@/components/tasks/task-board"
import TaskDetailSheet from "@/components/tasks/task-detail-sheet"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { toast } from "sonner"

const ProjectGantt = dynamic(() => import('@/components/projects/project-gantt').then(mod => mod.ProjectGantt), { ssr: false })

// Helper to group incomes by transaction chain
const groupIncomes = (docs: IncomeDocument[]) => {
    const docMap = new Map(docs.map(d => [d.id, d]))
    const groups: Map<string, IncomeDocument[]> = new Map()

    // 1. Group by Root Ancestor
    docs.forEach(doc => {
        let current = doc
        const visited = new Set<string>()

        // Trace back to root
        while (current.referenceDocumentId && docMap.has(current.referenceDocumentId)) {
            if (visited.has(current.id)) break // Prevent circular
            visited.add(current.id)
            current = docMap.get(current.referenceDocumentId)!
        }
        const root = current

        if (!groups.has(root.id)) {
            groups.set(root.id, [])
        }
        groups.get(root.id)!.push(doc)
    })

    // 2. Format Groups
    return Array.from(groups.values()).map(groupDocs => {
        // Sort: QT -> INV -> REC
        const typeRank: Record<string, number> = { Quotation: 1, Invoice: 2, Receipt: 3 }
        groupDocs.sort((a, b) => (typeRank[a.type] || 99) - (typeRank[b.type] || 99))

        const rootDoc = groupDocs[0]
        // Use first item description or Zone name or generic fallback
        const title = rootDoc.items?.[0]?.description || rootDoc.sections?.[0]?.name || "Income Transaction"

        return {
            id: rootDoc.id,
            rootDoc,
            title,
            date: rootDoc.date,
            totalAmount: rootDoc.grandTotal,
            documents: groupDocs,
            types: Array.from(new Set(groupDocs.map(d => d.type)))
        }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export default function ProjectDetailClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)
            return params.toString()
        },
        [searchParams]
    )

    const id = searchParams.get("id") || ""
    const { t, locale } = useTranslation()
    const { getProject, addTask, addSubProject, deleteSubProject, deleteTask, toggleTask, updateTask, expenses, files, addFile, currentUser, users, incomes, customers, isLoading, currentTeam, works, addWork, updateWork, deleteWork, updateWorkOrder } = useProjects()
    const [activeTab, setActiveTab] = useState("overview")
    const project = getProject(id)

    // Work / Gantt State
    const [isAddWorkOpen, setIsAddWorkOpen] = useState(false)
    const [editingWork, setEditingWork] = useState<any>(null)

    const projectFiles = files.filter(f => f.projectId === id)

    // Helper to parse budget string "1,000,000" -> 1000000
    const parseBudget = (val?: string | number) => {
        if (!val) return 0
        if (typeof val === 'number') return val
        return parseFloat(val.replace(/,/g, '')) || 0
    }


    // Expense State
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [selectedSubProjectId, setSelectedSubProjectId] = useState<string | null>(null)
    const [isAddSubProjectOpen, setIsAddSubProjectOpen] = useState(false)
    const [newSubProjectName, setNewSubProjectName] = useState("")
    const [userFilter, setUserFilter] = useState<string>("all")
    const [monthFilter, setMonthFilter] = useState<string>("all")
    const [activeFinancialTab, setActiveFinancialTab] = useState<'expenses' | 'incomes'>('expenses')
    const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)
    const [deleteSubProjectConfirm, setDeleteSubProjectConfirm] = useState<{ isOpen: boolean; subProjectId: string | null }>({
        isOpen: false,
        subProjectId: null
    })
    const [isClient, setIsClient] = useState(false)

    // Income Grouping State
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
    }

    // MEMOIZED GANTT HANDLERS
    // Moved to top level to prevent "Rendered fewer hooks" error
    const projectWorks = useMemo(() => works.filter(w => w.projectId === id), [works, id])

    const handleWorkClick = useCallback((workId: string) => {
        const work = projectWorks.find(w => w.id === workId)
        if (work) {
            setEditingWork(work)
            setIsAddWorkOpen(true)
        }
    }, [projectWorks])

    const handleAddWork = useCallback(() => {
        setEditingWork(null)
        setIsAddWorkOpen(true)
    }, [])

    const handleWorkReorder = useCallback(async (newWorks: any[]) => {
        const updates = newWorks.map((w, index) => ({
            id: w.id,
            sortOrder: index
        }))
        await updateWorkOrder(updates)
    }, [updateWorkOrder])

    useEffect(() => {
        setIsClient(true)
        const taskId = searchParams.get("taskId")
        if (taskId) {
            setSelectedTaskId(taskId)
            setActiveTab("tasks")
        } else {
            setSelectedTaskId(null)
        }

        const expenseId = searchParams.get("expenseId")
        if (expenseId) {
            setSelectedExpenseId(expenseId)
        } else {
            setSelectedExpenseId(null)
        }
    }, [searchParams])

    const handleExportCSV = (type: 'Expense' | 'Income') => {
        let headers: string[] = []
        let rows: (string | number)[] = []
        const filename = `${project?.name || 'Project'}_${type}_Report_${new Date().toISOString().split('T')[0]}.csv`

        if (type === 'Expense') {
            headers = ['Date', 'Category', 'Description', 'Payee', 'Amount', 'Status']
            rows = projectExpenses.map(e => [
                e.date,
                e.category,
                `"${e.title.replace(/"/g, '""')}"`,
                `"${(e.payee || '').replace(/"/g, '""')}"`,
                e.totalValue,
                e.status
            ]) as any
        } else {
            const data = incomes.filter(i => i.projectId === id || i.projectId === project?.name)
            headers = ['Date', 'Doc No', 'Type', 'Customer', 'Amount', 'Status']
            rows = data.map(d => [
                d.date,
                d.documentNumber,
                d.type,
                `"${(customers.find(c => c.id === d.customerId)?.name || project?.customer || 'Unknown').replace(/"/g, '""')}"`,
                d.grandTotal || 0,
                d.status
            ]) as any
        }

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Add BOM for Excel support
            + headers.join(",") + "\n"
            + rows.map((r: any) => r.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Generic CSV Export for Sub-project data
    const exportSubProjectCSV = (data: any[], fileName: string) => {
        const headers = ["Date", "Description", "Category", "Amount", "Status", "Payee"]
        const csvContent = [
            headers.join(","),
            ...data.map(item => [
                item.date,
                `"${item.title.replace(/"/g, '""')}"`,
                item.category,
                item.totalValue || 0,
                item.status,
                item.payee || ""
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", fileName)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // 1. Get all raw data for this project
    // Match incomes by projectId OR by project name (for backward compatibility with old data)
    const allIncomesForProject = incomes.filter(i => i.projectId === id || i.projectId === project?.name)
    const rawProjectExpenses = expenses.filter(e => e.projectId === id || e.items?.some(i => i.projectId === id))
    // Filter: If user has FINANCIAL_VIEW, show all. Else, show only their own (Payee/PaidBy).
    const allProjectExpenses = hasPermission(currentTeam?.role, "FINANCIAL_VIEW")
        ? rawProjectExpenses
        : rawProjectExpenses.filter(e => e.payee === currentUser?.name || e.paidBy === currentUser?.name)
    const allProjectIncomes = allIncomesForProject.filter(i => i.status === 'Paid' || (i.type === 'Receipt' && i.status !== 'Cancelled')) // Count Paid incomes & Receipts for "Received" total

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
    const totalExpenses = projectExpenses.reduce((sum, e) => sum + getExpenseAmountForProject(e, id), 0)
    const totalIncome = projectIncomes.reduce((sum, i) => sum + i.grandTotal, 0)
    const totalProfit = totalIncome - totalExpenses

    // Calculate All-Time Expenses specifically for the Header (ignoring month filters)
    const allTimeExpenses = allProjectExpenses.reduce((sum, e) => sum + getExpenseAmountForProject(e, id), 0)

    useEffect(() => {
        // Scroll to top of both window and our custom scroll container
        window.scrollTo(0, 0)
        const container = document.getElementById("main-scroll-container")
        if (container) {
            container.scrollTo({ top: 0, behavior: 'instant' })
        }
    }, [id])

    // Memoize handlers to prevent re-renders
    // Using useCallback with dependency on updateWork
    const handleWorkUpdate = useCallback(async (workId: string, updates: any) => {
        if (!project?.id) return
        await updateWork(project.id, workId, updates)
    }, [project?.id, updateWork])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground animate-pulse">Loading project data...</p>
                </div>
            </div>
        )
    }

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
            <ConfirmDialog
                isOpen={deleteSubProjectConfirm.isOpen}
                onClose={() => setDeleteSubProjectConfirm({ isOpen: false, subProjectId: null })}
                onConfirm={async () => {
                    if (deleteSubProjectConfirm.subProjectId) {
                        await deleteSubProject(project.id, deleteSubProjectConfirm.subProjectId)
                        setDeleteSubProjectConfirm({ isOpen: false, subProjectId: null })
                        setSelectedSubProjectId(null)
                    }
                }}
                title="ลบโปรเจคย่อย"
                message="คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจคย่อยนี้? ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกตัดการเชื่อมต่อ"
                confirmText="ลบข้อมูล"
                cancelText="ยกเลิก"
                variant="danger"
            />
            <ProjectHeader project={project} totalExpenses={allTimeExpenses} />

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
                    onClick={() => setActiveTab("sub_projects")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === "sub_projects"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-background/50 hover:bg-muted/50 text-muted-foreground"
                    )}
                >
                    <Target className="w-4 h-4" />
                    {t.projects.detail.tabs.sub_projects}
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
                    onClick={() => setActiveTab("schedule")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === "schedule"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-background/50 hover:bg-muted/50 text-muted-foreground"
                    )}
                >
                    <Calendar className="w-4 h-4" />
                    Schedule
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
                    <>
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
                                    <FileText className="w-5 h-5 text-primary" />
                                    {t.projects.detail.overview.details}
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Customer</p>
                                            <div className="flex items-center gap-2 font-semibold">
                                                <User className="w-4 h-4 text-primary" />
                                                {project.customer}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Location</p>
                                            <div className="flex items-center gap-2 font-semibold">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {getGoogleMapsUrl(project.location) ? (
                                                    <a
                                                        href={getGoogleMapsUrl(project.location)!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline underline-offset-4"
                                                    >
                                                        {project.location}
                                                    </a>
                                                ) : (
                                                    project.location
                                                )}
                                            </div>
                                        </div>
                                        {hasPermission(currentTeam?.role, "FINANCIAL_VIEW") && (
                                            <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                                                <p className="text-xs text-muted-foreground font-medium uppercase">Contract Value</p>
                                                <div className="flex items-center gap-2 font-semibold text-green-500">
                                                    <DollarSign className="w-4 h-4" />
                                                    {project.budget}
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Total Tasks</p>
                                            <div className="flex items-center gap-2 font-semibold">
                                                <CheckSquare className="w-4 h-4 text-blue-500" />
                                                {project.tasks?.length || 0} Tasks
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Description</p>
                                        <p className="text-muted-foreground leading-relaxed text-sm">
                                            {project.description || t.projects.detail.overview.no_desc}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    {t.projects.detail.overview.timeline} & Status
                                </h3>

                                <div className="space-y-4 flex-1">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-muted-foreground text-sm font-medium">{t.projects.detail.overview.start_date}</span>
                                            <span className="font-bold">
                                                {project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-muted-foreground text-sm font-medium">{t.projects.detail.overview.end_date}</span>
                                            <span className="font-bold">
                                                {project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-muted-foreground text-sm font-medium">{t.projects.detail.overview.current_status}</span>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                                project.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            )}>
                                                {project.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mini Task Stats */}
                                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium uppercase">Task Progress</p>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-muted/30 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{ width: `${(project.tasks?.filter(t => t.status === 'Done').length || 0) / (project.tasks?.length || 1) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{project.tasks?.filter(t => t.status === 'Done').length || 0} Done</span>
                                            <span>{project.tasks?.length || 0} Total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </>
                )}

                {activeTab === 'schedule' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Calendar className="w-6 h-6 text-primary" />
                                    Working Schedule
                                </h3>
                                <p className="text-muted-foreground">Manage project timeline and dependencies.</p>
                            </div>
                        </div>

                        <ProjectGantt
                            projectId={project.id}
                            works={projectWorks}
                            onWorkUpdate={handleWorkUpdate}
                            onWorkClick={handleWorkClick}
                            onAddWork={handleAddWork}
                            onReorder={handleWorkReorder}
                        />
                    </div >
                )}


                {
                    activeTab === 'financials' && (
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

                            {/* High Level Stats - Only for Financial Viewers */}
                            {hasPermission(currentTeam?.role, "FINANCIAL_VIEW") && (
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
                            )}

                            {/* Sub-Tabs Switcher */}
                            <div className="flex bg-muted/30 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setActiveFinancialTab('expenses')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                        activeFinancialTab === 'expenses'
                                            ? "bg-white text-black shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Expenses (รายจ่าย)
                                </button>
                                {hasPermission(currentTeam?.role, "INCOME_CREATE") && (
                                    <button
                                        onClick={() => setActiveFinancialTab('incomes')}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                            activeFinancialTab === 'incomes'
                                                ? "bg-white text-black shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Incomes (รายรับ)
                                    </button>
                                )}
                            </div>

                            {/* EXPENSES TAB CONTENT */}
                            {activeFinancialTab === 'expenses' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Detailed Expense Breakdown - Horizontal Scrollable */}
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        <div className="glass-card p-4 rounded-xl border border-white/5 bg-orange-500/5 min-w-[140px] flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-500">
                                                    <TrendingDown className="w-3.5 h-3.5" />
                                                </div>
                                                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">{t.projects.detail.financials.material}</p>
                                            </div>
                                            <p className="text-lg font-black text-orange-500">
                                                ฿{getCategoryExpenseForProject(projectExpenses, id, 'Material').toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {projectExpenses.filter(e => e.category === 'Material').length} txn
                                            </p>
                                        </div>

                                        <div className="glass-card p-4 rounded-xl border border-white/5 bg-blue-500/5 min-w-[140px] flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-500">
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">{t.projects.detail.financials.labor}</p>
                                            </div>
                                            <p className="text-lg font-black text-blue-500">
                                                ฿{getCategoryExpenseForProject(projectExpenses, id, 'Labor').toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {projectExpenses.filter(e => e.category === 'Labor').length} txn
                                            </p>
                                        </div>

                                        <div className="glass-card p-4 rounded-xl border border-white/5 bg-purple-500/5 min-w-[140px] flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-500">
                                                    <TrendingDown className="w-3.5 h-3.5" />
                                                </div>
                                                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">{t.projects.detail.financials.subcontract}</p>
                                            </div>
                                            <p className="text-lg font-black text-purple-500">
                                                ฿{getCategoryExpenseForProject(projectExpenses, id, 'Sub-contract').toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {projectExpenses.filter(e => e.category === 'Sub-contract').length} txn
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-lg">{t.projects.detail.financials.history}</h4>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleExportCSV('Expense')}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                                                    title="Export CSV"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                </button>
                                                {isClient && (
                                                    <button
                                                        onClick={async () => {
                                                            const toastId = toast.loading("Generating PDF...")
                                                            try {
                                                                const { generateServerPDF, generateExpenseReportHTML } = await import('@/lib/server-pdf')
                                                                const html = generateExpenseReportHTML(
                                                                    project?.name || 'Project',
                                                                    projectExpenses.map(e => ({
                                                                        date: e.date,
                                                                        category: e.category,
                                                                        title: e.title,
                                                                        status: e.status,
                                                                        amount: e.amount,
                                                                        totalValue: e.totalValue
                                                                    }))
                                                                )
                                                                await generateServerPDF(html, `${project?.name || 'Project'}_Expense_Report.pdf`)
                                                                toast.dismiss(toastId)
                                                                toast.success("PDF Downloaded")
                                                            } catch (error) {
                                                                console.error("PDF Generate Error", error)
                                                                toast.dismiss(toastId)
                                                                toast.error("Failed to generate PDF")
                                                            }
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                                                        title="Export PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setIsAddExpenseOpen(true)}
                                                    className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-sm"
                                                    title={t.projects.detail.financials.add_expense}
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                            {projectExpenses.length > 0 ? (
                                                projectExpenses.map((expense) => (
                                                    <div
                                                        key={expense.id}
                                                        onClick={() => router.push(`${pathname}?${createQueryString('expenseId', expense.id)}`, { scroll: false })}
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
                                                                    {expense.paidBy && (
                                                                        <>
                                                                            <span className="text-primary font-medium">By {expense.paidBy}</span>
                                                                            <span>•</span>
                                                                        </>
                                                                    )}
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

                            {/* INCOMES TAB CONTENT */}
                            {activeFinancialTab === 'incomes' && hasPermission(currentTeam?.role, "INCOME_CREATE") && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-lg">Income Documents (เอกสารรายรับ)</h4>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleExportCSV('Income')}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                                                    title="Export CSV"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                </button>
                                                {isClient && (
                                                    <button
                                                        onClick={async () => {
                                                            const { generateServerPDF, generateExpenseReportHTML } = await import('@/lib/server-pdf')
                                                            const projectIncomes = incomes.filter(i => i.projectId === id)
                                                            const html = generateExpenseReportHTML(
                                                                project?.name || 'Project',
                                                                projectIncomes.map(i => ({
                                                                    date: i.date,
                                                                    category: i.type,
                                                                    title: i.documentNumber,
                                                                    status: i.status,
                                                                    amount: i.grandTotal,
                                                                    totalValue: i.grandTotal
                                                                }))
                                                            )
                                                            await generateServerPDF(html, `${project?.name || 'Project'}_Income_Report.pdf`)
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                                                        title="Export PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setIsAddIncomeOpen(true)}
                                                    className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-sm"
                                                    title="New Document"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* All Income Documents List */}
                                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                            {/* Use allIncomesForProject to include backward compatible project matching */}
                                            {allIncomesForProject.length > 0 ? (
                                                groupIncomes(allIncomesForProject).map((group) => (
                                                    <div key={group.id} className="glass-card rounded-xl border border-white/5 overflow-hidden">
                                                        {/* Group Header */}
                                                        <div
                                                            onClick={() => toggleGroup(group.id)}
                                                            className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-base">{group.title}</h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-xs text-muted-foreground">{group.date}</span>
                                                                        <div className="h-3 w-px bg-white/10" />
                                                                        <div className="flex gap-1">
                                                                            {group.types.includes('Quotation') && (
                                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">QT</span>
                                                                            )}
                                                                            {group.types.includes('Invoice') && (
                                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">INV</span>
                                                                            )}
                                                                            {group.types.includes('Receipt') && (
                                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">REC</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-right flex items-center gap-4">
                                                                <div>
                                                                    <p className="font-bold text-base">฿{group.totalAmount.toLocaleString()}</p>
                                                                    <p className="text-xs text-muted-foreground">{group.documents.length} Document{group.documents.length > 1 ? 's' : ''}</p>
                                                                </div>
                                                                {expandedGroups[group.id] ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                                                            </div>
                                                        </div>

                                                        {/* Expanded Content */}
                                                        {expandedGroups[group.id] && (
                                                            <div className="border-t border-white/5 bg-black/20 p-2 space-y-1">
                                                                {group.documents.map((doc) => (
                                                                    <div
                                                                        key={doc.id}
                                                                        // Link to income page or open preview? For now, we can link or use a dialog trigger if available
                                                                        // Since specific handlers aren't passed down, we'll keep it as a visual list or simple link
                                                                        className="p-3 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors ml-4 border-l-2 border-white/10"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={cn(
                                                                                "text-[10px] font-bold px-2 py-0.5 rounded w-12 text-center",
                                                                                doc.type === 'Quotation' ? "bg-blue-500/10 text-blue-500" :
                                                                                    doc.type === 'Invoice' ? "bg-orange-500/10 text-orange-500" :
                                                                                        "bg-green-500/10 text-green-500"
                                                                            )}>
                                                                                {doc.type === 'Quotation' ? 'QT' : doc.type === 'Invoice' ? 'INV' : 'REC'}
                                                                            </span>
                                                                            <div>
                                                                                <p className="text-sm font-medium">{doc.documentNumber}</p>
                                                                                <p className="text-[10px] text-muted-foreground">{doc.date}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={cn(
                                                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                                                doc.status === 'Paid' || doc.status === 'Accepted' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                                                    doc.status === 'Sent' || doc.status === 'Invoiced' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                                                        doc.status === 'Draft' ? "bg-slate-500/10 text-slate-500 border-slate-500/20" :
                                                                                            "bg-red-500/10 text-red-500 border-red-500/20"
                                                                            )}>
                                                                                {doc.status}
                                                                            </span>
                                                                            <span className="text-sm font-medium w-24 text-right">฿{doc.grandTotal?.toLocaleString()}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="glass-card p-8 rounded-3xl min-h-[200px] flex flex-col items-center justify-center text-center space-y-4 border border-white/5">
                                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                                        <FileText className="w-8 h-8 text-muted-foreground" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">No income documents for this project yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* TASKS TAB CONTENT */}
                {
                    activeTab === 'tasks' && (
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
                                                    <option key={u.id} value={u.id}>{u.name}</option>
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
                                <TaskBoard
                                    projectId={project.id}
                                    tasks={project.tasks || []}
                                    users={users}
                                    currentUser={currentUser}
                                    userFilter={userFilter}
                                    onUpdateTask={updateTask}
                                    onDeleteTask={deleteTask}
                                    onToggleTask={toggleTask}
                                    onSelectTask={(id) => router.push(`${pathname}?${createQueryString('taskId', id)}`, { scroll: false })}
                                    t={t}
                                />
                            </div>
                        </div>
                    )
                }


                {
                    activeTab === 'files' && (
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
                    )
                }
                {
                    activeTab === 'sub_projects' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    {t.projects.detail.tabs.sub_projects}
                                </h3>
                                <button
                                    onClick={() => setIsAddSubProjectOpen(true)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Plus className="w-4 h-4" /> {locale === 'th' ? "เพิ่มโปรเจคย่อย" : "Add Sub-project"}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* General / Unassigned Expenses Card */}
                                {(() => {
                                    const projectTotalExpenses = expenses
                                        .filter(e => e.projectId === project.id && e.status !== 'Advanced')
                                        .reduce((sum, e) => sum + e.totalValue, 0)

                                    const generalExpenses = expenses
                                        .filter(e => e.projectId === project.id && !e.subProjectId && e.status !== 'Advanced')
                                        .reduce((sum, e) => sum + e.totalValue, 0)

                                    const percentage = projectTotalExpenses > 0 ? (generalExpenses / projectTotalExpenses) * 100 : 0

                                    if (generalExpenses > 0) {
                                        return (
                                            <div
                                                onClick={() => setSelectedSubProjectId('general')}
                                                className="group bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:bg-white/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-500/10 to-transparent rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />

                                                <div className="relative">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="p-2.5 bg-gray-500/10 rounded-xl text-gray-500 group-hover:bg-gray-500 group-hover:text-white transition-colors">
                                                            <Layers className="w-5 h-5" />
                                                        </div>
                                                    </div>

                                                    <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                                                        {locale === 'th' ? "ค่าใช้จ่ายทั่วไป" : "General Expenses"}
                                                    </h4>

                                                    {/* Financial Progress Bar (Contribution) */}
                                                    <div className="space-y-1 mb-4">
                                                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                                            <span>Expense Proportion</span>
                                                            <span>
                                                                ฿{generalExpenses.toLocaleString()} / ฿{projectTotalExpenses.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gray-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-right text-muted-foreground">{percentage.toFixed(1)}%</p>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                        {locale === 'th' ? "ค่าใช้จ่ายส่วนกลางที่ไม่ได้ระบุโปรเจคย่อย" : "Common expenses not assigned to any sub-project"}
                                                    </p>
                                                </div>

                                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                                    <div className="p-1.5 bg-gray-500 rounded-full text-white shadow-sm">
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                })()}

                                {project.subProjects && project.subProjects.length > 0 ? (
                                    project.subProjects.map((sp) => {
                                        // Calculate Total Project Expenses (Denominator)
                                        const projectTotalExpenses = expenses
                                            .filter(e => e.projectId === project.id && e.status !== 'Advanced') // Consistent filter
                                            .reduce((sum, e) => sum + e.totalValue, 0)

                                        const spExpenses = expenses
                                            .filter(e => e.subProjectId === sp.id && e.status !== 'Advanced')
                                            .reduce((sum, e) => sum + e.totalValue, 0)

                                        // Avoid division by zero
                                        const percentage = projectTotalExpenses > 0 ? (spExpenses / projectTotalExpenses) * 100 : 0

                                        return (
                                            <div
                                                key={sp.id}
                                                onClick={() => setSelectedSubProjectId(sp.id)}
                                                className="group bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:bg-white/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />

                                                <div className="relative">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                            <Target className="w-5 h-5" />
                                                        </div>
                                                    </div>

                                                    <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{sp.name}</h4>

                                                    {/* Financial Progress Bar (Contribution) */}
                                                    <div className="space-y-1 mb-4">
                                                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                                            <span>Expense Proportion (สัดส่วนรายจ่าย)</span>
                                                            <span>
                                                                ฿{spExpenses.toLocaleString()} / ฿{projectTotalExpenses.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn("h-full rounded-full transition-all duration-500",
                                                                    // Color logic: simply primary for contribution, usually doesn't need red unless we tracked against sp budget.
                                                                    // But let's keep it simple blue for proportion, or maybe gradient?
                                                                    "bg-primary"
                                                                )}
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-right text-muted-foreground">{percentage.toFixed(1)}%</p>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                        {sp.description || (locale === 'th' ? "ไม่มีรายละเอียด" : "No description provided")}
                                                    </p>

                                                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground border-t border-white/5 pt-3">
                                                        {sp.budget && (
                                                            <div className="flex items-center gap-1.5">
                                                                <DollarSign className="w-3.5 h-3.5" />
                                                                {sp.budget}
                                                            </div>
                                                        )}
                                                        {sp.startDate && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {new Date(sp.startDate).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                                    <div className="p-1.5 bg-primary rounded-full text-primary-foreground shadow-sm">
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed border-white/10">
                                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                                            <Target className="w-8 h-8 text-muted-foreground/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-lg">{t.projects.detail.tabs.sub_projects}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {locale === 'th' ? "ยังไม่มีโปรเจคย่อย เริ่มต้นสร้างเลย!" : "No sub-projects found. Create one to get started!"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsAddSubProjectOpen(true)}
                                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                        >
                                            {locale === 'th' ? "สร้างโปรเจคย่อย" : "Create Sub-project"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </div >



            {/* Dialogs */}
            < AddExpenseDialog
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                defaultProjectId={project.id}
            />

            <AddTaskDialog
                isOpen={isAddTaskOpen}
                onClose={() => setIsAddTaskOpen(false)}
                defaultProjectId={project.id}
            />

            <AddWorkDialog
                isOpen={isAddWorkOpen}
                onOpenChange={setIsAddWorkOpen}
                projectId={project.id}
                initialData={editingWork}
            />

            <AddIncomeDialog
                open={isAddIncomeOpen}
                onOpenChange={setIsAddIncomeOpen}
                defaultProjectId={project.id}
                defaultCustomerId={project.customerId}
            />

            <ExpenseDetailSheet
                expenseId={selectedExpenseId}
                onClose={() => {
                    if (searchParams.has('expenseId')) router.back()
                    else setSelectedExpenseId(null)
                }}
            />

            {/* Task/Sub-project Detail Sheet */}
            {
                selectedTaskId && (
                    <TaskDetailSheet
                        onClose={() => {
                            if (searchParams.has('taskId')) router.back()
                            else setSelectedTaskId(null)
                        }}
                        taskId={selectedTaskId}
                    />
                )
            }

            {/* Add Sub-project Dialog */}
            {
                isAddSubProjectOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsAddSubProjectOpen(false)}
                        />
                        <div className="relative bg-background border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom-4">
                            <h3 className="text-lg font-bold">Add Sub-project (โปรเจคย่อย)</h3>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Sub-project name..."
                                    value={newSubProjectName}
                                    onChange={(e) => setNewSubProjectName(e.target.value)}
                                    className="w-full px-4 py-3 bg-muted/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        if (newSubProjectName.trim()) {
                                            addSubProject(project.id, {
                                                name: newSubProjectName.trim(),
                                                status: "Planning"
                                            })
                                            setNewSubProjectName("")
                                            setIsAddSubProjectOpen(false)
                                        }
                                    }}
                                    disabled={!newSubProjectName.trim()}
                                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    Add Sub-project
                                </button>
                                <button
                                    onClick={() => {
                                        setNewSubProjectName("")
                                        setIsAddSubProjectOpen(false)
                                    }}
                                    className="px-6 py-3 border border-white/10 rounded-xl font-medium hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Sub-project Detail Sheet */}
            {
                selectedSubProjectId && (() => {
                    // Handle General / Mock Sub-project
                    const isGeneral = selectedSubProjectId === 'general'
                    const selectedSP = isGeneral
                        ? {
                            id: 'general',
                            name: locale === 'th' ? "ค่าใช้จ่ายทั่วไป" : "General Expenses",
                            description: locale === 'th' ? "ค่าใช้จ่ายส่วนกลางที่ไม่ได้ระบุโปรเจคย่อย" : "Common expenses not assigned to any sub-project",
                            budget: null,
                            startDate: null
                        }
                        : project.subProjects?.find(sp => sp.id === selectedSubProjectId)

                    if (!selectedSP) return null

                    // Filter Logic
                    const subProjectExpenses = expenses.filter(e =>
                        isGeneral
                            ? (e.projectId === project.id && !e.subProjectId)
                            : e.subProjectId === selectedSP.id
                    )

                    const subProjectTasks = (project.tasks || []).filter(t =>
                        isGeneral
                            ? (t.projectId === project.id && !t.subProjectId)
                            : t.subProjectId === selectedSP.id
                    )

                    return (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setSelectedSubProjectId(null)}
                            />
                            <div className="relative bg-background border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-md lg:max-w-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4">
                                {/* Header - Fixed */}
                                <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 shrink-0">
                                    <h3 className="text-lg font-bold">{isGeneral ? (locale === 'th' ? "รายละเอียด" : "Details") : "Sub-project Details"}</h3>
                                    <button
                                        onClick={() => setSelectedSubProjectId(null)}
                                        className="p-2 hover:bg-muted rounded-full transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
                                        {/* Left Column: Info + Tasks */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Name</p>
                                                <p className="font-semibold text-lg">{selectedSP.name}</p>
                                            </div>

                                            {selectedSP.budget && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Budget</p>
                                                    <p className="font-medium">{selectedSP.budget}</p>
                                                </div>
                                            )}

                                            {selectedSP.description && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Description</p>
                                                    <p className="text-sm text-muted-foreground">{selectedSP.description}</p>
                                                </div>
                                            )}

                                            {/* Tasks */}
                                            <div className="pt-2 border-t border-white/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                                        <CheckSquare className="w-3 h-3 text-primary" /> Tasks
                                                    </h4>
                                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                                                        {subProjectTasks.length}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {subProjectTasks.length > 0 ? (
                                                        subProjectTasks.map(task => (
                                                            <div
                                                                key={task.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedSubProjectId(null)
                                                                    setActiveTab('tasks')
                                                                    router.push(`${pathname}?${createQueryString('taskId', task.id)}`, { scroll: false })
                                                                }}
                                                                className="text-xs p-2 bg-muted/30 rounded-lg flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors group"
                                                            >
                                                                <span className="truncate group-hover:text-primary transition-colors">{task.title}</span>
                                                                <span className={cn(
                                                                    "px-1.5 py-0.5 rounded text-[10px]",
                                                                    task.status === 'Done' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                                                )}>{task.status}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground italic">No tasks assigned</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Expenses */}
                                        <div className="pt-4 border-t border-white/10 lg:pt-0 lg:border-t-0 lg:border-l lg:border-white/10 lg:pl-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-bold flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-primary" /> Expenses
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                                        {subProjectExpenses.length}
                                                    </span>
                                                </h4>

                                                <div className="flex gap-2">
                                                    {/* CSV Export */}
                                                    <button
                                                        onClick={() => exportSubProjectCSV(
                                                            subProjectExpenses,
                                                            `Expenses-${selectedSP.name}.csv`
                                                        )}
                                                        className="p-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg flex items-center gap-1 transition-colors"
                                                        title="Export CSV"
                                                    >
                                                        <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                                                    </button>

                                                    {/* PDF Export - Server-side with Thai support */}
                                                    <button
                                                        onClick={async () => {
                                                            const { generateServerPDF, generateExpenseReportHTML } = await import('@/lib/server-pdf')
                                                            const html = generateExpenseReportHTML(
                                                                `${project.name} - ${selectedSP.name}`,
                                                                subProjectExpenses.map(e => ({
                                                                    date: e.date,
                                                                    category: e.category,
                                                                    title: e.title,
                                                                    status: e.status,
                                                                    amount: e.amount,
                                                                    totalValue: e.totalValue
                                                                }))
                                                            )
                                                            await generateServerPDF(html, `Expenses-${selectedSP.name}.pdf`)
                                                        }}
                                                        className="p-1.5 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg flex items-center gap-1 transition-colors"
                                                    >
                                                        <File className="w-3.5 h-3.5" /> PDF
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {subProjectExpenses.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {/* Total Summary */}
                                                        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 flex justify-between items-center mb-2">
                                                            <span className="text-xs font-bold uppercase text-primary">Total Expenses</span>
                                                            <span className="font-bold text-lg text-primary">
                                                                ฿{subProjectExpenses
                                                                    .reduce((sum, e) => sum + (e.totalValue || 0), 0)
                                                                    .toLocaleString()}
                                                            </span>
                                                        </div>

                                                        {/* Detailed List */}
                                                        {subProjectExpenses.map(expense => (
                                                            <div
                                                                key={expense.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    router.push(`${pathname}?${createQueryString('expenseId', expense.id)}`, { scroll: false })
                                                                }}
                                                                className="p-3 bg-muted/30 rounded-xl border border-white/5 hover:bg-muted/50 transition-all cursor-pointer group space-y-2"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div className="space-y-0.5">
                                                                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{expense.title}</p>
                                                                        <p className="text-xs text-muted-foreground">{expense.date} • {expense.category}</p>
                                                                    </div>
                                                                    <span className="font-bold text-sm">{expense.amount}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded-full uppercase text-[10px] font-bold",
                                                                        expense.status === 'Paid' ? "bg-green-500/10 text-green-500" :
                                                                            expense.status === 'Unpaid' ? "bg-red-500/10 text-red-500" :
                                                                                "bg-yellow-500/10 text-yellow-500"
                                                                    )}>
                                                                        {expense.status}
                                                                    </span>
                                                                    {expense.payee && <span className="text-muted-foreground">Payee: {expense.payee}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-white/10">
                                                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                        <p className="text-sm">No expenses recorded for this sub-project</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer - Fixed */}
                                <div className="flex gap-3 p-6 pt-4 border-t border-white/10 shrink-0">
                                    {!isGeneral && (
                                        <button
                                            onClick={() => setDeleteSubProjectConfirm({ isOpen: true, subProjectId: selectedSP.id })}
                                            className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedSubProjectId(null)}
                                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })()
            }
        </div >
    )
}
