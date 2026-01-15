"use client"

import * as React from "react"
import { Search, Upload, Folder, File, ArrowLeft, Image as ImageIcon, FileText, Download, MoreVertical, Grid, List, Film, FileSpreadsheet } from "lucide-react"
import { useProjects, ProjectFile } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"

export default function StoragePage() {
    const { projects, files, addFile } = useProjects()
    const { t } = useTranslation()
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
    const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null) // null = Root (Projects List)
    const [searchQuery, setSearchQuery] = React.useState("")

    // Derived State
    const currentFolder = React.useMemo(() => {
        return currentFolderId ? projects.find(p => p.id === currentFolderId) : null
    }, [currentFolderId, projects])

    // Filter Logic
    const displayedItems = React.useMemo(() => {
        if (!currentFolderId) {
            // Root View: Show Projects as Folders
            return projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({
                id: p.id,
                name: p.name,
                type: "Folder",
                size: `${files.filter(f => f.projectId === p.id).length} items`,
                date: p.startDate,
                data: p
            }))
        } else {
            // Project View: Show Files in Project
            return files
                .filter(f => f.projectId === currentFolderId)
                .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(f => ({
                    id: f.id,
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    date: f.uploadedAt,
                    data: f
                }))
        }
    }, [currentFolderId, projects, files, searchQuery])

    // Icon Helper
    const getIcon = (type: string) => {
        switch (type) {
            case 'Folder': return <Folder className="w-12 h-12 text-yellow-500 fill-yellow-500/20" />
            case 'image': return <ImageIcon className="w-10 h-10 text-blue-500" />
            case 'pdf': return <FileText className="w-10 h-10 text-red-500" />
            case 'spreadsheet': return <FileSpreadsheet className="w-10 h-10 text-green-500" />
            case 'video': return <Film className="w-10 h-10 text-purple-500" />
            default: return <File className="w-10 h-10 text-gray-500" />
        }
    }

    const handleUpload = () => {
        if (!currentFolderId) {
            alert("Please select a project folder to upload files into.")
            return
        }
        // Mock Upload
        const fName = prompt("Enter file name:")
        if (fName) {
            addFile({
                name: fName,
                url: "#",
                type: "other",
                size: "1.0 MB",
                projectId: currentFolderId
            })
        }
    }

    return (
        <div className="space-y-6 pb-24 max-w-7xl mx-auto pt-6 font-sans">

            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {currentFolderId && (
                            <button
                                onClick={() => setCurrentFolderId(null)}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                                {currentFolder ? currentFolder.name : t.storage.title}
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                {currentFolder ? t.storage.subtitle : t.storage.subtitle_root}
                            </p>
                        </div>
                    </div>

                    {currentFolderId && (
                        <button
                            onClick={handleUpload}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                        >
                            <Upload className="w-4 h-4" /> {t.storage.upload}
                        </button>
                    )}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative group max-w-md w-full">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={currentFolderId ? t.storage.search_files : t.storage.search_projects}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/30 border border-white/5 focus:border-primary/30 focus:bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="flex bg-muted/30 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'grid' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'list' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {displayedItems.length > 0 ? (
                viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {displayedItems.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => item.type === 'Folder' ? setCurrentFolderId(item.id) : null}
                                className={cn(
                                    "group relative bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/5 hover:border-white/10 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center gap-3",
                                    item.type === 'Folder' ? "hover:shadow-lg hover:shadow-yellow-500/10" : ""
                                )}
                            >
                                <div className="p-4 rounded-2xl bg-muted/20 group-hover:bg-muted/30 transition-colors w-full aspect-square flex items-center justify-center">
                                    {getIcon(item.type)}
                                </div>
                                <div className="w-full">
                                    <p className="font-bold text-sm truncate w-full" title={item.name}>{item.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{item.size}</p>
                                </div>

                                {item.type !== 'Folder' && (
                                    <button className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card/30 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-bold w-12">{t.storage.table.type}</th>
                                    <th className="px-6 py-4 font-bold">{t.storage.table.name}</th>
                                    <th className="px-6 py-4 font-bold">{t.storage.table.size}</th>
                                    <th className="px-6 py-4 font-bold">{t.storage.table.date}</th>
                                    <th className="px-6 py-4 font-bold w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {displayedItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => item.type === 'Folder' ? setCurrentFolderId(item.id) : null}
                                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            {item.type === 'Folder' ? <Folder className="w-5 h-5 text-yellow-500 fill-yellow-500/20" /> : <File className="w-5 h-5 text-blue-500" />}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{item.size}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{item.date}</td>
                                        <td className="px-6 py-4">
                                            {item.type !== 'Folder' && (
                                                <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                    <Folder className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-medium text-lg">{t.storage.empty_folder}</p>
                    <p className="text-sm">{t.storage.empty_hint}</p>
                </div>
            )}
        </div>
    )
}

