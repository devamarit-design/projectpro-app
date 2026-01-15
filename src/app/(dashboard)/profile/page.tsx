"use client"

import * as React from "react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Mail, Phone, Shield, User as UserIcon, Save, X, Camera, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
    const { currentUser, updateUser, setCurrentUser } = useProjects()
    const { t } = useTranslation()

    const [isEditing, setIsEditing] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: "",
        phone: "",
        email: ""
    })

    React.useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name,
                phone: currentUser.phone || "",
                email: currentUser.email || ""
            })
        }
    }, [currentUser])

    const handleSave = () => {
        if (!currentUser) return

        updateUser(currentUser.id, {
            name: formData.name,
            phone: formData.phone,
            email: formData.email
        })
        setIsEditing(false)
    }

    const handleCancel = () => {
        if (currentUser) {
            setFormData({
                name: currentUser.name,
                phone: currentUser.phone || "",
                email: currentUser.email || ""
            })
        }
        setIsEditing(false)
    }

    if (!currentUser) return null

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t.common.profile}</h1>
                    <p className="text-muted-foreground">{t.common.personal_info}</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium shadow-lg hover:translate-y-0.5 transition-all"
                    >
                        {t.common.edit_profile}
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="bg-muted text-muted-foreground px-4 py-2 rounded-xl font-medium hover:bg-muted/80 transition-all"
                        >
                            {t.common.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium shadow-lg hover:translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {t.common.save}
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Card */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-purple-500/10" />

                {/* Avatar Section */}
                <div className="relative flex flex-col items-center">
                    <div className="w-32 h-32 rounded-3xl bg-background shadow-2xl flex items-center justify-center text-4xl font-bold text-primary border-4 border-card relative group cursor-pointer overflow-hidden">
                        {/* Placeholder Avatar */}
                        {!currentUser.avatar ? (
                            currentUser.name.charAt(0).toUpperCase()
                        ) : (
                            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-2 border",
                            currentUser.role === 'Admin' || currentUser.role === 'Owner'
                                ? "bg-purple-500/10 text-purple-600 border-purple-200"
                                : "bg-blue-500/10 text-blue-600 border-blue-200"
                        )}>
                            <Shield className="w-3 h-3" />
                            {currentUser.role}
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            {t.profile.fields.name}
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-xl font-medium">
                                {currentUser.name}
                            </div>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {t.profile.fields.email}
                        </label>
                        {isEditing ? (
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-xl font-medium">
                                {currentUser.email || "-"}
                            </div>
                        )}
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {t.profile.fields.phone}
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-xl font-medium font-mono">
                                {currentUser.phone || "-"}
                            </div>
                        )}
                    </div>

                    {/* Role Field (Read Only) */}
                    <div className="space-y-2 opacity-70">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            {t.profile.fields.role}
                        </label>
                        <div className="p-3 bg-muted/30 rounded-xl font-medium">
                            {currentUser.role}
                        </div>
                    </div>
                </div>

                {/* Log Out Button */}
                <div className="pt-6 border-t border-border flex justify-center">
                    <button
                        onClick={() => {
                            if (window.confirm(t.common.confirm_logout)) {
                                setCurrentUser(null)
                                window.location.href = "/"
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-xl font-bold transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        {t.common.log_out}
                    </button>
                </div>
            </div>
        </div>
    )
}
