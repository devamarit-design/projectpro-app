import { Compass, Smartphone } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

export function InAppBrowserWarning() {
    const { t } = useTranslation()
    return (
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-amber-500">
                <Compass className="w-6 h-6" />
                <h3 className="font-bold">{t.auth_warning.title}</h3>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
                {t.auth_warning.subtitle}
            </p>

            <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white shrink-0 mt-0.5">1</div>
                    <p className="text-sm text-zinc-400">{t.auth_warning.step1.split("···")[0]} <span className="font-bold text-white">···</span> {t.auth_warning.step1.split("···")[1]}</p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white shrink-0 mt-0.5">2</div>
                    <p className="text-sm text-zinc-400">{t.auth_warning.step2}</p>
                </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 italic">
                    <Smartphone className="w-4 h-4" />
                    {t.auth_warning.ios_tip}
                </div>
            </div>
        </div>
    )
}
