"use client"

import * as React from "react"
import { X, Building, MapPin, Calendar, Check, DollarSign, Upload, ImageIcon, Loader2 } from "lucide-react"
import { useProjects, Project } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { uploadImage } from "@/lib/upload"
import AddCustomerDialog from "@/components/customers/add-customer-dialog"

interface AddProjectDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (projectId: string) => void
}

export default function AddProjectDialog({ isOpen, onClose, onSuccess }: AddProjectDialogProps) {
    const { addProject, customers } = useProjects()
    const { t } = useTranslation()

    // Form State
    const [name, setName] = React.useState("")
    const [customer, setCustomer] = React.useState("") // Just a string for now as per context
    const [location, setLocation] = React.useState("")
    const [budget, setBudget] = React.useState("")
    const [startDate, setStartDate] = React.useState("")
    const [endDate, setEndDate] = React.useState("")
    const [coverImage, setCoverImage] = React.useState<string>("")
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Quick Add Customer State
    const [showAddCustomer, setShowAddCustomer] = React.useState(false)
    const prevCustomersLength = React.useRef(customers?.length || 0)

    // Auto-select new customer
    React.useEffect(() => {
        if (customers && customers.length > prevCustomersLength.current) {
            const newCustomer = customers[customers.length - 1]
            setCustomer(newCustomer.name) // Using Name as Project stores Customer Name
            prevCustomersLength.current = customers.length
        }
    }, [customers])

    React.useEffect(() => {
        if (isOpen) {
            setName("")
            setCustomer("")
            setLocation("")
            setBudget("")
            setStartDate("")
            setEndDate("")
            setCoverImage("")
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file")
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("Image size must be less than 10MB")
            return
        }

        setIsUploading(true)
        try {
            const url = await uploadImage(file, "projects/covers")
            setCoverImage(url)
        } catch (error) {
            console.error("Upload failed:", error)
            alert("Failed to upload image. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        addProject({
            name,
            customer: customer || "Walk-in Customer",
            location: location || "Bangkok",
            status: "Planning",
            progress: 0,
            budget: budget ? `฿${parseInt(budget).toLocaleString()}` : "฿0",
            income: "฿0",
            expenses: "฿0",
            startDate: startDate || new Date().toISOString().split('T')[0],
            endDate: endDate || new Date().toISOString().split('T')[0],
            image: coverImage || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
            description: "Quick added project"
        })

        if (onSuccess) {
            setTimeout(() => {
                onSuccess("")
            }, 100)
        }
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 font-sans"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">{t.dialogs.add_project.title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{t.dialogs.add_project.subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Cover Image Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Cover Image
                            </label>
                            <label
                                className={cn(
                                    "relative w-full h-32 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5",
                                    coverImage ? "border-primary/30" : "border-white/10"
                                )}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <span className="text-xs text-muted-foreground">Uploading...</span>
                                    </div>
                                ) : coverImage ? (
                                    <div className="relative w-full h-full group">
                                        <img
                                            src={coverImage}
                                            alt="Cover preview"
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                            <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Change Image</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Click to upload cover image</span>
                                        <span className="text-[10px] text-muted-foreground/50">PNG, JPG up to 10MB</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {t.dialogs.add_project.name} <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t.dialogs.add_project.placeholders.name}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Building className="w-3 h-3" /> {t.dialogs.add_project.customer}
                            </label>
                            <select
                                value={customer}
                                onChange={(e) => {
                                    if (e.target.value === "NEW_CUSTOMER") {
                                        setShowAddCustomer(true)
                                    } else {
                                        setCustomer(e.target.value)
                                    }
                                }}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                            >
                                <option value="">{t.dialogs.add_project.placeholders.customer}</option>
                                <option value="NEW_CUSTOMER" className="text-primary font-bold bg-primary/10">
                                    + {t.income.dialog?.create_customer || "Create New Customer"}
                                </option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {t.dialogs.add_project.location}
                            </label>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder={t.dialogs.add_project.placeholders.location}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> {t.dialogs.add_project.budget}
                            </label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder={t.dialogs.add_project.placeholders.budget}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {t.dialogs.add_project.start_date}
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {t.dialogs.add_project.end_date}
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                        </div>


                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        type="submit"
                        form="project-form"
                        disabled={isUploading}
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" /> {t.dialogs.add_project.save}
                    </button>
                </div>
            </div>

            <AddCustomerDialog
                isOpen={showAddCustomer}
                onClose={() => setShowAddCustomer(false)}
            />
        </div>
    )
}

