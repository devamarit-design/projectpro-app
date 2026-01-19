"use client"

import { CalendarView } from "@/components/calendar/calendar-view"
import { useTranslation } from "@/lib/i18n-context"
import { Calendar } from "lucide-react"

export default function CalendarPage() {
    const { t } = useTranslation()

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold">{t.calendar?.title || "ปฏิทินองค์กร"}</h1>
                        <p className="text-sm text-muted-foreground">{t.calendar?.subtitle || "ดูงานและกำหนดการจ่ายเงินในที่เดียว"}</p>
                    </div>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 px-0 lg:px-6 pb-4 overflow-hidden">
                <CalendarView />
            </div>
        </div>
    )
}
