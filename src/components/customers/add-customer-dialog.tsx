"use client"

import * as React from "react"
import { X, User, Building, MapPin, Phone, Check, Info, Mail, CreditCard } from "lucide-react"
import { useProjects, Customer } from "@/context/project-context"
import { cn } from "@/lib/utils"

interface AddCustomerDialogProps {
    isOpen: boolean
    onClose: () => void
    initialData?: Customer | null
}

export default function AddCustomerDialog({ isOpen, onClose, initialData }: AddCustomerDialogProps) {
    const { addCustomer, updateCustomer } = useProjects()
    const [type, setType] = React.useState<"Person" | "Company">("Person")

    // Form State
    const [name, setName] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [lineId, setLineId] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [address, setAddress] = React.useState("")
    const [taxId, setTaxId] = React.useState("")

    // Reset/Fill form
    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                setName(initialData.name)
                setType(initialData.type)
                setPhone(initialData.phone || "")
                setLineId(initialData.lineId || "")
                setEmail(initialData.email || "")
                setAddress(initialData.address || "")
                setTaxId(initialData.taxId || "")
            } else {
                // New Mode
                setType("Person")
                setName("")
                setPhone("")
                setLineId("")
                setEmail("")
                setAddress("")
                setTaxId("")
            }
        }
    }, [isOpen, initialData])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        if (initialData) {
            updateCustomer(initialData.id, {
                name,
                type,
                phone,
                lineId,
                email,
                address,
                taxId
            })
        } else {
            addCustomer({
                name,
                type,
                phone,
                lineId,
                email,
                address,
                taxId
            })
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 font-sans">
            <div
                className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">{initialData ? "Edit Customer" : "Add New Customer"}</h2>
                        <p className="text-sm text-muted-foreground mt-1">Manage customer profile and details.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Type Selection */}
                        <div className="grid grid-cols-2 gap-3 p-1 bg-muted/30 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setType("Person")}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                    type === "Person"
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <User className="w-4 h-4" /> Person
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("Company")}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                    type === "Company"
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <Building className="w-4 h-4" /> Company
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {type === "Person" ? "Full Name" : "Company Name"} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={type === "Person" ? "e.g. John Doe" : "e.g. Tech Corp Ltd."}
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>

                            {/* Contact Info Group */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> Phone
                                    </label>
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="08x-xxx-xxxx"
                                        className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Line ID
                                    </label>
                                    <input
                                        value={lineId}
                                        onChange={(e) => setLineId(e.target.value)}
                                        placeholder="@lineid"
                                        className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="contact@email.com"
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Address
                                </label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter full address..."
                                    className="w-full h-24 p-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                />
                            </div>

                            {/* Edit Tax ID if Company */}
                            {type === "Company" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <CreditCard className="w-3 h-3" /> Tax ID
                                    </label>
                                    <input
                                        value={taxId}
                                        onChange={(e) => setTaxId(e.target.value)}
                                        placeholder="1234567890123"
                                        className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                            )}
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
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="customer-form"
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" /> {initialData ? "Update Customer" : "Save Customer"}
                    </button>
                </div>
            </div>
        </div>
    )
}
