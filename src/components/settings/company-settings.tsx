"use client"

import { useSettings } from "@/context/settings-context"
import { Building2, Mail, Phone, Globe, MapPin, FileText, Edit } from "lucide-react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { useState } from "react"
import EditTeamDialog from "../../app/(dashboard)/team/edit-team-dialog"
import { hasPermission } from "@/lib/permissions"
import { useOrganization } from "@/context/organization-context" // Add this import
import { getGoogleMapsUrl } from "@/lib/utils"
// Firebase Imports for Migration Tool
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button" // Ensure Button is imported if used

export function CompanySettings() {
    const { t } = useTranslation()
    const { orgProfile } = useSettings()
    const { currentTeam, currentUser } = useProjects()
    const { currentOrg } = useOrganization() // Get currentOrg from useOrganization
    const [isEditTeamOpen, setIsEditTeamOpen] = useState(false)

    // Use currentTeam if available for more specific data (like logo), falling back to orgProfile
    const displayProfile = currentTeam || orgProfile

    // --- DATA MIGRATION TOOL (TEMPORARY) ---
    const [isMigrating, setIsMigrating] = useState(false)
    const handleFixTaskData = async () => {
        if (!currentOrg) return
        setIsMigrating(true)
        try {
            console.log("Starting Task Data Migration...")
            // 1. Get all tasks in this org (even if orgId missing? No, we can't query them if orgId missing!)
            // We must query by projectId.
            // Get all projects first.
            const projectsRef = collection(db, "projects")
            const qProjects = query(projectsRef, where("orgId", "==", currentOrg.id))
            const projectsSnap = await getDocs(qProjects)
            const projectIds = projectsSnap.docs.map(d => d.id)

            let updatedCount = 0

            for (const projectId of projectIds) {
                // Query tasks for this project (regardless of orgId)
                // We need a composite index for projectId? Or just filtering?
                // `projectId` filter should be enough if we don't have complex composites.
                const tasksRef = collection(db, "tasks")
                const qTasks = query(tasksRef, where("projectId", "==", projectId))
                const tasksSnap = await getDocs(qTasks)

                for (const taskDoc of tasksSnap.docs) {
                    const task = taskDoc.data()
                    if (!task.orgId) {
                        console.log(`Fixing task ${taskDoc.id} (missing orgId)`)
                        await updateDoc(taskDoc.ref, { orgId: currentOrg.id })
                        updatedCount++
                    }
                }
            }
            alert(`Migration complete! Fixed ${updatedCount} tasks.`)

        } catch (error) {
            console.error("Migration failed:", error)
            alert("Migration failed check console.")
        } finally {
            setIsMigrating(false)
        }
    }

    // Placeholder for handleSave and isLoading, as they were in the provided snippet but not defined.
    // Assuming they are part of a larger form submission logic.
    const handleSave = () => console.log("Save changes clicked (placeholder)")
    const isLoading = false

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
                    <p className="text-muted-foreground">Manage your company details and preferences.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={handleFixTaskData} disabled={isMigrating} className="whitespace-nowrap">
                        {isMigrating ? "Fixing..." : "Fix Data (Admin)"}
                    </Button>
                    {/* Original Edit Button, integrated into the new header structure */}
                    {currentTeam && hasPermission(currentTeam?.role, "COMPANY_UPDATE") && (
                        <Button onClick={() => setIsEditTeamOpen(true)} className="whitespace-nowrap">
                            <Edit className="w-4 h-4 mr-2" />
                            <span>{t.common.edit}</span>
                        </Button>
                    )}
                    {/* Placeholder Save Button */}
                    <Button onClick={handleSave} disabled={isLoading} className="whitespace-nowrap">
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

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
                {currentTeam && hasPermission(currentTeam?.role, "COMPANY_UPDATE") && (
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
                            {getGoogleMapsUrl(displayProfile.address) ? (
                                <a
                                    href={getGoogleMapsUrl(displayProfile.address)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {displayProfile.address || "-"}
                                </a>
                            ) : (
                                displayProfile.address || "-"
                            )}
                        </div>
                    </div>

                    {/* Address (EN) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            Company Address (EN)
                        </label>
                        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 min-h-[60px] whitespace-pre-wrap text-sm font-sans">
                            {getGoogleMapsUrl(displayProfile.addressEn) ? (
                                <a
                                    href={getGoogleMapsUrl(displayProfile.addressEn)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {displayProfile.addressEn || "-"}
                                </a>
                            ) : (
                                displayProfile.addressEn || "-"
                            )}
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

            {/* Danger Zone - Only for Owners */}
            {currentTeam && currentTeam?.role === 'Owner' && (
                <div className="pt-10 mt-10 border-t border-red-500/20">
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                        <h3 className="text-red-500 font-bold text-lg mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Danger Zone
                        </h3>
                        <p className="text-sm text-red-500/70 mb-4">
                            Deleting the organization is permanent and cannot be undone. All data including projects, customers, and financial records will be permanently lost.
                        </p>
                        <DeleteOrgButton orgId={currentTeam.id} orgName={currentTeam.name} />
                    </div>
                </div>
            )}
        </div>
    )
}

function DeleteOrgButton({ orgId, orgName }: { orgId: string, orgName: string }) {
    const { deleteOrganization } = useOrganization()
    const [isDeleting, setIsDeleting] = useState(false)
    const { t } = useTranslation()

    const handleDelete = async () => {
        const confirmMessage = `TYPE "${orgName}" TO CONFIRM DELETION`
        const input = window.prompt(`WARNING: This action cannot be undone.\n\nTo confirm, type "${orgName}" in the box below:`)

        if (input === orgName) {
            setIsDeleting(true)
            try {
                await deleteOrganization(orgId)
            } catch (error) {
                alert("Failed to delete organization: " + (error as any).message)
                setIsDeleting(false)
            }
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
            {isDeleting ? 'Deleting...' : 'Delete Organization'}
        </button>
    )
}
