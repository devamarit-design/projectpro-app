"use client"

import * as React from "react"
import { useProjects } from "@/context/project-context"
import { useRouter } from "next/navigation"
import { Building2, Users, ArrowRight, Plus, Loader2 } from "lucide-react"

export default function OnboardingPage() {
    const { currentUser, teams, addTeam } = useProjects()
    const router = useRouter()

    // Auto-redirect if already has teams
    React.useEffect(() => {
        if (currentUser && teams.length > 0) {
            router.push(`/projects/${teams[0].id}`) // Or dashboard
        }
    }, [currentUser, teams, router])

    const [step, setStep] = React.useState<"welcome" | "create" | "join">("welcome")
    const [teamName, setTeamName] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!teamName.trim()) return

        setIsLoading(true)
        try {
            await addTeam(teamName)
            // Redirect will happen automatically via useEffect once team is added
        } catch (error) {
            console.error("Failed to create team", error)
            setIsLoading(false)
        }
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
                                Welcome, {currentUser.name}!
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Let's get you valid started. How would you like to proceed?
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <button
                                onClick={() => setStep("create")}
                                className="group relative overflow-hidden bg-card border border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-all text-left"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Create a New Team</h3>
                                        <p className="text-muted-foreground text-sm">Set up your workspace from scratch</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </button>

                            <button
                                onClick={() => setStep("join")}
                                className="group relative overflow-hidden bg-card border border-white/10 p-6 rounded-2xl hover:border-blue-500/50 transition-all text-left"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Join an Existing Team</h3>
                                        <p className="text-muted-foreground text-sm">Enter an invite code or link</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-blue-500 transition-colors" />
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {step === "create" && (
                    <div className="bg-card border border-white/10 rounded-3xl p-8 space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="space-y-2">
                            <button
                                onClick={() => setStep("welcome")}
                                className="text-sm text-muted-foreground hover:text-white transition-colors"
                            >
                                ← Back
                            </button>
                            <h2 className="text-2xl font-bold">Name your Team</h2>
                            <p className="text-muted-foreground">What's the name of your company or organization?</p>
                        </div>

                        <form onSubmit={handleCreateTeam} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Team Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="Acme Construction Co."
                                        className="w-full bg-background/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg font-medium"
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
                                        Creating...
                                    </>
                                ) : (
                                    "Create Workspace"
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {step === "join" && (
                    <div className="bg-card border border-white/10 rounded-3xl p-8 space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="space-y-2">
                            <button
                                onClick={() => setStep("welcome")}
                                className="text-sm text-muted-foreground hover:text-white transition-colors"
                            >
                                ← Back
                            </button>
                            <h2 className="text-2xl font-bold">Join a Team</h2>
                            <p className="text-muted-foreground">Ask your team admin for an invite link or code.</p>
                        </div>

                        <div className="p-6 bg-muted/20 rounded-xl border border-dashed border-white/20 text-center space-y-4">
                            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                                <Users className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium">Have an invite link?</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Clicking the link will automatically add you to the team.
                                </p>
                            </div>
                        </div>

                        {/* Future: Manual Code Input */}
                    </div>
                )}
            </div>
        </div>
    )
}
