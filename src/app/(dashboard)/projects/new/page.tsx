"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { ArrowLeft, Upload, Calendar as CalendarIcon, User, Loader2 } from "lucide-react" // Added Loader2
import Link from "next/link"
import { useProjects } from "@/context/project-context"
import { uploadImage } from "@/lib/upload" // Added import
import { useRouter } from "next/navigation"
import AddCustomerDialog from "@/components/customers/add-customer-dialog"
import SearchableCombobox from "@/components/ui/searchable-combobox"

export default function NewProjectPage() {
    const { t } = useTranslation()
    const { addProject, customers } = useProjects()
    const router = useRouter()

    const [isUploading, setIsUploading] = useState(false) // Added state

    const [formData, setFormData] = useState({
        name: "",
        customer: "",
        location: "",
        description: "",
        budget: "",
        // income: "", // Removed
        // expenses: "", // Removed
        startDate: "",
        endDate: "",
        image: ""
    })

    // Quick Add Customer State
    const [showAddCustomer, setShowAddCustomer] = useState(false)
    const prevCustomersLength = useRef(customers?.length || 0)

    // Auto-select new customer
    useEffect(() => {
        if (customers && customers.length > prevCustomersLength.current) {
            const newCustomer = customers[customers.length - 1]
            setFormData(prev => ({ ...prev, customer: newCustomer.name }))
            prevCustomersLength.current = customers.length
        }
    }, [customers])

    // Added upload handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            let url = ""
            const uploadPath = currentTeam?.id ? `organizations/${currentTeam.id}/projects/covers` : "projects/covers"
            try {
                url = await uploadImage(file, uploadPath)
            } catch (err) {
                console.warn("Storage upload failed, falling back to DataURL", err)
                url = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })
            }
            setFormData(prev => ({ ...prev, image: url }))
        } catch (error) {
            console.error("Upload failed", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Basic validation
        if (!formData.name || !formData.customer) {
            alert("Please fill in required fields")
            return
        }

        addProject({
            name: formData.name,
            customer: formData.customer,
            location: formData.location,
            description: formData.description,
            status: "Planning",
            progress: 0,
            budget: formData.budget ? `฿${parseInt(formData.budget).toLocaleString()}` : "฿0",
            income: "฿0",
            expenses: "฿0",
            startDate: formData.startDate,
            endDate: formData.endDate,
            image: formData.image || "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80" // Use uploaded or default
        })

        router.push("/projects")
    }

    return (
        <div className="space-y-6 pb-20 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/projects" className="p-2 -ml-2 hover:bg-muted/50 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary font-sans">{t.projects.create_project}</h1>
                    <p className="text-muted-foreground text-sm">{t.projects.manage_projects}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-6">
                {/* Project Info */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold border-b border-border/50 pb-2">{t.projects.edit.sections.details}</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.projects.edit.fields.name} <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            placeholder={t.projects.edit.placeholders.name}
                            className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.customer} <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="relative">
                                    <SearchableCombobox
                                        options={[
                                            { value: "NEW_CUSTOMER", label: `+ ${t.income.dialog?.create_customer || "Create New Customer"}`, description: "สร้างลูกค้าใหม่" },
                                            ...customers.map(c => ({ value: c.name, label: c.name, description: c.type || "Customer" }))
                                        ]}
                                        value={formData.customer}
                                        onChange={(val) => {
                                            if (val === "NEW_CUSTOMER") {
                                                setShowAddCustomer(true)
                                            } else {
                                                setFormData({ ...formData, customer: val })
                                            }
                                        }}
                                        placeholder={t.projects.edit.placeholders.select_customer}
                                        searchPlaceholder="ค้นหาลูกค้า..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.location}</label>
                            <input
                                type="text"
                                placeholder="Link Google Maps หรือชื่อสถานที่"
                                className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.projects.edit.fields.desc}</label>
                        <textarea
                            rows={3}
                            placeholder={t.projects.edit.placeholders.desc}
                            className="w-full p-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                {/* Financial & Timeline */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold border-b border-border/50 pb-2">{t.projects.edit.sections.timeline}</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.start_date}</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full h-11 pl-4 pr-10 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.end_date}</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full h-11 pl-4 pr-10 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.budget}</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold border-b border-border/50 pb-2">{t.projects.edit.sections.image}</h2>
                    <label className="border-2 border-dashed border-border rounded-xl min-h-[200px] flex flex-col items-center justify-center p-6 bg-background/50 cursor-pointer hover:bg-muted/50 transition-colors group relative overflow-hidden">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-sm text-muted-foreground">Uploading...</span>
                            </div>
                        ) : formData.image ? (
                            <>
                                <img src={formData.image} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                                <div className="z-10 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-white uppercase tracking-wider bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Change Cover</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="p-3 bg-muted rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium">{t.projects.edit.upload_area.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t.projects.edit.upload_area.subtitle}</p>
                            </div>
                        )}
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-6">
                    <Link href="/projects" className="flex-1 h-11 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors font-medium">
                        {t.common.cancel}
                    </Link>
                    <button type="submit" className="flex-1 h-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium shadow-lg shadow-primary/20">
                        {t.projects.manage_projects.split(' ')[0] === "Manage" ? "Create Project" : "สร้างโครงการ"}
                    </button>
                </div>
            </form>

            <AddCustomerDialog
                isOpen={showAddCustomer}
                onClose={() => setShowAddCustomer(false)}
            />
        </div>
    )
}
