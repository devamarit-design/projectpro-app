import { useState, useRef, useEffect, useMemo } from "react"
import { useProjects, Customer, Project, IncomeType, IncomeSection } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Calendar, Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Save, Upload } from "lucide-react"
import { cn, generateNextDocumentNumber } from "@/lib/utils"
import AddCustomerDialog from "@/components/customers/add-customer-dialog"
import AddProjectDialog from "@/components/projects/add-project-dialog"
import { useOrganization } from "@/context/organization-context"
import { sendQuotationNotification } from "@/lib/functions-client"
import SearchableCombobox from "@/components/ui/searchable-combobox"

interface AddIncomeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultType?: IncomeType
    initialData?: any // For Edit Mode
}

export function AddIncomeDialog({ open, onOpenChange, defaultType = "Quotation", initialData }: AddIncomeDialogProps) {
    const { incomes, customers, projects, addIncome, updateIncome, currentUser } = useProjects()
    const { t } = useTranslation()
    const { currentOrg } = useOrganization()

    // Form State
    const [step, setStep] = useState<1 | 2>(1)
    const [type, setType] = useState<IncomeType>(initialData?.type || defaultType)
    const [selectedProject, setSelectedProject] = useState(initialData?.projectId || "")
    const [selectedCustomer, setSelectedCustomer] = useState(initialData?.customerId || "")
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0])
    const [docNumber, setDocNumber] = useState(initialData?.documentNumber || "")
    const [mode, setMode] = useState<"Simple" | "Zone">(initialData?.mode || "Simple")
    const [includeVat, setIncludeVat] = useState(initialData?.vatIncluded ?? true)

    // Dialog States
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showAddCustomer, setShowAddCustomer] = useState(false)
    const [showAddProject, setShowAddProject] = useState(false)

    // Track previous counts to auto-select new items
    const prevCustomersLength = useRef(customers.length)
    const prevProjectsLength = useRef(projects.length)

    useEffect(() => {
        if (customers.length > prevCustomersLength.current) {
            // New customer added, select it
            const newCustomer = customers[customers.length - 1]
            setSelectedCustomer(newCustomer.id)
            prevCustomersLength.current = customers.length
        }
    }, [customers])

    useEffect(() => {
        if (projects.length > prevProjectsLength.current) {
            // New project added, select it
            const newProject = projects[projects.length - 1]
            setSelectedProject(newProject.id)
            prevProjectsLength.current = projects.length
        }
    }, [projects])

    // Sync State with initialData when dialog opens
    useEffect(() => {
        if (open) {
            if (initialData) {
                // Edit Mode
                setType(initialData.type)
                setSelectedProject(initialData.projectId)
                setSelectedCustomer(initialData.customerId)
                setDate(initialData.date)
                setDocNumber(initialData.documentNumber)
                setMode(initialData.mode || "Simple")
                setSimpleItems(initialData.items?.map((i: any) => ({ ...i, id: i.id || Math.random().toString() })) || [{ id: "1", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }])
                setSections(initialData.sections?.map((s: any) => ({
                    ...s,
                    id: s.id || Math.random().toString(),
                    items: s.items?.map((i: any) => ({ ...i, id: i.id || Math.random().toString() })) || []
                })) || [{ id: "1", name: "Zone 1", items: [{ id: "1-1", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }] }])
            } else {
                // Add New Mode
                resetForm()
                setType(defaultType)
                const today = new Date().toISOString().split('T')[0]
                setDate(today)
                setDocNumber(generateNextDocumentNumber(defaultType, incomes, today))
                setMode("Simple")
                setIncludeVat(true)
            }
        }
    }, [open, initialData, defaultType, incomes])

    // Auto-generate document number when type or date changes (only in Add mode)
    useEffect(() => {
        if (!initialData && open) {
            setDocNumber(generateNextDocumentNumber(type, incomes, date))
        }
    }, [type, date, open, initialData, incomes])

    const [simpleItems, setSimpleItems] = useState(initialData?.items || [
        { id: "1", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }
    ])

    // Sections for Zone Mode
    const [sections, setSections] = useState<IncomeSection[]>(initialData?.sections || [
        {
            id: "1",
            name: "Zone 1",
            items: [{ id: "1-1", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }]
        }
    ])

    const calculateSimpleTotal = () => {
        return simpleItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
    }

    const calculateZoneTotal = () => {
        return sections.reduce((secSum, sec) => {
            return secSum + sec.items.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0)
        }, 0)
    }

    const subtotal = mode === "Simple" ? calculateSimpleTotal() : calculateZoneTotal()
    const tax = includeVat ? subtotal * 0.07 : 0
    const grandTotal = subtotal + tax

    const handleSave = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            const finalDocNumber = docNumber || generateNextDocumentNumber(type, incomes)

            // Determine status
            let status = initialData?.status || "Draft"

            // Logic: If editing a Quotation that was already 'Invoiced', reset it to 'Sent' so it can be re-invoiced if needed.
            if (initialData && type === 'Quotation' && initialData.status === 'Invoiced') {
                status = 'Sent'
            }

            // Sanitize items recursively to remove undefined
            const sanitizeItem = (item: any) => {
                const { id, ...rest } = item
                return {
                    ...rest,
                    description: rest.description || "",
                    unit: rest.unit || "unit",
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
                        coverImage: s.coverImage,
                        items: s.items.map(sanitizeItem)
                    }))
                } : {}),
                subtotal,
                discount: 0,
                tax,
                total: grandTotal,
                grandTotal,
                status: status,
                vatIncluded: includeVat
            }

            if (initialData) {
                await updateIncome(initialData.id, docPayload as any)
            } else {
                await addIncome(docPayload as any)

                // Send Telegram Notification (Quotation only)
                if (type === 'Quotation' && currentOrg?.id) {
                    try {
                        const project = projects.find(p => p.id === selectedProject)
                        const customer = customers.find(c => c.id === selectedCustomer)

                        sendQuotationNotification({
                            orgId: currentOrg.id,
                            quotation: {
                                projectName: project?.name || t.income.dialog.select_project,
                                customerName: customer?.name || t.income.dialog.select_customer,
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
        } catch (error) {
            console.error("Failed to save income:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setStep(1)
        setSimpleItems([{ id: "1", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }])
        setSections([{ id: "1", name: "Zone 1", items: [{ id: "1-1", description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }] }])
        setSelectedProject("")
        setSelectedCustomer("")
        setIncludeVat(true)
    }

    // Helper functions for updating items...
    const updateSimpleItem = (id: string, field: string, value: any) => {
        setSimpleItems((prev: any[]) => prev.map((item: any) => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value }
                newItem.total = newItem.quantity * newItem.unitPrice
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
            const img = new Image()
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
            img.onerror = (e) => reject(new Error("Image load failed"))
        })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string, type: 'simple' | 'sectionItem' | 'sectionHeader' = 'simple', sectionId?: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            // 1. Read file first
            const rawBase64 = await readFileAsBase64(file)
            let finalData = rawBase64

            // 2. Try compress
            try {
                finalData = await compressBase64(rawBase64)
            } catch (compressError) {
                console.warn("Image compression failed, using original:", compressError)
                // Fallback to rawBase64
            }

            // 3. Save
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
        } catch (error) {
            console.error("Failed to process image:", error)
            alert("Failed to upload image. Please try another file.")
        }
    }

    // Filter projects based on selected customer
    const filteredProjects = useMemo(() => {
        if (!selectedCustomer) return projects
        const cust = customers.find(c => c.id === selectedCustomer)
        if (!cust) return projects
        return projects.filter(p => p.customer === cust.name)
    }, [selectedCustomer, projects, customers])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/10">
                {/* Header */}
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-xl font-bold">
                            {initialData ? t.income.dialog.edit : t.income.dialog.new} {t.income.dialog.doc_types[type.toLowerCase() as keyof typeof t.income.dialog.doc_types]}
                        </DialogTitle>
                        <div className="flex bg-muted rounded-lg p-0.5">
                            {(["Quotation", "Invoice", "Receipt"] as IncomeType[]).map(docType => (
                                <button
                                    key={docType}
                                    onClick={() => setType(docType)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                        type === docType ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {t.income.dialog.doc_types[docType.toLowerCase() as keyof typeof t.income.dialog.doc_types]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-muted rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Top Section: Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.income.dialog.fields.project}</label>
                                <SearchableCombobox
                                    options={[
                                        { value: "NEW_PROJECT", label: `➕ ${t.income.dialog.create_project}`, description: "สร้างโปรเจคใหม่" },
                                        ...filteredProjects
                                            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                            .map(p => ({ value: p.id, label: p.name, description: p.customer }))
                                    ]}
                                    value={selectedProject}
                                    onChange={(pid) => {
                                        if (pid === "NEW_PROJECT") {
                                            setShowAddProject(true)
                                        } else {
                                            setSelectedProject(pid)
                                            // Auto-select customer if project is selected
                                            if (pid) {
                                                const proj = projects.find(p => p.id === pid)
                                                if (proj) {
                                                    const cust = customers.find(c => c.name === proj.customer)
                                                    if (cust) {
                                                        setSelectedCustomer(cust.id)
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    placeholder={t.income.dialog.select_project}
                                    searchPlaceholder="ค้นหาโปรเจค..."
                                    emptyMessage="ไม่พบโปรเจค"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.income.dialog.fields.customer}</label>
                                <SearchableCombobox
                                    options={[
                                        { value: "NEW_CUSTOMER", label: `➕ ${t.income.dialog.create_customer}`, description: "สร้างลูกค้าใหม่" },
                                        ...customers
                                            .filter(c => c.status !== 'Inactive')
                                            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                            .map(c => ({ value: c.id, label: c.name, description: c.type }))
                                    ]}
                                    value={selectedCustomer}
                                    onChange={(cid) => {
                                        if (cid === "NEW_CUSTOMER") {
                                            setShowAddCustomer(true)
                                        } else {
                                            setSelectedCustomer(cid)
                                        }
                                    }}
                                    placeholder={t.income.dialog.select_customer}
                                    searchPlaceholder="ค้นหาลูกค้า..."
                                    emptyMessage="ไม่พบลูกค้า"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.income.dialog.fields.date}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-muted/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">เลขที่เอกสาร</label>
                                <input
                                    type="text"
                                    value={docNumber}
                                    onChange={(e) => setDocNumber(e.target.value)}
                                    placeholder="Auto-generated"
                                    className="w-full bg-muted/30 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.income.dialog.fields.doc_type}</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMode("Simple")}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium transition-all",
                                            mode === "Simple" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 hover:bg-muted/50"
                                        )}
                                    >
                                        {t.income.dialog.mode_simple_desc}
                                    </button>
                                    <button
                                        onClick={() => setMode("Zone")}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium transition-all",
                                            mode === "Zone" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 hover:bg-muted/50"
                                        )}
                                    >
                                        {t.income.dialog.mode_zone_desc}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Items Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">{t.income.dialog.sections.items}</h3>
                        </div>

                        {mode === "Simple" ? (
                            <div className="space-y-2">
                                {/* Column Headers */}
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide pb-1 border-b border-white/5">
                                    <div className="col-span-1 text-center">#</div>
                                    <div className="col-span-5">Item / Description</div>
                                    <div className="col-span-2 text-center">Qty</div>
                                    <div className="col-span-2 text-center">Price</div>
                                    <div className="col-span-2 text-right">Total</div>
                                </div>
                                {simpleItems.map((item: any, index: number) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-start animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="col-span-1 flex justify-center py-2.5 text-muted-foreground text-sm">{index + 1}</div>
                                        <div className="col-span-5 flex gap-2">
                                            {/* Image Upload */}
                                            <div className="relative shrink-0">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    id={`file-${item.id}`}
                                                    onChange={(e) => handleImageUpload(e, item.id)}
                                                />
                                                <label
                                                    htmlFor={`file-${item.id}`}
                                                    className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center border border-input cursor-pointer transition-colors overflow-hidden",
                                                        item.image ? "bg-transparent" : "bg-muted hover:bg-muted/80"
                                                    )}
                                                >
                                                    {item.image ? (
                                                        <img src={item.image} className="w-full h-full object-cover" alt="Item" />
                                                    ) : (
                                                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </label>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <input
                                                    placeholder="Item name..."
                                                    value={item.name || ""}
                                                    onChange={(e) => updateSimpleItem(item.id, "name", e.target.value)}
                                                    className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                />
                                                <input
                                                    placeholder="Description (optional)..."
                                                    value={item.description}
                                                    onChange={(e) => updateSimpleItem(item.id, "description", e.target.value)}
                                                    className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                placeholder={t.income.dialog.items.qty}
                                                value={item.quantity}
                                                onChange={(e) => updateSimpleItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                className="w-full bg-background border border-input rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50 font-medium"
                                                min={0}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                placeholder={t.income.dialog.items.price}
                                                value={item.unitPrice}
                                                onChange={(e) => updateSimpleItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary/50 font-medium"
                                                min={0}
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <div className="flex-1 text-right text-sm py-2 font-medium">
                                                {item.total.toLocaleString()}
                                            </div>
                                            <button
                                                onClick={() => setSimpleItems((prev: any[]) => prev.filter((i: any) => i.id !== item.id))}
                                                className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setSimpleItems((prev: any[]) => [...prev, { id: Math.random().toString(), description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }])}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors mt-2"
                                >
                                    <Plus className="w-4 h-4" /> {t.income.dialog.items.add}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {sections.map((section, sIndex) => (
                                    <div key={section.id || `section-${sIndex}`} className="border border-white/10 rounded-xl overflow-hidden bg-card/30">
                                        <div className="bg-muted/30 p-4 flex items-center justify-between border-b border-white/5">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="relative shrink-0">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        id={`zone-file-${section.id}`}
                                                        onChange={(e) => handleImageUpload(e, "", "sectionHeader", section.id)}
                                                    />
                                                    <label
                                                        htmlFor={`zone-file-${section.id}`}
                                                        className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center border border-white/5 cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                                                    >
                                                        {section.coverImage ? (
                                                            <img src={section.coverImage} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </label>
                                                </div>
                                                <input
                                                    value={section.name}
                                                    onChange={(e) => setSections(prev => prev.map(s => s.id === section.id ? { ...s, name: e.target.value } : s))}
                                                    className="bg-transparent font-bold text-lg outline-none placeholder:text-muted-foreground/50 w-full"
                                                    placeholder={t.income.dialog.zone_name_placeholder}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setSections(prev => prev.filter(s => s.id !== section.id))}
                                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {/* Column Headers */}
                                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide pb-1 border-b border-white/5">
                                                <div className="col-span-1 text-center">#</div>
                                                <div className="col-span-5">Item / Description</div>
                                                <div className="col-span-2 text-center">Qty</div>
                                                <div className="col-span-2 text-center">Price</div>
                                                <div className="col-span-2 text-right">Total</div>
                                            </div>
                                            {section.items.map((item, iIndex) => (
                                                <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                                                    <div className="col-span-1 flex justify-center py-2.5 text-muted-foreground text-sm">{iIndex + 1}</div>
                                                    <div className="col-span-5 flex gap-2">
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
                                                                className={cn(
                                                                    "w-10 h-10 rounded-lg flex items-center justify-center border border-input cursor-pointer transition-colors overflow-hidden",
                                                                    item.image ? "bg-transparent" : "bg-muted hover:bg-muted/80"
                                                                )}
                                                            >
                                                                {item.image ? (
                                                                    <img src={item.image} className="w-full h-full object-cover" alt="Item" />
                                                                ) : (
                                                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                                )}
                                                            </label>
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <input
                                                                placeholder="Item name..."
                                                                value={item.name || ""}
                                                                onChange={(e) => {
                                                                    const newVal = e.target.value
                                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                                        ...s,
                                                                        items: s.items.map(i => i.id === item.id ? { ...i, name: newVal } : i)
                                                                    } : s))
                                                                }}
                                                                className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                            />
                                                            <input
                                                                placeholder="Description (optional)..."
                                                                value={item.description}
                                                                onChange={(e) => {
                                                                    const newVal = e.target.value
                                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                                        ...s,
                                                                        items: s.items.map(i => i.id === item.id ? { ...i, description: newVal } : i)
                                                                    } : s))
                                                                }}
                                                                className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder={t.income.dialog.items.qty}
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const newVal = parseFloat(e.target.value) || 0
                                                                setSections(prev => prev.map(s => s.id === section.id ? {
                                                                    ...s,
                                                                    items: s.items.map(i => i.id === item.id ? { ...i, quantity: newVal, total: newVal * i.unitPrice } : i)
                                                                } : s))
                                                            }}
                                                            className="w-full bg-background border border-input rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50 font-medium"
                                                            min={0}
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder={t.income.dialog.items.price}
                                                            value={item.unitPrice}
                                                            onChange={(e) => {
                                                                const newVal = parseFloat(e.target.value) || 0
                                                                setSections(prev => prev.map(s => s.id === section.id ? {
                                                                    ...s,
                                                                    items: s.items.map(i => i.id === item.id ? { ...i, unitPrice: newVal, total: item.quantity * newVal } : i)
                                                                } : s))
                                                            }}
                                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary/50 font-medium"
                                                            min={0}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex items-center gap-2">
                                                        <div className="flex-1 text-right text-sm py-2 font-medium">
                                                            {item.total.toLocaleString()}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSections(prev => prev.map(s => s.id === section.id ? {
                                                                    ...s,
                                                                    items: s.items.filter(i => i.id !== item.id)
                                                                } : s))
                                                            }}
                                                            className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    setSections(prev => prev.map(s => s.id === section.id ? {
                                                        ...s,
                                                        items: [...s.items, { id: Math.random().toString(), description: "", quantity: 1, unit: "unit", unitPrice: 0, total: 0, image: "" }]
                                                    } : s))
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors mt-2"
                                            >
                                                <Plus className="w-4 h-4" /> {t.income.dialog.items.add}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setSections(prev => [...prev, { id: Math.random().toString(), name: `Zone ${prev.length + 1}`, items: [] }])}
                                    className="w-full py-3 border border-dashed border-white/20 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> {t.income.dialog.add_zone}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-muted/20">
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t.income.dialog.summary.subtotal}</span>
                            <span>฿{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground">{t.income.dialog.summary.tax} (7%)</span>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeVat}
                                        onChange={(e) => setIncludeVat(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-muted/30 text-primary focus:ring-primary/50"
                                    />
                                    <span className="text-xs text-muted-foreground">Include VAT</span>
                                </label>
                                <span>฿{tax.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-primary border-t border-white/10 pt-2">
                            <span>{t.income.dialog.summary.grand_total}</span>
                            <span>฿{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-6 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                            {t.income.dialog.footer.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedCustomer || !selectedProject || isSubmitting}
                            className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> {t.income.dialog.save} {t.income.dialog.doc_types[type.toLowerCase() as keyof typeof t.income.dialog.doc_types]}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </DialogContent>

            {/* Quick Add Dialogs */}
            <AddCustomerDialog
                isOpen={showAddCustomer}
                onClose={() => setShowAddCustomer(false)}
            />
            <AddProjectDialog
                isOpen={showAddProject}
                onClose={() => setShowAddProject(false)}
            />
        </Dialog>
    )
}
