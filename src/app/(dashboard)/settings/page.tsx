"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { Building2, FileText, Palette, Users, Shield, Bell, Send, MonitorSmartphone } from "lucide-react"
import { CompanySettings } from "@/components/settings/company-settings"
import { DocumentSettings } from "@/components/settings/document-settings"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { TeamSettings } from "@/components/settings/team-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { NotificationSettings } from "@/components/settings/notifications-settings"
import { TelegramSettings } from "@/components/settings/telegram-settings"
import { PerformanceSettings } from "@/components/settings/performance-settings"


export default function SettingsPage() {
    const { t } = useTranslation()
    const { currentUser, currentTeam } = useProjects()
    const searchParams = useSearchParams()
    const [activeSection, setActiveSection] = useState("company")
    const isAdmin = currentTeam?.role === 'Admin' || currentTeam?.role === 'Owner'
    const isOwner = currentTeam?.role === 'Owner'

    useEffect(() => {
        const tab = searchParams.get("tab")
        if (tab) {
            setActiveSection(tab)
        }
    }, [searchParams])

    const menuItems = [
        { id: "company", label: t.settings.menu.company, icon: Building2 },
        { id: "documents", label: t.settings.menu.documents, icon: FileText },
        { id: "notifications", label: t.settings.menu.notifications, icon: Bell },
        ...(isOwner ? [{ id: "telegram", label: "Telegram", icon: Send }] : []),
        ...(isAdmin ? [{ id: "team", label: t.settings.menu.team, icon: Users }] : []),
        { id: "security", label: t.settings.menu.security, icon: Shield },
        { id: "theme", label: t.settings.menu.theme, icon: Palette },
        { id: "performance", label: t.settings.menu.performance, icon: MonitorSmartphone },
    ]

    return (
        <div className="max-w-5xl space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">{t.settings.title}</h1>
                <p className="text-muted-foreground mt-2">{t.settings.subtitle}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-2 overflow-x-auto px-4 lg:px-0 pb-4 pt-2 lg:pt-0 lg:pb-0 scrollbar-hide">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeSection === item.id
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1">
                    <div className="bg-background/50 backdrop-blur-sm border rounded-2xl p-6 shadow-sm min-h-[500px]">
                        {activeSection === "company" && <CompanySettings />}
                        {activeSection === "documents" && <DocumentSettings />}
                        {activeSection === "notifications" && <NotificationSettings />}
                        {activeSection === "telegram" && <TelegramSettings />}
                        {activeSection === "theme" && <ThemeSettings />}
                        {activeSection === "performance" && <PerformanceSettings />}
                        {activeSection === "team" && isAdmin && <TeamSettings />}
                        {activeSection === "security" && <SecuritySettings />}

                    </div>
                </main>
            </div>
        </div>
    )
}
