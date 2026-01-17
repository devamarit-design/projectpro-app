"use client"

import { Plus, Search, FileText, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useProjects, Customer, Project, IncomeDocument } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import { AddIncomeDialog } from "@/components/income/add-income-dialog"
import { IncomeDetailSheet } from "@/components/income/income-detail-sheet"

const documents = [] // Removed hardcoded data

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
    const { incomes, customers, projects, workers, incomesLoading, currentUser } = useProjects()
    const { t } = useTranslation()
    const router = useRouter() // Import useRouter
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

    // New Filters
    const [projectFilter, setProjectFilter] = useState("all")
    const [monthFilter, setMonthFilter] = useState("all")
    const [customerFilter, setCustomerFilter] = useState("all")
    const [technicianFilter, setTechnicianFilter] = useState("all")

    // Helper to get names
    const getCustomerName = (id: string) => customers.find((c: Customer) => c.id === id)?.name || "Unknown"
    const getProjectName = (id: string) => projects.find((p: Project) => p.id === id)?.name || "Unknown Folder"

    // Helper: Get available months
    const availableMonths = Array.from(new Set(incomes.map(i => i.date.substring(0, 7)))).sort().reverse()

    const filteredIncomes = incomes.filter((doc: IncomeDocument) => {
        // 1. Basic Filters
        const matchesType = filter === "All" || doc.type === filter
        const matchesSearch = search === "" ||
            (doc.documentNumber?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (getCustomerName(doc.customerId) || "").toLowerCase().includes(search.toLowerCase())

        // 2. Advanced Filters
        const matchesProject = projectFilter === "all" || doc.projectId === projectFilter
        const matchesMonth = monthFilter === "all" || doc.date?.startsWith(monthFilter)
        const matchesCustomer = customerFilter === "all" || doc.customerId === customerFilter

        // 3. Technician Filter (Indirect: Is this technician working on the project?)
        let matchesTechnician = true
        if (technicianFilter !== "all") {
            // Find project for this document
            const project = projects.find(p => p.id === doc.projectId)
            if (project) {
                // Check tasks for this technician
                // Assuming 'technicianFilter' is the NAME of the worker (matching assignedTo in tasks)
                // In a real app we'd filter by ID, but tasks use 'assignedTo: string' (name).
                // Let's assume the filter value passed is the worker's NAME.
                const workerName = workers.find(w => w.id === technicianFilter)?.name
                if (workerName) {
                    matchesTechnician = project.tasks?.some(t => t.assignedTo === workerName) || false
                } else {
                    matchesTechnician = false
                }
            } else {
                matchesTechnician = false
            }
        }

        return matchesType && matchesSearch && matchesProject && matchesMonth && matchesCustomer && matchesTechnician
    })



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
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:opacity-90 transition-all active:scale-95 hidden md:flex"
                >
                    <Plus className="w-5 h-5" />
                    {t.common.add_new}
                </button>
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

                    {/* Technician Filter */}
                    <select
                        value={technicianFilter}
                        onChange={(e) => setTechnicianFilter(e.target.value)}
                        className="h-10 px-3 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm max-w-[150px]"
                    >
                        <option value="all">{t.income.filters.all_techs}</option>
                        {workers.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
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
                                {filteredIncomes.map((doc) => (
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
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Floating Action Button for Mobile */}
            <button
                onClick={() => setShowAddDialog(true)}
                className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all"
            >
                <Plus className="w-7 h-7" />
            </button>
        </div>
    )
}
