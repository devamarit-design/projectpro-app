import { useProjects, ExpenseItem } from "@/context/project-context"
import { useState, useEffect } from "react"
import { Camera, Upload, Loader2, CheckCircle, Save } from "lucide-react"
import { analyzeReceipt } from "@/lib/ai-service"
import { uploadWithThumbnail } from "@/lib/upload"
import { useOrganization } from "@/context/organization-context"
import { toast } from "sonner"
import Image from "next/image"
import { auth } from "@/lib/firebase"

export function SmartScanDialog({ isOpen, onClose, onScanComplete, autoSave = false }: {
    isOpen: boolean
    onClose: () => void
    onScanComplete?: (data: { merchant: string, date: string, items: ExpenseItem[], total: number, receiptImage?: string }) => void
    autoSave?: boolean
}) {
    const { addExpense } = useProjects()
    const { currentOrg } = useOrganization()
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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            let fileToProcess = file

            // Compress immediately if > 1MB
            if (file.size > 1024 * 1024) {
                try {
                    const { default: imageCompression } = await import('browser-image-compression')
                    const options = {
                        maxSizeMB: 0.6,
                        maxWidthOrHeight: 1280,
                        useWebWorker: true,
                        fileType: 'image/jpeg'
                    }
                    const compressedFile = await imageCompression(file, options)
                    fileToProcess = new File([compressedFile], file.name, { type: file.type })
                } catch (err) {
                    console.warn("Immediate compression failed:", err)
                }
            }

            setSelectedFile(fileToProcess)
            // Use FileReader to get Base64 string for persistence
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string)
            }
            reader.readAsDataURL(fileToProcess)
        }
    }

    const handleScan = async () => {
        if (!previewUrl) return

        setScanning(true)

        try {
            // imageToAnalyze is already compressed if it was large
            const imageToAnalyze = previewUrl
            const token = await auth.currentUser?.getIdToken()
            if (!token || !currentOrg?.id) throw new Error("Please sign in again")
            const result = await analyzeReceipt(imageToAnalyze, token, currentOrg.id)

            if (!result.success) {
                throw new Error(result.error)
            }

            const data = result.data

            // Map API response to internal state
            const extractedItems: ExpenseItem[] = Array.isArray(data.items)
                ? data.items.map((item: any) => {
                    const qty = Number(item.quantity) || 1
                    const totalAmount = Number(item.amount) || 0
                    const unitPrice = Number(item.unitPrice) || (totalAmount / qty)

                    return {
                        id: Math.random().toString(),
                        description: item.description || "Unknown Item",
                        amount: totalAmount,
                        quantity: qty,
                        unitPrice: unitPrice,
                        category: (item.category as any) || "Other",
                        projectId: ""
                    }
                })
                : []

            setExtractedData({
                merchant: data.merchant || "Unknown Merchant",
                date: data.date || new Date().toISOString().split('T')[0],
                total: Number(data.total) || 0,
                items: extractedItems.length > 0 ? extractedItems : [{
                    id: Math.random().toString(),
                    description: "Total Expense",
                    amount: Number(data.total) || 0,
                    quantity: 1,
                    unitPrice: Number(data.total) || 0,
                    category: "Other",
                    projectId: ""
                }]
            })

            // Auto Save Logic
            if (autoSave) {
                // We need to pass the data we just created, as setExtractedData is async
                const finalData = {
                    merchant: data.merchant || "Unknown Merchant",
                    date: data.date || new Date().toISOString().split('T')[0],
                    total: Number(data.total) || 0,
                    items: extractedItems.length > 0 ? extractedItems : [{
                        id: Math.random().toString(),
                        description: "Total Expense",
                        amount: Number(data.total) || 0,
                        quantity: 1,
                        unitPrice: Number(data.total) || 0,
                        category: "Other",
                        projectId: ""
                    }]
                }

                await handleAutoSave(finalData, previewUrl)
                return // Exit early as handleAutoSave will close dialog
            }

            setCompleted(true)
        } catch (error: any) {
            console.error("Scan failed:", error)
            alert(`Scan failed: ${error.message}. Please check your API Key.`)
        } finally {
            if (!autoSave) {
                setScanning(false)
            }
        }
    }

    const handleAutoSave = async (data: any, imageUrl: string) => {
        try {
            let finalReceiptUrl: string | null = null
            let finalThumbnailUrl: string | null = null

            // Upload Image if exists
            if (imageUrl && currentOrg?.id) {
                // Convert Base64 to File
                try {
                    const res = await fetch(imageUrl)
                    const blob = await res.blob()
                    const fileToUpload = new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" })

                    const path = `organizations/${currentOrg.id}/expenses/${new Date().getFullYear()}`
                    const { originalUrl, thumbnailUrl } = await uploadWithThumbnail(fileToUpload, path)
                    finalReceiptUrl = originalUrl
                    finalThumbnailUrl = thumbnailUrl
                } catch (err) {
                    console.error("Failed to upload auto-save image", err)
                    toast.error("Failed to upload receipt image")
                }
            }

            await addExpense({
                title: `Bill from ${data.merchant}`,
                amount: `฿${data.total.toLocaleString()}`,
                totalValue: data.total,
                date: data.date,
                category: data.items[0]?.category || "Other",
                payee: data.merchant,
                status: "Pending",
                items: data.items,
                ...(finalReceiptUrl ? { receiptImage: finalReceiptUrl } : {}),
                ...(finalThumbnailUrl ? { thumbnailUrl: finalThumbnailUrl } : {}),
                vatIncluded: true,
                projectId: "" // Unassigned
            })

            toast.success("Expense added via AI Scan", {
                description: "You can edit details later",
                duration: 4000
            })

            onClose()
        } catch (error) {
            console.error("Auto-save failed:", error)
            toast.error("Failed to auto-save expense")
            setScanning(false) // Stop loading on error
        }
    }

    const handleSave = () => {
        if (!extractedData) return

        if (onScanComplete) {
            // Pass back all data including the receipt image
            onScanComplete({
                ...extractedData,
                receiptImage: previewUrl || undefined
            })
        } else {
            // Fallback if used standalone (e.g. from Fab)
            addExpense({
                title: `Bill from ${extractedData.merchant}`,
                amount: `฿${extractedData.total.toLocaleString()}`,
                totalValue: extractedData.total,
                date: extractedData.date,
                category: extractedData.items[0]?.category || "Other",
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
                                    <Image src={previewUrl} alt="Preview" fill sizes="400px" className="object-contain" unoptimized={previewUrl.startsWith('data:') || previewUrl.startsWith('blob:')} />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium text-sm text-white transition-colors">
                                            Change Photo
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-4">
                                    <label className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-border rounded-2xl hover:bg-muted/30 hover:border-primary/50 transition-all cursor-pointer group">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Camera className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <span className="text-lg font-bold">Tap to Scan Receipt</span>
                                            <p className="text-xs text-muted-foreground">Supports Camera & File Upload</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                        />
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
                                    <Image src={previewUrl} alt="Scanning" fill sizes="128px" className="object-cover opacity-50" unoptimized={previewUrl.startsWith('data:') || previewUrl.startsWith('blob:')} />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent scan-line" />
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                                {/* Extracted Items Summary */}
                                <div className="space-y-2 pt-2 border-t border-dashed border-white/10 mt-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                                        <span>Extracted Items</span>
                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">{extractedData.items.length} Items</span>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                        {extractedData.items.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/20 text-xs hover:bg-black/30 transition-colors">
                                                <span className="text-foreground/90 truncate mr-2 flex-1">{item.description}</span>
                                                <span className="font-mono text-primary font-medium">฿{item.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
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
