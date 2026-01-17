"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProjects } from "@/context/project-context"
import { Calendar, Building, Download, FileText, ChevronDown, FileSpreadsheet } from "lucide-react"

interface DownloadReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DownloadReportDialog({ open, onOpenChange }: DownloadReportDialogProps) {
    const { projects, incomes, expenses, companyProfile } = useProjects()

    // Filter States
    const [period, setPeriod] = useState<"all" | "month" | "custom">("all")
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

    // Custom Date Range
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const [scope, setScope] = useState<"all" | "project">("all")
    const [selectedProjectId, setSelectedProjectId] = useState("")

    const [format, setFormat] = useState<"pdf" | "csv">("pdf") // New Format State

    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            // 1. Prepare Data
            let filteredProjects = [...projects]
            let filteredIncomes = [...incomes]
            let filteredExpenses = [...expenses]
            let reportTitle = "Company Performance Report"

            // 2. Filter by Scope (Project)
            if (scope === "project" && selectedProjectId) {
                filteredProjects = projects.filter(p => p.id === selectedProjectId)
                filteredIncomes = incomes.filter(i => i.projectId === selectedProjectId)
                filteredExpenses = expenses.filter(e => e.projectId === selectedProjectId)

                const projName = projects.find(p => p.id === selectedProjectId)?.name || "Unknown Project"
                reportTitle = `Project Report: ${projName}`
            }

            // 3. Filter by Period
            let dateRangeLabel = "All Time"

            if (period === "month" && selectedMonth) {
                const [year, month] = selectedMonth.split('-')
                // Logic for whole month
                const isInMonth = (dateStr: string) => {
                    const d = new Date(dateStr)
                    return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month)
                }
                filteredIncomes = filteredIncomes.filter(i => isInMonth(i.date))
                filteredExpenses = filteredExpenses.filter(e => isInMonth(e.date))

                const d = new Date(parseInt(year), parseInt(month) - 1, 1)
                dateRangeLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
            else if (period === "custom" && startDate && endDate) {
                const start = new Date(startDate)
                start.setHours(0, 0, 0, 0)
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)

                const isInRange = (dateStr: string) => {
                    const d = new Date(dateStr)
                    return d >= start && d <= end
                }

                filteredIncomes = filteredIncomes.filter(i => isInRange(i.date))
                filteredExpenses = filteredExpenses.filter(e => isInRange(e.date))

                dateRangeLabel = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
            }

            if (format === 'csv') {
                generateCSV(filteredIncomes, filteredExpenses, filteredProjects)
            } else {
                // 4. Generate PDF via server-side for Thai font support
                const { generateServerPDF, generateDashboardReportHTML } = await import('@/lib/server-pdf')

                const html = generateDashboardReportHTML({
                    companyName: companyProfile?.name || 'Company',
                    dateRange: `${dateRangeLabel} ${scope === 'project' ? '(Project Specific)' : ''}`,
                    totalIncome: filteredIncomes.reduce((sum, i) => sum + (i.grandTotal || 0), 0),
                    totalExpense: filteredExpenses.reduce((sum, e) => sum + (e.totalValue || 0), 0),
                    projects: filteredProjects.map(p => ({
                        name: p.name,
                        budget: Number(p.budget) || 0,
                        progress: p.progress || 0
                    })),
                    recentIncomes: filteredIncomes.slice(0, 10).map(i => ({
                        date: i.date,
                        type: i.type,
                        docNumber: i.documentNumber,
                        amount: i.grandTotal || 0
                    })),
                    recentExpenses: filteredExpenses.slice(0, 10).map(e => ({
                        date: e.date,
                        category: e.category,
                        title: e.title,
                        amount: e.totalValue || 0
                    }))
                })

                await generateServerPDF(html, `Report_${new Date().toISOString().split('T')[0]}.pdf`)
            }

            onOpenChange(false)
        } catch (error) {
            console.error(error)
            alert("Failed to generate report")
        } finally {
            setIsGenerating(false)
        }
    }

    const generateCSV = (incomes: any[], expenses: any[], projects: any[]) => {
        // Headers
        const headers = ["Type", "Date", "Document/Title", "Category/Customer", "Status", "Amount", "Project"]

        // Rows
        const incomeRows = incomes.map(i => [
            "Income",
            i.date,
            `${i.documentNumber} (${i.type})`,
            i.clientName || "-",
            i.status,
            i.grandTotal,
            projects.find(p => p.id === i.projectId)?.name || "-"
        ])

        const expenseRows = expenses.map(e => [
            "Expense",
            e.date,
            e.title,
            e.category,
            e.status || "Paid",
            e.totalValue,
            projects.find(p => p.id === e.projectId)?.name || "-"
        ])

        const allRows = [headers, ...incomeRows, ...expenseRows]
        const csvContent = "data:text/csv;charset=utf-8," + allRows.map(e => e.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90%] sm:w-full sm:max-w-lg bg-zinc-950 border border-white/10 text-white p-6 sm:p-8 rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Download Report
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Period Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time Period</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setPeriod("all")}
                                className={`px-2 py-3 rounded-xl border text-sm font-medium transition-all ${period === "all"
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground"
                                    }`}
                            >
                                All Time
                            </button>
                            <button
                                onClick={() => setPeriod("month")}
                                className={`px-2 py-3 rounded-xl border text-sm font-medium transition-all ${period === "month"
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground"
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setPeriod("custom")}
                                className={`px-2 py-3 rounded-xl border text-sm font-medium transition-all ${period === "custom"
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground"
                                    }`}
                            >
                                Custom
                            </button>
                        </div>

                        {period === "month" && (
                            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white [color-scheme:dark]"
                                />
                            </div>
                        )}

                        {period === "custom" && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground ml-1">From</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground ml-1">To</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Scope Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Scope</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setScope("all")}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${scope === "all"
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground"
                                    }`}
                            >
                                All Projects
                            </button>
                            <button
                                onClick={() => setScope("project")}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${scope === "project"
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground"
                                    }`}
                            >
                                Specific Project
                            </button>
                        </div>

                        {scope === "project" && (
                            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-white"
                                >
                                    <option value="" className="bg-zinc-900 text-muted-foreground">Select a project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Format Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Format</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFormat("pdf")}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${format === "pdf"
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground"
                                    }`}
                            >
                                <FileText className="w-4 h-4" /> PDF
                            </button>
                            <button
                                onClick={() => setFormat("csv")}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${format === "csv"
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground"
                                    }`}
                            >
                                <FileSpreadsheet className="w-4 h-4" /> CSV / Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-2">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating || (scope === 'project' && !selectedProjectId) || (period === 'custom' && (!startDate || !endDate))}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>Generating...</>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Download {format.toUpperCase()} Report
                            </>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
