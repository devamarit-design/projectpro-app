import * as React from "react"
import { X, Phone, MapPin, Star, User, Building, History, CheckSquare, MessageCircle, MoreHorizontal, Mail, Calendar, DollarSign, Wallet, Check, Edit, Trash2, Archive } from "lucide-react"
import { useProjects, User as UserType, Vendor as VendorType, Worker as WorkerType, Expense } from "@/context/project-context"
import { cn } from "@/lib/utils"
// Reuse AddPartnerDialog for editing
import AddPartnerDialog from "./add-partner-dialog"

interface PartnerDetailSheetProps {
    partnerId: string | null
    type: "Worker" | "Vendor" | null
    onClose: () => void
}

export default function PartnerDetailSheet({ partnerId, type, onClose }: PartnerDetailSheetProps) {
    const { workers, vendors, expenses, projects, deleteWorker, deleteVendor, updateWorker, updateVendor } = useProjects()
    const [activeTab, setActiveTab] = React.useState<"history" | "tasks">("history")

    // Edit State
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

    const partner = React.useMemo(() => {
        if (!partnerId || !type) return null
        if (type === "Worker") {
            return workers.find(u => u.id === partnerId)
        } else {
            return vendors.find(v => v.id === partnerId)
        }
    }, [partnerId, type, workers, vendors])

    const relevantExpenses = React.useMemo(() => {
        if (!partner) return []
        return expenses.filter(e =>
            e.payee === partner.name ||
            e.vendor === partner.name ||
            (type === "Vendor" && e.payee === (partner as VendorType).name)
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [partner, expenses, type])

    const relevantTasks = React.useMemo(() => {
        if (!partner || type !== "Worker") return []
        const userTasks: { task: any, project: any }[] = []
        projects.forEach(p => {
            p.tasks?.forEach(t => {
                if (t.assignedTo === partner.name) {
                    userTasks.push({ task: t, project: p })
                }
            })
        })
        return userTasks
    }, [partner, projects, type])

    const totalPaid = relevantExpenses
        .filter(e => e.status === "Paid")
        .reduce((sum, e) => sum + e.totalValue, 0)

    // Deletion Logic
    const handleDelete = () => {
        if (!partnerId || !type) return

        if (type === "Worker") {
            deleteWorker(partnerId)
        } else {
            deleteVendor(partnerId)
        }
        setShowDeleteConfirm(false)
        onClose()
    }

    // Archive Logic
    const handleArchive = () => {
        if (!partnerId || !type || !partner) return

        const newStatus = partner.status === 'Inactive' ? 'Active' : 'Inactive'

        if (type === "Worker") {
            updateWorker(partnerId, { status: newStatus })
        } else {
            updateVendor(partnerId, { status: newStatus })
        }
    }

    if (!partner) return null

    return (
        <>
            <div className="fixed inset-0 z-[100] flex justify-end font-sans">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Sheet */}
                <div className="relative w-full max-w-md h-full bg-background/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                    {/* Header Image/Banner */}
                    <div className="h-32 bg-gradient-to-br from-primary/20 via-background to-background relative">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={onClose}
                                className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 overflow-y-auto -mt-12 relative z-20 px-4 pb-6 space-y-6">

                        {/* Profile Info */}
                        <div className="text-center space-y-2">
                            <div className={cn(
                                "w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-xl border-4 border-background",
                                type === 'Vendor' ? "bg-orange-500 text-white" : "bg-blue-500 text-white"
                            )}>
                                {type === 'Vendor' ? <Building className="w-10 h-10" /> : <User className="w-10 h-10" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{partner.name}</h2>
                                <p className="text-muted-foreground">
                                    {type === "Worker" ? (partner as WorkerType).role : (partner as VendorType).category}
                                </p>
                                {partner.status === 'Inactive' && (
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                                        Archived
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    onClick={() => setIsEditOpen(true)}
                                    className="px-4 py-2 bg-muted/50 hover:bg-muted rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Edit className="w-4 h-4" /> Edit Profile
                                </button>
                                <button
                                    onClick={handleArchive}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                                        partner.status === 'Inactive'
                                            ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                            : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                                    )}
                                    title={partner.status === 'Inactive' ? "Unarchive Partner" : "Archive Partner"}
                                >
                                    <Archive className="w-4 h-4" />
                                    {partner.status === 'Inactive' ? 'Unarchive' : 'Archive'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                    title="Delete Partner"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-card p-4 rounded-2xl border border-white/5 space-y-4 shadow-lg">
                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Phone</p>
                                    <p className="font-mono text-base">{partner.phone || "-"}</p>
                                </div>
                                {partner.phone && (
                                    <a href={`tel:${partner.phone}`} className="p-2 bg-green-500 text-white rounded-lg hover:opacity-90">
                                        <Phone className="w-4 h-4" />
                                    </a>
                                )}
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Line ID</p>
                                    <p className="font-mono text-base">{partner.lineId || "-"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Location</p>
                                    <p className="font-medium text-sm">{partner.location || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-card border border-white/5 p-4 rounded-2xl space-y-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase">Total Paid</p>
                                <p className="text-xl font-mono font-bold text-green-500">
                                    ฿{totalPaid.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-card border border-white/5 p-4 rounded-2xl space-y-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase">Jobs / Txns</p>
                                <p className="text-xl font-mono font-bold">
                                    {relevantExpenses.length + relevantTasks.length}
                                </p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div>
                            <div className="flex border-b border-white/10 mb-4">
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={cn(
                                        "flex-1 pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors",
                                        activeTab === "history" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                                    )}
                                >
                                    History
                                </button>
                                {type === "Worker" && (
                                    <button
                                        onClick={() => setActiveTab("tasks")}
                                        className={cn(
                                            "flex-1 pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors",
                                            activeTab === "tasks" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                                        )}
                                    >
                                        Active Tasks
                                    </button>
                                )}
                            </div>

                            {/* History Tab */}
                            {activeTab === "history" && (
                                <div className="space-y-3">
                                    {relevantExpenses.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">No transaction history</p>
                                    ) : (
                                        relevantExpenses.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-white/5 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                                                        item.category === 'Labor' ? "bg-orange-500/10" : "bg-blue-500/10"
                                                    )}>
                                                        {item.category === 'Labor' ? "👷" : "📝"}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground">{item.date} • {projects.find(p => p.id === item.projectId)?.name || "General"}</p>
                                                    </div>
                                                </div>
                                                <span className="font-mono font-bold text-sm">
                                                    ฿{item.totalValue.toLocaleString()}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Tasks Tab */}
                            {activeTab === "tasks" && type === "Worker" && (
                                <div className="space-y-3">
                                    {relevantTasks.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">No active tasks</p>
                                    ) : (
                                        relevantTasks.map(({ task, project }) => (
                                            <div key={task.id} className="p-3 bg-card border border-white/5 rounded-xl space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium text-sm">{task.title}</p>
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                        task.priority === 'High' ? "bg-red-500/10 text-red-500" :
                                                            task.priority === 'Medium' ? "bg-yellow-500/10 text-yellow-500" :
                                                                "bg-green-500/10 text-green-500"
                                                    )}>{task.priority}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Building className="w-3 h-3" /> {project.name}
                                                </p>
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-xs text-muted-foreground">Due: {task.dueDate || "No date"}</span>
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        task.status === 'Done' ? "text-green-500" : "text-orange-500"
                                                    )}>{task.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog reuse */}
            <AddPartnerDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                initialData={partner} // Pass current partner data
            />

            {/* Delete Confirmation Alert (Simple custom UI) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-card border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold">Delete Partner?</h3>
                        <p className="text-muted-foreground text-sm">
                            Are you sure you want to delete <span className="text-foreground font-bold">{partner.name}</span>?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
