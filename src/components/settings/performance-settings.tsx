import { usePerformance } from "@/context/performance-context"
import { useTranslation } from "@/lib/i18n-context"
import { Zap, MonitorSmartphone, EyeOff } from "lucide-react"

export function PerformanceSettings() {
    const { t } = useTranslation()
    const { reduceTransparency, setReduceTransparency, reduceMotion, setReduceMotion, frameRate, setFrameRate } = usePerformance()

    // Tiny wrappers to update state immediately
    const reduceTransparencyToggle = (val: boolean) => setReduceTransparency(val)
    const reduceMotionToggle = (val: boolean) => setReduceMotion(val)

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    {t.settings.theme.performance}
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t.settings.theme.performance_badge}</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    {t.settings.theme.global_hint}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-2xl">
                {/* Reduce Transparency */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 mt-1">
                            <EyeOff className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium">{t.settings.theme.reduce_transparency}</label>
                            <p className="text-xs text-muted-foreground">{t.settings.theme.reduce_transparency_desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center h-6">
                        <button
                            onClick={() => reduceTransparencyToggle(!reduceTransparency)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${reduceTransparency ? 'bg-primary' : 'bg-muted'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${reduceTransparency ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* Reduce Motion */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 mt-1">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium">{t.settings.theme.reduce_motion}</label>
                            <p className="text-xs text-muted-foreground">{t.settings.theme.reduce_motion_desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center h-6">
                        <button
                            onClick={() => reduceMotionToggle(!reduceMotion)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${reduceMotion ? 'bg-primary' : 'bg-muted'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${reduceMotion ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* Frame Rate */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500 mt-1">
                            <MonitorSmartphone className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium">{t.settings.theme.framerate}</label>
                            <p className="text-xs text-muted-foreground">{t.settings.theme.framerate_desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
                        <button
                            onClick={() => setFrameRate('normal')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${frameRate === 'normal'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t.settings.theme.framerate_normal}
                        </button>
                        <button
                            onClick={() => setFrameRate('high')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${frameRate === 'high'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t.settings.theme.framerate_high}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
