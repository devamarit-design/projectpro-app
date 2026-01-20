"use client"

import { useSettings } from "@/context/settings-context"
import { Building2, Mail, Phone, Globe, MapPin, FileText } from "lucide-react"

import { useTranslation } from "@/lib/i18n-context"
import { useState, useRef } from "react"
import { uploadImage } from "@/lib/upload"
import Link from "next/link"
export function CompanySettings() {
    const { t } = useTranslation()
    const { orgProfile, updateOrgProfile } = useSettings()
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const url = await uploadImage(file, "company/logo")
            updateOrgProfile({ logo: url })
        } catch (error) {
            console.error("Logo upload failed:", error)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-6">

            <div className="flex items-center gap-4 border-b pb-4">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer"
                >
                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/20 overflow-hidden group-hover:border-primary/50 transition-all">
                        {orgProfile.logo ? (
                            <img src={orgProfile.logo} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                            <Building2 className="w-8 h-8 text-primary" />
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute -right-2 -bottom-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title={t.settings.company.change_logo}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">{t.settings.company.title}</h3>
                    <p className="text-sm text-muted-foreground">{t.settings.company.subtitle}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {t.settings.company.fields.name}
                    </label>
                    <input
                        type="text"
                        value={orgProfile.name}
                        onChange={(e) => updateOrgProfile({ name: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={t.settings.company.placeholders.name}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {t.settings.company.fields.tax_id}
                    </label>
                    <input
                        type="text"
                        value={orgProfile.taxId}
                        onChange={(e) => updateOrgProfile({ taxId: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={t.settings.company.placeholders.tax_id}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {t.settings.company.fields.address}
                    </label>
                    <textarea
                        value={orgProfile.address}
                        onChange={(e) => updateOrgProfile({ address: e.target.value })}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={t.settings.company.placeholders.address}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {t.settings.company.fields.phone}
                    </label>
                    <input
                        type="tel"
                        value={orgProfile.phone}
                        onChange={(e) => updateOrgProfile({ phone: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={t.settings.company.placeholders.phone}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {t.settings.company.fields.email}
                    </label>
                    <input
                        type="email"
                        value={orgProfile.email}
                        onChange={(e) => updateOrgProfile({ email: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={t.settings.company.placeholders.email}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        {t.settings.company.fields.website}
                    </label>
                    <input
                        type="url"
                        value={orgProfile.website}
                        onChange={(e) => updateOrgProfile({ website: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={t.settings.company.placeholders.website}
                    />
                </div>
            </div>
        </div>
    )
}
