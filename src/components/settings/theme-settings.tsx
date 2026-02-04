"use client"

import { useState, useEffect } from "react"
import { useSettings, AppTheme } from "@/context/settings-context"
import { Check, Moon, Sun, Monitor, Type, Save, RotateCcw } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

export function ThemeSettings() {
    const { t } = useTranslation()
    const { appTheme, updateAppTheme, setPreviewTheme } = useSettings()
    const [draftTheme, setDraftTheme] = useState<AppTheme>(appTheme)
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        setDraftTheme(appTheme)
    }, [appTheme.color, appTheme.font, appTheme.mode, appTheme.radius])

    // Cleanup preview on unmount
    useEffect(() => {
        return () => setPreviewTheme(null)
    }, [])

    const handleSave = () => {
        updateAppTheme(draftTheme)
        setPreviewTheme(null) // Clear preview, live settings take over
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
    }

    const handleChange = (key: keyof AppTheme, value: any) => {
        const newTheme = { ...draftTheme, [key]: value }
        setDraftTheme(newTheme)
        setPreviewTheme(newTheme) // Live preview
        setIsSaved(false)
    }

    // Main colors - 6 essential options
    const mainColors = [
        { id: 'orange', value: 'hsl(24.6 95% 53.1%)', label: 'Orange' },
        { id: 'blue', value: 'hsl(221.2 83.2% 53.3%)', label: 'Blue' },
        { id: 'green', value: 'hsl(142.1 76.2% 36.3%)', label: 'Green' },
        { id: 'purple', value: 'hsl(262.1 83.3% 57.8%)', label: 'Purple' },
        { id: 'pink', value: 'hsl(330.4 81.2% 60.4%)', label: 'Pink' },
        { id: 'teal', value: 'hsl(172.5 66% 50.4%)', label: 'Teal' },
    ]

    const gradientColors = [
        { id: 'grad-blue', value: 'linear-gradient(135deg, #60a5fa, #3b82f6)', label: 'Ocean' },
        { id: 'grad-purple', value: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', label: 'Berry' },
        { id: 'grad-orange', value: 'linear-gradient(135deg, #fb923c, #f97316)', label: 'Sunset' },
        { id: 'grad-green', value: 'linear-gradient(135deg, #4ade80, #22c55e)', label: 'Emerald' },
    ]

    const specialColors = [
        { id: 'rainbow', value: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)', label: 'Rainbow', isGradient: true },
        // New Specials
        { id: 'rainbow-soft', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', label: 'Cotton Candy', isGradient: true },
        { id: 'nebula', value: 'linear-gradient(to right, #c33764, #1d2671)', label: 'Nebula', isGradient: true },
        { id: 'aurora', value: 'linear-gradient(to right, #00c6ff, #0072ff)', label: 'Aurora', isGradient: true },
        { id: 'retro', value: 'linear-gradient(to right, #833ab4, #fd1d1d, #fcb045)', label: 'Retro', isGradient: true },
    ]

    const clearColors = [
        { id: 'glass', value: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', label: 'Clear / Glass', isGradient: true }
    ]

    const pastelColors = [
        { id: 'pastel-pink', value: 'hsl(326 78% 75%)', label: 'Pastel Pink' },
        { id: 'pastel-blue', value: 'hsl(210 100% 75%)', label: 'Pastel Blue' },
        { id: 'pastel-green', value: 'hsl(150 80% 70%)', label: 'Pastel Green' },
        { id: 'pastel-purple', value: 'hsl(270 67% 75%)', label: 'Pastel Purple' },
    ]

    const allColors = [...mainColors, ...gradientColors, ...pastelColors, ...clearColors]

    return (
        <div className="space-y-8">
            {/* Theme Preview */}
            <div className="p-6 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Preview: <span className="text-primary font-bold">{allColors.find(c => c.id === (draftTheme.color))?.label || 'Custom'}</span>
                    </h4>
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Active
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mock Card 1 */}
                    <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3 relative">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                <span className="font-bold">A</span>
                            </div>
                            <div>
                                <div className="h-4 w-24 bg-primary/20 rounded mb-1.5" />
                                <div className="h-3 w-16 bg-muted rounded" />
                            </div>
                        </div>
                        <div className="flex gap-2 relative">
                            <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                                Primary Action
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors">
                                Secondary
                            </button>
                        </div>
                    </div>
                    {/* Mock Card 2 */}
                    <div className="p-4 rounded-xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative space-y-2">
                            <div className="text-2xl font-bold">12,450</div>
                            <div className="text-sm opacity-90">Total Balance</div>
                            <div className="pt-2 flex gap-1">
                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white/80 w-3/4 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.settings.theme.title}</h3>

                {/* Main Colors */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t.settings.theme.color}</label>
                    <div className="flex flex-wrap gap-4">
                        {mainColors.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => handleChange('color', color.id)}
                                title={color.label}
                                className="flex flex-col items-center gap-1 group"
                            >
                                <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${draftTheme.color === color.id
                                    ? 'border-primary ring-2 ring-ring ring-offset-2 scale-110 shadow-lg'
                                    : 'border-transparent group-hover:scale-110 opacity-70 group-hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: color.value }}>
                                    {draftTheme.color === color.id && <Check className="w-5 h-5 text-white" />}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">{color.label}</span>
                            </button>
                        ))}
                    </div>
                </div>


                {/* Gradient Colors */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gradient</label>
                    <div className="flex flex-wrap gap-4">
                        {gradientColors.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => handleChange('color', color.id)}
                                title={color.label}
                                className="flex flex-col items-center gap-1 group"
                            >
                                <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${draftTheme.color === color.id
                                    ? 'ring-2 ring-ring ring-offset-2 scale-110 shadow-lg'
                                    : 'border-transparent group-hover:scale-110 opacity-70 group-hover:opacity-100'
                                    }`}
                                    style={{ background: color.value }}>
                                    {draftTheme.color === color.id && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">{color.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Clear / Glass */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clear</label>
                        <div className="flex flex-wrap gap-4">
                            {clearColors.map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => handleChange('color', color.id)}
                                    title={color.label}
                                    className="flex flex-col items-center gap-1 group"
                                >
                                    <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${draftTheme.color === color.id
                                        ? 'ring-2 ring-ring ring-offset-2 scale-110 shadow-lg'
                                        : 'border-transparent group-hover:scale-110 opacity-70 group-hover:opacity-100'
                                        }`}
                                        style={{ background: color.value }}>
                                        {draftTheme.color === color.id && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">{color.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pastel Colors */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pastel</label>
                        <div className="flex flex-wrap gap-4">
                            {pastelColors.map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => handleChange('color', color.id)}
                                    title={color.label}
                                    className="flex flex-col items-center gap-1 group"
                                >
                                    <div className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${draftTheme.color === color.id
                                        ? 'border-primary ring-2 ring-ring ring-offset-2 scale-110 shadow-lg'
                                        : 'border-transparent group-hover:scale-110 opacity-70 group-hover:opacity-100'
                                        }`}
                                        style={{ backgroundColor: color.value }}>
                                        {draftTheme.color === color.id && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">{color.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Special / Rainbow */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Special</label>
                        <div className="flex flex-wrap gap-4">
                            {specialColors.map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => handleChange('color', color.id)}
                                    title={color.label}
                                    className="flex flex-col items-center gap-1 group"
                                >
                                    <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${draftTheme.color === color.id
                                        ? 'ring-2 ring-ring ring-offset-2 scale-110 shadow-lg'
                                        : 'border-transparent group-hover:scale-110 opacity-70 group-hover:opacity-100'
                                        }`}
                                        style={{ background: color.value }}>
                                        {draftTheme.color === color.id && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">{color.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        {t.settings.theme.font}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg">
                        {['Kanit', 'Sarabun', 'Inter', 'Prompt'].map((font) => (
                            <button
                                key={font}
                                onClick={() => handleChange('font', font)}
                                className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all ${draftTheme.font === font
                                    ? 'border-primary/60 bg-primary/10 shadow-sm ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50 hover:bg-muted'
                                    }`}
                            >
                                <span className={`text-xl font-bold ${draftTheme.font === font ? 'text-foreground' : ''}`} style={{ fontFamily: font }}>Aa</span>
                                <span className={`text-xs font-medium ${draftTheme.font === font ? 'text-primary' : ''}`}>{font}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-medium">{t.settings.theme.mode}</label>
                    <div className="grid grid-cols-3 gap-4 max-w-md">
                        <button
                            onClick={() => handleChange('mode', 'light')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${draftTheme.mode === 'light'
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/50 hover:bg-muted'
                                }`}
                            style={{ borderColor: draftTheme.mode === 'light' ? allColors.find(c => c.id === draftTheme.color)?.value : '' }}
                        >
                            <Sun
                                className={`w-6 h-6 ${draftTheme.mode === 'light' ? 'text-primary' : ''}`}
                                style={{ color: draftTheme.mode === 'light' ? allColors.find(c => c.id === draftTheme.color)?.value : '' }}
                            />
                            <span className="text-sm font-medium">{t.settings.theme.mode_light}</span>
                        </button>

                        <button
                            onClick={() => handleChange('mode', 'dark')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${draftTheme.mode === 'dark'
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/50 hover:bg-muted'
                                }`}
                            style={{ borderColor: draftTheme.mode === 'dark' ? allColors.find(c => c.id === draftTheme.color)?.value : '' }}
                        >
                            <Moon
                                className={`w-6 h-6 ${draftTheme.mode === 'dark' ? 'text-primary' : ''}`}
                                style={{ color: draftTheme.mode === 'dark' ? allColors.find(c => c.id === draftTheme.color)?.value : '' }}
                            />
                            <span className="text-sm font-medium">{t.settings.theme.mode_dark}</span>
                        </button>

                        <button
                            title="Use System Setting"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border opacity-50 cursor-not-allowed"
                        >
                            <Monitor className="w-6 h-6" />
                            <span className="text-sm font-medium">{t.settings.theme.mode_system}</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between max-w-md">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium">{t.settings.theme.roundness}</label>
                            <p className="text-xs text-muted-foreground">{t.settings.theme.roundness_desc}</p>
                        </div>
                        <span className="text-sm font-medium">
                            {draftTheme.radius === 0 ? t.settings.theme.roundness_sharp : draftTheme.radius === 1 ? t.settings.theme.roundness_round : t.settings.theme.roundness_standard}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.25"
                        value={draftTheme.radius}
                        onChange={(e) => handleChange('radius', parseFloat(e.target.value))}
                        className="w-full max-w-md accent-primary"
                    />
                </div>

                <div className="pt-6 border-t border-border flex items-center justify-between max-w-lg">
                    <p className="text-xs text-muted-foreground">
                        {t.settings.theme.global_hint}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setDraftTheme(appTheme)}
                            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" /> {t.settings.theme.reset}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaved}
                            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isSaved
                                ? 'bg-green-500 text-white'
                                : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-primary/20'
                                }`}
                        >
                            {isSaved ? (
                                <>
                                    <Check className="w-4 h-4" /> {t.settings.theme.saved}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> {t.settings.theme.save}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    )
}
