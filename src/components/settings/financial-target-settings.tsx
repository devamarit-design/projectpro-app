"use client"

import { useState, useEffect } from "react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Target, TrendingUp, TrendingDown, Save, RotateCcw } from "lucide-react"

import { useSettings, FinancialTargets } from "@/context/settings-context"

export function FinancialTargetSettings() {
    const { currentUser, currentTeam } = useProjects()
    const { t } = useTranslation()
    const { financialTargets, updateFinancialTargets } = useSettings()

    // Local state for immediate input feedback before blur/save if needed, 
    // but direct context update is also fine if de-bounced. 
    // For simplicity and to match previous UX, we'll keep local state and sync on mount,
    // then write back on Save.

    const [targets, setTargets] = useState<FinancialTargets>(financialTargets)
    const [saved, setSaved] = useState(false)

    // Sync from context when it changes (external updates)
    useEffect(() => {
        setTargets(financialTargets)
    }, [financialTargets])

    const isAdmin = currentTeam?.role === 'Admin' || currentTeam?.role === 'Owner'

    const handleSave = async () => {
        await updateFinancialTargets(targets)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleReset = async () => {
        const defaults = {
            incomeMin: 50000,
            incomeMax: 150000,
            expenseWarning: 30000,
            expenseLimit: 50000
        }
        setTargets(defaults)
        await updateFinancialTargets(defaults)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    if (!isAdmin) {
        return null
    }

    return (
        <div className="space-y-6 pt-8 border-t border-border">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Financial Targets
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Set your monthly financial goals to adjust the Dashboard Mood Cards.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Target */}
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-emerald-500">Income Thresholds</div>
                            <div className="text-xs text-muted-foreground">Define your comfort zones</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Detailed Moods:</label>
                            <div className="text-xs grid grid-cols-1 gap-1 pl-2 border-l-2 border-white/10">
                                <div className="text-orange-400">Fighting: &lt; ฿{targets.incomeMin.toLocaleString()}</div>
                                <div className="text-emerald-400">Comfortable: ฿{targets.incomeMin.toLocaleString()} - ฿{targets.incomeMax.toLocaleString()}</div>
                                <div className="text-green-400">Wealthy: &gt; ฿{targets.incomeMax.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Minimum (Fighting Limit)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                                    <input
                                        type="number"
                                        value={targets.incomeMin}
                                        onChange={(e) => setTargets(prev => ({ ...prev, incomeMin: Number(e.target.value) }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-6 pr-2 py-2 text-right font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Maximum (Wealthy Start)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                                    <input
                                        type="number"
                                        value={targets.incomeMax}
                                        onChange={(e) => setTargets(prev => ({ ...prev, incomeMax: Number(e.target.value) }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-6 pr-2 py-2 text-right font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expense Limit */}
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/20 text-red-500">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-red-500">Expense Thresholds</div>
                            <div className="text-xs text-muted-foreground">Define your spending limits</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Detailed Moods:</label>
                            <div className="text-xs grid grid-cols-1 gap-1 pl-2 border-l-2 border-white/10">
                                <div className="text-emerald-400">Rich: &lt; ฿{targets.expenseWarning.toLocaleString()}</div>
                                <div className="text-orange-400">Tight: ฿{targets.expenseWarning.toLocaleString()} - ฿{targets.expenseLimit.toLocaleString()}</div>
                                <div className="text-red-400">Broke: &gt; ฿{targets.expenseLimit.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Warning (Tight Start)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                                    <input
                                        type="number"
                                        value={targets.expenseWarning}
                                        onChange={(e) => setTargets(prev => ({ ...prev, expenseWarning: Number(e.target.value) }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-6 pr-2 py-2 text-right font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Limit (Broke Start)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                                    <input
                                        type="number"
                                        value={targets.expenseLimit}
                                        onChange={(e) => setTargets(prev => ({ ...prev, expenseLimit: Number(e.target.value) }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-6 pr-2 py-2 text-right font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                >
                    <Save className="w-4 h-4" />
                    {saved ? "Saved!" : "Save Targets"}
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-all"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                </button>
            </div>
        </div>
    )
}
