"use client"

import * as React from "react"
import { Plus, Search, Filter, Camera, ScanLine, Tag, Wallet, TrendingDown, LayoutGrid, Hammer, Users, FileText, CreditCard, Archive, RefreshCcw, ArrowDownAZ, FileDown } from "lucide-react"
import { SmartScanDialog } from "@/components/expenses/smart-scan-dialog"
import { useProjects, ExpenseCategory } from "@/context/project-context"
import { cn } from "@/lib/utils"
import AddExpenseDialog from "@/components/expenses/add-expense-dialog"
import { ExpenseEntrySelectionDialog } from "@/components/expenses/expense-entry-selection-dialog"
import ExpenseDetailSheet from "@/components/expenses/expense-detail-sheet"
import { useSearchParams, useRouter } from "next/navigation"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"

import { useTranslation } from "@/lib/i18n-context"
import { CheckCircle2 } from "lucide-react"
import { Suspense } from "react"

import { useSettings } from "@/context/settings-context"
import { saveAs } from "file-saver"
import { pdf } from "@react-pdf/renderer"
import { ExpensesPDF } from "@/components/expenses/expenses-pdf"

const FINANCIAL_TARGETS_KEY = "financial-targets" // Keep for legacy cleanup or remove if not needed, but safe to keep constant

