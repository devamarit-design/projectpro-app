"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useProjects, CompanyProfile } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context" // Add this
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore" // update import
import { db } from "@/lib/firebase"

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
    color: 'blue' | 'orange' | 'green' | 'purple' | 'slate' | 'pink' | 'teal' | 'rose' | 'amber' | 'indigo' | 'pastel-pink' | 'pastel-blue' | 'pastel-green' | 'pastel-purple' | 'rainbow' | 'glass' | 'grad-blue' | 'grad-purple' | 'grad-orange' | 'grad-green' | 'rainbow-soft' | 'nebula' | 'sunset' | 'aurora' | 'retro'
    mode: 'light' | 'dark'
    radius: number
    font: string
}

export type TeamSettings = {
    allowInvite: boolean
    defaultRole: 'Staff' | 'Accountant' | 'Manager' | 'Admin'
}

export type NotificationSettings = {
    warnDaysTasks: number
    warnDaysExpenses: number
    notifyOnTaskAssignment: boolean
    notifyOnOverdue: boolean
}

export type FinancialTargets = {
    incomeMin: number
    incomeMax: number
    expenseWarning: number
    expenseLimit: number
}

export type MoodThresholds = {
    relaxed: number
    chill: number
    pumped: number
}

export type Banner = {
    id: string
    url: string
    title?: string
    description?: string
    buttonText?: string
    active: boolean
    order: number
    buttonLink?: string
}

export type Notice = {
    id: string
    content: string
    startDate: string
    endDate: string
    createdBy: string
    createdAt: string
    type?: 'info' | 'warning' | 'success'
}

export type TelegramSettings = {
    enabled: boolean
    botToken: string
    chatId: string
    notifyOnExpense: boolean
    notifyOnPaymentDue: boolean
    notifyOnQuotation: boolean
    notifyOnDailyTasks: boolean // New setting
    paymentDueDays: number
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

    // New persistent settings
    financialTargets: FinancialTargets
    updateFinancialTargets: (data: Partial<FinancialTargets>) => Promise<void>

    moodThresholds: MoodThresholds
    updateMoodThresholds: (data: Partial<MoodThresholds>) => Promise<void>

    banners: Banner[]
    updateBanners: (banners: Banner[]) => Promise<void>

    notices: Notice[]
    updateNotices: (notices: Notice[]) => Promise<void>

    telegramSettings: TelegramSettings
    updateTelegramSettings: (data: TelegramSettings) => Promise<void>

    resetSettings: () => void
    setPreviewTheme: (theme: AppTheme | null) => void
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
    defaultRole: 'Staff'
}

const defaultNotificationSettings: NotificationSettings = {
    warnDaysTasks: 3,
    warnDaysExpenses: 7,
    notifyOnTaskAssignment: true,
    notifyOnOverdue: true
}

const defaultFinancialTargets: FinancialTargets = {
    incomeMin: 50000,
    incomeMax: 150000,
    expenseWarning: 30000,
    expenseLimit: 50000
}

const defaultMoodThresholds: MoodThresholds = {
    relaxed: 0,
    chill: 1,
    pumped: 2
}

