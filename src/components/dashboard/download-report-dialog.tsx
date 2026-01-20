"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProjects } from "@/context/project-context"
import { Calendar, Building, Download, FileText, ChevronDown, FileSpreadsheet } from "lucide-react"
import { generateDashboardReport } from "./dashboard-report-pdf"

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
                // 4. Generate printable HTML and open in new window for Print-to-PDF (supports Thai fonts)
                const totalIncome = filteredIncomes.reduce((sum, i) => sum + (i.grandTotal || 0), 0)
                const totalExpense = filteredExpenses.reduce((sum, e) => sum + (e.totalValue || 0), 0)
                const profit = totalIncome - totalExpense

                printReportHTML({
                    companyName: companyProfile?.name || 'Company',
                    dateRange: `${dateRangeLabel} ${scope === 'project' ? '(Project Specific)' : ''}`,
                    totalIncome,
                    totalExpense,
                    profit,
                    projects: filteredProjects,
                    incomes: filteredIncomes,
                    expenses: filteredExpenses
                })
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

    // Print-to-PDF function (supports Thai fonts via browser)
    const printReportHTML = (data: {
        companyName: string
        dateRange: string
        totalIncome: number
        totalExpense: number
        profit: number
        projects: any[]
        incomes: any[]
        expenses: any[]
    }) => {
        const formatCurrency = (amt: number) => amt.toLocaleString('th-TH', { minimumFractionDigits: 2 })
        const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('th-TH') : '-'

        const projectRows = data.projects.slice(0, 10).map(p => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.customer || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${p.progress || 0}%</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.status}</td>
            </tr>
        `).join('')

        const incomeRows = data.incomes.slice(0, 10).map(i => `
            <tr>
                <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${formatDate(i.date)}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${i.documentNumber} (${i.type})</td>
                <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${i.status}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #10b981;">+฿${formatCurrency(i.grandTotal || 0)}</td>
            </tr>
        `).join('')

        const expenseRows = data.expenses.slice(0, 10).map(e => `
            <tr>
                <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${formatDate(e.date)}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${e.title}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${e.category}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #ef4444;">-฿${formatCurrency(e.totalValue || 0)}</td>
            </tr>
        `).join('')

        const html = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>รายงานภาพรวม - ${data.companyName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; font-size: 12px; color: #1f2937; padding: 0; max-width: 100%; margin: 0; }
        @media print { body { padding: 0; } }
        h1 { font-size: 22px; color: #3b82f6; margin-bottom: 4px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px; }
        .meta { text-align: right; color: #6b7280; font-size: 10px; }
        .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .card { background: #f9fafb; border-radius: 8px; padding: 10px; border: 1px solid #e5e7eb; }
        .card-label { font-size: 9px; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
        .card-value { font-size: 18px; font-weight: 700; }
        .income { color: #10b981; }
        .expense { color: #ef4444; }
        .profit { color: #3b82f6; }
        .loss { color: #ef4444; }
        .section { margin-bottom: 14px; }
        .section-title { font-size: 13px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { text-align: left; padding: 4px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 9px; text-transform: uppercase; color: #6b7280; }
        td { padding: 4px; }
        .footer { text-align: center; font-size: 9px; color: #9ca3af; margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>รายงานภาพรวม</h1>
            <p style="color: #6b7280;">${data.companyName}</p>
        </div>
        <div class="meta">
            <p>ช่วงเวลา: ${data.dateRange}</p>
            <p>สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH')}</p>
        </div>
    </div>

    <div class="cards">
        <div class="card">
            <div class="card-label">รายรับรวม</div>
            <div class="card-value income">฿${formatCurrency(data.totalIncome)}</div>
        </div>
        <div class="card">
            <div class="card-label">รายจ่ายรวม</div>
            <div class="card-value expense">฿${formatCurrency(data.totalExpense)}</div>
        </div>
        <div class="card">
            <div class="card-label">กำไร/ขาดทุน</div>
            <div class="card-value ${data.profit >= 0 ? 'profit' : 'loss'}">${data.profit >= 0 ? '' : '-'}฿${formatCurrency(Math.abs(data.profit))}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">โครงการ (${data.projects.length})</div>
        <table>
            <thead><tr><th>ชื่อโครงการ</th><th>ลูกค้า</th><th style="text-align:right;">ความคืบหน้า</th><th>สถานะ</th></tr></thead>
            <tbody>${projectRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #9ca3af;">ไม่พบโครงการ</td></tr>'}</tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">รายรับล่าสุด</div>
        <table>
            <thead><tr><th>วันที่</th><th>เอกสาร</th><th>สถานะ</th><th style="text-align:right;">จำนวนเงิน</th></tr></thead>
            <tbody>${incomeRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #9ca3af;">ไม่มีข้อมูล</td></tr>'}</tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">รายจ่ายล่าสุด</div>
        <table>
            <thead><tr><th>วันที่</th><th>รายการ</th><th>หมวดหมู่</th><th style="text-align:right;">จำนวนเงิน</th></tr></thead>
            <tbody>${expenseRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #9ca3af;">ไม่มีข้อมูล</td></tr>'}</tbody>
        </table>
    </div>

    <div class="footer">
        Generated by HipslothProject • ${new Date().toLocaleString('th-TH')}
    </div>

    <script>window.onload = function() { window.print(); }</script>
</body>
</html>
        `

        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(html)
            printWindow.document.close()
        } else {
            alert('กรุณาอนุญาต Popup เพื่อเปิดหน้าพิมพ์')
        }
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
