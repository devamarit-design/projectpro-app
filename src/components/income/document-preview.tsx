import { IncomeDocument, useProjects, Customer, Project } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { useSettings } from "@/context/settings-context"
import { X, Printer, Download, Settings, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Edit, FileEdit, Image as ImageIcon, Globe, Scissors } from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
// Import shared pagination logic
import { flattenDocumentItems, paginateItems } from "@/lib/pagination-utils"

interface DocumentPreviewProps {
    document: IncomeDocument
    onClose: () => void
    onEdit?: () => void
    onUpdate?: (updates: Partial<IncomeDocument>) => void
}

// A4 Dimensions in pixels (at 96 DPI, A4 is approx 794x1123)
// We use a scale factor for the preview
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

export function DocumentPreview({ document, onClose, onEdit, onUpdate }: DocumentPreviewProps) {
    const { customers, projects } = useProjects()
    const { orgProfile, documentSettings, updateDocumentTemplate } = useSettings()
    const { t } = useTranslation()
    const customer = customers.find(c => c.id === document.customerId)
    const project = projects.find(p => p.id === document.projectId)

    // Customization State (Initialize from Settings if available)
    const [showLogo, setShowLogo] = useState(documentSettings[document.type.toLowerCase()]?.logoVisible ?? true)
    const [themeColor, setThemeColor] = useState(documentSettings[document.type.toLowerCase()]?.accentColor || "#3b82f6")
    const [zoom, setZoom] = useState(1)
    const [lang, setLang] = useState<'en' | 'th'>('en')
    const [isCutMode, setIsCutMode] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [template, setTemplate] = useState<"modern" | "classic" | "minimal">(document.template || "modern")

    // Auto-adjust zoom for mobile screens
    useEffect(() => {
        const handleResize = () => {
            const screenWidth = window.innerWidth
            // A4 paper is about 595px at 72dpi, plus padding
            // Scale down for screens smaller than 700px
            if (screenWidth < 500) {
                setZoom(0.45) // Very small mobile
            } else if (screenWidth < 700) {
                setZoom(0.55) // Mobile
            } else if (screenWidth < 900) {
                setZoom(0.7) // Tablet
            } else {
                setZoom(1) // Desktop
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Update document when template changes
    useEffect(() => {
        if (template !== document.template) {
            onUpdate?.({ template })
        }
    }, [template])

    // Manual Page Breaks State - Sync with Document
    const [manualBreaks, setManualBreaks] = useState<number[]>(document.manualPageBreaks || [])

    // Ensure we sync back if props change (though typically local state drives this)
    useEffect(() => {
        if (document.manualPageBreaks) {
            setManualBreaks(document.manualPageBreaks)
        }
    }, [document.manualPageBreaks])

    const togglePageBreak = (index: number) => {
        let newBreaks: number[]
        if (manualBreaks.includes(index)) {
            newBreaks = manualBreaks.filter(i => i !== index)
        } else {
            newBreaks = [...manualBreaks, index]
        }
        setManualBreaks(newBreaks)
        // PERSIST CHANGE
        onUpdate?.({ manualPageBreaks: newBreaks })
    }

    const LABELS = {
        en: {
            original: "Original",
            copy: "Copy",
            date: "Date",
            customer: "Customer",
            projectRef: "Project Reference",
            description: "Description",
            qty: "Qty",
            unitPrice: "Unit Price",
            total: "Total",
            subtotal: "Subtotal",
            discount: "Discount",
            vat: "VAT (7%)",
            grandTotal: "Grand Total",
            customerSig: "Customer Signature",
            authSig: "Authorized Signature",
            page: "Page",
            of: "of",
            docTypes: {
                Quotation: "QUOTATION",
                Invoice: "INVOICE",
                Receipt: "RECEIPT"
            },
            cont: "Cont."
        },
        th: {
            original: "ต้นฉบับ",
            copy: "สำเนา",
            date: "วันที่",
            customer: "ลูกค้า",
            projectRef: "อ้างอิงโครงการ",
            description: "รายการ",
            qty: "จำนวน",
            unitPrice: "ราคาต่อหน่วย",
            total: "ราคารวม",
            subtotal: "รวมเป็นเงิน",
            discount: "ส่วนลด",
            vat: "ภาษีมูลค่าเพิ่ม (7%)",
            grandTotal: "จำนวนเงินรวมทั้งสิ้น",
            customerSig: "ลายเซ็นลูกค้า",
            authSig: "ลายเซ็นผู้มีอำนาจ",
            page: "หน้า",
            of: "จาก",
            docTypes: {
                Quotation: "ใบเสนอราคา",
                Invoice: "ใบวางบิล",
                Receipt: "ใบเสร็จรับเงิน"
            },
            cont: "ต่อ"
        }
    }

    const txt = LABELS[lang]

    const templateConfig = {
        modern: {
            font: "font-sans",
            headerLayout: "flex justify-between items-start mb-8",
            box: "p-5 rounded-xl bg-gray-50/80 border border-gray-100/50",
            tableHead: "border-b-2 border-gray-100",
            tableRow: "hover:bg-gray-50/50",
            footerLayout: "mt-8 border-t border-gray-100 pt-6"
        },
        classic: {
            font: "font-serif",
            headerLayout: "flex flex-row-reverse justify-between items-start mb-8 border-b-2 border-gray-800 pb-6",
            box: "p-4 border border-gray-800 bg-white",
            tableHead: "border-b-2 border-gray-800 bg-gray-100 text-black",
            tableRow: "hover:bg-gray-50",
            footerLayout: "mt-8 border-t-2 border-gray-800 pt-6"
        },
        minimal: {
            font: "font-mono",
            headerLayout: "flex justify-between items-start mb-12",
            box: "pl-4 border-l-2 border-gray-200",
            tableHead: "border-b border-gray-200",
            tableRow: "",
            footerLayout: "mt-12 pt-6 border-t border-dashed border-gray-200"
        }
    }

    const currentStyle = templateConfig[template] || templateConfig.modern

    // Get doc settings
    const docSetting = documentSettings[document.type.toLowerCase()] || documentSettings['quotation'] // fallback
    const columns = docSetting?.columns || [
        { id: "item", label: "Item", visible: true, order: 1 },
        { id: "description", label: "Description", visible: true, order: 2 },
        { id: "qty", label: "Qty", visible: true, order: 3 },
        { id: "unit", label: "Unit", visible: true, order: 4 },
        { id: "price", label: "Price", visible: true, order: 5 },
        { id: "total", label: "Total", visible: true, order: 6 },
    ]
    const visibleColumns = columns.filter(c => c.visible).sort((a, b) => a.order - b.order)

    // Use Shared Pagination Logic
    const pages = useMemo(() => {
        const flatItems = flattenDocumentItems(document)
        return paginateItems(flatItems, manualBreaks, {
            itemsPerPage: 10,
            itemsFirstPage: 8 // Start slightly smaller for header space
        })
    }, [document, manualBreaks])

    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const { generatePDF } = await import('./pdf-document')
            await generatePDF({
                document,
                customer,
                project,
                themeColor,
                lang,
                manualPageBreaks: manualBreaks,
                columns,
                orgProfile
            })
        } catch (error) {
            console.error('PDF Export Error:', error)
            alert(`PDF Export Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[1000] bg-gray-950 flex flex-col animate-in fade-in duration-300 print:bg-white print:static print:block print:h-auto print:overflow-visible">
            {/* Row 1: Document Info */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 w-full print:hidden bg-gray-950">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-lg">{txt.docTypes[document.type as keyof typeof txt.docTypes] || document.type} Preview</h2>
                            <span className="text-muted-foreground text-sm">/ {document.documentNumber}</span>
                        </div>
                        {customer && <p className="text-xs text-muted-foreground">{customer.name}</p>}
                    </div>
                </div>
            </div>

            {/* Tool Rows */}
            <div className="w-full print:hidden">
                {/* Row 2: View & Design Tools */}
                <div className="flex items-center justify-between px-6 py-2 bg-muted/10 border-b border-white/5 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 min-w-max">
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center text-xs font-mono">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <div className="h-4 w-px bg-white/10 mx-1" />
                            <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Template Selector */}
                        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                            <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value as any)}
                                className="bg-transparent text-xs font-medium focus:outline-none px-2 py-1"
                            >
                                <option value="modern">Modern</option>
                                <option value="classic">Classic</option>
                                <option value="minimal">Minimal</option>
                            </select>
                        </div>

                        {/* Language Toggle */}
                        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                            <button
                                onClick={() => setLang('th')}
                                className={cn("px-2 py-1 text-xs font-medium rounded-md transition-all", lang === 'th' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                TH
                            </button>
                            <div className="h-4 w-px bg-white/10" />
                            <button
                                onClick={() => setLang('en')}
                                className={cn("px-2 py-1 text-xs font-medium rounded-md transition-all", lang === 'en' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                EN
                            </button>
                        </div>

                        {/* Theme Colors */}
                        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                            <button
                                onClick={() => setShowLogo(!showLogo)}
                                className={cn("px-2 py-1 text-xs font-medium rounded-md transition-all", showLogo ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                Logo
                            </button>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex gap-1 px-1">
                                {['#3b82f6', '#f97316', '#10b981', '#000000'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setThemeColor(c)}
                                        className={cn("w-4 h-4 rounded-full transition-transform hover:scale-110", themeColor === c && "ring-2 ring-white ring-offset-1 ring-offset-black")}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 3: Edit & Action Tools */}
                <div className="flex items-center justify-between px-6 py-2 bg-muted/5 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 min-w-max">
                        {/* Edit Mode Toggle */}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            title="Edit Data"
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                isEditMode ? "bg-blue-600 text-white shadow" : "bg-muted/30 hover:bg-muted/50 text-foreground"
                            )}
                        >
                            <Edit className="w-5 h-5" />
                        </button>

                        {/* Page Break Tool */}
                        <button
                            onClick={() => setIsCutMode(!isCutMode)}
                            title="Page Break"
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                isCutMode ? "bg-orange-500 text-white shadow" : "bg-muted/30 hover:bg-muted/50 text-foreground"
                            )}
                        >
                            <Scissors className="w-5 h-5" />
                        </button>

                        {onEdit && (
                            <button onClick={onEdit} title="Edit Items" className="p-2 bg-muted/30 hover:bg-muted/50 text-foreground rounded-lg transition-all">
                                <FileEdit className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            title="Export PDF"
                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isExporting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Download className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-y-auto overflow-x-auto w-full relative bg-gray-900/50 print:bg-white print:p-0 print:overflow-visible print:h-auto print:static">
                <div id="preview-content" className="min-h-full w-full flex flex-col items-center py-2 gap-2 print:p-0 print:block print:w-full print:h-auto">
                    {pages.map((page, index) => (
                        <div
                            key={index}
                            className={cn(
                                "bg-white text-black shadow-2xl relative print:shadow-none print:m-0 break-after-page print:w-full print:h-[297mm] print:static print:scale-100 print:mb-0 origin-top",
                                currentStyle.font
                            )}
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                height: '297mm',
                                padding: '15mm 15mm',
                                transform: `scale(${zoom})`,
                                fontFamily: docSetting?.font
                            }}
                        >
                            {/* Header Section (Only on first page, or repeated if configured) */}
                            {index === 0 ? (
                                <div>
                                    {/* Company + Document Header */}
                                    <div className={currentStyle.headerLayout}>
                                        <div className="flex gap-4 text-left">
                                            {showLogo && (
                                                <div className="relative group">
                                                    {orgProfile.logo ? (
                                                        <img src={orgProfile.logo} className="w-16 h-16 object-contain rounded-xl" alt="Logo" />
                                                    ) : (
                                                        <div
                                                            className={cn(
                                                                "w-16 h-16 flex items-center justify-center text-white font-bold text-2xl shadow-sm",
                                                                template === 'modern' ? "rounded-xl" : "rounded-none"
                                                            )}
                                                            style={{ backgroundColor: themeColor }}
                                                        >
                                                            {orgProfile.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <h2 className="font-bold text-lg text-gray-800 leading-tight">{orgProfile.name}</h2>
                                                <div className="text-xs text-gray-500 max-w-[250px] leading-relaxed opacity-80 whitespace-pre-wrap">{orgProfile.address}</div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 opacity-80">
                                                    <span>Tax ID: {orgProfile.taxId}</span>
                                                    <span>Tel: {orgProfile.phone}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">{orgProfile.email}</div>
                                            </div>
                                        </div>
                                        <div className={cn("text-right", template === 'classic' && "text-left")}>
                                            <h1 className="text-3xl font-bold uppercase tracking-widest mb-1" style={{ color: template === 'classic' ? 'black' : themeColor }}>{txt.docTypes[document.type as keyof typeof txt.docTypes] || document.type}</h1>
                                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">{txt.original}</p>

                                            <div className={cn("flex flex-col gap-1", template === 'classic' ? "items-start" : "items-end")}>
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">NO.</span>
                                                    <span className="font-bold text-gray-800">{document.documentNumber}</span>
                                                </div>
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">{txt.date}</span>
                                                    <span className="font-bold text-gray-800">{document.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer & Project Box */}
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className={currentStyle.box}>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                {txt.customer}
                                            </h4>
                                            <div className="space-y-1">
                                                <p className="font-bold text-gray-800 text-sm">{customer?.name}</p>
                                                <p className="text-xs text-gray-500">{customer?.address}</p>
                                                <p className="text-xs text-gray-500">Tax ID: {customer?.taxId || '-'}</p>
                                            </div>
                                        </div>
                                        <div className={currentStyle.box}>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                {txt.projectRef}
                                            </h4>
                                            <div className="space-y-1">
                                                <p className="font-bold text-gray-800 text-sm">{project?.name}</p>
                                                <p className="text-xs text-gray-500">{project?.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : ( // Subsequent Pages Header
                                <div className="flex justify-between items-end border-b border-gray-100 pb-4 mb-4">
                                    <div className="flex items-center gap-3 opacity-60">
                                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">{orgProfile.name.charAt(0)}</div>
                                        <div>
                                            <h2 className="font-bold text-gray-600 uppercase tracking-wide text-sm">{txt.docTypes[document.type as keyof typeof txt.docTypes] || document.type} <span className="text-gray-400 font-normal normal-case">({txt.cont})</span></h2>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="font-bold text-gray-700 text-sm">{document.documentNumber}</h3>
                                        <p className="text-xs text-gray-400">{txt.page} {index + 1} {txt.of} {pages.length}</p>
                                    </div>
                                </div>
                            )}

                            {/* Items Table */}
                            <table className="w-full text-left text-sm relative" >
                                <thead>
                                    <tr className={currentStyle.tableHead} style={{ borderColor: template !== 'classic' ? themeColor : undefined }}>
                                        {visibleColumns.map(col => (
                                            <th
                                                key={col.id}
                                                className={cn("py-3 px-2 font-bold",
                                                    col.id === 'item' && "w-12 text-center",
                                                    col.id === 'qty' && "w-20 text-center",
                                                    (col.id === 'unitPrice' || col.id === 'total' || col.id === 'price') && "w-24 text-right"
                                                )}
                                                style={{ color: template !== 'classic' ? themeColor : 'inherit' }}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {page.items.map((item: any, i: number) => {
                                        const realIndex = item.originalIndex
                                        const isBreak = manualBreaks.includes(realIndex)

                                        return (
                                            <tr
                                                key={`idx-${i}`}
                                                className={cn(
                                                    "relative group/row transition-colors",
                                                    currentStyle.tableRow,
                                                    isCutMode && "cursor-pointer hover:bg-orange-50"
                                                )}
                                            >
                                                <td colSpan={5} className="p-0">
                                                    <div className="w-full flex">
                                                        {/* Scissor Line Overlay */}
                                                        {isCutMode && (
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    togglePageBreak(realIndex)
                                                                }}
                                                                className={cn(
                                                                    "absolute bottom-0 left-0 right-0 h-4 z-50 flex items-center justify-center -mb-2 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer",
                                                                    isBreak && "opacity-100"
                                                                )}
                                                            >
                                                                <div className="w-full h-0.5 border-t-2 border-dashed border-orange-400 relative flex items-center justify-center">
                                                                    <div className="bg-orange-100 text-orange-600 rounded-full p-1 border border-orange-400">
                                                                        <Scissors className="w-3 h-3" />
                                                                    </div>
                                                                    {isBreak && <span className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">Page Break</span>}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Content Rendering */}
                                                        <table className="w-full">
                                                            <tbody>
                                                                {(() => {
                                                                    if (item.type === 'header') {
                                                                        return (
                                                                            <tr className="bg-gray-50/50">
                                                                                <td colSpan={5} className="p-0">
                                                                                    {item.data.coverImage && (
                                                                                        <div className="w-full h-48 overflow-hidden relative">
                                                                                            <img
                                                                                                src={item.data.coverImage}
                                                                                                className="w-full h-full object-cover"
                                                                                                alt={item.data.name}
                                                                                            />
                                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                                                                                <h3 className="text-xl font-bold text-white drop-shadow-md">{item.data.name}</h3>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                    {!item.data.coverImage && (
                                                                                        <div className="py-2 px-2 font-bold text-gray-700 bg-gray-100">{item.data.name}</div>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        )
                                                                    } else if (item.type === 'item') {
                                                                        const data = item.data
                                                                        return (
                                                                            <tr>
                                                                                {visibleColumns.map(col => {
                                                                                    if (col.id === 'item') return <td key={col.id} className="py-3 px-2 text-center text-gray-400 w-12">{item.originalIndex + 1}</td>
                                                                                    if (col.id === 'description') return (
                                                                                        <td key={col.id} className="py-3 px-2 font-medium text-gray-700">
                                                                                            <div className="flex items-center gap-3">
                                                                                                {data.image && (
                                                                                                    <img src={data.image} className="w-10 h-10 object-cover rounded-md border border-gray-200" alt="Product" />
                                                                                                )}
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="font-bold text-gray-800">{data.name}</span>
                                                                                                    {data.description && <span className="text-gray-500 text-xs font-normal whitespace-pre-wrap">{data.description}</span>}
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>
                                                                                    )
                                                                                    if (col.id === 'qty') return <td key={col.id} className="py-3 px-2 text-center text-gray-600 w-20">{data.quantity}</td>
                                                                                    if (col.id === 'unit') return <td key={col.id} className="py-3 px-2 text-center text-gray-600">{data.unit}</td>
                                                                                    if (col.id === 'price') return <td key={col.id} className="py-3 px-2 text-right text-gray-600 w-24">{data.unitPrice?.toLocaleString()}</td>
                                                                                    if (col.id === 'total') return <td key={col.id} className="py-3 px-2 text-right font-medium text-gray-800 w-24">{data.total?.toLocaleString()}</td>
                                                                                    return null
                                                                                })}
                                                                            </tr>
                                                                        )
                                                                    }
                                                                })()}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {/* Footer (Only on last page) */}
                            {page.isLast && (
                                <div className={currentStyle.footerLayout}>
                                    <div className="flex justify-end">
                                        <div className="w-64 space-y-3">
                                            <div className="flex justify-between text-gray-500 text-sm">
                                                <span>{txt.subtotal}</span>
                                                <span>{document.subtotal?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500 text-sm">
                                                <span>{txt.discount}</span>
                                                <span>{document.discount?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500 text-sm">
                                                <span>{txt.vat}</span>
                                                <span>{document.tax?.toLocaleString()}</span>
                                            </div>
                                            <div className={cn("flex justify-between text-xl font-bold text-gray-800 border-t border-gray-200 pt-3", template === "classic" && "border-t-2 border-black")}>
                                                <span>{txt.grandTotal}</span>
                                                <span style={{ color: template !== 'classic' ? themeColor : 'black' }}>฿{document.total?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Additional Remarks & Payment Info */}
                                    <div className="mb-8 grid grid-cols-2 gap-8 text-xs text-gray-500 mt-8">
                                        <div>
                                            {isEditMode ? (
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400">Payment Info</label>
                                                    <textarea
                                                        value={docSetting?.terms}
                                                        onChange={(e) => updateDocumentTemplate(document.type.toLowerCase(), { terms: e.target.value })}
                                                        className="w-full h-20 bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none focus:border-blue-500"
                                                    />
                                                    <p className="text-[10px] text-gray-400 italic">Updating this updates your global template.</p>
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    <p className="font-bold text-gray-700 mb-1">Payment Details:</p>
                                                    {docSetting?.terms}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {isEditMode ? (
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400">Notes / Remarks</label>
                                                    <textarea
                                                        value={document.remarks || ""}
                                                        onChange={(e) => onUpdate?.({ remarks: e.target.value })}
                                                        placeholder="Add remarks here..."
                                                        className="w-full h-20 bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            ) : document.remarks && (
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    <p className="font-bold text-gray-700 mb-1">Note:</p>
                                                    {document.remarks}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Signature Area */}
                                    <div className="grid grid-cols-2 gap-12">
                                        <div className="text-center">
                                            <div className="border-b border-gray-300 w-full mb-2 h-16"></div>
                                            <p className="text-xs text-gray-500 uppercase">{txt.customerSig}</p>
                                            <p className="text-xs text-gray-400 mt-1">{txt.date}: ______/______/______</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="border-b border-gray-300 w-full mb-2 h-16 relative">
                                                {/* Stamp could go here */}
                                            </div>
                                            <p className="text-xs text-gray-500 uppercase">{txt.authSig}</p>
                                            <p className="text-xs font-bold text-gray-700 mt-1">{orgProfile.name}</p>
                                            <p className="text-xs text-gray-400">{txt.date}: ______/______/______</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Page Number Footer */}
                            <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-gray-300">
                                {txt.page} {page.pageNumber} {txt.of} {pages.length}
                            </div>
                        </div>
                    ))
                    }
                </div >
            </div >

            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 0; 
                    }
                    body { 
                        background: white; 
                    }
                    /* Force reset of any screen transforms */
                    .break-after-page {
                        break-after: page;
                        width: 210mm !important;
                        height: 297mm !important;
                        position: absolute !important; /* Often helpful to ensure strict placement */
                        transform: none !important; /* Critical: reset zoom */
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
            `}</style>
        </div >
    )
}
