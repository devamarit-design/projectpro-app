
"use client"

import { useEffect } from "react"

export function VersionUpdater() {
    useEffect(() => {
        const checkVersion = async () => {
            try {
                // 0. Skip in development
                if (process.env.NODE_ENV === 'development') {
                    console.log("[VersionCheck] Skipped in development mode")
                    return
                }

                // 1. Get client version (from build time env)
                const clientVersion = process.env.NEXT_PUBLIC_APP_VERSION

                // 2. Get server version (from dynamic API)
                const res = await fetch('/api/system/version?t=' + Date.now(), {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                })
                const data = await res.json()
                const serverVersion = data.version

                console.log(`[VersionCheck] Client: ${clientVersion} | Server: ${serverVersion}`)

                // 3. Compare and Reload if needed
                if (serverVersion && clientVersion && serverVersion !== clientVersion) {
                    console.warn("[VersionCheck] Version mismatch detected! Forcing update...")

                    // Unregister Service Workers
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations()
                        for (const registration of registrations) {
                            await registration.unregister()
                        }
                    }

                    // Clear Caches
                    if ('caches' in window) {
                        const cacheNames = await caches.keys()
                        for (const cacheName of cacheNames) {
                            await caches.delete(cacheName)
                        }
                    }

                    // Force Reload
                    window.location.replace(window.location.href)
                }
            } catch (error) {
                console.error("[VersionCheck] Failed to check version", error)
            }
        }

        // Check immediately on mount
        checkVersion()

        // Optional: Check when window gains focus (user comes back to tab)
        window.addEventListener('focus', checkVersion)
        return () => window.removeEventListener('focus', checkVersion)

    }, [])

    return null // This component doesn't render anything
}
