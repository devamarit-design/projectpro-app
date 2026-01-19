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
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Company Information is Read-Only</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        To edit company details, please visit the <Link href="/team" className="underline font-semibold hover:text-blue-800">Team Page</Link>.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 border-b pb-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/20">
                    {orgProfile.logo ? (
                        <img src={orgProfile.logo} alt="Logo" className="h-full w-full object-contain rounded-xl" />
                    ) : (
                        <Building2 className="w-8 h-8 text-primary" />
                    )}
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
                        readOnly
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                        readOnly
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                        readOnly
                        disabled
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                        readOnly
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                        readOnly
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                        readOnly
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={t.settings.company.placeholders.website}
                    />
                </div>
            </div>
        </div>
    )
}
