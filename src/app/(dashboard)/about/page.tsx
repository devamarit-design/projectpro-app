"use client"

import { useTranslation } from "@/lib/i18n-context"
import { Info, ShieldCheck, Github, Globe, Mail } from "lucide-react"

export default function AboutPage() {
    const { t } = useTranslation()

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center">
                    <Info className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-4xl font-black">{t.navbar.about}</h1>
                <p className="text-muted-foreground text-lg">
                    {t.about.tagline}
                </p>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                <div>
                    <h2 className="text-xl font-bold mb-2">{t.about.version}</h2>
                    <p className="text-muted-foreground">1.0.5LC</p>
                </div>

                <div className="h-px bg-white/5" />

                <div>
                    <h2 className="text-xl font-bold mb-4">{t.about.mission_title}</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {t.about.mission_desc}
                    </p>
                </div>

                <div className="h-px bg-white/5" />

                <div>
                    <h2 className="text-xl font-bold mb-4">{t.about.support_title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a href="#" className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-white/5 hover:bg-muted/40 transition-all">
                            <Mail className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-sm font-bold">{t.about.email_support}</p>
                                <p className="text-xs text-muted-foreground">Support@hipsloth.app</p>
                            </div>
                        </a>
                        <a href="#" className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-white/5 hover:bg-muted/40 transition-all">
                            <Globe className="w-5 h-5 text-emerald-500" />
                            <div>
                                <p className="text-sm font-bold">{t.about.official_website}</p>
                                <p className="text-xs text-muted-foreground">www.hipsloth.app</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                <p>{t.about.rights_reserved}</p>
            </div>
        </div>
    )
}
