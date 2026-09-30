"use client"

import { useState, useEffect } from "react"
import { useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import {
    SubProjectPresetGroup,
    SubProjectPresetItem,
    DEFAULT_PRESET_GROUPS,
    loadSubProjectPresets,
    saveSubProjectPresets
} from "@/lib/subproject-presets"
import {
    Layers,
    Plus,
    Trash2,
    Save,
    RotateCcw,
    Check,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Sparkles,
    FolderKanban,
    Tag,
    ListChecks
} from "lucide-react"

export function SubProjectPresetsSettings() {
    const { projects, updateProject } = useProjects()
    const { currentOrg } = useOrganization()

    const [presetGroups, setPresetGroups] = useState<SubProjectPresetGroup[]>(DEFAULT_PRESET_GROUPS)
    const [selectedGroupId, setSelectedGroupId] = useState<string>("standard-construction")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // New item form
    const [newItemName, setNewItemName] = useState("")
    const [newItemDesc, setNewItemDesc] = useState("")
    const [newItemCategory, setNewItemCategory] = useState<SubProjectPresetItem["category"]>("Structure")

    // Project Test Sync State
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [syncSuccess, setSyncSuccess] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)

    // Load presets
    useEffect(() => {
        let mounted = true
        async function fetchPresets() {
            setIsLoading(true)
            const data = await loadSubProjectPresets(currentOrg?.id)
            if (mounted) {
                setPresetGroups(data)
                if (data.length > 0 && !data.some(g => g.id === selectedGroupId)) {
                    setSelectedGroupId(data[0].id)
                }
                setIsLoading(false)
            }
        }
        fetchPresets()
        return () => { mounted = false }
    }, [currentOrg?.id])

    // Auto-select "คุณต้น" project if available for testing
    useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            const tonProject = projects.find(p => p.customer?.includes("ต้น") || p.name.includes("ต้น"))
            if (tonProject) {
                setSelectedProjectId(tonProject.id)
            } else {
                setSelectedProjectId(projects[0].id)
            }
        }
    }, [projects, selectedProjectId])

    const activeGroup = presetGroups.find(g => g.id === selectedGroupId) || presetGroups[0]

    // Save Presets
    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveSubProjectPresets(currentOrg?.id, presetGroups)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (e) {
            console.error("Save error", e)
            alert("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
        } finally {
            setIsSaving(false)
        }
    }

    // Reset to Factory Default
    const handleResetDefault = () => {
        if (confirm("ต้องการรีเซ็ตพรีเซ็ตทั้งหมดกลับเป็นค่ามาตรฐานเริ่มต้นของระบบหรือไม่?")) {
            setPresetGroups(DEFAULT_PRESET_GROUPS)
            saveSubProjectPresets(currentOrg?.id, DEFAULT_PRESET_GROUPS)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        }
    }

    // Add Item to current active group
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItemName.trim()) return

        const newItem: SubProjectPresetItem = {
            id: `item-${Date.now()}`,
            name: newItemName.trim(),
            description: newItemDesc.trim(),
            category: newItemCategory
        }

        setPresetGroups(prev => prev.map(g => {
            if (g.id === activeGroup.id) {
                return {
                    ...g,
                    items: [...g.items, newItem]
                }
            }
            return g
        }))

        setNewItemName("")
        setNewItemDesc("")
    }

    // Delete Item
    const handleDeleteItem = (itemId: string) => {
        setPresetGroups(prev => prev.map(g => {
            if (g.id === activeGroup.id) {
                return {
                    ...g,
                    items: g.items.filter(item => item.id !== itemId)
                }
            }
            return g
        }))
    }

    // Sync Preset to Selected Project (e.g. คุณต้น)
    const handleSyncToProject = async () => {
        if (!selectedProjectId || !activeGroup) return
        const targetProj = projects.find(p => p.id === selectedProjectId)
        if (!targetProj) return

        const existingNames = new Set((targetProj.subProjects || []).map(sp => sp.name.trim().toLowerCase()))
        const itemsToAdd = activeGroup.items.filter(item => !existingNames.has(item.name.trim().toLowerCase()))

        if (itemsToAdd.length === 0) {
            alert(`โปรเจค "${targetProj.name}" มีหมวดงานในพรีเซ็ตนี้ครบหมดแล้ว ไม่พบรายการตกหล่น`)
            return
        }

        if (confirm(`ต้องการเพิ่มโปรเจคย่อยที่ยังไม่มี ${itemsToAdd.length} รายการ จากพรีเซ็ตเข้าสู่ "${targetProj.name}" หรือไม่?\n(จะไม่ลบหรือกระทบโปรเจคย่อยเดิมที่มีอยู่)`)) {
            setIsSyncing(true)
            try {
                const newSubProjects = [
                    ...(targetProj.subProjects || []),
                    ...itemsToAdd.map(item => ({
                        id: Math.random().toString(36).substr(2, 9),
                        name: item.name,
                        description: item.description,
                        status: "Planning" as const
                    }))
                ]

                await updateProject(targetProj.id, { subProjects: newSubProjects })
                setSyncSuccess(`เพิ่ม ${itemsToAdd.length} หมวดงานเข้าสู่ "${targetProj.name}" เรียบร้อยแล้ว!`)
                setTimeout(() => setSyncSuccess(null), 4000)
            } catch (err) {
                console.error("Sync error", err)
                alert("เกิดข้อผิดพลาดในการซิงค์ข้อมูล")
            } finally {
                setIsSyncing(false)
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
                กำลังโหลดการตั้งค่าพรีเซ็ต...
            </div>
        )
    }

    const testProject = projects.find(p => p.id === selectedProjectId)

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" />
                        ตั้งค่าพรีเซ็ตโปรเจคย่อย (Sub-project Presets)
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        กำหนดแม่แบบหมวดงานมาตรฐานสำหรับองค์กร เพื่อใช้ตั้งต้นเวลาสร้างโปรเจคใหม่ ป้องกันคนในทีมตั้งชื่อซ้ำซ้อน
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleResetDefault}
                        className="px-3.5 py-2 text-xs rounded-xl border border-white/10 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                        title="คืนค่าตั้งต้นจากโรงงาน"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        รีเซ็ตค่ามาตรฐาน
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl flex items-center gap-1.5 hover:opacity-90 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : saveSuccess ? (
                            <Check className="w-3.5 h-3.5 text-green-300" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        {saveSuccess ? "บันทึกเรียบร้อย!" : "บันทึกพรีเซ็ต"}
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>บันทึกการตั้งค่าพรีเซ็ตโปรเจคย่อยสำหรับทั้งองค์กรเรียบร้อยแล้ว ทุกโปรเจคใหม่จะสามารถใช้ชุดนี้ได้ทันที</span>
                </div>
            )}

            {/* Preset Group Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {presetGroups.map(group => (
                    <button
                        key={group.id}
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap border ${group.id === activeGroup.id
                            ? "bg-primary/15 border-primary/40 text-primary shadow-sm"
                            : "bg-muted/40 border-white/5 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            }`}
                    >
                        <FolderKanban className="w-4 h-4" />
                        <span>{group.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono">
                            {group.items.length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Group Info & Stats */}
            <div className="bg-card/40 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-base text-foreground">{activeGroup.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeGroup.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-medium">
                        {activeGroup.items.length} หมวดงานย่อย
                    </span>
                </div>
            </div>

            {/* List of Preset Items */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-primary" />
                        รายการโปรเจคย่อยในพรีเซ็ต ({activeGroup.items.length} รายการ)
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                        * สามารถเพิ่ม ลบ หรือแก้ไขตามบริบทของบริษัทคุณได้
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeGroup.items.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="group bg-muted/20 hover:bg-muted/40 border border-white/5 hover:border-white/15 rounded-xl p-3.5 transition-all flex items-start justify-between gap-3 relative"
                        >
                            <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-mono font-bold text-muted-foreground/60 w-5">
                                        {(index + 1).toString().padStart(2, "0")}
                                    </span>
                                    <span className="font-semibold text-sm text-foreground truncate">
                                        {item.name}
                                    </span>
                                    {item.category && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground">
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground pl-7 line-clamp-2">
                                        {item.description}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="opacity-40 group-hover:opacity-100 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all shrink-0"
                                title="ลบหมวดงานนี้"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Add Item Form */}
            <form onSubmit={handleAddItem} className="bg-card/50 border border-white/10 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    เพิ่มหมวดงานย่อยใหม่ในพรีเซ็ต
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                        <label className="text-[11px] text-muted-foreground mb-1 block">ชื่อโปรเจคย่อย (ภาษาไทย)</label>
                        <input
                            type="text"
                            placeholder="เช่น งานติดตั้งสุขภัณฑ์และอุปกรณ์ห้องน้ำ"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full px-3.5 py-2 bg-muted/40 border border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none"
                        />
                    </div>
                    <div className="sm:col-span-4">
                        <label className="text-[11px] text-muted-foreground mb-1 block">คำอธิบายงานคร่าวๆ (ถ้ามี)</label>
                        <input
                            type="text"
                            placeholder="เช่น ติดตั้งอ่างล้างหน้า โถสุขภัณฑ์ ก๊อกน้ำ..."
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            className="w-full px-3.5 py-2 bg-muted/40 border border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="text-[11px] text-muted-foreground mb-1 block">หมวดหมู่งาน</label>
                        <div className="flex gap-2">
                            <select
                                value={newItemCategory}
                                onChange={(e) => setNewItemCategory(e.target.value as any)}
                                className="flex-1 px-3 py-2 bg-muted/40 border border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none"
                            >
                                <option value="Preparation">Preparation (เตรียมงาน)</option>
                                <option value="Structure">Structure (โครงสร้าง)</option>
                                <option value="Architecture">Architecture (สถาปัตย์)</option>
                                <option value="Systems">Systems (งานระบบ)</option>
                                <option value="Finishing">Finishing (ตกแต่ง/เก็บงาน)</option>
                                <option value="Admin">Admin (จัดการ/คนงาน)</option>
                                <option value="Logistics">Logistics (น้ำมัน/ยานพาหนะ)</option>
                            </select>
                            <button
                                type="submit"
                                disabled={!newItemName.trim()}
                                className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-all disabled:opacity-40 shrink-0"
                            >
                                เพิ่ม
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* TEST & SYNC TOOL WITH EXISTING PROJECT (คุณต้น) */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                            <Sparkles className="w-4 h-4 text-primary" />
                            ทดสอบหรือซิงค์พรีเซ็ตเข้าโปรเจคเดิม (เช่น โปรเจคคุณต้น)
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                            ฟังก์ชันนี้จะช่วยเพิ่มเฉพาะหมวดงานที่ยังขาดหายไปในโปรเจค โดย<strong>ไม่ลบและไม่กระทบ</strong>กับข้อมูลหรือโปรเจคย่อยเดิมที่เคยลงไว้แล้ว
                        </p>
                    </div>
                </div>

                {syncSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{syncSuccess}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <div className="flex-1">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-background border border-white/15 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none font-medium"
                        >
                            <option value="">-- เลือกโปรเจคที่จะทดสอบ/ซิงค์ --</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.customer ? `(ลูกค้า: ${p.customer})` : ""} - มีอยู่ {p.subProjects?.length || 0} โปรเจคย่อย
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSyncToProject}
                        disabled={!selectedProjectId || isSyncing}
                        className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-40"
                    >
                        {isSyncing ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ArrowRight className="w-4 h-4" />
                        )}
                        <span>ซิงค์พรีเซ็ตเข้าโปรเจคนี้</span>
                    </button>
                </div>

                {testProject && (
                    <div className="text-xs text-muted-foreground bg-black/20 p-3 rounded-xl border border-white/5 space-y-1">
                        <div className="flex justify-between items-center text-foreground font-medium">
                            <span>สถานะโปรเจค: <strong>{testProject.name}</strong></span>
                            <span>ปัจจุบันมี {testProject.subProjects?.length || 0} โปรเจคย่อย</span>
                        </div>
                        <p className="text-[11px]">
                            {testProject.subProjects && testProject.subProjects.length > 0 ? (
                                `มีอยู่แล้ว: ${testProject.subProjects.map(s => s.name).join(", ")}`
                            ) : (
                                "ยังไม่มีโปรเจคย่อยใดๆ ในโปรเจคนี้ สามารถกดซิงค์เพื่อเริ่มต้นได้ทันที"
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
