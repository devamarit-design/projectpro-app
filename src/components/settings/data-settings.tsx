"use client"

import { useState, useRef } from "react"
import { useProjects } from "@/context/project-context"
import { Download, Upload, AlertTriangle, CheckCircle, Database, FileJson, RefreshCcw } from "lucide-react"

import { useTranslation } from "@/lib/i18n-context"
export function DataSettings() {
    const { t } = useTranslation()
    const {
        projects, expenses, files, users, workers, vendors, customers, incomes, companyProfile, contracts,
        restoreData, seedData
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

            setMessage({ type: "success", text: t.settings.data.messages.success_backup })
        } catch (error) {
            console.error(error)
            setMessage({ type: "error", text: t.settings.data.messages.error_backup })
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.type !== "application/json" && !file.name.endsWith(".json")) {
            setMessage({ type: "error", text: t.settings.data.messages.invalid_type })
            return
        }

        if (!confirm(t.settings.data.messages.confirm_restore)) {
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
                    setMessage({ type: "success", text: t.settings.data.messages.success_restore })
                    // Optional: window.location.reload() to ensure clean state? 
                    // restoreData does set state, so UI should update immediately. 
                } else {
                    setMessage({ type: "error", text: t.settings.data.messages.error_restore })
                }
            } catch (error) {
                console.error(error)
                setMessage({ type: "error", text: t.settings.data.messages.error_parse })
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
                    {t.settings.data.title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    {t.settings.data.subtitle}
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
                        <h3 className="text-lg font-medium text-white">{t.settings.data.backup.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t.settings.data.backup.desc}
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <FileJson className="w-4 h-4" /> {t.settings.data.backup.button}
                    </button>
                    <p className="text-xs text-muted-foreground text-center">
                        {t.settings.data.backup.last_backup}
                    </p>
                </div>

                {/* Import Card */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-orange-500/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">{t.settings.data.restore.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t.settings.data.restore.desc} <span className="text-orange-400">{t.settings.data.restore.warning}</span>
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
                        {isRestoring ? t.settings.data.restore.button_restoring : t.settings.data.restore.button}
                    </button>
                    <p className="text-xs text-muted-foreground text-center">
                        {t.settings.data.restore.supported}
                    </p>
                </div>
            </div>

            {/* Warning Section */}
            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 flex gap-4 items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-yellow-500">{t.settings.data.important.title}</h4>
                    <p className="text-sm text-yellow-500/80 leading-relaxed">
                        {t.settings.data.important.desc}
                    </p>
                </div>
            </div>

            {/* Demo Data Section */}
            <div className="pt-6 border-t border-white/5">
                <h3 className="text-lg font-medium text-white mb-2">Demo / Testing</h3>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="font-medium text-white">GENERATE MOCK DATA (จำลองข้อมูลตัวอย่าง)</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Use this to populate your database with sample projects, expenses, and tasks for testing purposes.
                            <br /><span className="text-red-400">Warning: This writes directly to your Firestore database.</span>
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm("Are you sure? This will add sample data to your database.")) {
                                await seedData()
                                alert("Mock Data Generated Successfully!")
                            }
                        }}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10 whitespace-nowrap"
                    >
                        Generate Mock Data
                    </button>
                </div>
            </div>
        </div>
    )
}
