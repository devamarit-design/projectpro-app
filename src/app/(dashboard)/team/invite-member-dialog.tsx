"use client"

import * as React from "react"
import { X, Copy, Mail, Check, Link as LinkIcon, Smartphone, Send } from "lucide-react"
import { useOrganization } from "@/context/organization-context"
import { cn } from "@/lib/utils"
// import { useTranslation } from "@/lib/i18n-context" // Add translations later if needed

interface InviteMemberDialogProps {
    isOpen: boolean
    onClose: () => void
}

export default function InviteMemberDialog({ isOpen, onClose }: InviteMemberDialogProps) {
    const { currentOrg } = useOrganization()
    const [email, setEmail] = React.useState("")
    const [isSent, setIsSent] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<"email" | "link">("link")
    const [hasCopied, setHasCopied] = React.useState(false)

    if (!isOpen) return null

    const inviteLink = `${window.location.origin}/org/join?code=${currentOrg?.id}`

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setHasCopied(true)
        setTimeout(() => setHasCopied(false), 2000)
    }

    const handleSendEmail = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        // Simulation of sending email
        // In a real app, this would call an API point like /api/invite/email
        const subject = encodeURIComponent(`Join ${currentOrg?.name || 'our organization'} on ProjectPro`)
        const body = encodeURIComponent(`Hello,\n\nYou have been invited to join ${currentOrg?.name} on ProjectPro.\n\nUse this Invite Code: ${currentOrg?.id}\n\nOr click here to join:\n${inviteLink}\n\nBest,\nProjectPro Team`)

        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank')

        setIsSent(true)
        setTimeout(() => {
            setIsSent(false)
            setEmail("")
            // onClose() // Optional: close after send
        }, 3000)
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
                        Invite Members
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
                            Copy Link
                        </button>
                        <button
                            onClick={() => setActiveTab("email")}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                                activeTab === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Mail className="w-4 h-4" />
                            Send Email
                        </button>
                    </div>

                    {activeTab === "link" ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invite Link</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-muted/50 border border-input rounded-xl px-4 py-2.5 text-sm text-muted-foreground truncate font-mono">
                                        {inviteLink}
                                    </div>
                                    <button
                                        onClick={() => handleCopy(inviteLink)}
                                        className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                    >
                                        {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {hasCopied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or share code</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Organization ID (Code)</label>
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
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="colleague@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSent || !email}
                                    className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                >
                                    {isSent ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Sent via Mail App
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Invite
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-center text-muted-foreground">
                                    This will open your default email client with a pre-filled invitation.
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
