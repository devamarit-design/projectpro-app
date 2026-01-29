"use client"

import { SnakeGame } from "@/components/game/snake-game"
import { MarketOverview } from "@/components/dashboard/market-overview"

export default function BoredPage() {
    return (
        <div className="max-w-4xl mx-auto pt-4 pb-20 px-4">
            <h1 className="text-2xl font-bold mb-6 text-center">Bored Room</h1>
            <MarketOverview />
            <div className="mt-8">
                <SnakeGame />
            </div>
        </div>
    )
}
