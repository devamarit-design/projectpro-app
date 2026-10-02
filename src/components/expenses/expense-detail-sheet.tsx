import * as React from "react"
import { createPortal } from "react-dom"
import { X, Calendar, User, Trash2, Save, Building, Tag, DollarSign, Receipt, Info, Check, CheckCircle2, ShoppingBag, Camera, Upload, Layout, Archive, Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useProjects, Expense, ExpenseCategory, ExpenseItem } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { hasPermission } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { uploadWithThumbnail, compressReceiptImage } from "@/lib/upload"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import Image from "next/image"

interface ExpenseDetailSheetProps {
    expenseId: string | null
    onClose: () => void
}

export default function ExpenseDetailSheet({ expenseId, onClose }: ExpenseDetailSheetProps) {
    const { expenses, updateExpense, deleteExpense, projects, users, vendors, archiveExpense, unarchiveExpense, currentUser } = useProjects()
    const { currentOrg } = useOrganization()

    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Owner'

    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
    }, [])

    React.useEffect(() => {
        if (expenseId) {
            document.body.classList.add("modal-open")
            const prevOverflow = document.body.style.overflow
            document.body.style.overflow = "hidden"
            return () => {
                document.body.classList.remove("modal-open")
                document.body.style.overflow = prevOverflow
            }
        }
    }, [expenseId])

    // Find the expense
    const expense = React.useMemo(() =>
        expenses.find(e => e.id === expenseId),
        [expenses, expenseId])

    const [isEditing, setIsEditing] = React.useState(false)
    const [editForm, setEditForm] = React.useState<Partial<Expense>>({})
    const [newImageFiles, setNewImageFiles] = React.useState<File[]>([])
    const [newImagePreviews, setNewImagePreviews] = React.useState<string[]>([])
    const [activeImageIndex, setActiveImageIndex] = React.useState<number>(0)
    const [isUploading, setIsUploading] = React.useState(false)
    const [uploadStatus, setUploadStatus] = React.useState<string>("")
    const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false)
    const [isImageOpen, setIsImageOpen] = React.useState(false)
    const editFileInputRef = React.useRef<HTMLInputElement>(null)

    // Reset edit form when opening/changing expense
    React.useEffect(() => {
        if (expense) {
            setEditForm(JSON.parse(JSON.stringify(expense))) // Deep copy for items
            setNewImageFiles([])
            setNewImagePreviews([])
            setActiveImageIndex(0)
            setUploadStatus("")
        }
    }, [expense])

    if (!expenseId || !expense || !mounted || typeof document === "undefined") return null

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this expense?")) {
            deleteExpense(expenseId)
            onClose()
        }
    }

    const handleArchiveConfirm = () => {
        if (expense.isArchived) {
            unarchiveExpense(expenseId)
        } else {
            archiveExpense(expenseId)
        }
        // Close immediately for better UX
        onClose()
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : []
        if (files.length === 0) return

        setUploadStatus("กำลังย่อขนาดรูปภาพ... / Compressing...")
        try {
            const processedFiles: File[] = []
            const previews: string[] = []

            for (const file of files) {
                // Auto-compress aggressively
                const compressed = await compressReceiptImage(file)
                processedFiles.push(compressed)

                const previewUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(compressed)
                })
                previews.push(previewUrl)
            }

            setNewImageFiles(prev => [...prev, ...processedFiles])
            setNewImagePreviews(prev => [...prev, ...previews])
        } catch (err) {
            console.error("Image upload compression failed:", err)
        } finally {
            setUploadStatus("")
            if (editFileInputRef.current) {
                editFileInputRef.current.value = ""
            }
        }
    }

    const removeExistingReceiptImage = (index: number) => {
        setEditForm(prev => {
            const existingList = (prev.receiptImages && prev.receiptImages.length > 0)
                ? [...prev.receiptImages]
                : (prev.receiptImage ? [prev.receiptImage] : [])

            const updatedList = existingList.filter((_, i) => i !== index)
            return {
                ...prev,
                receiptImages: updatedList,
                receiptImage: updatedList[0] || undefined
            }
        })
        setActiveImageIndex(prev => Math.max(0, prev - 1))
    }

    const removeNewImageFile = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index))
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        setIsUploading(true)
        setUploadStatus("Processing...")
        try {
            let updates = { ...editForm }

            // Existing remote URLs
            let finalReceiptUrls = (updates.receiptImages && updates.receiptImages.length > 0)
                ? [...updates.receiptImages]
                : (updates.receiptImage && !updates.receiptImage.startsWith('data:') ? [updates.receiptImage] : [])

            if (newImageFiles.length > 0) {
                setUploadStatus(`Uploading ${newImageFiles.length} images...`)

                if (!currentOrg?.id) {
                    throw new Error("Organization not found. Please refresh and try again.")
                }

                const path = `organizations/${currentOrg.id}/expenses/${new Date().getFullYear()}`
                for (const file of newImageFiles) {
                    const { originalUrl, thumbnailUrl } = await uploadWithThumbnail(file, path)
                    finalReceiptUrls.push(originalUrl)
                    if (!updates.thumbnailUrl) {
                        updates.thumbnailUrl = thumbnailUrl
                    }
                }
                updates.imageEdited = true
            }

            updates.receiptImages = finalReceiptUrls
            updates.receiptImage = finalReceiptUrls[0] || undefined

            setUploadStatus("Saving data...")

            // SECURITY CHECK: Ensure we don't send huge Base64 strings to Firestore
            if (updates.receiptImage && updates.receiptImage.startsWith('data:image')) {
                if (updates.receiptImage.length > 500000) { // > 500KB
                    delete updates.receiptImage
                }
            }

            // Ensure item categories match top-level category if category was updated
            if (updates.category && updates.items && updates.items.length > 0) {
                updates.items = updates.items.map(item => ({
                    ...item,
                    category: updates.category as ExpenseCategory
                }))
            }

            await updateExpense(expenseId, updates)
            setIsEditing(false)
            setNewImageFiles([])
            setNewImagePreviews([])
        } catch (error) {
            console.error("Failed to update expense", error)
            alert("Failed to update expense. Please check your connection or try a smaller image.")
        } finally {
            setIsUploading(false)
        }
    }

    // Calculations
    const currentItems = editForm.items || []
    const totalValue = currentItems.length > 0
        ? currentItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        : (editForm.totalValue || 0)

    const isVatIncluded = isEditing ? editForm.vatIncluded : expense.vatIncluded
    const vatRate = 0.07
    const subtotal = isVatIncluded ? (totalValue / (1 + vatRate)) : totalValue
    const vatAmount = isVatIncluded ? (totalValue - subtotal) : 0

    // Display Strings
    const displayAmount = `฿${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    const displaySubtotal = `฿${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const displayVat = `฿${vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    // Multi-Image Lists
    // In edit mode: existing images in editForm + new image previews
    const existingEditImages = (editForm.receiptImages && editForm.receiptImages.length > 0)
        ? editForm.receiptImages
        : (editForm.receiptImage ? [editForm.receiptImage] : [])
    
    // In view mode: expense.receiptImages or single receiptImage
    const viewImages = (expense.receiptImages && expense.receiptImages.length > 0)
        ? expense.receiptImages
        : (expense.receiptImage ? [expense.receiptImage] : [])

    const allDisplayImages = isEditing
        ? [...existingEditImages, ...newImagePreviews]
        : viewImages

    const currentActiveImage = allDisplayImages[activeImageIndex] || allDisplayImages[0] || null

    const isArchived = expense.isArchived

    return createPortal(
        <>
            <ConfirmDialog
                isOpen={showArchiveConfirm}
                onClose={() => setShowArchiveConfirm(false)}
                onConfirm={handleArchiveConfirm}
                title={isArchived ? "Restore รายจ่าย" : "Archive รายจ่าย"}
                message={isArchived ? "คุณต้องการนำรายจ่ายนี้กลับมาหรือไม่?" : "คุณต้องการ Archive รายจ่ายนี้หรือไม่?"}
                confirmText={isArchived ? "Restore" : "Archive"}
                cancelText="ยกเลิก"
                variant={isArchived ? "success" : "warning"}
            />
            <div className="fixed inset-0 z-[100] flex justify-end font-sans">
                <div
                    className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-full bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col text-foreground">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] border-b border-border shrink-0 relative z-50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">Expense Details</h2>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                    <p className="uppercase tracking-wide opacity-70">ID: {expense.id.slice(0, 8).toUpperCase()}...</p>
                                    {(expense.createdAt || expense.createdBy) && (
                                        <div className="flex flex-col">
                                            {expense.createdAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(expense.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} {new Date(expense.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {expense.createdBy && (
                                                <span className="flex items-center gap-1 text-primary/80">
                                                    <User className="w-3 h-3" />
                                                    {users.find(u => u.id === expense.createdBy)?.name || "Unknown"}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing && (
                                <>
                                    {(expense.status === 'Paid' || expense.status === 'Unpaid' || isArchived) && (
                                        <button
                                            onClick={() => setShowArchiveConfirm(true)}
                                            className={cn("p-2 rounded-full transition-colors cursor-pointer", isArchived ? "text-green-500 hover:bg-green-500/10" : "text-amber-500 hover:bg-amber-500/10")}
                                            title={isArchived ? "Restore Expense" : "Archive Expense"}
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                        title="Delete Expense"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Main Amount Card */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-background/50 to-muted/20 text-center space-y-2 relative overflow-hidden">

                            {/* Edit Title */}
                            {isEditing ? (
                                <input
                                    value={editForm.title || ""}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full text-center bg-transparent border-b border-white/10 font-bold text-lg focus:outline-none focus:border-white/30 transition-colors mb-2"
                                    placeholder="Expense Title"
                                />
                            ) : (
                                <h3 className="text-lg font-bold text-foreground leading-tight px-4">{expense.title}</h3>
                            )}

                            {/* Amount */}
                            <div className="scale-110 transform transition-transform">
                                <h1 className="text-5xl font-black text-primary tracking-tight">{displayAmount}</h1>
                            </div>

                            {/* Date */}
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                        className="bg-transparent border-b border-white/10 focus:outline-none"
                                    />
                                ) : (
                                    <span>{expense.date}</span>
                                )}
                            </div>
                        </div>

                        {/* Status Select / Display */}
                        <div className="glass-card p-1 rounded-xl border border-white/5 bg-muted/20 flex flex-col">
                            {isEditing ? (
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                                    className="w-full bg-background border-none rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending (รอชำระ)</option>
                                    <option value="Advanced">Advanced (สำรองจ่าย)</option>
                                    <option value="Credit">Credit (เจ้าหนี้/เครดิต)</option>
                                    <option value="Unpaid">Cancel (ยกเลิก)</option>
                                </select>
                            ) : (
                                <div className={cn("px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                                    expense.status === 'Paid' ? 'bg-green-500/10 text-green-500' :
                                        expense.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                            expense.status === 'Advanced' ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-red-500/10 text-red-500'
                                )}>
                                    {expense.status === 'Paid' && <CheckCircle2 className="w-4 h-4" />}
                                    {expense.status === 'Unpaid' ? 'Cancel' : expense.status}
                                </div>
                            )}
                        </div>

                        {/* Payment Info Grid */}
                        <div className="grid grid-cols-1 gap-3">
                            {/* Payee / Receiver */}
                            <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Payee / Merchant</p>
                                        {isEditing ? (
                                            <input
                                                value={editForm.payee || ""}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, payee: e.target.value }))}
                                                className="bg-transparent border-b border-white/10 focus:outline-none w-full font-medium"
                                                placeholder="Who got paid?"
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground">{expense.payee || "-"}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Paid By (Advanced) */}
                            {(expense.status === 'Advanced' || editForm.status === 'Advanced') && (
                                <div className="glass-card p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-orange-500/10 text-orange-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Paid By (สำรองจ่าย)</p>
                                            {isEditing ? (
                                                <select
                                                    value={editForm.paidBy || ""}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, paidBy: e.target.value }))}
                                                    className="bg-transparent border-b border-orange-500/30 text-orange-500 font-medium focus:outline-none w-full"
                                                >
                                                    <option value="">Select User...</option>
                                                    {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                                </select>
                                            ) : (
                                                <p className="font-bold text-orange-500">{expense.paidBy || "-"}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Vendor (Credit) */}
                            {(expense.status === 'Credit' || editForm.status === 'Credit') && (
                                <div className="glass-card p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                                            <Building className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Creditor (เจ้าหนี้)</p>
                                            {isEditing ? (
                                                <select
                                                    value={editForm.vendor || ""}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, vendor: e.target.value }))}
                                                    className="bg-transparent border-b border-red-500/30 text-red-500 font-medium focus:outline-none w-full"
                                                >
                                                    <option value="">Select Vendor...</option>
                                                    {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                                </select>
                                            ) : (
                                                <p className="font-bold text-red-500">{expense.vendor || "-"}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Category
                                </label>
                                {isEditing ? (
                                    <select
                                        value={editForm.category}
                                        onChange={(e) => {
                                            const newCat = e.target.value as ExpenseCategory
                                            setEditForm(prev => ({
                                                ...prev,
                                                category: newCat,
                                                items: prev.items ? prev.items.map(item => ({ ...item, category: newCat })) : prev.items
                                            }))
                                        }}
                                        className="w-full bg-transparent text-sm font-medium focus:outline-none"
                                    >
                                        <option value="Material">Material</option>
                                        <option value="Labor">Labor</option>
                                        <option value="Sub-contract">Sub-contract</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <div className="text-sm font-medium truncate">{expense.category}</div>
                                )}
                            </div>
                            <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Building className="w-3 h-3" /> Project
                                </label>
                                {isEditing && isAdmin ? (
                                    <select
                                        value={editForm.projectId || ""}
                                        onChange={(e) => {
                                            const newProjectId = e.target.value
                                            setEditForm(prev => ({
                                                ...prev,
                                                projectId: newProjectId,
                                                subProjectId: "" // Reset subproject when project changes
                                            }))
                                        }}
                                        className="w-full bg-transparent text-sm font-medium focus:outline-none"
                                    >
                                        <option value="">General (ไม่ระบุโปรเจค)</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm font-medium truncate">
                                        {projects.find(p => p.id === expense.projectId)?.name || "General"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sub-project Field */}
                        <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Layout className="w-3 h-3" /> Sub-project
                            </label>
                            {isEditing && isAdmin ? (
                                <select
                                    value={editForm.subProjectId || ""}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, subProjectId: e.target.value }))}
                                    className="w-full bg-transparent text-sm font-medium focus:outline-none"
                                >
                                    <option value="">- None -</option>
                                    {projects.find(p => p.id === (editForm.projectId || expense.projectId))?.subProjects?.map(sp => (
                                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-sm font-medium truncate">
                                    {projects.find(p => p.id === expense.projectId)?.subProjects?.find(sp => sp.id === expense.subProjectId)?.name || "-"}
                                </div>
                            )}
                        </div>

                        {/* Created By Field */}
                        <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> Created By (ผู้ทำรายการ)
                            </label>
                            <div className="text-sm font-medium truncate flex items-center gap-2">
                                {expense.createdBy ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {users.find(u => u.id === expense.createdBy)?.name?.charAt(0) || "?"}
                                        </div>
                                        {users.find(u => u.id === expense.createdBy)?.name || "Unknown"}
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </div>
                        </div>

                        {/* Financial Breakdown */}
                        <div className="glass-card p-4 rounded-xl border border-white/5 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Breakdown</span>
                                {isVatIncluded && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">VAT INCLUDED</span>}
                            </h3>

                            {/* Items */}
                            <div className="space-y-3">
                                {(currentItems.length > 0 ? currentItems : (isEditing ? [] : [])).map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className={cn(
                                            "transition-all",
                                            isEditing
                                                ? "p-3 rounded-xl bg-muted/30 border border-border/70 space-y-2.5"
                                                : "flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0 gap-3"
                                        )}
                                    >
                                        {isEditing ? (
                                            <>
                                                {/* Top row: Category, Description, and Delete button */}
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-28 sm:w-32 shrink-0">
                                                        <select
                                                            value={item.category}
                                                            onChange={(e) => {
                                                                const newItems = [...currentItems]
                                                                newItems[idx] = { ...item, category: e.target.value as any }
                                                                setEditForm(prev => ({ ...prev, items: newItems }))
                                                            }}
                                                            className="w-full bg-background border border-input rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                                                        >
                                                            <option value="Material">Material</option>
                                                            <option value="Labor">Labor</option>
                                                            <option value="Sub-contract">Sub-contract</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <input
                                                        value={item.description}
                                                        onChange={(e) => {
                                                            const newItems = [...currentItems]
                                                            newItems[idx] = { ...item, description: e.target.value }
                                                            setEditForm(prev => ({ ...prev, items: newItems }))
                                                        }}
                                                        className="flex-1 min-w-0 bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                                                        placeholder="รายละเอียดรายการ (Item description)"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newItems = currentItems.filter((_, i) => i !== idx)
                                                            setEditForm(prev => ({ ...prev, items: newItems }))
                                                        }}
                                                        className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors shrink-0"
                                                        title="ลบรายการ"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Bottom row: Amount with currency label */}
                                                <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        ยอดเงิน (Amount):
                                                    </span>
                                                    <div className="relative w-40 sm:w-48 shrink-0">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">฿</span>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={item.amount || ""}
                                                            onChange={(e) => {
                                                                const newItems = [...currentItems]
                                                                newItems[idx] = { ...item, amount: parseFloat(e.target.value) || 0 }
                                                                setEditForm(prev => ({ ...prev, items: newItems }))
                                                            }}
                                                            className="w-full bg-background border border-input rounded-lg pl-7 pr-3 py-1.5 text-sm text-right font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="truncate pr-4 text-muted-foreground flex items-center gap-2 min-w-0">
                                                    <span className="truncate text-foreground font-medium">{item.description || "Unspecified Item"}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 border border-border/50">
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <div className="font-mono font-bold text-foreground shrink-0">฿{item.amount.toLocaleString()}</div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            const newItem: ExpenseItem = {
                                                id: Math.random().toString(),
                                                description: "",
                                                amount: 0,
                                                category: "Material",
                                                projectId: editForm.projectId
                                            }
                                            setEditForm(prev => ({
                                                ...prev,
                                                items: [...(prev.items || []), newItem]
                                            }))
                                        }}
                                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 rounded-lg border border-dashed border-primary/20 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Item
                                    </button>
                                )}

                                {!isEditing && (!expense.items || expense.items.length === 0) && (
                                    <p className="text-sm text-muted-foreground italic">No itemized breakdown.</p>
                                )}
                            </div>

                            <div className="h-px bg-white/10 my-2" />

                            <div className="space-y-1 text-sm">
                                {isEditing && (
                                    <label className="flex items-center gap-2 cursor-pointer pb-2 mb-2 border-b border-white/5 justify-end">
                                        <input
                                            type="checkbox"
                                            checked={editForm.vatIncluded ?? expense.vatIncluded ?? false}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, vatIncluded: e.target.checked }))}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-bold">VAT Included</span>
                                    </label>
                                )}
                                {isVatIncluded && (
                                    <>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span className="font-mono">{displaySubtotal}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>VAT (7%)</span>
                                            <span className="font-mono">{displayVat}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between font-bold text-foreground text-base pt-1">
                                    <span>Grand Total</span>
                                    <span className="font-mono text-primary">{displayAmount}</span>
                                </div>
                            </div>
                        </div>



                        {/* Receipt Images Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Receipt className="w-3.5 h-3.5 text-primary" /> 
                                    รูปใบเสร็จ / บิล ({allDisplayImages.length})
                                    {expense.imageEdited && <span className="text-primary font-bold text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">แก้ไขแล้ว</span>}
                                </label>
                                {allDisplayImages.length > 1 && (
                                    <span className="text-[11px] font-mono text-muted-foreground">
                                        บิลที่ {Math.min(activeImageIndex + 1, allDisplayImages.length)} จาก {allDisplayImages.length}
                                    </span>
                                )}
                            </div>

                            {/* Main Spotlight Preview */}
                            <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-[4/3] sm:aspect-video flex items-center justify-center">
                                {currentActiveImage ? (
                                    <>
                                        <Image
                                            src={currentActiveImage}
                                            alt={`Receipt ${activeImageIndex + 1}`}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-contain"
                                        />
                                        
                                        {/* Prev / Next Buttons if multiple images */}
                                        {allDisplayImages.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setActiveImageIndex(prev => (prev > 0 ? prev - 1 : allDisplayImages.length - 1))
                                                    }}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all z-10"
                                                    title="บิลก่อนหน้า"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setActiveImageIndex(prev => (prev < allDisplayImages.length - 1 ? prev + 1 : 0))
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all z-10"
                                                    title="บิลถัดไป"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}

                                        {/* Hover Overlay Actions */}
                                        <div className={cn(
                                            "absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-3",
                                            isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}>
                                            <button
                                                type="button"
                                                onClick={() => setIsImageOpen(true)}
                                                className="px-4 py-2 bg-white hover:bg-white/90 text-black rounded-full font-bold text-xs transition-all active:scale-95 shadow-lg"
                                            >
                                                ดูรูปเต็ม (Full Screen)
                                            </button>

                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (activeImageIndex < existingEditImages.length) {
                                                            removeExistingReceiptImage(activeImageIndex)
                                                        } else {
                                                            removeNewImageFile(activeImageIndex - existingEditImages.length)
                                                        }
                                                    }}
                                                    className="px-3 py-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-full font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> ลบบิลนี้
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground gap-2 p-6 text-center">
                                        <Receipt className="w-12 h-12 opacity-20" />
                                        <span className="text-xs">ยังไม่มีรูปภาพบิลหรือใบเสร็จ</span>
                                        {isEditing && (
                                            <div className="mt-2">
                                                <input
                                                    ref={editFileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    id="add-receipt-upload"
                                                />
                                                <label
                                                    htmlFor="add-receipt-upload"
                                                    className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full font-bold text-xs cursor-pointer hover:bg-primary/30 transition-colors flex items-center gap-2"
                                                >
                                                    <Upload className="w-3.5 h-3.5" /> อัพโหลดบิล (เลือกได้หลายรูป)
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Multi-Bill Thumbnail Bar */}
                            {allDisplayImages.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                                        {allDisplayImages.map((src, idx) => {
                                            const isSelected = (idx === activeImageIndex)
                                            const isNewlyAdded = isEditing && idx >= existingEditImages.length
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    className={cn(
                                                        "relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 cursor-pointer transition-all bg-black/30",
                                                        isSelected
                                                            ? "border-primary shadow-md shadow-primary/20 scale-105"
                                                            : "border-border/50 opacity-70 hover:opacity-100"
                                                    )}
                                                >
                                                    <Image
                                                        src={src}
                                                        alt={`Thumbnail ${idx + 1}`}
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-bold text-center text-white py-0.5">
                                                        #{idx + 1}
                                                    </div>
                                                    {isNewlyAdded && (
                                                        <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-background" title="เพิ่มใหม่" />
                                                    )}
                                                </div>
                                            )
                                        })}

                                        {/* In Edit mode: Add More Receipts Button */}
                                        {isEditing && (
                                            <label
                                                htmlFor="add-more-receipt-upload"
                                                className="w-16 h-16 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-1 cursor-pointer shrink-0 transition-colors text-primary"
                                                title="เพิ่มบิลอีกภาพ"
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span className="text-[9px] font-bold">+เพิ่มบิล</span>
                                                <input
                                                    ref={editFileInputRef}
                                                    id="add-more-receipt-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>แนบทั้งหมด {allDisplayImages.length} บิล</span>
                                        <span className="text-[10px] text-emerald-400/90 font-medium">ย่อขนาดอัตโนมัติคมชัด ประหยัดพื้นที่</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lightbox / Full Screen Image with Next / Prev */}
                        {isImageOpen && currentActiveImage && (
                            <div
                                className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                                onClick={() => setIsImageOpen(false)}
                            >
                                <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                                    <div className="text-white/80 font-mono text-xs bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
                                        บิล {activeImageIndex + 1} / {allDisplayImages.length}
                                    </div>
                                    <button
                                        className="p-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                                        onClick={() => setIsImageOpen(false)}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {allDisplayImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setActiveImageIndex(prev => (prev > 0 ? prev - 1 : allDisplayImages.length - 1))
                                            }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                                            title="บิลก่อนหน้า"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setActiveImageIndex(prev => (prev < allDisplayImages.length - 1 ? prev + 1 : 0))
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                                            title="บิลถัดไป"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}

                                <div 
                                    className="relative w-full h-full max-w-4xl max-h-[85vh] p-4 flex items-center justify-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Image
                                        src={currentActiveImage}
                                        alt={`Full Receipt ${activeImageIndex + 1}`}
                                        fill
                                        sizes="100vw"
                                        className="object-contain rounded-lg shadow-2xl"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/10 bg-background/20 backdrop-blur-md shrink-0">
                        {isEditing ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-3 rounded-xl font-medium bg-muted/40 hover:bg-muted text-foreground border border-border transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            {uploadStatus || "Saving..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" /> Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-3 bg-muted/40 hover:bg-muted border border-border text-foreground rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                            >
                                Edit Expense
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    )
}
