"use client"

import { Activity, DollarSign, CheckSquare, Image as ImageIcon } from "lucide-react"

interface TabOverviewProps {
    project: any
}

export function TabOverview({ project }: TabOverviewProps) {
    return (
        <div className="space-y-6">
            {/* Project Description */}
            <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-2">About Project</h3>
                <p className="text-muted-foreground leading-relaxed">
                    Renovation of the main villa including structural reinforcement, new roof installation, and complete interior redesign.
                    Targeting a modern minimalist aesthetic with high-end finishes.
                </p>
            </div>

            {/* Key Milestones */}
            <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4">Milestones</h3>
                <div className="space-y-4">
                    {[
                        { title: "Project Kickoff", date: "Jan 1, 2024", status: "Completed" },
                        { title: "Structural Analysis", date: "Jan 15, 2024", status: "Completed" },
                        { title: "Demolition", date: "Feb 1, 2024", status: "In Progress" },
                        { title: "Roof Installation", date: "Mar 1, 2024", status: "Pending" },
                    ].map((milestone, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50">
                            <div>
                                <p className="font-medium">{milestone.title}</p>
                                <p className="text-xs text-muted-foreground">{milestone.date}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${milestone.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                    milestone.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-muted text-muted-foreground'
                                }`}>
                                {milestone.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
