"use client"

import { useState, useEffect } from "react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Smile, Coffee, Flame, Zap, PartyPopper, Save, RotateCcw } from "lucide-react"

import { useSettings, MoodThresholds } from "@/context/settings-context"

export function MoodSettings() {
    const { currentUser, currentTeam } = useProjects()
    const { t } = useTranslation()
    const { moodThresholds, updateMoodThresholds } = useSettings()

    const [thresholds, setThresholds] = useState<MoodThresholds>(moodThresholds)
    const [saved, setSaved] = useState(false)

    // Sync with context
    useEffect(() => {
        setThresholds(moodThresholds)
    }, [moodThresholds])

    const isAdmin = currentTeam?.role === 'Admin' || currentTeam?.role === 'Owner'

    const handleSave = async () => {
        await updateMoodThresholds(thresholds)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleReset = async () => {
        const defaults = {
            relaxed: 0,
            chill: 1,
            pumped: 2
        }
        setThresholds(defaults)
        await updateMoodThresholds(defaults)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    if (!isAdmin) {
        return null
    }

    const moods = [
        {
            key: "relaxed" as keyof MoodThresholds,
            emoji: "😎",
            label: "Relaxed (สบายใจ)",
            description: "No tasks at all",
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            Icon: PartyPopper,
            editable: false
        },
        {
            key: "chill" as keyof MoodThresholds,
            emoji: "☕",
            label: "Chill (ชิวๆ)",
            description: "Up to X task(s)",
            color: "text-sky-500",
            bgColor: "bg-sky-500/10",
            Icon: Coffee,
            editable: true
        },
        {
            key: "pumped" as keyof MoodThresholds,
            emoji: "💪",
            label: "Pumped (ฮึกเหิม)",
            description: "Up to X task(s)",
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
            Icon: Zap,
            editable: true
        },
        {
            key: "intense" as const,
            emoji: "🔥",
            label: "Intense (เหนื่อยๆ)",
            description: "More than above",
            color: "text-rose-500",
            bgColor: "bg-rose-500/10",
            Icon: Flame,
            editable: false
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Smile className="w-5 h-5 text-primary" />
                    Mood Card Settings
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Customize how many tasks trigger each mood on the dashboard welcome card.
                </p>
            </div>

            <div className="space-y-4">
                {moods.map((mood, index) => (
                    <div
                        key={mood.key}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${mood.bgColor} border-white/10`}
                    >
                        <div className="text-4xl">{mood.emoji}</div>
                        <div className="flex-1">
                            <div className={`font-semibold ${mood.color}`}>{mood.label}</div>
                            <div className="text-sm text-muted-foreground">{mood.description}</div>
                        </div>
                        {mood.editable && mood.key !== "intense" ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Up to</span>
                                <input
                                    type="number"
                                    min={index === 1 ? 1 : thresholds.chill + 1}
                                    max={10}
                                    value={thresholds[mood.key as keyof MoodThresholds]}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 1
                                        setThresholds(prev => ({
                                            ...prev,
                                            [mood.key]: value
                                        }))
                                    }}
                                    className="w-16 px-3 py-2 rounded-lg bg-background border text-center font-bold"
                                />
                                <span className="text-sm text-muted-foreground">task(s)</span>
                            </div>
                        ) : mood.key === "intense" ? (
                            <div className="text-sm text-muted-foreground">
                                More than {thresholds.pumped} tasks
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                0 tasks
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 pt-4">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                >
                    <Save className="w-4 h-4" />
                    {saved ? "Saved!" : "Save Settings"}
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-all"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Default
                </button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <strong>Note:</strong> These settings affect all team members' dashboard mood displays.
            </div>
        </div>
    )
}
