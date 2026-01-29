"use client"

import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { useSettings } from "@/context/settings-context"
import { Download, Sun, Moon, Sparkles, Coffee, Flame, Zap, PartyPopper } from "lucide-react"

interface DashboardHeaderProps {
    onDownload?: () => void
}

export function DashboardHeader({ onDownload }: DashboardHeaderProps) {
    const { currentUser, tasks, currentTeam } = useProjects()
    const { moodThresholds } = useSettings()
    const { t } = useTranslation()

    // Count pending tasks (not done) assigned to user
    const pendingTasksCount = tasks.filter(task =>
        (task.assignedTo === currentUser?.id || task.assignedTo === currentUser?.name) &&
        task.status !== 'Done'
    ).length

    // Time based greeting
    const hour = new Date().getHours()
    let greeting = "Good Morning"
    let TimeIcon = Sun
    if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon"
        TimeIcon = Sun
    } else if (hour >= 17) {
        greeting = "Good Evening"
        TimeIcon = Moon
    }

    // Mood based on task count (using configurable thresholds)
    type MoodType = {
        gradient: string
        emoji: string
        message: string
        MoodIcon: typeof Coffee
        accentColor: string
        particleColor: string
    }

    const getMood = (): MoodType => {
        if (pendingTasksCount === 0) {
            return {
                gradient: "from-emerald-600/40 via-teal-600/40 to-cyan-600/40",
                emoji: "😎",
                message: "No tasks! Enjoy your peaceful day",
                MoodIcon: PartyPopper,
                accentColor: "text-emerald-200",
                particleColor: "bg-emerald-300"
            }
        } else if (pendingTasksCount <= moodThresholds.chill) {
            return {
                gradient: "from-sky-600/40 via-blue-600/40 to-indigo-600/40",
                emoji: "☕",
                message: `Just ${pendingTasksCount} task${pendingTasksCount > 1 ? 's' : ''}. Take it easy!`,
                MoodIcon: Coffee,
                accentColor: "text-sky-200",
                particleColor: "bg-sky-300"
            }
        } else if (pendingTasksCount <= moodThresholds.pumped) {
            return {
                gradient: "from-amber-600/40 via-orange-600/40 to-yellow-600/40",
                emoji: "💪",
                message: `${pendingTasksCount} tasks today. You've got this!`,
                MoodIcon: Zap,
                accentColor: "text-amber-200",
                particleColor: "bg-amber-300"
            }
        } else {
            return {
                gradient: "from-rose-600/40 via-red-600/40 to-orange-600/40",
                emoji: "🔥",
                message: `${pendingTasksCount} tasks! Stay focused!`,
                MoodIcon: Flame,
                accentColor: "text-rose-200",
                particleColor: "bg-rose-300"
            }
        }
    }

    const mood = getMood()
    const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    return (
        <div className={`relative w-full min-h-[320px] overflow-hidden rounded-3xl bg-gradient-to-br ${mood.gradient} shadow-2xl`}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Large Mood Emoji */}
                <div className="absolute -right-8 -bottom-8 text-[180px] opacity-20 select-none animate-pulse">
                    {mood.emoji}
                </div>

                {/* Floating Orbs */}
                <div className={`absolute top-[10%] right-[15%] w-40 h-40 rounded-full ${mood.particleColor}/30 blur-3xl animate-[pulse_4s_ease-in-out_infinite]`} />
                <div className={`absolute bottom-[20%] left-[10%] w-32 h-32 rounded-full bg-white/20 blur-2xl animate-[pulse_3s_ease-in-out_infinite_0.5s]`} />
                <div className={`absolute top-[50%] left-[50%] w-24 h-24 rounded-full ${mood.particleColor}/20 blur-2xl animate-[pulse_5s_ease-in-out_infinite_1s]`} />

                {/* Floating Particles */}
                <div className="absolute top-[15%] left-[25%] w-3 h-3 rounded-full bg-white/50 animate-[bounce_2s_ease-in-out_infinite]" />
                <div className="absolute top-[35%] right-[20%] w-2 h-2 rounded-full bg-white/40 animate-[bounce_2.5s_ease-in-out_infinite_0.3s]" />
                <div className="absolute bottom-[25%] left-[35%] w-2.5 h-2.5 rounded-full bg-white/45 animate-[bounce_3s_ease-in-out_infinite_0.6s]" />
                <div className="absolute top-[60%] left-[15%] w-1.5 h-1.5 rounded-full bg-white/35 animate-[bounce_2.8s_ease-in-out_infinite_0.9s]" />

                {/* Gradient Overlay & Tint */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8 text-white min-h-[320px]">
                <div className="space-y-4">
                    {/* Date & Time Icon */}
                    <div className="flex items-center gap-2 text-white/70">
                        <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
                            <TimeIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium tracking-wide">{formattedDate}</span>
                    </div>

                    {/* Greeting with Emoji */}
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight flex items-center gap-4">
                            <span className="text-5xl sm:text-6xl animate-[bounce_2s_ease-in-out_infinite]">{mood.emoji}</span>
                            <div>
                                <div>{greeting},</div>
                                <div className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                                    {currentUser?.name?.split(' ')[0] || 'Friend'}
                                </div>
                            </div>
                        </h1>
                    </div>

                    {/* Mood Message */}
                    <div className={`flex items-center gap-2 ${mood.accentColor} text-lg font-medium`}>
                        <mood.MoodIcon className="w-5 h-5" />
                        <span>{mood.message}</span>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex items-center justify-between mt-6">
                    {/* Task Count Badge */}
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                            <span className="text-2xl font-bold">{pendingTasksCount}</span>
                            <span className="text-sm text-white/70 ml-2">pending tasks</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Download button - Admin/Owner only */}
                        {onDownload && (currentUser?.role === 'Admin' || currentUser?.role === 'Owner') && (
                            <button
                                onClick={onDownload}
                                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md px-3 py-2 rounded-xl transition-all text-sm font-medium border border-white/20 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 group"
                            >
                                <Download className="w-4 h-4 group-hover:animate-bounce" />
                                <span className="hidden sm:inline">Report</span>
                            </button>
                        )}

                        {/* Role Badge */}
                        <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                                {currentTeam?.role || 'Member'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


