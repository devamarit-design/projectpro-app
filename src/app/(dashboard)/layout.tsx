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
    const { currentUser } = useProjects()
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Simple check: if not logged in, redirect
        // In a real app, you might want to wait for an 'isInitialized' flag
        if (currentUser === null) {
            router.push("/login")
        }
        setIsChecking(false)
    }, [currentUser, router])

    if (currentUser === null) {
        return null // Don't render dashboard while redirecting
    }

    return <AppShell>{children}</AppShell>
}
