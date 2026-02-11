"use client"

import * as React from "react"
import { X, Calendar, User, Trash2, Save, Building, Tag, DollarSign, Receipt, Info, Check, CheckCircle2, ShoppingBag, Camera, Upload, Layout, Archive, Clock } from "lucide-react"
import { useProjects, Expense, ExpenseCategory, ExpenseItem } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { uploadWithThumbnail } from "@/lib/upload"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ExpenseDetailSheetProps {
    expenseId: string | null
    onClose: () => void
}

export default function ExpenseDetailSheet({ expenseId, onClose }: ExpenseDetailSheetProps) {
    const { expenses, updateExpense, deleteExpense, projects, users, vendors, archiveExpense, unarchiveExpense } = useProjects()

    // Find the expense
    const expense = React.useMemo(() =>
        expenses.find(e => e.id === expenseId),
        [expenses, expenseId])

    const [isEditing, setIsEditing] = React.useState(false)
    const [isImageOpen, setIsImageOpen] = React.useState(false)
    const [editForm, setEditForm] = React.useState<Partial<Expense>>({})
    const [editImageFile, setEditImageFile] = React.useState<File | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false)

    // Initialize edit form when expense changes
    React.useEffect(() => {
        if (expense) {
            setEditForm(JSON.parse(JSON.stringify(expense))) // Deep copy for items
        }
    }, [expense])

    if (!expenseId || !expense) return null

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setEditImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                // Update preview
                setEditForm(prev => ({ ...prev, receiptImage: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = async () => {
        setIsUploading(true)
        try {
            let updates = { ...editForm }

            if (editImageFile) {
                const path = `expenses/${new Date().getFullYear()}`
                const { originalUrl, thumbnailUrl } = await uploadWithThumbnail(editImageFile, path)
                updates.receiptImage = originalUrl
                updates.thumbnailUrl = thumbnailUrl
                updates.imageEdited = true
            }

            updateExpense(expenseId, updates)
            setIsEditing(false)
            setEditImageFile(null)
        } catch (error) {
            console.error("Failed to update expense", error)
            alert("Failed to update expense")
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

    // Only show image if one actually exists
    const fullImage = isEditing ? editForm.receiptImage : expense.receiptImage
    const displayImage = isEditing ? editForm.receiptImage : (expense.thumbnailUrl || expense.receiptImage)

    const isArchived = expense.isArchived

    return (
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
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                <div className="relative w-full max-w-md h-full bg-card/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] border-b border-white/10 shrink-0 relative z-50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Expense Details</h2>
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
                                            className={cn("p-2 rounded-full transition-colors", isArchived ? "text-green-500 hover:bg-green-500/10" : "text-amber-500 hover:bg-amber-500/10")}
                                            title={isArchived ? "Restore Expense" : "Archive Expense"}
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                                        title="Delete Expense"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-background/50 transition-colors"
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
                                        onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as any }))}
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
                                <div className="text-sm font-medium truncate">
                                    {projects.find(p => p.id === expense.projectId)?.name || "General"}
                                </div>
                            </div>
                        </div>

                        {/* Sub-project Field */}
                        <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Layout className="w-3 h-3" /> Sub-project
                            </label>
                            {isEditing ? (
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
                            {expense.items && expense.items.length > 0 ? (
                                <div className="space-y-2">
                                    {expense.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0">
                                            <div className="truncate pr-4 text-muted-foreground">
                                                {item.description || "Unspecified Item"}
                                                <span className="text-[10px] opacity-50 ml-2">({item.category})</span>
                                            </div>
                                            <div className="font-mono">฿{item.amount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No itemized breakdown.</p>
                            )}

                            <div className="h-px bg-white/10 my-2" />

                            {/* Totals */}
                            <div className="space-y-1 text-sm">
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



                        {/* Receipt Image */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Receipt className="w-3 h-3" /> Receipt Image
                                {(editImageFile || expense.imageEdited) && <span className="text-primary font-bold animate-pulse">(Edited)</span>}
                            </label>
                            <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-[3/4] sm:aspect-video flex items-center justify-center">
                                {displayImage ? (
                                    <>
                                        <img
                                            src={displayImage}
                                            alt="Receipt"
                                            className="w-full h-full object-contain"
                                        />
                                        <div className={cn(
                                            "absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-3",
                                            isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}>
                                            <button
                                                onClick={() => setIsImageOpen(true)}
                                                className="px-4 py-2 bg-white text-black rounded-full font-bold text-sm transform transition-transform hover:scale-105"
                                            >
                                                View Full Screen
                                            </button>

                                            {isEditing && (
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        id="edit-receipt-upload"
                                                    />
                                                    <label
                                                        htmlFor="edit-receipt-upload"
                                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold text-sm cursor-pointer hover:bg-primary/90 transition-colors flex items-center gap-2"
                                                    >
                                                        <Camera className="w-4 h-4" /> Change
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground gap-2">
                                        <Receipt className="w-12 h-12 opacity-20" />
                                        <span className="text-xs">No receipt image attached</span>
                                        {isEditing && (
                                            <div className="mt-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    id="add-receipt-upload"
                                                />
                                                <label
                                                    htmlFor="add-receipt-upload"
                                                    className="px-4 py-2 bg-white/10 text-foreground rounded-full font-bold text-xs cursor-pointer hover:bg-white/20 transition-colors flex items-center gap-2"
                                                >
                                                    <Upload className="w-3 h-3" /> Upload Image
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lightbox / Full Screen Image */}
                        {isImageOpen && fullImage && (
                            <div
                                className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                                onClick={() => setIsImageOpen(false)}
                            >
                                <button
                                    className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                                    onClick={() => setIsImageOpen(false)}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <img
                                    src={fullImage}
                                    alt="Full Receipt"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/10 bg-background/20 backdrop-blur-md shrink-0">
                        {isEditing ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin" />
                                            Saving...
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
                                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-xl font-bold uppercase tracking-wider transition-all"
                            >
                                Edit Expense
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
