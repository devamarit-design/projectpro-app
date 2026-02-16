"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type PerformanceContextType = {
    reduceTransparency: boolean
    setReduceTransparency: (value: boolean) => void
    reduceMotion: boolean
    setReduceMotion: (value: boolean) => void
    frameRate: 'normal' | 'high'
    setFrameRate: (value: 'normal' | 'high') => void
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
    const [reduceTransparency, setReduceTransparency] = useState(false)
    const [reduceMotion, setReduceMotion] = useState(false)
    const [frameRate, setFrameRate] = useState<'normal' | 'high'>('high')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Load from localStorage
        const savedTransparency = localStorage.getItem("hipsloth-reduce-transparency")
        const savedMotion = localStorage.getItem("hipsloth-reduce-motion")
        const savedFrameRate = localStorage.getItem("hipsloth-frame-rate")

        if (savedTransparency) setReduceTransparency(JSON.parse(savedTransparency))
        if (savedMotion) setReduceMotion(JSON.parse(savedMotion))
        if (savedFrameRate) setFrameRate(JSON.parse(savedFrameRate))

        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        // Apply classes to body
        if (reduceTransparency) {
            document.body.classList.add("reduce-transparency")
        } else {
            document.body.classList.remove("reduce-transparency")
        }

        if (reduceMotion) {
            document.body.classList.add("reduce-motion")
        } else {
            document.body.classList.remove("reduce-motion")
        }

        // Apply frame rate attribute (for CSS selection if needed)
        document.body.setAttribute("data-framerate", frameRate)

        // Save to localStorage
        localStorage.setItem("hipsloth-reduce-transparency", JSON.stringify(reduceTransparency))
        localStorage.setItem("hipsloth-reduce-motion", JSON.stringify(reduceMotion))
        localStorage.setItem("hipsloth-frame-rate", JSON.stringify(frameRate))
    }, [reduceTransparency, reduceMotion, frameRate, mounted])

    return (
        <PerformanceContext.Provider value={{
            reduceTransparency,
            setReduceTransparency,
            reduceMotion,
            setReduceMotion,
            frameRate,
            setFrameRate
        }}>
            {children}
        </PerformanceContext.Provider>
    )
}

export function usePerformance() {
    const context = useContext(PerformanceContext)
    if (context === undefined) {
        throw new Error("usePerformance must be used within a PerformanceProvider")
    }
    return context
}
