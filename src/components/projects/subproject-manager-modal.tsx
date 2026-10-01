"use client"

import { useState, useMemo } from "react"
import { Project, SubProject, useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { cn } from "@/lib/utils"
import {
    detectDuplicateSubProjects,
    loadSubProjectPresets,
    SubProjectPresetGroup,
    DEFAULT_PRESET_GROUPS
} from "@/lib/subproject-presets"
import {
    X,
    Sparkles,
    GitMerge,
    CheckCircle2,
    AlertTriangle,
    Layers,
    ArrowRight,
    RefreshCw,
    FolderPlus,
    Trash2,
    Info,
    DollarSign,
    Check
} from "lucide-react"

interface SubProjectManagerModalProps {
    isOpen: boolean
    onClose: () => void
    project: Project
}

export function SubProjectManagerModal({ isOpen, onClose, project }: SubProjectManagerModalProps) {
    const { expenses, updateProject, updateExpense, deleteSubProject } = useProjects()
    const { currentOrg } = useOrganization()

    const [activeTab, setActiveTab] = useState<"merge" | "preset">("merge")
    const [isProcessing, setIsProcessing] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Manual merge state
    const [sourceSpId, setSourceSpId] = useState<string>("")
    const [targetSpId, setTargetSpId] = useState<string>("")

    // Preset state
    const [presetGroups, setPresetGroups] = useState<SubProjectPresetGroup[]>(DEFAULT_PRESET_GROUPS)
    const [selectedPresetId, setSelectedPresetId] = useState<string>("standard-construction")

    // Load presets on mount
    useMemo(() => {
        if (isOpen) {
            loadSubProjectPresets(currentOrg?.id).then(groups => {
                setPresetGroups(groups)
                if (groups.length > 0) setSelectedPresetId(groups[0].id)
            })
        }
    }, [isOpen, currentOrg?.id])

    // Find duplicates automatically
    const duplicateClusters = useMemo(() => {
        return detectDuplicateSubProjects(project.subProjects || [], expenses)
    }, [project.subProjects, expenses])

    if (!isOpen) return null

    // Project expenses
    const projectExpenses = expenses.filter(e => e.projectId === project.id && !e.isDeleted)

    // Execute Merge: Move all expenses and tasks from sourceId to targetId, then delete source
    const executeMerge = async (sourceId: string, targetId: string, sourceName: string, targetName: string) => {
        if (sourceId === targetId) {
            alert("ไม่สามารถรวมโปรเจคย่อยเข้ากับตัวเองได้")
            return
        }

        const confirmMsg = `ยืนยันการรวม "${sourceName}" เข้าสู่ "${targetName}" หรือไม่?\n\n- รายการค่าใช้จ่ายและงานทั้งหมดของ "${sourceName}" จะถูกย้ายมาที่ "${targetName}"\n- ยอดเงินทั้งหมดจะยังคงอยู่ครบถ้วน\n- โปรเจคย่อย "${sourceName}" จะถูกลบออกเพื่อไม่ให้ซ้ำซ้อน`

        if (!confirm(confirmMsg)) return

        setIsProcessing(true)
        try {
            // 1. Find all expenses belonging to sourceId
            const affectedExpenses = projectExpenses.filter(e => e.subProjectId === sourceId)

            // 2. Update each affected expense
            for (const exp of affectedExpenses) {
                await updateExpense(exp.id, { subProjectId: targetId })
            }

            // 3. Remove source subproject from project
            const updatedSubProjects = (project.subProjects || []).filter(sp => sp.id !== sourceId)
            await updateProject(project.id, { subProjects: updatedSubProjects })

            setSuccessMessage(`รวมโปรเจคย่อย "${sourceName}" เข้ากับ "${targetName}" สำเร็จ! ย้ายค่าใช้จ่าย ${affectedExpenses.length} รายการ`)
            setTimeout(() => setSuccessMessage(null), 5000)
            setSourceSpId("")
            setTargetSpId("")
        } catch (err) {
            console.error("Merge error", err)
            alert("เกิดข้อผิดพลาดในการรวมโปรเจคย่อย")
        } finally {
            setIsProcessing(false)
        }
    }

    // Apply Missing Preset Items to Project
    const handleApplyPreset = async () => {
        const activePreset = presetGroups.find(g => g.id === selectedPresetId)
        if (!activePreset) return

        const existingNames = new Set((project.subProjects || []).map(sp => sp.name.trim().toLowerCase()))
        const missingItems = activePreset.items.filter(item => !existingNames.has(item.name.trim().toLowerCase()))

        if (missingItems.length === 0) {
            alert("โปรเจคนี้มีหมวดงานจากพรีเซ็ตครบถ้วนแล้ว")
            return
        }

        if (confirm(`ต้องการเพิ่มหมวดงานที่ยังไม่มี ${missingItems.length} รายการ จากพรีเซ็ตเข้าสู่ "${project.name}" หรือไม่?\n(ข้อมูลเดิมที่มีอยู่จะไม่ถูกลบหรือเปลี่ยนแปลง)`)) {
            setIsProcessing(true)
            try {
                const newSubProjects: SubProject[] = [
                    ...(project.subProjects || []),
                    ...missingItems.map(item => ({
                        id: Math.random().toString(36).substr(2, 9),
                        name: item.name,
                        description: item.description || "Added from preset",
                        status: "Planning" as const
                    }))
                ]

                await updateProject(project.id, { subProjects: newSubProjects })
                setSuccessMessage(`เพิ่ม ${missingItems.length} โปรเจคย่อยจากพรีเซ็ตเข้าสู่โครงการเรียบร้อยแล้ว!`)
                setTimeout(() => setSuccessMessage(null), 5000)
            } catch (err) {
                console.error("Apply preset error", err)
                alert("เกิดข้อผิดพลาดในการนำเข้าพรีเซ็ต")
            } finally {
                setIsProcessing(false)
            }
        }
    }

    const subProjectOptions = project.subProjects || []
    const activePreset = presetGroups.find(g => g.id === selectedPresetId) || presetGroups[0]
    const existingNames = new Set(subProjectOptions.map(sp => sp.name.trim().toLowerCase()))
    const missingPresetItems = activePreset?.items.filter(item => !existingNames.has(item.name.trim().toLowerCase())) || []

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                            <GitMerge className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                จัดการและแก้ปัญหาโปรเจคย่อยซ้ำซ้อน
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                โครงการ: <span className="text-foreground font-semibold">{project.name}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors outline-none focus:outline-none focus-visible:outline-none cursor-pointer"
                        title="ปิดหน้าต่าง"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Tabs (Clean Segmented Tabs - No ugly borders or outlines) */}
                <div className="px-6 py-2.5 bg-muted/20 border-b border-white/5">
                    <div className="flex p-1 bg-muted/50 dark:bg-black/30 rounded-xl gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab("merge")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center outline-none focus:outline-none focus-visible:outline-none cursor-pointer select-none",
                                activeTab === "merge"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <GitMerge className="w-4 h-4 text-primary shrink-0" />
                            <span>รวมโปรเจคย่อยที่ซ้ำกัน (Merge)</span>
                            {duplicateClusters.length > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 text-[10px] rounded-full font-bold",
                                    activeTab === "merge"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-amber-500/10 text-amber-400/80"
                                )}>
                                    พบ {duplicateClusters.length} จุด
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("preset")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center outline-none focus:outline-none focus-visible:outline-none cursor-pointer select-none",
                                activeTab === "preset"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <Layers className="w-4 h-4 text-primary shrink-0" />
                            <span>นำเข้าจากพรีเซ็ตมาตรฐาน (Presets)</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Success notification */}
                    {successMessage && (
                        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {activeTab === "merge" && (
                        <div className="space-y-6">
                            {/* AI / Smart Detection Banner */}
                            <div className="bg-muted/30 border border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        ระบบตรวจจับโปรเจคย่อยที่ซ้ำหรือชื่อใกล้เคียงกัน
                                    </h4>
                                    <span className="text-[11px] text-muted-foreground">
                                        {duplicateClusters.length > 0 ? `พบ ${duplicateClusters.length} กลุ่มที่แนะนำให้รวม` : "ไม่พบชื่อที่ซ้ำกันอย่างชัดเจน"}
                                    </span>
                                </div>

                                {duplicateClusters.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {duplicateClusters.map((cluster, cIdx) => (
                                            <div
                                                key={cIdx}
                                                className="bg-background/80 border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-foreground">
                                                            {cluster.canonicalName}
                                                        </span>
                                                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                            {cluster.reason === "exact" ? "ชื่อซ้ำกันเป๊ะ" : "ชื่อใกล้เคียงกัน"}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        รายการที่ซ้ำ:{" "}
                                                        {cluster.duplicates.map(d => (
                                                            <strong key={d.id} className="text-foreground">
                                                                "{d.name}" ({d.expenseCount} รายการ, ฿{d.totalExpense.toLocaleString()})
                                                            </strong>
                                                        ))}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const dup = cluster.duplicates[0]
                                                        executeMerge(dup.id, cluster.primaryId, dup.name, cluster.canonicalName)
                                                    }}
                                                    disabled={isProcessing}
                                                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto shrink-0"
                                                >
                                                    <GitMerge className="w-3.5 h-3.5" />
                                                    รวมเข้าด้วยกันทันที
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-white/5 rounded-xl text-xs text-muted-foreground flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>ไม่มีรายการซ้ำซ้อนระดับวิกฤต หรือคุณสามารถเลือกคู่ที่ต้องการรวมด้วยตนเองด้านล่าง</span>
                                    </div>
                                )}
                            </div>

                            {/* Manual Merge Form */}
                            <div className="bg-card border border-white/10 rounded-2xl p-5 space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <GitMerge className="w-4 h-4 text-primary" />
                                    รวมโปรเจคย่อยแบบกำหนดเอง (Custom Merge)
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    เลือกโปรเจคย่อยต้นทางที่คุณต้องการลบออก และเลือกโปรเจคย่อยปลายทางที่จะรับรายการค่าใช้จ่ายทั้งหมด
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                                    <div className="sm:col-span-5 space-y-1">
                                        <label className="text-[11px] font-bold text-muted-foreground">
                                            1. โปรเจคย่อยต้นทาง (จะถูกลบออก)
                                        </label>
                                        <select
                                            value={sourceSpId}
                                            onChange={(e) => setSourceSpId(e.target.value)}
                                            className="w-full px-3 py-2 bg-muted/40 border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/40"
                                        >
                                            <option value="">-- เลือกรายการที่จะยุบรวม --</option>
                                            {subProjectOptions.map(sp => {
                                                const spExps = projectExpenses.filter(e => e.subProjectId === sp.id)
                                                return (
                                                    <option key={sp.id} value={sp.id} disabled={sp.id === targetSpId}>
                                                        {sp.name} ({spExps.length} รายจ่าย)
                                                    </option>
                                                )
                                            })}
                                        </select>
                                    </div>

                                    <div className="sm:col-span-1 flex justify-center pt-4 sm:pt-4">
                                        <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90 sm:rotate-0" />
                                    </div>

                                    <div className="sm:col-span-5 space-y-1">
                                        <label className="text-[11px] font-bold text-muted-foreground">
                                            2. โปรเจคย่อยปลายทาง (จะเก็บรักษาไว้)
                                        </label>
                                        <select
                                            value={targetSpId}
                                            onChange={(e) => setTargetSpId(e.target.value)}
                                            className="w-full px-3 py-2 bg-muted/40 border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/40"
                                        >
                                            <option value="">-- เลือกรายการหลักที่จะรวมเข้า --</option>
                                            {subProjectOptions.map(sp => (
                                                <option key={sp.id} value={sp.id} disabled={sp.id === sourceSpId}>
                                                    {sp.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => {
                                            const s = subProjectOptions.find(sp => sp.id === sourceSpId)
                                            const t = subProjectOptions.find(sp => sp.id === targetSpId)
                                            if (s && t) executeMerge(s.id, t.id, s.name, t.name)
                                        }}
                                        disabled={!sourceSpId || !targetSpId || isProcessing}
                                        className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-40"
                                    >
                                        {isProcessing ? (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <GitMerge className="w-4 h-4" />
                                        )}
                                        <span>ยืนยันการรวม 2 โปรเจคย่อยนี้</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "preset" && (
                        <div className="space-y-6">
                            <div className="bg-muted/30 border border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-primary" />
                                            ซิงค์หมวดงานมาตรฐานจากพรีเซ็ต
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            เพิ่มเฉพาะหมวดงานที่โครงการนี้ยังไม่มี โดยไม่กระทบกับข้อมูลที่มีอยู่เดิม
                                        </p>
                                    </div>

                                    <select
                                        value={selectedPresetId}
                                        onChange={(e) => setSelectedPresetId(e.target.value)}
                                        className="px-3 py-1.5 bg-background border border-white/10 rounded-xl text-xs outline-none"
                                    >
                                        {presetGroups.map(g => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-t border-white/10 pt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-foreground">
                                            หมวดงานในพรีเซ็ตที่ยังไม่มีในโปรเจคนี้ ({missingPresetItems.length} รายการ)
                                        </span>
                                        {missingPresetItems.length > 0 && (
                                            <button
                                                onClick={handleApplyPreset}
                                                disabled={isProcessing}
                                                className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 hover:opacity-90 shadow-md shadow-primary/20 transition-all disabled:opacity-40"
                                            >
                                                <FolderPlus className="w-3.5 h-3.5" />
                                                เพิ่มทั้งหมด {missingPresetItems.length} รายการ
                                            </button>
                                        )}
                                    </div>

                                    {missingPresetItems.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                                            {missingPresetItems.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="p-2.5 bg-background border border-white/5 rounded-xl text-xs space-y-0.5"
                                                >
                                                    <div className="font-semibold text-foreground flex items-center justify-between">
                                                        <span>{item.name}</span>
                                                        {item.category && (
                                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-muted-foreground">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                            <span>โครงการนี้มีหมวดงานมาตรฐานจากพรีเซ็ตครบถ้วนแล้ว!</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end shrink-0 bg-muted/20">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-foreground rounded-xl text-xs font-semibold transition-colors outline-none focus:outline-none focus-visible:outline-none cursor-pointer"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    )
}
