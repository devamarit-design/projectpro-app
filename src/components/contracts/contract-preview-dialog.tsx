"use client"

import { useState, useEffect } from "react"
import { Contract, useProjects } from "@/context/project-context"
import { useSettings } from "@/context/settings-context"
import { ContractDocument } from "./contract-document"
import { pdf } from "@react-pdf/renderer"
import { Printer, Edit, X, FileText } from "lucide-react"
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

    const project = projects.find(p => p.id === contract.projectId)
    const worker = workers.find(w => w.id === contract.workerId)

    // Generate PDF on load/open
    useEffect(() => {
        const loadPdf = async () => {
            setIsLoading(true)
            try {
                const blob = await pdf(
                    <ContractDocument
                        contract={contract}
                        project={project}
                        worker={worker}
                        orgProfile={orgProfile}

                        settings={documentSettings['contract']}
                        dictionary={t}
                    />
                ).toBlob()
                const url = URL.createObjectURL(blob)
                setBlobUrl(url)
            } catch (error) {
                console.error("Failed to generate PDF:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (isOpen) {
            loadPdf()
        }
    }, [isOpen, contract, project, worker, orgProfile, documentSettings, t])

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
