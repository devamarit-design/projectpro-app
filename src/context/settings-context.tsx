"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useProjects, CompanyProfile } from "@/context/project-context"

export type DocumentTemplate = {
    header: string
    footer: string
    terms: string
    logoVisible: boolean
    signatureVisible: boolean
    accentColor: string
    font: string
    columns: {
        id: string
        label: string
        visible: boolean
        order: number
    }[]
}

// Re-export or Alias for compatibility
export type OrgProfile = CompanyProfile

export type AppTheme = {
    color: 'blue' | 'orange' | 'green' | 'purple' | 'slate'
    mode: 'light' | 'dark'
    radius: number
    font: string
}

export type TeamSettings = {
    allowInvite: boolean
    defaultRole: 'Member' | 'Admin'
}

export type NotificationSettings = {
    warnDaysBeforeDue: number
    notifyOnTaskAssignment: boolean
    notifyOnOverdue: boolean
}

type SettingsContextType = {
    // Mapped from ProjectContext
    orgProfile: OrgProfile
    updateOrgProfile: (data: Partial<OrgProfile>) => Promise<void>

    documentSettings: Record<string, DocumentTemplate>
    updateDocumentTemplate: (type: string, data: Partial<DocumentTemplate>) => void

    appTheme: AppTheme
    updateAppTheme: (data: Partial<AppTheme>) => void

    teamSettings: TeamSettings
    updateTeamSettings: (data: Partial<TeamSettings>) => void

    notificationSettings: NotificationSettings
    updateNotificationSettings: (data: Partial<NotificationSettings>) => void

    resetSettings: () => void
}

const defaultDocumentTemplate: DocumentTemplate = {
    header: "My Construction Co.\n123 Builder Lane, Construct City\nTel: 02-123-4567",
    footer: "Thank you for your business.",
    terms: "1. Payment is due within 30 days.\n2. Please include invoice number on your check.",
    logoVisible: true,
    signatureVisible: true,
    accentColor: "#f97316", // Orange default
    font: "Kanit",
    columns: [
        { id: "item", label: "Item", visible: true, order: 1 },
        { id: "description", label: "Description", visible: true, order: 2 },
        { id: "qty", label: "Qty", visible: true, order: 3 },
        { id: "unit", label: "Unit", visible: true, order: 4 },
        { id: "price", label: "Price", visible: true, order: 5 },
        { id: "total", label: "Total", visible: true, order: 6 },
    ]
}

const defaultTheme: AppTheme = {
    color: 'orange',
    mode: 'light',
    radius: 0.5,
    font: 'Kanit'
}

const defaultTeamSettings: TeamSettings = {
    allowInvite: true,
    defaultRole: 'Member'
}

const defaultNotificationSettings: NotificationSettings = {
    warnDaysBeforeDue: 3,
    notifyOnTaskAssignment: true,
    notifyOnOverdue: true
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // Integration with ProjectContext
    const { companyProfile, updateCompanyProfile } = useProjects()

    const [documentSettings, setDocumentSettings] = useState<Record<string, DocumentTemplate>>({
        quotation: { ...defaultDocumentTemplate, terms: "1. Quotation valid for 30 days.\n2. 50% deposit required to start." },
        contract: { ...defaultDocumentTemplate, terms: "1. This contract is binding.\n2. Work will commence upon deposit." },
        invoice: { ...defaultDocumentTemplate, terms: "1. Payment due upon receipt." }
    })
    const [appTheme, setAppTheme] = useState<AppTheme>(defaultTheme)
    const [teamSettings, setTeamSettings] = useState<TeamSettings>(defaultTeamSettings)
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from LocalStorage on mount
    useEffect(() => {
        const load = (key: string, setter: any) => {
            const saved = localStorage.getItem(`projectpro_settings_${key}`)
            if (saved) {
                try {
                    setter(JSON.parse(saved))
                } catch (e) {
                    console.error(`Failed to parse settings for ${key}`, e)
                }
            }
        }

        // Removed orgProfile load
        load('documentSettings', setDocumentSettings)
        load('appTheme', setAppTheme)
        load('teamSettings', setTeamSettings)
        load('notificationSettings', setNotificationSettings)
        setIsLoaded(true)
    }, [])

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem('projectpro_settings_documentSettings', JSON.stringify(documentSettings))
    }, [documentSettings, isLoaded])

    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem('projectpro_settings_appTheme', JSON.stringify(appTheme))

        // Apply theme to DOM
        const colorMap: Record<string, string> = {
            orange: '24.6 95% 53.1%', // Orange 500
            blue: '221.2 83.2% 53.3%', // Blue 500
            green: '142.1 76.2% 36.3%', // Green 500
            purple: '262.1 83.3% 57.8%', // Purple 500
            slate: '215.4 16.3% 46.9%' // Slate 500
        }

        const primaryColor = colorMap[appTheme.color] || '240 5.9% 10%' // Default to Zinc 950/Black

        // Update CSS Variable for Tailwind
        document.documentElement.style.setProperty('--primary', `hsl(${primaryColor})`)

        // Also update ring for consistency
        document.documentElement.style.setProperty('--ring', `hsl(${primaryColor})`)

        // Apply Global Font
        document.body.style.fontFamily = appTheme.font === 'Kanit' ? 'var(--font-sans), sans-serif'
            : appTheme.font === 'Sarabun' ? 'Sarabun, sans-serif'
                : appTheme.font === 'Inter' ? 'Inter, sans-serif'
                    : 'Prompt, sans-serif'
    }, [appTheme, isLoaded])

    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem('projectpro_settings_teamSettings', JSON.stringify(teamSettings))
    }, [teamSettings, isLoaded])

    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem('projectpro_settings_notificationSettings', JSON.stringify(notificationSettings))
    }, [notificationSettings, isLoaded])


    // Map ProjectContext functions
    const updateOrgProfile = async (data: Partial<OrgProfile>) => {
        await updateCompanyProfile(data)
    }

    const updateDocumentTemplate = (type: string, data: Partial<DocumentTemplate>) => {
        setDocumentSettings(prev => ({
            ...prev,
            [type]: { ...prev[type], ...data }
        }))
    }

    const updateAppTheme = (data: Partial<AppTheme>) => {
        setAppTheme(prev => ({ ...prev, ...data }))
    }

    const updateTeamSettings = (data: Partial<TeamSettings>) => {
        setTeamSettings(prev => ({ ...prev, ...data }))
    }

    const updateNotificationSettings = (data: Partial<NotificationSettings>) => {
        setNotificationSettings(prev => ({ ...prev, ...data }))
    }

    const resetSettings = () => {
        // Only reset local settings, not company profile (which is synced)
        setDocumentSettings({
            quotation: defaultDocumentTemplate,
            contract: defaultDocumentTemplate,
            invoice: defaultDocumentTemplate
        })
        setAppTheme(defaultTheme)
        setTeamSettings(defaultTeamSettings)
        setNotificationSettings(defaultNotificationSettings)
    }

    return (
        <SettingsContext.Provider value={{
            orgProfile: companyProfile, // Use from ProjectContext
            updateOrgProfile,
            documentSettings,
            updateDocumentTemplate,
            appTheme,
            updateAppTheme,
            teamSettings,
            updateTeamSettings,
            notificationSettings,
            updateNotificationSettings,
            resetSettings
        }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
