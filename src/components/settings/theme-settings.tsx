"use client"

import { useState, useEffect } from "react"
import { useSettings, AppTheme } from "@/context/settings-context"
import { Check, Moon, Sun, Monitor, Type, Save, RotateCcw } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

export function ThemeSettings() {
    const { t } = useTranslation()
    const { appTheme, updateAppTheme } = useSettings()
    const [draftTheme, setDraftTheme] = useState<AppTheme>(appTheme)
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        setDraftTheme(appTheme)
    }, [appTheme.color, appTheme.font, appTheme.mode, appTheme.radius])

    const handleSave = () => {
        updateAppTheme(draftTheme)
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
    }

    const handleChange = (key: keyof AppTheme, value: any) => {
        setDraftTheme(prev => ({ ...prev, [key]: value }))
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

    const specialColors = [
        { id: 'rainbow', value: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)', label: 'Rainbow', isGradient: true },
        { id: 'glass', value: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', label: 'Glass', isGradient: true },
    ]

    const pastelColors = [
        { id: 'pastel-pink', value: 'hsl(326 78% 75%)', label: 'Pastel Pink' },
        { id: 'pastel-blue', value: 'hsl(210 100% 75%)', label: 'Pastel Blue' },
        { id: 'pastel-green', value: 'hsl(150 80% 70%)', label: 'Pastel Green' },
        { id: 'pastel-purple', value: 'hsl(270 67% 75%)', label: 'Pastel Purple' },
    ]

    const allColors = [...mainColors, ...pastelColors]

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.settings.theme.title}</h3>

                {/* Main Colors */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t.settings.theme.color}</label>
                    <div className="flex flex-wrap gap-3">
                        {mainColors.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => handleChange('color', color.id)}
                                title={color.label}
                                className={`group relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${draftTheme.color === color.id
                                    ? 'border-primary ring-2 ring-ring ring-offset-2 scale-110 shadow-lg'
                                    : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                                    }`}
                                style={{ backgroundColor: color.value }}
                            >
                                {draftTheme.color === color.id && <Check className="w-5 h-5 text-white" />}
                            </button>
                        ))}
                    </div>
                </div>


                {/* Pastel Colors */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pastel</label>
                    <div className="flex flex-wrap gap-3">
                        {pastelColors.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => handleChange('color', color.id)}
                                title={color.label}
                                className={`group relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${draftTheme.color === color.id
                                    ? 'border-primary ring-2 ring-ring ring-offset-2 scale-110 shadow-lg'
                                    : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                                    }`}
                                style={{ backgroundColor: color.value }}
                            >
                                {draftTheme.color === color.id && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Special / Rainbow */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Special</label>
                    <div className="flex flex-wrap gap-3">
                        {specialColors.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => handleChange('color', color.id)}
                                title={color.label}
                                className={`group relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${draftTheme.color === color.id
                                    ? 'ring-2 ring-ring ring-offset-2 scale-110 shadow-lg'
                                    : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                                    }`}
                                style={{ background: color.value }}
                            >
                                {draftTheme.color === color.id && <Check className="w-5 h-5 text-white drop-shadow-md" />}
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
                                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                : 'border-border hover:border-primary/50 hover:bg-muted'
                                }`}
                        >
                            <span className="text-xl font-bold" style={{ fontFamily: font }}>Aa</span>
                            <span className="text-xs font-medium">{font}</span>
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
                    max="1"
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
        </div >
    )
}
