"use client"

import { Plus, Search, FileText, CheckCircle, CheckCircle2, Clock, ArrowDownAZ, FileCheck, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useProjects, Customer, Project, IncomeDocument } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import { AddIncomeDialog } from "@/components/income/add-income-dialog"
import { IncomeDetailSheet } from "@/components/income/income-detail-sheet"
import { useSettings } from "@/context/settings-context" // Add this import
import { saveAs } from "file-saver"
import { pdf } from "@react-pdf/renderer"
import { IncomePDF } from "@/components/income/income-pdf"
import { cn } from "@/lib/utils"
import { matchesIncomeSearch, getIncomeMatchedDetailSnippet } from "@/lib/project-utils"

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
    const { incomes, customers, projects, workers, users, isFinanceLoading: incomesLoading, currentUser, currentTeam } = useProjects()
    const { t } = useTranslation()
    const router = useRouter() // Import useRouter
    const searchParams = useSearchParams()
    const [filter, setFilter] = useState("All")

    // Access Control
    useEffect(() => {
        if (currentTeam?.role && !hasPermission(currentTeam.role, "INCOME_CREATE")) {
            router.replace("/")
        }
    }, [currentTeam, router])

    // If no permission, render nothing while redirecting
    if (currentTeam?.role && !hasPermission(currentTeam.role, "INCOME_CREATE")) {
        return null
    }
    const [search, setSearch] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [selectedIncomeId, setSelectedIncomeId] = useState<string | null>(null)
    const [sortOption, setSortOption] = useState<'created' | 'date' | 'alphabetical'>('created')
    const [statusCardFilter, setStatusCardFilter] = useState<'all' | 'paid' | 'pending' | 'quotation'>('all')
    const [expandedMonths, setExpandedMonths] = React.useState<Record<string, boolean>>({})

    const toggleMonth = (month: string, isCurrentlyExpanded: boolean) => {
        setExpandedMonths(prev => ({ ...prev, [month]: !isCurrentlyExpanded }))
    }

    // New Filters
    const [projectFilter, setProjectFilter] = useState("all")
    const [monthFilter, setMonthFilter] = useState("all")
    const [customerFilter, setCustomerFilter] = useState("all")
    const [technicianFilter, setTechnicianFilter] = useState("all")

    // Export State
    const [isExportOpen, setIsExportOpen] = useState(false)
    const exportRef = React.useRef<HTMLDivElement>(null)

    // Click Outside to Close Export Dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Handle action=new from Quick Add menu or incomeId from Notifications
    useEffect(() => {
        const action = searchParams.get('action')
        const incomeId = searchParams.get('incomeId')

        if (action === 'new') {
            setShowAddDialog(true)
        } else if (incomeId) {
            setSelectedIncomeId(incomeId)
        } else {
            setSelectedIncomeId(null)
        }
    }, [searchParams])

    // Helper to get names
    const getCustomerName = (id: string) => customers.find((c: Customer) => c.id === id)?.name || "Unknown"
    const getProjectName = (id: string) => projects.find((p: Project) => p.id === id)?.name || "Unknown Folder"

    // Mood Card Logic
    const { financialTargets: finTargets } = useSettings() // Use Global Settings

    // Removed local state and effect for storage handling


    // Calculate Monthly Income
    const currentMonthPrefix = new Date().toISOString().substring(0, 7) // YYYY-MM

    const monthlyTotal = incomes
        .filter(i =>
            i.date.startsWith(currentMonthPrefix) &&
            i.type === 'Invoice' &&
            (i.status === 'Paid' || i.status === 'Invoiced')
        )
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

    // Step 1: Base Filter (Project, Month, Customer, User, Search)
    const baseFilteredIncomes = React.useMemo(() => {
        return incomes.filter((doc: IncomeDocument) => {
            if (doc.isDeleted) return false

            const matchesProject = projectFilter === "all" || doc.projectId === projectFilter
            const matchesMonth = monthFilter === "all" || doc.date?.startsWith(monthFilter)
            const matchesCustomer = customerFilter === "all" || doc.customerId === customerFilter

            let matchesTechnician = true
            if (technicianFilter !== "all") {
                const userName = users.find(u => u.id === technicianFilter)?.name
                if (userName) {
                    const project = projects.find(p => p.id === doc.projectId)
                    if (project) {
                        matchesTechnician = project.tasks?.some(t => Array.isArray(t.assignedTo) ? t.assignedTo.includes(userName) : (t.assignedTo as any) === userName) || false
                    } else {
                        matchesTechnician = false
                    }
                } else {
                    matchesTechnician = false
                }
            }

            const project = projects.find(p => p.id === doc.projectId)
            const matchesSearch = matchesIncomeSearch(doc, search, {
                customerName: getCustomerName(doc.customerId),
                projectName: project?.name
            })

            return matchesProject && matchesMonth && matchesCustomer && matchesTechnician && matchesSearch
        })
    }, [incomes, projectFilter, monthFilter, customerFilter, technicianFilter, search, projects, users, customers])

    // Summary Card Stats (Exclude Voided documents from amounts)
    const paidIncomes = React.useMemo(() => baseFilteredIncomes.filter(d => d.status === 'Paid'), [baseFilteredIncomes])
    const pendingInvoices = React.useMemo(() => baseFilteredIncomes.filter(d => d.type === 'Invoice' && d.status !== 'Paid' && d.status !== 'Void'), [baseFilteredIncomes])
    const quotationIncomes = React.useMemo(() => baseFilteredIncomes.filter(d => d.type === 'Quotation' && d.status !== 'Void'), [baseFilteredIncomes])

    const paidTotal = React.useMemo(() => paidIncomes.reduce((sum, d) => sum + (d.grandTotal || 0), 0), [paidIncomes])
    const pendingTotal = React.useMemo(() => pendingInvoices.reduce((sum, d) => sum + (d.grandTotal || 0), 0), [pendingInvoices])
    const quotationTotal = React.useMemo(() => quotationIncomes.reduce((sum, d) => sum + (d.grandTotal || 0), 0), [quotationIncomes])

    // Step 2: Final Filter (Base + Type Tabs + Status Card + Sorting)
    const filteredIncomes = React.useMemo(() => {
        return baseFilteredIncomes.filter((doc: IncomeDocument) => {
            // Type Tab
            const matchesType = filter === "All" || doc.type === filter

            // Status Card
            let matchesStatusCard = true
            if (statusCardFilter === 'paid') {
                matchesStatusCard = doc.status === 'Paid'
            } else if (statusCardFilter === 'pending') {
                matchesStatusCard = doc.type === 'Invoice' && doc.status !== 'Paid' && doc.status !== 'Void'
            } else if (statusCardFilter === 'quotation') {
                matchesStatusCard = doc.type === 'Quotation' && doc.status !== 'Void'
            }

            return matchesType && matchesStatusCard
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
    }, [baseFilteredIncomes, filter, statusCardFilter, sortOption, customers])

    // Group and Sort Months for List Display
    const groupedIncomes = React.useMemo(() => {
        const groups: Record<string, typeof filteredIncomes> = {}
        filteredIncomes.forEach(doc => {
            let monthStr = "Unknown"
            if (doc.date) {
                monthStr = doc.date.substring(0, 7) // YYYY-MM
            }
            if (!groups[monthStr]) groups[monthStr] = []
            groups[monthStr].push(doc)
        })
        return groups
    }, [filteredIncomes])

    const sortedMonthsList = React.useMemo(() => {
        return Object.keys(groupedIncomes).sort((a, b) => {
            if (a === "Unknown") return 1
            if (b === "Unknown") return -1
            return b.localeCompare(a)
        })
    }, [groupedIncomes])

    // Export Logic
    const handleExportCSV = () => {
        if (filteredIncomes.length === 0) return alert("No documents to export")

        const headers = ["Date", "Document Number", "Type", "Customer", "Project", "Amount", "Status"]
        const csvContent = [
            headers.join(","),
            ...filteredIncomes.map(doc => [
                doc.date,
                doc.documentNumber,
                doc.type,
                `"${getCustomerName(doc.customerId).replace(/"/g, '""')}"`,
                `"${getProjectName(doc.projectId).replace(/"/g, '""')}"`,
                doc.grandTotal,
                doc.status
            ].join(","))
        ].join("\n")

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
        saveAs(blob, `income_export_${new Date().toISOString().split('T')[0]}.csv`)
    }

    const handleExportPDF = async () => {
        if (filteredIncomes.length === 0) return alert("No documents to export")
        try {
            const blob = await pdf(
                <IncomePDF
                    incomes={filteredIncomes}
                    title={`Income Report - ${new Date().toLocaleDateString()}`}
                    customers={customers}
                    projects={projects}
                />
            ).toBlob()
            saveAs(blob, `income_report_${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
            console.error("PDF generation failed:", error)
            alert("Failed to generate PDF. Check console for details.")
        }
    }


    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <AddIncomeDialog
                key={showAddDialog ? 'new-income' : 'closed'}
                open={showAddDialog}
                onOpenChange={(open) => {
                    if (!open && searchParams.has('action')) router.back()
                    setShowAddDialog(open)
                }}
            />

            <IncomeDetailSheet
                documentId={selectedIncomeId}
                onClose={() => {
                    if (searchParams.has('incomeId')) router.back()
                    else setSelectedIncomeId(null)
                }}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{t.income.title}</h1>
                    <p className="text-muted-foreground mt-1">{t.income.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className={cn(
                                "flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-muted/50 border border-border text-foreground rounded-xl font-medium shadow-sm hover:bg-muted transition-all text-sm sm:text-base whitespace-nowrap",
                                isExportOpen && "bg-muted ring-2 ring-primary/20"
                            )}
                        >
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                            Export
                        </button>
                        {isExportOpen && (
                            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
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
                                    <span className="font-medium text-sm">Export PDF</span>
                                </button>
                            </div>
                        )}
                    </div>
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
                        <div className="text-[10px] text-muted-foreground/60 italic mt-1 font-medium">
                            * เฉพาะยอดจาก Invoice เท่านั้น
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

            {/* Income Summary Cards (Scrollable) - Contained */}
            <div className="overflow-hidden">
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <div className="flex gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-3">
                        {/* 1. Paid / Received */}
                        <button
                            onClick={() => {
                                setStatusCardFilter(prev => prev === 'paid' ? 'all' : 'paid')
                                setFilter('All')
                            }}
                            className={cn(
                                "glass-card p-4 rounded-xl border border-white/5 transition-all text-left group",
                                statusCardFilter === 'paid' ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-emerald-500/5 hover:border-emerald-500/30"
                            )}
                        >
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                                        {t.income.summary?.paid || "รับชำระแล้ว / Paid"}
                                    </p>
                                </div>
                                <span className="text-[11px] text-emerald-400/80 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    {paidIncomes.length} รายการ
                                </span>
                            </div>
                            <p className="text-2xl font-black text-emerald-400">
                                ฿{paidTotal.toLocaleString()}
                            </p>
                        </button>

                        {/* 2. Pending / Invoiced */}
                        <button
                            onClick={() => {
                                setStatusCardFilter(prev => prev === 'pending' ? 'all' : 'pending')
                                setFilter('All')
                            }}
                            className={cn(
                                "glass-card p-4 rounded-xl border border-white/5 transition-all text-left group",
                                statusCardFilter === 'pending' ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-amber-500/5 hover:border-amber-500/30"
                            )}
                        >
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                                        {t.income.summary?.pending || "รอรับชำระ / Invoiced"}
                                    </p>
                                </div>
                                <span className="text-[11px] text-amber-400/80 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    {pendingInvoices.length} รายการ
                                </span>
                            </div>
                            <p className="text-2xl font-black text-amber-400">
                                ฿{pendingTotal.toLocaleString()}
                            </p>
                        </button>

                        {/* 3. Quotation / เตรียมเบิก */}
                        <button
                            onClick={() => {
                                setStatusCardFilter(prev => prev === 'quotation' ? 'all' : 'quotation')
                                setFilter('All')
                            }}
                            className={cn(
                                "glass-card p-4 rounded-xl border border-white/5 transition-all text-left group",
                                statusCardFilter === 'quotation' ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "bg-blue-500/5 hover:border-blue-500/30"
                            )}
                        >
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all">
                                        <FileCheck className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                                        {t.income.summary?.quotation || "เตรียมเบิก / Quotation"}
                                    </p>
                                </div>
                                <span className="text-[11px] text-blue-400/80 font-mono bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                    {quotationIncomes.length} รายการ
                                </span>
                            </div>
                            <p className="text-2xl font-black text-blue-400">
                                ฿{quotationTotal.toLocaleString()}
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
                {/* Type Tabs */}
                <div className="flex bg-muted rounded-lg p-1 w-full sm:w-fit overflow-x-auto scrollbar-hide">
                    {['All', 'Quotation', 'Invoice', 'Receipt'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setFilter(tab)
                                setStatusCardFilter('all')
                            }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filter === tab && statusCardFilter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
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

            {/* Search & Sort Bar */}
            <div className="bg-card rounded-xl border border-white/5 shadow-sm p-4 flex gap-4">
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

            {/* Incomes List (Grouped by Month) */}
            {incomesLoading ? (
                <div className="bg-card rounded-xl border border-border p-8 py-20 min-h-[400px] flex items-center justify-center">
                    <IncomeLoading />
                </div>
            ) : filteredIncomes.length === 0 ? (
                <div className="bg-card rounded-xl border border-white/5 shadow-sm p-12 text-center space-y-3">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                        <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-muted-foreground">{t.income.empty}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedMonthsList.map((month, monthIndex) => {
                        const isExpanded = expandedMonths[month] !== undefined ? expandedMonths[month] : monthIndex === 0
                        const monthIncomes = groupedIncomes[month] || []
                        const monthTotal = monthIncomes.reduce((sum, doc) => doc.status !== 'Void' ? sum + (doc.grandTotal || 0) : sum, 0)

                        let monthDisplay = month
                        if (month !== "Unknown") {
                            const d = new Date(month + "-01")
                            if (!isNaN(d.getTime())) {
                                monthDisplay = d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
                            }
                        }

                        return (
                            <div key={month} className="space-y-3">
                                <div
                                    onClick={() => toggleMonth(month, isExpanded)}
                                    className="flex items-center justify-between cursor-pointer py-2 px-1 hover:bg-muted/10 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground">{monthDisplay}</h2>
                                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {monthIncomes.length} รายการ
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground font-mono">฿{monthTotal.toLocaleString()}</p>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-card rounded-xl border border-white/5 shadow-sm overflow-hidden overflow-x-auto">
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
                                                {monthIncomes.map((doc, index) => {
                                                    // Check if we need a date divider
                                                    const currentDate = doc.date
                                                    const prevDoc = index > 0 ? monthIncomes[index - 1] : null
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
                                                                onClick={() => router.push(`?incomeId=${doc.id}`, { scroll: false })}
                                                                className="border-b border-white/5 hover:bg-muted/30 transition-colors cursor-pointer"
                                                            >
                                                                <td className="px-6 py-4 font-medium">
                                                                    <div>{doc.documentNumber}</div>
                                                                    {search.trim() && (() => {
                                                                        const matchedDetail = getIncomeMatchedDetailSnippet(doc, search)
                                                                        if (!matchedDetail) return null
                                                                        return (
                                                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-primary/90 font-medium">
                                                                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                                                    รายละเอียด
                                                                                </span>
                                                                                <span className="truncate max-w-[200px] text-muted-foreground">{matchedDetail}</span>
                                                                            </div>
                                                                        )
                                                                    })()}
                                                                </td>
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
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            router.push(`?incomeId=${doc.id}`, { scroll: false })
                                                                        }}
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
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
