"use client"

import * as React from "react"
import { X, User, Building, MapPin, Phone, Star, Tag, Check, Info, Camera, Loader2 } from "lucide-react"
import { useProjects, User as UserType, Vendor as VendorType, Worker as WorkerType } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { uploadImage } from "@/lib/upload"

interface AddPartnerDialogProps {
    isOpen: boolean
    onClose: () => void
    defaultType?: "Person" | "Business"
    initialData?: WorkerType | VendorType | null // Changed UserType to WorkerType for Partners
}

export default function AddPartnerDialog({ isOpen, onClose, defaultType = "Person", initialData }: AddPartnerDialogProps) {
    const { addWorker, addVendor, updateWorker, updateVendor } = useProjects()
    const { currentOrg } = useOrganization()
    const { t } = useTranslation()
    const [type, setType] = React.useState<"Person" | "Business">(defaultType)

    // Form State
    const [name, setName] = React.useState("")
    const [roleOrCategory, setRoleOrCategory] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [lineId, setLineId] = React.useState("")
    const [location, setLocation] = React.useState("")
    const [rating, setRating] = React.useState(5)
    const [avatar, setAvatar] = React.useState("")
    const [isUploading, setIsUploading] = React.useState(false)

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
                setAvatar(initialData.avatar || "")
            } else {
                // New Mode
                setType(defaultType)
                setName("")
                setRoleOrCategory(defaultType === "Person" ? "Technician" : "Material")
                setPhone("")
                setLineId("")
                setLocation("")
                setRating(5)
                setAvatar("")
            }
        }
    }, [isOpen, defaultType, initialData])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || isUploading) return

        if (initialData) {
            // Update
            if (type === "Person") {
                updateWorker(initialData.id, {
                    name,
                    role: roleOrCategory as any,
                    phone,
                    lineId,
                    location,
                    rating,
                    avatar
                })
            } else {
                updateVendor(initialData.id, {
                    name,
                    category: roleOrCategory as any,
                    phone,
                    lineId,
                    location,
                    rating,
                    avatar
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
                    skills: [],
                    avatar
                })
            } else {
                addVendor({
                    name,
                    category: roleOrCategory as any,
                    phone,
                    lineId,
                    location,
                    rating,
                    products: [],
                    avatar
                })
            }
        }
        onClose()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            if (!currentOrg?.id) throw new Error("Organization not found")
            const baseDir = type === "Person" ? "partners/workers" : "partners/vendors"
            const path = `organizations/${currentOrg.id}/${baseDir}`
            const url = await uploadImage(file, path)
            setAvatar(url)
        } catch (error) {
            console.error("Upload failed", error)
        } finally {
            setIsUploading(false)
        }
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

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="relative group">
                            <div className={cn(
                                "w-24 h-24 rounded-3xl overflow-hidden border-4 border-background shadow-xl flex items-center justify-center bg-muted/50 transition-all group-hover:opacity-80",
                                type === "Business" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    type === "Business" ? <Building className="w-10 h-10" /> : <User className="w-10 h-10" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-xl shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                />
                            </label>
                            {avatar && (
                                <button
                                    type="button"
                                    onClick={() => setAvatar("")}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {type === "Person" ? t.common?.profile_picture || "Profile Picture" : t.common?.logo || "Business Logo"}
                        </p>
                    </div>

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
                                <input
                                    value={roleOrCategory}
                                    onChange={(e) => setRoleOrCategory(e.target.value)}
                                    placeholder="e.g. Technician (ช่างทั่วไป)"
                                    className="w-full h-11 px-4 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                />
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

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {t.dialogs.add_project.location}
                            </label>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Link Google Maps หรือชื่อสถานที่"
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
                            disabled={isUploading}
                            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {initialData ? t.dialogs.add_partner.update : t.dialogs.add_partner.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
