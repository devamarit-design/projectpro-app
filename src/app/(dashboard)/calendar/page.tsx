"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

export default function CalendarPage() {
    const router = useRouter()

    React.useEffect(() => {
        router.replace('/projects')
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )
}
