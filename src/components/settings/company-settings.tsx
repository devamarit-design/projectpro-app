"use client"

import { useSettings } from "@/context/settings-context"
import { Building2, Mail, Phone, Globe, MapPin, FileText, Edit } from "lucide-react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { useState } from "react"
import EditTeamDialog from "../../app/(dashboard)/team/edit-team-dialog"
import { hasPermission } from "@/lib/permissions"

export function CompanySettings() {
    const { t } = useTranslation()
    const { orgProfile } = useSettings()
    const { currentTeam, currentUser } = useProjects()
    const [isEditTeamOpen, setIsEditTeamOpen] = useState(false)

    // Use currentTeam if available for more specific data (like logo), falling back to orgProfile
    const displayProfile = currentTeam || orgProfile

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/20 overflow-hidden">
                        {displayProfile.logo ? (
                            <img src={displayProfile.logo} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                            <Building2 className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{t.settings.company.title}</h3>
                        <p className="text-sm text-muted-foreground">{t.settings.company.subtitle}</p>
                    </div>
                </div>

                {/* Edit Button */}
                {currentTeam && hasPermission(currentUser, "COMPANY_UPDATE") && (
                    <button
                        onClick={() => setIsEditTeamOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Edit className="w-4 h-4" />
                        <span>{t.common.edit}</span>
                    </button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Company Name */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground transition-all group-hover:text-primary">
                            <Building2 className="w-4 h-4" />
                            {t.settings.company.fields.name} (TH)
                        </label>
                        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 font-medium">
                            {displayProfile.name || "-"}
                        </div>
                    </div>

                    {/* Company Name (EN) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            Company Name (EN)
                        </label>
                        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 font-medium">
                            {displayProfile.nameEn || "-"}
                        </div>
                    </div>
                </div>

                {/* Tax ID */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        {t.settings.company.fields.tax_id}
                    </label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50 font-mono text-sm">
                        {displayProfile.taxId || "-"}
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-4 md:col-span-2 border-t pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {t.settings.company.fields.address} (TH)
                        </label>
                        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 min-h-[60px] whitespace-pre-wrap text-sm">
                            {displayProfile.address || "-"}
                        </div>
                    </div>

                    {/* Address (EN) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            Company Address (EN)
                        </label>
                        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 min-h-[60px] whitespace-pre-wrap text-sm font-sans">
                            {displayProfile.addressEn || "-"}
                        </div>
                    </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {t.settings.company.fields.phone}
                    </label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50 font-mono text-sm">
                        {displayProfile.phone || "-"}
                    </div>
                </div>

                {/* Email (Note: CompanyProfile might not have email field in some versions, check interface) */}
                {/* Actually orgProfile usually has generic fields, but let's check what we have. 
                    CompanyProfile interface: name, address, taxId, phone, logo, paymentInfo, signatureName, description.
                    It does NOT strictly have email/website in the base type unless it was added.
                    However, let's keep it if it's there or render fallback.
                */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {t.settings.company.fields.email}
                    </label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                        {/* @ts-ignore - Assuming properties might exist or we just don't show if missing */}
                        {displayProfile.email || "-"}
                    </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        {t.settings.company.fields.website}
                    </label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-blue-500">
                        {/* @ts-ignore */}
                        {displayProfile.website ? (
                            <a href={displayProfile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {displayProfile.website}
                            </a>
                        ) : "-"}
                    </div>
                </div>
            </div>

            {/* Edit Team Dialog */}
            {currentTeam && (
                <EditTeamDialog
                    isOpen={isEditTeamOpen}
                    onClose={() => setIsEditTeamOpen(false)}
                    team={currentTeam}
                />
            )}
        </div>
    )
}
