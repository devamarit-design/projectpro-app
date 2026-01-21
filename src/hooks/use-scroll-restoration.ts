"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Hook to restore scroll position when navigating back on iOS.
 * Uses sessionStorage to cache scroll positions per route.
 */
export function useScrollRestoration(containerId = "main-scroll-container") {
    const pathname = usePathname()
    const scrollPositions = useRef<Map<string, number>>(new Map())
    const isRestoring = useRef(false)

    useEffect(() => {
        const container = document.getElementById(containerId)
        if (!container) return

        // Restore scroll position on mount/route change
        const key = `scroll_${pathname}`
        const savedPosition = sessionStorage.getItem(key)

        if (savedPosition) {
            isRestoring.current = true
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                container.scrollTop = parseInt(savedPosition, 10)
                isRestoring.current = false
            })
        }

        // Save scroll position on scroll
        const handleScroll = () => {
            if (isRestoring.current) return
            sessionStorage.setItem(key, String(container.scrollTop))
        }

        // Debounced scroll handler
        let scrollTimeout: NodeJS.Timeout
        const debouncedScroll = () => {
            clearTimeout(scrollTimeout)
            scrollTimeout = setTimeout(handleScroll, 100)
        }

        container.addEventListener("scroll", debouncedScroll, { passive: true })

        // Save on page hide (for iOS PWA)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                handleScroll()
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange)

        // Save before unload
        const handleBeforeUnload = () => {
            handleScroll()
        }
        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
            clearTimeout(scrollTimeout)
            container.removeEventListener("scroll", debouncedScroll)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [pathname, containerId])
}
