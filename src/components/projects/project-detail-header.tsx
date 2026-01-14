import { MapPin, Phone, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function ProjectHeader() {
    return (
        <div className="relative">
            {/* Cover Image */}
            <div className="h-64 w-full bg-slate-900 overflow-hidden rounded-xl">
                <img
                    src="https://images.unsplash.com/photo-1600607686527-6fb886090705?w=1200&q=80"
                    alt="Cover"
                    className="w-full h-full object-cover opacity-60"
                />
                <Link href="/projects" className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="absolute bottom-6 left-6 text-white text-shadow-sm">
                    <span className="px-2 py-1 bg-green-500/80 backdrop-blur-sm rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                        Active
                    </span>
                    <h1 className="text-3xl font-bold">Modern Loft Renovation</h1>
                    <p className="opacity-90">Client: K. Somsak</p>
                </div>
            </div>

            {/* Project Info Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 mt-[-2rem] mx-4 relative bg-card rounded-xl shadow-lg border border-border">
                <div className="flex flex-col border-r border-border last:border-0 px-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Project Value</span>
                    <span className="text-xl font-bold text-primary">฿2,500,000</span>
                </div>
                <div className="flex flex-col border-r border-border last:border-0 px-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Duration</span>
                    <div className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        Jan 12 - Dec 20, 2024
                    </div>
                </div>
                <div className="flex flex-col border-r border-border last:border-0 px-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Location</span>
                    <div className="flex items-center gap-1.5 font-medium text-sm mt-0.5 truncate">
                        <MapPin className="w-4 h-4 text-primary" />
                        123 Sukhumvit, Bangkok
                    </div>
                </div>
                <div className="flex flex-col px-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Contact</span>
                    <div className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
                        <Phone className="w-4 h-4 text-primary" />
                        081-234-5678
                    </div>
                </div>
            </div>
        </div>
    )
}
