"use client"

import * as React from "react"
import { X, Building2, Upload } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects, Team } from "@/context/project-context"
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

    React.useEffect(() => {
        if (isOpen && team) {
            setFormData({
                name: team.name,
                description: team.description || "",
                address: team.address || "",
                taxId: team.taxId || "",
                phone: team.phone || "",
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
                            <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center text-4xl border-2 border-dashed border-muted-foreground/25 relative overflow-hidden group">
                                {formData.logo ? (
                                    <div className="flex items-center justify-center w-full h-full text-4xl">
                                        {/* If it's an emoji (short), show text. If URL, showImg. Simple heuristic: length > 4 */}
                                        {formData.logo.length > 4 ? (
                                            <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            formData.logo
                                        )}
                                    </div>
                                ) : (
                                    <Building2 className="w-10 h-10 text-muted-foreground/50" />
                                )}

                                {/* Overlay for upload hint (Mock) */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    name="logo"
                                    placeholder="Emoji or Image URL"
                                    value={formData.logo || ""}
                                    onChange={handleChange}
                                    className="text-center px-3 py-1.5 rounded-lg border bg-background text-sm w-48"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Enter an emoji (e.g. 🏢) or an image URL.</p>
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
                                className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                placeholder="Office Address"
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
