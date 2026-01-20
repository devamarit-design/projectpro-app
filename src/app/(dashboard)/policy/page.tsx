"use client"

import { useTranslation } from "@/lib/i18n-context"
import { ShieldAlert, Lock, Eye, FileLock2 } from "lucide-react"

export default function PolicyPage() {
    const { t } = useTranslation()

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            <div className="space-y-2">
                <h1 className="text-4xl font-black flex items-center gap-4">
                    <ShieldAlert className="w-10 h-10 text-primary" />
                    {t.navbar.policy}
                </h1>
                <p className="text-muted-foreground">{t.policy.last_updated}</p>
            </div>

            <div className="grid gap-6">
                <section className="glass-card p-8 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                        <Lock className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">{t.policy.data_privacy.title}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                        {t.policy.data_privacy.content}
                    </p>
                </section>

                <section className="glass-card p-8 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-amber-500">
                        <Eye className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">{t.policy.usage_policy.title}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                        {t.policy.usage_policy.content}
                    </p>
                </section>

                <section className="glass-card p-8 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <FileLock2 className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">{t.policy.security.title}</h2>
                    </div>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                        {t.policy.security.points.map((point: string, i: number) => (
                            <li key={i}>{point}</li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="p-6 bg-muted/20 border border-white/5 rounded-3xl text-sm text-center text-muted-foreground">
                {t.policy.footer}
            </div>
        </div>
    )
}
