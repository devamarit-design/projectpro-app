"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { MobileNav } from "./mobile-nav"

import { useProjects } from "@/context/project-context"
import { TeamOnboarding } from "@/components/team/team-onboarding"
import { useScrollRestoration } from "@/hooks/use-scroll-restoration"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function AppShell({
    children,
    variant = "default"
}: {
    children: React.ReactNode
    variant?: "default" | "fullscreen"
}) {
    const { teams, currentTeam } = useProjects()
    const pathname = usePathname()
    const router = useRouter()

    const isGuest = currentTeam?.role === "Guest"

    // Guard Guest restricted routes
    React.useEffect(() => {
        if (isGuest && pathname) {
            const guestForbidden = [
                "/projects",
                "/income",
                "/expenses",
                "/financial",
                "/customers",
                "/partners",
                "/team",
                "/contracts",
                "/announcements",
                "/bored",
                "/trash",
                "/pro-tools"
            ]
            const isForbidden = guestForbidden.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"))
            if (isForbidden) {
                router.replace("/jobsheets")
            }
        }
    }, [isGuest, pathname, router])

    // Enable scroll position restoration for iOS back navigation
    useScrollRestoration("main-scroll-container")

    const isPopupPage = Boolean(
        pathname === "/projects/new" ||
        pathname?.startsWith("/projects/edit") ||
        pathname === "/income/create" ||
        pathname?.startsWith("/settings/template-editor")
    )

    // Guard: Force Team Creation
    if (teams.length === 0) {
        return <TeamOnboarding />
    }

    if (variant === "fullscreen") {
        return (
            <div className="h-screen w-full bg-background overflow-hidden flex flex-col">
                <div id="main-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden">
                    <main className="min-h-full pb-24">
                        {children}
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden lg:flex w-64 shrink-0 transition-all duration-300" />

            {/* Main Content Column */}
            <div className="relative flex-1 min-w-0 h-full overflow-hidden flex flex-col">
                {/* Floating Header */}
                <Header />

                {/* Primary Page Scroll Container */}
                <div
                    id="main-scroll-container"
                    className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth"
                >
                    <main className={cn(
                        "min-h-full w-full px-3 sm:px-8 lg:px-10 bg-muted/20 pb-24 sm:pb-28",
                        isPopupPage ? "pt-4 sm:pt-6" : "pt-24 sm:pt-28 lg:pt-32"
                    )}>
                        {children}
                    </main>
                </div>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    )
}
