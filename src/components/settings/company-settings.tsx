"use client"

import { useSettings } from "@/context/settings-context"
import { Building2, Mail, Phone, Globe, MapPin, FileText } from "lucide-react"

export function CompanySettings() {
    const { orgProfile, updateOrgProfile } = useSettings()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b pb-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/20">
                    {orgProfile.logo ? (
                        <img src={orgProfile.logo} alt="Logo" className="h-full w-full object-contain rounded-xl" />
                    ) : (
                        <Building2 className="w-8 h-8 text-primary" />
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Your Company</h3>
                    <p className="text-sm text-muted-foreground">This information will appear on your documents.</p>
                </div>
                <div className="ml-auto">
                    {/* Placeholder for Logo Upload */}
                    <button className="text-sm text-primary hover:underline font-medium">
                        Change Logo
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        Company Name
                    </label>
                    <input
                        type="text"
                        value={orgProfile.name}
                        onChange={(e) => updateOrgProfile({ name: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Company Co., Ltd."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Tax ID / Registration No.
                    </label>
                    <input
                        type="text"
                        value={orgProfile.taxId}
                        onChange={(e) => updateOrgProfile({ taxId: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="0000000000000"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        Address
                    </label>
                    <textarea
                        value={orgProfile.address}
                        onChange={(e) => updateOrgProfile({ address: e.target.value })}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="123 Street..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        Phone
                    </label>
                    <input
                        type="tel"
                        value={orgProfile.phone}
                        onChange={(e) => updateOrgProfile({ phone: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="02-xxx-xxxx"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email
                    </label>
                    <input
                        type="email"
                        value={orgProfile.email}
                        onChange={(e) => updateOrgProfile({ email: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="contact@company.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        Website
                    </label>
                    <input
                        type="url"
                        value={orgProfile.website}
                        onChange={(e) => updateOrgProfile({ website: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="https://..."
                    />
                </div>
            </div>
        </div>
    )
}
