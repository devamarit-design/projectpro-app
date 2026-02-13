"use client"

import * as React from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
import { X, Receipt, ScanLine, Plus, Trash2, Layers, User, Building, Camera, Upload, CheckCircle2 } from "lucide-react"
import { useProjects, ExpenseCategory, ExpenseItem } from "@/context/project-context"
import { SmartScanDialog } from "@/components/expenses/smart-scan-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { uploadWithThumbnail } from "@/lib/upload"
import SearchableCombobox from "@/components/ui/searchable-combobox"
import { useOrganization } from "@/context/organization-context"
import { sendExpenseNotification } from "@/lib/functions-client"

interface AddExpenseDialogProps {
    isOpen: boolean
    onClose: () => void
    defaultProjectId?: string
    startScanning?: boolean
    defaultDate?: string
}

import { useTranslation } from "@/lib/i18n-context"

export default function AddExpenseDialog({ isOpen, onClose, defaultProjectId, startScanning, defaultDate }: AddExpenseDialogProps) {
    const { addExpense, addProject, addTask, addSubProject, addUser, addVendor, addWorker, projects, tasks, users, vendors, workers, currentUser } = useProjects()
    const { currentOrg } = useOrganization()
    const { t } = useTranslation()

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

    // Scroll tracking for receipt section auto-expand/collapse
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const lastScrollY = React.useRef(0)

    // Reset when opening
    React.useEffect(() => {
        if (isOpen) {
            setBillType("combine")
            setGlobalProjectId(defaultProjectId || "")
            setGlobalTaskId("")
            setGlobalSubProjectId("")

            setItems([{ id: "1", description: "", amount: 0, quantity: 1, unitPrice: 0, category: "Material", projectId: defaultProjectId }])
            setTitle("")
            // Use defaultDate if provided, otherwise today
            setDate(defaultDate || new Date().toISOString().split('T')[0])
            setPayee("")
            setStatus("Paid")
            setPaidBy("")
            setVendor("")
            setVatIncluded(true)
            setReceiptImage(null)
            setReceiptFile(null)
            setReceiptExpanded(false)
            setReceiptExpanded(false)
            setQuickAdd(null)
            setErrors({})
            setUploadStatus("")

            if (startScanning) {
                setIsScanOpen(true)
            }
        }
    }, [isOpen, defaultProjectId, startScanning, defaultDate])

    // Scroll listener for auto-expand/collapse receipt section
    React.useEffect(() => {
        const scrollElement = scrollRef.current
        if (!scrollElement) return

        const handleScroll = () => {
            const currentScrollY = scrollElement.scrollTop
            const isScrollingDown = currentScrollY > lastScrollY.current

            // Only change state if there's enough scroll delta
            if (Math.abs(currentScrollY - lastScrollY.current) > 30) {
                setReceiptExpanded(isScrollingDown)
                lastScrollY.current = currentScrollY
            }
        }

        scrollElement.addEventListener('scroll', handleScroll, { passive: true })
        return () => scrollElement.removeEventListener('scroll', handleScroll)
    }, [])

    if (!isOpen) return null

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
            if (!firstErrorField) firstErrorField = titleRef
        }
        if (!date) {
            newErrors.date = true
            if (!firstErrorField) firstErrorField = dateRef
        }
        if (!payee && !newItemName) { // Check if payee selected OR quick adding
            newErrors.payee = true
            // Focus logic for combobox might be tricky, usually we focus the container or just show red border
            // if (!firstErrorField) firstErrorField = payeeRef 
        }

        // Check Items (At least one item with amount > 0)
        const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        if (subtotal <= 0) {
            newErrors.amount = true
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

        setIsUploading(true)
        setUploadStatus("Processing...")

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
                setUploadStatus("Uploading image...")
                // Determine path based on organization or project
                // For now, simpler path structure
                const path = `expenses/${new Date().getFullYear()}`
                const { originalUrl, thumbnailUrl } = await uploadWithThumbnail(fileToUpload, path)
                finalReceiptUrl = originalUrl
                finalThumbnailUrl = thumbnailUrl
            }

            setUploadStatus("Saving data...")

            // SECURITY CHECK: Ensure we don't send huge Base64 strings to Firestore
            if (finalReceiptUrl && finalReceiptUrl.startsWith('data:image')) {
                console.warn("Found Base64 image in receiptImage, removing to prevent Firestore limit crash")
                if (finalReceiptUrl.length > 500000) { // > 500KB
                    finalReceiptUrl = null
                }
            }

            if (billType === 'combine') {
                // COMBINE MODE: One expense with all items under the same project
                const finalItems = items.map(item => {
                    const cleanItem: any = {
                        ...item,
                        projectId: globalProjectId || undefined,
                        taskId: globalTaskId || undefined,
                    }
                    if (globalSubProjectId) cleanItem.subProjectId = globalSubProjectId
                    // Remove undefined values
                    Object.keys(cleanItem).forEach(key => {
                        if (cleanItem[key] === undefined || cleanItem[key] === '') {
                            delete cleanItem[key]
                        }
                    })
                    return cleanItem
                })

                const expenseData: Parameters<typeof addExpense>[0] = {
                    title: title || payee || "New Expense",
                    amount: `฿${subtotal.toLocaleString()} `,
                    totalValue: subtotal,
                    date,
                    category: items[0]?.category || "Other",
                    items: finalItems,
                    payee: payee || "",
                    status,
                    vatIncluded,
                    projectId: globalProjectId || "",
                }

                if (globalSubProjectId) expenseData.subProjectId = globalSubProjectId

                if (status === 'Advanced' && paidBy) expenseData.paidBy = paidBy
                if (status === 'Credit' && vendor) expenseData.vendor = vendor
                if (finalReceiptUrl) expenseData.receiptImage = finalReceiptUrl
                if (finalThumbnailUrl) expenseData.thumbnailUrl = finalThumbnailUrl

                await addExpense(expenseData)
            } else {
                // SPLIT MODE: Group items by projectId + subProjectId combination
                const itemsByProjectSubProject: Record<string, typeof items> = {}

                items.forEach(item => {
                    // Create unique key combining projectId and subProjectId
                    const pid = item.projectId || "unassigned"
                    const spid = item.subProjectId || "none"
                    const key = `${pid}__${spid}`

                    if (!itemsByProjectSubProject[key]) {
                        itemsByProjectSubProject[key] = []
                    }
                    itemsByProjectSubProject[key].push(item)
                })

                // Create one expense per project+subproject group
                await Promise.all(Object.entries(itemsByProjectSubProject).map(async ([key, groupItems]) => {
                    const [projectId, subProjectId] = key.split("__")
                    const groupTotal = groupItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

                    const project = projects.find(p => p.id === projectId)
                    const projectName = project?.name || "Unassigned"
                    const subProject = project?.subProjects?.find(sp => sp.id === subProjectId)
                    const subProjectName = subProject?.name

                    // Build title with project and optionally subproject name
                    let groupTitle = `${title || payee || "Split Bill"} (${projectName}`
                    if (subProjectName) {
                        groupTitle += ` - ${subProjectName}`
                    }
                    groupTitle += ")"

                    const expenseData: Parameters<typeof addExpense>[0] = {
                        title: groupTitle,
                        amount: `฿${groupTotal.toLocaleString()} `,
                        totalValue: groupTotal,
                        date,
                        category: groupItems[0]?.category || "Other",
                        items: groupItems,
                        payee: payee || "",
                        status,
                        vatIncluded,
                        projectId: projectId === "unassigned" ? "" : projectId
                    }

                    // Add subProjectId if it exists
                    if (subProjectId && subProjectId !== "none") {
                        expenseData.subProjectId = subProjectId
                    }

                    if (status === 'Advanced' && paidBy) expenseData.paidBy = paidBy
                    if (status === 'Credit' && vendor) expenseData.vendor = vendor
                    if (finalReceiptUrl) expenseData.receiptImage = finalReceiptUrl
                    if (finalThumbnailUrl) expenseData.thumbnailUrl = finalThumbnailUrl

                    await addExpense(expenseData)
                }))
            }

            toast.success("Expense added successfully")

            // Send Telegram Notification (silent fail - don't block expense creation)
            if (currentOrg?.id) {
                const project = projects.find(p => p.id === (billType === 'combine' ? globalProjectId : items[0]?.projectId))

                // Find subProjectName
                let subProjectName = undefined
                const subProjectId = billType === 'combine' ? globalSubProjectId : items[0]?.subProjectId
                if (subProjectId && project) {
                    subProjectName = project.subProjects?.find(sp => sp.id === subProjectId)?.name
                }

                try {
                    await sendExpenseNotification({
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
                    })
                } catch (telegramError) {
                    // Silent fail - don't show error to user
                    console.warn('Telegram notification failed:', telegramError)
                }
            }

            onClose()
        } catch (error: any) {
            console.error("Error adding expense:", error)
            const errorMsg = error?.message || "Unknown error"
            const isPermissionError = errorMsg.toLowerCase().includes("permission")

            toast.error(
                isPermissionError
                    ? "Failed to add expense. You might not have permission."
                    : `Error: ${errorMsg}`
            )
        } finally {
            setIsUploading(false)
        }
    }

    // Helper to get tasks for a project
    const getProjectTasks = (pid?: string) => {
        if (!pid) return []
        return tasks.filter(t => t.projectId === pid)
    }

    return (
        <>
            {/* Quick Add Dialog Overlay */}
            {quickAdd && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center font-sans">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQuickAdd(null)} />
                    <div className="relative glass-card w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-white/10 flex flex-col animate-in fade-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4">Add New {quickAdd.type === 'user' ? 'Person' : quickAdd.type.charAt(0).toUpperCase() + quickAdd.type.slice(1)}</h3>
                        <form onSubmit={handleQuickAdd} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Name / Title</label>
                                <input
                                    autoFocus
                                    required
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder={`Enter ${quickAdd.type} name...`}
                                />
                            </div>

                            {quickAdd.type === 'project' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Customer</label>
                                    <input
                                        value={newItemSecondary}
                                        onChange={(e) => setNewItemSecondary(e.target.value)}
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                    className="flex-1 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors"
                                >
                                    Add Valid
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans overflow-hidden">
                <SmartScanDialog
                    isOpen={isScanOpen}
                    onClose={() => setIsScanOpen(false)}
                    onScanComplete={handleScanComplete}
                />

                <div
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                <div className="relative glass-card w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] mx-4 p-0 rounded-2xl shadow-2xl border border-white/10 flex flex-col animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{t.expenses.dialog.title}</h2>
                            <p className="text-sm text-muted-foreground mr-4">{t.expenses.dialog.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Mobile Scan Button */}


                            {/* Top Metadata */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.bill_title}</label>
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
                                            "w-full bg-background/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors",
                                            errors.title ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10"
                                        )}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.date}</label>
                                    <input
                                        type="date"
                                        ref={dateRef}
                                        value={date}
                                        onChange={(e) => {
                                            setDate(e.target.value)
                                            if (errors.date) setErrors({ ...errors, date: false })
                                        }}
                                        className={cn(
                                            "w-full bg-background/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors",
                                            errors.date ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Category & Payee Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.category}</label>
                                    <select
                                        value={items[0]?.category || "Material"}
                                        onChange={(e) => {
                                            const newCat = e.target.value as ExpenseCategory
                                            setItems(items.map(i => ({ ...i, category: newCat })))
                                            // Reset payee when category changes to avoid mismatched data types
                                            setPayee("")
                                        }}
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                                    >
                                        <option value="Material">Material (ค่าวัสดุ)</option>
                                        <option value="Labor">Labor (ค่าแรง)</option>
                                        <option value="Sub-contract">Sub-contract (ค่าเหมา)</option>
                                        <option value="Other">Other (อื่นๆ)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className={cn("text-xs font-bold uppercase tracking-wider", errors.payee ? "text-red-500" : "text-muted-foreground")}>
                                        {(items[0]?.category === 'Labor') ? t.expenses.dialog.payee_labor : t.expenses.dialog.payee}
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                                        <div className="pl-9">
                                            <SearchableCombobox
                                                options={items[0]?.category === 'Labor' ? [
                                                    ...workers
                                                        .filter(w => w.status !== 'Inactive')
                                                        .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                                        .map(w => ({ value: w.name, label: w.name, description: w.role })),
                                                    { value: "NEW", label: `➕ ${t.expenses.dialog.add_new_person} `, description: "เพิ่มคนงานใหม่" }
                                                ] : [
                                                    ...vendors
                                                        .filter(v => {
                                                            if (v.status === 'Inactive') return false
                                                            const cat = items[0]?.category || "Material"
                                                            if (cat === 'Sub-contract') return v.category === 'Sub-contract'
                                                            if (cat === 'Material') return v.category === 'Material'
                                                            return true
                                                        })
                                                        .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                                        .map(v => ({ value: v.name, label: v.name, description: v.category })),
                                                    { value: "NEW", label: `➕ ${t.expenses.dialog.add_new_vendor} `, description: "เพิ่มร้านค้า/ผู้รับเหมาใหม่" }
                                                ]}
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
                                                    }
                                                }}
                                                placeholder={items[0]?.category === 'Labor' ? t.expenses.dialog.select_person : t.expenses.dialog.select_vendor}
                                                searchPlaceholder="ค้นหา..."
                                                className="border-none p-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bill Assignment Logic */}
                            <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-4 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="billType"
                                            checked={billType === 'combine'}
                                            onChange={() => setBillType('combine')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-bold">{t.expenses.dialog.combine_bill}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="billType"
                                            checked={billType === 'split'}
                                            onChange={() => setBillType('split')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-bold">{t.expenses.dialog.split_bill}</span>
                                    </label>
                                </div>

                                {billType === 'combine' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.project}</label>
                                            <SearchableCombobox
                                                options={[
                                                    { value: "NEW", label: "+ Add New Project...", description: "สร้างโปรเจคใหม่" },
                                                    ...projects
                                                        .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                                        .map(p => ({ value: p.id, label: p.name, description: p.customer }))
                                                ]}
                                                value={globalProjectId}
                                                onChange={(val) => handleSelectChange(val, setGlobalProjectId, 'project')}
                                                placeholder="Select Project..."
                                                searchPlaceholder="ค้นหาโปรเจค..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.task} / Sub-project</label>
                                            <SearchableCombobox
                                                options={[
                                                    { value: "NEW", label: t.expenses.dialog.add_new_sub_project, description: "สร้างงานย่อยใหม่" },
                                                    ...(projects.find(p => p.id === globalProjectId)?.subProjects?.map(sp => ({ value: sp.id, label: sp.name })) || [])
                                                ]}
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

                            {/* Itemization Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Layers className="w-4 h-4" /> {t.expenses.dialog.item_breakdown}
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={vatIncluded}
                                            onChange={(e) => setVatIncluded(e.target.checked)}
                                            className="w-4 h-4 rounded border-white/10 bg-background/50 text-primary focus:ring-primary/50 transition-all"
                                        />
                                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t.expenses.dialog.vat_included}</span>
                                    </label>
                                </div>

                                <div className="bg-muted/10 border border-white/5 rounded-2xl p-4 space-y-3">
                                    {items.map((item, index) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                            <div className="col-span-1 flex items-center justify-center pt-3 text-xs text-muted-foreground font-medium">
                                                {index + 1}
                                            </div>
                                            <div className="col-span-11 grid grid-cols-1 sm:grid-cols-12 gap-3">
                                                {/* Description & Amount */}
                                                {/* Description, Qty, Price, Total */}
                                                <div className="sm:col-span-12 grid grid-cols-12 gap-2">
                                                    <input
                                                        placeholder={t.expenses.dialog.item_desc}
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                                        className="col-span-12 sm:col-span-5 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder={t.expenses.dialog.quantity || "Qty"}
                                                        value={item.quantity || ""}
                                                        onChange={(e) => {
                                                            const qty = parseFloat(e.target.value)
                                                            const price = item.unitPrice || 0
                                                            updateItem(item.id, {
                                                                quantity: qty,
                                                                amount: qty * price
                                                            })
                                                        }}
                                                        className="col-span-4 sm:col-span-2 bg-background border border-white/10 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder={t.expenses.dialog.unit_price || "Price"}
                                                        value={item.unitPrice || ""}
                                                        onChange={(e) => {
                                                            const price = parseFloat(e.target.value)
                                                            const qty = item.quantity || 0
                                                            updateItem(item.id, {
                                                                unitPrice: price,
                                                                amount: qty * price
                                                            })
                                                        }}
                                                        className="col-span-4 sm:col-span-2 bg-background border border-white/10 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    />
                                                    <div className="col-span-4 sm:col-span-3 relative">
                                                        <input
                                                            id={`amount-${item.id}`}
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={item.amount || ""}
                                                            onChange={(e) => {
                                                                updateItem(item.id, { amount: parseFloat(e.target.value) })
                                                                if (errors.amount) setErrors({ ...errors, amount: false })
                                                            }}
                                                            className={cn(
                                                                "w-full bg-background border rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-right font-bold text-primary transition-colors",
                                                                errors.amount ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10"
                                                            )}
                                                        />
                                                        <span className="absolute left-2 top-2 text-xs text-muted-foreground">฿</span>
                                                    </div>
                                                </div>

                                                {/* Categories & Split Project Selection */}
                                                <div className="sm:col-span-11 grid grid-cols-3 gap-2">
                                                    <select
                                                        value={item.category}
                                                        onChange={(e) => updateItem(item.id, { category: e.target.value as ExpenseCategory })}
                                                        className="bg-background border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none truncate"
                                                    >
                                                        <option value="Material">Material</option>
                                                        <option value="Labor">Labor</option>
                                                        <option value="Sub-contract">Sub-con</option>
                                                        <option value="Other">Other</option>
                                                    </select>

                                                    {billType === 'split' && (
                                                        <>
                                                            <select
                                                                value={item.projectId || ""}
                                                                onChange={(e) => handleSelectChange(
                                                                    e.target.value,
                                                                    (val) => updateItem(item.id, { projectId: val, taskId: "" }),
                                                                    'project'
                                                                )}
                                                                className="bg-background border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none truncate"
                                                            >
                                                                <option value="">Select Project...</option>
                                                                {projects.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                                <option value="NEW" className="font-bold text-primary">+ Add New...</option>
                                                            </select>
                                                            <select
                                                                value={item.taskId || ""}
                                                                onChange={(e) => handleSelectChange(
                                                                    e.target.value,
                                                                    (val) => updateItem(item.id, { taskId: val }),
                                                                    'task',
                                                                    item.projectId
                                                                )}
                                                                disabled={!item.projectId}
                                                                className="bg-background border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none truncate disabled:opacity-50"
                                                            >
                                                                <option value="">- Sub-project -</option>
                                                                {getProjectTasks(item.projectId).map(t => (
                                                                    <option key={t.id} value={t.id}>{t.title}</option>
                                                                ))}
                                                                <option value="NEW" className="font-bold text-primary">+ Add New...</option>
                                                            </select>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Delete */}
                                                <div className="sm:col-span-1 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteItem(item.id)}
                                                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 border border-dashed border-white/10 rounded-xl transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> {t.expenses.dialog.add_line_item}
                                    </button>
                                </div>

                                {/* Receipt Upload - Compact */}
                                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-3">
                                    <button
                                        type="button"
                                        onClick={() => setReceiptExpanded(!receiptExpanded)}
                                        className="w-full flex items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-center gap-3 text-zinc-400 group-hover:text-white transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                                <Camera className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <span className="text-sm font-medium block">Receipt / Slip</span>
                                                {!receiptFile && <span className="text-[10px] text-zinc-500">Tap to upload image</span>}
                                            </div>
                                        </div>

                                        {receiptFile ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-green-500 font-medium truncate max-w-[100px]">{receiptFile.name}</span>
                                                <X
                                                    className="w-4 h-4 text-zinc-500 hover:text-red-500 transition-colors"
                                                    onClick={(e) => {
                                                        setReceiptFile(null)
                                                        setReceiptImage(null)
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-zinc-600">
                                                <Upload className="w-4 h-4" />
                                            </div>
                                        )}
                                        <span className={`transition-transform duration-300 ml-auto ${receiptExpanded ? 'rotate-180 text-primary' : 'opacity-50 text-muted-foreground'}`}>▼</span>
                                    </button>

                                    {/* Expanded Inline Preview */}
                                    {receiptExpanded && (
                                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                            {receiptImage ? (
                                                <div className="relative rounded-xl overflow-hidden border border-white/10 group aspect-video bg-black/40">
                                                    <img src={receiptImage} alt="Receipt Preview" className="w-full h-full object-contain" />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            removeImage()
                                                        }}
                                                        className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500/80 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer group">
                                                    <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                                        <div className="p-3 rounded-full bg-white/5 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-2">
                                                            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground group-hover:text-foreground font-medium">{t.expenses.dialog.upload_hint}</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {/* Totals */}
                                    <div className="flex justify-end gap-8 text-sm">
                                        {vatIncluded && (
                                            <div className="text-muted-foreground text-right">
                                                <p>{t.expenses.dialog.subtotal}: ฿{(subtotal - vatAmount).toLocaleString()}</p>
                                                <p>{t.expenses.dialog.vat}: ฿{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-muted-foreground font-bold tracking-wider">{t.expenses.dialog.grand_total}</p>
                                            <p className="text-2xl font-black text-primary">฿{subtotal.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="h-px bg-white/10" />

                            {/* Payment Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.payment_status}</label>
                                    <div className="relative">
                                        <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as any)}
                                            className="w-full bg-background/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                                        >
                                            <option value="Paid">Paid</option>
                                            <option value="Pending">Pending (รอชำระ)</option>
                                            <option value="Advanced">Advanced (สำรองจ่าย)</option>
                                            <option value="Credit">Credit (ติดไว้ก่อน)</option>
                                            <option value="Unpaid">Cancel (ยกเลิก)</option>
                                        </select>
                                    </div>
                                </div>

                                {status === 'Advanced' && (
                                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.paid_by}</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <select
                                                value={paidBy}
                                                onChange={(e) => handleSelectChange(e.target.value, setPaidBy, 'user')}
                                                className="w-full bg-background/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
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
                                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.vendor}</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <select
                                                value={vendor}
                                                onChange={(e) => handleSelectChange(e.target.value, setVendor, 'vendor')}
                                                className="w-full bg-background/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
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

                        </div>



                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 bg-background/20 backdrop-blur-md shrink-0">
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="w-full bg-primary text-primary-foreground hover:opacity-90 rounded-xl py-3 font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin" />
                                        <span>{uploadStatus || "Saving..."}</span>
                                    </>
                                ) : (
                                    t.expenses.dialog.save
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
