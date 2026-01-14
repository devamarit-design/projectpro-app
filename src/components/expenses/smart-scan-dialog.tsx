import { useProjects, ExpenseItem } from "@/context/project-context"
import { useState, useEffect } from "react"
import { Camera, Upload, Loader2, CheckCircle } from "lucide-react"

export function SmartScanDialog({ isOpen, onClose, onScanComplete }: {
    isOpen: boolean
    onClose: () => void
    onScanComplete?: (data: { merchant: string, date: string, items: ExpenseItem[], total: number }) => void
}) {
    const { addExpense } = useProjects()
    const [scanning, setScanning] = useState(false)
    const [completed, setCompleted] = useState(false)

    // File & Preview
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Extracted Data (Editable)
    const [extractedData, setExtractedData] = useState<{
        merchant: string
        date: string
        total: number
        items: ExpenseItem[]
    } | null>(null)

    // Reset when opening/closing
    useEffect(() => {
        if (!isOpen) {
            setScanning(false)
            setCompleted(false)
            setSelectedFile(null)
            setPreviewUrl(null)
            setExtractedData(null)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleScan = () => {
        if (!selectedFile && !previewUrl) return // Should not happen given UI

        setScanning(true)

        // Simulate AI Processing Delay
        setTimeout(() => {
            setScanning(false)
            setCompleted(true)

            // Mock "AI Extracted" Data
            const mockExtracted = {
                merchant: "7-Eleven",
                date: new Date().toISOString().split('T')[0],
                total: 350,
                items: [
                    {
                        id: Math.random().toString(),
                        description: "Office Supplies",
                        amount: 350,
                        category: "Material" as const,
                        projectId: undefined
                    }
                ]
            }
            setExtractedData(mockExtracted)
        }, 2500)
    }

    const handleSave = () => {
        if (!extractedData) return

        if (onScanComplete) {
            onScanComplete(extractedData)
        } else {
            // Fallback if used standalone (e.g. from Fab)
            addExpense({
                title: `Bill from ${extractedData.merchant}`,
                amount: `฿${extractedData.total.toLocaleString()}`,
                totalValue: extractedData.total,
                date: extractedData.date,
                category: extractedData.items[0].category,
                payee: extractedData.merchant,
                status: "Pending",
                items: extractedData.items,
                receiptImage: previewUrl || undefined
            })
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-background w-full max-w-md rounded-xl border border-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">✕</button>

                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Smart Scan AI</h2>

                    {!completed && (
                        <p className="text-muted-foreground text-sm">Upload a receipt. Our AI will extract date, merchant, and total amount automatically.</p>
                    )}

                    {/* Stage 1: Upload / Preview */}
                    {!scanning && !completed && (
                        <div className="space-y-4">
                            {previewUrl ? (
                                <div className="relative rounded-xl overflow-hidden aspect-[3/4] border border-white/10 bg-black/50 group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium text-sm text-white transition-colors">
                                            Change Photo
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl hover:bg-muted transition-colors cursor-pointer">
                                        <Camera className="w-6 h-6 text-primary" />
                                        <span className="text-sm font-medium">Take Photo</span>
                                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileSelect} />
                                    </label>
                                    <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl hover:bg-muted transition-colors cursor-pointer">
                                        <Upload className="w-6 h-6 text-primary" />
                                        <span className="text-sm font-medium">Upload File</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                    </label>
                                </div>
                            )}

                            {previewUrl && (
                                <button
                                    onClick={handleScan}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                                >
                                    Start AI Scan
                                </button>
                            )}
                        </div>
                    )}

                    {/* Stage 2: Scanning Animation */}
                    {scanning && (
                        <div className="py-10 flex flex-col items-center gap-4 relative">
                            {previewUrl && (
                                <div className="w-32 h-40 rounded-lg overflow-hidden relative mb-4 border border-white/20">
                                    <img src={previewUrl} className="w-full h-full object-cover opacity-50" />
                                    <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_2px_rgba(var(--primary),0.5)] animate-[scan_2s_ease-in-out_infinite]" />
                                </div>
                            )}
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground animate-pulse">Analyzing receipt structure...</p>
                        </div>
                    )}

                    {/* Stage 3: Results & Edit */}
                    {completed && extractedData && (
                        <div className="py-2 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-center gap-2 text-green-500 font-bold bg-green-500/10 py-2 rounded-lg">
                                <CheckCircle className="w-5 h-5" /> Scan Complete
                            </div>

                            <div className="text-left space-y-3 bg-muted/30 p-4 rounded-xl border border-white/5">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Merchant</label>
                                    <input
                                        value={extractedData.merchant}
                                        onChange={(e) => setExtractedData({ ...extractedData, merchant: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Date</label>
                                        <input
                                            type="date"
                                            value={extractedData.date}
                                            onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Total</label>
                                        <input
                                            type="number"
                                            value={extractedData.total}
                                            onChange={(e) => setExtractedData({ ...extractedData, total: parseFloat(e.target.value) })}
                                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-primary text-right"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                            >
                                {onScanComplete ? "Use Extracted Data" : "Save Expense"}
                            </button>

                            <button
                                onClick={() => {
                                    setCompleted(false)
                                    setScanning(false)
                                    setPreviewUrl(null)
                                    setSelectedFile(null)
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground underline"
                            >
                                Scan Another
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
