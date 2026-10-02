"use client"

import * as React from "react"
import {
    X,
    Package,
    Store,
    Phone,
    MapPin,
    DollarSign,
    Tag,
    UploadCloud,
    Loader2,
    Trash2,
    Plus,
    ExternalLink,
    Calendar,
    FolderKanban,
    FileText,
    Image as ImageIcon,
    Building,
    Check,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Layers,
    Search,
    ShoppingBag,
    Sparkles
} from "lucide-react"
import { CatalogItem, CatalogCategory, CATALOG_CATEGORIES, COMMON_UNITS } from "@/types/catalog"
import { createCatalogItem, updateCatalogItem } from "@/lib/services/catalog-service"
import { uploadImage } from "@/lib/upload"
import { useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import Image from "next/image"

interface AddCatalogItemDialogProps {
    isOpen: boolean
    onClose: () => void
    initialData?: CatalogItem | null
    onSuccess?: (item: CatalogItem) => void
}

type WizardStep = 1 | 2 | 3 | 4

const STEPS = [
    { number: 1, label: "สินค้า & ราคา", shortLabel: "สินค้า", description: "ชื่อ หมวดหมู่ ราคาต่อหน่วย" },
    { number: 2, label: "ร้านค้า & แหล่งซื้อ", shortLabel: "ร้านค้า", description: "Store ในระบบ หรือร้านค้าภายนอก" },
    { number: 3, label: "แท็กโครงการ & สเปค", shortLabel: "โครงการ", description: "เลือกโครงการที่ใช้งาน และรายละเอียด" },
    { number: 4, label: "อัลบั้มรูปภาพ", shortLabel: "รูปภาพ", description: "รูปภาพสินค้าหน้างาน" }
]

export function AddCatalogItemDialog({
    isOpen,
    onClose,
    initialData,
    onSuccess
}: AddCatalogItemDialogProps) {
    const { projects, currentUser, currentTeam, vendors, addVendor } = useProjects()
    const { currentOrg } = useOrganization()

    const orgId = currentOrg?.id || currentTeam?.id || "default_org"

    // Step state
    const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)

    // Form state
    const [name, setName] = React.useState("")
    const [code, setCode] = React.useState("")
    const [category, setCategory] = React.useState<string>(CATALOG_CATEGORIES[0].id)
    const [unitPrice, setUnitPrice] = React.useState<string>("")
    const [unit, setUnit] = React.useState<string>("ชิ้น")
    const [storeSource, setStoreSource] = React.useState<"internal" | "external">("internal")
    const [saveToStore, setSaveToStore] = React.useState(false)
    const [storeId, setStoreId] = React.useState("")
    const [storeName, setStoreName] = React.useState("")
    const [storePhone, setStorePhone] = React.useState("")
    const [storeLocation, setStoreLocation] = React.useState("")
    const [storeMapUrl, setStoreMapUrl] = React.useState("")
    const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([])
    const [projectSearch, setProjectSearch] = React.useState("")
    const [lastPurchasedDate, setLastPurchasedDate] = React.useState(new Date().toISOString().split("T")[0])
    const [description, setDescription] = React.useState("")

    // Photo files & URLs state
    const [existingPhotos, setExistingPhotos] = React.useState<string[]>([])
    const [newFiles, setNewFiles] = React.useState<{ file: File; preview: string }[]>([])
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [uploadProgressText, setUploadProgressText] = React.useState("")

    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Populate or reset form when opened or initialData changes
    React.useEffect(() => {
        if (isOpen) {
            setCurrentStep(1)
            setSaveToStore(false)
            if (initialData) {
                setName(initialData.name || "")
                setCode(initialData.code || "")
                setCategory(initialData.category || CATALOG_CATEGORIES[0].id)
                setUnitPrice(initialData.unitPrice ? String(initialData.unitPrice) : "")
                setUnit(initialData.unit || "ชิ้น")
                setStoreId(initialData.storeId || "")
                setStoreName(initialData.storeName || "")
                setStorePhone(initialData.storePhone || "")
                setStoreLocation(initialData.storeLocation || "")
                setStoreMapUrl(initialData.storeMapUrl || "")

                // Detect if store is internal or external
                if (initialData.storeId) {
                    setStoreSource("internal")
                } else if (initialData.storeName) {
                    const match = (vendors || []).some(v => v.name?.trim().toLowerCase() === initialData.storeName?.trim().toLowerCase())
                    setStoreSource(match ? "internal" : "external")
                } else {
                    setStoreSource((vendors || []).length > 0 ? "internal" : "external")
                }

                const initialPIds = initialData.projectIds && initialData.projectIds.length > 0
                    ? initialData.projectIds
                    : (initialData.projectId ? [initialData.projectId] : [])
                setSelectedProjectIds(initialPIds)
                setLastPurchasedDate(initialData.lastPurchasedDate || new Date().toISOString().split("T")[0])
                setDescription(initialData.description || "")
                setExistingPhotos(initialData.photos || [])
                setNewFiles([])
            } else {
                setName("")
                setCode("")
                setCategory(CATALOG_CATEGORIES[0].id)
                setUnitPrice("")
                setUnit("ชิ้น")
                setStoreId("")
                setStoreName("")
                setStorePhone("")
                setStoreLocation("")
                setStoreMapUrl("")
                setSelectedProjectIds([])
                setLastPurchasedDate(new Date().toISOString().split("T")[0])
                setDescription("")
                setExistingPhotos([])
                setNewFiles([])
                setStoreSource((vendors || []).length > 0 ? "internal" : "external")
            }
        }
    }, [isOpen, initialData, vendors])

    // Cleanup local object URLs
    React.useEffect(() => {
        return () => {
            newFiles.forEach(f => URL.revokeObjectURL(f.preview))
        }
    }, [newFiles])

    // Filter active stores / vendors registered in the workspace
    const activeVendors = React.useMemo(() => {
        const seen = new Set<string>()
        return (vendors || [])
            .filter(v => {
                if (!v.name || !v.name.trim() || v.status === "Inactive") return false
                const key = v.name.trim().toLowerCase()
                if (seen.has(key)) return false
                seen.add(key)
                return true
            })
            .sort((a, b) => a.name.trim().localeCompare(b.name.trim(), "th"))
    }, [vendors])

    const handleSelectVendor = (vendorId: string) => {
        if (!vendorId) {
            setStoreId("")
            return
        }
        const found = activeVendors.find(v => v.id === vendorId)
        if (found) {
            setStoreId(found.id)
            setStoreName(found.name.trim())
            if (found.phone) setStorePhone(found.phone.trim())
            if (found.location) setStoreLocation(found.location.trim())
        }
    }

    const handleStoreNameChange = (val: string) => {
        setStoreName(val)
        const matched = activeVendors.find(v => v.name.trim().toLowerCase() === val.trim().toLowerCase())
        if (matched) {
            setStoreId(matched.id)
            if (!storePhone && matched.phone) setStorePhone(matched.phone.trim())
            if (!storeLocation && matched.location) setStoreLocation(matched.location.trim())
        } else {
            setStoreId("")
        }
    }

    // Toggle project tag
    const toggleProjectTag = (pId: string) => {
        setSelectedProjectIds(prev =>
            prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
        )
    }

    const filteredProjects = React.useMemo(() => {
        if (!projectSearch.trim()) return projects
        const q = projectSearch.toLowerCase().trim()
        return projects.filter(p => p.name.toLowerCase().includes(q))
    }, [projects, projectSearch])

    const selectedProjects = React.useMemo(() => {
        return projects.filter(p => selectedProjectIds.includes(p.id))
    }, [projects, selectedProjectIds])

    if (!isOpen) return null

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const files = Array.from(e.target.files)
        const mapped = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }))
        setNewFiles(prev => [...prev, ...mapped])
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const removeExistingPhoto = (index: number) => {
        setExistingPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const removeNewFile = (index: number) => {
        setNewFiles(prev => {
            const item = prev[index]
            if (item) URL.revokeObjectURL(item.preview)
            return prev.filter((_, i) => i !== index)
        })
    }

    // Step navigation validation
    const handleNext = () => {
        if (currentStep === 1) {
            if (!name.trim()) {
                alert("กรุณากรอกชื่อสินค้าหรือวัสดุ")
                return
            }
            if (!unitPrice || parseFloat(unitPrice) < 0) {
                alert("กรุณาระบุราคาต่อหน่วย")
                return
            }
        }
        if (currentStep < 4) {
            setCurrentStep((prev) => (prev + 1) as WizardStep)
        }
    }

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as WizardStep)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            alert("กรุณากรอกชื่อสินค้าหรือวัสดุ")
            setCurrentStep(1)
            return
        }

        setIsSubmitting(true)
        setUploadProgressText("กำลังเตรียมข้อมูล...")

        try {
            // Upload newly selected files
            const uploadedUrls: string[] = []
            if (newFiles.length > 0) {
                setUploadProgressText(`กำลังอัปโหลดรูปภาพ (0/${newFiles.length})...`)
                for (let i = 0; i < newFiles.length; i++) {
                    setUploadProgressText(`กำลังอัปโหลดรูปภาพ (${i + 1}/${newFiles.length})...`)
                    const item = newFiles[i]
                    try {
                        const url = await uploadImage(item.file, `organizations/${orgId}/catalog`)
                        uploadedUrls.push(url)
                    } catch (err) {
                        console.error("Failed to upload photo:", err)
                    }
                }
            }

            const allPhotos = [...existingPhotos, ...uploadedUrls]

            // Multi-project tagged names
            const taggedProjectNames = selectedProjects.map(p => p.name)
            const primaryProjectId = selectedProjectIds[0] || ""
            const primaryProjectName = taggedProjectNames[0] || ""

            const parsedPrice = parseFloat(unitPrice) || 0

            // If user entered an external store and opted to save to company store/partners
            if (storeSource === "external" && saveToStore && storeName.trim()) {
                try {
                    await addVendor({
                        name: storeName.trim(),
                        category: category || "วัสดุ/อุปกรณ์",
                        phone: storePhone.trim() || undefined,
                        location: storeLocation.trim() || undefined
                    })
                } catch (vendorErr) {
                    console.warn("Could not auto-save external vendor to store:", vendorErr)
                }
            }

            const itemPayload = {
                name: name.trim(),
                code: code.trim(),
                category: category.trim() || "อื่นๆ",
                unitPrice: parsedPrice,
                unit: unit.trim() || "ชิ้น",
                storeId: storeSource === "internal" ? (storeId || "") : "",
                storeName: storeName.trim(),
                storePhone: storePhone.trim(),
                storeLocation: storeLocation.trim(),
                storeMapUrl: storeMapUrl.trim(),
                photos: allPhotos,
                description: description.trim(),
                projectId: primaryProjectId,
                projectName: primaryProjectName,
                projectIds: selectedProjectIds,
                projectNames: taggedProjectNames,
                lastPurchasedDate: lastPurchasedDate || "",
                createdBy: currentUser?.id || "anonymous",
                createdByName: currentUser?.name || currentUser?.email || "ผู้ใช้งาน",
                createdByRole: currentTeam?.role || currentUser?.role || "Member",
                createdByAvatar: currentUser?.avatar || ""
            }

            if (initialData?.id) {
                setUploadProgressText("กำลังอัปเดตข้อมูล...")
                await updateCatalogItem(initialData.id, itemPayload)
                if (onSuccess) {
                    onSuccess({
                        ...initialData,
                        ...itemPayload,
                        updatedAt: new Date().toISOString()
                    })
                }
            } else {
                setUploadProgressText("กำลังบันทึกรายการ...")
                const created = await createCatalogItem(orgId, itemPayload)
                if (onSuccess) {
                    onSuccess(created)
                }
            }

            onClose()
        } catch (error) {
            console.error("Error saving catalog item:", error)
            alert("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง")
        } finally {
            setIsSubmitting(false)
            setUploadProgressText("")
        }
    }

    const totalPhotosCount = existingPhotos.length + newFiles.length

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">
                                {initialData ? "แก้ไขรายการใน Catalog" : "เพิ่มสินค้า / วัสดุหน้างานเข้า Catalog"}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                ลงข้อมูลแบบเป็นขั้นตอน (Step-by-Step) บันทึกราคา สเปค ร้านค้า และแท็กโครงการ
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 4-Step Stepper Progress Bar */}
                <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-border bg-muted/20">
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {STEPS.map((step) => {
                            const isCurrent = currentStep === step.number
                            const isPassed = currentStep > step.number
                            return (
                                <button
                                    key={step.number}
                                    type="button"
                                    onClick={() => {
                                        // Allow jumping back or jumping to completed steps
                                        if (step.number < currentStep || (currentStep === 1 && name.trim())) {
                                            setCurrentStep(step.number as WizardStep)
                                        }
                                    }}
                                    className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl text-left transition-all min-w-0 ${
                                        isCurrent
                                            ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                                            : isPassed
                                            ? "bg-muted text-foreground hover:bg-muted/80"
                                            : "text-muted-foreground opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${
                                            isCurrent
                                                ? "bg-white/20 text-white"
                                                : isPassed
                                                ? "bg-emerald-500 text-white"
                                                : "bg-muted-foreground/20 text-muted-foreground"
                                        }`}
                                    >
                                        {isPassed ? <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> : step.number}
                                    </div>
                                    <div className="min-w-0 truncate">
                                        <div className="text-[11px] sm:text-xs font-bold truncate leading-tight">
                                            <span className="sm:hidden">{step.shortLabel}</span>
                                            <span className="hidden sm:inline">{step.label}</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Step Content Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* STEP 1: ข้อมูลสินค้าและราคา */}
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-200">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                                <Tag className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground">
                                    ขั้นตอนที่ 1: ข้อมูลสินค้าและราคา
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        ชื่อสินค้า / วัสดุ / บริการ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="เช่น ปูนซีเมนต์ผสม ตราเสือ 50 กก., สี TOA SuperShield กึ่งเงา"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        รหัสสินค้า / SKU / รหัสอ้างอิง
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="เช่น MAT-001, SK-CON-01"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        หมวดหมู่ / ประเภท
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    >
                                        {CATALOG_CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        ราคาต่อหน่วย (บาท) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                                            ฿
                                        </span>
                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            required
                                            value={unitPrice}
                                            onChange={(e) => setUnitPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        หน่วยนับ
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            list="common-units"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            placeholder="เช่น ถุง, ตร.ม., ชิ้น"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                        <datalist id="common-units">
                                            {COMMON_UNITS.map(u => (
                                                <option key={u} value={u} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ร้านค้าและแหล่งซื้อ */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground">
                                        ขั้นตอนที่ 2: ข้อมูลร้านค้า / แหล่งซื้อ
                                    </h3>
                                </div>
                                {storeSource === "internal" && (storeId || storeName) ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                        <Check className="w-3 h-3" />
                                        ร้านค้าในระบบ (Store Partner)
                                    </span>
                                ) : storeSource === "external" && storeName.trim() ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                        <ShoppingBag className="w-3 h-3" />
                                        ร้านค้านอกสโตร์ (ซื้อทั่วไป/หน้างาน)
                                    </span>
                                ) : null}
                            </div>

                            {/* Source Selection Tabs: ร้านค้าในสโตร์ vs ร้านค้านอกสโตร์ */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                    <span>เลือกประเภทแหล่งซื้อร้านค้า:</span>
                                    <span className="text-[11px] font-normal text-muted-foreground">
                                        {storeSource === "internal" ? "เลือกร้านค้าจากพาร์ทเนอร์ในระบบ" : "กรอกชื่อร้านค้าภายนอกได้อิสระ"}
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 p-1.5 bg-muted/60 rounded-2xl border border-border/70 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setStoreSource("internal")}
                                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                            storeSource === "internal"
                                                ? "bg-background text-primary shadow-sm border border-border"
                                                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                                        }`}
                                    >
                                        <Building className="w-4 h-4" />
                                        <span>ร้านค้าในสโตร์ ({activeVendors.length})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStoreSource("external")
                                            setStoreId("")
                                        }}
                                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                            storeSource === "external"
                                                ? "bg-background text-amber-600 dark:text-amber-400 shadow-sm border border-border"
                                                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                                        }`}
                                    >
                                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                                        <span>ร้านค้านอกสโตร์ (ทั่วไป/หน้างาน)</span>
                                    </button>
                                </div>
                            </div>

                            {/* INTERNAL STORE MODE: Quick Select from system vendors */}
                            {storeSource === "internal" && (
                                <div className="space-y-3 animate-in fade-in-50 duration-150">
                                    {activeVendors.length > 0 ? (
                                        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 space-y-2.5">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                    <Building className="w-3.5 h-3.5 text-primary" />
                                                    เลือกร้านค้าพาร์ทเนอร์ในระบบ ({activeVendors.length} ร้าน):
                                                </span>
                                                <select
                                                    value={storeId}
                                                    onChange={(e) => handleSelectVendor(e.target.value)}
                                                    className="text-xs px-2.5 py-1.5 rounded-xl border border-input bg-background font-medium focus:ring-1 focus:ring-primary cursor-pointer"
                                                >
                                                    <option value="">-- เลือกร้านค้าจากระบบ --</option>
                                                    {activeVendors.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.name} {v.category ? `(${v.category})` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Quick chips for stores */}
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                                {activeVendors.map(v => {
                                                    const isSelected = storeId === v.id || storeName.trim().toLowerCase() === v.name.trim().toLowerCase()
                                                    return (
                                                        <button
                                                            key={v.id}
                                                            type="button"
                                                            onClick={() => handleSelectVendor(v.id)}
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                                                isSelected
                                                                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                                                                    : "bg-background border border-border hover:border-primary/50 text-foreground hover:bg-muted"
                                                            }`}
                                                        >
                                                            <span>🏪 {v.name}</span>
                                                            {v.category && (
                                                                <span className={`text-[10px] opacity-75 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                                                                    ({v.category})
                                                                </span>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <span>ยังไม่มีร้านค้าพาร์ทเนอร์ในระบบ สามารถสลับไปใช้ &quot;ร้านค้านอกสโตร์&quot; เพื่อระบุชื่อร้านค้าได้ทันที</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStoreSource("external")
                                                    setStoreId("")
                                                }}
                                                className="font-bold underline text-amber-700 dark:text-amber-300 whitespace-nowrap"
                                            >
                                                สลับไปร้านนอกสโตร์
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EXTERNAL STORE MODE: Guidance banner */}
                            {storeSource === "external" && (
                                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1 animate-in fade-in-50 duration-150">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        <span className="text-xs font-bold text-foreground">
                                            เพิ่มร้านค้านอกสโตร์ (ซื้อทั่วไป / ร้านค้าหน้างาน)
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        กรอกชื่อร้านค้า ร้านวัสดุแถวไซต์งาน ห้างค้าวัสดุ หรือร้านค้าออนไลน์ได้ตามต้องการ โดยไม่จำเป็นต้องมีในระบบ Store
                                    </p>
                                </div>
                            )}

                            {/* Store Name & Phone Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground flex items-center justify-between">
                                        <span>
                                            {storeSource === "external" ? "ชื่อร้านค้านอกสโตร์ / แหล่งซื้อ" : "ชื่อร้านค้า / ตัวแทนจำหน่าย"}
                                        </span>
                                        {storeSource === "external" ? (
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                                ร้านนอกสโตร์
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                ร้านในสโตร์
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        list={storeSource === "internal" ? "registered-stores-list" : undefined}
                                        value={storeName}
                                        onChange={(e) => handleStoreNameChange(e.target.value)}
                                        placeholder={
                                            storeSource === "external"
                                                ? "เช่น ไทวัสดุ สาขาบางนา, ร้านปูนป้าพรหน้างาน, โฮมโปร"
                                                : "เลือกจากรายการด้านบน หรือพิมพ์ชื่อร้านค้า"
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    />
                                    {storeSource === "internal" && (
                                        <datalist id="registered-stores-list">
                                            {activeVendors.map(v => (
                                                <option key={v.id} value={v.name}>
                                                    {v.category ? `${v.category} ${v.phone ? `(${v.phone})` : ""}` : (v.phone || "")}
                                                </option>
                                            ))}
                                        </datalist>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        เบอร์โทรติดต่อร้าน
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="tel"
                                            value={storePhone}
                                            onChange={(e) => setStorePhone(e.target.value)}
                                            placeholder="081-xxx-xxxx หรือ 02-xxx-xxxx"
                                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location & Maps Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        สถานที่ตั้ง / สาขา / ที่อยู่
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={storeLocation}
                                            onChange={(e) => setStoreLocation(e.target.value)}
                                            placeholder="เช่น ถนนราชพฤกษ์, ซอยหน้าไซต์งาน, แยกพระราม 2"
                                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        ลิงก์ Google Maps ร้านค้า (ถ้ามี)
                                    </label>
                                    <div className="relative">
                                        <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="url"
                                            value={storeMapUrl}
                                            onChange={(e) => setStoreMapUrl(e.target.value)}
                                            placeholder="https://maps.app.goo.gl/..."
                                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Option to automatically save external store to company Store/Partners */}
                            {storeSource === "external" && (
                                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/80 cursor-pointer hover:bg-muted/60 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={saveToStore}
                                        onChange={(e) => setSaveToStore(e.target.checked)}
                                        className="mt-0.5 rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                    />
                                    <div className="space-y-0.5">
                                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                                            บันทึกร้านค้านี้เข้า Store ของบริษัทด้วย
                                        </span>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            ระบบจะบันทึกร้านค้านี้เป็น Vendor พาร์ทเนอร์ในระบบ Store อัตโนมัติ เพื่อให้โปรเจคอื่นๆ และทีมงานเลือกใช้ซ้ำได้ทันที
                                        </p>
                                    </div>
                                </label>
                            )}
                        </div>
                    )}

                    {/* STEP 3: แท็กโครงการที่ใช้ & สเปคการใช้งาน */}
                    {currentStep === 3 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-200">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                                <FolderKanban className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground">
                                    ขั้นตอนที่ 3: แท็กโครงการที่ใช้งาน & สเปคเพิ่มเติม
                                </h3>
                            </div>

                            {/* Multi-Project Tagging Selector */}
                            <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <span>🏷️ แท็กโครงการที่ใช้วัสดุนี้</span>
                                            <span className="text-primary">({selectedProjectIds.length} โครงการ)</span>
                                        </label>
                                        <p className="text-[11px] text-muted-foreground">
                                            เลือกได้หลายโครงการพร้อมกัน เช่น สี ท่อ หรือปูน ที่สั่งมาใช้ในหลายไซต์งาน
                                        </p>
                                    </div>
                                    {selectedProjectIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProjectIds([])}
                                            className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors"
                                        >
                                            ล้างที่เลือกทั้งหมด
                                        </button>
                                    )}
                                </div>

                                {/* Search project filter if many */}
                                {projects.length > 5 && (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={projectSearch}
                                            onChange={(e) => setProjectSearch(e.target.value)}
                                            placeholder="ค้นหาชื่อโครงการ..."
                                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-xs"
                                        />
                                    </div>
                                )}

                                {/* Project Tag Chips */}
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                    {filteredProjects.map(p => {
                                        const isTagged = selectedProjectIds.includes(p.id)
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => toggleProjectTag(p.id)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                    isTagged
                                                        ? "bg-primary text-primary-foreground shadow-sm scale-[1.02] ring-2 ring-primary/20"
                                                        : "bg-background border border-border hover:border-primary/50 text-foreground hover:bg-muted"
                                                }`}
                                            >
                                                <span>🏷️ {p.name}</span>
                                                {isTagged && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        )
                                    })}
                                    {projects.length === 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            ยังไม่มีโครงการในระบบ (สามารถบันทึกเป็นวัสดุทั่วไปได้)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">
                                    วันที่สั่งซื้อ / สำรวจล่าสุด
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={lastPurchasedDate}
                                        onChange={(e) => setLastPurchasedDate(e.target.value)}
                                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">
                                    รายละเอียดสเปค / ขนาด / วิธีการใช้งาน / เงื่อนไข
                                </label>
                                <textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="เช่น ขนาด 60x60 ซม., ความหนา 1.2 มม., สีขาวมุกเงา, มอก. 80-2550, รับประกัน 5 ปี หรือเงื่อนไขการส่งสินค้า"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: อัลบั้มรูปภาพ & สรุปก่อนบันทึก */}
                    {currentStep === 4 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-200">
                            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground">
                                        ขั้นตอนที่ 4: อัลบั้มรูปภาพสินค้า & ตัวอย่างหน้างาน ({totalPhotosCount} รูป)
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    เพิ่มรูปภาพ
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {/* Photo Previews Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {existingPhotos.map((url, idx) => (
                                    <div
                                        key={`existing-${idx}`}
                                        className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/40 shadow-sm"
                                    >
                                        <Image
                                            src={url}
                                            alt={`Photo ${idx + 1}`}
                                            fill
                                            sizes="(max-width: 768px) 33vw, 20vw"
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                        {idx === 0 && (
                                            <div className="absolute top-1.5 left-1.5 bg-primary/90 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                                                รูปปก
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeExistingPhoto(idx)}
                                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {newFiles.map((item, idx) => (
                                    <div
                                        key={`new-${idx}`}
                                        className="group relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-primary/50 bg-primary/5 shadow-sm"
                                    >
                                        <Image
                                            src={item.preview}
                                            alt={`New photo ${idx + 1}`}
                                            fill
                                            sizes="(max-width: 768px) 33vw, 20vw"
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                        {existingPhotos.length === 0 && idx === 0 && (
                                            <div className="absolute top-1.5 left-1.5 bg-primary/90 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                                                รูปปก
                                            </div>
                                        )}
                                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 py-0.2 rounded">
                                            ใหม่
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeNewFile(idx)}
                                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSubmitting}
                                    className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground group"
                                >
                                    <UploadCloud className="w-6 h-6 mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[11px] font-medium">เพิ่มรูปภาพ</span>
                                </button>
                            </div>

                            {/* Summary Review Card */}
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    สรุปข้อมูลที่จะบันทึก
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-muted-foreground">ชื่อสินค้า:</span>
                                        <p className="font-bold text-foreground truncate">{name || "-"}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">ราคา:</span>
                                        <p className="font-bold text-primary">฿{Number(unitPrice || 0).toLocaleString()} / {unit}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">ร้านค้า:</span>
                                        <div className="flex items-center gap-1 mt-0.5 truncate">
                                            <p className="font-semibold text-foreground truncate">{storeName || "-"}</p>
                                            {storeName && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${
                                                    storeSource === "internal"
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                }`}>
                                                    {storeSource === "internal" ? "ในสโตร์" : "นอกสโตร์"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">โครงการที่แท็ก:</span>
                                        <p className="font-semibold text-foreground truncate">
                                            {selectedProjectIds.length > 0 ? `${selectedProjectIds.length} โครงการ` : "ทั่วไป"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Controls */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/40">
                    <div className="text-xs text-muted-foreground">
                        {uploadProgressText && (
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>{uploadProgressText}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>ย้อนกลับ</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                ยกเลิก
                            </button>
                        )}

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
                            >
                                <span>ถัดไป</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !name.trim()}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>กำลังบันทึก...</span>
                                    </>
                                ) : (
                                    <span>{initialData ? "บันทึกการแก้ไข" : "บันทึกเข้า Catalog"}</span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
