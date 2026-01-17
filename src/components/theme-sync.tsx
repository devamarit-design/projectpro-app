"use client"

import { useTheme } from "next-themes"
import { useProjects } from "@/context/project-context"
import { useEffect, useRef } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function ThemeSync() {
    const { theme, setTheme } = useTheme()
    const { currentUser } = useProjects()
    const isInitialMount = useRef(true)

    // 1. Sync User -> Local (On Login/Mount)
    useEffect(() => {
        if (currentUser?.theme && currentUser.theme !== theme) {
            setTheme(currentUser.theme)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id]) // Run when user changes (login)

    // 2. Sync Local -> User (On Change)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        if (!currentUser || !theme) return

        // Debounce update to avoid spamming Firestore
        const timer = setTimeout(async () => {
            if (currentUser.theme !== theme) {
                try {
                    await updateDoc(doc(db, "users", currentUser.id), {
                        theme: theme
                    })
                } catch (error) {
                    console.error("Failed to sync theme preference", error)
                }
            }
        }, 2000)

        return () => clearTimeout(timer)
    }, [theme, currentUser])

    return null
}
