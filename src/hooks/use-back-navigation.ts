"use client"

import { useEffect, useRef } from "react"

export function useBackNavigation(
    open: boolean,
    onOpenChange: (open: boolean) => void,
    componentId?: string
) {
    const modalId = useRef(componentId || `modal-${Math.random().toString(36).substr(2, 9)}`).current
    // Always keep a ref to the latest callback so we DON'T need it in the effect's deps
    const callbackRef = useRef(onOpenChange)
    callbackRef.current = onOpenChange
    // Track if the close was triggered by a popstate event (user pressed Back)
    const closedByPopState = useRef(false)

    useEffect(() => {
        if (!open) return

        closedByPopState.current = false
        window.history.pushState({ modalId, type: 'modal-open' }, "", window.location.href)

        const handlePopState = (event: PopStateEvent) => {
            if (event.state?.modalId !== modalId) {
                closedByPopState.current = true
                callbackRef.current(false)
            }
        }

        window.addEventListener("popstate", handlePopState)

        return () => {
            window.removeEventListener("popstate", handlePopState)
            // Only call history.back() if we're still the active entry AND
            // the close was NOT triggered by a back-button press (which already went back)
            if (!closedByPopState.current && window.history.state?.modalId === modalId) {
                window.history.back()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, modalId]) // Intentionally omit `onOpenChange` - we use callbackRef instead
}
