import * as React from "react"
import { createPortal } from "react-dom"
import { useProjects, Customer, Project, IncomeType, IncomeSection } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import {
    X,
    Calendar,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Check,
    Image as ImageIcon,
    Save,
    Building2,
    User,
    FileText,
    RefreshCw,
    Layers,
    Layers2,
    CheckCircle2
} from "lucide-react"
import { cn, generateNextDocumentNumber } from "@/lib/utils"
import AddCustomerDialog from "@/components/customers/add-customer-dialog"
import AddProjectDialog from "@/components/projects/add-project-dialog"
import { useOrganization } from "@/context/organization-context"
import { sendQuotationNotification } from "@/lib/functions-client"
import SearchableCombobox from "@/components/ui/searchable-combobox"
import { SafeBackdrop } from "@/components/ui/safe-backdrop"
import { toast } from "sonner"
import Image from "next/image"

export interface AddIncomeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultType?: IncomeType
    defaultProjectId?: string
    defaultCustomerId?: string
    initialData?: any // For Edit Mode
}

export function AddIncomeDialog({
    open,
    onOpenChange,
    defaultType = "Quotation",
    defaultProjectId,
    defaultCustomerId,
    initialData
}: AddIncomeDialogProps) {
    const { incomes, customers, projects, addIncome, updateIncome, currentUser } = useProjects()
    const { t } = useTranslation()
    const { currentOrg } = useOrganization()

    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Lock body scroll and set modal-open class when open
    React.useEffect(() => {
        if (open) {
            document.body.classList.add("modal-open")
            const prevOverflow = document.body.style.overflow
            document.body.style.overflow = "hidden"
            return () => {
                document.body.classList.remove("modal-open")
                document.body.style.overflow = prevOverflow
            }
        }
    }, [open])

    // Accordion Section State (1: ข้อมูลเอกสาร & โครงการ, 2: รายการสินค้า, 3: สรุปยอด & ภาษี)
    const [openSections, setOpenSections] = React.useState<{ [key: number]: boolean }>({
        1: true,
        2: true,
        3: false,
    })

    const toggleSection = (section: number) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const scrollToSection = (section: number) => {
        setOpenSections(prev => ({ ...prev, [section]: true }))
        setTimeout(() => {
            const el = document.getElementById(`income-section-${section}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }, 50)
    }

    // Form State
    const [type, setType] = React.useState<IncomeType>(initialData?.type || defaultType)
    const [selectedProject, setSelectedProject] = React.useState(initialData?.projectId || defaultProjectId || "")
    const [selectedCustomer, setSelectedCustomer] = React.useState(initialData?.customerId || defaultCustomerId || "")
    const [date, setDate] = React.useState(initialData?.date || new Date().toISOString().split('T')[0])
    const [docNumber, setDocNumber] = React.useState(initialData?.documentNumber || "")
    const [mode, setMode] = React.useState<"Simple" | "Zone">(initialData?.mode || "Simple")
    const [includeVat, setIncludeVat] = React.useState(initialData?.vatIncluded ?? true)

    // Items
    const [simpleItems, setSimpleItems] = React.useState<any[]>(initialData?.items || [
        { id: "1", name: "", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }
    ])

    // Sections for Zone Mode
    const [sections, setSections] = React.useState<IncomeSection[]>(initialData?.sections || [
        {
            id: "1",
            name: "Zone 1",
            items: [{ id: "1-1", name: "", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }]
        }
    ])

    // Dialog States
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [showAddCustomer, setShowAddCustomer] = React.useState(false)
    const [showAddProject, setShowAddProject] = React.useState(false)
    const [errors, setErrors] = React.useState<{ [key: string]: boolean }>({})

    // Track previous counts to auto-select new items
    const prevCustomersLength = React.useRef(customers.length)
    const prevProjectsLength = React.useRef(projects.length)
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (customers.length > prevCustomersLength.current) {
            const newCustomer = customers[customers.length - 1]
            setSelectedCustomer(newCustomer.id)
            prevCustomersLength.current = customers.length
        }
    }, [customers])

    React.useEffect(() => {
        if (projects.length > prevProjectsLength.current) {
            const newProject = projects[projects.length - 1]
            setSelectedProject(newProject.id)
            prevProjectsLength.current = projects.length
        }
    }, [projects])

    // Reset Form
    const resetForm = () => {
        setSimpleItems([{ id: "1", name: "", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }])
        setSections([{ id: "1", name: "Zone 1", items: [{ id: "1-1", name: "", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }] }])
        setSelectedProject("")
        setSelectedCustomer("")
        setIncludeVat(true)
        setOpenSections({ 1: true, 2: true, 3: false })
        setErrors({})
    }

    // Sync State with initialData/defaultProps when dialog opens
    React.useEffect(() => {
        if (open) {
            if (initialData) {
                // Edit Mode
                setType(initialData.type)
                setSelectedProject(initialData.projectId)
                setSelectedCustomer(initialData.customerId)
                setDate(initialData.date)
                setDocNumber(initialData.documentNumber)
                setMode(initialData.mode || "Simple")
                setIncludeVat(initialData.vatIncluded ?? true)
                setSimpleItems(initialData.items?.map((i: any) => ({ ...i, id: i.id || Math.random().toString() })) || [
                    { id: "1", name: "", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }
                ])
                setSections(initialData.sections?.map((s: any) => ({
                    ...s,
                    id: s.id || Math.random().toString(),
                    items: s.items?.map((i: any) => ({ ...i, id: i.id || Math.random().toString() })) || []
                })) || [
                    { id: "1", name: "Zone 1", items: [{ id: "1-1", name: "", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }] }
                ])
                setOpenSections({ 1: true, 2: true, 3: false })
            } else {
                // Add New Mode
                resetForm()
                setType(defaultType)
                if (defaultProjectId) setSelectedProject(defaultProjectId)
                if (defaultCustomerId) setSelectedCustomer(defaultCustomerId)
                const today = new Date().toISOString().split('T')[0]
                setDate(today)
                setDocNumber(generateNextDocumentNumber(defaultType, incomes, today))
                setMode("Simple")
                setIncludeVat(true)
            }
        }
    }, [open, initialData, defaultType, defaultProjectId, defaultCustomerId])

    // Auto-generate document number when type or date changes (only in Add mode)
    React.useEffect(() => {
        if (!initialData && open) {
            setDocNumber(generateNextDocumentNumber(type, incomes, date))
        }
    }, [type, date, open, initialData, incomes])

    // Calculate totals
    const calculateSimpleTotal = () => {
        return simpleItems.reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0)
    }

    const calculateZoneTotal = () => {
        return sections.reduce((secSum, sec) => {
            return secSum + sec.items.reduce((itemSum, item) => itemSum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0)
        }, 0)
    }

    const subtotal = mode === "Simple" ? calculateSimpleTotal() : calculateZoneTotal()
    const tax = includeVat ? subtotal * 0.07 : 0
    const grandTotal = subtotal + tax

    const totalItemsCount = mode === "Simple"
        ? simpleItems.length
        : sections.reduce((acc, s) => acc + s.items.length, 0)

    // Helper functions for updating items
    const updateSimpleItem = (id: string, field: string, value: any) => {
        setSimpleItems((prev: any[]) => prev.map((item: any) => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value }
                newItem.total = (Number(newItem.quantity) || 0) * (Number(newItem.unitPrice) || 0)
                return newItem
            }
            return item
        }))
    }

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const compressBase64 = (base64: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image()
            img.src = base64
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const MAX_WIDTH = 800
                const MAX_HEIGHT = 800
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
                resolve(dataUrl)
            }
            img.onerror = () => reject("Image load failed")
        })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string, type: 'simple' | 'sectionItem' | 'sectionHeader' = 'simple', sectionId?: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("ขนาดไฟล์เกิน 5MB กรุณาเลือกรูปภาพที่มีขนาดเล็กลง")
            return
        }

        try {
            const rawBase64 = await readFileAsBase64(file)
            let finalData = rawBase64
            try {
                finalData = await compressBase64(rawBase64)
            } catch (compressError) {
                console.warn("Image compression failed, using original:", compressError)
            }

            if (type === 'sectionHeader' && sectionId) {
                setSections(prev => prev.map(s => s.id === sectionId ? { ...s, coverImage: finalData } : s))
            } else if (type === 'sectionItem' && sectionId) {
                setSections(prev => prev.map(s => s.id === sectionId ? {
                    ...s,
                    items: s.items.map(i => i.id === itemId ? { ...i, image: finalData } : i)
                } : s))
            } else {
                updateSimpleItem(itemId, "image", finalData)
            }
            toast.success("แนบรูปภาพเรียบร้อย")
        } catch (error) {
            console.error("Failed to process image:", error)
            toast.error("ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง")
        }
    }

    // Filter projects based on selected customer
    const filteredProjects = React.useMemo(() => {
        if (!selectedCustomer) return projects
        const cust = customers.find(c => c.id === selectedCustomer)
        if (!cust) return projects
        return projects.filter(p => p.customer === cust.name)
    }, [selectedCustomer, projects, customers])

    const selectedProjectObj = React.useMemo(() => {
        return projects.find(p => p.id === selectedProject)
    }, [projects, selectedProject])

    const selectedCustomerObj = React.useMemo(() => {
        return customers.find(c => c.id === selectedCustomer)
    }, [customers, selectedCustomer])

    const handleSave = async () => {
        if (isSubmitting) return

        // Validation
        const newErrors: { [key: string]: boolean } = {}
        if (!selectedProject) newErrors.project = true
        if (!selectedCustomer) newErrors.customer = true
        if (!date) newErrors.date = true

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            setOpenSections(prev => ({ ...prev, 1: true }))
            toast.error("กรุณากรอกข้อมูลโครงการและลูกค้าให้ครบถ้วน")
            return
        }

        setIsSubmitting(true)
        const toastId = toast.loading(initialData ? "กำลังอัปเดตเอกสาร..." : "กำลังบันทึกเอกสาร...")

        try {
            const finalDocNumber = docNumber || generateNextDocumentNumber(type, incomes)

            let status = initialData?.status || "Draft"
            if (initialData && type === 'Quotation' && initialData.status === 'Invoiced') {
                status = 'Sent'
            }

            const sanitizeItem = (item: any) => {
                const { id, ...rest } = item
                return {
                    ...rest,
                    name: rest.name || "",
                    description: rest.description || "",
                    quantity: Number(rest.quantity) || 1,
                    unit: rest.unit || "unit",
                    unitPrice: Number(rest.unitPrice) || 0,
                    total: (Number(rest.quantity) || 1) * (Number(rest.unitPrice) || 0),
                    image: rest.image || ""
                }
            }

            const docPayload = {
                documentNumber: finalDocNumber,
                type,
                date,
                projectId: selectedProject,
                customerId: selectedCustomer,
                mode,
                ...(mode === "Simple" ? { items: simpleItems.map(sanitizeItem) } : {}),
                ...(mode === "Zone" ? {
                    sections: sections.map(s => ({
                        name: s.name,
                        coverImage: s.coverImage || "",
                        items: s.items.map(sanitizeItem)
                    }))
                } : {}),
                subtotal,
                discount: 0,
                tax,
                total: grandTotal,
                grandTotal,
                status: status,
                vatIncluded: includeVat,
                ...(currentOrg?.id ? { orgId: currentOrg.id } : {})
            }

            if (initialData) {
                await updateIncome(initialData.id, docPayload as any)
                toast.success("อัปเดตเอกสารสำเร็จ!", { id: toastId })
            } else {
                await addIncome(docPayload as any)
                toast.success("บันทึกเอกสารสำเร็จ!", { id: toastId })

                // Send Telegram Notification (Quotation only)
                if (type === 'Quotation' && currentOrg?.id) {
                    try {
                        sendQuotationNotification({
                            orgId: currentOrg.id,
                            quotation: {
                                projectName: selectedProjectObj?.name || t.income.dialog.select_project,
                                customerName: selectedCustomerObj?.name || t.income.dialog.select_customer,
                                docNo: finalDocNumber,
                                amount: grandTotal,
                                userName: currentUser?.name || 'Unknown',
                                date: date
                            }
                        })
                    } catch (error) {
                        console.error("Failed to send notification:", error)
                    }
                }
            }

            onOpenChange(false)
            if (!initialData) resetForm()
        } catch (error: any) {
            console.error("Failed to save income:", error)
            toast.error(`บันทึกไม่สำเร็จ: ${error?.message || "เกิดข้อผิดพลาด"}`, { id: toastId })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!open || !mounted || typeof document === "undefined") return null

    const docTypeLabel = t.income.dialog.doc_types?.[type.toLowerCase() as keyof typeof t.income.dialog.doc_types] || type

    const dialogContent = (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center font-sans overflow-hidden p-0 sm:p-4">
            <SafeBackdrop onClose={() => onOpenChange(false)} className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" />

            <div className="relative w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl h-full sm:h-[90vh] max-h-[100dvh] sm:max-h-[90vh] p-0 rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden bg-background text-foreground">

                {/* Dialog Header with Safe Area for Mobile */}
                <div className="flex items-center justify-between px-4 py-3 sm:p-5 border-b border-border shrink-0 bg-background pt-[max(0.875rem,env(safe-area-inset-top))]">
                    <div className="min-w-0 pr-2 flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-2xl font-bold tracking-tight truncate text-foreground">
                                    {initialData ? t.income.dialog.edit : t.income.dialog.new} {docTypeLabel}
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                                สร้างและจัดทำเอกสารรายรับ พร้อมคำนวณภาษีอัตโนมัติ
                            </p>
                        </div>

                        {/* Document Type Selector Segmented Tabs (Desktop) */}
                        <div className="hidden md:flex bg-muted/80 p-1 rounded-xl border border-border/80">
                            {(["Quotation", "Invoice", "Receipt"] as IncomeType[]).map(docType => (
                                <button
                                    key={docType}
                                    type="button"
                                    onClick={() => setType(docType)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                                        type === docType
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    )}
                                >
                                    {t.income.dialog.doc_types?.[docType.toLowerCase() as keyof typeof t.income.dialog.doc_types] || docType}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-9 h-9 rounded-full bg-muted/80 hover:bg-muted active:scale-95 text-foreground flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-border"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mobile Document Type Selector */}
                <div className="md:hidden px-3 pt-2.5 shrink-0">
                    <div className="grid grid-cols-3 gap-1 p-1 bg-muted/70 rounded-xl border border-border text-xs">
                        {(["Quotation", "Invoice", "Receipt"] as IncomeType[]).map(docType => (
                            <button
                                key={docType}
                                type="button"
                                onClick={() => setType(docType)}
                                className={cn(
                                    "py-1.5 px-2 rounded-lg font-semibold text-center transition-all truncate",
                                    type === docType
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                            >
                                {t.income.dialog.doc_types?.[docType.toLowerCase() as keyof typeof t.income.dialog.doc_types] || docType}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3-Step Navigation Pills for Mobile */}
                <div className="px-3 sm:px-5 pt-2.5 pb-0.5 shrink-0 lg:hidden flex items-center gap-2">
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border text-xs flex-1 min-w-0">
                        <button
                            type="button"
                            onClick={() => scrollToSection(1)}
                            className={cn(
                                "py-2 px-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all min-w-0 cursor-pointer",
                                openSections[1]
                                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                            )}
                        >
                            <span className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                                openSections[1] ? "bg-white/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                            )}>
                                {selectedProject && selectedCustomer ? <Check className="w-2.5 h-2.5" /> : "1"}
                            </span>
                            <span className="truncate">1. หัวเอกสาร</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollToSection(2)}
                            className={cn(
                                "py-2 px-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all min-w-0 cursor-pointer",
                                openSections[2]
                                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                            )}
                        >
                            <span className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                                openSections[2] ? "bg-white/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                            )}>
                                {subtotal > 0 ? <Check className="w-2.5 h-2.5" /> : "2"}
                            </span>
                            <span className="truncate">2. รายการ</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollToSection(3)}
                            className={cn(
                                "py-2 px-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all min-w-0 cursor-pointer",
                                openSections[3]
                                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                            )}
                        >
                            <span className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                                openSections[3] ? "bg-white/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                            )}>
                                {grandTotal > 0 ? <Check className="w-2.5 h-2.5" /> : "3"}
                            </span>
                            <span className="truncate">3. สรุปยอด</span>
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden min-w-0 w-full">
                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 min-w-0 w-full">

                        {/* LEFT PANE (Mobile: full width, Desktop: 7 cols) */}
                        <div ref={scrollRef} className="lg:col-span-7 xl:col-span-7 flex flex-col h-full overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 space-y-3.5 min-w-0 w-full lg:border-r lg:border-border custom-scrollbar overscroll-contain min-h-0">

                            {/* STEP 1: ข้อมูลหัวเอกสาร & โครงการ */}
                            <div id="income-section-1" className="shrink-0 bg-card border border-border shadow-xs rounded-2xl overflow-hidden transition-all min-w-0 w-full scroll-mt-2">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(1)}
                                    className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2.5 text-left hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                                            selectedProject && selectedCustomer ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary/20 text-primary border border-primary/30"
                                        )}>
                                            {selectedProject && selectedCustomer ? <Check className="w-3.5 h-3.5" /> : "1"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-foreground">1. หัวเอกสาร & ข้อมูลโครงการ</span>
                                                <span className="text-[9px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted border border-border/60">Header</span>
                                            </div>
                                            {!openSections[1] && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[200px] sm:max-w-md">
                                                    {docNumber || "ไม่มีเลขที่"} • {selectedProjectObj?.name || "ไม่ระบุโครงการ"} • {selectedCustomerObj?.name || "ไม่ระบุลูกค้า"} • {date}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                                            {openSections[1] ? "ย่อส่วนนี้" : "ขยายส่วนนี้"}
                                        </span>
                                        {openSections[1] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </button>

                                {openSections[1] && (
                                    <div className="p-3.5 sm:p-4 pt-0 space-y-3.5 border-t border-border/60 min-w-0 w-full animate-in fade-in duration-200">
                                        {/* Document Number & Date */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full pt-1">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                        เลขที่เอกสาร <span className="text-red-400">*</span>
                                                    </label>
                                                    {!initialData && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDocNumber(generateNextDocumentNumber(type, incomes, date))}
                                                            className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                                            title="สร้างเลขที่ใหม่อีกครั้ง"
                                                        >
                                                            <RefreshCw className="w-3 h-3" /> สร้างใหม่
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="relative min-w-0 w-full">
                                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={docNumber}
                                                        onChange={(e) => setDocNumber(e.target.value)}
                                                        placeholder="e.g. QT-20261001-001"
                                                        className="w-full min-w-0 bg-background border border-input hover:border-foreground/20 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1 min-w-0">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                    {t.income.dialog.fields.date} <span className="text-red-400">*</span>
                                                </label>
                                                <div className="relative min-w-0 w-full">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={date}
                                                        onChange={(e) => {
                                                            setDate(e.target.value)
                                                            if (errors.date) setErrors({ ...errors, date: false })
                                                        }}
                                                        className={cn(
                                                            "w-full min-w-0 bg-background border rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-colors",
                                                            errors.date ? "border-red-500/50 focus:ring-red-500/20" : "border-input hover:border-foreground/20"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Project & Customer */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full">
                                            {/* Project */}
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <label className={cn("text-xs font-bold uppercase tracking-wider block truncate", errors.project ? "text-red-400" : "text-muted-foreground")}>
                                                        {t.income.dialog.fields.project} <span className="text-red-400">*</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddProject(true)}
                                                        className="text-[11px] text-primary hover:underline font-semibold"
                                                    >
                                                        + สร้างโปรเจค
                                                    </button>
                                                </div>
                                                <div className="relative min-w-0 w-full">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                                                    <div className="pl-9 min-w-0 w-full">
                                                        <SearchableCombobox
                                                            options={[
                                                                { value: "NEW_PROJECT", label: `➕ ${t.income.dialog.create_project}`, description: "สร้างโปรเจคใหม่" },
                                                                ...filteredProjects
                                                                    .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                                                    .map(p => ({ value: p.id, label: p.name, description: p.customer || "ไม่ระบุลูกค้า" }))
                                                            ]}
                                                            value={selectedProject}
                                                            onChange={(pid) => {
                                                                if (pid === "NEW_PROJECT") {
                                                                    setShowAddProject(true)
                                                                } else {
                                                                    setSelectedProject(pid)
                                                                    if (errors.project) setErrors({ ...errors, project: false })
                                                                    // Auto-select customer if project is selected
                                                                    if (pid) {
                                                                        const proj = projects.find(p => p.id === pid)
                                                                        if (proj) {
                                                                            const cust = customers.find(c => c.name === proj.customer)
                                                                            if (cust) {
                                                                                setSelectedCustomer(cust.id)
                                                                                if (errors.customer) setErrors({ ...errors, customer: false })
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                            placeholder={t.income.dialog.select_project}
                                                            searchPlaceholder="ค้นหาโปรเจค..."
                                                            emptyMessage="ไม่พบโปรเจค"
                                                            className="border-none p-0 w-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer */}
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <label className={cn("text-xs font-bold uppercase tracking-wider block truncate", errors.customer ? "text-red-400" : "text-muted-foreground")}>
                                                        {t.income.dialog.fields.customer} <span className="text-red-400">*</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddCustomer(true)}
                                                        className="text-[11px] text-primary hover:underline font-semibold"
                                                    >
                                                        + สร้างลูกค้า
                                                    </button>
                                                </div>
                                                <div className="relative min-w-0 w-full">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                                                    <div className="pl-9 min-w-0 w-full">
                                                        <SearchableCombobox
                                                            options={[
                                                                { value: "NEW_CUSTOMER", label: `➕ ${t.income.dialog.create_customer}`, description: "สร้างลูกค้าใหม่" },
                                                                ...customers
                                                                    .filter(c => c.status !== 'Inactive')
                                                                    .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                                                    .map(c => ({ value: c.id, label: c.name, description: c.phone || c.type || "ลูกค้าทั่วไป" }))
                                                            ]}
                                                            value={selectedCustomer}
                                                            onChange={(cid) => {
                                                                if (cid === "NEW_CUSTOMER") {
                                                                    setShowAddCustomer(true)
                                                                } else {
                                                                    setSelectedCustomer(cid)
                                                                    if (errors.customer) setErrors({ ...errors, customer: false })
                                                                }
                                                            }}
                                                            placeholder={t.income.dialog.select_customer}
                                                            searchPlaceholder="ค้นหาลูกค้า..."
                                                            emptyMessage="ไม่พบลูกค้า"
                                                            className="border-none p-0 w-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Document Format Mode (Simple vs Zone) */}
                                        <div className="p-3 rounded-xl bg-muted/40 border border-border/80 min-w-0 w-full space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    รูปแบบเอกสาร (Document Type)
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {mode === "Simple" ? "รวมทุกรายการในตารางเดียว" : "จัดกลุ่มรายการตามโซน/พื้นที่"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setMode("Simple")}
                                                    className={cn(
                                                        "py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                                                        mode === "Simple"
                                                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                            : "bg-background hover:bg-muted/60 text-muted-foreground border-border"
                                                    )}
                                                >
                                                    <Layers className="w-4 h-4 shrink-0" />
                                                    <span>{t.income.dialog.mode_simple_desc || "Simple (รวมรายการ)"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMode("Zone")}
                                                    className={cn(
                                                        "py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                                                        mode === "Zone"
                                                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                            : "bg-background hover:bg-muted/60 text-muted-foreground border-border"
                                                    )}
                                                >
                                                    <Layers2 className="w-4 h-4 shrink-0" />
                                                    <span>{t.income.dialog.mode_zone_desc || "Zone (แยกตามพื้นที่)"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: รายการสินค้า & บริการ */}
                            <div id="income-section-2" className="shrink-0 bg-card border border-border shadow-xs rounded-2xl overflow-hidden transition-all min-w-0 w-full scroll-mt-2">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(2)}
                                    className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2.5 text-left hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                                            subtotal > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary/20 text-primary border border-primary/30"
                                        )}>
                                            {subtotal > 0 ? <Check className="w-3.5 h-3.5" /> : "2"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-foreground">2. รายการสินค้า & บริการ</span>
                                                <span className="text-[9px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted border border-border/60">
                                                    {totalItemsCount} รายการ
                                                </span>
                                            </div>
                                            {!openSections[2] && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    ยอดรวมรายการ: <span className="font-semibold text-foreground">฿{subtotal.toLocaleString()}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                                            {openSections[2] ? "ย่อส่วนนี้" : "ขยายส่วนนี้"}
                                        </span>
                                        {openSections[2] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </button>

                                {openSections[2] && (
                                    <div className="p-3.5 sm:p-4 pt-0 space-y-4 border-t border-border/60 min-w-0 w-full animate-in fade-in duration-200">
                                        {mode === "Simple" ? (
                                            <div className="space-y-3 pt-2">
                                                {/* Column Headers (Desktop) */}
                                                <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-1.5 border-b border-border/60">
                                                    <div className="col-span-1 text-center">#</div>
                                                    <div className="col-span-6">รายการสินค้า / รายละเอียด</div>
                                                    <div className="col-span-2 text-center">จำนวน</div>
                                                    <div className="col-span-2 text-right">ราคา/หน่วย</div>
                                                    <div className="col-span-1 text-right">รวม</div>
                                                </div>

                                                {/* Simple Items List */}
                                                <div className="space-y-2.5">
                                                    {simpleItems.map((item: any, index: number) => (
                                                        <div
                                                            key={item.id}
                                                            className="p-3 sm:p-2 rounded-xl bg-background border border-border/80 hover:border-foreground/20 transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2.5 sm:gap-2 sm:items-start"
                                                        >
                                                            {/* Index & Image & Description */}
                                                            <div className="flex items-start gap-2.5 sm:col-span-7 min-w-0">
                                                                <div className="w-6 h-6 rounded-md bg-muted/60 text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                                                                    {index + 1}
                                                                </div>

                                                                {/* Image Uploader */}
                                                                <div className="relative shrink-0">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        id={`income-item-img-${item.id}`}
                                                                        onChange={(e) => handleImageUpload(e, item.id, 'simple')}
                                                                    />
                                                                    <label
                                                                        htmlFor={`income-item-img-${item.id}`}
                                                                        className={cn(
                                                                            "w-11 h-11 rounded-lg flex items-center justify-center border cursor-pointer transition-colors overflow-hidden relative group",
                                                                            item.image ? "border-primary/40 bg-muted/20" : "border-dashed border-input bg-muted/30 hover:bg-muted/60"
                                                                        )}
                                                                        title="คลิกเพื่อแนบรูปสินค้า"
                                                                    >
                                                                        {item.image ? (
                                                                            <>
                                                                                <Image src={item.image} alt="Item" fill sizes="44px" className="object-cover" unoptimized={item.image.startsWith('data:') || item.image.startsWith('blob:')} />
                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px]">
                                                                                    เปลี่ยน
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                                        )}
                                                                    </label>
                                                                </div>

                                                                {/* Name & Description Inputs */}
                                                                <div className="flex-1 space-y-1.5 min-w-0">
                                                                    <input
                                                                        placeholder="ชื่อสินค้า หรือ รายการงาน..."
                                                                        value={item.name || ""}
                                                                        onChange={(e) => updateSimpleItem(item.id, "name", e.target.value)}
                                                                        className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground"
                                                                    />
                                                                    <input
                                                                        placeholder="รายละเอียดสเปก หรือ ขอบเขตงาน (ถ้ามี)..."
                                                                        value={item.description || ""}
                                                                        onChange={(e) => updateSimpleItem(item.id, "description", e.target.value)}
                                                                        className="w-full bg-background border border-input/60 rounded-lg px-3 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Quantity, Unit, Price, Total, Delete in Mobile / Desktop */}
                                                            <div className="flex items-center justify-between sm:contents pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                                                {/* Qty & Unit */}
                                                                <div className="sm:col-span-2 flex items-center gap-1 min-w-0">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="จำนวน"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateSimpleItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                                        className="w-16 sm:w-full bg-background border border-input rounded-lg px-2 py-1.5 text-sm text-center font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                        min={0}
                                                                    />
                                                                    <input
                                                                        placeholder="หน่วย"
                                                                        value={item.unit || "unit"}
                                                                        onChange={(e) => updateSimpleItem(item.id, "unit", e.target.value)}
                                                                        className="w-12 sm:w-14 bg-background border border-input rounded-lg px-1 py-1.5 text-xs text-center text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                    />
                                                                </div>

                                                                {/* Unit Price */}
                                                                <div className="sm:col-span-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="ราคาต่อหน่วย"
                                                                        value={item.unitPrice}
                                                                        onChange={(e) => updateSimpleItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                                        className="w-24 sm:w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-sm text-right font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                        min={0}
                                                                    />
                                                                </div>

                                                                {/* Line Total & Trash */}
                                                                <div className="sm:col-span-1 flex items-center justify-end gap-1.5">
                                                                    <span className="text-sm font-bold text-foreground font-mono">
                                                                        ฿{(item.total || 0).toLocaleString()}
                                                                    </span>
                                                                    {simpleItems.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSimpleItems((prev: any[]) => prev.filter((i: any) => i.id !== item.id))}
                                                                            className="w-8 h-8 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-muted-foreground flex items-center justify-center transition-colors shrink-0"
                                                                            title="ลบรายการนี้"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add Item Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setSimpleItems((prev: any[]) => [
                                                        ...prev,
                                                        { id: Math.random().toString(), name: "", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }
                                                    ])}
                                                    className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {t.income.dialog.items.add || "เพิ่มรายการสินค้า/บริการ"}
                                                </button>
                                            </div>
                                        ) : (
                                            /* ZONE MODE */
                                            <div className="space-y-4 pt-2">
                                                {sections.map((section, sIndex) => (
                                                    <div key={section.id || `section-${sIndex}`} className="border border-border shadow-xs rounded-xl overflow-hidden bg-background">
                                                        {/* Zone Card Header */}
                                                        <div className="bg-muted/40 p-3 sm:p-3.5 flex items-center justify-between border-b border-border/80 gap-3">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className="relative shrink-0">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        id={`zone-cover-${section.id}`}
                                                                        onChange={(e) => handleImageUpload(e, "", "sectionHeader", section.id)}
                                                                    />
                                                                    <label
                                                                        htmlFor={`zone-cover-${section.id}`}
                                                                        className="w-10 h-10 bg-muted/80 rounded-lg flex items-center justify-center border border-border cursor-pointer hover:bg-muted transition-colors overflow-hidden relative group"
                                                                        title="แนบรูปปกโซน"
                                                                    >
                                                                        {section.coverImage ? (
                                                                            <Image src={section.coverImage} alt="Cover" fill sizes="40px" className="object-cover" unoptimized={section.coverImage.startsWith('data:') || section.coverImage.startsWith('blob:')} />
                                                                        ) : (
                                                                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                                        )}
                                                                    </label>
                                                                </div>
                                                                <input
                                                                    value={section.name}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value
                                                                        setSections(prev => prev.map(s => s.id === section.id ? { ...s, name: val } : s))
                                                                    }}
                                                                    className="bg-transparent font-bold text-sm sm:text-base outline-none placeholder:text-muted-foreground/50 w-full text-foreground border-b border-transparent focus:border-primary/50"
                                                                    placeholder={t.income.dialog.zone_name_placeholder || "ชื่อโซน เช่น โซนห้องนั่งเล่น, โซนครัว"}
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-xs font-mono font-bold text-primary hidden sm:inline">
                                                                    ฿{section.items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0).toLocaleString()}
                                                                </span>
                                                                {sections.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSections(prev => prev.filter(s => s.id !== section.id))}
                                                                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-muted-foreground"
                                                                        title="ลบโซนนี้"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Zone Items */}
                                                        <div className="p-3 sm:p-3.5 space-y-2.5">
                                                            {section.items.map((item, iIndex) => (
                                                                <div
                                                                    key={item.id || `item-${section.id}-${iIndex}`}
                                                                    className="p-2.5 rounded-lg bg-muted/20 border border-border/60 flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:items-center"
                                                                >
                                                                    <div className="flex items-center gap-2 sm:col-span-7 min-w-0">
                                                                        <span className="w-5 text-center text-xs text-muted-foreground font-bold shrink-0">{iIndex + 1}</span>
                                                                        <div className="relative shrink-0">
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="hidden"
                                                                                id={`file-${item.id}`}
                                                                                onChange={(e) => handleImageUpload(e, item.id, 'sectionItem', section.id)}
                                                                            />
                                                                            <label
                                                                                htmlFor={`file-${item.id}`}
                                                                                className="w-9 h-9 rounded-lg flex items-center justify-center border border-input cursor-pointer bg-background hover:bg-muted transition-colors overflow-hidden relative"
                                                                            >
                                                                                {item.image ? (
                                                                                    <Image src={item.image} alt="Item" fill sizes="36px" className="object-cover" unoptimized={item.image.startsWith('data:') || item.image.startsWith('blob:')} />
                                                                                ) : (
                                                                                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                                                )}
                                                                            </label>
                                                                        </div>
                                                                        <div className="flex-1 space-y-1 min-w-0">
                                                                            <input
                                                                                placeholder="ชื่อรายการ..."
                                                                                value={item.name || ""}
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value
                                                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                                                        ...s,
                                                                                        items: s.items.map(i => i.id === item.id ? { ...i, name: val } : i)
                                                                                    } : s))
                                                                                }}
                                                                                className="w-full bg-background border border-input rounded-md px-2.5 py-1 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between sm:contents pt-1 sm:pt-0">
                                                                        <div className="sm:col-span-2 flex items-center gap-1">
                                                                            <input
                                                                                type="number"
                                                                                placeholder="จำนวน"
                                                                                value={item.quantity}
                                                                                onChange={(e) => {
                                                                                    const qty = parseFloat(e.target.value) || 0
                                                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                                                        ...s,
                                                                                        items: s.items.map(i => i.id === item.id ? { ...i, quantity: qty, total: qty * (Number(i.unitPrice) || 0) } : i)
                                                                                    } : s))
                                                                                }}
                                                                                className="w-16 sm:w-full bg-background border border-input rounded-md px-2 py-1 text-xs text-center font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                                min={0}
                                                                            />
                                                                            <input
                                                                                placeholder="หน่วย"
                                                                                value={item.unit || "unit"}
                                                                                onChange={(e) => {
                                                                                    const unit = e.target.value
                                                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                                                        ...s,
                                                                                        items: s.items.map(i => i.id === item.id ? { ...i, unit } : i)
                                                                                    } : s))
                                                                                }}
                                                                                className="w-12 sm:w-14 bg-background border border-input rounded-md px-1 py-1 text-[11px] text-center text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                            />
                                                                        </div>

                                                                        <div className="sm:col-span-2">
                                                                            <input
                                                                                type="number"
                                                                                placeholder="ราคา"
                                                                                value={item.unitPrice}
                                                                                onChange={(e) => {
                                                                                    const pr = parseFloat(e.target.value) || 0
                                                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                                                        ...s,
                                                                                        items: s.items.map(i => i.id === item.id ? { ...i, unitPrice: pr, total: (Number(i.quantity) || 0) * pr } : i)
                                                                                    } : s))
                                                                                }}
                                                                                className="w-20 sm:w-full bg-background border border-input rounded-md px-2 py-1 text-xs text-right font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                                min={0}
                                                                            />
                                                                        </div>

                                                                        <div className="sm:col-span-1 flex items-center justify-end gap-1">
                                                                            <span className="text-xs font-mono font-bold">
                                                                                ฿{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString()}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                                                        ...s,
                                                                                        items: s.items.filter(i => i.id !== item.id)
                                                                                    } : s))
                                                                                }}
                                                                                className="p-1 hover:text-red-500 text-muted-foreground rounded transition-colors"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                                        ...s,
                                                                        items: [...s.items, { id: Math.random().toString(), name: "", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }]
                                                                    } : s))
                                                                }}
                                                                className="w-full py-2 text-xs text-primary hover:bg-primary/5 rounded-lg border border-dashed border-primary/30 flex items-center justify-center gap-1.5 transition-colors"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> เพิ่มรายการในโซนนี้
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add Zone Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setSections(prev => [...prev, { id: Math.random().toString(), name: `Zone ${prev.length + 1}`, items: [] }])}
                                                    className="w-full py-3 border border-dashed border-border rounded-xl text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
                                                >
                                                    <Plus className="w-4 h-4" /> {t.income.dialog.add_zone || "เพิ่มโซนใหม่"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* STEP 3 (Mobile only): สรุปยอด & ภาษี */}
                            <div id="income-section-3" className="lg:hidden shrink-0 bg-card border border-border shadow-xs rounded-2xl overflow-hidden transition-all min-w-0 w-full scroll-mt-2">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(3)}
                                    className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2.5 text-left hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                                            grandTotal > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary/20 text-primary border border-primary/30"
                                        )}>
                                            {grandTotal > 0 ? <Check className="w-3.5 h-3.5" /> : "3"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-foreground">3. สรุปยอดเงิน & ภาษี</span>
                                                <span className="text-[9px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted border border-border/60">Summary</span>
                                            </div>
                                            {!openSections[3] && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    ยอดรวมสุทธิ: <span className="font-bold text-primary font-mono">฿{grandTotal.toLocaleString()}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {openSections[3] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </button>

                                {openSections[3] && (
                                    <div className="p-4 pt-0 space-y-3 border-t border-border/60 min-w-0 w-full animate-in fade-in duration-200">
                                        <div className="space-y-2 text-xs text-muted-foreground pt-2">
                                            <div className="flex justify-between items-center">
                                                <span>{t.income.dialog.summary.subtotal || "ยอดก่อนภาษี / รวมเงิน"}</span>
                                                <span className="font-mono font-medium text-foreground">฿{subtotal.toLocaleString()}</span>
                                            </div>

                                            <div className="flex justify-between items-center py-2 px-2.5 rounded-xl bg-muted/30 border border-border/60">
                                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                                                    <input
                                                        type="checkbox"
                                                        checked={includeVat}
                                                        onChange={(e) => setIncludeVat(e.target.checked)}
                                                        className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-primary/50"
                                                    />
                                                    <span>รวมภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                                                </label>
                                                <span className="font-mono text-xs font-semibold text-foreground">฿{tax.toLocaleString()}</span>
                                            </div>

                                            <div className="flex justify-between items-baseline pt-2 border-t border-border">
                                                <span className="text-sm font-bold text-foreground">{t.income.dialog.summary.grand_total || "ยอดรวมทั้งสิ้น"}</span>
                                                <span className="text-xl font-black text-primary font-mono">฿{grandTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* RIGHT PANE (Desktop only, 5 cols) */}
                        <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col h-full overflow-y-auto overflow-x-hidden p-5 space-y-4 bg-muted/15 min-w-0 custom-scrollbar overscroll-contain min-h-0">

                            {/* Document Live Preview Card */}
                            <div className="shrink-0 bg-card border border-border shadow-xs rounded-2xl p-4 space-y-3 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                        ข้อมูลเอกสาร (Document Info)
                                    </span>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        {docTypeLabel}
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">เลขที่เอกสาร:</span>
                                        <span className="font-mono font-bold text-foreground">{docNumber || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">วันที่:</span>
                                        <span className="font-medium text-foreground">{date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">โครงการ:</span>
                                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                                            {selectedProjectObj?.name || "ยังไม่ระบุ"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ลูกค้า:</span>
                                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                                            {selectedCustomerObj?.name || "ยังไม่ระบุ"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tax Settings Card */}
                            <div className="shrink-0 bg-card border border-border shadow-xs rounded-2xl p-4 space-y-3 min-w-0">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                    ตั้งค่าภาษีมูลค่าเพิ่ม (VAT Settings)
                                </span>
                                <label className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/70 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={includeVat}
                                        onChange={(e) => setIncludeVat(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 rounded border-input bg-background text-primary focus:ring-primary/50"
                                    />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-foreground">คำนวณภาษีมูลค่าเพิ่ม 7% (VAT)</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            เพิ่มภาษี 7% ในยอดรวมสุทธิของเอกสาร
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Financial Summary Card */}
                            <div className="shrink-0 bg-card border border-border shadow-xs rounded-2xl p-4 space-y-3 mt-auto min-w-0">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                    สรุปยอดเงิน (Financial Summary)
                                </span>

                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>จำนวนรายการทั้งหมด</span>
                                        <span className="font-semibold text-foreground">{totalItemsCount} รายการ</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t.income.dialog.summary.subtotal || "ยอดก่อนภาษี / รวมเงิน"}</span>
                                        <span className="font-mono text-foreground">฿{subtotal.toLocaleString()}</span>
                                    </div>
                                    {includeVat && (
                                        <div className="flex justify-between">
                                            <span>ภาษีมูลค่าเพิ่ม (7%)</span>
                                            <span className="font-mono text-foreground">฿{tax.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="h-px bg-border my-1" />

                                <div className="flex justify-between items-baseline pt-1">
                                    <span className="text-sm font-bold text-foreground">{t.income.dialog.summary.grand_total || "ยอดรวมทั้งสิ้น"}</span>
                                    <span className="text-2xl font-black text-primary font-mono">฿{grandTotal.toLocaleString()}</span>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* Full-width Sticky Footer with Live Grand Total & Save Button */}
                    <div className="p-3.5 sm:p-5 border-t border-border bg-background shrink-0 flex items-center justify-between gap-3 min-w-0 w-full pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-lg">
                        <div className="min-w-0 flex items-center gap-3">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block leading-tight whitespace-nowrap">
                                    {t.income.dialog.summary.grand_total || "ยอดรวมทั้งสิ้น"}
                                </span>
                                <span className="text-xl sm:text-2xl font-black text-primary font-mono truncate block">
                                    ฿{grandTotal.toLocaleString()}
                                </span>
                            </div>
                            <span className="hidden sm:inline-block text-xs text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-lg">
                                {totalItemsCount} รายการ
                            </span>
                            {includeVat && (
                                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                    <CheckCircle2 className="w-3 h-3" /> รวม VAT 7%
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-muted/40 hover:bg-muted active:scale-95 text-xs sm:text-sm font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
                            >
                                {t.income.dialog.footer.cancel || "ยกเลิก"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!selectedCustomer || !selectedProject || isSubmitting}
                                className="min-w-[140px] sm:min-w-[190px] bg-primary text-primary-foreground hover:opacity-90 rounded-xl py-3 px-5 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 active:scale-95 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        <span>กำลังบันทึก...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>{t.income.dialog.save || "บันทึก"} {docTypeLabel}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Quick Add Dialogs */}
            <AddCustomerDialog
                isOpen={showAddCustomer}
                onClose={() => setShowAddCustomer(false)}
            />
            <AddProjectDialog
                isOpen={showAddProject}
                onClose={() => setShowAddProject(false)}
            />
        </div>
    )

    return createPortal(dialogContent, document.body)
}

export default AddIncomeDialog
