"use client"

import * as React from "react"
import { X, Building2, Upload } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects, Team } from "@/context/project-context"
import { uploadImage } from "@/lib/upload"
import { cn } from "@/lib/utils"

interface EditTeamDialogProps {
    isOpen: boolean
    onClose: () => void
    team: Team
}

export default function EditTeamDialog({ isOpen, onClose, team }: EditTeamDialogProps) {
    const { t } = useTranslation()
    const { updateCompanyProfile } = useProjects()

    // We can't update 'name' via updateCompanyProfile easily because it's derived?
    // Actually project-context says: const updatedTeam: Team = { ...currentTeam, ...updates }
    // So we can update name.

    const [formData, setFormData] = React.useState<Partial<Team>>({})
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const url = await uploadImage(file, "team/logo")
            setFormData(prev => ({ ...prev, logo: url }))
        } catch (error) {
            console.error("Logo upload failed:", error)
        } finally {
            setIsUploading(true) // Keep uploading state for a split second to show success? No, set to false.
            setIsUploading(false)
        }
    }

    React.useEffect(() => {
        if (isOpen && team) {
            setFormData({
                name: team.name,
                nameEn: team.nameEn || "",
                description: team.description || "",
                address: team.address || "",
                addressEn: team.addressEn || "",
                taxId: team.taxId || "",
                phone: team.phone || "",
                email: team.email || "",
                website: team.website || "",
                logo: team.logo || ""
            })
        }
    }, [isOpen, team])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateCompanyProfile(formData)
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold">{t.team.edit_team}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <form id="edit-team-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Logo / Icon */}
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center text-4xl border-2 border-dashed border-muted-foreground/25 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
                            >
                                {formData.logo ? (
                                    <div className="flex items-center justify-center w-full h-full text-4xl">
                                        {formData.logo.length > 4 ? (
                                            <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            formData.logo
                                        )}
                                    </div>
                                ) : (
                                    <Building2 className="w-10 h-10 text-muted-foreground/50" />
                                )}

                                {isUploading && (
                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                {isUploading ? "Uploading..." : "Click to upload company logo"}
                            </p>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium ml-1">{t.settings.company.fields.name}</label>
                            <input
                                required
                                name="name"
                                value={formData.name || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Team Name"
                            />
                        </div>

                        {/* Name (EN) */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium ml-1">Company Name (English)</label>
                            <input
                                name="nameEn"
                                value={formData.nameEn || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Company Name in English"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium ml-1">Team Description</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                placeholder={t.settings.company.subtitle}
                            />
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium ml-1">{t.settings.company.fields.address}</label>
                            <textarea
                                name="address"
                                rows={2}
                                value={formData.address || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                                placeholder="ลิงก์ Google Maps หรือที่อยู่ภาษาไทย"
                            />
                        </div>

                        {/* Address (EN) */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium ml-1">Company Address (English)</label>
                            <textarea
                                name="addressEn"
                                rows={2}
                                value={formData.addressEn || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                                placeholder="Google Maps Link or address in English"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Tax ID */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium ml-1">{t.settings.company.fields.tax_id}</label>
                                <input
                                    name="taxId"
                                    value={formData.taxId || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium ml-1">{t.settings.company.fields.phone}</label>
                                <input
                                    name="phone"
                                    value={formData.phone || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium ml-1">{t.settings.company.fields.email}</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="contact@company.com"
                                />
                            </div>

                            {/* Website */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium ml-1">{t.settings.company.fields.website}</label>
                                <input
                                    name="website"
                                    type="url"
                                    value={formData.website || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="https://company.com"
                                />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl font-medium hover:bg-muted transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        type="submit"
                        form="edit-team-form"
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:translate-y-0.5 transition-all"
                    >
                        {t.common.save}
                    </button>
                </div>
            </div>
        </div>
    )
}
