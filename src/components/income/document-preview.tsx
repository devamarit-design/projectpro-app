import { IncomeDocument, useProjects, Customer, Project } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { useSettings } from "@/context/settings-context"
import { useOrganization } from "@/context/organization-context"
import { X, Printer, Download, Settings, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Edit, FileEdit, Image as ImageIcon, Globe, Scissors, FileText, UploadCloud } from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { getFunctions, httpsCallable } from "firebase/functions"
// Import shared pagination logic
import { flattenDocumentItems, paginateItems } from "@/lib/pagination-utils"
import { authenticatedFetch } from "@/lib/authenticated-fetch"
import { getCompanyAddress, DEFAULT_COMPANY_NAME, thDateLong } from "@/lib/contract-utils"

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
    const { currentOrg } = useOrganization()
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
    const [receiptType, setReceiptType] = useState<'receipt' | 'tax'>(document.tax > 0 ? 'tax' : 'receipt')

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
                Receipt: receiptType === 'tax' ? "TAX INVOICE / RECEIPT" : "RECEIPT"
            },
            cont: "Cont.",
            download: "Download",
            pdfDoc: "PDF Document",
            pdfDesc: "Best for printing",
            zipDoc: "Images (ZIP)",
            zipDesc: "All pages as JPG"
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
                Receipt: receiptType === 'tax' ? "ใบเสร็จรับเงิน / ใบกำกับภาษี" : "ใบเสร็จรับเงิน"
            },
            cont: "ต่อ",
            download: "ดาวน์โหลด",
            pdfDoc: "เอกสาร PDF",
            pdfDesc: "สำหรับพิมพ์ / ส่งไฟล์",
            zipDoc: "รูปภาพ (ZIP)",
            zipDesc: "บันทึกทุกหน้าเป็นรูปภาพ"
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

    // Helper to convert image URL to strictly PNG Base64
    const processImageForPDF = async (url: string | undefined): Promise<string | undefined> => {
        if (!url) return undefined

        try {
            // Case 1: Data URL (Base64) - Convert if strict PNG needed
            // If it's already a PNG data URL, we can return it directly.
            // If it's another format (e.g. WebP), we convert it.
            if (url.startsWith('data:')) {
                if (url.startsWith('data:image/png')) return url;
                return await convertBase64ToPng(url);
            }

            // Case 2: Blob URL (Client-side only) or Relative URL (Same Origin)
            // Fetch directly on client - no CORS issues for these, and Proxy can't access blob:
            if (url.startsWith('blob:') || url.startsWith('/')) {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch local image: ${response.statusText}`);
                const blob = await response.blob();
                return await convertBlobToPng(blob);
            }

            // Case 3: Remote URL (http/https) -> Use Proxy to bypass CORS
            const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
            const response = await authenticatedFetch(proxiedUrl);

            if (!response.ok) {
                // Try fallback: fetch directly (might work if CORS allows, e.g. some CDNs)
                console.warn(`Proxy failed for ${url}, trying direct fetch...`);
                const directRes = await fetch(url, { mode: 'cors' });
                if (directRes.ok) {
                    const blob = await directRes.blob();
                    return await convertBlobToPng(blob);
                }
                throw new Error(`Proxy failed: ${response.status}`);
            }

            const blob = await response.blob();
            return await convertBlobToPng(blob);

        } catch (e) {
            console.error("Failed to process image for PDF:", url, e)
            return url // Ultimate fallback
        }
    }

    // Helper: Convert Blob -> PNG Base64
    const convertBlobToPng = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            img.onload = () => {
                const canvas = window.document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject(new Error('Canvas context failed'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Image load failed'));
            };
            img.src = url;
        });
    }

    // Helper: Convert Base64 -> PNG Base64 (for existing data URLs that might be WebP)
    const convertBase64ToPng = (base64: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = window.document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context failed'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = base64;
        });
    }

    // Helper to capture logo directly from DOM (WYSIWYG)
    const processLogoFromDOM = async (originalUrl: string | undefined): Promise<string | undefined> => {
        if (!originalUrl) return undefined;

        try {
            // 1. Try to grabbing from DOM first (Most reliable if visible)
            const imgElement = window.document.getElementById('preview-doc-logo');
            if (imgElement) {
                // Use html-to-image to capture what is rendered
                const { toPng } = await import('html-to-image');
                const dataUrl = await toPng(imgElement as HTMLElement, {
                    quality: 1.0,
                    pixelRatio: 2,
                    cacheBust: true
                });
                return dataUrl;
            }
        } catch (e) {
            console.warn("DOM Logo Capture failed, falling back to fetch:", e);
        }

        // 2. Fallback to standard fetch processing
        return await processImageForPDF(originalUrl);
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            // Pre-process ALL images to Base64 to solve CORS and size issues
            const processedOrgProfile = { ...orgProfile }

            // SPECIAL HANDLING FOR LOGO: Capture from DOM if possible
            if (orgProfile.logo) {
                processedOrgProfile.logo = await processLogoFromDOM(orgProfile.logo) as string
            }

            // Clone document and process item/zone images
            const processedDoc = { ...document }
            processedDoc.sections = await Promise.all((document.sections || []).map(async (section) => ({
                ...section,
                coverImage: await processImageForPDF(section.coverImage),
                items: await Promise.all((section.items || []).map(async (item) => ({
                    ...item,
                    image: await processImageForPDF(item.image)
                })))
            })))

            // Use React-PDF for client-side generation (no auth issues)
            const { generatePDF } = await import('@/components/income/pdf-document')

            await generatePDF({
                document: processedDoc,
                customer: customer,
                project: project,
                themeColor: themeColor,
                lang: lang,
                manualPageBreaks: manualBreaks,
                orgProfile: processedOrgProfile,
                columns: visibleColumns,
                template: template,
                showLogo: showLogo,
                receiptType: receiptType
            })

        } catch (error) {
            console.error('PDF Export Error:', error)
            alert(`PDF Export Failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTip: ใช้ปุ่ม Print (สีเขียว) เพื่อ Save เป็น PDF ที่เหมือน Preview 100%`)
        } finally {
            setIsExporting(false)
        }
    }

    const handleSaveImage = async () => {
        setIsExporting(true)
        try {
            const { toPng } = await import('html-to-image')
            const element = window.document.getElementById('preview-page-0')
            if (!element) throw new Error("Element not found")

            // 1. Pre-fetch all images in the element to Blob URLs to bypass CORS during canvas taint
            const images = element.querySelectorAll('img')
            const originalSrcs = new Map<HTMLImageElement, string>()

            await Promise.all(Array.from(images).map(async (img) => {
                try {
                    // Skip if data url already
                    if (img.src.startsWith('data:')) return

                    const response = await fetch(img.src, { cache: 'no-cache' })
                    const blob = await response.blob()
                    const objectUrl = URL.createObjectURL(blob)

                    originalSrcs.set(img, img.src)
                    img.src = objectUrl
                } catch (e) {
                    console.warn("Failed to pre-fetch image for export:", img.src, e)
                    // Continue anyway, might just show empty image
                }
            }))

            // Wait a moment for DOM to update
            await new Promise(r => setTimeout(r, 500))

            const dataUrl = await toPng(element, {
                quality: 0.95,
                backgroundColor: 'white',
                pixelRatio: 2,
                style: {
                    transform: 'scale(1)',
                }
            })

            // 2. Restore original srcs
            originalSrcs.forEach((src, img) => {
                URL.revokeObjectURL(img.src)
                img.src = src
            })

            const link = window.document.createElement('a')
            link.download = `${document.documentNumber}.png`
            link.href = dataUrl
            link.click()

        } catch (error) {
            console.error('Image Export Error:', error)
            alert(`Image Export Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsExporting(false)
        }
    }

    const handleSaveToDrive = async () => {
        setIsExporting(true)
        setShowDownloadMenu(false)
        try {
            // Process images and logic just like handleExport
            const processedOrgProfile = { ...orgProfile }

            if (orgProfile.logo) {
                processedOrgProfile.logo = await processLogoFromDOM(orgProfile.logo) as string
            }

            const processedDoc = { ...document }
            processedDoc.sections = await Promise.all((document.sections || []).map(async (section) => ({
                ...section,
                coverImage: await processImageForPDF(section.coverImage),
                items: await Promise.all((section.items || []).map(async (item) => ({
                    ...item,
                    image: await processImageForPDF(item.image)
                })))
            })))

            const { generatePDFBlob } = await import('@/components/income/pdf-document')

            const pdfBlob = await generatePDFBlob({
                document: processedDoc,
                customer: customer,
                project: project,
                themeColor: themeColor,
                lang: lang,
                manualPageBreaks: manualBreaks,
                orgProfile: processedOrgProfile,
                columns: visibleColumns,
                template: template,
                showLogo: showLogo,
                receiptType: receiptType
            })

            // Convert Blob to Base64 (browser-safe, no Buffer)
            const base64String: string = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const result = reader.result as string
                    // Strip the data URL prefix to get raw base64
                    const base64 = result.split(',')[1]
                    resolve(base64)
                }
                reader.onerror = reject
                reader.readAsDataURL(pdfBlob)
            })

            // Call Cloud Function
            const functions = getFunctions(undefined, 'asia-southeast1')
            const uploadToDrive = httpsCallable(functions, 'uploadToGoogleDrive')

            // Prepare folder path: [Project Name] / [Year] / [Month]
            const dateObj = new Date(document.date)
            const yearStr = (dateObj.getFullYear() + 543).toString() // Thai Year
            const monthStr = dateObj.toLocaleString('th-TH', { month: 'long' })

            const folderPath = ["Incomes", project?.name || "General", yearStr, monthStr]
            const docTypeName = txt.docTypes[document.type as keyof typeof txt.docTypes] || document.type
            const customerNameSafe = customer?.name?.substring(0, 30) || 'Unknown'
            const fileName = `${docTypeName} - ${document.documentNumber} - ${customerNameSafe}.pdf`.replace(/[:/\\?*]/g, '_')

            const response = await uploadToDrive({
                base64Data: base64String,
                fileName: fileName,
                mimeType: 'application/pdf',
                folderPath: folderPath,
                orgId: currentOrg?.id
            })

            const result = response.data as any
            if (result.success) {
                alert(`✅ บันทึกเอกสารลง Google Drive สำเร็จ!`)
            } else {
                throw new Error(result.reason || 'Failed to sync to Drive')
            }

        } catch (error) {
            console.error('Drive Upload Error:', error)
            alert(`❌ บันทึกลง Drive ไม่สำเร็จ: ${error instanceof Error ? error.message : 'Unknown error'}\n\nโปรดตรวจสอบการตั้งค่า Folder ID ในเมนู Settings > Google Drive`)
        } finally {
            setIsExporting(false)
        }
    }

    // Print to PDF via browser (supports Thai fonts perfectly)
    const handlePrint = () => {
        window.print()
    }

    const [showDownloadMenu, setShowDownloadMenu] = useState(false)

    // Robust Image Capture Helper (Reused by single and zip export)
    // Robust Image Capture Helper (Reused by single and zip export)
    const capturePageAsBlob = async (elementId: string, retryCount = 0): Promise<Blob | null> => {
        try {
            // Reverted to html-to-image because html2canvas crashes on oklch colors
            const { toBlob } = await import('html-to-image')
            const element = window.document.getElementById(elementId)
            if (!element) return null

            // 1. Scroll into view (Required for both engines to force render)
            element.scrollIntoView({ block: 'start' })
            await new Promise(r => setTimeout(r, 300))

            // 2. Pre-fetch images to bypass CORS (Helps html-to-image stability)
            const images = element.querySelectorAll('img')
            const originalSrcs = new Map<HTMLImageElement, string>()

            await Promise.all(Array.from(images).map(async (img) => {
                try {
                    if (img.src.startsWith('data:')) return
                    const response = await fetch(img.src, { cache: 'no-cache' })
                    const blob = await response.blob()
                    const objectUrl = URL.createObjectURL(blob)
                    originalSrcs.set(img, img.src)
                    img.src = objectUrl
                } catch (e) {
                    // console.warn("Failed to pre-fetch image:", img.src)
                }
            }))

            // Small delay for DOM update
            await new Promise(r => setTimeout(r, 100))

            const blob = await toBlob(element, {
                quality: 0.95,
                backgroundColor: 'white',
                pixelRatio: 2,
                style: { transform: 'scale(1)' },
                cacheBust: true, // Force reload images
            })

            // Cleanup
            originalSrcs.forEach((src, img) => {
                URL.revokeObjectURL(img.src)
                img.src = src
            })

            return blob
        } catch (error) {
            console.error(`Capture failed for ${elementId} (Attempt ${retryCount + 1}):`, error)
            if (retryCount < 2) {
                // console.log(`Retrying ${elementId}...`)
                await new Promise(r => setTimeout(r, 1000))
                return capturePageAsBlob(elementId, retryCount + 1)
            }
            return null
        }
    }

    const handleZipExport = async () => {
        setIsExporting(true)
        setShowDownloadMenu(false)

        // Save current scroll position
        const container = window.document.getElementById('preview-content')?.parentElement
        const originalScroll = container?.scrollTop || 0

        try {
            // Fix: file-saver export handling
            const JSZip = (await import('jszip')).default
            const FileSaver = await import('file-saver')
            const saveAs = FileSaver.default || FileSaver.saveAs || FileSaver

            const zip = new JSZip()
            const folder = zip.folder(`${document.documentNumber}_images`)

            // Capture all pages
            for (let i = 0; i < pages.length; i++) {
                const blob = await capturePageAsBlob(`preview-page-${i}`)
                if (blob && folder) {
                    folder.file(`${document.documentNumber}_page_${i + 1}.png`, blob)
                } else {
                    console.error(`Failed to capture page ${i + 1}`)
                    // Optional: alert user?
                }
            }

            const content = await zip.generateAsync({ type: "blob" })
            saveAs(content, `${document.documentNumber}_images.zip`)

        } catch (error) {
            console.error('ZIP Export Error:', error)
            alert(`ZIP Export Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            // Restore scroll position
            if (container) container.scrollTop = originalScroll
            setIsExporting(false)
        }
    }



    // Single Image Export (Wrapped to use helper if needed, or keep existing flow but using helper is cleaner)
    // We already have handleSaveImage, checking if we should refactor it or just leave it.
    // The previous implementation of handleSaveImage was good, but we can update it to use the helper for consistency if we wanted, 
    // BUT for now, let's just keep the Download Menu UI part.

    return (
        <div
            className="fixed inset-0 z-[1000] bg-gray-950 flex flex-col animate-in fade-in duration-300 print:bg-white print:static print:block print:h-auto print:overflow-visible"
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                paddingLeft: 'env(safe-area-inset-left)',
                paddingRight: 'env(safe-area-inset-right)',
            }}
        >
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

                        {/* Receipt Type Toggle (Only for Receipts) */}
                        {document.type.toLowerCase() === 'receipt' && (
                            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                                <button
                                    onClick={() => setReceiptType('receipt')}
                                    className={cn("px-2 py-1 text-xs font-medium rounded-md transition-all", receiptType === 'receipt' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                                >
                                    {lang === 'th' ? "ใบเสร็จ" : "Receipt"}
                                </button>
                                <div className="h-4 w-px bg-white/10" />
                                <button
                                    onClick={() => setReceiptType('tax')}
                                    className={cn("px-2 py-1 text-xs font-medium rounded-md transition-all", receiptType === 'tax' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                                >
                                    {lang === 'th' ? "ใบกำกับภาษี" : "Tax Invoice"}
                                </button>
                            </div>
                        )}

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
                <div className="flex items-center justify-between px-6 py-2 bg-muted/5 overflow-visible no-scrollbar">
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

                    <div className="flex items-center gap-2 relative">
                        {/* Combined Download Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                                <span className="text-sm font-medium">{txt.download}</span>
                            </button>

                            {/* Dropdown Menu */}
                            {showDownloadMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95">
                                        <button
                                            onClick={() => {
                                                setShowDownloadMenu(false)
                                                handleExport()
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
                                        >
                                            <div className="p-1.5 bg-red-500/20 text-red-400 rounded-lg">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{txt.pdfDoc}</div>
                                                <div className="text-[10px] text-gray-400">{txt.pdfDesc}</div>
                                            </div>
                                        </button>
                                        <div className="h-px bg-white/10" />
                                        <button
                                            onClick={handleZipExport}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
                                        >
                                            <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                                                <ImageIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{txt.zipDoc}</div>
                                                <div className="text-[10px] text-gray-400">{txt.zipDesc}</div>
                                            </div>
                                        </button>
                                        <div className="h-px bg-white/10" />
                                        <button
                                            onClick={handleSaveToDrive}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
                                        >
                                            <div className="p-1.5 bg-green-500/20 text-green-400 rounded-lg">
                                                <UploadCloud className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">Save to Drive</div>
                                                <div className="text-[10px] text-gray-400">สำรองไฟล์ลง Google Drive</div>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Print Button (Thai Font Friendly) */}
                        <button
                            onClick={handlePrint}
                            title="Print / Save as PDF"
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow active:scale-95"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-y-auto overflow-x-auto w-full relative bg-gray-900/50 print:bg-white print:p-0 print:overflow-visible print:h-auto print:static">
                <div
                    id="preview-content"
                    className="min-h-full w-full flex flex-col items-center py-4 print:p-0 print:block print:w-full print:h-auto"
                >
                    {pages.map((page, index) => (
                        <div
                            key={index}
                            className="relative print:contents"
                            style={{
                                height: `${297 * zoom}mm`,
                                width: `${210 * zoom}mm`,
                                marginBottom: index === pages.length - 1 ? '20mm' : '4mm'
                            }}
                        >
                            <div
                                id={`preview-page-${index}`}
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
                                    transformOrigin: 'top center',
                                    fontFamily: docSetting?.font
                                }}
                            >
                                {/* Header Section (Only on first page, or repeated if configured) */}
                                {index === 0 ? (
                                    <div className="mb-6">
                                        {/* Company + Document Header */}
                                        {(() => {
                                            const displayAddress = getCompanyAddress((lang === 'en' && orgProfile.addressEn) ? orgProfile.addressEn : orgProfile.address)
                                            const companyName = (lang === 'en' && orgProfile.nameEn) ? orgProfile.nameEn : (orgProfile.name || DEFAULT_COMPANY_NAME)
                                            const companySecondaryName = (lang === 'en' ? (orgProfile.name || DEFAULT_COMPANY_NAME) : orgProfile.nameEn)
                                            const companyTaxId = orgProfile.taxId || "0225564000300"
                                            const companyPhone = orgProfile.phone || "089-874-9635"
                                            const companyEmail = orgProfile.email

                                            const formatDisplayDate = (d?: string) => {
                                                if (!d) return "-"
                                                if (lang === 'th') {
                                                    const th = thDateLong(d)
                                                    if (th !== "-") return th
                                                }
                                                return d
                                            }

                                            const formattedDocDate = formatDisplayDate(document.date)

                                            let docPrimaryTitle = txt.docTypes[document.type as keyof typeof txt.docTypes] || document.type
                                            let docSecondaryTitle = ""
                                            let secondaryDateLabel = ""
                                            let secondaryDateVal: string | null = null

                                            if (document.type.toLowerCase() === 'quotation') {
                                                docPrimaryTitle = lang === 'th' ? "ใบเสนอราคา" : "QUOTATION"
                                                docSecondaryTitle = lang === 'th' ? "QUOTATION" : "ใบเสนอราคา"
                                                secondaryDateLabel = lang === 'th' ? "ยืนยันราคาถึง" : "Valid Until"
                                                secondaryDateVal = document.validUntil ? formatDisplayDate(document.validUntil) : null
                                            } else if (document.type.toLowerCase() === 'invoice') {
                                                docPrimaryTitle = lang === 'th' ? "ใบแจ้งหนี้ / ใบวางบิล" : "INVOICE"
                                                docSecondaryTitle = lang === 'th' ? "INVOICE / BILL" : "ใบแจ้งหนี้ / ใบวางบิล"
                                                secondaryDateLabel = lang === 'th' ? "ครบกำหนดชำระ" : "Due Date"
                                                secondaryDateVal = document.validUntil ? formatDisplayDate(document.validUntil) : null
                                            } else if (document.type.toLowerCase() === 'receipt') {
                                                if (receiptType === 'tax') {
                                                    docPrimaryTitle = lang === 'th' ? "ใบเสร็จรับเงิน / ใบกำกับภาษี" : "TAX INVOICE / RECEIPT"
                                                    docSecondaryTitle = lang === 'th' ? "RECEIPT / TAX INVOICE" : "ใบเสร็จรับเงิน / ใบกำกับภาษี"
                                                } else {
                                                    docPrimaryTitle = lang === 'th' ? "ใบเสร็จรับเงิน" : "RECEIPT"
                                                    docSecondaryTitle = lang === 'th' ? "RECEIPT" : "ใบเสร็จรับเงิน"
                                                }
                                                secondaryDateLabel = lang === 'th' ? "วันที่ชำระเงิน" : "Payment Date"
                                                secondaryDateVal = formattedDocDate
                                            }

                                            return (
                                                <>
                                                    <div className={cn(
                                                        "flex justify-between items-start gap-4 mb-6 pb-4 border-b",
                                                        template === 'classic' ? "flex-row-reverse border-gray-900 pb-5" : "border-gray-200"
                                                    )}>
                                                        {/* Left Side: Logo & Complete Company Details */}
                                                        <div className="flex items-start gap-3.5 text-left flex-1 min-w-0 pr-4">
                                                            {showLogo && (
                                                                <div className="relative group shrink-0">
                                                                    {orgProfile?.logo ? (
                                                                        <img
                                                                            id="preview-doc-logo"
                                                                            src={orgProfile.logo}
                                                                            className="h-14 max-w-[130px] object-contain shrink-0"
                                                                            alt="Company logo"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className={cn(
                                                                                "w-12 h-12 flex items-center justify-center font-bold text-xl shadow-sm text-white shrink-0",
                                                                                template === 'modern' ? "rounded-xl" : "rounded-none"
                                                                            )}
                                                                            style={{ backgroundColor: themeColor }}
                                                                        >
                                                                            {companyName.charAt(0) || "B"}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="space-y-1 min-w-0 flex-1">
                                                                <div>
                                                                    <h2 className="font-bold text-base md:text-lg text-gray-900 leading-tight">
                                                                        {companyName}
                                                                    </h2>
                                                                    {companySecondaryName && companySecondaryName !== companyName && (
                                                                        <p className="text-xs text-gray-500 font-medium leading-tight">
                                                                            {companySecondaryName}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-600 max-w-[340px] leading-relaxed">
                                                                    {displayAddress}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-xs text-gray-600 pt-0.5">
                                                                    {companyTaxId && (
                                                                        <span>
                                                                            <span className="font-semibold text-gray-700">{lang === 'th' ? "เลขประจำตัวผู้เสียภาษี:" : "Tax ID:"}</span> {companyTaxId}
                                                                        </span>
                                                                    )}
                                                                    {companyPhone && (
                                                                        <span>
                                                                            <span className="font-semibold text-gray-700">{lang === 'th' ? "โทร:" : "Tel:"}</span> {companyPhone}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {companyEmail && (
                                                                    <div className="text-xs text-gray-500">
                                                                        <span className="font-semibold text-gray-700">{lang === 'th' ? "อีเมล:" : "Email:"}</span> {companyEmail}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right Side: Document Title & Structured Metadata Box */}
                                                        <div className={cn(
                                                            "flex flex-col items-end shrink-0 min-w-[210px]",
                                                            template === 'classic' && "items-start"
                                                        )}>
                                                            <div className={cn("mb-2.5", template === 'classic' ? "text-left" : "text-right")}>
                                                                <h1
                                                                    className="text-2xl font-black uppercase tracking-wider mb-1 leading-none"
                                                                    style={{ color: template === 'classic' ? '#111827' : themeColor }}
                                                                >
                                                                    {docPrimaryTitle}
                                                                </h1>
                                                                <div className={cn(
                                                                    "flex items-center gap-2",
                                                                    template === 'classic' ? "justify-start" : "justify-end"
                                                                )}>
                                                                    {docSecondaryTitle && (
                                                                        <span className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
                                                                            {docSecondaryTitle}
                                                                        </span>
                                                                    )}
                                                                    <span
                                                                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border"
                                                                        style={{
                                                                            borderColor: template === 'classic' ? '#111827' : themeColor,
                                                                            color: template === 'classic' ? '#111827' : themeColor,
                                                                            backgroundColor: template === 'classic' ? '#f3f4f6' : `${themeColor}12`
                                                                        }}
                                                                    >
                                                                        {txt.original}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Structured Document Meta Box */}
                                                            <div className={cn(
                                                                "w-full rounded-lg border border-gray-200/90 bg-gray-50/70 overflow-hidden text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                                                                template === 'classic' && "rounded-none border-gray-900 bg-white",
                                                                template === 'minimal' && "rounded-none border-0 border-r-2 border-gray-300 bg-transparent pr-2"
                                                            )}>
                                                                <table className="w-full border-collapse">
                                                                    <tbody>
                                                                        <tr className="border-b border-gray-200/70">
                                                                            <td className="px-2.5 py-1 text-gray-500 font-semibold whitespace-nowrap">{lang === 'th' ? "เลขที่เอกสาร" : "Document No."}</td>
                                                                            <td className="px-2.5 py-1 text-right font-bold text-gray-900">{document.documentNumber}</td>
                                                                        </tr>
                                                                        <tr className="border-b border-gray-200/70">
                                                                            <td className="px-2.5 py-1 text-gray-500 font-semibold whitespace-nowrap">{lang === 'th' ? "วันที่เอกสาร" : "Date"}</td>
                                                                            <td className="px-2.5 py-1 text-right font-bold text-gray-900">{formattedDocDate}</td>
                                                                        </tr>
                                                                        {secondaryDateVal && (
                                                                            <tr className="border-b border-gray-200/70">
                                                                                <td className="px-2.5 py-1 text-gray-500 font-semibold whitespace-nowrap">{secondaryDateLabel}</td>
                                                                                <td className="px-2.5 py-1 text-right font-bold text-gray-900">{secondaryDateVal}</td>
                                                                            </tr>
                                                                        )}
                                                                        {document.referenceDocumentId && (
                                                                            <tr className="border-b border-gray-200/70">
                                                                                <td className="px-2.5 py-1 text-gray-500 font-semibold whitespace-nowrap">{lang === 'th' ? "อ้างอิงเอกสาร" : "Ref Doc"}</td>
                                                                                <td className="px-2.5 py-1 text-right font-semibold text-gray-800">{document.referenceDocumentId}</td>
                                                                            </tr>
                                                                        )}
                                                                        {project?.name && (
                                                                            <tr>
                                                                                <td className="px-2.5 py-1 text-gray-500 font-semibold whitespace-nowrap">{lang === 'th' ? "โครงการ" : "Project"}</td>
                                                                                <td className="px-2.5 py-1 text-right font-semibold text-gray-800 truncate max-w-[130px]">{project.name}</td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Customer & Project Box */}
                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className={cn(
                                                            "p-3.5 rounded-xl border bg-gray-50/70 border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]",
                                                            template === 'classic' && "rounded-none border-gray-900 bg-white p-3",
                                                            template === 'minimal' && "rounded-none bg-transparent border-0 border-l-2 border-gray-300 pl-3 py-1"
                                                        )}>
                                                            <div className="flex items-center justify-between border-b border-gray-200/80 pb-2 mb-2">
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
                                                                    {lang === 'th' ? "ข้อมูลลูกค้า / ผู้ว่าจ้าง" : "CUSTOMER / CLIENT"}
                                                                </h4>
                                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Customer Info</span>
                                                            </div>
                                                            {(() => {
                                                                const fields = docSetting?.customerFields ?? ['name', 'taxId', 'address']
                                                                return (
                                                                    <div className="space-y-1 text-xs">
                                                                        {fields.includes('name') && <p className="font-bold text-gray-900 text-sm">{customer?.name || "-"}</p>}
                                                                        {fields.includes('address') && customer?.address && (
                                                                            <p className="text-gray-600 leading-snug">
                                                                                <span className="font-semibold text-gray-700">{lang === 'th' ? "ที่อยู่: " : "Address: "}</span>
                                                                                {customer.address}
                                                                            </p>
                                                                        )}
                                                                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 pt-0.5">
                                                                            {fields.includes('taxId') && (
                                                                                <p className="text-gray-600">
                                                                                    <span className="font-semibold text-gray-700">{lang === 'th' ? "เลขผู้เสียภาษี: " : "Tax ID: "}</span>
                                                                                    {customer?.taxId || "-"}
                                                                                </p>
                                                                            )}
                                                                            {fields.includes('phone') && customer?.phone && (
                                                                                <p className="text-gray-600">
                                                                                    <span className="font-semibold text-gray-700">{lang === 'th' ? "โทร: " : "Tel: "}</span>
                                                                                    {customer.phone}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        {fields.includes('contactPerson') && customer?.contactPerson && (
                                                                            <p className="text-gray-600">
                                                                                <span className="font-semibold text-gray-700">{lang === 'th' ? "ผู้ติดต่อ: " : "Contact: "}</span>
                                                                                {customer.contactPerson}
                                                                            </p>
                                                                        )}
                                                                        {fields.includes('email') && customer?.email && (
                                                                            <p className="text-gray-600">
                                                                                <span className="font-semibold text-gray-700">{lang === 'th' ? "อีเมล: " : "Email: "}</span>
                                                                                {customer.email}
                                                                            </p>
                                                                        )}
                                                                        {fields.includes('lineId') && customer?.lineId && (
                                                                            <p className="text-gray-600">
                                                                                <span className="font-semibold text-gray-700">Line: </span>
                                                                                {customer.lineId}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>

                                                        <div className={cn(
                                                            "p-3.5 rounded-xl border bg-gray-50/70 border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]",
                                                            template === 'classic' && "rounded-none border-gray-900 bg-white p-3",
                                                            template === 'minimal' && "rounded-none bg-transparent border-0 border-l-2 border-gray-300 pl-3 py-1"
                                                        )}>
                                                            <div className="flex items-center justify-between border-b border-gray-200/80 pb-2 mb-2">
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
                                                                    {lang === 'th' ? "ข้อมูลโครงการ / สถานที่" : "PROJECT REFERENCE"}
                                                                </h4>
                                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Project Info</span>
                                                            </div>
                                                            {(() => {
                                                                const fields = docSetting?.projectFields ?? ['name', 'location']
                                                                return (
                                                                    <div className="space-y-1 text-xs">
                                                                        {fields.includes('name') && <p className="font-bold text-gray-900 text-sm">{project?.name || customer?.name || "-"}</p>}
                                                                        {fields.includes('location') && project?.location && (
                                                                            <p className="text-gray-600 leading-snug">
                                                                                <span className="font-semibold text-gray-700">{lang === 'th' ? "สถานที่: " : "Location: "}</span>
                                                                                {project.location}
                                                                            </p>
                                                                        )}
                                                                        {fields.includes('description') && project?.description && (
                                                                            <p className="text-gray-600 leading-snug">
                                                                                <span className="font-semibold text-gray-700">{lang === 'th' ? "รายละเอียด: " : "Detail: "}</span>
                                                                                {project.description}
                                                                            </p>
                                                                        )}
                                                                        {fields.includes('status') && (
                                                                            <p className="text-gray-600">
                                                                                <span className="font-semibold text-gray-700">{lang === 'th' ? "สถานะ: " : "Status: "}</span>
                                                                                {project?.status || "-"}
                                                                            </p>
                                                                        )}
                                                                        {(project?.startDate || project?.endDate) && (
                                                                            <p className="text-gray-600">
                                                                                <span className="font-semibold text-gray-700">{lang === 'th' ? "ระยะเวลา: " : "Period: "}</span>
                                                                                {project.startDate || "-"} {project.endDate ? ` ถึง ${project.endDate}` : ""}
                                                                            </p>
                                                                        )}
                                                                        {fields.includes('budget') && project?.budget && (
                                                                            <p className="text-gray-600">
                                                                                <span className="font-semibold text-gray-700">{lang === 'th' ? "งบประมาณ: " : "Budget: "}</span>
                                                                                ฿{Number(project.budget).toLocaleString()}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                ) : ( // Subsequent Pages Header
                                    <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            {showLogo && (
                                                orgProfile?.logo ? (
                                                    <img src={orgProfile.logo} className="h-7 max-w-[60px] object-contain" alt="Logo" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-xs">
                                                        {(orgProfile?.name || DEFAULT_COMPANY_NAME).charAt(0)}
                                                    </div>
                                                )
                                            )}
                                            <div>
                                                <h2 className="font-bold text-gray-800 text-sm">
                                                    {(lang === 'en' && orgProfile.nameEn) ? orgProfile.nameEn : (orgProfile.name || DEFAULT_COMPANY_NAME)}
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    <span className="font-semibold text-gray-600">
                                                        {txt.docTypes[document.type as keyof typeof txt.docTypes] || document.type}
                                                    </span>
                                                    <span className="text-gray-400 font-normal ml-1">({txt.cont})</span>
                                                </h2>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-gray-800 text-xs">{document.documentNumber}</h3>
                                            <p className="text-[11px] text-gray-500">{txt.page} {index + 1} {txt.of} {pages.length}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Items Table */}
                                <table className="w-full text-left text-sm relative" >
                                    <thead>
                                        <tr className={currentStyle.tableHead} style={{ borderColor: template !== 'classic' ? themeColor : undefined }}>
                                            {visibleColumns.map(col => {
                                                // Per-column align: use saved setting, or fall back to defaults by col id
                                                const defaultAlign = col.id === 'item' ? 'center'
                                                    : (col.id === 'unitPrice' || col.id === 'total' || col.id === 'price') ? 'right'
                                                        : col.id === 'qty' || col.id === 'unit' ? 'center'
                                                            : 'left'
                                                const align = col.align || defaultAlign
                                                const defaultWidth = col.id === 'item' ? '48px'
                                                    : col.id === 'qty' ? '60px'
                                                        : col.id === 'unit' ? '56px'
                                                            : (col.id === 'unitPrice' || col.id === 'total' || col.id === 'price') ? '96px'
                                                                : undefined
                                                return (
                                                    <th
                                                        key={col.id}
                                                        className="py-3 px-2 font-bold"
                                                        style={{
                                                            color: template !== 'classic' ? themeColor : 'inherit',
                                                            textAlign: align,
                                                            width: col.width || defaultWidth,
                                                        }}
                                                    >
                                                        {col.label}
                                                    </th>
                                                )
                                            })}

                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {page.items.map((item: any, i: number) => {
                                            const realIndex = item.originalIndex
                                            const isBreak = manualBreaks.includes(realIndex)

                                            // Zone Section Header
                                            if (item.type === 'header') {
                                                // Try multiple ways to get the zone name
                                                const zoneName = item.data?.name || item.name || item.description || 'Zone'
                                                const coverImage = item.data?.coverImage || item.coverImage

                                                return (
                                                    <tr key={`header-${i}`} className="bg-gray-50/50 print:bg-gray-100">
                                                        <td colSpan={visibleColumns.length} className="p-0">
                                                            {coverImage ? (
                                                                <div className="w-full h-36 max-h-36 overflow-hidden relative">
                                                                    <img
                                                                        src={coverImage}
                                                                        className="w-full h-full object-cover"
                                                                        alt={zoneName}
                                                                    />
                                                                    {/* Simple overlay at bottom to match PDF */}
                                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3">
                                                                        <h3 className="text-lg font-bold text-white leading-tight">{zoneName}</h3>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="py-3 px-4 font-bold text-gray-700 bg-gray-100 border-b border-gray-200 print:bg-gray-200 print:text-black">{zoneName}</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            }

                                            // Regular Item Row
                                            if (item.type === 'item') {
                                                const data = item.data
                                                return (
                                                    <tr
                                                        key={`item-${i}`}
                                                        className={cn(
                                                            "relative group/row transition-colors",
                                                            currentStyle.tableRow,
                                                            isCutMode && "cursor-pointer hover:bg-orange-50"
                                                        )}
                                                    >
                                                        {visibleColumns.map((col, colIndex) => {
                                                            const isLastCol = colIndex === visibleColumns.length - 1
                                                            if (col.id === 'item') {
                                                                return <td key={col.id} className="py-3 px-2 text-center text-gray-400 w-12">{item.originalIndex + 1}</td>
                                                            }
                                                            if (col.id === 'description') {
                                                                return (
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
                                                            }
                                                            if (col.id === 'qty') {
                                                                return <td key={col.id} className="py-3 px-2 text-center text-gray-600 w-20">{data.quantity}</td>
                                                            }
                                                            if (col.id === 'unit') {
                                                                return <td key={col.id} className="py-3 px-2 text-center text-gray-600 w-16">{data.unit}</td>
                                                            }
                                                            if (col.id === 'price') {
                                                                return <td key={col.id} className="py-3 px-2 text-right text-gray-600 w-32">{data.unitPrice?.toLocaleString()}</td>
                                                            }
                                                            if (col.id === 'total') {
                                                                return (
                                                                    <td key={col.id} className="py-3 px-2 text-right font-medium text-gray-800 w-32 relative">
                                                                        {data.total?.toLocaleString()}
                                                                        {/* Scissor Line Overlay - placed in last column */}
                                                                        {isCutMode && isLastCol && (
                                                                            <div
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    togglePageBreak(realIndex)
                                                                                }}
                                                                                className={cn(
                                                                                    "absolute bottom-0 left-[-100vw] right-0 w-[200vw] h-4 z-50 flex items-center justify-center -mb-2 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer",
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
                                                                    </td>
                                                                )
                                                            }
                                                            return null
                                                        })}
                                                    </tr>
                                                )
                                            }

                                            return null
                                        })}
                                    </tbody>
                                </table>

                                {/* Footer (Only on last page) */}
                                {page.isLast && (
                                    <div className={currentStyle.footerLayout}>
                                        <div className="flex justify-end">
                                            <div className="w-48 space-y-2">
                                                <div className="flex justify-between text-gray-500 text-sm">
                                                    <span>{txt.subtotal}</span>
                                                    <span>{document.subtotal?.toLocaleString()}</span>
                                                </div>
                                                {(document.tax ?? 0) > 0 && (
                                                    <div className="flex justify-between text-gray-500 text-sm">
                                                        <span>{txt.vat}</span>
                                                        <span>{document.tax?.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className={cn("flex justify-between font-bold text-gray-800 border-t-2 pt-2", template === "classic" ? "border-black" : "")} style={{ borderColor: template !== 'classic' ? themeColor : undefined }}>
                                                    <span>{txt.grandTotal}</span>
                                                    <span style={{ color: template !== 'classic' ? themeColor : 'black' }}>{document.total?.toLocaleString()}</span>
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

                                        {/* Signature Area - Matching PDF style */}
                                        <div className="flex justify-between items-end mt-10 px-6 text-xs text-gray-600">
                                            <div className="text-center min-w-[160px]">
                                                <div className="border-b border-gray-400 w-44 mx-auto mb-2"></div>
                                                <p className="font-semibold text-gray-800">
                                                    ( {customer?.name || (lang === 'th' ? "...................................................." : "....................................................")} )
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {lang === 'th' ? 'ผู้ว่าจ้าง / ลูกค้า (Customer)' : 'Customer Signature'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">วันที่ _____ / _____ / _________</p>
                                            </div>
                                            <div className="text-center min-w-[160px]">
                                                <div className="border-b border-gray-400 w-44 mx-auto mb-2"></div>
                                                <p className="font-semibold text-gray-800">
                                                    ( {orgProfile?.signatureName || (lang === 'en' && orgProfile.nameEn ? orgProfile.nameEn : (orgProfile.name || DEFAULT_COMPANY_NAME))} )
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {lang === 'th' ? 'ผู้มีอำนาจลงนาม (Authorized Signature)' : 'Authorized Signature'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">วันที่ _____ / _____ / _________</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Page Number Footer */}
                                <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-gray-300">
                                    {txt.page} {page.pageNumber} {txt.of} {pages.length}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 0mm; 
                    }
                    html, body {
                        width: 100%;
                        height: auto !important;
                        overflow: visible !important;
                        background: white;
                    }
                    
                    /* Hide everything by default */
                    body * {
                        visibility: hidden;
                    }

                    /* Only show the preview content and its children */
                    #preview-content, 
                    #preview-content * {
                        visibility: visible;
                    }

                    /* FORCE the container to be the page */
                    #preview-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        z-index: 9999 !important;
                        display: block !important;
                    }

                    /* Page styling */
                    .break-after-page {
                        break-after: page;
                        width: 210mm !important;
                        height: 297mm !important;
                        position: relative !important;
                        transform: none !important; /* Reset zoom */
                        margin: 0 !important;
                        padding: 15mm !important; /* Restore padding here if needed, or rely on inner padding */
                        box-shadow: none !important;
                        border: none !important;
                        overflow: hidden !important;
                        page-break-after: always;
                    }

                    /* Hide unnecessary elements inside the preview if any */
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div >
    )
}
