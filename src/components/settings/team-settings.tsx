import { doc, updateDoc, arrayUnion, collection, query, where, getDocs, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useEffect, useState, useRef } from "react"
import { Check, X, Copy, Users, Link as LinkIcon, Shield } from "lucide-react"

import { useSettings } from "@/context/settings-context"
import { useOrganization } from "@/context/organization-context"
import { uploadImage } from "@/lib/upload"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"

export function TeamSettings() {
    const { teamSettings, updateTeamSettings, orgProfile, updateOrgProfile } = useSettings()
    const { currentOrg } = useOrganization()
    const { t } = useTranslation()
    const [isUploading, setIsUploading] = useState(false)
    const [joinRequests, setJoinRequests] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!currentOrg) return

        const fetchRequests = async () => {
            const q = query(
                collection(db, "join_requests"),
                where("orgId", "==", currentOrg.id),
                where("status", "==", "pending")
            )
            const snap = await getDocs(q)
            setJoinRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }

        fetchRequests()
    }, [currentOrg])

    const handleApprove = async (req: any) => {
        try {
            // 1. Add user to org
            await updateDoc(doc(db, "users", req.userId), {
                orgIds: arrayUnion(currentOrg?.id)
            })

            // 2. Delete request (or mark approved)
            await deleteDoc(doc(db, "join_requests", req.id))

            // 3. UI Update
            setJoinRequests(prev => prev.filter(r => r.id !== req.id))

        } catch (error) {
            console.error("Approve failed", error)
        }
    }

    const handleDecline = async (id: string) => {
        try {
            await deleteDoc(doc(db, "join_requests", id))
            setJoinRequests(prev => prev.filter(r => r.id !== id))
        } catch (error) {
            console.error("Decline failed", error)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            if (!currentOrg?.id) throw new Error("Organization not found")
            const url = await uploadImage(file, `organizations/${currentOrg.id}/company/logo`)
            updateOrgProfile({ logo: url })
        } catch (error) {
            console.error("Logo upload failed:", error)
        } finally {
            setIsUploading(false)
        }
    }


    const copyLink = () => {
        if (currentOrg) {
            navigator.clipboard.writeText(currentOrg.id)
        }
        // Would add toast here
    }


    return (
        <div className="space-y-8">

            {joinRequests.length > 0 && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2 text-yellow-500">
                            <Users className="w-5 h-5" />
                            Pending Join Requests
                        </h3>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                        {joinRequests.map(req => (
                            <div key={req.id} className="flex items-center justify-between bg-background/50 p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">{req.userName || req.userEmail}</p>
                                    <p className="text-xs text-muted-foreground">{req.userEmail}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(req)}
                                        className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDecline(req.id)}
                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        {t.team_settings.invitation_link}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Share this Organization ID with new members to let them join.
                    </p>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={currentOrg?.id || "Loading..."}
                                className="flex-1 h-10 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground font-mono"
                            />

                            <button
                                onClick={copyLink}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                {t.team_settings.copy}
                            </button>
                        </div>

                        <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/20">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">{t.team_settings.enable_link}</label>
                                <p className="text-xs text-muted-foreground">{t.team_settings.enable_link_desc}</p>
                            </div>
                            <button
                                onClick={() => updateTeamSettings({ allowInvite: !teamSettings.allowInvite })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${teamSettings.allowInvite ? 'bg-green-500' : 'bg-input'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${teamSettings.allowInvite ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        {t.team_settings.default_permissions}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {t.team_settings.default_role_desc}
                    </p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.team_settings.default_role}</label>
                        <select
                            value={teamSettings.defaultRole}
                            onChange={(e) => updateTeamSettings({ defaultRole: e.target.value as any })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="Staff">Staff</option>
                            <option value="Accountant">Accountant</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6" />
                        {t.team_settings.team_members}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t.team_settings.manage_members}</p>
                </div>
                <div className="p-6 pt-0">
                    <p className="mb-4 text-sm">{t.team_settings.active_members.replace('{{count}}', '5')}</p>
                    <Link href="/team">
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                            {t.team_settings.manage_team}
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
