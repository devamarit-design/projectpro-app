"use client"

import * as React from "react"
import { X, Copy, Mail, Check, Link as LinkIcon, Smartphone, Send } from "lucide-react"
import { useOrganization } from "@/context/organization-context"
import { useProjects } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { toast } from "sonner"

interface InviteMemberDialogProps {
    isOpen: boolean
    onClose: () => void
}

export default function InviteMemberDialog({ isOpen, onClose }: InviteMemberDialogProps) {
    const { currentOrg } = useOrganization()
    const { addUser } = useProjects()
    const { t } = useTranslation()
    const [email, setEmail] = React.useState("")
    const [isSent, setIsSent] = React.useState(false)
    const [isSending, setIsSending] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<"email" | "link">("link")
    const [hasCopied, setHasCopied] = React.useState(false)

    if (!isOpen) return null

    const inviteLink = `${window.location.origin}/org/join?code=${currentOrg?.id}`

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setHasCopied(true)
        toast.success(t.dialogs.invitations.copied)
        setTimeout(() => setHasCopied(false), 2000)
    }

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !currentOrg) return

        setIsSending(true)
        try {
            // 1. Create Placeholder in Firestore first
            await addUser({
                name: email.split('@')[0], // Use email prefix as temporary name
                email: email,
                role: "Staff", // Default role for invites
                phone: ""
            })

            // 2. Send Real Email via API
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    subject: `Join ${currentOrg.name} on ProjectPro`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>You have been invited to join ${currentOrg.name}</h2>
                            <p>Hello,</p>
                            <p>You have been invited to join <strong>${currentOrg.name}</strong> on ProjectPro.</p>
                            <p>You can join by clicking the button below:</p>
                            <a href="${inviteLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Organization</a>
                            <p style="margin-top: 24px; color: #666;">Or use this Invite Code: <strong>${currentOrg.id}</strong></p>
                            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
                            <p style="font-size: 12px; color: #999;">If you didn't expect this invitation, you can ignore this email.</p>
                        </div>
                    `
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                // If the error is missing API key, we might want to warn the admin but still show success for the placeholder creation?
                // For now, let's treat it as a partial success maybe? But user expects email.
                // Actually, if placeholder created, we should probably keep it.
                console.warn("Email sending failed:", errorData)
                throw new Error(errorData.error || "Failed to send email")
            }

            setIsSent(true)
            toast.success(t.dialogs.invitations.success_placeholder.replace('{email}', email))

            setTimeout(() => {
                setIsSent(false)
                setEmail("")
            }, 3000)
        } catch (error) {
            console.error("Failed to send invite", error)
            toast.error("Invitation created, but email failed to send (Check API Key)")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Mail className="w-5 h-5" />
                        </div>
                        {t.dialogs.invitations.title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-muted rounded-xl">
                        <button
                            onClick={() => setActiveTab("link")}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                                activeTab === "link" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LinkIcon className="w-4 h-4" />
                            {t.dialogs.invitations.tabs.link}
                        </button>
                        <button
                            onClick={() => setActiveTab("email")}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                                activeTab === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Mail className="w-4 h-4" />
                            {t.dialogs.invitations.tabs.email}
                        </button>
                    </div>

                    {activeTab === "link" ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.dialogs.invitations.link_label}</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-muted/50 border border-input rounded-xl px-4 py-2.5 text-sm text-muted-foreground truncate font-mono">
                                        {inviteLink}
                                    </div>
                                    <button
                                        onClick={() => handleCopy(inviteLink)}
                                        className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                    >
                                        {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {hasCopied ? t.dialogs.invitations.copied : t.dialogs.invitations.copy}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">{t.dialogs.invitations.or_share_code}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.dialogs.invitations.org_id_label}</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-muted/50 border border-input rounded-xl px-4 py-2.5 text-sm font-bold tracking-wide text-center">
                                        {currentOrg?.id}
                                    </div>
                                    <button
                                        onClick={() => handleCopy(currentOrg?.id || "")}
                                        className="p-2.5 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <form onSubmit={handleSendEmail} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.dialogs.invitations.email_label}</label>
                                    <input
                                        type="email"
                                        placeholder={t.dialogs.invitations.email_placeholder}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSent || isSending || !email}
                                    className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                >
                                    {isSent ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            {t.dialogs.invitations.sent_via_mail}
                                        </>
                                    ) : isSending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                            {t.common.loading}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            {t.dialogs.invitations.send_invite}
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-center text-muted-foreground">
                                    {t.dialogs.invitations.email_hint}
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
