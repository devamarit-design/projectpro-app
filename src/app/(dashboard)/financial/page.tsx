"use client"

import { FileBarChart } from "lucide-react"

export default function FinancialPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="p-4 bg-orange-100 dark:bg-orange-500/10 rounded-full">
                <FileBarChart className="w-12 h-12 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold">Financial Reports</h1>
            <p className="text-muted-foreground">Advanced financial analysis and reporting coming soon.</p>
        </div>
    )
}
