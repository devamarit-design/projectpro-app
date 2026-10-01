"use client"

import * as React from "react"
import { X, Building, MapPin, Calendar, Check, DollarSign, Upload, ImageIcon, Loader2, Layers, CheckCircle2 } from "lucide-react"
import { useProjects, Project } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { uploadImage } from "@/lib/upload"
import AddCustomerDialog from "@/components/customers/add-customer-dialog"
import { SafeBackdrop } from "@/components/ui/safe-backdrop"
import { loadSubProjectPresets, createSubProjectsFromPreset, SubProjectPresetGroup, DEFAULT_PRESET_GROUPS } from "@/lib/subproject-presets"
import { getSmartProjectCover } from "@/lib/project-covers"
import { CoverPresetPicker } from "@/components/projects/cover-preset-picker"

interface AddProjectDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (projectId: string) => void
}

export default function AddProjectDialog({ isOpen, onClose, onSuccess }: AddProjectDialogProps) {
    const { addProject, customers } = useProjects()
    const { currentOrg } = useOrganization()
    const { t } = useTranslation()

    // Form State
    const [name, setName] = React.useState("")
    const [customer, setCustomer] = React.useState("") // Just a string for now as per context
    const [location, setLocation] = React.useState("")
    const [budget, setBudget] = React.useState("")
    const [startDate, setStartDate] = React.useState("")
    const [endDate, setEndDate] = React.useState("")
    const [coverImage, setCoverImage] = React.useState<string>("")
    // Cover image state & smart recommendation
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [showCoverPicker, setShowCoverPicker] = React.useState(false)
    const autoSuggestedCover = React.useMemo(() => {
        return getSmartProjectCover({ name: name || "Modern Architecture" })
    }, [name])
    const activeCover = coverImage || autoSuggestedCover

    // Sub-project Preset State
    const [applyPreset, setApplyPreset] = React.useState(true)
    const [presetGroups, setPresetGroups] = React.useState<SubProjectPresetGroup[]>(DEFAULT_PRESET_GROUPS)
    const [selectedPresetId, setSelectedPresetId] = React.useState("standard-construction")

    React.useEffect(() => {
        if (isOpen) {
            loadSubProjectPresets(currentOrg?.id).then(groups => {
                setPresetGroups(groups)
                if (groups.length > 0) setSelectedPresetId(groups[0].id)
            })
        }
    }, [isOpen, currentOrg?.id])

    // Quick Add Customer State
    const [showAddCustomer, setShowAddCustomer] = React.useState(false)
    const prevCustomersLength = React.useRef(customers?.length || 0)

    // Auto-select new customer
    React.useEffect(() => {
        if (customers && customers.length > prevCustomersLength.current) {
            const newCustomer = customers[customers.length - 1]
            setCustomer(newCustomer.name) // Using Name as Project stores Customer Name
            prevCustomersLength.current = customers.length
        }
    }, [customers])

    React.useEffect(() => {
        if (isOpen) {
            setName("")
            setCustomer("")
            setLocation("")
            setBudget("")
            setStartDate("")
            setEndDate("")
            setCoverImage("")
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file")
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("Image size must be less than 10MB")
            return
        }

        setIsUploading(true)
        try {
            if (!currentOrg?.id) throw new Error("Organization not found")
            const url = await uploadImage(file, `organizations/${currentOrg.id}/projects/covers`)
            setCoverImage(url)
        } catch (error) {
            console.error("Upload failed:", error)
            alert("Failed to upload image. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        const activePreset = presetGroups.find(g => g.id === selectedPresetId)
        const initialSubProjects = applyPreset && activePreset
            ? createSubProjectsFromPreset(activePreset.items)
            : []

        addProject({
            name,
            customer: customer || "Walk-in Customer",
            location: location || "Bangkok",
            status: "Planning",
            progress: 0,
            budget: budget ? `฿${parseInt(budget).toLocaleString()}` : "฿0",
            income: "฿0",
            expenses: "฿0",
            startDate: startDate || new Date().toISOString().split('T')[0],
            endDate: endDate || new Date().toISOString().split('T')[0],
            image: coverImage || autoSuggestedCover,
            description: "Quick added project",
            subProjects: initialSubProjects
        })

        if (onSuccess) {
            setTimeout(() => {
                onSuccess("")
            }, 100)
        }
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 font-sans"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <SafeBackdrop onClose={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

            <div className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">{t.dialogs.add_project.title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{t.dialogs.add_project.subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Cover Image Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                                    รูปภาพหน้าปก
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowCoverPicker(prev => !prev)}
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    {showCoverPicker ? "ซ่อนคลังรูปภาพ" : "เลือกรูปพรีเซ็ต / อัปโหลด"}
                                </button>
                            </div>

                            {/* Cover Preview Card */}
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 group shadow-sm bg-slate-900">
                                <img
                                    src={activeCover}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40" />
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 to-transparent flex items-end justify-between">
                                    <div>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                            coverImage
                                                ? "bg-primary/20 text-primary border-primary/30"
                                                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                        )}>
                                            {coverImage ? "เลือกรูปแล้ว" : "ระบบเลือกให้อัตโนมัติตามชื่อโครงการ"}
                                        </span>
                                        <p className="text-white text-xs font-semibold mt-1 truncate max-w-[260px] drop-shadow-sm">
                                            {name || "โครงการใหม่"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCoverPicker(true)}
                                        className="px-2.5 py-1 text-xs rounded-lg bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all font-medium"
                                    >
                                        เปลี่ยนรูป
                                    </button>
                                </div>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                            {/* Presets Grid */}
                            {showCoverPicker && (
                                <div className="p-3 bg-muted/20 border border-white/10 rounded-xl space-y-2 animate-in fade-in duration-200">
                                    <CoverPresetPicker
                                        value={coverImage || autoSuggestedCover}
                                        projectName={name}
                                        onChange={(url) => setCoverImage(url)}
                                        onUploadClick={() => fileInputRef.current?.click()}
                                        isUploading={isUploading}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {t.dialogs.add_project.name} <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t.dialogs.add_project.placeholders.name}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Building className="w-3 h-3" /> {t.dialogs.add_project.customer}
                            </label>
                            <select
                                value={customer}
                                onChange={(e) => {
                                    if (e.target.value === "NEW_CUSTOMER") {
                                        setShowAddCustomer(true)
                                    } else {
                                        setCustomer(e.target.value)
                                    }
                                }}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                            >
                                <option value="">{t.dialogs.add_project.placeholders.customer}</option>
                                <option value="NEW_CUSTOMER" className="text-primary font-bold bg-primary/10">
                                    + {t.income.dialog?.create_customer || "Create New Customer"}
                                </option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {t.dialogs.add_project.location}
                            </label>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder={t.dialogs.add_project.placeholders.location}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> {t.dialogs.add_project.budget}
                            </label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder={t.dialogs.add_project.placeholders.budget}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {t.dialogs.add_project.start_date}
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {t.dialogs.add_project.end_date}
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                        </div>

                        {/* SUB-PROJECT PRESET INITIALIZATION */}
                        <div className="pt-2 border-t border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={applyPreset}
                                        onChange={(e) => setApplyPreset(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary/40 bg-background border-white/20"
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-primary" />
                                        สร้างโปรเจคย่อยเริ่มต้นจากพรีเซ็ต
                                    </span>
                                </label>
                                {applyPreset && (
                                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold border border-primary/20">
                                        แนะนำ
                                    </span>
                                )}
                            </div>

                            {applyPreset && (
                                <div className="p-3 bg-muted/30 border border-white/10 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-muted-foreground">ชุดพรีเซ็ต:</span>
                                        <select
                                            value={selectedPresetId}
                                            onChange={(e) => setSelectedPresetId(e.target.value)}
                                            className="px-2.5 py-1 text-xs bg-background border border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-primary/50"
                                        >
                                            {presetGroups.map(group => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name} ({group.items.length} หมวด)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Preview badges */}
                                    {(() => {
                                        const currentGrp = presetGroups.find(g => g.id === selectedPresetId)
                                        if (!currentGrp) return null
                                        return (
                                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 bg-black/20 rounded-lg">
                                                {currentGrp.items.map((it, idx) => (
                                                    <span key={idx} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/80">
                                                        {it.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                    })()}
                                    <p className="text-[10px] text-muted-foreground">
                                        * โปรเจคย่อยเหล่านี้จะถูกสร้างให้อัตโนมัติในโปรเจคใหม่ ช่วยให้ทีมบันทึกรายจ่ายได้ทันทีโดยไม่ตั้งชื่อซ้ำ
                                    </p>
                                </div>
                            )}
                        </div>


                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        type="submit"
                        form="project-form"
                        disabled={isUploading}
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" /> {t.dialogs.add_project.save}
                    </button>
                </div>
            </div>

            <AddCustomerDialog
                isOpen={showAddCustomer}
                onClose={() => setShowAddCustomer(false)}
            />
        </div>
    )
}

