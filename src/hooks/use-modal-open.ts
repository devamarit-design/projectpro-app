"use client"

import { useState, useEffect } from "react"

export function useIsModalOpen() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        const checkModal = () => {
            if (typeof document === "undefined") return

            // 1. Check for standard modal-open class on body
            const hasModalOpenClass = document.body.classList.contains("modal-open")

            // 2. Check for Radix scroll lock attribute
            const hasScrollLocked = document.body.getAttribute("data-scroll-locked") === "1"

            // 3. Check for open Radix Dialog / Sheet / Alert dialog
            const hasRadixOpen = !!document.querySelector(
                '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-state="open"].fixed.inset-0'
            )

            // 4. Custom data-modal-open attribute
            const hasCustomModal = !!document.querySelector('[data-modal-open="true"]')

            const isOpen = Boolean(hasModalOpenClass || hasScrollLocked || hasRadixOpen || hasCustomModal)
            setIsModalOpen(isOpen)
        }

        checkModal()

        // MutationObserver to track when a modal is opened or closed
        const observer = new MutationObserver(checkModal)
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ["class", "data-state", "data-scroll-locked"],
        })

        return () => observer.disconnect()
    }, [])

    return isModalOpen
}
