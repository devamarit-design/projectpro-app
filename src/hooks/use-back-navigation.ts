"use client"

import { useEffect, useRef } from "react"

export function useBackNavigation(
    open: boolean,
    onOpenChange: (open: boolean) => void,
    componentId?: string
) {
    // Unique ID for this modal instance to ensure we only close the correct one
    const modalId = useRef(componentId || `modal-${Math.random().toString(36).substr(2, 9)}`).current

    useEffect(() => {
        if (open) {
            // Push a new state to history when modal opens
            // We use a specific state object to identify our modal
            const state = { modalId, type: 'modal-open' }

            // Check if we already have this state (e.g. from a forward navigation)
            // But usually we just push a new one to "trap" the back button
            window.history.pushState(state, "", window.location.href)

            const handlePopState = (event: PopStateEvent) => {
                // If the user navigates back, the event.state will be the *previous* state
                // OR if they go forward, it handles that too.
                // We want to detect if we went *back* from our modal state.

                // Actually, the simpler logic for "Back closes modal":
                // When we pushState, we are "in" the modal.
                // When user presses back, we pop to previous state.
                // The event.state will NOT have our modalId (unless we went back *to* it).

                // If we are open, and we receive a popstate, it means the user pressed back 
                // (or forward, but let's assume back for "closing" context usually).

                // However, strictly speaking, pushState doesn't trigger popstate. 
                // popstate is triggered when history entry changes.

                // If we press back, we want to close the modal.
                // The event.state will NOT contain our modalId (because we just popped it off).
                // So if we are open, we should close.

                // WE MUST PREVENT ENDLESS LOOPS. 
                // If we close via code (onOpenChange(false)), we usually also want to clean up the history 
                // if we are still "in" the modal state.

                // Let's rely on the fact that if this fires, independent of state, we probably want to close 
                // IF it was a back action.

                // Optimization: verify if we should close.
                // If the new state matches our modalId (forward), keep open? 
                // If new state doesn't match (back), close.

                if (event.state?.modalId !== modalId) {
                    onOpenChange(false)
                }
            }

            window.addEventListener("popstate", handlePopState)

            return () => {
                window.removeEventListener("popstate", handlePopState)

                // Cleanup: If the component unmounts or closes while we are still "in" the modal state
                // we should go back to revert our pushState.
                // But we need to be careful not to go back if we already went back (which triggered the unmount/close).

                // Current history state check is tricky in cleanup because browser might have already updated.
                // But usually:
                // 1. User clicks "Close" button -> onOpenChange(false) -> open becomes false -> effect cleanup runs.
                //    In this case, we manually pushed state, so we should manually go back to restore history.
                //    We can check if history.state.modalId is ours.

                // 2. User clicks "Back" button -> popstate listener runs -> onOpenChange(false) -> open becomes false.
                //    In this case, browser already went back. We should NOT go back again.
                //    We check history.state.modalId. It should NOT be ours (since we went back).

                if (window.history.state?.modalId === modalId) {
                    window.history.back()
                }
            }
        }
    }, [open, onOpenChange, modalId])
}
