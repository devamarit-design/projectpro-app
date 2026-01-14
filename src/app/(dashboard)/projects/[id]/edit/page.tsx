"use client"

import { useState, useEffect, use } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Calendar, MapPin, DollarSign, User, FileText } from "lucide-react"
import Link from "next/link"

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useTranslation()
    const { updateProject, getProject } = useProjects()
    const router = useRouter()
    const { id } = use(params)
    const project = getProject(id)

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
        router.push(`/projects/${id}`)
    }

    // Mock customers for dropdown
    const customers = [
        { id: 1, name: "TechStart Inc." },
        { id: 2, name: "Mr. Anderson" },
        { id: 3, name: "Fashion Co." },
        { id: 4, name: "City Developers" }
    ]

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/projects/${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-sans">Edit Project</h1>
                    <p className="text-muted-foreground">Update project details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Project Details Section */}
                <div className="glass-card rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold">Project Details</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Modern Office Complex"
                                className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Customer <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none"
                                    value={formData.customer}
                                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Location</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Project site address"
                                    className="w-full h-12 rounded-xl bg-background/50 border border-white/10 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
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
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                rows={4}
                                placeholder="Brief description of the project scope..."
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
                        <h2 className="text-lg font-semibold">Timeline & Budget</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date</label>
                            <input
                                type="date"
                                className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date</label>
                            <input
                                type="date"
                                className="w-full h-12 rounded-xl bg-background/50 border border-white/10 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estimated Budget</label>
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
                            <label className="text-sm font-medium">Income / Received (เบิกเงิน)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    className="w-full h-12 rounded-xl bg-background/50 border border-white/10 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.income}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        if (!val.startsWith("฿")) {
                                            setFormData({ ...formData, income: "฿" + val.replace("฿", "") })
                                        } else {
                                            setFormData({ ...formData, income: val })
                                        }
                                    }}
                                />
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Expenses / Costs (ต้นทุนจ่าย)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    className="w-full h-12 rounded-xl bg-background/50 border border-white/10 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.expenses}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        if (!val.startsWith("฿")) {
                                            setFormData({ ...formData, expenses: "฿" + val.replace("฿", "") })
                                        } else {
                                            setFormData({ ...formData, expenses: val })
                                        }
                                    }}
                                />
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cover Image Section */}
                <div className="glass-card rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <Upload className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold">Cover Image</h2>
                    </div>

                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-muted/5 transition-colors cursor-pointer group">
                        <div className="w-16 h-16 rounded-full bg-background border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">Click to upload or drag and drop</h3>
                        <p className="text-sm text-muted-foreground">SVG, PNG, JPG or GIF (max. 3MB)</p>
                        {formData.image && (
                            <div className="mt-4 text-xs text-green-400">Current image URL: {formData.image.substring(0, 30)}...</div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href={`/projects/${id}`}
                        className="px-6 py-3 rounded-xl hover:bg-muted/50 transition-colors font-medium"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-bold hover:scale-105 transition-transform"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    )
}
