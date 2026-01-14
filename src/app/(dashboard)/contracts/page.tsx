"use client"

import { useState } from "react"
import { useProjects, Contract } from "@/context/project-context"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import { ContractPreviewDialog } from "@/components/contracts/contract-preview-dialog"
import { FileText, Printer, CheckCircle, Plus, ChevronDown, ChevronUp, Edit } from "lucide-react"

export default function ContractsPage() {
    const { contracts, projects, workers, payInstallment } = useProjects()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [previewContract, setPreviewContract] = useState<Contract | null>(null)
    const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined)
    const [expandedContract, setExpandedContract] = useState<string | null>(null)

    const toggleExpand = (id: string) => {
        setExpandedContract(expandedContract === id ? null : id)
    }

    const handleEdit = (contract: Contract) => {
        setEditingContract(contract)
        setIsAddOpen(true)
    }

    const handleCloseAdd = () => {
        setIsAddOpen(false)
        setEditingContract(undefined)
    }

    return (
        <div className="space-y-6 pb-20">
            <AddContractDialog
                isOpen={isAddOpen}
                onClose={handleCloseAdd}
                initialData={editingContract}
            />

            {previewContract && (
                <ContractPreviewDialog
                    isOpen={!!previewContract}
                    contract={previewContract}
                    onClose={() => setPreviewContract(null)}
                    onEdit={() => handleEdit(previewContract)}
                />
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        Contracts <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">/ Workers</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage employment contracts and installment payments.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" /> <span className="hidden sm:inline">New Contract</span>
                </button>
            </div>

            <div className="grid gap-4">
                {contracts.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium">No contracts yet</h3>
                        <p className="text-sm text-muted-foreground">Create a contract to start tracking worker payments.</p>
                    </div>
                ) : contracts.map(contract => {
                    const worker = workers.find(w => w.id === contract.workerId)
                    const project = projects.find(p => p.id === contract.projectId)
                    const isExpanded = expandedContract === contract.id

                    return (
                        <div key={contract.id} className="glass-card rounded-xl border border-white/5 overflow-hidden transition-all">
                            <div
                                onClick={() => toggleExpand(contract.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                                        {worker?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{contract.title}</h3>
                                        <p className="text-xs text-muted-foreground">{worker?.name} • {project?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="font-bold">฿{contract.totalAmount.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Total Value</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPreviewContract(contract) }}
                                        className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                                        title="Print / Preview"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="p-4 bg-muted/20 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-xs uppercase text-muted-foreground">Scope of Work</span>
                                            <button
                                                onClick={() => handleEdit(contract)}
                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                            >
                                                <Edit className="w-3 h-3" /> Edit
                                            </button>
                                        </div>
                                        <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                            {contract.scope}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="font-bold text-xs uppercase text-muted-foreground">Installments</span>
                                        {contract.installments.map((inst, idx) => (
                                            <div key={idx} className="flex items-start justify-between p-3 rounded-lg border border-white/5 bg-background/50">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${inst.status === 'Paid' ? 'bg-green-500' : inst.status === 'Overdue' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                    <div>
                                                        <p className="font-medium text-sm">{inst.description}</p>
                                                        <p className="text-xs text-muted-foreground">Due: {inst.dueDate}</p>
                                                        {inst.paymentDetails && (
                                                            <p className="text-[10px] text-muted-foreground mt-1 bg-muted px-2 py-0.5 rounded w-fit">
                                                                Note: {inst.paymentDetails}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-sm">฿{inst.amount.toLocaleString()}</span>
                                                    {inst.status === 'Paid' ? (
                                                        <span className="p-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20" title="Paid">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Confirm payment of ฿${inst.amount.toLocaleString()}? This will create an expense record.`)) {
                                                                    payInstallment(contract.id, inst.id)
                                                                }
                                                            }}
                                                            className="p-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                                                            title="Pay Now"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
