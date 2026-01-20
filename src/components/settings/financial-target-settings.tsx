"use client"

import { useState, useEffect } from "react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Target, TrendingUp, TrendingDown, Save, RotateCcw } from "lucide-react"

interface FinancialTargets {
    incomeMin: number // Below this is Fighting
    incomeMax: number // Above this is Wealthy
    expenseWarning: number // Above this is Tight
    expenseLimit: number // Above this is Broke
}

const DEFAULT_TARGETS: FinancialTargets = {
    incomeMin: 50000,
    incomeMax: 150000,
    expenseWarning: 30000,
    expenseLimit: 50000
}

const STORAGE_KEY = "financial-targets"

export function FinancialTargetSettings() {
    const { currentUser } = useProjects()
    const { t } = useTranslation()
    const [targets, setTargets] = useState<FinancialTargets>(DEFAULT_TARGETS)
    const [saved, setSaved] = useState(false)

    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Owner'

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                setTargets(JSON.parse(stored))
            } catch {
                setTargets(DEFAULT_TARGETS)
            }
        }
    }, [])

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleReset = () => {
        setTargets(DEFAULT_TARGETS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TARGETS))
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
