"use client"

import Link from "next/link"
import { FileBarChart, Trophy, ArrowRight } from "lucide-react"
import { useProjects } from "@/context/project-context"

export function PromoCards() {
    const { currentUser, currentTeam } = useProjects()
    const isAdmin = currentTeam?.role === 'Owner' || currentTeam?.role === 'Admin'

    if (!isAdmin) return null

    return (
        <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Left Card - Financial Report */}
            <Link href="/financial" className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 p-4 h-28 sm:h-32 shadow-lg cursor-pointer hover:shadow-xl transition-all">
                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <div>
                        <h3 className="font-bold text-lg leading-none mb-1">Financial</h3>
                        <p className="text-white/80 text-xs text-medium">Report & Analysis</p>
                    </div>
                    <div className="bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold flex items-center gap-1 group-hover:bg-white/30 transition-colors">
                        View <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
                {/* Decorative Icon */}
                <FileBarChart className="absolute -bottom-2 -right-2 w-16 h-16 text-white/20 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </Link>

            {/* Right Card - Team & Assets */}
            <Link href="/team" className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 h-28 sm:h-32 shadow-lg cursor-pointer hover:shadow-xl transition-all">
                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <div>
                        <h3 className="font-bold text-lg leading-none mb-1">Team & Assets</h3>
                        <p className="text-white/80 text-xs text-medium">Manage Team & Site</p>
                    </div>
                    <div className="bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold flex items-center gap-1 group-hover:bg-white/30 transition-colors">
                        Explore <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
                {/* Decorative Icon */}
                <Trophy className="absolute -bottom-2 -right-2 w-16 h-16 text-white/20 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </Link>
        </div>
    )
}
