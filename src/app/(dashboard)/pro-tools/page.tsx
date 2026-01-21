"use client"

import { Trophy, Wrench } from "lucide-react"

export default function ProToolsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-500/10 rounded-full">
                <Trophy className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold">Pro Tools</h1>
            <p className="text-muted-foreground">Advanced team management and site tools coming soon.</p>
        </div>
    )
}
