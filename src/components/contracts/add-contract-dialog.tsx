import { useState, useEffect } from "react"
import { useProjects, Contract, ContractInstallment } from "@/context/project-context"
import { Plus, Trash2, FileText, Layout, User, List, AlignLeft, MessageSquare, Save } from "lucide-react"

interface ScopeItem {
    id: string
    text: string
}

interface InstallmentInput {
    id?: string
    description: string
    amount: number
    dueDate: string
    status: "Pending" | "Paid" | "Overdue"
    paymentDetails?: string
}

interface AddContractDialogProps {
    isOpen: boolean
    onClose: () => void
    initialData?: Contract
}

export function AddContractDialog({ isOpen, onClose, initialData }: AddContractDialogProps) {
    const { projects, workers, addContract, updateContract } = useProjects()

    // Form State
    const [projectId, setProjectId] = useState("")
    const [workerId, setWorkerId] = useState("")
    const [title, setTitle] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    // Scope Mode: 'items' or 'freeform'
    const [scopeMode, setScopeMode] = useState<"items" | "freeform">("items")
    const [scopeItems, setScopeItems] = useState<ScopeItem[]>([{ id: "1", text: "" }])
    const [scopeFreeform, setScopeFreeform] = useState("")

    // Installments State
    const [installments, setInstallments] = useState<InstallmentInput[]>([
        { description: "1st Installment", amount: 0, dueDate: "", status: "Pending", paymentDetails: "" }
    ])

    // Notes Section
    const [notes, setNotes] = useState("")

    // Reset or Load form
    useEffect(() => {
        if (!isOpen) return

        if (initialData) {
            setProjectId(initialData.projectId)
            setWorkerId(initialData.workerId)
            setTitle(initialData.title)
            setStartDate(initialData.startDate)
            setEndDate(initialData.endDate)
            setInstallments(initialData.installments.map(i => ({ ...i })))

            // Parse Scope and Notes
            const parts = initialData.scope.split("--- หมายเหตุ ---")
            const mainScope = parts[0].trim()
            const notePart = parts[1] ? parts[1].trim() : ""
            setNotes(notePart)

            // Attempt to detect list format
            if (mainScope.includes("\n") && /^\d+\./.test(mainScope)) {
                setScopeMode("items")
                const items = mainScope.split("\n").map(line => {
                    const match = line.match(/^\d+\.\s*(.+)$/)
                    return { id: Math.random().toString(), text: match ? match[1] : line }
                })
                setScopeItems(items.length > 0 ? items : [{ id: "1", text: "" }])
            } else {
                setScopeMode("freeform")
                setScopeFreeform(mainScope)
            }
        } else {
            // Default New Contract
            setProjectId(projects[0]?.id || "")
            setWorkerId(workers[0]?.id || "")
            setTitle("")
            setStartDate(new Date().toISOString().split('T')[0])
            setEndDate("")
            setScopeMode("items")
            setScopeItems([{ id: "1", text: "" }])
            setScopeFreeform("")
            setInstallments([{ description: "1st Installment", amount: 0, dueDate: "", status: "Pending", paymentDetails: "" }])
            setNotes("")
        }
    }, [isOpen, initialData, projects, workers])

    const totalAmount = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0)

    // Scope Item Handlers
    const handleAddScopeItem = () => {
        setScopeItems([...scopeItems, { id: Math.random().toString(), text: "" }])
    }
    const handleRemoveScopeItem = (id: string) => {
        setScopeItems(scopeItems.filter(item => item.id !== id))
    }
    const handleScopeItemChange = (id: string, text: string) => {
        setScopeItems(scopeItems.map(item => item.id === id ? { ...item, text } : item))
    }

    // Installment Handlers
    const handleAddInstallment = () => {
        setInstallments([...installments, { description: `Installment ${installments.length + 1}`, amount: 0, dueDate: "", status: "Pending", paymentDetails: "" }])
    }
    const handleRemoveInstallment = (index: number) => {
        setInstallments(installments.filter((_, i) => i !== index))
    }
    const handleInstallmentChange = (index: number, field: keyof InstallmentInput, value: any) => {
        const newInst = [...installments]
        newInst[index] = { ...newInst[index], [field]: value }
        setInstallments(newInst)
    }

    const handleSave = () => {
        if (!projectId || !workerId || !title) return

        // Combine scope
        const scope = scopeMode === "items"
            ? scopeItems.filter(s => s.text.trim()).map((s, i) => `${i + 1}. ${s.text}`).join("\n")
            : scopeFreeform

        const finalScope = scope + (notes ? `\n\n--- หมายเหตุ ---\n${notes}` : "")

        const finalInstallments = installments.map(inst => ({
            ...inst,
            id: inst.id || Math.random().toString(36).substring(2, 9),
            status: inst.status || "Pending"
        })) as ContractInstallment[]

        if (initialData) {
            updateContract(initialData.id, {
                projectId,
                workerId,
                title,
                scope: finalScope,
                startDate,
                endDate,
                totalAmount,
                installments: finalInstallments
            })
        } else {
            addContract({
                projectId,
                workerId,
                title,
                scope: finalScope,
                startDate,
                endDate,
                totalAmount,
                installments: finalInstallments
            })
        }
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-background w-full max-w-2xl rounded-xl border border-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">✕</button>

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    {initialData ? "Edit Contract" : "Create Employment Contract"}
                </h2>

                <div className="space-y-6">
                    {/* Header Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Project</label>
                            <div className="relative">
                                <Layout className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <select
                                    value={projectId}
                                    onChange={e => setProjectId(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg"
                                >
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Worker / Contractor</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <select
                                    value={workerId}
                                    onChange={e => setWorkerId(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg"
                                >
                                    {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.role})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground font-bold uppercase">Contract Title</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Electrical System Installation Phase 1"
                            className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-bold uppercase">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg" />
                        </div>
                    </div>

                    {/* Scope of Work - Mode Toggle */}
                    <div className="space-y-3 border-t border-border pt-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold">Scope of Work (ขอบเขตงาน)</label>
                            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setScopeMode("items")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${scopeMode === "items" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <List className="w-3.5 h-3.5" /> เลือกเป็นข้อ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScopeMode("freeform")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${scopeMode === "freeform" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <AlignLeft className="w-3.5 h-3.5" /> พิมพ์เอง
                                </button>
                            </div>
                        </div>

                        {scopeMode === "items" ? (
                            <div className="space-y-2">
                                {scopeItems.map((item, idx) => (
                                    <div key={item.id} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                                        <input
                                            value={item.text}
                                            onChange={e => handleScopeItemChange(item.id, e.target.value)}
                                            placeholder="รายละเอียดงาน..."
                                            className="flex-1 px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                                        />
                                        {scopeItems.length > 1 && (
                                            <button onClick={() => handleRemoveScopeItem(item.id)} className="p-1.5 text-muted-foreground hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={handleAddScopeItem} className="text-xs flex items-center gap-1 text-primary hover:underline font-medium">
                                    <Plus className="w-3 h-3" /> เพิ่มรายการ
                                </button>
                            </div>
                        ) : (
                            <textarea
                                value={scopeFreeform}
                                onChange={e => setScopeFreeform(e.target.value)}
                                placeholder="พิมพ์รายละเอียดขอบเขตงานทั้งหมด..."
                                className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg min-h-[100px]"
                            />
                        )}
                    </div>

                    {/* Payment Installments */}
                    <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold">Payment Installments (งวดการจ่าย)</label>
                            <span className="text-sm font-mono text-muted-foreground">Total: ฿{totalAmount.toLocaleString()}</span>
                        </div>

                        <div className="space-y-4">
                            {installments.map((inst, idx) => (
                                <div key={idx} className="p-3 bg-muted/20 rounded-lg border border-border/50 space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            value={inst.description}
                                            onChange={e => handleInstallmentChange(idx, 'description', e.target.value)}
                                            placeholder="Description"
                                            className="flex-1 px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={inst.amount}
                                            onChange={e => handleInstallmentChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                                            placeholder="Amount"
                                            className="w-28 px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-right"
                                        />
                                        <input
                                            type="date"
                                            value={inst.dueDate}
                                            onChange={e => handleInstallmentChange(idx, 'dueDate', e.target.value)}
                                            className="w-36 px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                                        />
                                        <button onClick={() => handleRemoveInstallment(idx)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <input
                                        value={inst.paymentDetails || ""}
                                        onChange={e => handleInstallmentChange(idx, 'paymentDetails', e.target.value)}
                                        placeholder="รายละเอียดการจ่าย (เช่น โอนเงิน, เงินสด, เช็ค...)"
                                        className="w-full px-3 py-2 bg-muted/20 border border-border/50 rounded-lg text-xs text-muted-foreground"
                                    />
                                </div>
                            ))}
                            <button onClick={handleAddInstallment} className="text-xs flex items-center gap-1 text-primary hover:underline font-medium">
                                <Plus className="w-3 h-3" /> Add Installment
                            </button>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="border-t border-border pt-4">
                        <label className="text-sm font-bold flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            หมายเหตุ / Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="เงื่อนไขเพิ่มเติม, ข้อตกลงพิเศษ, หรือหมายเหตุอื่นๆ..."
                            className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg min-h-[80px]"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg hover:opacity-90 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            {initialData ? "Save Changes" : "Create Contract"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