// Default banners (Curated for App Introduction)
const defaultBanners: Banner[] = [
    {
        id: "default-1",
        title: "Welcome to ProjectPro",
        description: "Your all-in-one platform for construction management. Slide to learn more.",
        active: true,
        order: 0,
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", // Modern Office/Dashboard
        buttonText: "Get Started",
        buttonLink: "/projects"
    },
    {
        id: "default-2",
        title: "Master Project Control",
        description: "Track progress, manage timelines, and organize blueprints in one place.",
        active: true,
        order: 1,
        url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80", // Architecture/Blueprints
        buttonText: "View Projects",
        buttonLink: "/projects"
    },
    {
        id: "default-3",
        title: "Smart Financial Tracking",
        description: "Scan receipts with AI, split bills, and monitor project budgets in real-time.",
        active: true,
        order: 2,
        url: "https://images.unsplash.com/photo-1554224155-9726b551e7a5?auto=format&fit=crop&w=1200&q=80", // Finance/Calculator
        buttonText: "Manage Finances",
        buttonLink: "/expenses"
    },
    {
        id: "default-4",
        title: "Collaborate Anywhere",
        description: "Connect your entire team. Assign tasks and chat directly within the app.",
        active: true,
        order: 3,
        url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80", // Team Collaboration
        buttonText: "Invite Team",
        buttonLink: "/settings/team"
    },
    {
        id: "default-5",
        title: "Data-Driven Decisions",
        description: "Gain insights with powerful analytics and automated reports.",
        active: true,
        order: 4,
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80", // Analytics/Charts
        buttonText: "View Reports",
        buttonLink: "/financial-report"
    }
]

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // Integration with ProjectContext
    const { companyProfile, updateCompanyProfile, currentUser } = useProjects()
    const { currentOrg } = useOrganization() // Get current org

    const [documentSettings, setDocumentSettings] = useState<Record<string, DocumentTemplate>>({
        quotation: { ...defaultDocumentTemplate, terms: "1. Quotation valid for 30 days.\n2. 50% deposit required to start." },
        contract: { ...defaultDocumentTemplate, terms: "1. This contract is binding.\n2. Work will commence upon deposit." },
        invoice: { ...defaultDocumentTemplate, terms: "1. Payment due upon receipt." }
    })
    const [appTheme, setAppTheme] = useState<AppTheme>(defaultTheme)
    const [previewTheme, setPreviewTheme] = useState<AppTheme | null>(null)
    const [teamSettings, setTeamSettings] = useState<TeamSettings>(defaultTeamSettings)
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings)

    // Cloud Settings State
    const [financialTargets, setFinancialTargets] = useState<FinancialTargets>(defaultFinancialTargets)
    const [moodThresholds, setMoodThresholds] = useState<MoodThresholds>(defaultMoodThresholds)
    const [banners, setBanners] = useState<Banner[]>(defaultBanners)
    const [notices, setNotices] = useState<Notice[]>([])
    const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
        enabled: false,
        botToken: "",
        chatId: "",
        notifyOnExpense: true,
        notifyOnPaymentDue: true,
        notifyOnQuotation: true,
        notifyOnDailyTasks: false,
        paymentDueDays: 3
    })

    const [isLoaded, setIsLoaded] = useState(false)

    // Load from LocalStorage on mount (Global defaults/legacy)
    useEffect(() => {
        const load = <T,>(key: string, setter: (value: T) => void) => {
            const saved = localStorage.getItem(`hipslothproject_settings_${key}`)
            if (saved) {
                try {
                    setter(JSON.parse(saved))
                } catch (e) {
                    console.error(`Failed to parse settings for ${key}`, e)
                }
            }
        }

        load('documentSettings', setDocumentSettings)
        load('teamSettings', setTeamSettings)
        load('notificationSettings', setNotificationSettings)

        // Load org-scoped theme FIRST if lastOrgId exists, otherwise fallback to global
        const lastOrgId = localStorage.getItem('lastOrgId')
        if (lastOrgId) {
            const orgTheme = localStorage.getItem(`hipslothproject_settings_${lastOrgId}_appTheme`)
            if (orgTheme) {
                try {
                    setAppTheme(JSON.parse(orgTheme))
                } catch (e) {
                    console.error('Failed to parse org theme from local storage', e)
                    load('appTheme', setAppTheme) // Fallback to global
                }
            } else {
                load('appTheme', setAppTheme) // No org theme, use global
            }
        } else {
            load('appTheme', setAppTheme) // No org selected, use global
        }

        setTimeout(() => setIsLoaded(true), 0)
    }, [])


    // Load/Sync Org-Scoped Theme
    useEffect(() => {
        if (!isLoaded) return
        if (!currentOrg?.id || !currentUser?.id) return

        // 1. Try Local Storage first (fastest)
        const savedOrgTheme = localStorage.getItem(`hipslothproject_settings_${currentOrg.id}_appTheme`)
        if (savedOrgTheme) {
            try {
                setAppTheme(JSON.parse(savedOrgTheme))
            } catch (e) {
                console.error("Failed to parse org theme from local storage", e)
            }
        }

        // 2. Fetch from Firestore (Source of Truth) - with graceful fallback
        const fetchOrgSettings = async () => {
            try {
                const orgSettingsRef = doc(db, "users", currentUser.id, "orgSettings", currentOrg.id)
                const snap = await getDoc(orgSettingsRef)
                if (snap.exists() && snap.data().theme) {
                    const theme = snap.data().theme
                    setAppTheme(theme)
                    // Sync to local storage
                    localStorage.setItem(`hipslothproject_settings_${currentOrg.id}_appTheme`, JSON.stringify(theme))
                } else if (currentUser.settings?.theme) {
                    // Fallback to global user theme if org-specific doesn't exist
                    setAppTheme(currentUser.settings.theme)
                }
            } catch (error: any) {
                // Gracefully handle permission errors - use local storage or default theme
                console.warn("Org settings fetch failed (may need firestore rules deployment):", error?.code || error)
                // If local storage was already loaded above, this is fine.
                // Otherwise, fall back to global user theme or default
                if (!savedOrgTheme && currentUser.settings?.theme) {
                    setAppTheme(currentUser.settings.theme)
                }
            }
        }

        fetchOrgSettings()
    }, [currentOrg?.id, currentUser?.id, isLoaded])


    // Real-time Sync with Firestore Organization Settings
    useEffect(() => {
        if (!currentOrg?.id) {
            setFinancialTargets(defaultFinancialTargets)
            setMoodThresholds(defaultMoodThresholds)
            setBanners(defaultBanners)
            setNotices([])
            setTelegramSettings({ enabled: false, botToken: "", chatId: "", notifyOnExpense: true, notifyOnPaymentDue: true, notifyOnQuotation: true, notifyOnDailyTasks: false, paymentDueDays: 3 })
            return
        }

        // ORG ISOLATION: Clear current data state to prevent leaks while loading next org
        setFinancialTargets(defaultFinancialTargets)
        setMoodThresholds(defaultMoodThresholds)
        setBanners(defaultBanners)
        setNotices([])
        setTelegramSettings({ enabled: false, botToken: "", chatId: "", notifyOnExpense: true, notifyOnPaymentDue: true, notifyOnQuotation: true, notifyOnDailyTasks: false, paymentDueDays: 3 })

        const orgRef = doc(db, "organizations", currentOrg.id)
        const unsubscribe = onSnapshot(orgRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()

                // Income/Expense Targets
                if (data.settings?.financialTargets) {
                    setFinancialTargets(data.settings.financialTargets)
                } else {
                    setFinancialTargets(defaultFinancialTargets)
                }

                // AI/Mood Thresholds
                if (data.settings?.moodThresholds) {
                    setMoodThresholds(data.settings.moodThresholds)
                } else {
                    setMoodThresholds(defaultMoodThresholds)
                }

                // Marketing Banners
                if (data.settings?.banners && data.settings.banners.length > 0) {
                    setBanners(data.settings.banners)
                } else {
                    setBanners(defaultBanners)
                }

                // Organization Notices
                if (data.settings?.notices) {
                    setNotices(data.settings.notices)
                } else {
                    setNotices([])
                }

                // Telegram Settings (Owner only sees full data)
                if (data.settings?.telegram) {
                    setTelegramSettings({
                        notifyOnQuotation: true,
                        notifyOnDailyTasks: false,
                        ...data.settings.telegram
                    })
                } else {
                    setTelegramSettings({ enabled: false, botToken: "", chatId: "", notifyOnExpense: true, notifyOnPaymentDue: true, notifyOnQuotation: true, notifyOnDailyTasks: false, paymentDueDays: 3 })
                }
            } else {
                // Document not found? Revert to defaults
                setFinancialTargets(defaultFinancialTargets)
                setMoodThresholds(defaultMoodThresholds)
                setBanners(defaultBanners)
                setNotices([])
                setTelegramSettings({ enabled: false, botToken: "", chatId: "", notifyOnExpense: true, notifyOnPaymentDue: true, notifyOnQuotation: true, notifyOnDailyTasks: false, paymentDueDays: 3 })
            }
        }, (error) => {
            console.warn("Organization settings sync error:", error)
        })

        return () => unsubscribe()
    }, [currentOrg?.id])

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem('hipslothproject_settings_documentSettings', JSON.stringify(documentSettings))
    }, [documentSettings, isLoaded])

    useEffect(() => {
        if (!isLoaded) return
        if (currentOrg?.id) {
            localStorage.setItem(`hipslothproject_settings_${currentOrg.id}_appTheme`, JSON.stringify(appTheme))
        } else {
            localStorage.setItem('hipslothproject_settings_appTheme', JSON.stringify(appTheme))
        }

        const activeTheme = previewTheme || appTheme

        // Apply theme to DOM
        const colorMap: Record<string, string> = {
            // Vibrant Colors
            orange: '24.6 95% 53.1%', // Orange 500
            blue: '221.2 83.2% 53.3%', // Blue 500
            green: '142.1 76.2% 36.3%', // Green 500
            purple: '262.1 83.3% 57.8%', // Purple 500
            slate: '215.4 16.3% 46.9%', // Slate 500
            pink: '330.4 81.2% 60.4%', // Pink 500
            teal: '172.5 66% 50.4%', // Teal 500
            rose: '346.8 77.2% 49.8%', // Rose 500
            amber: '37.7 92.1% 50.2%', // Amber 500
            indigo: '238.7 83.5% 66.7%', // Indigo 500
            // Pastel Colors
            'pastel-pink': '326 78% 75%',
            'pastel-blue': '210 100% 75%',
            'pastel-green': '150 80% 70%',
            'pastel-purple': '270 67% 75%',
            // Special Themes
            'rainbow': '280 85% 55%', // Violet base for rainbow
            'glass': '210 40% 50%', // Muted blue-gray for glass
            // Gradients (Fallbacks)
            'grad-blue': '221.2 83.2% 53.3%',
            'grad-purple': '262.1 83.3% 57.8%',
            'grad-orange': '24.6 95% 53.1%',
            'grad-green': '142.1 76.2% 36.3%',
            // Special (Fallbacks)
            'rainbow-soft': '330 80% 80%',
            'nebula': '260 60% 40%',
            'sunset': '20 90% 60%',
            'aurora': '180 80% 40%',
            'retro': '30 90% 60%'
        }

        const primaryColor = colorMap[activeTheme.color] || '240 5.9% 10%' // Default to Zinc 950/Black

        const gradientMap: Record<string, string> = {
            'rainbow': 'linear-gradient(135deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb, #ff9ff3, #54a0ff)',
            'rainbow-soft': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
            'nebula': 'linear-gradient(to right, #c33764, #1d2671)',
            'sunset': 'linear-gradient(to right, #f12711, #f5af19)',
            'aurora': 'linear-gradient(to right, #00c6ff, #0072ff)',
            'retro': 'linear-gradient(to right, #833ab4, #fd1d1d, #fcb045)',
            'grad-blue': 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            'grad-purple': 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            'grad-orange': 'linear-gradient(135deg, #fb923c, #f97316)',
            'grad-green': 'linear-gradient(135deg, #4ade80, #22c55e)'
        }

        const gradient = gradientMap[activeTheme.color]

        if (gradient) {
            // Set data attribute for gradient mode
            document.documentElement.setAttribute('data-theme-gradient', 'true')

            // Set specific attribute for rainbow for legacy support or specific overrides
            if (activeTheme.color.startsWith('rainbow') || activeTheme.color === 'retro') {
                document.documentElement.setAttribute('data-theme-rainbow', 'true')
            } else {
                document.documentElement.removeAttribute('data-theme-rainbow')
            }

            // Set fallback primary color variable (using the one from colorMap or a default)
            const fallbackColor = colorMap[activeTheme.color] || '240 5.9% 10%'
            document.documentElement.style.setProperty('--primary', `hsl(${fallbackColor})`)

            // Set Gradient Variable
            document.documentElement.style.setProperty('--primary-gradient', gradient)

            // Ring color usually matches primary
            document.documentElement.style.setProperty('--ring', `hsl(${fallbackColor})`)
        } else {
            // Remove gradient attributes
            document.documentElement.removeAttribute('data-theme-rainbow')
            document.documentElement.removeAttribute('data-theme-gradient')
            document.documentElement.style.removeProperty('--primary-gradient')

            // Handle Glass theme
            if (activeTheme.color === 'glass') {
                document.documentElement.setAttribute('data-theme-glass', 'true')
            } else {
                document.documentElement.removeAttribute('data-theme-glass')
            }

            // Update CSS Variable for Tailwind
            document.documentElement.style.setProperty('--primary', `hsl(${primaryColor})`)
            // Also update ring for consistency
            document.documentElement.style.setProperty('--ring', `hsl(${primaryColor})`)
        }

        // Apply Global Radius - 0 = 0rem, 0.5 = 0.5rem, 1 = 1rem
        const radiusValue = `${activeTheme.radius}rem`
        document.documentElement.style.setProperty('--radius', radiusValue)

        // Apply Global Font
        document.body.style.fontFamily = activeTheme.font === 'Kanit' ? 'var(--font-sans), sans-serif'
            : activeTheme.font === 'Sarabun' ? 'Sarabun, sans-serif'
                : activeTheme.font === 'Inter' ? 'Inter, sans-serif'
                    : 'Prompt, sans-serif'

        // Apply Mode
        if (activeTheme.mode === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (activeTheme.mode === 'light') {
            document.documentElement.classList.remove('dark')
        } else {
            // System
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        }
    }, [appTheme, previewTheme, isLoaded, currentOrg?.id])

    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem('hipslothproject_settings_teamSettings', JSON.stringify(teamSettings))
    }, [teamSettings, isLoaded])

    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem('hipslothproject_settings_notificationSettings', JSON.stringify(notificationSettings))
    }, [notificationSettings, isLoaded])


    // Map ProjectContext functions
    const updateOrgProfile = React.useCallback(async (data: Partial<OrgProfile>) => {
        await updateCompanyProfile(data)
    }, [updateCompanyProfile])

    const updateDocumentTemplate = React.useCallback((type: string, data: Partial<DocumentTemplate>) => {
        setDocumentSettings(prev => ({
            ...prev,
            [type]: { ...prev[type], ...data }
        }))
    }, [])

    const updateAppTheme = React.useCallback(async (data: Partial<AppTheme>) => {
        const newTheme = { ...appTheme, ...data }
        setAppTheme(newTheme)

        // Persist to Local Storage immediately
        if (currentOrg?.id) {
            localStorage.setItem(`hipslothproject_settings_${currentOrg.id}_appTheme`, JSON.stringify(newTheme))
        }

        // Persist to Firestore if user is logged in
        if (currentUser) {
            try {
                // Save to Org-Scoped settings if in an org
                if (currentOrg?.id) {
                    const orgSettingsRef = doc(db, "users", currentUser.id, "orgSettings", currentOrg.id)
                    await setDoc(orgSettingsRef, {
                        theme: newTheme,
                        updatedAt: new Date().toISOString()
                    }, { merge: true })
                } else {
                    // Save to Global settings as fallback/base
                    const userRef = doc(db, "users", currentUser.id)
                    await setDoc(userRef, {
                        settings: {
                            theme: newTheme
                        }
                    }, { merge: true })
                }
            } catch (error) {
                console.error("Failed to save theme settings:", error)
            }
        }
    }, [appTheme, currentOrg?.id, currentUser])

    // Initial theme load from user profile is now handled by the org-scoped sync effect

    const updateTeamSettings = React.useCallback((data: Partial<TeamSettings>) => {
        setTeamSettings(prev => ({ ...prev, ...data }))
    }, [])

    const updateNotificationSettings = React.useCallback((data: Partial<NotificationSettings>) => {
        setNotificationSettings(prev => ({ ...prev, ...data }))
    }, [])

    const updateFinancialTargets = React.useCallback(async (data: Partial<FinancialTargets>) => {
        if (!currentOrg?.id) return
        if (currentUser?.role !== 'Owner' && currentUser?.role !== 'Admin') return
        const newTargets = { ...financialTargets, ...data }
        setFinancialTargets(newTargets) // Optimistic update

        try {
            const orgRef = doc(db, "organizations", currentOrg.id)
            await setDoc(orgRef, {
                settings: {
                    ...currentOrg.settings, // Preserve other settings
                    financialTargets: newTargets
                }
            }, { merge: true })
        } catch (error) {
            console.error("Failed to update financial targets:", error)
            // Revert? (Optional, kept simple for now)
        }
    }, [currentOrg, currentUser?.role, financialTargets])

    const updateMoodThresholds = React.useCallback(async (data: Partial<MoodThresholds>) => {
        if (!currentOrg?.id) return
        if (currentUser?.role !== 'Owner' && currentUser?.role !== 'Admin') return
        const newThresholds = { ...moodThresholds, ...data }
        setMoodThresholds(newThresholds) // Optimistic update

        try {
            const orgRef = doc(db, "organizations", currentOrg.id)
            await setDoc(orgRef, {
                settings: {
                    ...currentOrg.settings,
                    moodThresholds: newThresholds
                }
            }, { merge: true })
        } catch (error) {
            console.error("Failed to update mood thresholds:", error)
        }
    }, [currentOrg, currentUser?.role, moodThresholds])

    const updateBanners = React.useCallback(async (newBanners: Banner[]) => {
        if (!currentOrg?.id) return
        if (currentUser?.role !== 'Owner' && currentUser?.role !== 'Admin') return
        setBanners(newBanners) // Optimistic update

        try {
            const orgRef = doc(db, "organizations", currentOrg.id)
            await setDoc(orgRef, {
                settings: {
                    ...currentOrg.settings,
                    banners: newBanners
                }
            }, { merge: true })
        } catch (error) {
            console.error("Failed to update banners:", error)
        }
    }, [currentOrg, currentUser?.role])

    const updateNotices = React.useCallback(async (newNotices: Notice[]) => {
        if (!currentOrg?.id) return
        // Allow Accountant and above to manage notices
        const allowedRoles = ['Owner', 'Admin', 'Manager', 'Accountant']
        if (!currentUser?.role || !allowedRoles.includes(currentUser.role)) return
        setNotices(newNotices) // Optimistic update

        try {
            const orgRef = doc(db, "organizations", currentOrg.id)
            await setDoc(orgRef, {
                settings: {
                    ...currentOrg.settings,
                    notices: newNotices
                }
            }, { merge: true })
        } catch (error) {
            console.error("Failed to update notices:", error)
        }
    }, [currentOrg, currentUser?.role])

    const updateTelegramSettings = React.useCallback(async (data: TelegramSettings) => {
        if (!currentOrg?.id) return
        // Only Owner can update telegram settings
        if (currentUser?.role !== 'Owner') return
        setTelegramSettings(data) // Optimistic update

        try {
            const orgRef = doc(db, "organizations", currentOrg.id)
            await setDoc(orgRef, {
                settings: {
                    ...(currentOrg.settings || {}),
                    telegram: data
                }
            }, { merge: true })
        } catch (error) {
            console.error("Failed to update telegram settings:", error)
            throw error
        }
    }, [currentOrg, currentUser?.role])


    const resetSettings = React.useCallback(() => {
        // Only reset local settings, not company profile (which is synced)
        setDocumentSettings({
            quotation: defaultDocumentTemplate,
            contract: defaultDocumentTemplate,
            invoice: defaultDocumentTemplate
        })
        setAppTheme(defaultTheme)
        setTeamSettings(defaultTeamSettings)
        setNotificationSettings(defaultNotificationSettings)
    }, [])

    const value = React.useMemo(() => ({
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

        financialTargets,
        updateFinancialTargets,
        moodThresholds,
        updateMoodThresholds,
        banners,
        updateBanners,
        notices,
        updateNotices,
        telegramSettings,
        updateTelegramSettings,
        resetSettings,
        setPreviewTheme
    }), [
        companyProfile,
        updateOrgProfile,
        documentSettings,
        updateDocumentTemplate,
        appTheme,
        updateAppTheme,
        teamSettings,
        updateTeamSettings,
        notificationSettings,
        updateNotificationSettings,
        financialTargets,
        updateFinancialTargets,
        moodThresholds,
        updateMoodThresholds,
        banners,
        updateBanners,
        notices,
        updateNotices,
        telegramSettings,
        updateTelegramSettings,
    ])

    return (
        <SettingsContext.Provider value={value}>
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
