"use client"

import { AppShell } from "@/components/layout/app-shell"
import { useProjects } from "@/context/project-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useFcmToken } from "@/hooks/use-fcm-token"


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { currentUser, isAuthLoading, isOrgLoading, teams } = useProjects()
    const router = useRouter()

    // Notification System
    const { requestPermission } = useFcmToken()

    useEffect(() => {
        if (!isAuthLoading && currentUser) {
            // Check/Request Notification Permission on load
            requestPermission()
        }
    }, [isAuthLoading, currentUser])

    useEffect(() => {
        if (!isAuthLoading && currentUser === null) {
            router.push("/login")
        }
    }, [currentUser, isAuthLoading, router])

    useEffect(() => {
        // Wait for BOTH Auth and Org Data to load
        if (!isAuthLoading && !isOrgLoading && currentUser && teams.length === 0) {
            router.push("/onboarding")
        }
    }, [isAuthLoading, isOrgLoading, currentUser, teams, router])

    // Wait for Auth
    if (isAuthLoading || (currentUser && isOrgLoading)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Don't block UI with full screen loader for teams, let the effect redirect.
    // Or show loader briefly.
    // REMOVED: This was causing a hang when teams.length === 0 and redirect was disabled.
    // AppShell handles the empty state via TeamOnboarding component.
    /*
    if (currentUser && teams.length === 0 && !isOrgLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
                </div>
            </div>
        )
    }
    */


    if (currentUser === null) {
        return null // Will redirect
    }

    return <AppShell>{children}</AppShell>
}
