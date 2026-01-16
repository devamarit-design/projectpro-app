"use client"

import * as React from "react"
import { X, Phone, MapPin, User, Building, Mail, Edit, Trash2, ArrowRight } from "lucide-react"
import { useProjects, Customer } from "@/context/project-context"
import { cn } from "@/lib/utils"
import Link from "next/link"
import AddCustomerDialog from "./add-customer-dialog"

interface CustomerDetailSheetProps {
    customerId: string | null
    onClose: () => void
}

export default function CustomerDetailSheet({ customerId, onClose }: CustomerDetailSheetProps) {
    const { customers, projects, deleteCustomer } = useProjects()
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

    const customer = React.useMemo(() =>
        customers.find(c => c.id === customerId),
        [customerId, customers]
    )

    // Find Related Projects
    const customerProjects = React.useMemo(() => {
        if (!customer) return []
        return projects.filter(p => p.customer.trim().toLowerCase() === customer.name.trim().toLowerCase())
    }, [customer, projects])

    const handleDelete = () => {
        if (customerId) {
            deleteCustomer(customerId)
            onClose()
        }
    }

    if (!customer) return null

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
                    <div className="h-32 bg-gradient-to-br from-indigo-500/20 via-background to-background relative">
                        <div className="absolute top-4 right-4 text-white">
                            <button
                                onClick={onClose}
                                className="p-2 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 transition-colors"
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
                                customer.type === 'Company' ? "bg-indigo-500 text-white" : "bg-teal-500 text-white"
                            )}>
                                {customer.type === 'Company' ? <Building className="w-10 h-10" /> : <User className="w-10 h-10" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{customer.name}</h2>
                                <p className="text-muted-foreground">{customer.type}</p>
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
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                    title="Delete Customer"
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
                                    <p className="font-mono text-base">{customer.phone || "-"}</p>
                                </div>
                                {customer.phone && (
                                    <a href={`tel:${customer.phone}`} className="p-2 bg-green-500 text-white rounded-lg hover:opacity-90">
                                        <Phone className="w-4 h-4" />
                                    </a>
                                )}
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Email</p>
                                    <p className="font-medium text-sm break-all">{customer.email || "-"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Address</p>
                                    <p className="font-medium text-sm">{customer.address || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Related Projects Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg">Active Projects</h3>
                                <span className="text-sm text-muted-foreground font-medium">{customerProjects.length} Projects</span>
                            </div>

                            {customerProjects.length > 0 ? (
                                <div className="space-y-3">
                                    {customerProjects.map(project => (
                                        <Link
                                            key={project.id}
                                            href={`/projects/detail?id=${project.id}`}
                                            target="_blank"
                                            className="block group"
                                        >
                                            <div className="glass-card p-4 rounded-xl border border-white/5 hover:border-primary/50 transition-all hover:translate-x-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-base group-hover:text-primary transition-colors">{project.name}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> {project.location}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-muted-foreground">{project.progress}%</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 rounded-xl border border-dashed border-white/10 bg-muted/10">
                                    <p className="text-muted-foreground">No projects linked to this customer.</p>
                                    <p className="text-xs text-muted-foreground/50 mt-1">Projects will appear here when the customer name matches.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <AddCustomerDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                initialData={customer}
            />

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-card border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold">Delete Customer?</h3>
                        <p className="text-muted-foreground text-sm">
                            Are you sure you want to delete <span className="text-foreground font-bold">{customer.name}</span>?
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