function ExpensesContent() {
    const { expenses, archivedExpenses, projects, users, currentUser, currentTeam, updateExpense, isFinanceLoading } = useProjects()
    const { financialTargets } = useSettings() // Use global settings
    const { t } = useTranslation()
    const searchParams = useSearchParams()
    const router = useRouter()
    // Combined State: isAddOpen controls the dialog, startScanning passes the intent
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [isSelectionOpen, setIsSelectionOpen] = React.useState(false)
    const [startScanning, setStartScanning] = React.useState(false)
    const [isContractOpen, setIsContractOpen] = React.useState(false)
    const [isSmartScanOpen, setIsSmartScanOpen] = React.useState(false)
    const [scannedData, setScannedData] = React.useState<any>(null)

    const [selectedExpenseId, setSelectedExpenseId] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [categoryFilter, setCategoryFilter] = React.useState<ExpenseCategory | "All">("All")
    const [statusFilter, setStatusFilter] = React.useState<string>("All")
    const [projectFilter, setProjectFilter] = React.useState<string>("all")
    const [userFilter, setUserFilter] = React.useState<string>("all")
    const [monthFilter, setMonthFilter] = React.useState<string>("all")
    const [showArchived, setShowArchived] = React.useState(false)

    // Check for 'action=new' param
    // Check for 'action=new' or 'editId' or 'id' params (from Notifications)
    React.useEffect(() => {
        const action = searchParams.get('action')
        const editId = searchParams.get('editId')
        const id = searchParams.get('id')

        if (action === 'new') {
            setIsSelectionOpen(true)
            router.replace('/expenses')
        } else if (editId) {
            setSelectedExpenseId(editId)
            router.replace('/expenses')
        } else if (id) {
            setSelectedExpenseId(id)
            router.replace('/expenses')
        }
    }, [searchParams, router])

    const handleOpenAdd = () => {
        setStartScanning(false)
        setIsAddOpen(true)
    }

    // NEW: State for export dropdown
    const [isExportOpen, setIsExportOpen] = React.useState(false)
    const exportRef = React.useRef<HTMLDivElement>(null)

    // Click Outside to Close Export Dropdown
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Handle export dropdown outside click
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleOpenScan = () => {
        setStartScanning(true)
        setIsAddOpen(true)
    }

    const handleCloseAdd = () => {
        setIsAddOpen(false)
        setStartScanning(false)
        setScannedData(null)
    }

    // Available Months
    const availableMonths = React.useMemo(() => {
        return Array.from(new Set(expenses.map(e => e.date.substring(0, 7)))).sort().reverse()
    }, [expenses])

    // Filter Logic
    // Step 1: Base Filter
    const sourceExpenses = React.useMemo(() => showArchived ? archivedExpenses : expenses, [showArchived, archivedExpenses, expenses])

    const baseFilteredExpenses = React.useMemo(() => {
        return sourceExpenses.filter(expense => {
            const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.payee?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = categoryFilter === "All" || expense.category === categoryFilter

            // Check Project Filter
            const matchesProject = projectFilter === "all" ||
                expense.projectId === projectFilter ||
                expense.items?.some(i => i.projectId === projectFilter)

            // Matches User (Payee)
            const matchesUser = userFilter === "all" || expense.payee === userFilter

            // Matches Month
            const matchesMonth = monthFilter === "all" || expense.date.startsWith(monthFilter)

            return matchesSearch && matchesCategory && matchesProject && matchesUser && matchesMonth
        })
    }, [sourceExpenses, searchQuery, categoryFilter, projectFilter, userFilter, monthFilter])

    // Step 2: Final Filter (Base + Status) - used for List View
    const [sortOrder, setSortOrder] = React.useState<'created' | 'date' | 'alphabetical'>('created')

    const filteredExpenses = React.useMemo(() => {
        let result = baseFilteredExpenses.filter(expense => {
            return statusFilter === "All" || expense.status === statusFilter
        })

        return result.sort((a, b) => {
            if (sortOrder === 'created') {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime()
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime()
                return timeB - timeA
            } else if (sortOrder === 'date') {
                const dateA = new Date(a.date).getTime()
                const dateB = new Date(b.date).getTime()
                return dateB - dateA
            } else if (sortOrder === 'alphabetical') {
                return (a.title || "").localeCompare(b.title || "")
            }
            return 0
        })
    }, [baseFilteredExpenses, statusFilter, sortOrder])

    // Calculate Total
    const totalExpense = React.useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => {
            if (curr.status === 'Unpaid') return acc // Don't count cancelled
            return acc + curr.totalValue
        }, 0)
    }, [filteredExpenses])

    // Mood Card Logic
    // Using global financialTargets from useSettings() now
    const finTargets = financialTargets

    // Calculate Monthly Expense for Mood
    const currentMonthPrefix = new Date().toISOString().substring(0, 7) // YYYY-MM

    const monthlyTotalExpense = expenses
        .filter(e => e.date.startsWith(currentMonthPrefix) && e.status !== 'Unpaid') // Exclude cancelled
        .reduce((sum, e) => sum + e.totalValue, 0)

    const expensePercent = Math.min(100, Math.round((monthlyTotalExpense / finTargets.expenseLimit) * 100))

    // Determine Mood
    // Logic: 
    // < 80% : Bag is full (กระเป๋าตุง) - Green
    // 80-100% : Bag is okay (กระเป๋าพอดี) - Orange
    // > 100% : Bag is empty (กระเป๋าขาด) - Red

    let mood = { emoji: "🤑", label: "Rich (กระเป๋าตุง)", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Wallet }

    if (monthlyTotalExpense > finTargets.expenseLimit) {
        mood = { emoji: "💸", label: "Broke (กระเป๋าขาด)", color: "text-red-500", bg: "bg-red-500/10", icon: TrendingDown }
    } else if (monthlyTotalExpense > finTargets.expenseWarning) {
        mood = { emoji: "😬", label: "Tight (กระเป๋าพอดี)", color: "text-orange-500", bg: "bg-orange-500/10", icon: Wallet }
    }

    // Export Logic
    const handleExportCSV = () => {
        if (filteredExpenses.length === 0) return alert("No expenses to export")

        const headers = ["Date", "Title", "Category", "Amount", "Payee", "Status", "Project", "Created By"]
        const csvContent = [
            headers.join(","),
            ...filteredExpenses.map(e => [
                e.date,
                `"${e.title.replace(/"/g, '""')}"`,
                e.category,
                e.totalValue,
                `"${e.payee?.replace(/"/g, '""') || ""}"`,
                e.status,
                `"${projects.find(p => p.id === e.projectId)?.name || "General"}"`,
                `"${users.find(u => u.id === e.createdBy)?.name || "Unknown"}"`
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        saveAs(blob, `expenses_export_${new Date().toISOString().split('T')[0]}.csv`)
    }

    const handleExportPDF = async () => {
        if (filteredExpenses.length === 0) return alert("No expenses to export")
        try {
            const blob = await pdf(
                <ExpensesPDF
                    expenses={filteredExpenses}
                    title={`Expense Report - ${new Date().toLocaleDateString()}`}
                    showImages={true}
                />
            ).toBlob()
            saveAs(blob, `expenses_report_${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
            console.error("PDF generation failed:", error)
            alert("Failed to generate PDF. Check console for details.")
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-[100vw] overflow-x-hidden">
            <AddExpenseDialog
                isOpen={isAddOpen}
                onClose={handleCloseAdd}
                startScanning={startScanning}
                initialData={scannedData}
            />
            <AddContractDialog
                isOpen={isContractOpen}
                onClose={() => setIsContractOpen(false)}
            />
            <ExpenseDetailSheet expenseId={selectedExpenseId} onClose={() => setSelectedExpenseId(null)} />

            <ExpenseEntrySelectionDialog
                isOpen={isSelectionOpen}
                onClose={() => setIsSelectionOpen(false)}
                onSelectManual={handleOpenAdd}
                onSelectScan={() => setIsSmartScanOpen(true)}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        {t.expenses.title} <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">/ Financials</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">{t.expenses.subtitle}</p>
                </div>
                <div className="relative z-20 flex items-center gap-3">
                    {/* Export Button */}
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 bg-muted/50 border border-border text-foreground rounded-xl font-medium shadow-sm hover:bg-muted transition-all",
                                isExportOpen && "bg-muted ring-2 ring-primary/20"
                            )}
                        >
                            <FileDown className="w-5 h-5 text-blue-500" />
                            Export
                        </button>
                        {/* Dropdown Menu - Click & Left Aligned */}
                        {isExportOpen && (
                            <div className="absolute left-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-left">
                                <button
                                    onClick={() => {
                                        handleExportCSV()
                                        setIsExportOpen(false)
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                                >
                                    <span className="font-medium text-sm">Export CSV</span>
                                </button>
                                <div className="h-px bg-border" />
                                <button
                                    onClick={() => {
                                        handleExportPDF()
                                        setIsExportOpen(false)
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                                >
                                    <span className="font-medium text-sm">Export PDF (with Images)</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsContractOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-muted/50 border border-border text-foreground rounded-xl font-medium shadow-sm hover:bg-muted transition-all"
                    >
                        <FileText className="w-5 h-5 text-amber-500" />
                        {t.expenses.create_contract}
                    </button>

                    {/* Add Expense Button - Opens Selection */}
                    <button
                        onClick={() => setIsSelectionOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        {t.expenses.add_expense}
                    </button>
                </div>
            </div>

            <SmartScanDialog
                isOpen={isSmartScanOpen}
                onClose={() => setIsSmartScanOpen(false)}
                onScanComplete={(data) => {
                    setIsSmartScanOpen(false)
                    setStartScanning(false)
                    // Open Add Dialog with scanned data
                    setScannedData(data)
                    setIsAddOpen(true)
                }}
                autoSave={false}
            />

            {/* Mood Card - Expenses (Enhanced) */}
            <div className={`p-6 sm:p-8 rounded-3xl border border-white/10 ${mood.bg} flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden animate-in zoom-in duration-500 slide-in-from-bottom-4`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <mood.icon className="w-32 h-32" />
                </div>

                <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                    <div className="text-6xl sm:text-7xl filter drop-shadow-lg animate-bounce duration-[2000ms]">{mood.emoji}</div>
                    <div className="flex-1">
                        <div className={`font-black text-2xl sm:text-3xl ${mood.color} tracking-tight mb-1`}>{mood.label}</div>
                        <div className="text-sm font-semibold text-muted-foreground uppercase opacity-80 mb-2 tracking-wide">
                            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-base sm:text-lg text-muted-foreground font-medium">
                            Limit: <span className="text-foreground">฿{finTargets.expenseLimit.toLocaleString()}</span>
                        </div>
                        <div className="text-base sm:text-lg text-muted-foreground font-medium">
                            Spent: <span className={`font-bold ${monthlyTotalExpense > finTargets.expenseLimit ? 'text-red-500' : 'text-foreground'}`}>฿{monthlyTotalExpense.toLocaleString()}</span>
                            <span className="text-sm ml-2 opacity-80">({expensePercent}%)</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar & Status */}
                <div className="w-full sm:w-[40%] relative z-10">
                    <div className="h-4 w-full bg-black/10 rounded-full overflow-hidden backdrop-blur-sm border border-black/5">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${monthlyTotalExpense > finTargets.expenseLimit ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                            style={{ width: `${Math.min(100, expensePercent)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-semibold uppercase tracking-wider opacity-60">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>

            {/* Expense Summary Cards (Scrollable) - Contained */}
            <div className="overflow-hidden">
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <div className="flex gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-3">
                        <button
                            onClick={() => setStatusFilter("Pending")}
                            className={cn(
                                "glass-card p-4 rounded-xl border border-white/5 transition-all text-left group",
                                statusFilter === 'Pending' ? "bg-amber-500/10 border-amber-500/50" : "bg-amber-500/5 hover:border-amber-500/30"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform">
                                    <Wallet className="w-4 h-4" />
                                </div>
                                <p className="text-sm font-bold text-amber-400 uppercase tracking-wider">รอชำระ / Pending</p>
                            </div>
                            <p className="text-2xl font-black text-amber-500">
                                ฿{baseFilteredExpenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.totalValue, 0).toLocaleString()}
                            </p>
                        </button>

                        <button
                            onClick={() => setStatusFilter("Advanced")}
                            className={cn(
                                "glass-card p-4 rounded-xl border border-white/5 transition-all text-left group",
                                statusFilter === 'Advanced' ? "bg-purple-500/10 border-purple-500/50" : "bg-purple-500/5 hover:border-purple-500/30"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500 group-hover:scale-110 transition-transform">
                                    <Wallet className="w-4 h-4" />
                                </div>
                                <p className="text-sm font-bold text-purple-400 uppercase tracking-wider">{t.expenses.advanced}</p>
                            </div>
                            <p className="text-2xl font-black text-purple-500">
                                ฿{baseFilteredExpenses.filter(e => e.status === 'Advanced').reduce((sum, e) => sum + e.totalValue, 0).toLocaleString()}
                            </p>
                        </button>

                        <button
                            onClick={() => setStatusFilter("Credit")}
                            className={cn(
                                "glass-card p-4 rounded-xl border border-white/5 transition-all text-left group",
                                statusFilter === 'Credit' ? "bg-blue-500/10 border-blue-500/50" : "bg-blue-500/5 hover:border-blue-500/30"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">{t.expenses.credit}</p>
                            </div>
                            <p className="text-2xl font-black text-blue-500">
                                ฿{baseFilteredExpenses.filter(e => e.status === 'Credit').reduce((sum, e) => sum + e.totalValue, 0).toLocaleString()}
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters & Search - Glass Component */}
            <div className="overflow-hidden">
                <div className="z-30 pt-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl flex flex-col xl:flex-row gap-4 justify-between">
                        <div className="flex gap-4 items-center overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 border shrink-0",
                                    showArchived
                                        ? "bg-gray-500/20 text-gray-500 border-gray-500/50"
                                        : "bg-muted/30 border-white/5 hover:bg-muted/50 text-muted-foreground"
                                )}
                                title={showArchived ? "Show Active" : "Show Archived"}
                            >
                                <Archive className="w-4 h-4" />
                                {showArchived && <span className="text-sm font-semibold">Archived</span>}
                            </button>
                            {/* Filter Tabs */}
                            <div className="flex p-1 bg-muted/30 rounded-xl overflow-x-auto no-scrollbar min-w-0 shrink-0">
                                <div className="flex items-center gap-1">
                                    {[
                                        { id: 'All', icon: LayoutGrid, label: t.expenses.categories.all },
                                        { id: 'Material', icon: Hammer, label: t.expenses.categories.material },
                                        { id: 'Labor', icon: Users, label: t.expenses.categories.labor },
                                        { id: 'Sub-contract', icon: FileText, label: t.expenses.categories.subcontract },
                                        { id: 'Other', icon: Tag, label: t.expenses.categories.other }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setCategoryFilter(tab.id as any)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative whitespace-nowrap",
                                                categoryFilter === tab.id
                                                    ? "bg-foreground text-background shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full xl:w-auto">
                            {/* Month Filter */}
                            <div className="relative min-w-[140px]">
                                <select
                                    value={monthFilter}
                                    onChange={(e) => setMonthFilter(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                                >
                                    <option value="all">All Months</option>
                                    {availableMonths.map(month => (
                                        <option key={month} value={month}>
                                            {new Date(month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="relative min-w-[120px]">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending (รอจ่าย)</option>
                                    <option value="Advanced">Advanced (สำรอง)</option>
                                    <option value="Credit">Credit</option>
                                    <option value="Unpaid">Cancel (ยกเลิก)</option>
                                </select>
                            </div>

                            {/* Project Filter */}
                            <div className="relative min-w-[140px]">
                                <select
                                    value={projectFilter}
                                    onChange={(e) => setProjectFilter(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                                >
                                    <option value="all">All Projects</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* User Filter */}
                            <div className="relative min-w-[120px]">
                                <select
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                                >
                                    <option value="all">All Users</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        {/* Search Bar with Sort Icon */}
                        <div className="flex gap-2 items-center w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-60 group">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <div className="relative bg-muted/30 border border-white/5 rounded-xl flex items-center overflow-hidden transition-colors group-focus-within:bg-background/50 group-focus-within:border-primary/30">
                                    <Search className="w-4 h-4 text-muted-foreground ml-3 group-focus-within:text-primary transition-colors" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t.expenses.filters.search_placeholder}
                                        className="w-full px-3 py-2.5 bg-transparent border-none text-sm focus:outline-none placeholder:text-muted-foreground/50"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="p-1 mr-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center">×</div>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <ArrowDownAZ className="w-4 h-4 text-muted-foreground" />
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as any)}
                                    className="bg-transparent border-none text-sm text-muted-foreground focus:outline-none cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <option value="created">{t.expenses.sort.created}</option>
                                    <option value="date">{t.expenses.sort.date}</option>
                                    <option value="alphabetical">{t.expenses.sort.alphabetical}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-3">
                {isFinanceLoading ? (
                    <div className="text-center py-20 opacity-50">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Loading expenses...</p>
                    </div>
                ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium">{t.expenses.empty}</h3>
                        <p className="text-sm text-muted-foreground">
                            {expenses.length === 0 ? t.expenses.empty_hint : "No expenses match your filters."}
                        </p>
                    </div>
                ) : filteredExpenses.map((expense, index) => {
                    // Check if we need a date divider
                    const currentDate = expense.date
                    const prevExpense = index > 0 ? filteredExpenses[index - 1] : null
                    const showDateDivider = !prevExpense || prevExpense.date !== currentDate
                    const isPaid = expense.status === 'Paid'

                    return (
                        <React.Fragment key={expense.id}>
                            {showDateDivider && (
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground py-2 px-1">
                                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                                    {new Date(currentDate).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            )}
                            <div
                                onClick={() => setSelectedExpenseId(expense.id)}
                                className={cn(
                                    "glass-card p-4 rounded-xl border border-white/5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group overflow-hidden",
                                    expense.isArchived && "opacity-60 grayscale bg-gray-500/5 hover:bg-gray-500/10 border-gray-500/20"
                                )}
                            >
                                <div className="flex gap-4 items-center w-full sm:w-auto min-w-0">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:scale-110 duration-200",
                                        expense.category === 'Material' ? 'bg-orange-500/10 text-orange-500' :
                                            expense.category === 'Labor' ? 'bg-blue-500/10 text-blue-500' :
                                                'bg-purple-500/10 text-purple-500'
                                    )}>
                                        <span className="text-[10px] font-bold uppercase">{(expense.category || "Other").substring(0, 3)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <h3 className="font-semibold text-foreground truncate">{expense.title}</h3>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                                            {expense.status === 'Advanced' ? (
                                                <span className="text-purple-500 font-bold flex items-center gap-1">
                                                    Advance to: {expense.payee}
                                                </span>
                                            ) : (
                                                <span>{expense.payee}</span>
                                            )}
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                            <span>{expense.date}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end pl-[64px] sm:pl-0">
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{expense.amount}</p>
                                    </div>
                                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                        expense.status === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            expense.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                expense.status === 'Advanced' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                    )}>
                                        {expense.status === 'Unpaid' ? 'Cancel' : expense.status}
                                    </div>
                                </div>

                                {/* Admin Actions for Status Change */}
                                {(currentTeam?.role === 'Admin' || currentTeam?.role === 'Owner') &&
                                    (expense.status === 'Pending' || expense.status === 'Credit' || expense.status === 'Advanced') && (
                                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (confirm(`Approve payment for "${expense.title}"?`)) {
                                                        updateExpense(expense.id, { status: 'Paid' })
                                                    }
                                                }}
                                                className="flex items-center gap-2 pl-3 pr-4 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-full transition-all group/btn"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-tight">จ่ายแล้ว</span>
                                                <span className="text-[10px] opacity-70 border-l border-green-500/20 pl-2">
                                                    {expense.status === 'Advanced' ? (expense.paidBy || expense.payee) : expense.payee}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                {expense.status === 'Unpaid' && (
                                    <div className="px-3 py-1 bg-gray-500/10 text-gray-500 border border-gray-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        CANCEL
                                    </div>
                                )}
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>
        </div >
    )
}

export default function ExpensesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">Loading...</div>}>
            <ExpensesContent />
        </Suspense>
    )
}
