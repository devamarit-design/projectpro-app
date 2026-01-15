"use client"

import { AppShell } from "@/components/layout/app-shell"
import { useProjects } from "@/context/project-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { currentUser, isAuthLoading } = useProjects()
    const router = useRouter()

    useEffect(() => {
        if (!isAuthLoading && currentUser === null) {
            router.push("/login")
        }
    }, [currentUser, isAuthLoading, router])

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (currentUser === null) {
        return null // Will redirect
    }

    return <AppShell>{children}</AppShell>
}
