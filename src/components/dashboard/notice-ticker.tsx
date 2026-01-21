"use client"

import { useSettings, Notice } from "@/context/settings-context"
import { Megaphone } from "lucide-react"
import Link from "next/link"

export function NoticeTicker() {
    const { notices } = useSettings()

    // Filter active notices (startDate <= today <= endDate)
    const activeNotices = notices.filter((notice: Notice) => {
        const today = new Date().toISOString().split('T')[0]
        return notice.startDate <= today && notice.endDate >= today
    })

    // Default placeholder when no active notices
    const defaultText = "📢 ยินดีต้อนรับ! คลิกที่นี่เพื่อดูประกาศทั้งหมด"

    // Combine all notices into one scrolling text
    const combinedText = activeNotices.length > 0
        ? activeNotices.map(n => {
            const emoji = n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : '📢'
            return `${emoji} ${n.content}`
        }).join('     •     ')
        : defaultText

    return (
        <Link href="/announcements">
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 py-2.5 cursor-pointer hover:bg-primary/10 transition-all mb-4">
                <div className="flex items-center">
                    {/* Icon with same padding as banner (px-4 = 16px) */}
                    <div className="pl-4 pr-4 flex-shrink-0">
                        <Megaphone className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    {/* Scrolling text container */}
                    <div className="flex-1 overflow-hidden pr-4">
                        <div className="animate-marquee whitespace-nowrap text-sm font-medium text-foreground/80">
                            {combinedText}
                            <span className="mx-12">•</span>
                            {combinedText}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
