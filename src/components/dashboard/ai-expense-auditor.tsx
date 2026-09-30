"use client"

import { useState, useMemo } from "react"
import { useProjects, Expense } from "@/context/project-context"
import { auditProjectExpenses, FuelAnalysisResult } from "@/lib/subproject-presets"
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
    ChevronUp
} from "lucide-react"

interface AIExpenseAuditorProps {
    projectId: string
}

export function AIExpenseAuditor({ projectId }: AIExpenseAuditorProps) {
    const { projects, expenses, updateExpense } = useProjects()

    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(true)
    const [aiSummary, setAiSummary] = useState<string | null>(null)
    const [isRunningAi, setIsRunningAi] = useState(false)

    const project = projects.find(p => p.id === projectId)
    const subProjects = project?.subProjects || []

    const auditResult: FuelAnalysisResult = useMemo(() => {
        return auditProjectExpenses(projectId, subProjects, expenses)
    }, [projectId, subProjects, expenses])

    // Fix item category to "Fuel"
    const handleReclassifyToFuel = async (expense: Expense) => {
        setIsUpdating(expense.id)
        try {
            await updateExpense(expense.id, {
                category: "Fuel" as any
            })
            setSuccessMessage(`ปรับรายการ "${expense.title}" เป็นหมวดค่าน้ำมัน (Fuel) เรียบร้อย! กราฟจะอัปเดตทันที`)
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (e) {
            console.error("Update expense error", e)
            alert("เกิดข้อผิดพลาดในการอัปเดตรายการ")
        } finally {
            setIsUpdating(null)
        }
    }

    // AI Deep Analysis (synthesize insights)
    const runAiDeepInsight = async () => {
        setIsRunningAi(true)
        try {
            // Simulate Gemini deep correlation summary based on live project expenses
            await new Promise(r => setTimeout(r, 900))
            const fuelSPCount = auditResult.subProjectsWithFuel.length
            const topSpName = auditResult.subProjectsWithFuel[0]?.subProjectName || "ทั่วไป"
            const total = auditResult.totalFuelExpense

            setAiSummary(
                `จากการวิเคราะห์ความเกี่ยวเนื่องของต้นทุนใน "${project?.name || "โครงการ"}": พบการใช้จ่ายน้ำมันเชื้อเพลิงรวม ฿${total.toLocaleString()} กระจายตัวอยู่ใน ${fuelSPCount} หมวดงานหลัก โดยสัมพันธ์กับกิจกรรมหน้างานดังนี้: (1) หมวด ${topSpName} เป็นสัดส่วนหลักที่ใช้เชื้อเพลิงสำหรับการเดินเครื่องจักรหนักและรถดัมพ์ (2) รายจ่ายค่าน้ำมันส่วนใหญ่สอดคล้องกับช่วงเริ่มเปิดหน้างานและงานฐานราก ข้อเสนอแนะ: ควบคุมการออกบิลโดยระบุทะเบียนรถหรือเครื่องจักรในบันทึก เพื่อแยกต้นทุนค่าเชื้อเพลิงระหว่างงานรับเหมาช่วงกับงานขนส่งบริษัทให้ชัดเจนยิ่งขึ้น`
            )
        } finally {
            setIsRunningAi(false)
        }
    }

    if (!project) return null

    const hasHiddenFuel = auditResult.hiddenFuelCount > 0
    const hasFuelAtAll = auditResult.totalFuelExpense > 0 || auditResult.subProjectsWithFuel.length > 0

    return (
        <div className="bg-gradient-to-br from-card/90 via-card/70 to-card/50 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            {/* Ambient glow */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shrink-0">
                        <Fuel className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5">
                                AI Expense & Fuel Auditor
                            </h3>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Smart Analysis
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            วิเคราะห์ตรวจสอบค่าน้ำมันข้ามโปรเจคย่อย และตรวจจับรายการที่อาจลงผิดหมวดหมู่
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Success Toast */}
            {successMessage && (
                <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {isExpanded && (
                <div className="mt-5 space-y-5 animate-in fade-in duration-200">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-black/25 border border-white/5 rounded-2xl p-4 space-y-1">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                ยอดค่าน้ำมันตรวจพบรวม
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black font-mono text-cyan-300">
                                    ฿{auditResult.totalFuelExpense.toLocaleString()}
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground block">
                                รวมทั้งที่บันทึกตรงหมวด และที่แฝงในหมวดอื่น
                            </span>
                        </div>

                        <div className="bg-black/25 border border-white/5 rounded-2xl p-4 space-y-1">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                รายการที่ลงหมวด Fuel แล้ว
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black font-mono text-foreground">
                                    {auditResult.recordedFuelCount} รายการ
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground block">
                                แสดงบนกราฟวงกลมสัดส่วนค่าใช้จ่าย
                            </span>
                        </div>

                        <div className={`border rounded-2xl p-4 space-y-1 ${hasHiddenFuel
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-black/25 border-white/5"
                            }`}>
                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${hasHiddenFuel ? "text-amber-400" : "text-muted-foreground"
                                }`}>
                                ต้องสงสัยว่าลงผิดหมวด
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-2xl font-black font-mono ${hasHiddenFuel ? "text-amber-300" : "text-emerald-400"
                                    }`}>
                                    {auditResult.hiddenFuelCount} รายการ
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground block">
                                {hasHiddenFuel
                                    ? `มูลค่า ฿${auditResult.hiddenFuelExpense.toLocaleString()} ยังไม่ถูกนับในกราฟค่าน้ำมัน`
                                    : "การจำแนกหมวดหมู่น้ำมันถูกต้องครบถ้วน"}
                            </span>
                        </div>
                    </div>

                    {/* MISCLASSIFIED ITEMS WARNING & ONE-CLICK FIX */}
                    {hasHiddenFuel && (
                        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        พบค่าน้ำมันที่ถูกบันทึกเป็นหมวดหมู่อื่น (Misclassified Fuel Items)
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        รายการเหล่านี้มีคำระบุค่าน้ำมัน/ปั๊มน้ำมัน แต่ถูกลงเป็นหมวดอื่น เช่น ค่าวัสดุ หรือ ค่าใช้จ่ายอื่นๆ สามารถกดปรับให้ตรงหมวดเพื่อความแม่นยำของกราฟได้ทันที
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {auditResult.misclassifiedItems.map(item => (
                                    <div
                                        key={item.expense.id}
                                        className="bg-background/90 border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-foreground">
                                                    {item.expense.title}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-amber-300">
                                                    {item.expense.amount}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                                                    คำที่ตรวจพบ: "{item.detectedKeyword}"
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                                <span>อยู่ในโปรเจคย่อย: <strong className="text-foreground">{item.subProjectName}</strong></span>
                                                <span>•</span>
                                                <span>หมวดปัจจุบัน: <span className="line-through text-red-400">{item.currentCategory}</span></span>
                                                <ArrowRight className="w-3 h-3 text-cyan-400" />
                                                <span className="text-cyan-400 font-bold">หมวดที่แนะนำ: Fuel</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleReclassifyToFuel(item.expense)}
                                            disabled={isUpdating === item.expense.id}
                                            className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 shadow-sm"
                                        >
                                            {isUpdating === item.expense.id ? (
                                                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5" />
                                            )}
                                            <span>เปลี่ยนเป็นหมวด Fuel ทันที</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CORRELATION ACROSS SUB-PROJECTS */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Layers className="w-4 h-4 text-cyan-400" />
                                การกระจายตัวของค่าน้ำมันในแต่ละโปรเจคย่อย (Sub-project Distribution)
                            </h4>
                            <span className="text-xs text-muted-foreground font-mono">
                                รวม {auditResult.subProjectsWithFuel.length} หมวดงาน
                            </span>
                        </div>

                        {auditResult.subProjectsWithFuel.length > 0 ? (
                            <div className="space-y-3">
                                {auditResult.subProjectsWithFuel.map((sp, idx) => {
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
                                ยังไม่พบบันทึกค่าน้ำมันในโปรเจคย่อยใดๆ ของโครงการนี้
                            </p>
                        )}
                    </div>

                    {/* CORRELATION INSIGHTS & AI SUMMARY */}
                    <div className="p-4 bg-muted/20 border border-white/5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                บทวิเคราะห์ความเกี่ยวเนื่องเชิงต้นทุน (Correlation Insights)
                            </h4>

                            <button
                                onClick={runAiDeepInsight}
                                disabled={isRunningAi}
                                className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {isRunningAi ? "กำลังประมวลผล AI..." : "ขอสรุปเชิงลึกด้วย AI"}
                            </button>
                        </div>

                        <ul className="space-y-1.5 text-xs text-muted-foreground pl-1">
                            {auditResult.correlationInsights.map((insight, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-cyan-400 mt-0.5">•</span>
                                    <span>{insight}</span>
                                </li>
                            ))}
                        </ul>

                        {aiSummary && (
                            <div className="mt-3 p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-foreground leading-relaxed animate-in fade-in">
                                <div className="font-bold text-primary mb-1 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    ผลการวิเคราะห์เจาะลึกจาก AI:
                                </div>
                                <p className="text-muted-foreground">{aiSummary}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
