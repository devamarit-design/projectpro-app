"use client"

import dynamic from "next/dynamic"

const CashFlowChart = dynamic(() => import("@/components/dashboard/cash-flow-chart").then(mod => mod.CashFlowChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

const ProjectFinancialsChart = dynamic(() => import("@/components/dashboard/project-financials-chart").then(mod => mod.ProjectFinancialsChart), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

export default function FinancialPage() {
    return (
        <div className="space-y-6 pb-20 pt-6 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            <h1 className="text-2xl font-bold mb-6">Financial Reports & Analysis</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cash Flow */}
                <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
                    <div className="relative z-10">
                        <CashFlowChart />
                    </div>
                </div>

                {/* Project Financials */}
                <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-700" />
                    <div className="relative z-10">
                        <ProjectFinancialsChart />
                    </div>
                </div>
            </div>
        </div>
    )
}
