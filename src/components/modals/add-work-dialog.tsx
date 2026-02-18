"use client"

import { useState, useEffect } from "react"
import { useProjects, WorkItem } from "@/context/project-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Palette, Calendar, Type, Layers, Box, FileText, Briefcase, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddWorkDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    projectId?: string // Optional for global view
    initialData?: WorkItem | null
}

const GANTT_COLORS = [
    { name: 'Blue', value: 'bg-blue-600' },
    { name: 'Emerald', value: 'bg-emerald-600' },
    { name: 'Amber', value: 'bg-amber-600' },
    { name: 'Rose', value: 'bg-rose-600' },
    { name: 'Indigo', value: 'bg-indigo-600' },
    { name: 'Purple', value: 'bg-purple-600' },
    { name: 'Teal', value: 'bg-teal-600' },
    { name: 'Orange', value: 'bg-orange-600' },
]

export function AddWorkDialog({ isOpen, onOpenChange, projectId, initialData }: AddWorkDialogProps) {
    const { projects, addWork, updateWork, deleteWork } = useProjects()
    const [loading, setLoading] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "")
    const [formData, setFormData] = useState({
        title: "",
        category: "โครงสร้าง",
        description: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
        color: "bg-blue-600"
    })

    // Reset when open or initialData changes
    useEffect(() => {
        if (isOpen) {
            // ... existing code ...
            if (initialData) {
                // Edit Mode
                setSelectedProjectId(initialData.projectId || projectId || "")
                setFormData({
                    title: initialData.title,
                    category: initialData.category || "โครงสร้าง",
                    description: initialData.description || "",
                    startDate: format(new Date(initialData.startDate), "yyyy-MM-dd"),
                    endDate: format(new Date(initialData.endDate), "yyyy-MM-dd"),
                    color: initialData.color || "bg-blue-600"
                })
            } else {
                // Create Mode
                setSelectedProjectId(projectId || (projects[0]?.id || ""))
                setFormData({
                    title: "",
                    category: "โครงสร้าง",
                    description: "",
                    startDate: format(new Date(), "yyyy-MM-dd"),
                    endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
                    color: "bg-blue-600"
                })
            }
        }
    }, [isOpen, projectId, projects, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProjectId) return
        setLoading(true)
        try {
            const workData = {
                title: formData.title,
                category: formData.category,
                description: formData.description,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                color: formData.color
            }

            if (initialData) {
                // Update existing work
                await updateWork(selectedProjectId, initialData.id, workData)
            } else {
                // Add new work
                await addWork(selectedProjectId, {
                    ...workData,
                    progress: 0
                })
            }

            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const selectedProjectName = projects.find(p => p.id === selectedProjectId)?.name || "เลือกโปรเจกต์"

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {/* Removed overflow-hidden to fix clipping on hover effects */}
            <DialogContent className="sm:max-w-[600px] bg-[#020617] border-white/10 text-white rounded-[32px] p-0 shadow-2xl overflow-visible">
                <DialogHeader className="p-8 pb-6 bg-gradient-to-b from-white/5 to-transparent rounded-t-[32px]">
                    <DialogTitle className="flex items-center gap-4 text-2xl font-bold tracking-tight text-white">
                        <div className={cn("p-3 rounded-2xl bg-gradient-to-br shadow-inner transition-colors duration-500", formData.color.replace('bg-', 'from-').replace('600', '500') + " to-slate-900/50")}>
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-white">{initialData ? "แก้ไขแผนงาน" : "เพิ่มแผนงานใหม่"}</span>
                            <span className="text-xs font-normal text-white/40">
                                {initialData ? "แก้ไขรายละเอียดและสถานะงาน" : "สร้างตารางงานใหม่สำหรับโครงการ"}
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
                    {/* Project Selection */}
                    {!projectId && !initialData && (
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase text-white/30 tracking-widest pl-1">โปรเจกต์</Label>
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-primary/20 text-base text-white">
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="w-5 h-5 text-indigo-400" />
                                        <span className="truncate">{selectedProjectName}</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-[#020617] border-white/10 text-white rounded-2xl max-h-[300px]">
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id} className="focus:bg-white/10 rounded-xl my-1 h-12 cursor-pointer text-white">
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="col-span-2 space-y-3">
                            <Label className="text-[11px] font-black uppercase text-white/30 tracking-widest pl-1">ชื่องาน</Label>
                            <div className="relative group">
                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-white/5 border-white/10 h-14 rounded-2xl pl-12 focus:ring-primary/20 placeholder:text-white/10 text-base"
                                    placeholder="เช่น งานวางเสาเข็ม, งานทาสี..."
                                />
                            </div>
                        </div>

                        {/* Category - Custom Input */}
                        <div className="col-span-2 sm:col-span-1 space-y-3">
                            <Label className="text-[11px] font-black uppercase text-white/30 tracking-widest pl-1">หมวดหมู่</Label>
                            <div className="relative group">
                                <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 group-focus-within:text-emerald-300 transition-colors" />
                                <Input
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="bg-white/5 border-white/10 h-14 rounded-2xl pl-12 focus:ring-emerald-500/20 text-base"
                                    placeholder="ระบุหมวดหมู่งาน..."
                                />
                            </div>
                        </div>

                        {/* Theme Color */}
                        <div className="col-span-2 sm:col-span-1 space-y-3">
                            <Label className="text-[11px] font-black uppercase text-white/30 tracking-widest pl-1">สีธีม</Label>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-2xl h-14">
                                {GANTT_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: c.value })}
                                        className={cn(
                                            "flex-1 h-full rounded-xl transition-all duration-300 border-2 flex items-center justify-center relative",
                                            c.value,
                                            formData.color === c.value ? "border-white scale-110 shadow-lg shadow-black/20 z-10" : "border-transparent opacity-40 hover:opacity-100 hover:scale-110"
                                        )}
                                        title={c.name}
                                    >
                                        {formData.color === c.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase text-white/30 tracking-widest pl-1">วันที่เริ่ม</Label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    className="bg-white/5 border-white/10 h-14 rounded-2xl pl-12 focus:ring-primary/20 text-base"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase text-white/30 tracking-widest pl-1">วันที่สิ้นสุด</Label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    className="bg-white/5 border-white/10 h-14 rounded-2xl pl-12 focus:ring-primary/20 text-base"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-white/30 tracking-widest pl-1">รายละเอียดงาน</Label>
                        <div className="relative group">
                            <FileText className="absolute left-4 top-4 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="bg-white/5 border-white/10 min-h-[100px] rounded-2xl pl-12 py-4 focus:ring-primary/20 resize-none text-base leading-relaxed placeholder:text-white/10"
                                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex items-center justify-between gap-4 border-t border-white/5 mt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-14 px-8 text-white/40 hover:text-white hover:bg-white/5 text-base">
                            ยกเลิก
                        </Button>
                        {initialData && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={async () => {
                                    if (confirm("คุณต้องการลบแผนงานนี้ใช่หรือไม่?")) {
                                        setLoading(true)
                                        try {
                                            await deleteWork(selectedProjectId, initialData.id)
                                            onOpenChange(false)
                                        } catch (error) {
                                            console.error(error)
                                        } finally {
                                            setLoading(false)
                                        }
                                    }
                                }}
                                className="rounded-2xl h-14 px-4 text-red-500 hover:text-red-400 hover:bg-red-500/10 text-base"
                            >
                                <Trash2 className="w-5 h-5 mr-2" />
                                ลบ
                            </Button>
                        )}
                        <Button
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-8 font-bold text-base uppercase tracking-widest shadow-xl shadow-primary/20 flex-1 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                        >
                            {loading ? "กำลังบันทึก..." : (initialData ? "บันทึกการแก้ไข" : "สร้างแผนงาน")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function addDays(date: Date, days: number) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}
