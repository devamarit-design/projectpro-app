import { IncomeDocument, useProjects, IncomeType } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { X, Calendar, User, Briefcase, FileText, Download, Printer, Send, CheckCircle, FilePlus, Archive, ArrowRight, Edit } from "lucide-react"
import { useState, useEffect } from "react"
import { DocumentPreview } from "./document-preview"
import { AddIncomeDialog } from "./add-income-dialog"

interface IncomeDetailSheetProps {
    documentId: string | null
    onClose: () => void
}

export function IncomeDetailSheet({ documentId, onClose }: IncomeDetailSheetProps) {
    const { incomes, customers, projects, updateIncome, addIncome } = useProjects()
    const { t } = useTranslation()
    const [showPreview, setShowPreview] = useState(false)

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogData, setDialogData] = useState<any>(null)

    const document = incomes.find(d => d.id === documentId)
    const customer = customers.find(c => c.id === document?.customerId)
    const project = projects.find(p => p.id === document?.projectId)

    // Reset preview when document changes
    useEffect(() => {
        setShowPreview(false)
    }, [documentId])

    if (!document) return null

    const handleEdit = () => {
        setDialogData(document)
        setIsDialogOpen(true)
        setShowPreview(false)
    }

    const handleCreateNext = (targetType: IncomeType) => {
        // Generate new document number
        const prefix = targetType === 'Invoice' ? 'INV' : 'REC'
        const docNumber = `${prefix}-${Date.now().toString(36).toUpperCase()}`

        // Create the new income document automatically
        const newDoc: Omit<IncomeDocument, 'id'> = {
            type: targetType,
            documentNumber: docNumber,
            date: new Date().toISOString().split('T')[0],
            customerId: document.customerId,
            projectId: document.projectId,
            status: 'Draft',
            mode: document.mode,
            items: document.items,
            sections: document.sections,
            subtotal: document.subtotal,
            discount: document.discount || 0,
            total: document.total || document.subtotal,
            tax: document.tax,
            grandTotal: document.grandTotal,
            referenceDocumentId: document.id,
        }

        // Add the new document
        addIncome(newDoc)

        // If converting Quotation to Invoice, mark original as Invoiced
        if (document.type === 'Quotation' && targetType === 'Invoice' && document.status !== 'Invoiced') {
            updateIncome(document.id, { status: 'Invoiced' })
        }

        // If converting Invoice to Receipt, mark original as Paid
        if (document.type === 'Invoice' && targetType === 'Receipt') {
            updateIncome(document.id, { status: 'Paid' })
        }

        // Close the sheet and let user know
        onClose()
    }

    // Workflow Actions Config
    const canConvertToBilling = document.type === 'Quotation'
    const canConvertToReceipt = document.type === 'Invoice' && (document.status === 'Accepted' || document.status === 'Sent' || document.status === 'Invoiced')
    const canMarkPaid = (document.type === 'Invoice' || document.type === 'Receipt') && document.status !== 'Paid'

    // Check if already invoiced to disable button
    const isAlreadyInvoiced = document.type === 'Quotation' && document.status === 'Invoiced'

    return (
        <>
            {showPreview && (
                <DocumentPreview
                    document={document}
                    onClose={() => setShowPreview(false)}
                    onEdit={handleEdit}
                    onUpdate={(updates) => updateIncome(document.id, updates)}
                />
            )}

            <Sheet open={!!documentId} onOpenChange={(open: boolean) => !open && onClose()}>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-background p-0 border-l border-white/10">
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 bg-muted/10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{document.type}</div>
                                    <h2 className="text-2xl font-bold mt-1 text-primary">{document.documentNumber}</h2>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-foreground/80">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        {document.date}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleEdit} className="p-2 hover:bg-muted rounded-full">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 space-y-8">
                            {/* Status */}
                            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl border border-white/5">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
                                    <div className="font-bold text-lg">{document.status}</div>
                                </div>
                                <div className="flex-1 text-right">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Total Amount</label>
                                    <div className="font-bold text-xl text-primary">฿{document.grandTotal.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Client & Project */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="w-4 h-4" /> Customer
                                    </div>
                                    <div className="font-medium">{customer?.name || "Unknown"}</div>
                                    <div className="text-xs text-muted-foreground">{customer?.address}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Briefcase className="w-4 h-4" /> Project
                                    </div>
                                    <div className="font-medium">{project?.name || "Unknown"}</div>
                                </div>
                            </div>

                            <div className="h-px bg-white/10" />

                            {/* Items */}
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> Items
                                </h3>

                                <div className="space-y-4">
                                    {document.mode === "Simple" && document.items?.map((item, i) => (
                                        <div key={item.id} className="flex justify-between items-start text-sm border-b border-white/5 pb-4 last:border-0">
                                            <div className="space-y-1">
                                                <div className="font-medium">{item.description}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.quantity} {item.unit} x ฿{item.unitPrice.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="font-medium">฿{item.total.toLocaleString()}</div>
                                        </div>
                                    ))}

                                    {document.mode === "Zone" && document.sections?.map((section) => (
                                        <div key={section.id} className="space-y-3">
                                            <div className="font-medium text-primary text-sm bg-primary/10 px-3 py-1 rounded-lg inline-block">
                                                {section.name}
                                            </div>
                                            <div className="pl-4 space-y-3 border-l-2 border-white/10">
                                                {section.items.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-start text-sm">
                                                        <div className="space-y-0.5">
                                                            <div className="font-medium">{item.description}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {item.quantity} {item.unit} x ฿{item.unitPrice.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div className="text-muted-foreground">฿{item.total.toLocaleString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-muted/20 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>฿{document.subtotal?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tax (7%)</span>
                                    <span>฿{document.tax?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                                    <span>Grand Total</span>
                                    <span>฿{document.grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-white/10 bg-muted/10 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-medium text-sm"
                            >
                                <Printer className="w-4 h-4" /> Print / Preview
                            </button>

                            {/* Workflow Buttons */}
                            {canConvertToBilling && (
                                isAlreadyInvoiced ? (
                                    <button
                                        onClick={handleEdit}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 transition-colors font-medium text-sm"
                                    >
                                        <Edit className="w-4 h-4" /> Edit Quotation
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleCreateNext('Invoice')}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm shadow-lg shadow-blue-900/20"
                                    >
                                        <FilePlus className="w-4 h-4" /> Create Invoice
                                    </button>
                                )
                            )}

                            {canConvertToReceipt && (
                                <button
                                    onClick={() => handleCreateNext('Receipt')}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium text-sm shadow-lg shadow-indigo-900/20"
                                >
                                    <FilePlus className="w-4 h-4" /> Issue Receipt
                                </button>
                            )}

                            {canMarkPaid && (
                                <button
                                    onClick={() => updateIncome(document.id, { status: 'Paid' })}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors font-medium text-sm shadow-lg shadow-green-900/20"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark as Paid
                                </button>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <AddIncomeDialog
                key={isDialogOpen ? (dialogData?.id ? `edit-${dialogData.id}` : 'new') : 'closed'}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={dialogData}
            />
        </>
    )
}
