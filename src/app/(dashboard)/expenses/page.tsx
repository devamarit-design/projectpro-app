"use client"

import * as React from "react"
import { Plus, Search, Filter, Camera, ScanLine, Tag, Wallet, TrendingDown, LayoutGrid, Hammer, Users, FileText, CreditCard, Archive, RefreshCcw } from "lucide-react"
import { SmartScanDialog } from "@/components/expenses/smart-scan-dialog"
import { useProjects, ExpenseCategory } from "@/context/project-context"
import { cn } from "@/lib/utils"
import AddExpenseDialog from "@/components/expenses/add-expense-dialog"
import ExpenseDetailSheet from "@/components/expenses/expense-detail-sheet"
import { useSearchParams, useRouter } from "next/navigation"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"

import { useTranslation } from "@/lib/i18n-context"
import { CheckCircle2 } from "lucide-react"
import { Suspense } from "react"

function ExpensesContent() {
    const { expenses, archivedExpenses, projects, users, currentUser } = useProjects()
    const { t } = useTranslation()
    const searchParams = useSearchParams()
    const router = useRouter()
    // Combined State: isAddOpen controls the dialog, startScanning passes the intent
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [startScanning, setStartScanning] = React.useState(false)
    const [isContractOpen, setIsContractOpen] = React.useState(false)

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
            setIsAddOpen(true)
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

    const handleOpenScan = () => {
        setStartScanning(true)
        setIsAddOpen(true)
    }

    const handleCloseAdd = () => {
        setIsAddOpen(false)
        setStartScanning(false)
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
    const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>('newest')

    const filteredExpenses = React.useMemo(() => {
        let result = baseFilteredExpenses.filter(expense => {
            return statusFilter === "All" || expense.status === statusFilter
        })

        // Sort by Date
        return result.sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })
    }, [baseFilteredExpenses, statusFilter, sortOrder])

    // Calculate Total
    const totalExpense = React.useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => {
            return acc + curr.totalValue
        }, 0)
    }, [filteredExpenses])

    return (
        <div className="space-y-6 pb-20">
            <AddExpenseDialog
                isOpen={isAddOpen}
                onClose={handleCloseAdd}
                startScanning={startScanning}
            />
            <AddContractDialog
                isOpen={isContractOpen}
                onClose={() => setIsContractOpen(false)}
            />
            <ExpenseDetailSheet expenseId={selectedExpenseId} onClose={() => setSelectedExpenseId(null)} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        {t.expenses.title} <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">/ Financials</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">{t.expenses.subtitle}</p>
                </div>
                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={() => setIsContractOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-muted/50 border border-border text-foreground rounded-xl font-medium shadow-sm hover:bg-muted transition-all"
                    >
                        <FileText className="w-5 h-5 text-amber-500" />
                        {t.expenses.create_contract}
                    </button>

                    <div className="relative">
                        {/* Drodown Button */}
                        <button
                            onClick={() => {
                                // Simple toggle or use a proper dropdown component if available. 
                                // Since we don't have a UI kit dropdown handy in this file, we'll make a custom one.
                                const el = document.getElementById('add-expense-dropdown');
                                if (el) el.classList.toggle('hidden');
                            }}
                            onBlur={() => {
                                // Delay hide to allow click
                                setTimeout(() => {
                                    const el = document.getElementById('add-expense-dropdown');
                                    if (el) el.classList.add('hidden');
                                }, 200)
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:opacity-90 active:scale-95 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            {t.expenses.add_expense}
                        </button>

                        {/* Dropdown Menu */}
                        <div id="add-expense-dropdown" className="hidden absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                            <button
                                onClick={handleOpenAdd}
                                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                            >
                                <Plus className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{t.expenses.manual_entry}</span>
                            </button>
                            <div className="h-px bg-border" />
                            <button
                                onClick={handleOpenScan}
                                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                            >
                                <ScanLine className="w-4 h-4 text-purple-500" />
                                <span className="font-medium text-sm text-purple-500">{t.expenses.smart_scan}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Summary Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <button
                    onClick={() => setStatusFilter("Pending")}
                    className={cn(
                        "glass-card p-4 rounded-xl border border-white/5 transition-all text-left group",
                        statusFilter === 'Pending' ? "bg-red-500/10 border-red-500/50" : "bg-red-500/5 hover:border-red-500/30"
                    )}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-500/20 text-red-500 group-hover:scale-110 transition-transform">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold text-red-400 uppercase tracking-wider">{t.expenses.unpaid}</p>
                    </div>
                    <p className="text-2xl font-black text-red-500">
                        ฿{baseFilteredExpenses.filter(e => e.status !== 'Paid' && e.status !== 'Advanced' && e.status !== 'Credit').reduce((sum, e) => sum + e.totalValue, 0).toLocaleString()}
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

            {/* Filters & Search - Glass Component */}
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
                                <option value="Pending">Unpaid</option>
                                <option value="Advanced">Advanced (สำรอง)</option>
                                <option value="Credit">Credit</option>
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


                        {/* Sort Order */}
                        <div className="relative min-w-[140px]">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                                className="w-full pl-3 pr-8 py-2 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                            >
                                <option value="newest">Newest Date</option>
                                <option value="oldest">Oldest Date</option>
                            </select>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72 group">
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
                </div>
            </div>

            <div className="grid gap-3">
                {filteredExpenses.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium">{t.expenses.empty}</h3>
                        <p className="text-sm text-muted-foreground">{t.expenses.empty_hint}</p>
                    </div>
                ) : filteredExpenses.map((expense) => (
                    <div
                        key={expense.id}
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
                                <span className="text-[10px] font-bold uppercase">{expense.category.substring(0, 3)}</span>
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
                                        'bg-red-500/10 text-red-500 border-red-500/20'
                            )}>
                                {expense.status}
                            </div>
                        </div>

                        {/* Admin Actions for Status Change */}
                        {(currentUser?.role === 'Admin' || currentUser?.role === 'Owner') &&
                            (expense.status === 'Unpaid' || expense.status === 'Credit' || expense.status === 'Advanced' || expense.status === 'Pending') && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // We need updateExpense from context but it's not exposed in the destructured vars above
                                        // Let's assume we can pass intent to the detail sheet OR just open detail sheet.
                                        // Actually the user wants to "change status". 
                                        // Best UX: Open detail sheet which should have the action.
                                        setSelectedExpenseId(expense.id)
                                    }}
                                    className="p-2 hover:bg-green-500/10 text-muted-foreground hover:text-green-500 rounded-full transition-colors"
                                    title="Manage Payment"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            )}
                    </div>
                ))}
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
