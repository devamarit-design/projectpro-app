"use client"

import { useState } from "react"
import { Building2, FileText, Palette, Users, Database, Shield } from "lucide-react"
import { CompanySettings } from "@/components/settings/company-settings"
import { DocumentSettings } from "@/components/settings/document-settings"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { TeamSettings } from "@/components/settings/team-settings"
import { DataSettings } from "@/components/settings/data-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { NotificationSettings } from "@/components/settings/notifications-settings"
import { Bell } from "lucide-react"

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState("company")

    const menuItems = [
        { id: "company", label: "Company Profile", icon: Building2 },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "team", label: "Team & Roles", icon: Users },
        { id: "security", label: "Security & Lock", icon: Shield },
        { id: "data", label: "Data Management", icon: Database },
        { id: "theme", label: "App Theme", icon: Palette },
    ]

    return (
        <div className="max-w-5xl space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your organization preferences and document templates.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
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
                        {activeSection === "theme" && <ThemeSettings />}
                        {activeSection === "team" && <TeamSettings />}
                        {activeSection === "security" && <SecuritySettings />}
                        {activeSection === "data" && <DataSettings />}
                    </div>
                </main>
            </div>
        </div>
    )
}
