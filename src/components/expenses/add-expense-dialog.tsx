import * as React from "react"
import { createPortal } from "react-dom"
import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
import { X, Receipt, ScanLine, Plus, Trash2, Layers, User, Building, Camera, Upload, CheckCircle2, ChevronDown, ChevronUp, Check, ArrowRight, ArrowLeft, Sparkles, Image as ImageIcon } from "lucide-react"
import { useProjects, ExpenseCategory, ExpenseItem } from "@/context/project-context"
import { SmartScanDialog } from "@/components/expenses/smart-scan-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { uploadWithThumbnail } from "@/lib/upload"
import SearchableCombobox from "@/components/ui/searchable-combobox"
import { useOrganization } from "@/context/organization-context"
import { sendExpenseNotification } from "@/lib/functions-client"
import Image from "next/image"
import { SafeBackdrop } from "@/components/ui/safe-backdrop"

interface AddExpenseDialogProps {
    isOpen: boolean
    onClose: () => void
    defaultProjectId?: string
    startScanning?: boolean
    defaultDate?: string
    initialData?: {
        payee?: string
        date?: string
        total?: number
        items?: ExpenseItem[]
        receiptImage?: string
    }
}

import { useTranslation } from "@/lib/i18n-context"

export default function AddExpenseDialog({ isOpen, onClose, defaultProjectId, startScanning, defaultDate, initialData }: AddExpenseDialogProps) {
    const { addExpense, addProject, addTask, addSubProject, addUser, addVendor, addWorker, projects, tasks, users, vendors, workers, currentUser } = useProjects()
    const { currentOrg } = useOrganization()
    const { t } = useTranslation()

    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Lock body scroll and set modal-open class when open
    React.useEffect(() => {
        if (isOpen) {
            document.body.classList.add("modal-open")
            const prevOverflow = document.body.style.overflow
            document.body.style.overflow = "hidden"
            return () => {
                document.body.classList.remove("modal-open")
                document.body.style.overflow = prevOverflow
            }
        }
    }, [isOpen])

    const [isScanOpen, setIsScanOpen] = React.useState(false)

    // Form Fields
    const [title, setTitle] = React.useState("")
    const [date, setDate] = React.useState(new Date().toISOString().split('T')[0])
    const [payee, setPayee] = React.useState("")

    const [status, setStatus] = React.useState<"Paid" | "Pending" | "Unpaid" | "Advanced" | "Credit">("Paid")
    const [receiptImage, setReceiptImage] = React.useState<string | null>(null)
    const [receiptFile, setReceiptFile] = React.useState<File | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [receiptExpanded, setReceiptExpanded] = React.useState(false)

    // 3-Step Accordion Section State (1: หัวบิล, 2: รายการบิล, 3: รูปสลิป)
    const [openSections, setOpenSections] = React.useState<{ [key: number]: boolean }>({
        1: true,
        2: false,
        3: false,
    })

    const toggleSection = (step: number) => {
        setOpenSections(prev => ({
            ...prev,
            [step]: !prev[step]
        }))
    }

    // Split Bill Logic
    const [billType, setBillType] = React.useState<"combine" | "split">("combine")
    const [globalProjectId, setGlobalProjectId] = React.useState("")
    const [globalTaskId, setGlobalTaskId] = React.useState("")
    const [globalSubProjectId, setGlobalSubProjectId] = React.useState("")

    // Advanced Status Fields
    const [paidBy, setPaidBy] = React.useState("") // For "Advanced"
    const [vendor, setVendor] = React.useState("") // For "Credit"

    // Quick Add State
    const [quickAdd, setQuickAdd] = React.useState<{ type: 'project' | 'task' | 'user' | 'vendor' | 'worker' | 'sub-project', parentId?: string } | null>(null)

    const [newItemName, setNewItemName] = React.useState("")
    const [newItemSecondary, setNewItemSecondary] = React.useState("") // Role or Category

    // Billing
    const [vatIncluded, setVatIncluded] = React.useState(true)
    const [items, setItems] = React.useState<ExpenseItem[]>([
        { id: "1", description: "", amount: 0, quantity: 1, unitPrice: 0, category: "Material", projectId: defaultProjectId }
    ])

    // Validation State
    const [errors, setErrors] = React.useState<{ [key: string]: boolean }>({})

    // Refs for focus
    const titleRef = React.useRef<HTMLInputElement>(null)
    const dateRef = React.useRef<HTMLInputElement>(null)
    const payeeRef = React.useRef<HTMLButtonElement>(null) // Combobox trigger
    const amountRef = React.useRef<HTMLInputElement>(null)

    const [uploadStatus, setUploadStatus] = React.useState<string>("")
    const scrollRef = React.useRef<HTMLDivElement>(null)

    // Reset when opening
    React.useEffect(() => {
        if (isOpen) {
            setBillType("combine")
            setGlobalProjectId(defaultProjectId || "")
            setGlobalTaskId("")
            setGlobalSubProjectId("")

            // Check for initialData from Smart Scan
            if (initialData) {
                setPayee(initialData.payee || "")
                setDate(initialData.date || new Date().toISOString().split('T')[0])
                if (initialData.items && initialData.items.length > 0) {
                    setItems(initialData.items.map(i => ({ ...i, projectId: defaultProjectId })))
                } else {
                    setItems([{ id: "1", description: "", amount: initialData.total || 0, quantity: 1, unitPrice: initialData.total || 0, category: "Material", projectId: defaultProjectId }])
                }
                setTitle(initialData.payee ? `Bill from ${initialData.payee}` : "")

                if (initialData.receiptImage) {
                    setReceiptImage(initialData.receiptImage)
                    setReceiptExpanded(true)
                } else {
                    setReceiptImage(null)
                    setReceiptExpanded(false)
                }
                setOpenSections({ 1: true, 2: true, 3: Boolean(initialData.receiptImage) })
            } else {
                setItems([{ id: "1", description: "", amount: 0, quantity: 1, unitPrice: 0, category: "Material", projectId: defaultProjectId }])
                setTitle("")
                setDate(defaultDate || new Date().toISOString().split('T')[0])
                setPayee("")
                setReceiptImage(null)
                setReceiptExpanded(false)
                setOpenSections({ 1: true, 2: true, 3: false })
            }

            setStatus("Paid")
            setPaidBy("")
            setVendor("")
            setVatIncluded(true)
            setReceiptFile(null)

            setQuickAdd(null)
            setErrors({})
            setUploadStatus("")

            if (startScanning) {
                setIsScanOpen(true)
            }
        }
    }, [isOpen, defaultProjectId, startScanning, defaultDate, initialData])

    // Clean, sorted, deduplicated vendors & workers options
    const payeeOptions = React.useMemo(() => {
        const isLabor = items[0]?.category === 'Labor'
        if (isLabor) {
            const seen = new Set<string>()
            const filteredWorkers = workers
                .filter(w => {
                    if (!w.name || !w.name.trim() || w.status === 'Inactive') return false
                    const key = w.name.trim().toLowerCase()
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                .sort((a, b) => a.name.trim().localeCompare(b.name.trim(), 'th'))
                .map(w => ({ value: w.name.trim(), label: w.name.trim(), description: w.role }))

            return [
                { value: "NEW", label: `➕ ${t.expenses.dialog.add_new_person} `, description: "เพิ่มคนงานใหม่" },
                ...filteredWorkers
            ]
        }

        const cat = items[0]?.category || "Material"
        const seen = new Set<string>()
        const filteredVendors = vendors
            .filter(v => {
                if (!v.name || !v.name.trim() || v.status === 'Inactive') return false
                if (cat === 'Sub-contract' && v.category !== 'Sub-contract') return false
                if (cat === 'Material' && v.category !== 'Material') return false
                const key = v.name.trim().toLowerCase()
                if (seen.has(key)) return false
                seen.add(key)
                return true
            })
            .sort((a, b) => a.name.trim().localeCompare(b.name.trim(), 'th'))
            .map(v => ({ value: v.name.trim(), label: v.name.trim(), description: v.category }))

        return [
            { value: "NEW", label: `➕ ${t.expenses.dialog.add_new_vendor} `, description: "เพิ่มร้านค้า/ผู้รับเหมาใหม่" },
            ...filteredVendors
        ]
    }, [items, workers, vendors, t.expenses.dialog.add_new_person, t.expenses.dialog.add_new_vendor])

    const projectOptions = React.useMemo(() => {
        const seen = new Set<string>()
        const validProjects = projects
            .filter(p => {
                if (!p.name || !p.name.trim()) return false
                if (seen.has(p.id)) return false
                seen.add(p.id)
                return true
            })
            .sort((a, b) => a.name.trim().localeCompare(b.name.trim(), 'th'))
            .map(p => ({ value: p.id, label: p.name.trim(), description: p.customer }))

        return [
            { value: "NEW", label: "+ Add New Project...", description: "สร้างโปรเจคใหม่" },
            ...validProjects
        ]
    }, [projects])

    const subProjectOptions = React.useMemo(() => {
        const currentProj = projects.find(p => p.id === globalProjectId)
        const subList = currentProj?.subProjects || []
        const validSub = subList
            .filter(sp => sp && sp.name && sp.name.trim())
            .sort((a, b) => a.name.trim().localeCompare(b.name.trim(), 'th'))
            .map(sp => ({ value: sp.id, label: sp.name.trim() }))

        return [
            { value: "NEW", label: t.expenses.dialog.add_new_sub_project, description: "สร้างงานย่อยใหม่" },
            ...validSub
        ]
    }, [projects, globalProjectId, t.expenses.dialog.add_new_sub_project])

    // Quick Add Handler
    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickAdd || !newItemName) return

        if (quickAdd.type === 'project') {
            addProject({
                name: newItemName,
                customer: newItemSecondary || "General Customer",
                location: "Bangkok",
                status: "Planning",
                budget: "0",
                progress: 0,
                income: "0",
                expenses: "0",
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
                description: "Quickly added project",
                tasks: []
            })
        } else if (quickAdd.type === 'task' && quickAdd.parentId) {
            addTask(quickAdd.parentId, {
                title: newItemName,
                status: "Todo",
                priority: "Medium",
                assignedTo: ["Unassigned"],
                dueDate: new Date().toISOString()
            })
        } else if (quickAdd.type === 'sub-project' && quickAdd.parentId) {
            addSubProject(quickAdd.parentId, {
                name: newItemName,
                status: "Planning",
                description: "Quickly added sub-project"
            })
        } else if (quickAdd.type === 'user') {
            addUser({ name: newItemName, role: newItemSecondary || "Staff" })
        } else if (quickAdd.type === 'worker') {
            addWorker({ name: newItemName, role: (newItemSecondary as any) || "Technician" })
        } else if (quickAdd.type === 'vendor') {
            addVendor({ name: newItemName, category: newItemSecondary || "Material" })
        }


        // Reset and Close
        setQuickAdd(null)
        setNewItemName("")
        setNewItemSecondary("")
    }

    // Helper to handle select changes with "NEW" detection
    const handleSelectChange = (
        value: string,
        setter: (val: string) => void,
        type: 'project' | 'task' | 'user' | 'vendor' | 'worker' | 'sub-project',
        parentId?: string
    ) => {
        if (value === 'NEW') {
            setQuickAdd({ type, parentId })
            setNewItemName("")
            setNewItemSecondary("")
        } else {
            setter(value)
        }
    }

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const vatAmount = vatIncluded ? (subtotal * 7) / 107 : 0

    const handleScanComplete = (data: { merchant: string, date: string, items: ExpenseItem[], total: number, receiptImage?: string }) => {
        setPayee(data.merchant)
        setDate(data.date)
        setItems(data.items.map(i => ({ ...i, projectId: globalProjectId || defaultProjectId })))
        setTitle(`Bill from ${data.merchant} `)
        // Set receipt image from scan
        if (data.receiptImage) {
            setReceiptImage(data.receiptImage)
            setReceiptExpanded(true) // Show the image
        }
        // Expand step 2 & 3 so user can review scanned items & slip
        setOpenSections({ 1: false, 2: true, 3: true })
    }

    const addItem = () => {
        setItems([...items, {
            id: Math.random().toString(),
            description: "",
            amount: 0,
            quantity: 1,
            unitPrice: 0,
            category: "Material",
            projectId: billType === 'combine' ? globalProjectId : undefined,
            taskId: billType === 'combine' ? globalTaskId : undefined,
            subProjectId: billType === 'combine' ? globalSubProjectId : undefined
        }])
    }

    const updateItem = (id: string, updates: Partial<ExpenseItem>) => {
        setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
    }

    const deleteItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            let fileToProcess = file

            // Compress immediately if > 1MB
            if (file.size > 1024 * 1024) {
                toast.loading("Compressing image...", { id: "compression" })
                try {
                    const { default: imageCompression } = await import('browser-image-compression')
                    const options = {
                        maxSizeMB: 0.6,
                        maxWidthOrHeight: 1280,
                        useWebWorker: true,
                        initialQuality: 0.7
                    }
                    const compressedFile = await imageCompression(file, options)
                    fileToProcess = new File([compressedFile], file.name, { type: file.type })
                    toast.success("Image compressed", { id: "compression" })
                } catch (err) {
                    console.warn("Immediate compression failed:", err)
                    toast.error("Compression failed", { id: "compression" })
                }
            }

            setReceiptFile(fileToProcess)
            const reader = new FileReader()
            reader.onloadend = () => {
                setReceiptImage(reader.result as string)
            }
            reader.readAsDataURL(fileToProcess)
        }
    }

    const removeImage = () => {
        setReceiptImage(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        const newErrors: { [key: string]: boolean } = {}
        let firstErrorField = null

        if (!title.trim()) {
            newErrors.title = true
            setOpenSections(prev => ({ ...prev, 1: true }))
            if (!firstErrorField) firstErrorField = titleRef
        }
        if (!date) {
            newErrors.date = true
            setOpenSections(prev => ({ ...prev, 1: true }))
            if (!firstErrorField) firstErrorField = dateRef
        }
        if (!payee && !newItemName) { // Check if payee selected OR quick adding
            newErrors.payee = true
            setOpenSections(prev => ({ ...prev, 1: true }))
        }

        // Check Items (At least one item with amount > 0)
        const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        if (subtotal <= 0) {
            newErrors.amount = true
            setOpenSections(prev => ({ ...prev, 2: true }))
            // Try to focus the first amount field
            if (!firstErrorField) firstErrorField = { current: document.getElementById(`amount-${items[0].id}`) }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน / Please fill in all required fields")

            if (firstErrorField && firstErrorField.current) {
                firstErrorField.current.focus()
                firstErrorField.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            return
        }

        onClose()
        const toastId = toast.loading("กำลังบันทึกค่าใช้จ่าย... / Saving expense...")

        const runSave = async () => {
            try {
                let finalReceiptUrl = receiptImage
                let finalThumbnailUrl = undefined
                let fileToUpload = receiptFile

                // handle smart scan base64 image
                if (!fileToUpload && receiptImage && receiptImage.startsWith('data:image')) {
                    try {
                        const res = await fetch(receiptImage)
                        const blob = await res.blob()
                        fileToUpload = new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" })
                    } catch (err) {
                        console.error("Failed to convert base64 to file", err)
                    }
                }

                if (fileToUpload) {
                    if (!currentOrg?.id) {
                        throw new Error("Organization not found.")
                    }
                    const path = `organizations/${currentOrg.id}/expenses/${new Date().getFullYear()}`
                    const { originalUrl, thumbnailUrl } = await uploadWithThumbnail(fileToUpload, path)
                    finalReceiptUrl = originalUrl
                    finalThumbnailUrl = thumbnailUrl
                }

                // SECURITY CHECK: Ensure we don't send huge Base64 strings to Firestore
                if (finalReceiptUrl && finalReceiptUrl.startsWith('data:image')) {
                    if (finalReceiptUrl.length > 500000) { // > 500KB
                        finalReceiptUrl = null
                    }
                }

                if (billType === 'combine') {
                    // COMBINE MODE
                    const finalItems = items.map(item => {
                        const cleanItem: any = {
                            ...item,
                            projectId: globalProjectId || undefined,
                            taskId: globalTaskId || undefined,
                        }
                        if (globalSubProjectId) cleanItem.subProjectId = globalSubProjectId
                        Object.keys(cleanItem).forEach(key => {
                            if (cleanItem[key] === undefined || cleanItem[key] === '') {
                                delete cleanItem[key]
                            }
                        })
                        return cleanItem
                    })

                    const safeDate = date || new Date().toISOString().split('T')[0]
                    const expenseData: Parameters<typeof addExpense>[0] = {
                        title: title || payee || "New Expense",
                        amount: `฿${subtotal.toLocaleString()}`,
                        totalValue: subtotal,
                        date: safeDate,
                        category: items[0]?.category || "Other",
                        items: finalItems,
                        payee: payee || "",
                        status,
                        vatIncluded,
                        projectId: globalProjectId || "",
                        ...(currentOrg?.id ? { orgId: currentOrg.id } : {})
                    }

                    if (globalSubProjectId) expenseData.subProjectId = globalSubProjectId
                    if (status === 'Advanced' && paidBy) expenseData.paidBy = paidBy
                    if (status === 'Credit' && vendor) expenseData.vendor = vendor
                    if (finalReceiptUrl) expenseData.receiptImage = finalReceiptUrl
                    if (finalThumbnailUrl) expenseData.thumbnailUrl = finalThumbnailUrl

                    await addExpense(expenseData)
                } else {
                    // SPLIT MODE
                    const itemsByProjectSubProject: Record<string, typeof items> = {}
                    items.forEach(item => {
                        const pid = item.projectId || "unassigned"
                        const spid = item.subProjectId || "none"
                        const key = `${pid}__${spid}`
                        if (!itemsByProjectSubProject[key]) itemsByProjectSubProject[key] = []
                        itemsByProjectSubProject[key].push(item)
                    })

                    const safeDate = date || new Date().toISOString().split('T')[0]
                    await Promise.all(Object.entries(itemsByProjectSubProject).map(async ([key, groupItems]) => {
                        const [projectId, subProjectId] = key.split("__")
                        const groupTotal = groupItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

                        const project = projects.find(p => p.id === projectId)
                        const subProject = project?.subProjects?.find(sp => sp.id === subProjectId)
                        let groupTitle = `${title || payee || "Split Bill"} (${project?.name || "Unassigned"}`
                        if (subProject?.name) groupTitle += ` - ${subProject?.name}`
                        groupTitle += ")"

                        const expenseData: Parameters<typeof addExpense>[0] = {
                            title: groupTitle,
                            amount: `฿${groupTotal.toLocaleString()}`,
                            totalValue: groupTotal,
                            date: safeDate,
                            category: groupItems[0]?.category || "Other",
                            items: groupItems,
                            payee: payee || "",
                            status,
                            vatIncluded,
                            projectId: projectId === "unassigned" ? "" : projectId,
                            ...(currentOrg?.id ? { orgId: currentOrg.id } : {})
                        }
                        if (subProjectId && subProjectId !== "none") expenseData.subProjectId = subProjectId
                        if (status === 'Advanced' && paidBy) expenseData.paidBy = paidBy
                        if (status === 'Credit' && vendor) expenseData.vendor = vendor
                        if (finalReceiptUrl) expenseData.receiptImage = finalReceiptUrl
                        if (finalThumbnailUrl) expenseData.thumbnailUrl = finalThumbnailUrl

                        await addExpense(expenseData)
                    }))
                }

                // Send Telegram Notification
                if (currentOrg?.id) {
                    const project = projects.find(p => p.id === (billType === 'combine' ? globalProjectId : items[0]?.projectId))
                    let subProjectName = undefined
                    const subProjectId = billType === 'combine' ? globalSubProjectId : items[0]?.subProjectId
                    if (subProjectId && project) {
                        subProjectName = project.subProjects?.find(sp => sp.id === subProjectId)?.name
                    }

                    sendExpenseNotification({
                        orgId: currentOrg.id,
                        expense: {
                            projectName: project?.name || 'ไม่ระบุโครงการ',
                            subProjectName: subProjectName,
                            itemName: title || payee || 'ไม่ระบุรายการ',
                            amount: subtotal,
                            userName: currentUser?.name || 'Unknown',
                            date: date,
                            status: status
                        }
                    }).catch((e: any) => console.warn('Telegram notification failed:', e))
                }

                toast.success("บันทึกสำเร็จ! / Expense Saved!", { id: toastId })
            } catch (error: any) {
                console.error("Background expense save failed:", error)
                toast.error(`บันทึกไม่สำเร็จ: ${error?.message || "Unknown error"}`, { id: toastId })
            }
        }

        runSave()
    }

    // Helper to get tasks for a project
    const getProjectTasks = (pid?: string) => {
        if (!pid) return []
        return tasks.filter(t => t.projectId === pid)
    }

    const renderReceiptContent = () => {
        if (receiptImage) {
            return (
                <div className="space-y-2 pt-1">
                    <div className="relative rounded-xl overflow-hidden border border-border group aspect-video sm:aspect-[4/3] lg:aspect-auto lg:h-64 bg-muted/40 w-full">
                        <Image
                            src={receiptImage}
                            alt="Receipt Preview"
                            fill
                            sizes="(max-width: 768px) 100vw, 600px"
                            className="object-contain"
                            unoptimized={receiptImage.startsWith('data:') || receiptImage.startsWith('blob:')}
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                removeImage()
                                setReceiptFile(null)
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-red-500 text-white rounded-full transition-colors shadow-lg cursor-pointer"
                            title="ลบรูป"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="text-emerald-500 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> แนบรูปภาพแล้ว
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                removeImage()
                                setReceiptFile(null)
                            }}
                            className="text-red-500 hover:underline cursor-pointer"
                        >
                            เปลี่ยนรูปใหม่
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-3 pt-1">
                <label className="flex flex-col items-center justify-center w-full h-36 lg:h-44 border-2 border-dashed border-border rounded-xl hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                        <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-2">
                            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground group-hover:text-foreground font-medium">
                            {t.expenses.dialog.upload_hint || "แตะเพื่อเลือกรูปใบเสร็จ หรือถ่ายรูปสลิป"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">รองรับ JPG, PNG (ไม่บังคับ)</p>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                </label>
            </div>
        )
    }

    if (!isOpen || !mounted || typeof document === "undefined") return null

    const dialogContent = (
        <>
            {/* Quick Add Dialog Overlay */}
            {quickAdd && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center font-sans p-4">
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={() => setQuickAdd(null)} />
                    <div className="relative bg-background text-foreground w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-border flex flex-col animate-in fade-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4">Add New {quickAdd.type === 'user' ? 'Person' : quickAdd.type.charAt(0).toUpperCase() + quickAdd.type.slice(1)}</h3>
                        <form onSubmit={handleQuickAdd} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Name / Title</label>
                                <input
                                    autoFocus
                                    required
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                    placeholder={`Enter ${quickAdd.type} name...`}
                                />
                            </div>

                            {quickAdd.type === 'project' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Customer</label>
                                    <input
                                        value={newItemSecondary}
                                        onChange={(e) => setNewItemSecondary(e.target.value)}
                                        className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                        placeholder="Customer Name (Optional)"
                                    />
                                </div>
                            )}

                            {quickAdd.type === 'user' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Role</label>
                                    <select
                                        value={newItemSecondary}
                                        onChange={(e) => setNewItemSecondary(e.target.value)}
                                        className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                    >
                                        <option value="">Select Role...</option>
                                        <option value="Staff">Staff</option>
                                        <option value="Foreman">Foreman</option>
                                        <option value="Accountant">Accountant</option>
                                        <option value="Contractor">Contractor (ช่างเหมา)</option>
                                        <option value="Technician">Technician (ช่าง)</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            )}

                            {quickAdd.type === 'vendor' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                                    <select
                                        value={newItemSecondary}
                                        onChange={(e) => setNewItemSecondary(e.target.value)}
                                        className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                    >
                                        <option value="Material">Material Store</option>
                                        <option value="Sub-contract">Sub-contractor</option>
                                        <option value="Service">Service Provider</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setQuickAdd(null)}
                                    className="flex-1 py-3 rounded-xl font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors cursor-pointer shadow-sm"
                                >
                                    Add Valid
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center font-sans overflow-hidden p-0 sm:p-4">
                <SmartScanDialog
                    isOpen={isScanOpen}
                    onClose={() => setIsScanOpen(false)}
                    onScanComplete={handleScanComplete}
                />

                <SafeBackdrop onClose={onClose} className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-opacity" />

                <div className="relative w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl h-full sm:h-[90vh] max-h-[100dvh] sm:max-h-[90vh] p-0 rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden bg-background text-foreground">

                    {/* Dialog Header with Safe Area for Mobile */}
                    <div className="flex items-center justify-between px-4 py-3 sm:p-5 border-b border-border shrink-0 bg-background pt-[max(0.875rem,env(safe-area-inset-top))]">
                        <div className="min-w-0 pr-2">
                            <h2 className="text-lg sm:text-2xl font-bold tracking-tight truncate text-foreground">{t.expenses.dialog.title}</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{t.expenses.dialog.subtitle}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-muted/80 hover:bg-muted active:scale-95 text-foreground flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-border"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 3-Step Navigation Pills with Mobile Close Button */}
                    <div className="px-3 sm:px-5 pt-2.5 pb-0.5 shrink-0 lg:hidden flex items-center gap-2">
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border text-xs flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => toggleSection(1)}
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
                                    {title && payee ? <Check className="w-2.5 h-2.5" /> : "1"}
                                </span>
                                <span className="truncate">1. หัวบิล</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => toggleSection(2)}
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
                                onClick={() => toggleSection(3)}
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
                                    {receiptImage ? <Check className="w-2.5 h-2.5" /> : "3"}
                                </span>
                                <span className="truncate">3. รูปสลิป</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden min-w-0 w-full">
                        {/* Main Body: Single column on mobile, 2-column grid on Desktop (lg:) */}
                        <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 min-w-0 w-full">

                            {/* ======================================================== */}
                            {/* LEFT PANE (Mobile: full width, Desktop: 7 cols)           */}
                            {/* Contains Step 1 (Header) & Step 2 (Line Items)           */}
                            {/* ======================================================== */}
                            <div ref={scrollRef} className="lg:col-span-7 xl:col-span-7 flex flex-col h-full overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 space-y-3.5 min-w-0 w-full lg:border-r lg:border-border custom-scrollbar overscroll-contain min-h-0">

                                {/* Mobile Smart Scan Quick Access Banner */}
                                <div className="lg:hidden shrink-0 bg-purple-500/10 border border-purple-500/20 p-3 sm:p-3.5 rounded-xl flex items-center justify-between gap-3 min-w-0 w-full">
                                    <div className="flex items-center gap-2.5 text-purple-400 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                                            <ScanLine className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-bold truncate leading-tight">{t.expenses.smart_scan}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">สแกนใบเสร็จกรอกข้อมูลให้อัตโนมัติ</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsScanOpen(true)}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 shrink-0 whitespace-nowrap"
                                    >
                                        เริ่มสแกนบิล
                                    </button>
                                </div>

                                {/* STEP 1: หัวบิล (Bill Header, Date, Store, Project, Status) */}
                                <div className="shrink-0 bg-card border border-border shadow-xs rounded-2xl overflow-hidden transition-all min-w-0 w-full">
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(1)}
                                        className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2.5 text-left hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                                                title && payee ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary/20 text-primary border border-primary/30"
                                            )}>
                                                {title && payee ? <Check className="w-3.5 h-3.5" /> : "1"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-foreground">1. หัวบิล & โครงการ</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted border border-border/60">Header</span>
                                                </div>
                                                {!openSections[1] && (
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[200px] sm:max-w-md">
                                                        {title || payee ? `${title || "บิลไม่มีชื่อ"} • ${payee || "ไม่ระบุผู้รับ"} • ${date}` : "คลิกเพื่อแก้ไขข้อมูลหัวบิล, ร้านค้า, โครงการ"}
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
                                            {/* Bill Title & Date */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full">
                                                <div className="space-y-1 min-w-0">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                        {t.expenses.dialog.bill_title} <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        ref={titleRef}
                                                        required
                                                        value={title}
                                                        onChange={(e) => {
                                                            setTitle(e.target.value)
                                                            if (errors.title) setErrors({ ...errors, title: false })
                                                        }}
                                                        placeholder={t.expenses.dialog.bill_placeholder}
                                                        className={cn(
                                                            "w-full min-w-0 bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors text-foreground",
                                                            errors.title ? "border-red-500/50 focus:ring-red-500/20" : "border-input hover:border-foreground/20"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                        {t.expenses.dialog.date} <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        ref={dateRef}
                                                        value={date}
                                                        onChange={(e) => {
                                                            setDate(e.target.value)
                                                            if (errors.date) setErrors({ ...errors, date: false })
                                                        }}
                                                        className={cn(
                                                            "w-full min-w-0 bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors text-foreground",
                                                            errors.date ? "border-red-500/50 focus:ring-red-500/20" : "border-input hover:border-foreground/20"
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            {/* Category & Payee */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full">
                                                <div className="space-y-1 min-w-0">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                        {t.expenses.dialog.category}
                                                    </label>
                                                    <select
                                                        value={items[0]?.category || "Material"}
                                                        onChange={(e) => {
                                                            const newCat = e.target.value as ExpenseCategory
                                                            setItems(items.map(i => ({ ...i, category: newCat })))
                                                            setPayee("")
                                                        }}
                                                        className="w-full min-w-0 bg-background border border-input hover:border-foreground/20 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 truncate text-foreground shadow-xs"
                                                    >
                                                        <option value="Material">Material (ค่าวัสดุ)</option>
                                                        <option value="Labor">Labor (ค่าแรง)</option>
                                                        <option value="Sub-contract">Sub-contract (ค่าเหมา)</option>
                                                        <option value="Other">Other (อื่นๆ)</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1 min-w-0">
                                                    <label className={cn("text-xs font-bold uppercase tracking-wider block truncate", errors.payee ? "text-red-400" : "text-muted-foreground")}>
                                                        {(items[0]?.category === 'Labor') ? t.expenses.dialog.payee_labor : t.expenses.dialog.payee} <span className="text-red-400">*</span>
                                                    </label>
                                                    <div className="relative min-w-0 w-full">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                                                        <div className="pl-9 min-w-0 w-full">
                                                            <SearchableCombobox
                                                                options={payeeOptions}
                                                                value={payee}
                                                                onChange={(val) => {
                                                                    const currentCat = items[0]?.category || "Material"
                                                                    if (val === 'NEW') {
                                                                        if (currentCat === 'Labor') {
                                                                            handleSelectChange('NEW', setPayee, 'worker')
                                                                        } else {
                                                                            handleSelectChange('NEW', setPayee, 'vendor')
                                                                            setNewItemSecondary(currentCat)
                                                                        }
                                                                    } else {
                                                                        setPayee(val)
                                                                        if (errors.payee) setErrors({ ...errors, payee: false })
                                                                    }
                                                                }}
                                                                placeholder={items[0]?.category === 'Labor' ? t.expenses.dialog.select_person : t.expenses.dialog.select_vendor}
                                                                searchPlaceholder="ค้นหา..."
                                                                className="border-none p-0 w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Project Assignment Mode (Combine vs Split) */}
                                            <div className="space-y-2.5 p-3 rounded-xl bg-muted/40 border border-border/80 min-w-0 w-full">
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold">
                                                        <input
                                                            type="radio"
                                                            name="billType"
                                                            checked={billType === 'combine'}
                                                            onChange={() => setBillType('combine')}
                                                            className="text-primary focus:ring-primary"
                                                        />
                                                        <span>{t.expenses.dialog.combine_bill}</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold">
                                                        <input
                                                            type="radio"
                                                            name="billType"
                                                            checked={billType === 'split'}
                                                            onChange={() => setBillType('split')}
                                                            className="text-primary focus:ring-primary"
                                                        />
                                                        <span>{t.expenses.dialog.split_bill}</span>
                                                    </label>
                                                </div>

                                                {billType === 'combine' && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 min-w-0 w-full animate-in fade-in duration-150">
                                                        <div className="space-y-1 min-w-0">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                                {t.expenses.dialog.project}
                                                            </label>
                                                            <SearchableCombobox
                                                                options={projectOptions}
                                                                value={globalProjectId}
                                                                onChange={(val) => handleSelectChange(val, setGlobalProjectId, 'project')}
                                                                placeholder="Select Project..."
                                                                searchPlaceholder="ค้นหาโปรเจค..."
                                                            />
                                                        </div>
                                                        <div className="space-y-1 min-w-0">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                                {t.expenses.dialog.task} / Sub-project
                                                            </label>
                                                            <SearchableCombobox
                                                                options={subProjectOptions}
                                                                value={globalSubProjectId}
                                                                onChange={(val) => handleSelectChange(val, setGlobalSubProjectId, 'sub-project', globalProjectId)}
                                                                disabled={!globalProjectId}
                                                                placeholder="General Project Expense"
                                                                searchPlaceholder="ค้นหางานย่อย..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Payment Status & Advanced Fields */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full pt-1">
                                                <div className="space-y-1 min-w-0">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                        {t.expenses.dialog.payment_status}
                                                    </label>
                                                    <div className="relative min-w-0">
                                                        <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                        <select
                                                            value={status}
                                                            onChange={(e) => setStatus(e.target.value as any)}
                                                            className="w-full min-w-0 bg-background border border-input hover:border-foreground/20 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 truncate text-foreground shadow-xs"
                                                        >
                                                            <option value="Paid">Paid (ชำระแล้ว)</option>
                                                            <option value="Pending">Pending (รอชำระ)</option>
                                                            <option value="Advanced">Advanced (สำรองจ่าย)</option>
                                                            <option value="Credit">Credit (ติดไว้ก่อน)</option>
                                                            <option value="Unpaid">Cancel (ยกเลิก)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {status === 'Advanced' && (
                                                    <div className="space-y-1 min-w-0 animate-in fade-in duration-150">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                            {t.expenses.dialog.paid_by}
                                                        </label>
                                                        <div className="relative min-w-0">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                            <select
                                                                value={paidBy}
                                                                onChange={(e) => handleSelectChange(e.target.value, setPaidBy, 'user')}
                                                                className="w-full min-w-0 bg-background border border-input hover:border-foreground/20 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 truncate text-foreground shadow-xs"
                                                            >
                                                                <option value="">Select User...</option>
                                                                {currentUser && (
                                                                    <option value={currentUser.name} className="font-bold text-primary">Assign to Me ({currentUser.name})</option>
                                                                )}
                                                                {users.map(u => (
                                                                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                                                                ))}
                                                                <option value="NEW" className="font-bold text-primary">+ Add New User...</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {status === 'Credit' && (
                                                    <div className="space-y-1 min-w-0 animate-in fade-in duration-150">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block truncate">
                                                            {t.expenses.dialog.vendor}
                                                        </label>
                                                        <div className="relative min-w-0">
                                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                            <select
                                                                value={vendor}
                                                                onChange={(e) => handleSelectChange(e.target.value, setVendor, 'vendor')}
                                                                className="w-full min-w-0 bg-background border border-input hover:border-foreground/20 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 truncate text-foreground shadow-xs"
                                                            >
                                                                <option value="">Select Vendor...</option>
                                                                {vendors.map(v => (
                                                                    <option key={v.id} value={v.name}>{v.name} ({v.category})</option>
                                                                ))}
                                                                <option value="NEW" className="font-bold text-primary">+ Add New Vendor...</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Step 1 Next Button (Mobile only) */}
                                            <div className="flex justify-end pt-2 lg:hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenSections(prev => ({ ...prev, 1: false, 2: true }))}
                                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                                >
                                                    ถัดไป: ใส่รายการบิล (Step 2)
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* STEP 2: รายการบิล & ยอดเงิน (Line Items, VAT, Totals) */}
                                <div className="shrink-0 bg-card border border-border shadow-xs rounded-2xl overflow-hidden transition-all min-w-0 w-full">
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
                                                    <span className="text-sm font-bold text-foreground">2. รายการบิล & ยอดเงิน</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted border border-border/60">
                                                        {items.length} รายการ
                                                    </span>
                                                </div>
                                                {!openSections[2] && (
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[200px] sm:max-w-md">
                                                        {items.length} รายการ • รวม ฿{subtotal.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs font-bold text-primary font-mono hidden sm:inline">฿{subtotal.toLocaleString()}</span>
                                            {openSections[2] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                        </div>
                                    </button>

                                    {openSections[2] && (
                                        <div className="p-3.5 sm:p-4 pt-0 space-y-3.5 border-t border-border/60 min-w-0 w-full animate-in fade-in duration-200">
                                            {/* VAT Toggle & Header Info */}
                                            <div className="flex items-center justify-between min-w-0 w-full pt-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5" /> รายการสินค้า / ค่าบริการ
                                                </span>
                                                <label className="flex items-center gap-2 cursor-pointer group shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={vatIncluded}
                                                        onChange={(e) => setVatIncluded(e.target.checked)}
                                                        className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-primary/50 transition-all"
                                                    />
                                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {t.expenses.dialog.vat_included}
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Desktop Column Header */}
                                            <div className="hidden md:flex items-center gap-2 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                <span className="w-6 text-center">#</span>
                                                <span className="flex-1">รายละเอียดสินค้า / บริการ</span>
                                                <span className="w-20 text-center">จำนวน</span>
                                                <span className="w-28 text-right">ราคา/หน่วย</span>
                                                <span className="w-32 text-right">ยอดรวม</span>
                                                {items.length > 1 && <span className="w-8"></span>}
                                            </div>

                                            {/* Items List - Fully responsive for both Desktop & Mobile */}
                                            <div className="space-y-2.5 min-w-0 w-full">
                                                {items.map((item, index) => (
                                                    <div
                                                        key={item.id}
                                                        className="bg-muted/30 border border-border/80 rounded-xl p-3 space-y-2.5 min-w-0 w-full animate-in fade-in duration-150"
                                                    >
                                                        {/* Responsive Item Layout: Single row on desktop, 2-row on mobile */}
                                                        <div className="flex flex-col md:flex-row md:items-center gap-2.5 min-w-0 w-full">
                                                            {/* Item Description with Index */}
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className="w-6 h-6 rounded-md bg-muted border border-border/80 flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                                                                    {index + 1}
                                                                </span>
                                                                <input
                                                                    placeholder={t.expenses.dialog.item_desc || "รายละเอียดรายการ..."}
                                                                    value={item.description}
                                                                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                                                    className="flex-1 min-w-0 bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                                                />
                                                            </div>

                                                            {/* Numbers: Quantity, Unit Price, Amount */}
                                                            <div className="grid grid-cols-3 md:flex md:items-center gap-2 min-w-0 shrink-0">
                                                                <div className="min-w-0 md:w-20">
                                                                    <label className="text-[10px] font-semibold text-muted-foreground block truncate mb-1 md:hidden">
                                                                        {t.expenses.dialog.quantity || "จำนวน"}
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        inputMode="decimal"
                                                                        placeholder="1"
                                                                        value={item.quantity || ""}
                                                                        onChange={(e) => {
                                                                            const qty = parseFloat(e.target.value) || 0
                                                                            const price = item.unitPrice || 0
                                                                            updateItem(item.id, {
                                                                                quantity: qty,
                                                                                amount: qty * price
                                                                            })
                                                                        }}
                                                                        className="w-full min-w-0 bg-background border border-input rounded-lg px-2.5 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                                                    />
                                                                </div>

                                                                <div className="min-w-0 md:w-28">
                                                                    <label className="text-[10px] font-semibold text-muted-foreground block truncate mb-1 md:hidden">
                                                                        {t.expenses.dialog.unit_price || "ราคา/หน่วย"}
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        inputMode="decimal"
                                                                        placeholder="0.00"
                                                                        value={item.unitPrice || ""}
                                                                        onChange={(e) => {
                                                                            const price = parseFloat(e.target.value) || 0
                                                                            const qty = item.quantity || 0
                                                                            updateItem(item.id, {
                                                                                unitPrice: price,
                                                                                amount: qty * price
                                                                            })
                                                                        }}
                                                                        className="w-full min-w-0 bg-background border border-input rounded-lg px-2.5 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                                                    />
                                                                </div>

                                                                <div className="min-w-0 md:w-32">
                                                                    <label className="text-[10px] font-bold text-primary block truncate mb-1 md:hidden">
                                                                        ยอดรวม (฿)
                                                                    </label>
                                                                    <div className="relative min-w-0">
                                                                        <input
                                                                            id={`amount-${item.id}`}
                                                                            type="number"
                                                                            inputMode="decimal"
                                                                            placeholder="0.00"
                                                                            value={item.amount || ""}
                                                                            onChange={(e) => {
                                                                                updateItem(item.id, { amount: parseFloat(e.target.value) || 0 })
                                                                                if (errors.amount) setErrors({ ...errors, amount: false })
                                                                            }}
                                                                            className={cn(
                                                                                "w-full min-w-0 bg-background border rounded-lg pl-5 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-right font-bold text-primary transition-colors",
                                                                                errors.amount ? "border-red-500/50 focus:ring-red-500/20" : "border-input"
                                                                            )}
                                                                        />
                                                                        <span className="absolute left-1.5 top-2 text-xs text-muted-foreground pointer-events-none">฿</span>
                                                                    </div>
                                                                </div>

                                                                {items.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteItem(item.id)}
                                                                        className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 self-center hidden md:block"
                                                                        title="ลบรายการ"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {items.length > 1 && (
                                                                <div className="flex justify-end md:hidden">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteItem(item.id)}
                                                                        className="p-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" /> ลบรายการ
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Split bill selectors if split mode */}
                                                        {billType === 'split' && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/60 min-w-0 w-full">
                                                                <select
                                                                    value={item.projectId || ""}
                                                                    onChange={(e) => handleSelectChange(
                                                                        e.target.value,
                                                                        (val) => updateItem(item.id, { projectId: val, taskId: "" }),
                                                                        'project'
                                                                    )}
                                                                    className="w-full min-w-0 bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 truncate text-foreground"
                                                                >
                                                                    <option value="">Select Project...</option>
                                                                    {projects.map(p => (
                                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                                    ))}
                                                                    <option value="NEW" className="font-bold text-primary">+ Add New Project...</option>
                                                                </select>

                                                                <select
                                                                    value={item.subProjectId || ""}
                                                                    onChange={(e) => handleSelectChange(
                                                                        e.target.value,
                                                                        (val) => updateItem(item.id, { subProjectId: val }),
                                                                        'sub-project',
                                                                        item.projectId
                                                                    )}
                                                                    className="w-full min-w-0 bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 truncate text-foreground"
                                                                >
                                                                    <option value="">- Sub-project (Optional) -</option>
                                                                    {projects.find(p => p.id === item.projectId)?.subProjects?.map(sp => (
                                                                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                                                                    ))}
                                                                    <option value="NEW" className="font-bold text-primary">+ Add New...</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Add Item Button */}
                                                <button
                                                    type="button"
                                                    onClick={addItem}
                                                    className="w-full py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-dashed border-border rounded-xl transition-all"
                                                >
                                                    <Plus className="w-4 h-4 text-primary" /> {t.expenses.dialog.add_line_item}
                                                </button>
                                            </div>

                                            {/* Totals Summary (Mobile view) */}
                                            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0 w-full lg:hidden">
                                                {vatIncluded ? (
                                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                                        <div>{t.expenses.dialog.subtotal}: <span className="font-mono text-foreground font-semibold">฿{(subtotal - vatAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                                                        <div>{t.expenses.dialog.vat} (7%): <span className="font-mono text-foreground font-semibold">฿{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-muted-foreground">ยอดก่อนภาษี / ไม่รวม VAT</div>
                                                )}
                                                <div className="text-right sm:text-right">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mr-2">{t.expenses.dialog.grand_total}:</span>
                                                    <span className="text-lg font-black text-primary font-mono">฿{subtotal.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Step 2 Navigation Buttons (Mobile only) */}
                                            <div className="flex justify-between items-center pt-2 lg:hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenSections(prev => ({ ...prev, 1: true, 2: false }))}
                                                    className="px-3.5 py-2 bg-muted/60 hover:bg-muted text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all text-muted-foreground hover:text-foreground active:scale-95 border border-border"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                    ย้อนกลับหัวบิล
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenSections(prev => ({ ...prev, 2: false, 3: true }))}
                                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                                >
                                                    ถัดไป: แนบรูปสลิป (Step 3)
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* STEP 3: รูปสลิป / บิล (On Mobile only, embedded in left column) */}
                                <div className="lg:hidden shrink-0 bg-card border border-border shadow-xs rounded-2xl overflow-hidden transition-all min-w-0 w-full">
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(3)}
                                        className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2.5 text-left hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                                                receiptImage ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary/20 text-primary border border-primary/30"
                                            )}>
                                                {receiptImage ? <Check className="w-3.5 h-3.5" /> : "3"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-foreground">3. แนบรูปสลิป / บิล</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted border border-border/60">Receipt</span>
                                                </div>
                                                {!openSections[3] && (
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[200px] sm:max-w-md">
                                                        {receiptImage ? "✓ มีรูปสลิปแล้ว" : "ยังไม่ได้แนบรูปสลิป (ไม่บังคับ)"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {receiptImage && <span className="text-[11px] text-emerald-400 font-medium">แนบแล้ว</span>}
                                            {openSections[3] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                        </div>
                                    </button>

                                    {openSections[3] && (
                                        <div className="p-3.5 sm:p-4 pt-0 space-y-3.5 border-t border-border/60 min-w-0 w-full animate-in fade-in duration-200">
                                            {renderReceiptContent()}

                                            <div className="flex justify-between items-center pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenSections(prev => ({ ...prev, 2: true, 3: false }))}
                                                    className="px-3.5 py-2 bg-muted/60 hover:bg-muted text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all text-muted-foreground hover:text-foreground active:scale-95 border border-border"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                    ย้อนกลับรายการบิล
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* ======================================================== */}
                            {/* RIGHT PANE (Desktop only, 5 cols)                        */}
                            {/* Contains Smart Scan AI, Receipt Preview & Bill Summary   */}
                            {/* ======================================================== */}
                            <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col h-full overflow-y-auto overflow-x-hidden p-5 space-y-4 bg-muted/15 min-w-0 custom-scrollbar overscroll-contain min-h-0">

                                {/* Smart Scan AI Desktop Banner */}
                                <div className="shrink-0 bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl flex items-center justify-between gap-3 min-w-0">
                                    <div className="flex items-center gap-3 text-purple-400 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                            <ScanLine className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold truncate leading-tight">{t.expenses.smart_scan}</p>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">สแกนใบเสร็จกรอกข้อมูลให้อัตโนมัติ</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsScanOpen(true)}
                                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0 whitespace-nowrap"
                                    >
                                        เริ่มสแกนบิล
                                    </button>
                                </div>

                                {/* Step 3: Receipt Upload & Preview on Desktop */}
                                <div className="shrink-0 bg-card border border-border shadow-xs rounded-2xl p-4 space-y-3 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                                receiptImage ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary/20 text-primary border border-primary/30"
                                            )}>
                                                {receiptImage ? <Check className="w-3.5 h-3.5" /> : "3"}
                                            </div>
                                            <span className="text-sm font-bold text-foreground truncate">รูปใบเสร็จ / สลิป (Receipt)</span>
                                        </div>
                                        {receiptImage && (
                                            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                                แนบแล้ว
                                            </span>
                                        )}
                                    </div>

                                    {renderReceiptContent()}
                                </div>

                                {/* Live Breakdown & Summary Card */}
                                <div className="shrink-0 bg-card border border-border shadow-xs rounded-2xl p-4 space-y-3 mt-auto min-w-0">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                        สรุปยอดค่าใช้จ่าย (Summary)
                                    </span>
                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>จำนวนรายการ</span>
                                            <span className="font-semibold text-foreground">{items.length} รายการ</span>
                                        </div>
                                        {vatIncluded && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>ยอดก่อนภาษี</span>
                                                    <span className="font-mono text-foreground">฿{(subtotal - vatAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>ภาษีมูลค่าเพิ่ม (7%)</span>
                                                    <span className="font-mono text-foreground">฿{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="h-px bg-border my-1" />
                                    <div className="flex justify-between items-baseline pt-1">
                                        <span className="text-sm font-bold text-foreground">ยอดรวมสุทธิ</span>
                                        <span className="text-2xl font-black text-primary font-mono">฿{subtotal.toLocaleString()}</span>
                                    </div>
                                </div>

                            </div>

                        </div>

                        {/* Full-width Sticky Footer with Live Grand Total & Save Button */}
                        <div className="p-3.5 sm:p-5 border-t border-border bg-background shrink-0 flex items-center justify-between gap-3 min-w-0 w-full pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-lg">
                            <div className="min-w-0 flex items-center gap-3">
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block leading-tight">ยอดรวมทั้งสิ้น</span>
                                    <span className="text-xl sm:text-2xl font-black text-primary font-mono truncate block">
                                        ฿{subtotal.toLocaleString()}
                                    </span>
                                </div>
                                <span className="hidden sm:inline-block text-xs text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-lg">
                                    {items.length} รายการ
                                </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-muted/40 hover:bg-muted active:scale-95 text-xs sm:text-sm font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="min-w-[140px] sm:min-w-[180px] bg-primary text-primary-foreground hover:opacity-90 rounded-xl py-3 px-5 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 active:scale-95"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            <span className="truncate">{uploadStatus || "Saving..."}</span>
                                        </>
                                    ) : (
                                        t.expenses.dialog.save
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )

    return createPortal(dialogContent, document.body)
}

