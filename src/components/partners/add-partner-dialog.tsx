"use client"

import * as React from "react"
import { X, User, Building, MapPin, Phone, Star, Tag, Check, Info } from "lucide-react"
import { useProjects, User as UserType, Vendor as VendorType, Worker as WorkerType } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"

interface AddPartnerDialogProps {
    isOpen: boolean
    onClose: () => void
    defaultType?: "Person" | "Business"
    initialData?: WorkerType | VendorType | null // Changed UserType to WorkerType for Partners
}

export default function AddPartnerDialog({ isOpen, onClose, defaultType = "Person", initialData }: AddPartnerDialogProps) {
    const { addWorker, addVendor, updateWorker, updateVendor } = useProjects()
    const { t } = useTranslation()
    const [type, setType] = React.useState<"Person" | "Business">(defaultType)

    // Form State
    const [name, setName] = React.useState("")
    const [roleOrCategory, setRoleOrCategory] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [lineId, setLineId] = React.useState("")
    const [location, setLocation] = React.useState("")
    const [rating, setRating] = React.useState(5)

    // Reset/Fill form
    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                setName(initialData.name)
                // Determine Type & Role
                if ("role" in initialData) {
                    setType("Person")
                    setRoleOrCategory(initialData.role)
                } else {
                    setType("Business")
                    setRoleOrCategory(initialData.category)
                }
                setPhone(initialData.phone || "")
                setLineId(initialData.lineId || "")
                setLocation(initialData.location || "")
                setRating(initialData.rating || 5)
            } else {
                // New Mode
                setType(defaultType)
                setName("")
                setRoleOrCategory(defaultType === "Person" ? "Technician" : "Material")
                setPhone("")
                setLineId("")
                setLocation("")
                setRating(5)
            }
        }
    }, [isOpen, defaultType, initialData])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        if (initialData) {
            // Update
            if (type === "Person") {
                updateWorker(initialData.id, {
                    name,
                    role: roleOrCategory as any,
                    phone,
                    lineId,
                    location,
                    rating
                })
            } else {
                updateVendor(initialData.id, {
                    name,
                    category: roleOrCategory as any,
                    phone,
                    lineId,
                    location,
                    rating
                })
            }
        } else {
            // Create
            if (type === "Person") {
                addWorker({
                    name,
                    role: roleOrCategory as any,
                    phone,
                    lineId,
                    location,
                    rating,
                    skills: []
                })
            } else {
                addVendor({
                    name,
                    category: roleOrCategory as any,
                    phone,
                    lineId,
                    location,
                    rating,
                    products: []
                })
            }
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 font-sans">
            <div
                className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">{initialData ? t.dialogs.add_partner.title_edit : t.dialogs.add_partner.title_add}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{initialData ? t.dialogs.add_partner.subtitle_edit : t.dialogs.add_partner.subtitle_add}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Type Selection - Only show if creating new (locking type on edit is safer/simpler) */}
                    {!initialData && (
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
                                <User className="w-4 h-4" /> {t.dialogs.add_partner.person}
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("Business")}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                    type === "Business"
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <Building className="w-4 h-4" /> {t.dialogs.add_partner.business}
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {type === "Person" ? t.dialogs.add_partner.name_person : t.dialogs.add_partner.name_business} <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={type === "Person" ? "e.g. Somchai Builder" : "e.g. SCG Home Solution"}
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        {/* Role / Category */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {type === "Person" ? t.dialogs.add_partner.role_skill : t.dialogs.add_partner.business_category}
                            </label>
                            {type === "Person" ? (
                                <select
                                    value={roleOrCategory}
                                    onChange={(e) => setRoleOrCategory(e.target.value)}
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                >
                                    <option value="Technician">Technician (ช่างทั่วไป)</option>
                                    <option value="Contractor">Contractor (ผู้รับเหมา)</option>
                                    <option value="Foreman">Foreman (หัวหน้างาน)</option>
                                    <option value="Engineer">Engineer (วิศวกร)</option>
                                    <option value="Architect">Architect (สถาปนิก)</option>
                                    <option value="Worker">Worker (คนงาน)</option>
                                </select>
                            ) : (
                                <select
                                    value={roleOrCategory}
                                    onChange={(e) => setRoleOrCategory(e.target.value)}
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                >
                                    <option value="Material">Material Store (ร้านวัสดุ)</option>
                                    <option value="Sub-contract">Sub-contractor Firm (บริษัทรับเหมา)</option>
                                    <option value="Service">Service Provider (บริการ)</option>
                                    <option value="Equipment">Equipment Rental (เช่าเครื่องจักร)</option>
                                    <option value="Other">Other (อื่นๆ)</option>
                                </select>
                            )}
                        </div>

                        {/* Contact Info Group */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {t.profile.fields.phone}
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

                        {/* Location */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {t.dialogs.add_project.location}
                            </label>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Bangkok, Ratchada"
                                className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        {/* Rating */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Star className="w-3 h-3" /> {initialData ? t.dialogs.add_partner.current_rating : t.dialogs.add_partner.initial_rating}
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center border transition-all",
                                            rating >= star
                                                ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500"
                                                : "bg-background border-white/10 text-muted-foreground hover:bg-white/5"
                                        )}
                                    >
                                        <Star className={cn("w-5 h-5", rating >= star && "fill-current")} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors"
                        >
                            {t.common.cancel}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" /> {initialData ? t.dialogs.add_partner.update : t.dialogs.add_partner.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
