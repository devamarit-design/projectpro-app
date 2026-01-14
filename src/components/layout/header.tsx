"use client"

import * as React from "react"
import { Bell, Search, Globe } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeaderProfile } from "./header-profile"
import { useTranslation } from "@/lib/i18n-context"

import { useScrollDirection } from "@/hooks/use-scroll-direction"
import { cn } from "@/lib/utils"

interface HeaderProps { }

import { useNotifications } from "@/context/notification-context"
import Link from "next/link"

export function Header({ }: HeaderProps) {
    const { locale, setLocale, t } = useTranslation()
    const { unreadCount } = useNotifications()
    const scrollDirection = useScrollDirection()

    const toggleLanguage = () => {
        setLocale(locale === 'en' ? 'th' : 'en')
    }

    return (
        <header
            className={cn(
                "sticky top-4 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-background/60 backdrop-blur-xl rounded-2xl mx-4 mt-2 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 border border-white/10 transition-transform duration-300",
                scrollDirection === "down" ? "-translate-y-24" : "translate-y-0"
            )}
        >


            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="relative flex flex-1 items-center">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t.common.search}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const query = e.currentTarget.value
                                if (query.trim()) {
                                    window.location.href = `/search?q=${encodeURIComponent(query)}`
                                }
                            }
                        }}
                        className="w-full max-w-sm pl-8 pr-4 py-1.5 text-sm bg-muted/50 border-none rounded-md focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                    />
                </div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border"
                    >
                        <Globe className="w-4 h-4" />
                        {locale.toUpperCase()}
                    </button>

                    <Link href="/notifications" className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground transition-colors relative">
                        <span className="sr-only">View notifications</span>
                        <Bell className="h-5 w-5" aria-hidden="true" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border border-background animate-pulse"></span>
                        )}
                    </Link>

                    <div className="h-6 w-px bg-border sm:block" aria-hidden="true" />

                    <ThemeToggle />

                    <div className="h-6 w-px bg-border sm:block" aria-hidden="true" />
                    <HeaderProfile />
                </div>
            </div>
        </header>
    )
}
