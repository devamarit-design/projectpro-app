import Link from "next/link"
import { Calendar, User, MoreHorizontal } from "lucide-react"

interface ProjectCardProps {
    id: string
    name: string
    client: string
    owner: string
    price: string
    progress: number
    imageUrl: string
    status: "active" | "completed" | "pending"
}

export function ProjectCard({ project }: { project: ProjectCardProps }) {
    const percentage = Math.min(100, Math.max(0, project.progress))

    return (
        <Link href={`/projects/detail?id=${project.id}`} className="group block h-full">
            <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
                <div className="relative h-40 w-full bg-muted">
                    {/* Placeholder Image Logic */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img
                        src={project.imageUrl}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 z-20">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-md text-white text-xs font-medium border border-white/10 uppercase tracking-wider">
                            {project.status}
                        </span>
                    </div>
                    <div className="absolute bottom-3 left-4 z-20">
                        <h3 className="text-white font-bold text-lg leading-tight">{project.name}</h3>
                        <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" /> {project.client}
                        </p>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-1 gap-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">Total Value</span>
                            <span className="font-semibold text-primary">{project.price}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-muted-foreground text-xs">Owner</span>
                            <span className="font-medium text-foreground">{project.owner}</span>
                        </div>
                    </div>

                    <div className="mt-auto space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
