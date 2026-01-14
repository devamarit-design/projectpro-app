"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { MobileNav } from "./mobile-nav"

import { useProjects } from "@/context/project-context"
import { TeamOnboarding } from "@/components/team/team-onboarding"

export function AppShell({ children }: { children: React.ReactNode }) {
    const { teams } = useProjects()

    // Guard: Force Team Creation
    if (teams.length === 0) {
        return <TeamOnboarding />
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden lg:flex w-64 shrink-0 transition-all duration-300" />

            {/* Main Content */}
            <div id="main-scroll-container" className="flex flex-col flex-1 min-w-0 overflow-y-auto transition-all duration-300 pb-16 lg:pb-0">
                <Header />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/20">
                    {children}
                </main>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    )
}
