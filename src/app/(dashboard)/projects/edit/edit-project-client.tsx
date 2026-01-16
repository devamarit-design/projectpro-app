"use client"

import { useState, useEffect, use, useMemo, useRef } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Calendar, MapPin, DollarSign, User, FileText, Loader2 } from "lucide-react"
import { uploadImage } from "@/lib/upload"
import Link from "next/link"
import AddCustomerDialog from "@/components/customers/add-customer-dialog"

import { useSearchParams } from "next/navigation"

export default function EditProjectClient() {
    const searchParams = useSearchParams()
    const id = searchParams.get("id") || ""
    const { t } = useTranslation()
    const { updateProject, getProject, expenses, incomes, customers } = useProjects()
    const router = useRouter()
    // const { id } = use(params) // Removed
    const project = getProject(id)

    // Calculate income and expenses from actual data
    const calculatedIncome = useMemo(() => {
        return incomes
            .filter(i => i.projectId === id && (i.status === 'Paid' || i.status === 'Accepted'))
            .reduce((sum, i) => sum + i.grandTotal, 0)
    }, [incomes, id])

    const calculatedExpenses = useMemo(() => {
        return expenses
            .filter(e => e.projectId === id || e.items?.some(item => item.projectId === id))
            .reduce((sum, e) => sum + e.totalValue, 0)
    }, [expenses, id])

    const [formData, setFormData] = useState({
        name: "",
        customer: "",
        location: "",
        description: "",
        startDate: "",
        endDate: "",
        budget: "",
        income: "",
        expenses: "",
        status: "" as any,
        image: ""
    })
    const [isUploading, setIsUploading] = useState(false)

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const url = await uploadImage(file, "projects/covers")
            setFormData(prev => ({ ...prev, image: url }))
        } catch (error) {
            console.error("Upload failed", error)
        } finally {
            setIsUploading(false)
        }
    }

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                customer: project.customer,
                location: project.location,
                description: project.description || "",
                startDate: project.startDate,
                endDate: project.endDate,
                budget: project.budget,
                income: project.income || "",
                expenses: project.expenses || "",
                status: project.status,
                image: project.image
            })
        }
    }, [project])

    if (!project) {
        return <div className="p-8 text-center">Project not found</div>
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateProject(id, {
            ...formData,
            // Keep existing status and progress or allow editing them too? 
            // For now, simpler to just update details.
        })
        router.push(`/projects/detail?id=${id}`)
    }



    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/projects/detail?id=${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-sans">{t.projects.edit.title}</h1>
                    <p className="text-muted-foreground">{t.projects.edit.subtitle}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Project Details Section */}
                <div className="glass-card rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold">{t.projects.edit.sections.details}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.name} <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                placeholder={t.projects.edit.placeholders.name}
                                className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.customer} <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none"
                                    value={formData.customer}
                                    onChange={(e) => {
                                        if (e.target.value === "NEW_CUSTOMER") {
                                            setShowAddCustomer(true)
                                        } else {
                                            setFormData({ ...formData, customer: e.target.value })
                                        }
                                    }}
                                >
                                    <option value="">{t.projects.edit.placeholders.select_customer}</option>
                                    <option value="NEW_CUSTOMER" className="text-primary font-bold bg-primary/10">
                                        + {t.income.dialog?.create_customer || "Create New Customer"}
                                    </option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.location}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t.projects.edit.placeholders.location}
                                    className="w-full h-12 rounded-xl bg-background/50 border border-white/10 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.status}</label>
                            <select
                                className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="Planning">Planning</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.desc}</label>
                            <textarea
                                rows={4}
                                placeholder={t.projects.edit.placeholders.desc}
                                className="w-full rounded-xl bg-background/50 border border-white/10 p-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Timeline & Budget Section */}
                <div className="glass-card rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold">{t.projects.edit.sections.timeline}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.start_date}</label>
                            <input
                                type="date"
                                className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.end_date}</label>
                            <input
                                type="date"
                                className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.budget}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    className="w-full h-12 rounded-xl bg-background/50 border border-white/10 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.budget}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        if (!val.startsWith("฿")) {
                                            setFormData({ ...formData, budget: "฿" + val.replace("฿", "") })
                                        } else {
                                            setFormData({ ...formData, budget: val })
                                        }
                                    }}
                                />
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.income}</label>
                            <div className="relative">
                                <div className="w-full h-12 rounded-xl bg-green-500/10 border border-green-500/20 pl-11 pr-4 flex items-center text-green-500 font-medium">
                                    ฿{calculatedIncome.toLocaleString()}
                                </div>
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                            </div>
                            <p className="text-xs text-muted-foreground">Auto-calculated from paid incomes</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.projects.edit.fields.expenses}</label>
                            <div className="relative">
                                <div className="w-full h-12 rounded-xl bg-red-500/10 border border-red-500/20 pl-11 pr-4 flex items-center text-red-500 font-medium">
                                    ฿{calculatedExpenses.toLocaleString()}
                                </div>
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                            </div>
                            <p className="text-xs text-muted-foreground">Auto-calculated from expenses</p>
                        </div>
                    </div>
                </div>

                {/* Cover Image Section */}
                <div className="glass-card rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <Upload className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold">{t.projects.edit.sections.image}</h2>
                    </div>

                    <label className="border-2 border-dashed border-white/10 rounded-xl min-h-[200px] flex flex-col items-center justify-center p-6 bg-background/50 cursor-pointer hover:bg-muted/5 transition-colors group relative overflow-hidden">
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
                                <div className="w-16 h-16 rounded-full bg-background border border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium mb-1">{t.projects.edit.upload_area.title}</h3>
                                <p className="text-sm text-muted-foreground">{t.projects.edit.upload_area.subtitle}</p>
                            </div>
                        )}
                    </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href={`/projects/detail?id=${id}`}
                        className="px-6 py-3 rounded-xl hover:bg-muted/50 transition-colors font-medium"
                    >
                        {t.common.cancel}
                    </Link>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-bold hover:scale-105 transition-transform"
                    >
                        {t.common.save}
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
