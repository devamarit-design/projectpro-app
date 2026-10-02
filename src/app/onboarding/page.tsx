"use client"

import * as React from "react"
import { useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { useRouter } from "next/navigation"
import { Building2, Users, ArrowRight, Plus, Loader2 } from "lucide-react"
import FeatureCarousel from "@/components/onboarding/feature-carousel"
import { useTranslation } from "@/lib/i18n-context"

export default function OnboardingPage() {
    const { currentUser, teams, addTeam, updateUser, isAuthLoading, isOrgLoading } = useProjects()
    const { joinOrganizationByCode } = useOrganization()
    const { t } = useTranslation()
    const router = useRouter()

    const [step, setStep] = React.useState<"showcase" | "welcome" | "create" | "join">("showcase")
    const [teamName, setTeamName] = React.useState("")
    const [inviteCode, setInviteCode] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!isAuthLoading && !isOrgLoading) {
            if (!currentUser) {
                router.replace("/login")
            } else if (currentUser.hasOnboarded || teams.length > 0) {
                router.replace("/")
            }
        }
    }, [currentUser, isAuthLoading, isOrgLoading, teams, router])

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!teamName.trim()) return

        setIsLoading(true)
        try {
            const newTeamId = await addTeam(teamName)
            if (currentUser) {
                await updateUser(currentUser.id, { hasOnboarded: true })
            }
            router.push("/")
        } catch (error) {
            console.error("Failed to create team", error)
            setIsLoading(false)
        }
    }

    const handleJoinByCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteCode.trim()) return

        setIsLoading(true)
        setError(null)
        try {
            const teamName = await joinOrganizationByCode(inviteCode)
            if (currentUser) {
                await updateUser(currentUser.id, { hasOnboarded: true })
            }
            window.location.href = "/"
        } catch (error: any) {
            console.error("Failed to join team", error)
            setError(error.message || "Failed to join team")
            setIsLoading(false)
        }
    }

    // Strict Loading State:
    // 1. Auth is loading
    // 2. User is not yet loaded (but auth matches)
    // 3. User SHOULD redirect (prevent flash)
    const shouldRedirect = currentUser && ((currentUser.orgIds && currentUser.orgIds.length > 0) || currentUser.hasOnboarded)

    if (isAuthLoading || !currentUser || shouldRedirect) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 opacity-50"
                    style={{
                        backgroundImage: "url('/loading-bg.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(20px) brightness(0.5)' // Optional: blur it a bit to make text pop, or remove if they want it clear
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">
                    <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
                    <p className="text-white/80 animate-pulse tracking-widest text-sm uppercase">{t.onboarding.loading}</p>
                </div>
            </div>
        )
    }

    // New Step 1: Feature Showcase
    if (step === "showcase") {
        if (teams.length > 0) return <FeatureCarousel onComplete={() => router.push("/")} />
        return <FeatureCarousel onComplete={() => setStep("welcome")} />
    }

    return (
        <div className="dark min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-primary selection:text-white">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-lg z-10">
                {step === "welcome" && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {t.onboarding.welcome} {currentUser.name}!
                            </h1>
                            <p className="text-zinc-400 text-lg">
                                {t.onboarding.get_started}
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {teams.length > 0 && (
                                <button
                                    onClick={() => router.push("/")}
                                    className="group relative overflow-hidden bg-primary/10 border border-primary/40 p-6 rounded-2xl hover:bg-primary/20 transition-all text-left shadow-lg backdrop-blur-xl"
                                >
                                    <div className="relative flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                                            <ArrowRight className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{t.onboarding.continue_to} {teams[0].name}</h3>
                                            <p className="text-zinc-400 text-sm">{t.onboarding.enter_workspace}</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            <button
                                onClick={() => setStep("create")}
                                className="group relative overflow-hidden bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl hover:border-primary/60 transition-all text-left shadow-xl backdrop-blur-xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{t.onboarding.create_team}</h3>
                                        <p className="text-zinc-400 text-sm">{t.onboarding.create_desc}</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 ml-auto text-zinc-500 group-hover:text-primary transition-colors" />
                                </div>
                            </button>

                            <button
                                onClick={() => setStep("join")}
                                className="group relative overflow-hidden bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl hover:border-blue-500/60 transition-all text-left shadow-xl backdrop-blur-xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{t.onboarding.join_team}</h3>
                                        <p className="text-zinc-400 text-sm">{t.onboarding.join_desc}</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 ml-auto text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {step === "create" && (
                    <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-8 space-y-6 animate-in slide-in-from-right duration-300 shadow-2xl backdrop-blur-xl text-white">
                        <div className="space-y-2">
                            <button
                                onClick={() => setStep("welcome")}
                                className="text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                ← {t.onboarding.back}
                            </button>
                            <h2 className="text-2xl font-bold text-white">{t.onboarding.name_team}</h2>
                            <p className="text-zinc-400">{t.onboarding.company_question}</p>
                        </div>

                        <form onSubmit={handleCreateTeam} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">{t.onboarding.team_name}</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="Acme Construction Co."
                                        className="w-full bg-zinc-950/80 border border-zinc-800 text-white placeholder:text-zinc-500 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t.onboarding.creating}
                                    </>
                                ) : (
                                    t.onboarding.create_workspace
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {step === "join" && (
                    <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-8 space-y-6 animate-in slide-in-from-right duration-300 shadow-2xl backdrop-blur-xl text-white">
                        <div className="space-y-2">
                            <button
                                onClick={() => setStep("welcome")}
                                className="text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                ← {t.onboarding.back}
                            </button>
                            <h2 className="text-2xl font-bold text-white">{t.onboarding.join_title}</h2>
                            <p className="text-zinc-400">{t.onboarding.ask_admin}</p>
                        </div>

                        <div className="p-6 bg-zinc-950/60 rounded-xl border border-dashed border-zinc-800 text-center space-y-4">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                                <Users className="w-8 h-8 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">{t.onboarding.have_link}</h3>
                                <p className="text-sm text-zinc-400 mt-1">
                                    {t.onboarding.link_hint}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleJoinByCode} className="space-y-4 pt-4 border-t border-zinc-800">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">{t.onboarding.enter_code}</label>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        placeholder={t.onboarding.enter_invite}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-center text-lg tracking-widest uppercase selection:bg-primary selection:text-white"
                                    />
                                    {error && (
                                        <p className="text-sm text-red-400 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isLoading || !inviteCode.trim()}
                                        className="w-full bg-white text-zinc-950 py-3.5 rounded-xl font-bold uppercase tracking-wider hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-950" /> : t.onboarding.join}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
