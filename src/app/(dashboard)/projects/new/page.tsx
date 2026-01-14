"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { ArrowLeft, Upload, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"
import { useProjects } from "@/context/project-context"
import { useRouter } from "next/navigation"

export default function NewProjectPage() {
    const { t } = useTranslation()
    const { addProject } = useProjects()
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: "",
        customer: "",
        location: "",
        description: "",
        budget: "",
        income: "", // New field for initial received payment
        expenses: "", // Initial cost
        startDate: "",
        endDate: "",
        image: "" // Keeping empty for now, or could set a default
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Basic validation
        if (!formData.name || !formData.customer) {
            alert("Please fill in required fields")
            return
        }

        addProject({
            name: formData.name,
            customer: formData.customer === "1" ? "ABC Corp" : formData.customer === "2" ? "Mr. Smith" : "XYZ Ltd", // Simple mapping for mock
            location: formData.location,
            description: formData.description,
            status: "Planning",
            progress: 0,
            budget: formData.budget ? `฿${parseInt(formData.budget).toLocaleString()}` : "฿0",
            income: formData.income ? `฿${parseInt(formData.income).toLocaleString()}` : "฿0",
            expenses: formData.expenses ? `฿${parseInt(formData.expenses).toLocaleString()}` : "฿0",
            startDate: formData.startDate,
            endDate: formData.endDate,
            image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80" // Default image for now
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
                    <h1 className="text-2xl font-bold tracking-tight text-primary font-sans">New Project</h1>
                    <p className="text-muted-foreground text-sm">Create a new construction project tracking</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-6">
                {/* Project Info */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold border-b border-border/50 pb-2">Project Details</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Villa Renovations"
                            className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Customer <span className="text-red-500">*</span></label>
                            <select
                                required
                                className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.customer}
                                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                            >
                                <option value="">Select Customer</option>
                                <option value="1">ABC Corp</option>
                                <option value="2">Mr. Smith</option>
                                <option value="3">XYZ Ltd</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <input
                                type="text"
                                placeholder="e.g. Bangkok"
                                className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            rows={3}
                            placeholder="Project scope and details..."
                            className="w-full p-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                {/* Financial & Timeline */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold border-b border-border/50 pb-2">Timeline & Budget</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date</label>
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
                            <label className="text-sm font-medium">End Date</label>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estimated Budget (THB)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Initial Expenses / Costs (THB)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                                value={formData.expenses}
                                onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Income / Received (THB)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full h-11 px-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                                value={formData.income}
                                onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold border-b border-border/50 pb-2">Cover Image</h2>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="p-3 bg-muted rounded-full mb-3">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Click to upload cover image</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-6">
                    <Link href="/projects" className="flex-1 h-11 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors font-medium">
                        Cancel
                    </Link>
                    <button type="submit" className="flex-1 h-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium shadow-lg shadow-primary/20">
                        Create Project
                    </button>
                </div>
            </form>
        </div>
    )
}
