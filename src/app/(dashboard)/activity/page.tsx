"use client"

import { DashboardActivity } from "@/components/dashboard/dashboard-activity"
import { useTranslation } from "@/lib/i18n-context"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function ActivityPage() {
    const { t } = useTranslation()
    const router = useRouter()

    return (
        <div className="space-y-6 pb-20 pt-6 h-[calc(100vh-80px)]">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">Activity Log</h1>
            </div>

            <div className="h-full pb-10">
                {/* No limit, no view all button */}
                <DashboardActivity limit={100} showViewAll={false} className="h-full" />
            </div>
        </div>
    )
}
