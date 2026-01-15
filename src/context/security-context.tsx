"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { get, set, del } from "idb-keyval"

interface SecurityContextType {
    isAuthenticated: boolean
    isLocked: boolean
    hasPin: boolean
    isLoading: boolean
    setPin: (pin: string) => Promise<void>
    verifyPin: (pin: string) => Promise<boolean>
    unlockApp: (pin: string) => Promise<boolean>
    removePin: () => Promise<void>
    lockApp: () => void
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export function SecurityProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLocked, setIsLocked] = useState(true) // Default to locked
    const [hasPin, setHasPin] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkPinStatus()
    }, [])

    const checkPinStatus = async () => {
        try {
            const savedPin = await get<string>("app_security_pin")
            const sessionUnlocked = typeof window !== 'undefined' ? sessionStorage.getItem("app_security_unlocked") : null

            if (savedPin) {
                setHasPin(true)
                if (sessionUnlocked === "true") {
                    setIsLocked(false)
                    setIsAuthenticated(true)
                } else {
                    setIsLocked(true) // Should be locked if PIN exists and no session
                    setIsAuthenticated(false)
                }
            } else {
                setHasPin(false)
                setIsLocked(false) // Not locked if no PIN
                setIsAuthenticated(true)
            }
        } catch (error) {
            console.error("Failed to check PIN status", error)
        } finally {
            setIsLoading(false)
        }
    }

    const setPin = async (pin: string) => {
        await set("app_security_pin", pin)
        // Also unlock current session
        sessionStorage.setItem("app_security_unlocked", "true")
        setHasPin(true)
        setIsAuthenticated(true)
        setIsLocked(false)
    }

    const verifyPin = async (inputPin: string) => {
        const savedPin = await get<string>("app_security_pin")
        return savedPin === inputPin
    }

    const unlockApp = async (inputPin: string) => {
        const isValid = await verifyPin(inputPin)
        if (isValid) {
            sessionStorage.setItem("app_security_unlocked", "true")
            setIsLocked(false)
            setIsAuthenticated(true)
            return true
        }
        return false
    }

    const lockApp = () => {
        if (hasPin) {
            sessionStorage.removeItem("app_security_unlocked")
            setIsLocked(true)
            setIsAuthenticated(false)
        }
    }

    const removePin = async () => {
        await del("app_security_pin")
        setHasPin(false)
        setIsLocked(false)
        setIsAuthenticated(true)
    }

    return (
        <SecurityContext.Provider value={{
            isAuthenticated,
            isLocked,
            hasPin,
            isLoading,
            setPin,
            verifyPin,
            unlockApp,
            removePin,
            lockApp
        }}>
            {children}
        </SecurityContext.Provider>
    )
}

export function useSecurity() {
    const context = useContext(SecurityContext)
    if (context === undefined) {
        throw new Error("useSecurity must be used within a SecurityProvider")
    }
    return context
}
