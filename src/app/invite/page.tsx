"use client"

import * as React from "react"
import { useProjects } from "@/context/project-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, XCircle, Loader2 } from "lucide-react"
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Suspense } from "react"
import { useTranslation } from "@/lib/i18n-context"

function InviteContent() {
    const { currentUser } = useProjects()
    const { t } = useTranslation()
    const router = useRouter()
    const searchParams = useSearchParams()
    const code = searchParams.get("code")

    const [status, setStatus] = React.useState<"loading" | "valid" | "invalid" | "success">("loading")
    const [teamName, setTeamName] = React.useState("")
    const [teamId, setTeamId] = React.useState("")

    React.useEffect(() => {
        const validateInvite = async () => {
            if (!code) {
                setStatus("invalid")
                return
            }

            try {
                // Find invite by code
                const q = query(collection(db, "invites"), where("code", "==", code))
                const snap = await getDocs(q)

                if (snap.empty) {
                    setStatus("invalid")
                    return
                }

                const inviteData = snap.docs[0].data()
                // Check expiry if you have one

                // Fetch Team Details
                const teamSnap = await getDoc(doc(db, "teams", inviteData.teamId))
                if (teamSnap.exists()) {
                    setTeamName(teamSnap.data().name)
                    setTeamId(inviteData.teamId)
                    setStatus("valid")
                } else {
                    setStatus("invalid")
                }
            } catch (error) {
                console.error("Error validating invite", error)
                setStatus("invalid")
            }
        }

        validateInvite()
    }, [code])

    const handleJoin = async () => {
        if (!currentUser || !teamId) return

        setStatus("loading")
        try {
            // Add user to team in Firestore
            await updateDoc(doc(db, "users", currentUser.id), {
                orgIds: arrayUnion(teamId)
            })

            // Update local state (optimistic)
            // But actually we might wait for context to reload or force reload
            // For simplicity, just force a hard redirect to dashboard which triggers context reload
            window.location.href = `/projects`

        } catch (error) {
            console.error("Failed to join team", error)
            setStatus("invalid")
        }
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <p>{t.invite.login_required}</p>
                <button onClick={() => router.push("/")} className="mt-4 bg-primary px-4 py-2 rounded-xl text-black font-bold">
                    {t.invite.go_to_login}
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="relative w-full max-w-md bg-card border border-white/10 rounded-3xl p-8 space-y-6 text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">{t.invite.verifying}</p>
                    </div>
                )}

                {status === "invalid" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                            <XCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-500">{t.invite.invalid}</h2>
                            <p className="text-muted-foreground mt-2">{t.invite.invalid_desc}</p>
                        </div>
                        <button onClick={() => router.push("/")} className="mt-4 text-sm underline opacity-70">
                            {t.invite.back_home}
                        </button>
                    </div>
                )}

                {status === "valid" && (
                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-2">
                            <Building2 className="w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <p className="text-muted-foreground uppercase tracking-wider text-xs font-bold">{t.invite.invited_to}</p>
                            <h1 className="text-3xl font-bold">{teamName}</h1>
                        </div>

                        <div className="w-full h-px bg-white/10" />

                        <div className="w-full space-y-3">
                            <button
                                onClick={handleJoin}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {t.invite.join_workspace}
                            </button>
                            <button
                                onClick={() => router.push("/")}
                                className="text-sm text-muted-foreground hover:text-white transition-colors"
                            >
                                {t.invite.cancel}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function InvitePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InviteContent />
        </Suspense>
    )
}
