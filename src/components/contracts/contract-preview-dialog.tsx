"use client"

import { useState, useEffect } from "react"
import { Contract, useProjects } from "@/context/project-context"
import { useSettings } from "@/context/settings-context"
import { Printer, Edit, X, FileText, Download } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

interface ContractPreviewDialogProps {
    isOpen: boolean
    onClose: () => void
    contract: Contract
    onEdit: () => void
}

export function ContractPreviewDialog({ isOpen, onClose, contract, onEdit }: ContractPreviewDialogProps) {
    const { projects, workers } = useProjects()
    const { orgProfile, documentSettings } = useSettings()
    const { t } = useTranslation()
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDownloading, setIsDownloading] = useState(false)

    const project = projects.find(p => p.id === contract.projectId)
    const worker = workers.find(w => w.id === contract.workerId)

    // Generate PDF preview on load/open
    useEffect(() => {
        const loadPdf = async () => {
            setIsLoading(true)
            try {
                const { generateContractHTML } = await import('@/lib/server-pdf')

                const html = generateContractHTML({
                    contractNumber: contract.id,
                    date: contract.createdAt,
                    projectName: project?.name || 'Unknown Project',
                    workerName: worker?.name || 'Unknown Worker',
                    workerAddress: undefined,
                    companyName: orgProfile?.name || 'Company',
                    companyAddress: orgProfile?.address,
                    scope: contract.scope,
                    startDate: contract.startDate,
                    endDate: contract.endDate,
                    contractValue: contract.totalAmount,
                    installments: contract.installments.map(inst => ({
                        name: inst.description,
                        amount: inst.amount,
                        dueDate: inst.dueDate
                    })),
                    terms: undefined
                })

                // Call server API to generate PDF
                const response = await fetch('/api/pdf/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ html, filename: `Contract_${contract.id}.pdf` })
                })

                if (response.ok) {
                    const blob = await response.blob()
                    const url = URL.createObjectURL(blob)
                    setBlobUrl(url)
                } else {
                    console.error("Failed to generate PDF")
                }
            } catch (error) {
                console.error("Failed to generate PDF:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (isOpen) {
            loadPdf()
        }
    }, [isOpen, contract, project, worker, orgProfile])

    const handleDownload = async () => {
        setIsDownloading(true)
        try {
            const { generateServerPDF, generateContractHTML } = await import('@/lib/server-pdf')

            const html = generateContractHTML({
                contractNumber: contract.id,
                date: contract.createdAt,
                projectName: project?.name || 'Unknown Project',
                workerName: worker?.name || 'Unknown Worker',
                workerAddress: undefined,
                companyName: orgProfile?.name || 'Company',
                companyAddress: orgProfile?.address,
                scope: contract.scope,
                startDate: contract.startDate,
                endDate: contract.endDate,
                contractValue: contract.totalAmount,
                installments: contract.installments.map(inst => ({
                    name: inst.description,
                    amount: inst.amount,
                    dueDate: inst.dueDate
                })),
                terms: undefined
            })

            await generateServerPDF(html, `Contract_${contract.id}.pdf`)
        } catch (error) {
            console.error("Failed to download PDF:", error)
        } finally {
            setIsDownloading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-background w-full max-w-4xl h-[90vh] rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Preview Contract
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { onClose(); onEdit(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg text-sm font-bold transition-colors"
                        >
                            <Edit className="w-4 h-4" /> Edit Contract
                        </button>
                        <button
                            onClick={() => blobUrl && window.open(blobUrl, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                            <Printer className="w-4 h-4" /> Print / Download
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-muted/50 p-6 flex items-center justify-center relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-muted-foreground animate-pulse">Generating proper PDF...</p>
                        </div>
                    ) : blobUrl ? (
                        <iframe
                            src={`${blobUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full rounded-lg shadow-lg bg-white"
                            title="PDF Preview"
                        />
                    ) : (
                        <div className="text-red-500">Failed to load preview</div>
                    )}
                </div>
            </div>
        </div>
    )
}
