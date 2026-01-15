"use client"

import * as React from "react"
import { X, Receipt, ScanLine, Plus, Trash2, Layers, User, Building, Camera, Upload } from "lucide-react"
import { useProjects, ExpenseCategory, ExpenseItem } from "@/context/project-context"
import { SmartScanDialog } from "@/components/expenses/smart-scan-dialog"

interface AddExpenseDialogProps {
    isOpen: boolean
    onClose: () => void
    defaultProjectId?: string
    startScanning?: boolean
}

import { useTranslation } from "@/lib/i18n-context"

export default function AddExpenseDialog({ isOpen, onClose, defaultProjectId, startScanning }: AddExpenseDialogProps) {
    const { addExpense, addProject, addTask, addUser, addVendor, addWorker, projects, users, vendors, workers } = useProjects()
    const { t } = useTranslation()

    const [isScanOpen, setIsScanOpen] = React.useState(false)

    // Form Fields
    const [title, setTitle] = React.useState("")
    const [date, setDate] = React.useState(new Date().toISOString().split('T')[0])
    const [payee, setPayee] = React.useState("")
    const [status, setStatus] = React.useState<"Paid" | "Pending" | "Unpaid" | "Advanced" | "Credit">("Paid")
    const [receiptImage, setReceiptImage] = React.useState<string | null>(null)

    // Split Bill Logic
    const [billType, setBillType] = React.useState<"combine" | "split">("combine")
    const [globalProjectId, setGlobalProjectId] = React.useState("")
    const [globalTaskId, setGlobalTaskId] = React.useState("")

    // Advanced Status Fields
    const [paidBy, setPaidBy] = React.useState("") // For "Advanced"
    const [vendor, setVendor] = React.useState("") // For "Credit"

    // Quick Add State
    const [quickAdd, setQuickAdd] = React.useState<{ type: 'project' | 'task' | 'user' | 'vendor' | 'worker', parentId?: string } | null>(null)

    const [newItemName, setNewItemName] = React.useState("")
    const [newItemSecondary, setNewItemSecondary] = React.useState("") // Role or Category

    // Billing
    const [vatIncluded, setVatIncluded] = React.useState(true)
    const [items, setItems] = React.useState<ExpenseItem[]>([
        { id: "1", description: "", amount: 0, category: "Material", projectId: defaultProjectId }
    ])

    // Reset when opening
    React.useEffect(() => {
        if (isOpen) {
            setBillType("combine")
            setGlobalProjectId(defaultProjectId || "")
            setGlobalTaskId("")

            setItems([{ id: "1", description: "", amount: 0, category: "Material", projectId: defaultProjectId }])
            setTitle("")
            setPayee("")
            setStatus("Paid")
            setPaidBy("")
            setVendor("")
            setVatIncluded(true)
            setReceiptImage(null)
            setQuickAdd(null)

            if (startScanning) {
                setIsScanOpen(true)
            }
        }
    }, [isOpen, defaultProjectId, startScanning])

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
                assignedTo: "Unassigned",
                dueDate: new Date().toISOString()
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
        type: 'project' | 'task' | 'user' | 'vendor' | 'worker',
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

    const handleScanComplete = (data: { merchant: string, date: string, items: ExpenseItem[], total: number }) => {
        setPayee(data.merchant)
        setDate(data.date)
        setItems(data.items.map(i => ({ ...i, projectId: globalProjectId || defaultProjectId })))
        setTitle(`Bill from ${data.merchant}`)
    }

    const addItem = () => {
        setItems([...items, {
            id: Math.random().toString(),
            description: "",
            amount: 0,
            category: "Material",
            projectId: billType === 'combine' ? globalProjectId : undefined,
            taskId: billType === 'combine' ? globalTaskId : undefined
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setReceiptImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setReceiptImage(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Finalize items based on mode
        const finalItems = items.map(item => ({
            ...item,
            projectId: billType === 'combine' ? globalProjectId : item.projectId,
            taskId: billType === 'combine' ? globalTaskId : item.taskId
        }))

        addExpense({
            title: title || payee || "New Expense",
            amount: `฿${subtotal.toLocaleString()}`,
            totalValue: subtotal,
            date,
            category: items[0]?.category || "Other", // Fallback for list view
            items: finalItems,
            payee,
            status,
            paidBy: status === 'Advanced' ? paidBy : undefined,
            vendor: status === 'Credit' ? vendor : undefined,
            vatIncluded,
            projectId: finalItems[0]?.projectId, // Primary linkage
            receiptImage: receiptImage || undefined
        })
        onClose()
    }

    // Helper to get tasks for a project
    const getProjectTasks = (pid?: string) => {
        if (!pid) return []
        return projects.find(p => p.id === pid)?.tasks || []
    }

    return (
        <>
            {/* Quick Add Dialog Overlay */}
            {quickAdd && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center font-sans">
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

                <div className="relative glass-card w-full max-w-2xl h-[90vh] md:h-auto mx-4 p-0 rounded-2xl shadow-2xl border border-white/10 flex flex-col animate-in fade-in zoom-in-95 duration-200">

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
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Mobile Scan Button */}


                            {/* Top Metadata */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.bill_title}</label>
                                    <input
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={t.expenses.dialog.bill_placeholder}
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.date}</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {(items[0]?.category === 'Labor') ? t.expenses.dialog.payee_labor : t.expenses.dialog.payee}
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <select
                                            value={payee}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                const currentCat = items[0]?.category || "Material"

                                                if (val === 'NEW') {
                                                    // Determine the type of Quick Add based on Category
                                                    if (currentCat === 'Labor') {
                                                        handleSelectChange('NEW', setPayee, 'worker')
                                                    } else {

                                                        handleSelectChange('NEW', setPayee, 'vendor')
                                                        // Pre-set the category for the new vendor logic if possible
                                                        setNewItemSecondary(currentCat)
                                                    }
                                                } else {
                                                    setPayee(val)
                                                }
                                            }}
                                            className="w-full bg-background/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                                        >
                                            <option value="">{items[0]?.category === 'Labor' ? t.expenses.dialog.select_person : t.expenses.dialog.select_vendor}</option>

                                            {/* Logic for Options */}
                                            {items[0]?.category === 'Labor' ? (
                                                <>
                                                    {workers.map(w => (
                                                        <option key={w.id} value={w.name}>{w.name} ({w.role})</option>
                                                    ))}
                                                    <option value="NEW" className="font-bold text-primary">{t.expenses.dialog.add_new_person}</option>
                                                </>

                                            ) : (
                                                <>
                                                    {vendors
                                                        .filter(v => {
                                                            const cat = items[0]?.category || "Material"
                                                            // Filter vendors by matching category if possible, strictly for Sub-contract
                                                            if (cat === 'Sub-contract') return v.category === 'Sub-contract'
                                                            if (cat === 'Material') return v.category === 'Material'
                                                            return true // Show all for Other
                                                        })
                                                        .map(v => (
                                                            <option key={v.id} value={v.name}>{v.name} ({v.category})</option>
                                                        ))
                                                    }
                                                    <option value="NEW" className="font-bold text-primary">{t.expenses.dialog.add_new_vendor}</option>
                                                </>
                                            )}
                                        </select>
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
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={globalProjectId}
                                                    onChange={(e) => handleSelectChange(e.target.value, setGlobalProjectId, 'project')}
                                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                                                >
                                                    <option value="">Select Project...</option>
                                                    {projects.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                    <option value="NEW" className="font-bold text-primary">+ Add New Project...</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <Plus className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expenses.dialog.task}</label>
                                            <div className="relative">
                                                <select
                                                    value={globalTaskId}
                                                    onChange={(e) => handleSelectChange(e.target.value, setGlobalTaskId, 'task', globalProjectId)}
                                                    disabled={!globalProjectId}
                                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 appearance-none"
                                                >
                                                    <option value="">General Project Expense</option>
                                                    {getProjectTasks(globalProjectId).map(t => (
                                                        <option key={t.id} value={t.id}>{t.title}</option>
                                                    ))}
                                                    <option value="NEW" className="font-bold text-primary">+ Add New Task...</option>
                                                </select>
                                            </div>
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
                                                <div className="sm:col-span-12 grid grid-cols-6 gap-3">
                                                    <input
                                                        placeholder={t.expenses.dialog.item_desc}
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                                        className="col-span-4 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    />
                                                    <div className="col-span-2 relative">
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={item.amount || ""}
                                                            onChange={(e) => updateItem(item.id, { amount: parseFloat(e.target.value) })}
                                                            className="w-full bg-background border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-right"
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
                                                                <option value="">- Task -</option>
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
                            </div>

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
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Pending">Pending (Processing)</option>
                                            <option value="Advanced">Advanced (สำรองจ่าย)</option>
                                            <option value="Credit">Credit (ติดไว้ก่อน)</option>
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

                        {/* Image Upload Section */}
                        <div className="space-y-2 p-6 pt-0">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Camera className="w-4 h-4" /> {t.expenses.dialog.receipt_image}
                            </label>

                            {receiptImage ? (
                                <div className="relative rounded-xl overflow-hidden border border-white/10 group aspect-video bg-black/40">
                                    <img src={receiptImage} alt="Receipt Preview" className="w-full h-full object-contain" />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="p-3 rounded-full bg-white/5 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-2">
                                            <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <p className="text-sm text-muted-foreground group-hover:text-foreground font-medium">{t.expenses.dialog.upload_hint}</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 bg-background/20 backdrop-blur-md shrink-0">
                            <button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground hover:opacity-90 rounded-xl py-3 font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            >

                                {t.expenses.dialog.save}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
