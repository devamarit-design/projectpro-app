"use client"

import { Plus, Search, FileText, CheckCircle, Clock, ArrowDownAZ } from "lucide-react"
import Link from "next/link"
import { useProjects, Customer, Project, IncomeDocument } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import { AddIncomeDialog } from "@/components/income/add-income-dialog"
import { IncomeDetailSheet } from "@/components/income/income-detail-sheet"

const documents = [] // Removed hardcoded data

const FINANCIAL_TARGETS_KEY = "financial-targets"
interface FinancialTargets {
    incomeMin: number
    incomeMax: number
    expenseWarning: number
    expenseLimit: number
}

// Loading Component
function IncomeLoading() {
    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse">Loading documents...</p>
        </div>
    )
}

export default function IncomePage() {
    const { incomes, customers, projects, workers, users, incomesLoading, currentUser } = useProjects()
    const { t } = useTranslation()
    const router = useRouter() // Import useRouter
    const searchParams = useSearchParams()
    const [filter, setFilter] = useState("All")

    // Access Control
    useEffect(() => {
        if (currentUser && !hasPermission(currentUser, "INCOME_CREATE")) {
            router.replace("/")
        }
    }, [currentUser, router])

    // If no permission, render nothing while redirecting
    if (currentUser && !hasPermission(currentUser, "INCOME_CREATE")) {
        return null
    }
    const [search, setSearch] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [selectedIncomeId, setSelectedIncomeId] = useState<string | null>(null)
    const [sortOption, setSortOption] = useState<'created' | 'date' | 'alphabetical'>('created')

    // New Filters
    const [projectFilter, setProjectFilter] = useState("all")
    const [monthFilter, setMonthFilter] = useState("all")
    const [customerFilter, setCustomerFilter] = useState("all")
    const [technicianFilter, setTechnicianFilter] = useState("all")

    // Handle action=new from Quick Add menu
    useEffect(() => {
        const action = searchParams.get('action')
        if (action === 'new') {
            setShowAddDialog(true)
            router.replace('/income')
        }
    }, [searchParams, router])

    // Helper to get names
    const getCustomerName = (id: string) => customers.find((c: Customer) => c.id === id)?.name || "Unknown"
    const getProjectName = (id: string) => projects.find((p: Project) => p.id === id)?.name || "Unknown Folder"

    // Mood Card Logic
    const [finTargets, setFinTargets] = useState<FinancialTargets>({
        incomeMin: 50000,
        incomeMax: 150000,
        expenseWarning: 30000,
        expenseLimit: 50000
    })

    useEffect(() => {
        const stored = localStorage.getItem(FINANCIAL_TARGETS_KEY)
        if (stored) {
            try {
                setFinTargets(JSON.parse(stored))
            } catch { } // use defaults
        }
    }, [])

    // Calculate Monthly Income
    const currentMonthPrefix = new Date().toISOString().substring(0, 7) // YYYY-MM

    const monthlyTotal = incomes
        .filter(i => i.date.startsWith(currentMonthPrefix) && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced'))
        .reduce((sum, i) => sum + i.grandTotal, 0)

    const incomePercent = Math.min(100, Math.round((monthlyTotal / finTargets.incomeMax) * 100))

    // Determine Mood
    let mood = { emoji: "😎", label: "Comfortable (สบายใจ)", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle }

    if (monthlyTotal < finTargets.incomeMin) {
        mood = { emoji: "😤", label: "Fighting! (รีบเข้าๆ)", color: "text-orange-500", bg: "bg-orange-500/10", icon: Clock }
    } else if (monthlyTotal >= finTargets.incomeMax) {
        mood = { emoji: "🤑", label: "Wealthy (อารมณ์ดี)", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle }
    }


    // Helper: Get available months
    const availableMonths = Array.from(new Set(incomes.map(i => i.date.substring(0, 7)))).sort().reverse()

    // Memoize Filtered Incomes
    const filteredIncomes = React.useMemo(() => {
        return incomes.filter((doc: IncomeDocument) => {
            // 1. Basic Filters
            const matchesType = filter === "All" || doc.type === filter
            const matchesSearch = search === "" ||
                (doc.documentNumber?.toLowerCase() || "").includes(search.toLowerCase()) ||
                (getCustomerName(doc.customerId) || "").toLowerCase().includes(search.toLowerCase())

            // 2. Advanced Filters
            const matchesProject = projectFilter === "all" || doc.projectId === projectFilter
            const matchesMonth = monthFilter === "all" || doc.date?.startsWith(monthFilter)
            const matchesCustomer = customerFilter === "all" || doc.customerId === customerFilter

            // 3. User Filter (Was Technician, now User)
            let matchesTechnician = true
            if (technicianFilter !== "all") {
                // Find user name
                const userName = users.find(u => u.id === technicianFilter)?.name
                if (userName) {
                    // Logic: Does this project have tasks assigned to this user? 
                    const project = projects.find(p => p.id === doc.projectId)
                    if (project) {
                        matchesTechnician = project.tasks?.some(t => t.assignedTo === userName) || false
                    } else {
                        matchesTechnician = false
                    }
                } else {
                    matchesTechnician = false
                }
            }

            return matchesType && matchesSearch && matchesProject && matchesMonth && matchesCustomer && matchesTechnician
        }).sort((a, b) => {
            if (sortOption === 'created') {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime()
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime()
                return timeB - timeA
            } else if (sortOption === 'date') {
                return new Date(b.date).getTime() - new Date(a.date).getTime()
            } else if (sortOption === 'alphabetical') {
                const nameA = getCustomerName(a.customerId).toLowerCase()
                const nameB = getCustomerName(b.customerId).toLowerCase()
                return nameA.localeCompare(nameB)
            }
            return 0
        })
    }, [incomes, filter, search, projectFilter, monthFilter, customerFilter, technicianFilter, sortOption, customers, projects, users])



    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <AddIncomeDialog
                key={showAddDialog ? 'new-income' : 'closed'}
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
            />

            <IncomeDetailSheet
                documentId={selectedIncomeId}
                onClose={() => setSelectedIncomeId(null)}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{t.income.title}</h1>
                    <p className="text-muted-foreground mt-1">{t.income.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:opacity-90 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        {t.common.add_new}
                    </button>
                </div>
            </div>

            {/* Mood Card - Income (Enhanced) */}
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
                            Target: <span className="text-foreground">฿{finTargets.incomeMax.toLocaleString()}</span>
                        </div>
                        <div className="text-base sm:text-lg text-muted-foreground font-medium">
                            Earned: <span className={`font-bold ${monthlyTotal >= finTargets.incomeMax ? 'text-emerald-500' : 'text-foreground'}`}>฿{monthlyTotal.toLocaleString()}</span>
                            <span className="text-sm ml-2 opacity-80">({incomePercent}%)</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full sm:w-[40%] relative z-10">
                    <div className="h-4 w-full bg-black/10 rounded-full overflow-hidden backdrop-blur-sm border border-black/5">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${monthlyTotal >= finTargets.incomeMax ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-orange-500 to-orange-400'}`}
                            style={{ width: `${incomePercent}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-semibold uppercase tracking-wider opacity-60">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
                {/* Type Tabs */}
                <div className="flex bg-muted rounded-lg p-1 w-full sm:w-fit overflow-x-auto scrollbar-hide">
                    {['All', 'Quotation', 'Invoice', 'Receipt'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filter === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab === 'All' ? t.income.tabs.all : tab === 'Quotation' ? t.income.tabs.quotation : tab === 'Invoice' ? t.income.tabs.invoice : t.income.tabs.receipt}
                        </button>
                    ))}
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
                    {/* Project Filter */}
                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="h-10 px-3 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm max-w-[150px]"
                    >
                        <option value="all">{t.income.filters.all_projects}</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Month Filter */}
                    <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="h-10 px-3 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                        <option value="all">{t.income.filters.all_months}</option>
                        {availableMonths.map(month => (
                            <option key={month} value={month}>
                                {new Date(month + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </option>
                        ))}
                    </select>

                    {/* Customer Filter */}
                    <select
                        value={customerFilter}
                        onChange={(e) => setCustomerFilter(e.target.value)}
                        className="h-10 px-3 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm max-w-[150px]"
                    >
                        <option value="all">{t.income.filters.all_customers}</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    {/* User Filter (Replaces Technician) */}
                    <select
                        value={technicianFilter}
                        onChange={(e) => setTechnicianFilter(e.target.value)}
                        className="h-10 px-3 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm max-w-[150px]"
                    >
                        <option value="all">{t.tasks.filters.all_users}</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-white/5 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-white/5 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            placeholder={t.income.filters.search_placeholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowDownAZ className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as any)}
                            className="bg-transparent border-none text-sm text-muted-foreground focus:outline-none cursor-pointer hover:text-foreground transition-colors"
                        >
                            <option value="created">{t.income.sort.created}</option>
                            <option value="date">{t.income.sort.date}</option>
                            <option value="alphabetical">{t.income.sort.alphabetical}</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {incomesLoading ? (
                        <div className="bg-card rounded-xl border border-border p-8 py-20 min-h-[400px] flex items-center justify-center">
                            <IncomeLoading />
                        </div>
                    ) : filteredIncomes.length === 0 ? (
                        <div className="p-12 text-center space-y-3">
                            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                <FileText className="w-8 h-8" />
                            </div>
                            <p className="text-muted-foreground">{t.income.empty}</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-3 font-medium">{t.income.table.no}</th>
                                    <th className="px-6 py-3 font-medium">{t.income.table.type}</th>
                                    <th className="px-6 py-3 font-medium">{t.income.table.customer_project}</th>
                                    <th className="px-6 py-3 font-medium">{t.income.table.date}</th>
                                    <th className="px-6 py-3 font-medium text-right">{t.income.table.total}</th>
                                    <th className="px-6 py-3 font-medium text-center">{t.income.table.status}</th>
                                    <th className="px-6 py-3 font-medium w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIncomes.map((doc, index) => {
                                    // Check if we need a date divider
                                    const currentDate = doc.date
                                    const prevDoc = index > 0 ? filteredIncomes[index - 1] : null
                                    const showDateDivider = !prevDoc || prevDoc.date !== currentDate

                                    return (
                                        <React.Fragment key={doc.id}>
                                            {showDateDivider && (
                                                <tr key={`divider-${currentDate}`}>
                                                    <td colSpan={7} className="px-6 py-2 bg-muted/30 border-b border-white/5">
                                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                            <div className="w-2 h-2 rounded-full bg-primary/60" />
                                                            {new Date(currentDate).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr
                                                key={doc.id}
                                                onClick={() => setSelectedIncomeId(doc.id)}
                                                className="border-b border-white/5 hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 font-medium">{doc.documentNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${doc.type === 'Quotation' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        doc.type === 'Invoice' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                            'bg-green-500/10 text-green-500 border-green-500/20'
                                                        }`}>
                                                        {doc.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground">{getCustomerName(doc.customerId)}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                                                        {getProjectName(doc.projectId)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">{doc.date}</td>
                                                <td className="px-6 py-4 text-right font-bold text-primary">฿{doc.grandTotal.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${doc.status === 'Paid' || doc.status === 'Accepted' ? 'text-green-500 bg-green-500/10' :
                                                        doc.status === 'Sent' || doc.status === 'Invoiced' ? 'text-blue-500 bg-blue-500/10' :
                                                            'text-muted-foreground bg-muted'
                                                        }`}>
                                                        {doc.status === 'Paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                        {doc.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedIncomeId(doc.id)}
                                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div >
    )
}
