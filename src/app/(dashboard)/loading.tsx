"use client"

import { Loading } from "@/components/ui/loading"

export default function DashboardLoading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xl animate-in fade-in duration-300">
            <Loading />
        </div>
    )
}
