"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { ArrowLeft, Upload, Calendar as CalendarIcon, User, Loader2, MapPin, Globe, ExternalLink, Layers } from "lucide-react" // Added Loader2
import Link from "next/link"
import { useProjects } from "@/context/project-context"
import { uploadImage } from "@/lib/upload" // Added import
import { useRouter } from "next/navigation"
import AddCustomerDialog from "@/components/customers/add-customer-dialog"
import SearchableCombobox from "@/components/ui/searchable-combobox"
import { loadSubProjectPresets, createSubProjectsFromPreset, SubProjectPresetGroup, DEFAULT_PRESET_GROUPS } from "@/lib/subproject-presets"
import { getSmartProjectCover } from "@/lib/project-covers"
import { getProjectTheme, isCustomUploadedPhoto } from "@/lib/project-themes"
import { ProjectCoverGraphic } from "@/components/projects/project-cover-graphic"
import { CoverPresetPicker } from "@/components/projects/cover-preset-picker"
import { cn } from "@/lib/utils"

export default function NewProjectPage() {
    const { t } = useTranslation()
    const { addProject, customers, currentTeam } = useProjects()
    const router = useRouter()

    const [isUploading, setIsUploading] = useState(false) // Added state

    // Preset State
    const [applyPreset, setApplyPreset] = useState(true)
    const [presetGroups, setPresetGroups] = useState<SubProjectPresetGroup[]>(DEFAULT_PRESET_GROUPS)
    const [selectedPresetId, setSelectedPresetId] = useState("standard-construction")

    useEffect(() => {
        loadSubProjectPresets(currentTeam?.id).then(groups => {
            setPresetGroups(groups)
            if (groups.length > 0) setSelectedPresetId(groups[0].id)
        })
    }, [currentTeam?.id])

    const [formData, setFormData] = useState({
        name: "",
        customer: "",
        location: "",
        mapUrl: "",
        description: "",
        budget: "",
        // income: "", // Removed
        // expenses: "", // Removed
        startDate: "",
        endDate: "",
        image: ""
    })
    const fileInputRef = useRef<HTMLInputElement>(null)
    const activeTheme = getProjectTheme({ name: formData.name || "Modern Project", imageUrl: formData.image })
    const hasCustomPhoto = isCustomUploadedPhoto(formData.image)
    const activeCover = formData.image || `theme:${activeTheme.id}`

    // Quick Add Customer State
    const [showAddCustomer, setShowAddCustomer] = useState(false)
    const prevCustomersLength = useRef(customers?.length || 0)

    // Auto-select new customer
    useEffect(() => {
        if (customers && customers.length > prevCustomersLength.current) {
            const newCustomer = customers[customers.length - 1]
            setFormData(prev => ({ ...prev, customer: newCustomer.name }))
            prevCustomersLength.current = customers.length
        }
    }, [customers])

    // Added upload handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            let url = ""
            const uploadPath = currentTeam?.id ? `organizations/${currentTeam.id}/projects/covers` : "projects/covers"
            try {
                url = await uploadImage(file, uploadPath)
            } catch (err) {
                console.warn("Storage upload failed, falling back to DataURL", err)
                url = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })
            }
            setFormData(prev => ({ ...prev, image: url }))
        } catch (error) {
            console.error("Upload failed", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Basic validation
        if (!formData.name || !formData.customer) {
            alert("Please fill in required fields")
            return
        }

        const cleanMapUrl = formData.mapUrl?.trim() || ""
        const cleanLocation = formData.location?.trim() || (cleanMapUrl ? (formData.name || "เปิดแผนที่ Google Maps") : "")

        const activePreset = presetGroups.find(g => g.id === selectedPresetId)
        const initialSubProjects = applyPreset && activePreset
            ? createSubProjectsFromPreset(activePreset.items)
            : []

        addProject({
            name: formData.name,
            customer: formData.customer,
            location: cleanLocation,
            mapUrl: cleanMapUrl,
            description: formData.description,
            status: "Planning",
            progress: 0,
            budget: formData.budget ? `฿${parseInt(formData.budget).toLocaleString()}` : "฿0",
            income: "฿0",
            expenses: "฿0",
            startDate: formData.startDate,
            endDate: formData.endDate,
            image: formData.image || `theme:${activeTheme.id}`,
            subProjects: initialSubProjects
        })

        router.push("/projects")
    }

    return (
        <div className="space-y-6 pb-20 max-w-2xl mx-auto w-full max-w-full overflow-x-hidden">
            <div className="flex items-center gap-4">
                <Link href="/projects" className="p-2 -ml-2 hover:bg-muted/50 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary font-sans">{t.projects.create_project}</h1>
                    <p className="text-muted-foreground text-sm">{t.projects.manage_projects}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-4 sm:p-6 space-y-6 w-full max-w-full overflow-x-hidden">
                {/* Project Info */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold border-b border-border/50 pb-2">{t.projects.edit.sections.details}</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.projects.edit.fields.name} <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            placeholder={t.projects.edit.placeholders.name}
                            className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.projects.customer} <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <SearchableCombobox
                                options={[
                                    { value: "NEW_CUSTOMER", label: `+ ${t.income.dialog?.create_customer || "Create New Customer"}`, description: "สร้างลูกค้าใหม่" },
                                    ...customers.map(c => ({ value: c.name, label: c.name, description: c.type || "Customer" }))
                                ]}
                                value={formData.customer}
                                onChange={(val) => {
                                    if (val === "NEW_CUSTOMER") {
                                        setShowAddCustomer(true)
                                    } else {
                                        setFormData({ ...formData, customer: val })
                                    }
                                }}
                                placeholder={t.projects.edit.placeholders.select_customer}
                                searchPlaceholder="ค้นหาลูกค้า..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-primary" />
                                ชื่อสถานที่ / พิกัดที่ตั้ง (แสดงในหน้าโปรเจกต์)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="เช่น มะขาม จันทบุรี หรือ 123 ถ.มิตรภาพ"
                                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                ชื่อข้อความที่จะแสดงเป็นปุ่มหรือลิงก์ให้คลิก
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-1.5">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                    ลิงก์ Google Maps (ถ้ามี)
                                </label>
                                {formData.mapUrl && (formData.mapUrl.startsWith("http://") || formData.mapUrl.startsWith("https://")) && (
                                    <a
                                        href={formData.mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-1"
                                    >
                                        ทดสอบเปิดแผนที่ <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="url"
                                    placeholder="วางลิงก์ เช่น https://maps.app.goo.gl/..."
                                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-mono"
                                    value={formData.mapUrl}
                                    onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                                />
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                เมื่อคลิกที่ชื่อสถานที่ ระบบจะเปิดลิงก์แผนที่นี้ทันที
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.projects.edit.fields.desc}</label>
                        <textarea
                            rows={3}
                            placeholder={t.projects.edit.placeholders.desc}
                            className="w-full p-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                {/* Financial & Timeline */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold border-b border-border/50 pb-2">{t.projects.edit.sections.timeline}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.start_date}</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full h-11 pl-4 pr-10 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.end_date}</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full h-11 pl-4 pr-10 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.budget}</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Cover Image Section */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <h2 className="text-lg font-semibold">{t.projects.edit.sections.image}</h2>
                        <span className={cn(
                            "text-xs px-2.5 py-0.5 rounded-full font-medium border",
                            formData.image
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                            {formData.image ? "เลือกรูปแล้ว" : "ระบบเลือกภาพแนะนำให้อัตโนมัติ"}
                        </span>
                    </div>

                    {/* Preview banner */}
                    <div className={cn(
                        "relative w-full h-40 rounded-2xl overflow-hidden border shadow-md bg-slate-900 group",
                        hasCustomPhoto ? "border-white/10" : activeTheme.borderColor
                    )}>
                        {hasCustomPhoto ? (
                            <>
                                <img
                                    src={formData.image}
                                    alt="Cover Preview"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40" />
                            </>
                        ) : (
                            <ProjectCoverGraphic
                                theme={activeTheme}
                                name={formData.name}
                                compact={false}
                            />
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-4 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between pointer-events-none">
                            <div>
                                <span className={cn(
                                    "inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border backdrop-blur-md",
                                    hasCustomPhoto
                                        ? "bg-primary/20 text-primary border-primary/30"
                                        : activeTheme.badgeBg
                                )}>
                                    {!hasCustomPhoto && React.createElement(activeTheme.icon, { className: cn("w-3 h-3", activeTheme.iconColor) })}
                                    <span>{hasCustomPhoto ? "ภาพถ่ายจริง" : activeTheme.categoryLabel}</span>
                                </span>
                                <p className="text-white font-bold text-sm sm:text-base truncate max-w-sm mt-1 drop-shadow-sm">
                                    {formData.name || "ชื่อโครงการใหม่"}
                                </p>
                            </div>
                            <span className="text-xs text-white/80 font-medium">
                                {hasCustomPhoto ? "Custom Photo" : activeTheme.title}
                            </span>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    {/* Presets gallery */}
                    <div className="p-4 bg-muted/20 border border-white/10 rounded-2xl">
                        <CoverPresetPicker
                            value={formData.image || activeCover}
                            projectName={formData.name}
                            onChange={(url) => setFormData({ ...formData, image: url })}
                            onUploadClick={() => fileInputRef.current?.click()}
                            isUploading={isUploading}
                        />
                    </div>
                </div>

                {/* Sub-project Preset Setup */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={applyPreset}
                                onChange={(e) => setApplyPreset(e.target.checked)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary/40 bg-background border-white/20"
                            />
                            <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-primary" />
                                สร้างโปรเจคย่อยเริ่มต้นจากพรีเซ็ตมาตรฐาน
                            </span>
                        </label>
                        {applyPreset && (
                            <span className="text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-semibold border border-primary/20">
                                แนะนำ
                            </span>
                        )}
                    </div>

                    {applyPreset && (
                        <div className="p-4 bg-muted/30 border border-white/10 rounded-2xl space-y-3 animate-in fade-in duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground font-medium">ชุดพรีเซ็ตที่เลือก:</span>
                                <select
                                    value={selectedPresetId}
                                    onChange={(e) => setSelectedPresetId(e.target.value)}
                                    className="px-3 py-1.5 text-xs bg-background border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-primary/50"
                                >
                                    {presetGroups.map(group => (
                                        <option key={group.id} value={group.id}>
                                            {group.name} ({group.items.length} หมวดงาน)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preview badges */}
                            {(() => {
                                const currentGrp = presetGroups.find(g => g.id === selectedPresetId)
                                if (!currentGrp) return null
                                return (
                                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-black/20 rounded-xl border border-white/5">
                                        {currentGrp.items.map((it, idx) => (
                                            <span key={idx} className="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-white/90">
                                                {it.name}
                                            </span>
                                        ))}
                                    </div>
                                )
                            })()}
                            <p className="text-[11px] text-muted-foreground">
                                * โครงการใหม่จะถูกสร้างพร้อมโปรเจคย่อยเหล่านี้ทันที ช่วยป้องกันการตั้งชื่อซ้ำซ้อนในทีม
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-6">
                    <Link href="/projects" className="flex-1 h-11 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors font-medium">
                        {t.common.cancel}
                    </Link>
                    <button type="submit" className="flex-1 h-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium shadow-lg shadow-primary/20">
                        {t.projects.manage_projects.split(' ')[0] === "Manage" ? "Create Project" : "สร้างโครงการ"}
                    </button>
                </div>
            </form>

            <AddCustomerDialog
                isOpen={showAddCustomer}
                onClose={() => setShowAddCustomer(false)}
            />
        </div>
    )
}
