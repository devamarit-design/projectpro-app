"use client"

import * as React from "react"
import { en } from "@/lib/dictionaries/en"
import { th } from "@/lib/dictionaries/th"

type Locale = "en" | "th"
type Dictionary = typeof en

const dictionaries = { en, th }

interface LanguageContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: Dictionary
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Try to load saved locale from localStorage or default to 'en'
    const [locale, setLocaleState] = React.useState<Locale>("en")

    React.useEffect(() => {
        const saved = localStorage.getItem("app-locale") as Locale
        if (saved) setLocaleState(saved)
    }, [])

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem("app-locale", newLocale)
    }

    const value = {
        locale,
        setLocale,
        t: dictionaries[locale],
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useTranslation() {
    const context = React.useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useTranslation must be used within a LanguageProvider")
    }
    return context
}
