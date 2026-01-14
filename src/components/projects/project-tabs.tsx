"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Wallet, CheckSquare, Image as ImageIcon } from "lucide-react"
import { TabOverview } from "./tab-overview"

interface ProjectTabsProps {
    project: any
}

export function ProjectTabs({ project }: ProjectTabsProps) {
    const [activeTab, setActiveTab] = useState("overview")

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "financial", label: "Financials", icon: Wallet },
        { id: "tasks", label: "Tasks", icon: CheckSquare },
        { id: "media", label: "Media", icon: ImageIcon },
    ]

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex p-1 bg-muted/50 rounded-xl overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-[100px] justify-center flex-1",
                            activeTab === tab.id
                                ? "bg-background text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "overview" && <TabOverview project={project} />}

                {activeTab === "financial" && (
                    <div className="glass-card p-8 rounded-2xl text-center">
                        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Financials Module Loading...</h3>
                        <p className="text-muted-foreground">Detailed income/expense analysis coming soon.</p>
                    </div>
                )}

                {activeTab === "tasks" && (
                    <div className="glass-card p-8 rounded-2xl text-center">
                        <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Tasks List Loading...</h3>
                        <p className="text-muted-foreground">Kanban board and task list integration coming soon.</p>
                    </div>
                )}

                {activeTab === "media" && (
                    <div className="glass-card p-8 rounded-2xl text-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Media Gallery Loading...</h3>
                        <p className="text-muted-foreground">Project photos and documents gallery coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
