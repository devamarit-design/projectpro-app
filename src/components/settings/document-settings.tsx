"use client"

import { useState } from "react"
import { useSettings, DocumentTemplate } from "@/context/settings-context"
import { FileText, Sparkles, Upload, FileCheck, Loader2, GripVertical, Type, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"

import { useTranslation } from "@/lib/i18n-context"
export function DocumentSettings() {
    const { t } = useTranslation()
    const { documentSettings, updateDocumentTemplate } = useSettings()
    const [activeTab, setActiveTab] = useState("quotation")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)

    const tabs = [
        { id: "quotation", label: t.income.dialog.doc_types.quotation },
        { id: "contract", label: t.settings.documents.contract },
        { id: "invoice", label: t.income.dialog.doc_types.invoice },
    ]

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsAnalyzing(true)
        setUploadSuccess(false)

        // Mock AI Analysis
        setTimeout(() => {
            setIsAnalyzing(false)
            setUploadSuccess(true)

            // Auto-fill based on "Analysis"
            if (activeTab === 'contract') {
                updateDocumentTemplate('contract', {
                    terms: "1. Defined Scope of Work\n2. Payment Schedule as agreed.\n3. Warranty valid for 1 year.",
                    header: "Official Contract\nRef: CON-2024-001",
                    footer: "Signed electronically"
                })
            } else {
                updateDocumentTemplate(activeTab, {
                    terms: `AI Extracted Terms for ${activeTab}:\n1. Valid for 15 days.\n2. Subject to change.`,
                })
            }

            // Clear success message after 3 seconds
            setTimeout(() => setUploadSuccess(false), 3000)
        }, 2000)
    }

    const currentTemplate = documentSettings[activeTab] || {}

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-border/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab.id
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* AI Helper Section */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-24 h-24 text-primary" />
                </div>

                <div className="relative z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <Sparkles className="w-5 h-5" />
                        {t.settings.documents.setup_title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-lg mb-4">
                        {t.settings.documents.setup_desc}
                    </p>

                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                            {isAnalyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : uploadSuccess ? (
                                <FileCheck className="w-4 h-4" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {isAnalyzing ? t.settings.documents.analyzing : uploadSuccess ? t.settings.documents.success : t.settings.documents.upload_btn}
                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={isAnalyzing} />
                        </label>
                        {uploadSuccess && <span className="text-sm text-green-600 font-medium animate-fade-in">Successfully applied settings from file!</span>}
                    </div>
                </div>
            </div>

            {/* Manual Edit Form */}
            <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4 md:col-span-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{t.settings.documents.template_content}</h4>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.settings.documents.header}</label>
                        <textarea
                            value={currentTemplate.header}
                            onChange={(e) => updateDocumentTemplate(activeTab, { header: e.target.value })}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Company Name, Address, Contact info..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.settings.documents.terms}</label>
                        <textarea
                            value={currentTemplate.terms}
                            onChange={(e) => updateDocumentTemplate(activeTab, { terms: e.target.value })}
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                            placeholder="1. ..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.settings.documents.footer}</label>
                        <input
                            type="text"
                            value={currentTemplate.footer}
                            onChange={(e) => updateDocumentTemplate(activeTab, { footer: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{t.settings.documents.appearance}</h4>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">{t.settings.documents.show_logo}</span>
                        <button
                            onClick={() => updateDocumentTemplate(activeTab, { logoVisible: !currentTemplate.logoVisible })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentTemplate.logoVisible ? 'bg-primary' : 'bg-input'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${currentTemplate.logoVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">{t.settings.documents.show_signature}</span>
                        <button
                            onClick={() => updateDocumentTemplate(activeTab, { signatureVisible: !currentTemplate.signatureVisible })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentTemplate.signatureVisible ? 'bg-primary' : 'bg-input'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${currentTemplate.signatureVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.settings.documents.accent_color}</label>
                        <div className="flex gap-2">
                            {['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#000000'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => updateDocumentTemplate(activeTab, { accentColor: color })}
                                    className={`w-8 h-8 rounded-full border-2 ${currentTemplate.accentColor === color ? 'border-primary' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Customer & Project Fields */}
                <div className="space-y-4 md:col-span-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">ข้อมูลลูกค้า &amp; โครงการ</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Customer Fields */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">ลูกค้า (Customer)</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'name', label: 'ชื่อ' },
                                    { id: 'taxId', label: 'Tax ID' },
                                    { id: 'address', label: 'ที่อยู่' },
                                    { id: 'phone', label: 'เบอร์โทร' },
                                    { id: 'email', label: 'Email' },
                                    { id: 'contactPerson', label: 'ผู้ติดต่อ' },
                                    { id: 'lineId', label: 'Line ID' },
                                ].map(field => {
                                    const active = (currentTemplate.customerFields ?? ['name', 'taxId', 'address']).includes(field.id)
                                    return (
                                        <button
                                            key={field.id}
                                            onClick={() => {
                                                const current = currentTemplate.customerFields ?? ['name', 'taxId', 'address']
                                                const updated = active
                                                    ? current.filter(f => f !== field.id)
                                                    : [...current, field.id]
                                                updateDocumentTemplate(activeTab, { customerFields: updated })
                                            }}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                                        >
                                            {field.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Project Fields */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">โครงการ (Project)</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'name', label: 'ชื่อโครงการ' },
                                    { id: 'location', label: 'สถานที่' },
                                    { id: 'description', label: 'รายละเอียด' },
                                    { id: 'status', label: 'สถานะ' },
                                    { id: 'startDate', label: 'วันเริ่ม' },
                                    { id: 'endDate', label: 'วันสิ้นสุด' },
                                    { id: 'budget', label: 'งบประมาณ' },
                                ].map(field => {
                                    const active = (currentTemplate.projectFields ?? ['name', 'location']).includes(field.id)
                                    return (
                                        <button
                                            key={field.id}
                                            onClick={() => {
                                                const current = currentTemplate.projectFields ?? ['name', 'location']
                                                const updated = active
                                                    ? current.filter(f => f !== field.id)
                                                    : [...current, field.id]
                                                updateDocumentTemplate(activeTab, { projectFields: updated })
                                            }}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                                        >
                                            {field.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        {t.settings.documents.font}
                    </label>
                    <select
                        value={currentTemplate.font}
                        onChange={(e) => updateDocumentTemplate(activeTab, { font: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="Kanit">Kanit (Default)</option>
                        <option value="Sarabun">Sarabun (Formal)</option>
                        <option value="Inter">Inter (Modern)</option>
                        <option value="Prompt">Prompt (Loopless)</option>
                        <option value="Times New Roman">Times New Roman</option>
                    </select>
                </div>

                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{t.settings.documents.columns}</h4>
                    <div className="space-y-2">
                        {currentTemplate.columns?.sort((a, b) => a.order - b.order).map((col, index, arr) => (
                            <div key={col.id} className="border rounded-xl bg-background overflow-hidden">
                                {/* Row 1: Order controls, Label, Visibility */}
                                <div className="flex items-center gap-2 p-2">
                                    <div className="flex flex-col gap-1 text-muted-foreground">
                                        <button
                                            disabled={index === 0}
                                            onClick={() => {
                                                const newCols = [...currentTemplate.columns!]
                                                const currIndex = newCols.findIndex(c => c.id === col.id)
                                                if (currIndex > 0) {
                                                    const temp = newCols[currIndex].order
                                                    newCols[currIndex].order = newCols[currIndex - 1].order
                                                    newCols[currIndex - 1].order = temp
                                                    updateDocumentTemplate(activeTab, { columns: newCols })
                                                }
                                            }}
                                            className="hover:text-foreground disabled:opacity-30"
                                        >
                                            <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button
                                            disabled={index === arr.length - 1}
                                            onClick={() => {
                                                const newCols = [...currentTemplate.columns!]
                                                const currIndex = newCols.findIndex(c => c.id === col.id)
                                                if (currIndex < newCols.length - 1) {
                                                    const temp = newCols[currIndex].order
                                                    newCols[currIndex].order = newCols[currIndex + 1].order
                                                    newCols[currIndex + 1].order = temp
                                                    updateDocumentTemplate(activeTab, { columns: newCols })
                                                }
                                            }}
                                            className="hover:text-foreground disabled:opacity-30"
                                        >
                                            <ArrowDown className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        value={col.label}
                                        onChange={(e) => {
                                            const newCols = currentTemplate.columns!.map(c => c.id === col.id ? { ...c, label: e.target.value } : c)
                                            updateDocumentTemplate(activeTab, { columns: newCols })
                                        }}
                                        className="flex-1 h-8 text-sm px-2 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none font-medium"
                                    />

                                    <button
                                        onClick={() => {
                                            const newCols = currentTemplate.columns!.map(c => c.id === col.id ? { ...c, visible: !c.visible } : c)
                                            updateDocumentTemplate(activeTab, { columns: newCols })
                                        }}
                                        className={`p-1 rounded ${col.visible ? 'text-primary' : 'text-muted-foreground opacity-40'}`}
                                    >
                                        {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Row 2: Alignment + Width */}
                                <div className="flex items-center gap-3 px-3 pb-2 pt-1 border-t border-border/40 bg-muted/20">
                                    {/* Alignment */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground w-16 shrink-0">Alignment</span>
                                        {(['left', 'center', 'right'] as const).map(a => (
                                            <button
                                                key={a}
                                                onClick={() => {
                                                    const newCols = currentTemplate.columns!.map(c => c.id === col.id ? { ...c, align: a } : c)
                                                    updateDocumentTemplate(activeTab, { columns: newCols })
                                                }}
                                                className={`px-2 py-0.5 text-xs rounded border transition-colors ${(col.align || 'left') === a ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                                            >
                                                {a === 'left' ? '⇤' : a === 'center' ? '↔' : '⇥'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Width */}
                                    <div className="flex items-center gap-1 flex-1">
                                        <span className="text-xs text-muted-foreground w-10 shrink-0">Width</span>
                                        <input
                                            type="text"
                                            placeholder="auto"
                                            value={col.width || ''}
                                            onChange={(e) => {
                                                const newCols = currentTemplate.columns!.map(c => c.id === col.id ? { ...c, width: e.target.value || undefined } : c)
                                                updateDocumentTemplate(activeTab, { columns: newCols })
                                            }}
                                            className="w-20 h-6 text-xs px-2 rounded border border-border bg-background focus:outline-none focus:border-primary placeholder:text-muted-foreground/40"
                                        />
                                        <span className="text-xs text-muted-foreground/40">px / % / auto</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{t.settings.documents.preview}</h4>
                <div className="border rounded-lg p-4 bg-muted/20 aspect-[1/1.414] relative text-[10px] overflow-hidden shadow-sm">
                    {/* Mini Document Preview */}
                    <div className="absolute top-4 left-4 right-4 bottom-4 bg-white shadow p-4 flex flex-col" style={{ fontFamily: currentTemplate.font }}>
                        <div className="flex justify-between items-start mb-4">
                            {currentTemplate.logoVisible && <div className="w-8 h-8 bg-gray-200 rounded" />}
                            <div className="text-right">
                                <div className="font-bold text-primary" style={{ color: currentTemplate.accentColor }}>{activeTab.toUpperCase()}</div>
                                <div className="text-gray-400">#001</div>
                            </div>
                        </div>

                        <div className="whitespace-pre-wrap mb-4 text-gray-600">{currentTemplate.header}</div>

                        <div className="bg-gray-50 mb-4 rounded border border-gray-100 overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b bg-gray-100 text-[8px] font-bold text-gray-500">
                                        {currentTemplate.columns?.filter(c => c.visible).sort((a, b) => a.order - b.order).map(col => {
                                            const defaultAlign = col.id === 'item' ? 'center'
                                                : (col.id === 'unitPrice' || col.id === 'total' || col.id === 'price') ? 'right'
                                                    : col.id === 'qty' || col.id === 'unit' ? 'center'
                                                        : 'left'
                                            return (
                                                <th
                                                    key={col.id}
                                                    className="px-1 py-1 truncate font-bold"
                                                    style={{
                                                        textAlign: col.align || defaultAlign,
                                                        width: col.width || undefined,
                                                        color: currentTemplate.accentColor,
                                                    }}
                                                >
                                                    {col.label}
                                                </th>
                                            )
                                        })}
                                    </tr>
                                </thead>
                            </table>
                            <div className="p-2 text-center text-gray-300 text-[8px] italic">
                                Item content...
                            </div>
                        </div>

                        <div className="mt-auto">
                            <div className="font-bold mb-1" style={{ color: currentTemplate.accentColor }}>Terms</div>
                            <div className="whitespace-pre-wrap text-gray-500 mb-4">{currentTemplate.terms}</div>

                            {currentTemplate.signatureVisible && (
                                <div className="flex justify-end mt-4">
                                    <div className="w-24 border-t border-gray-300 pt-1 text-center text-gray-400">Signature</div>
                                </div>
                            )}

                            <div className="text-center text-gray-300 mt-4 pt-2 border-t border-gray-100">
                                {currentTemplate.footer}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
