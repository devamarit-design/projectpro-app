"use client"

import * as React from "react"
import { X, Building2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"

interface CreateTeamDialogProps {
    isOpen: boolean
    onClose: () => void
}

export default function CreateTeamDialog({ isOpen, onClose }: CreateTeamDialogProps) {
    const { t } = useTranslation()
    const { addTeam } = useProjects()
    const [name, setName] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            await addTeam(name)
            setName("")
            onClose()
        } catch (error) {
            console.error("Failed to create team", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold">{t.team.title ? "Create New Team" : "Create New Team"}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form id="create-team-form" onSubmit={handleSubmit} className="space-y-4">

                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-10 h-10 text-primary" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium ml-1">
                                {t.settings.company.fields.name}
                            </label>
                            <input
                                required
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border bg-muted/30 focus:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Enter team name..."
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl font-medium hover:bg-muted transition-colors"
                        disabled={isLoading}
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        type="submit"
                        form="create-team-form"
                        disabled={isLoading || !name.trim()}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isLoading ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    )
}
