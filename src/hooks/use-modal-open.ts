"use client"

import { useState, useEffect } from "react"

export function useIsModalOpen() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        const checkModal = () => {
            if (typeof document === "undefined") return

            // 1. Check for standard modal-open class on body
            const hasModalOpenClass = document.body.classList.contains("modal-open")

            // 2. Check for scroll lock attributes (Radix / Headless UI / UI kits)
            const hasScrollLocked = document.body.getAttribute("data-scroll-locked") === "1"
            const hasOverflowHidden = document.body.style.overflow === "hidden"

            // 3. Check for open Dialog, Sheet, Drawer, or Alert dialogs
            const hasDialog = !!document.querySelector('[role="dialog"], [role="alertdialog"]')
            const hasRadixOpen = !!document.querySelector('[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]')
            const hasPortal = !!document.querySelector('[data-radix-portal]')

            // 4. Check for high z-index overlay popups and backdrops
            const hasCustomBackdrop = !!document.querySelector(
                '.fixed.inset-0.z-\\[100\\], .fixed.inset-0.z-\\[160\\], .fixed.inset-0.z-\\[200\\], .fixed.inset-0.z-\\[9999\\]'
            )

            const isOpen = Boolean(
                hasModalOpenClass ||
                hasScrollLocked ||
                hasOverflowHidden ||
                hasDialog ||
                hasRadixOpen ||
                hasPortal ||
                hasCustomBackdrop
            )

            setIsModalOpen(isOpen)
        }

        checkModal()

        // MutationObserver to track any modal appearing/disappearing dynamically
        const observer = new MutationObserver(checkModal)
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ["class", "data-state", "style"],
        })

        return () => observer.disconnect()
    }, [])

    return isModalOpen
}
