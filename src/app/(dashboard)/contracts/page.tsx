"use client"

import { useState } from "react"
import { useProjects, Contract } from "@/context/project-context"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import { ContractPreviewDialog } from "@/components/contracts/contract-preview-dialog"
import { PaymentVoucherDialog } from "@/components/contracts/payment-voucher-dialog"
import { FileText, Printer, CheckCircle, Plus, ChevronDown, ChevronUp, Edit, Trash2, Receipt } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

export default function ContractsPage() {
    const { contracts, projects, workers, payInstallment, deleteContract } = useProjects()
    const { t } = useTranslation()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [previewContract, setPreviewContract] = useState<Contract | null>(null)
    const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined)
    const [expandedContract, setExpandedContract] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [voucherData, setVoucherData] = useState<{ contract: Contract; installment: any; index: number } | null>(null)

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

            {voucherData && (
                <PaymentVoucherDialog
                    isOpen={!!voucherData}
                    onClose={() => setVoucherData(null)}
                    contract={voucherData.contract}
                    installment={voucherData.installment}
                    installmentIndex={voucherData.index}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
                    <div className="relative bg-card border border-border p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">{t.common?.delete || "Delete"}?</h3>
                            <p className="text-muted-foreground text-sm">
                                {t.common?.confirm_delete || "Are you sure you want to delete this contract?"}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium hover:bg-muted transition-colors"
                            >
                                {t.common?.cancel || "Cancel"}
                            </button>
                            <button
                                onClick={() => {
                                    if (showDeleteConfirm) {
                                        deleteContract(showDeleteConfirm)
                                        setShowDeleteConfirm(null)
                                    }
                                }}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                            >
                                {t.common?.remove || "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        {t.contracts.title} <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">/ {t.contracts.dialog.worker}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">{t.contracts.subtitle}</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" /> <span className="hidden sm:inline">{t.contracts.new_contract}</span>
                </button>
            </div>

            <div className="grid gap-4">
                {contracts.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium">{t.contracts.empty}</h3>
                        <p className="text-sm text-muted-foreground">{t.contracts.empty_hint}</p>
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
                                        <p className="text-xs text-muted-foreground">{t.contracts.total_value}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPreviewContract(contract) }}
                                        className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                                        title={t.contracts.print_preview}
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(contract.id) }}
                                        className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-full transition-colors"
                                        title={t.common?.delete || "Delete"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="p-4 bg-muted/20 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-xs uppercase text-muted-foreground">{t.contracts.scope}</span>
                                            <button
                                                onClick={() => handleEdit(contract)}
                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                            >
                                                <Edit className="w-3 h-3" /> {t.common.edit}
                                            </button>
                                        </div>
                                        <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                            {contract.scope}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="font-bold text-xs uppercase text-muted-foreground">{t.contracts.installments}</span>
                                        {contract.installments.map((inst, idx) => (
                                            <div key={idx} className="flex items-start justify-between p-3 rounded-lg border border-white/5 bg-background/50">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${inst.status === 'Paid' ? 'bg-green-500' : inst.status === 'Overdue' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                    <div>
                                                        <p className="font-medium text-sm">{inst.description}</p>
                                                        <p className="text-xs text-muted-foreground">{t.contracts.due}: {inst.dueDate}</p>
                                                        {inst.paymentDetails && (
                                                            <p className="text-[10px] text-muted-foreground mt-1 bg-muted px-2 py-0.5 rounded w-fit">
                                                                {t.contracts.note}: {inst.paymentDetails}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">฿{inst.amount.toLocaleString()}</span>

                                                    {/* Payment Voucher Button */}
                                                    <button
                                                        onClick={() => setVoucherData({ contract, installment: inst, index: idx })}
                                                        className="p-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-opacity"
                                                        title="ใบสำคัญจ่าย"
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                    </button>

                                                    {inst.status === 'Paid' ? (
                                                        <span className="p-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20" title="Paid">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`${t.contracts.confirm_payment} ฿${inst.amount.toLocaleString()}? ${t.contracts.confirm_hint}`)) {
                                                                    payInstallment(contract.id, inst.id)
                                                                }
                                                            }}
                                                            className="p-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                                                            title={t.contracts.pay_now}
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
