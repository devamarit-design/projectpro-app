"use client"

import { useState, useRef } from "react"
import { useProjects } from "@/context/project-context"
import { Download, Upload, AlertTriangle, CheckCircle, Database, FileJson, RefreshCcw } from "lucide-react"

export function DataSettings() {
    const {
        projects, expenses, files, users, workers, vendors, customers, incomes, companyProfile, contracts,
        restoreData
    } = useProjects()

    const [isRestoring, setIsRestoring] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = () => {
        try {
            const data = {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                projects,
                expenses,
                files,
                users,
                workers,
                vendors,
                customers,
                incomes,
                companyProfile,
                contracts
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `projectpro_backup_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(link)
            link.click()

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
            }, 100)

            setMessage({ type: "success", text: "Backup file downloaded successfully." })
        } catch (error) {
            console.error(error)
            setMessage({ type: "error", text: "Failed to generate backup file." })
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.type !== "application/json" && !file.name.endsWith(".json")) {
            setMessage({ type: "error", text: "Invalid file type. Please upload a JSON backup file." })
            return
        }

        if (!confirm("WARNING: This will REPLACE all current data with the backup data. This action cannot be undone. Are you sure?")) {
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
        }

        setIsRestoring(true)
        setMessage(null)

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)

                // Basic validation
                if (!json.projects && !json.expenses && !json.companyProfile) {
                    throw new Error("Invalid backup file format")
                }

                const success = await restoreData(json)
                if (success) {
                    setMessage({ type: "success", text: "Data restored successfully! The app will reload locally." })
                    // Optional: window.location.reload() to ensure clean state? 
                    // restoreData does set state, so UI should update immediately. 
                } else {
                    setMessage({ type: "error", text: "Failed to restore data. See console for details." })
                }
            } catch (error) {
                console.error(error)
                setMessage({ type: "error", text: "Failed to parse backup file. Is it a valid JSON?" })
            } finally {
                setIsRestoring(false)
                if (fileInputRef.current) fileInputRef.current.value = ""
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Data Management
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Backup your data or restore from a previous backup file.
                </p>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-primary/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Backup Data</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Download a copy of all projects, expenses, and settings to your computer.
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <FileJson className="w-4 h-4" /> Export JSON
                    </button>
                    <p className="text-xs text-muted-foreground text-center">
                        Last backup: never
                    </p>
                </div>

                {/* Import Card */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-orange-500/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Restore Data</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Restore your data from a JSON backup file. <span className="text-orange-400">Warning: This will replace current data.</span>
                        </p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />

                    <button
                        onClick={handleImportClick}
                        disabled={isRestoring}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-white/10"
                    >
                        {isRestoring ? (
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {isRestoring ? "Restoring..." : "Restore from Backup"}
                    </button>
                    <p className="text-xs text-muted-foreground text-center">
                        Supported format: .json
                    </p>
                </div>
            </div>

            {/* Warning Section */}
            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 flex gap-4 items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-yellow-500">Important Note</h4>
                    <p className="text-sm text-yellow-500/80 leading-relaxed">
                        Since this app works offline, your data is stored in this browser.
                        Clearing your browser's "Site Data" or "Cache" will verify remove your data.
                        Please backup regularly.
                    </p>
                </div>
            </div>
        </div>
    )
}
