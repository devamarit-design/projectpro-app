"use client"

import * as React from "react"
import { useState } from "react"
import { Building2, Plus, ArrowRight, Construction } from "lucide-react"

import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"

export function TeamOnboarding() {
    const { addTeam } = useProjects()
    const { t } = useTranslation()
    const [name, setName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsSubmitting(true)
        try {
            await addTeam(name)
        } catch (error) {
            console.error(error)
            alert("Failed to create team. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <Construction className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {t.team.onboarding.welcome}
                    </h1>
                    <p className="text-gray-500">
                        {t.team.onboarding.subtitle}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="teamName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t.team.onboarding.team_name}
                            </label>
                            <input
                                id="teamName"
                                placeholder={t.team.onboarding.team_placeholder}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                autoFocus
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full text-lg bg-blue-600 text-white hover:bg-blue-700"
                            disabled={!name.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                t.team.onboarding.creating
                            ) : (
                                <>
                                    {t.team.onboarding.create_workspace}
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400">
                                {t.team.onboarding.main_workspace}
                            </span>
                        </div>
                    </div>

                    <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-lg flex items-start gap-3">
                        <Building2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>
                            {t.team.onboarding.hint}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
