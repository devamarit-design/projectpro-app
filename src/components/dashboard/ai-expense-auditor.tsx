"use client"

import { useState, useMemo } from "react"
import { useProjects, Expense, ExpenseCategory } from "@/context/project-context"
import { auditComprehensiveProjectExpenses, ProjectAuditResult, AuditCategory } from "@/lib/ai-financial-auditor"
import {
    Sparkles,
    Fuel,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    TrendingUp,
    Layers,
    Wrench,
    Check,
    RotateCw,
    ExternalLink,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    FileQuestion,
    CopyX,
    PieChart,
    ShieldAlert,
    ShieldCheck,
    Play,
    Eye,
    EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AIExpenseAuditorProps {
    projectId: string
}

export function AIExpenseAuditor({ projectId }: AIExpenseAuditorProps) {
    const { projects, expenses, updateExpense } = useProjects()

    // Control whether analysis has been run by user
    const [hasAnalyzed, setHasAnalyzed] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisStep, setAnalysisStep] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"all" | "category" | "slips" | "duplicates" | "fuel" | "distribution" | "insights">("all")
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Updating state for inline fixes
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const project = projects.find(p => p.id === projectId)
    const subProjects = project?.subProjects || []

    const projectExpenses = useMemo(() => {
        return expenses.filter(e => e.projectId === projectId && !e.isDeleted)
    }, [expenses, projectId])

    const totalProjectExpenseAmount = useMemo(() => {
        return projectExpenses.reduce((sum, e) => sum + (e.totalValue || 0), 0)
    }, [projectExpenses])

    // Compute comprehensive audit results when analyzed
    const auditResult: ProjectAuditResult | null = useMemo(() => {
        if (!hasAnalyzed) return null
        return auditComprehensiveProjectExpenses(projectId, subProjects, expenses)
    }, [hasAnalyzed, projectId, subProjects, expenses])

    // Trigger AI Analysis
    const handleRunAnalysis = async () => {
        setIsAnalyzing(true)
        setIsCollapsed(false)
        try {
            setAnalysisStep("กำลังสแกนรายการค่าใช้จ่ายทั้งหมดในโครงการ...")
            await new Promise(r => setTimeout(r, 400))
            setAnalysisStep("ตรวจสอบความสอดคล้องของหมวดหมู่ (ค่าน้ำมัน, ค่าแรง, ค่าเช่าเครื่องจักร, งานเหมา)...")
            await new Promise(r => setTimeout(r, 450))
            setAnalysisStep("ตรวจจับใบเสร็จ/สลิปที่ยังไม่ได้แนบ และค้นหารายการที่อาจซ้ำซ้อน...")
            await new Promise(r => setTimeout(r, 400))
            setAnalysisStep("ประมวลผลข้อเสนอแนะเชิงลึกจาก AI...")
            await new Promise(r => setTimeout(r, 300))
            setHasAnalyzed(true)
        } finally {
            setIsAnalyzing(false)
            setAnalysisStep("")
        }
    }

    // Fix item category one-click
    const handleReclassify = async (expense: Expense, targetCategory: AuditCategory) => {
        setIsUpdating(expense.id)
        try {
            await updateExpense(expense.id, {
                category: targetCategory as any
            })
            setSuccessMessage(`ปรับรายการ "${expense.title}" เป็นหมวด ${targetCategory} เรียบร้อยแล้ว!`)
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (e) {
            console.error("Update expense error", e)
            alert("เกิดข้อผิดพลาดในการอัปเดตรายการ")
        } finally {
            setIsUpdating(null)
        }
    }

    if (!project) return null

    return (
        <div className="bg-gradient-to-br from-card/90 via-card/75 to-card/50 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            {/* Ambient glow */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary border border-primary/30 shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5">
                                AI Financial & Cost Auditor
                            </h3>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                Smart Analysis
                            </span>
                            {hasAnalyzed && auditResult && (
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                    auditResult.healthGrade === "A" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                    auditResult.healthGrade === "B" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                                    "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                )}>
                                    Health Score: {auditResult.financialHealthScore}/100 (เกรด {auditResult.healthGrade})
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            ตรวจสอบค่าใช้จ่ายรอบด้าน: หมวดหมู่ต้องสงสัย, ใบเสร็จตกหล่น, รายการเสี่ยงซ้ำ และสัดส่วนต้นทุน
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {hasAnalyzed ? (
                        <>
                            <button
                                onClick={handleRunAnalysis}
                                disabled={isAnalyzing}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-muted-foreground hover:text-foreground border border-white/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
                                title="วิเคราะห์ข้อมูลใหม่อีกครั้ง"
                            >
                                <RotateCw className={cn("w-3.5 h-3.5", isAnalyzing && "animate-spin")} />
                                <span>วิเคราะห์ใหม่</span>
                            </button>
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors border border-white/5"
                                title={isCollapsed ? "ขยายดูผลวิเคราะห์" : "ย่อผลวิเคราะห์"}
                            >
                                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleRunAnalysis}
                            disabled={isAnalyzing}
                            className="px-4 py-2 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>{isAnalyzing ? "กำลังวิเคราะห์..." : "กดวิเคราะห์ด้วย AI"}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Success Toast */}
            {successMessage && (
                <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* STATE 1: ANALYZING IN PROGRESS */}
            {isAnalyzing && (
                <div className="mt-6 p-6 rounded-2xl bg-black/30 border border-primary/20 space-y-4 text-center animate-in fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 mx-auto flex items-center justify-center animate-pulse">
                        <Sparkles className="w-6 h-6 animate-spin" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">AI กำลังวิเคราะห์ข้อมูลค่าใช้จ่ายและต้นทุน</h4>
                        <p className="text-xs text-primary font-mono mt-1 animate-pulse">{analysisStep}</p>
                    </div>
                    <div className="w-full max-w-md mx-auto h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary w-full animate-indeterminate" />
                    </div>
                </div>
            )}

            {/* STATE 2: NOT ANALYZED YET (Compact Launch Prompt) */}
            {!hasAnalyzed && !isAnalyzing && (
                <div className="mt-5 p-5 rounded-2xl bg-black/20 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>พบข้อมูลค่าใช้จ่ายโครงการทั้งหมด <strong>{projectExpenses.length} รายการ</strong> (มูลค่ารวม ฿{totalProjectExpenseAmount.toLocaleString()})</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            กดปุ่มวิเคราะห์เพื่อตรวจหาหมวดหมู่ต้องสงสัย (น้ำมัน, ค่าแรง, ค่าเช่า), รายการที่ไม่มีสลิป, ความเสี่ยงจ่ายซ้ำ และสัดส่วนต้นทุน
                        </p>
                    </div>
                    <button
                        onClick={handleRunAnalysis}
                        className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all shrink-0 active:scale-95"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>เริ่มวิเคราะห์ทันที</span>
                    </button>
                </div>
            )}

            {/* STATE 3: ANALYZED RESULTS (Rich Multi-Aspect Dashboard) */}
            {hasAnalyzed && auditResult && !isCollapsed && (
                <div className="mt-5 space-y-5 animate-in fade-in duration-200">

                    {/* TOP KEY METRICS CARDS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Category Misclassifications */}
                        <div
                            onClick={() => setActiveTab("category")}
                            className={cn(
                                "border rounded-2xl p-3.5 space-y-1 cursor-pointer transition-all hover:border-white/20",
                                auditResult.misclassifiedCount > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-black/25 border-white/5",
                                activeTab === "category" && "ring-2 ring-amber-400/50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", auditResult.misclassifiedCount > 0 ? "text-amber-400" : "text-muted-foreground")}>
                                    หมวดหมู่ต้องสงสัย
                                </span>
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            <div className="text-xl sm:text-2xl font-black font-mono text-foreground">
                                {auditResult.misclassifiedCount} <span className="text-xs font-normal text-muted-foreground">รายการ</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block truncate">
                                {auditResult.misclassifiedCount > 0 ? `มูลค่า ฿${auditResult.misclassifiedTotalAmount.toLocaleString()}` : "หมวดหมู่ลงถูกต้องทั้งหมด"}
                            </span>
                        </div>

                        {/* 2. Missing Receipts */}
                        <div
                            onClick={() => setActiveTab("slips")}
                            className={cn(
                                "border rounded-2xl p-3.5 space-y-1 cursor-pointer transition-all hover:border-white/20",
                                auditResult.missingSlipsCount > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-black/25 border-white/5",
                                activeTab === "slips" && "ring-2 ring-rose-400/50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", auditResult.missingSlipsCount > 0 ? "text-rose-400" : "text-muted-foreground")}>
                                    สลิป/หลักฐานตกหล่น
                                </span>
                                <FileQuestion className="w-3.5 h-3.5 text-rose-400" />
                            </div>
                            <div className="text-xl sm:text-2xl font-black font-mono text-foreground">
                                {auditResult.missingSlipsCount} <span className="text-xs font-normal text-muted-foreground">รายการ</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block truncate">
                                {auditResult.missingSlipsCount > 0 ? `มูลค่า ฿${auditResult.missingSlipsTotalAmount.toLocaleString()}` : "มีหลักฐานแนบครบถ้วน"}
                            </span>
                        </div>

                        {/* 3. Duplicate Risks */}
                        <div
                            onClick={() => setActiveTab("duplicates")}
                            className={cn(
                                "border rounded-2xl p-3.5 space-y-1 cursor-pointer transition-all hover:border-white/20",
                                auditResult.duplicateRisksCount > 0 ? "bg-purple-500/10 border-purple-500/30" : "bg-black/25 border-white/5",
                                activeTab === "duplicates" && "ring-2 ring-purple-400/50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", auditResult.duplicateRisksCount > 0 ? "text-purple-400" : "text-muted-foreground")}>
                                    เสี่ยงจ่ายซ้ำซ้อน
                                </span>
                                <CopyX className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            <div className="text-xl sm:text-2xl font-black font-mono text-foreground">
                                {auditResult.duplicateRisksCount} <span className="text-xs font-normal text-muted-foreground">จุด</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block truncate">
                                {auditResult.duplicateRisksCount > 0 ? "พบยอดหรือชื่อตรงกัน" : "ไม่พบรายการเสี่ยงซ้ำ"}
                            </span>
                        </div>

                        {/* 4. Fuel Total */}
                        <div
                            onClick={() => setActiveTab("fuel")}
                            className={cn(
                                "border rounded-2xl p-3.5 space-y-1 cursor-pointer transition-all hover:border-white/20 bg-cyan-500/10 border-cyan-500/30",
                                activeTab === "fuel" && "ring-2 ring-cyan-400/50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                    ค่าน้ำมันตรวจพบรวม
                                </span>
                                <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                                ฿{auditResult.totalFuelExpense.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-muted-foreground block truncate">
                                {auditResult.hiddenFuelCount > 0 ? `มีแฝงหมวดอื่น ฿${auditResult.hiddenFuelExpense.toLocaleString()}` : "บันทึกตรงหมวดครบ"}
                            </span>
                        </div>
                    </div>

                    {/* SECTION TABS */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 hide-scrollbar text-xs">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={cn(
                                "px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap",
                                activeTab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            ดูทุกเรื่อง (Overview)
                        </button>
                        <button
                            onClick={() => setActiveTab("category")}
                            className={cn(
                                "px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                                activeTab === "category" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <span>หมวดหมู่ต้องสงสัย</span>
                            {auditResult.misclassifiedCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                                    {auditResult.misclassifiedCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("slips")}
                            className={cn(
                                "px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                                activeTab === "slips" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <span>สลิปตกหล่น</span>
                            {auditResult.missingSlipsCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                    {auditResult.missingSlipsCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("duplicates")}
                            className={cn(
                                "px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                                activeTab === "duplicates" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <span>เสี่ยงจ่ายซ้ำ</span>
                            {auditResult.duplicateRisksCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                                    {auditResult.duplicateRisksCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("fuel")}
                            className={cn(
                                "px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                                activeTab === "fuel" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <span>ค่าน้ำมัน & ยานพาหนะ</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("distribution")}
                            className={cn(
                                "px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                                activeTab === "distribution" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <span>สัดส่วนต้นทุน & โปรเจกต์ย่อย</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("insights")}
                            className={cn(
                                "px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                                activeTab === "insights" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <span>ข้อเสนอแนะ AI</span>
                        </button>
                    </div>

                    {/* TAB CONTENT: 1. MISCLASSIFIED ITEMS */}
                    {(activeTab === "all" || activeTab === "category") && (
                        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        รายการที่ตรวจพบว่าอาจลงหมวดหมู่ผิด (Category Misclassifications)
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        AI ตรวจพบคำระบุเฉพาะ (ค่าน้ำมัน, ค่าแรง, ค่าเช่าเครื่องจักร, ค่าอาหาร) ที่ถูกบันทึกผิดหมวด สามารถกดปุ่มปรับหมวดหมู่ให้ตรงได้ทันที
                                    </p>
                                </div>
                                <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
                                    {auditResult.misclassifiedCount} รายการ
                                </span>
                            </div>

                            {auditResult.misclassifiedCount > 0 ? (
                                <div className="space-y-2">
                                    {auditResult.misclassifiedItems.map(item => (
                                        <div
                                            key={item.expense.id}
                                            className="bg-background/90 border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-foreground truncate">
                                                        {item.expense.title}
                                                    </span>
                                                    <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                                                        ฿{(item.expense.totalValue || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground shrink-0">
                                                        คำที่ตรวจพบ: "{item.detectedKeyword}"
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.reason}
                                                </p>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                                    <span>โปรเจกต์ย่อย: <strong className="text-foreground">{item.subProjectName}</strong></span>
                                                    <span>•</span>
                                                    <span>หมวดปัจจุบัน: <span className="line-through text-red-400 font-semibold">{item.currentCategory}</span></span>
                                                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                                                    <span className="text-cyan-400 font-bold">หมวดที่แนะนำ: {item.suggestedCategory}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleReclassify(item.expense, item.suggestedCategory)}
                                                disabled={isUpdating === item.expense.id}
                                                className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 shadow-sm active:scale-95"
                                            >
                                                {isUpdating === item.expense.id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Check className="w-3.5 h-3.5" />
                                                )}
                                                <span>เปลี่ยนเป็นหมวด {item.suggestedCategory} ทันที</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-emerald-400 py-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    ไม่พบรายการที่ลงหมวดหมู่ผิด การจัดหมวดหมู่ทั้งหมดถูกต้องตามข้อความรายการ
                                </p>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: 2. MISSING RECEIPTS / SLIPS */}
                    {(activeTab === "all" || activeTab === "slips") && (
                        <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                                        <FileQuestion className="w-4 h-4 text-rose-400" />
                                        รายการยอดสูงที่ยังไม่มีสลิป/ใบเสร็จแนบ (Missing Receipts Audit)
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        รายการค่าใช้จ่าย (ตั้งแต่ ฿500 ขึ้นไป) ที่ยังไม่แนบหลักฐานสลิปโอนหรือใบเสร็จ อาจกระทบต่อการตรวจบัญชีภาษี
                                    </p>
                                </div>
                                <span className="text-xs font-mono font-bold text-rose-300 shrink-0">
                                    {auditResult.missingSlipsCount} รายการ
                                </span>
                            </div>

                            {auditResult.missingSlipsCount > 0 ? (
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {auditResult.missingSlips.slice(0, 10).map(({ expense, subProjectName }) => (
                                        <div
                                            key={expense.id}
                                            className="bg-background/90 border border-rose-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-foreground truncate">
                                                        {expense.title}
                                                    </span>
                                                    <span className="font-mono text-xs font-bold text-rose-300 shrink-0">
                                                        ฿{(expense.totalValue || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                                                        หมวด: {expense.category}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                    <span>ผู้รับ: <strong className="text-foreground">{expense.payee || "ไม่ระบุ"}</strong></span>
                                                    <span>•</span>
                                                    <span>วันที่: {expense.date || "-"}</span>
                                                    <span>•</span>
                                                    <span>โปรเจกต์ย่อย: {subProjectName}</span>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
                                                ยังไม่มีสลิป
                                            </span>
                                        </div>
                                    ))}
                                    {auditResult.missingSlipsCount > 10 && (
                                        <p className="text-xs text-muted-foreground text-center pt-1">
                                            และอีก {auditResult.missingSlipsCount - 10} รายการ
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-emerald-400 py-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    รายการค่าใช้จ่ายยอดสำคัญทั้งหมดมีรูปสลิปหรือใบเสร็จแนบเรียบร้อยแล้ว
                                </p>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: 3. DUPLICATE PAYMENT RISKS */}
                    {(activeTab === "all" || activeTab === "duplicates") && (
                        <div className="bg-purple-500/10 border border-purple-500/25 rounded-2xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                                        <CopyX className="w-4 h-4 text-purple-400" />
                                        รายการที่อาจจ่ายซ้ำซ้อน (Duplicate Payment Risk)
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ตรวจพบรายการที่มีชื่อ ยอดเงิน หรือร้านค้าตรงกันในวันใกล้เคียงกัน แนะนำให้ตรวจสอบเพื่อป้องกันเงินรั่วไหล
                                    </p>
                                </div>
                                <span className="text-xs font-mono font-bold text-purple-300 shrink-0">
                                    {auditResult.duplicateRisksCount} จุด
                                </span>
                            </div>

                            {auditResult.duplicateRisksCount > 0 ? (
                                <div className="space-y-2">
                                    {auditResult.duplicateRisks.map((dup, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-background/90 border border-purple-500/20 rounded-xl p-3 space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-purple-300">
                                                    จุดสงสัยที่ {idx + 1}: {dup.reason}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    โปรเจกต์ย่อย: {dup.subProjectName}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                                                <div className="p-2 rounded-lg bg-white/5 border border-white/5 space-y-0.5">
                                                    <p className="font-semibold text-foreground truncate">1. {dup.expenseA.title}</p>
                                                    <p className="text-muted-foreground text-[11px]">
                                                        ยอด: ฿{(dup.expenseA.totalValue || 0).toLocaleString()} • วันที่: {dup.expenseA.date || "-"} • ร้าน: {dup.expenseA.payee || "-"}
                                                    </p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-white/5 border border-white/5 space-y-0.5">
                                                    <p className="font-semibold text-foreground truncate">2. {dup.expenseB.title}</p>
                                                    <p className="text-muted-foreground text-[11px]">
                                                        ยอด: ฿{(dup.expenseB.totalValue || 0).toLocaleString()} • วันที่: {dup.expenseB.date || "-"} • ร้าน: {dup.expenseB.payee || "-"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-emerald-400 py-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    ไม่พบรายการที่เข้าข่ายจ่ายซ้ำซ้อนในโครงการนี้
                                </p>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: 4. FUEL & VEHICLE EXPENSES */}
                    {(activeTab === "all" || activeTab === "fuel") && (
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Fuel className="w-4 h-4 text-cyan-400" />
                                    การกระจายตัวของค่าน้ำมันและยานพาหนะ (Fuel Distribution)
                                </h4>
                                <span className="text-xs text-cyan-300 font-mono font-bold">
                                    รวม ฿{auditResult.totalFuelExpense.toLocaleString()}
                                </span>
                            </div>

                            {auditResult.fuelSubprojects.length > 0 ? (
                                <div className="space-y-3">
                                    {auditResult.fuelSubprojects.map((sp, idx) => {
                                        const percentage = auditResult.totalFuelExpense > 0
                                            ? (sp.fuelTotal / auditResult.totalFuelExpense) * 100
                                            : 0
                                        return (
                                            <div key={idx} className="space-y-1.5">
                                                <div className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground">{sp.subProjectName}</span>
                                                        <span className="text-[10px] text-muted-foreground">({sp.items.length} รายการ)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-cyan-300">
                                                            ฿{sp.fuelTotal.toLocaleString()}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">
                                                            {percentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground py-2">
                                    ยังไม่พบบันทึกค่าน้ำมันในโปรเจกต์ย่อยใดๆ ของโครงการนี้
                                </p>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: 5. COST STRUCTURE & SUBPROJECT DISTRIBUTION */}
                    {(activeTab === "all" || activeTab === "distribution") && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Category Breakdown */}
                            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-primary" />
                                    สัดส่วนหมวดหมู่ต้นทุน (Category Structure)
                                </h4>
                                <div className="space-y-2.5 pt-1">
                                    {auditResult.categoryBreakdown.map((cat, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                                    <span className="font-semibold text-foreground">{cat.label}</span>
                                                    <span className="text-[10px] text-muted-foreground">({cat.itemCount} รายการ)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-foreground">
                                                        ฿{cat.totalAmount.toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">
                                                        {cat.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.color }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subproject Distribution */}
                            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-purple-400" />
                                    หมวดงานที่ใช้จ่ายสูงสุด (Top Cost Drivers)
                                </h4>
                                <div className="space-y-2.5 pt-1">
                                    {auditResult.subProjectStats.slice(0, 5).map((sp, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-semibold text-foreground truncate max-w-[200px]">
                                                    {idx + 1}. {sp.subProjectName}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-foreground">
                                                        ฿{sp.totalAmount.toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">
                                                        {sp.percentageOfTotal.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(sp.percentageOfTotal, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: 6. AI STRATEGIC RECOMMENDATIONS */}
                    {(activeTab === "all" || activeTab === "insights") && (
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    บทวิเคราะห์และข้อเสนอแนะเชิงกลยุทธ์จาก AI (AI Strategic Advice)
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                                    Gemini Insights
                                </span>
                            </div>

                            <ul className="space-y-2 text-xs text-muted-foreground pl-1">
                                {auditResult.strategicInsights.map((insight, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                        <span className="leading-relaxed text-foreground/90">{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
            )}
        </div>
    )
}
