"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Contract, useProjects } from "@/context/project-context"
import { useSettings } from "@/context/settings-context"
import { Printer, Edit, X, FileText, ZoomIn, ZoomOut, UploadCloud } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { toast } from "sonner"
import { getFunctions, httpsCallable } from "firebase/functions"
import { useOrganization } from "@/context/organization-context"

interface ContractPreviewDialogProps {
    isOpen: boolean
    onClose: () => void
    contract: Contract
    onEdit: () => void
}

export function ContractPreviewDialog({ isOpen, onClose, contract, onEdit }: ContractPreviewDialogProps) {
    const { projects, workers } = useProjects()
    const { orgProfile, documentSettings } = useSettings()
    const { currentOrg } = useOrganization()
    const { t } = useTranslation()
    const [isSavingToDrive, setIsSavingToDrive] = useState(false)

    const project = projects.find(p => p.id === contract.projectId)
    const worker = workers.find(w => w.id === contract.workerId)

    // Zoom state
    const [zoom, setZoom] = useState(1)
    const [inkColor, setInkColor] = useState<'black' | 'blue'>('black')
    const containerRef = useRef<HTMLDivElement>(null)

    // Editing State
    const [formData, setFormData] = useState({
        contractNumber: contract.documentNumber || contract.id,
        date: new Date().toISOString(),
        projectName: project?.name || '',
        workerName: worker?.name || '',
        scope: contract.scope,
        contractValue: contract.totalAmount,
        installments: contract.installments.map(inst => ({
            name: inst.description,
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: inst.status,
            paymentDetails: inst.paymentDetails,
            balance: undefined as number | undefined,
            notes: ''
        })),
        companyName: orgProfile?.name || 'Company Name',
        companyAddress: orgProfile?.address || '',
        terms: "",
        contractType: 'labor' as 'labor' | 'material',
        extraRows: Math.max(0, 10 - contract.installments.length),
        // Signature fields
        signatures: {
            requester: { name: '', date: '' },
            supervisor: { name: '', date: '' },
            inspector: { name: orgProfile?.name || '', date: '' },
            payer: { name: 'นายวิสูตร์ ปักปิ่น', date: '' }
        },
        paymentNotes: `2. คุณภาพของงาน ต่ำกว่ามาตรฐานการทำงาน หรือต่ำกว่าที่ตกลงไว้ในแบบก่อสร้าง
3. มีพฤติกรรมสร้างความเดือดร้อน รำคาญ หรือผิดกฎระเบียบภายในไซค์งาน
4. หากงานล่าช้ากว่าที่กำหนด ผู้รับจ้างตกลงให้ปรับเป็นเงินรายวัน วันละ 500 บาท จนกว่างานจะแล้วเสร็จ`,
        paymentSummary: "บริษัทฯ จะดำเนินการจ่ายเงินภายใน 5 วันทำการ หลังจากได้รับการรับมอบงานและตรวจความเรียบร้อยครบถ้วน"
    })

    // Update state when initial data changes - Only on open or unique contract change
    useEffect(() => {
        if (isOpen) {
            setFormData({
                contractNumber: contract.documentNumber || contract.id,
                date: new Date().toISOString(),
                projectName: project?.name || '',
                workerName: worker?.name || '',
                scope: contract.scope,
                contractValue: contract.totalAmount,
                installments: contract.installments.map(inst => ({
                    name: inst.description,
                    amount: inst.amount,
                    dueDate: inst.dueDate,
                    status: inst.status,
                    paymentDetails: inst.paymentDetails,
                    balance: undefined as number | undefined,
                    notes: ''
                })),
                companyName: orgProfile?.name || 'Company Name',
                companyAddress: orgProfile?.address || '',
                terms: "",
                contractType: 'labor',
                extraRows: Math.max(0, 10 - contract.installments.length),
                signatures: {
                    requester: { name: '', date: '' },
                    supervisor: { name: '', date: '' },
                    inspector: { name: orgProfile?.name || '', date: '' },
                    payer: { name: 'นายวิสูตร์ ปักปิ่น', date: '' }
                },
                paymentNotes: `2. คุณภาพของงาน ต่ำกว่ามาตรฐานการทำงาน หรือต่ำกว่าที่ตกลงไว้ในแบบก่อสร้าง
3. มีพฤติกรรมสร้างความเดือดร้อน รำคาญ หรือผิดกฎระเบียบภายในไซค์งาน
4. หากงานล่าช้ากว่าที่กำหนด ผู้รับจ้างตกลงให้ปรับเป็นเงินรายวัน วันละ 500 บาท จนกว่างานจะแล้วเสร็จ`,
                paymentSummary: "บริษัทฯ จะดำเนินการจ่ายเงินภายใน 5 วันทำการ หลังจากได้รับการรับมอบงานและตรวจความเรียบร้อยครบถ้วน"
            })

            // Auto scale on open
            handleAutoSize()
        }
    }, [isOpen, contract.id]) // Only reset when dialog opens or contract changes

    // Auto resize handler
    const handleAutoSize = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.clientWidth
            // A4 width in pixels at 96 DPI is approx 794px + padding
            const targetWidth = 850
            const newScale = Math.min(1, (containerWidth - 32) / targetWidth)
            setZoom(newScale)
        }
    }

    // Window resize listener
    useEffect(() => {
        window.addEventListener('resize', handleAutoSize)
        return () => window.removeEventListener('resize', handleAutoSize)
    }, [])

    const handleSaveToDrive = async () => {
        if (!currentOrg) return

        try {
            setIsSavingToDrive(true)
            const toastId = toast.loading("กำลังเตรียมเอกสาร...")

            // Dynamic imports for PDF generation
            const { pdf } = await import('@react-pdf/renderer')
            const { ContractDocument } = await import('./contract-document')

            // Create a modified contract object based on form data
            const modifiedContract: Contract = {
                ...contract,
                documentNumber: formData.contractNumber,
                scope: formData.scope,
                totalAmount: formData.contractValue,
                installments: formData.installments.map((inst, idx) => ({
                    id: `inst-${idx}`,
                    description: inst.name,
                    amount: inst.amount,
                    dueDate: inst.dueDate,
                    status: (inst.status as any) || "Pending",
                    paymentDetails: inst.paymentDetails
                })),
                startDate: formData.date.split('T')[0] // Only date part
            }

            // Generate PDF Blob
            const blob = await pdf(
                <ContractDocument
                    contract={modifiedContract}
                    project={project}
                    worker={worker}
                    orgProfile={orgProfile as any}
                    settings={documentSettings as any}
                    dictionary={t} // Pass the dictionary directly
                />
            ).toBlob()

            toast.loading("กำลังอัปโหลดไปยัง Google Drive...", { id: toastId })

            // Convert Blob to Base64
            const base64String: string = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const result = reader.result as string
                    resolve(result.split(',')[1])
                }
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })

            const functions = getFunctions(undefined, 'asia-southeast1')
            const uploadToDrive = httpsCallable(functions, 'uploadToGoogleDrive')

            // Prepare folder path: [Project Name] / [Year] / [Month]
            const dateObj = new Date(formData.date)
            const yearStr = (dateObj.getFullYear() + 543).toString() // Thai Year
            const monthStr = dateObj.toLocaleString('th-TH', { month: 'long' })

            const folderPath = ["Contracts", project?.name || "General", yearStr, monthStr]
            const fileName = `สัญญาจ้าง - ${project?.name || ''} - ${worker?.name || ''}.pdf`.replace(/[:/\\?*]/g, '_')

            const response = await uploadToDrive({
                base64Data: base64String,
                fileName: fileName,
                mimeType: 'application/pdf',
                orgId: currentOrg.id,
                folderPath: folderPath
            })

            const result = response.data as any
            if (result.success) {
                toast.success("บันทึกสัญญาลง Google Drive เรียบร้อย!", { id: toastId })
            } else {
                toast.error(result.reason || "ไม่สามารถบันทึกได้", { id: toastId })
            }
        } catch (error) {
            console.error('Error saving contract to drive:', error)
            toast.error("เกิดข้อผิดพลาดในการบันทึก")
        } finally {
            setIsSavingToDrive(false)
        }
    }

    const handlePrint = () => {
        // Dynamic import to avoid SSR issues
        const { generateContractHTML } = require('@/lib/server-pdf')

        const contractHtml = generateContractHTML({
            contractNumber: formData.contractNumber,
            date: formData.date,
            projectName: formData.projectName,
            workerName: formData.workerName,
            companyName: formData.companyName,
            companyAddress: formData.companyAddress,
            title: contract.title,
            scope: formData.scope,
            startDate: contract.startDate,
            endDate: contract.endDate,
            contractValue: formData.contractValue,
            installments: formData.installments,
            terms: formData.terms,
            contractType: formData.contractType,
            signatures: formData.signatures,
            paymentNotes: formData.paymentNotes,
            paymentSummary: formData.paymentSummary
        })

        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(contractHtml)
            printWindow.document.close()
            setTimeout(() => {
                printWindow.print()
            }, 500)
        } else {
            alert('กรุณาอนุญาต Popup เพื่อเปิดหน้าพิมพ์')
        }
    }

    if (!isOpen) return null

    // A4 CSS Style used for both pages
    const pageStyle = {
        width: '210mm',
        minHeight: '297mm',
        padding: '60px 40px',
        fontFamily: "'Sarabun', sans-serif",
        fontSize: '14px',
        lineHeight: '1.5',
        boxSizing: 'border-box' as const,
        backgroundColor: 'white',
        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)',
        position: 'absolute' as const, // Use absolute instead of fixed
        top: 0,
        left: '50%',
        transform: `scale(${zoom}) translateX(-50%)`,
        transformOrigin: 'top left', // Change origin for easier centering
        color: inkColor === 'black' ? '#000000' : '#1e3a8a',
    }

    const pageWrapperStyle = {
        width: '100%',
        height: `calc(297mm * ${zoom})`,
        position: 'relative' as const,
        marginBottom: '40px',
        flexShrink: 0
    }

    // Helper for header rendering (reused on page 2)
    const renderHeader = (isPage2 = false) => {
        if (isPage2) return <div className="h-[10px]"></div> // Minimal spacer for Page 2

        return (
            <div className="relative mb-8 text-center">
                {/* Header Title - Only shown on Page 1 - Forced Black */}
                {!isPage2 && (
                    <h1
                        className="text-2xl font-bold mb-4"
                        style={{ color: 'black' }}
                    >
                        เอกสารจ้างงาน
                    </h1>
                )}

                <div className="absolute top-0 right-2 text-left text-[10px] text-gray-500 bg-white/90">
                    <table className="border-collapse">
                        <tbody>
                            <tr>
                                <td className="pr-2">เลขที่เอกสาร</td>
                                <td>
                                    <input
                                        value={formData.contractNumber}
                                        onChange={e => setFormData({ ...formData, contractNumber: e.target.value })}
                                        className="w-[120px] border-b border-dotted border-gray-400 focus:outline-none text-right bg-transparent"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-2">วันที่สร้าง</td>
                                <td className="text-right">{new Date(formData.date).toLocaleDateString('th-TH')}</td>
                            </tr>
                            <tr>
                                <td className="pr-2">หน้าที่</td>
                                <td className="border-b border-dotted border-gray-400 w-[120px] text-right">{isPage2 ? '2 / 2' : '1 / 2'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-background w-full max-w-7xl h-[95vh] rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden">

                {/* Header Control Bar */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20 flex-wrap gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        ดูตัวอย่าง / แก้ไขสัญญา
                    </h2>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-background rounded-lg border px-2 py-1 shadow-sm">
                        <button onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} className="p-1 hover:bg-muted rounded transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                        <span className="text-xs font-mono w-14 text-center select-none">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 hover:bg-muted rounded transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground mr-2 hidden lg:inline-block">
                            * คลิกแก้ไขข้อความในเอกสารได้โดยตรง
                        </span>
                        <button
                            onClick={() => { onClose(); onEdit(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                        >
                            <Edit className="w-4 h-4" /> {t.common.edit}
                        </button>
                        <button
                            onClick={handleSaveToDrive}
                            disabled={isSavingToDrive}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-all text-sm font-bold shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            <UploadCloud className={`w-4 h-4 ${isSavingToDrive ? 'animate-bounce' : ''}`} />
                            <span>{isSavingToDrive ? 'กำลังบันทึก...' : 'บันทึกลง Drive'}</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full transition-all text-sm font-bold shadow-lg active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>พิมพ์ / ตัวอย่าง</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 px-4 border-l border-border">
                        <span className="text-muted-foreground text-xs font-medium">สีหมึก:</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setInkColor('black')}
                                className={`w-6 h-6 rounded-full bg-black border-2 transition-all ${inkColor === 'black' ? 'border-white ring-2 ring-primary shadow-lg scale-110' : 'border-transparent opacity-40 hover:opacity-100 uppercase'}`}
                                title="หมึกดำ"
                            />
                            <button
                                onClick={() => setInkColor('blue')}
                                className={`w-6 h-6 rounded-full bg-blue-900 border-2 transition-all ${inkColor === 'blue' ? 'border-white ring-2 ring-primary shadow-lg scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                title="หมึกน้ำเงิน"
                            />
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all ml-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-muted/30 scroll-smooth custom-scrollbar" ref={containerRef}>
                    <div className="flex flex-col items-center min-w-fit">
                        {/* PAGE 1 Wrapper */}
                        <div style={pageWrapperStyle}>
                            <div style={pageStyle} className="bg-white">
                                {renderHeader(false)}

                                {/* Project Info */}
                                <div className="space-y-3 mb-8 text-sm">
                                    <div className="flex items-center">
                                        <span className="font-bold w-[100px] text-gray-700 shrink-0">โครงการ :</span>
                                        <input
                                            value={formData.projectName}
                                            onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                            className="flex-1 border-b border-dotted border-gray-400 focus:outline-none bg-transparent hover:bg-gray-50 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-bold text-gray-700">หมวดหมู่ :</span>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 border-2 border-black rounded-sm flex items-center justify-center transition-colors group-hover:bg-gray-50">
                                                    {formData.contractType === 'labor' && <div className="w-2.5 h-2.5 bg-black"></div>}
                                                </div>
                                                <span
                                                    className={`text-sm ${formData.contractType === 'labor' ? 'font-bold' : ''}`}
                                                    onClick={() => setFormData({ ...formData, contractType: 'labor' })}
                                                >
                                                    ค่าแรง
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 border-2 border-black rounded-sm flex items-center justify-center transition-colors group-hover:bg-gray-50">
                                                    {formData.contractType === 'material' && <div className="w-2.5 h-2.5 bg-black"></div>}
                                                </div>
                                                <span
                                                    className={`text-sm ${formData.contractType === 'material' ? 'font-bold' : ''}`}
                                                    onClick={() => setFormData({ ...formData, contractType: 'material' })}
                                                >
                                                    ค่าแรงและค่าวัสดุ
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-bold w-[100px] text-gray-700 shrink-0">หัวข้อ :</span>
                                        <input
                                            value={contract.title || ''}
                                            className="flex-1 border-b border-dotted border-gray-400 focus:outline-none bg-transparent text-sm"
                                            readOnly
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-bold w-[100px] text-gray-700 shrink-0">ช่างผู้รับงาน :</span>
                                        <input
                                            value={formData.workerName}
                                            onChange={e => setFormData({ ...formData, workerName: e.target.value })}
                                            className="flex-1 border-b border-dotted border-gray-400 focus:outline-none bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Work Table */}
                                <div className="mb-6">
                                    <div className="text-center font-bold text-lg mb-4 text-black underline decoration-2 underline-offset-4">ตารางผลงาน</div>
                                    <table className="w-full border-collapse border-2 border-black text-sm">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border-2 border-black p-3 w-[60px]">ลำดับ</th>
                                                <th className="border-2 border-black p-3">รายการ</th>
                                                <th className="border-2 border-black p-3 w-[100px]">ราคา</th>
                                                <th className="border-2 border-black p-3 w-[70px]">หน่วย</th>
                                                <th className="border-2 border-black p-3 w-[100px]">รวม</th>
                                                <th className="border-2 border-black p-3 w-[120px]">หมายเหตุ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="border-2 border-black p-3 text-center align-top font-bold">1</td>
                                                <td className="border-2 border-black p-3 align-top">
                                                    <textarea
                                                        value={formData.scope}
                                                        onChange={e => setFormData({ ...formData, scope: e.target.value })}
                                                        className="w-full bg-transparent resize-none focus:outline-none min-h-[400px] leading-relaxed"
                                                    />
                                                </td>
                                                <td className="border-2 border-black p-3 text-right align-top">{formData.contractValue.toLocaleString()}</td>
                                                <td className="border-2 border-black p-3 text-center align-top">เหมา</td>
                                                <td className="border-2 border-black p-3 text-right align-top font-bold">{formData.contractValue.toLocaleString()}</td>
                                                <td className="border-2 border-black p-3 align-top"></td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 font-bold">
                                                <td colSpan={4} className="border-2 border-black p-3 text-right">รวมเงินค่าจ้างทั้งสิ้น</td>
                                                <td className="border-2 border-black p-3 text-right text-lg">{formData.contractValue.toLocaleString()}</td>
                                                <td className="border-2 border-black p-3 text-center">บาท</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Notes Part 1 */}
                                <div className="text-[11px] mt-auto border-t border-gray-200 pt-4 text-gray-600">
                                    <strong className="text-black">หมายเหตุ (ต่อหน้า 2):</strong><br />
                                    1. หากผู้รับจ้างไม่เข้าปฏิบัติงานเกินกว่า 15 วัน หรือทิ้งงาน บริษัทฯ ขอสงวนสิทธิ์ในการยกเลิกสัญญาจ้างทันที
                                </div>
                            </div>
                        </div>

                        {/* PAGE 2 Wrapper */}
                        <div style={pageWrapperStyle}>
                            <div style={pageStyle}>
                                {renderHeader(true)}

                                {/* Payment Table */}
                                <div className="mb-8 mt-4">
                                    <div className="text-center font-bold text-lg mb-4 text-black underline decoration-2 underline-offset-4">ตารางการจ่ายเงินแบ่งตามงวดงาน</div>
                                    <div className="relative">
                                        <div className="absolute -right-16 top-0 flex flex-col gap-3 no-print">
                                            <button
                                                onClick={() => {
                                                    const newInst = [...formData.installments, { name: '', amount: 0, dueDate: '', status: 'Pending' as const, paymentDetails: '', balance: undefined as number | undefined, notes: '' }]
                                                    setFormData({ ...formData, installments: newInst })
                                                }}
                                                className="w-10 h-10 bg-white hover:bg-primary hover:text-white rounded-full shadow-lg text-primary border border-primary/20 flex items-center justify-center transition-all active:scale-90 text-2xl"
                                                title="เพิ่มแถว"
                                            >+</button>
                                            <button
                                                onClick={() => {
                                                    if (formData.installments.length > 0) {
                                                        const newInst = [...formData.installments]
                                                        newInst.pop()
                                                        setFormData({ ...formData, installments: newInst })
                                                    }
                                                }}
                                                className="w-10 h-10 bg-white hover:bg-red-500 hover:text-white rounded-full shadow-lg text-red-500 border border-red-200 flex items-center justify-center transition-all active:scale-90 text-2xl"
                                                title="ลบแถว"
                                            >-</button>
                                        </div>
                                        <table className="w-full border-collapse border-2 border-black text-sm">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border-2 border-black p-3 w-[60px]">งวดที่</th>
                                                    <th className="border-2 border-black p-3">รายละเอียดผลงานที่แล้วเสร็จ</th>
                                                    <th className="border-2 border-black p-3 w-[100px]">จำนวนเงิน</th>
                                                    <th className="border-2 border-black p-3 w-[120px]">วันที่นัดจ่าย</th>
                                                    <th className="border-2 border-black p-3 w-[100px]">ยอดคงเหลือ</th>
                                                    <th className="border-2 border-black p-3 w-[120px]">หมายเหตุ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.installments.map((inst, i) => (
                                                    <tr key={i}>
                                                        <td className="border-2 border-black p-3 text-center font-bold">{i + 1}</td>
                                                        <td className="border-2 border-black p-3">
                                                            <input
                                                                value={inst.name}
                                                                onChange={e => {
                                                                    const newInst = [...formData.installments]
                                                                    newInst[i].name = e.target.value
                                                                    setFormData({ ...formData, installments: newInst })
                                                                }}
                                                                className="w-full bg-transparent focus:outline-none hover:bg-gray-50 focus:bg-white"
                                                            />
                                                        </td>
                                                        <td className="border-2 border-black p-3">
                                                            <input
                                                                type="number"
                                                                value={inst.amount}
                                                                onChange={e => {
                                                                    const newInst = [...formData.installments]
                                                                    newInst[i].amount = parseFloat(e.target.value) || 0
                                                                    setFormData({ ...formData, installments: newInst })
                                                                }}
                                                                className="w-full text-right bg-transparent focus:outline-none font-medium"
                                                            />
                                                        </td>
                                                        <td className="border-2 border-black p-3">
                                                            <input
                                                                value={inst.dueDate ? (inst.dueDate.includes('T') ? new Date(inst.dueDate).toLocaleDateString('th-TH') : inst.dueDate) : ''}
                                                                onChange={e => {
                                                                    const newInst = [...formData.installments]
                                                                    newInst[i].dueDate = e.target.value
                                                                    setFormData({ ...formData, installments: newInst })
                                                                }}
                                                                className="w-full text-center bg-transparent focus:outline-none text-[10px] text-gray-500"
                                                                placeholder="ว/ด/ป"
                                                            />
                                                        </td>
                                                        <td className="border-2 border-black p-3">
                                                            <input
                                                                type="number"
                                                                value={inst.balance ?? ''}
                                                                onChange={e => {
                                                                    const newInst = [...formData.installments]
                                                                    newInst[i].balance = e.target.value ? parseFloat(e.target.value) : undefined
                                                                    setFormData({ ...formData, installments: newInst })
                                                                }}
                                                                className="w-full text-right bg-transparent focus:outline-none text-sm"
                                                                placeholder=""
                                                            />
                                                        </td>
                                                        <td className="border-2 border-black p-3">
                                                            <input
                                                                value={inst.notes || ''}
                                                                onChange={e => {
                                                                    const newInst = [...formData.installments]
                                                                    newInst[i].notes = e.target.value
                                                                    setFormData({ ...formData, installments: newInst })
                                                                }}
                                                                className="w-full text-center bg-transparent focus:outline-none text-xs"
                                                                placeholder=""
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                                {formData.installments.length < 10 && Array(10 - formData.installments.length).fill(0).map((_, i) => (
                                                    <tr key={`empty-p2-${i}`}>
                                                        <td className="border-2 border-black p-3 text-center text-gray-300 font-bold">{formData.installments.length + i + 1}</td>
                                                        <td className="border-2 border-black p-3"></td>
                                                        <td className="border-2 border-black p-3"></td>
                                                        <td className="border-2 border-black p-3"></td>
                                                        <td className="border-2 border-black p-3"></td>
                                                        <td className="border-2 border-black p-3"></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="text-[11px] mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <strong className="text-black mb-1 block">เงื่อนไขการเลิกจ้างและชำระเงิน :</strong>
                                    <textarea
                                        value={formData.paymentNotes}
                                        onChange={e => setFormData({ ...formData, paymentNotes: e.target.value })}
                                        className="w-full bg-transparent resize-none focus:outline-none leading-relaxed min-h-[60px]"
                                    />
                                    <strong className="text-black mt-1 block">การจ่ายเงิน:</strong>
                                    <textarea
                                        value={formData.paymentSummary}
                                        onChange={e => setFormData({ ...formData, paymentSummary: e.target.value })}
                                        className="w-full bg-transparent resize-none focus:outline-none leading-relaxed"
                                    />
                                </div>

                                {/* Signatures */}
                                <div className="grid grid-cols-2 gap-x-12 gap-y-2 mt-auto pb-2">
                                    {renderSignatureBlock("requester", "ผู้เบิกจ่าย")}
                                    {renderSignatureBlock("supervisor", "ผู้ควบคุมงาน")}
                                    {renderSignatureBlock("inspector", "ผู้ตรวจสอบ", false, "( ผู้มีอำนาจลงนาม )")}
                                    {renderSignatureBlock("payer", "ผู้จ่ายเงิน", false, "( เจ้าของโครงการ/ตัวแทน )")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    function renderSignatureBlock(key: keyof typeof formData.signatures, role: string, isRight = false, subText = "") {
        const sig = formData.signatures[key]
        return (
            <div className="space-y-2">
                <div className="flex items-end gap-2">
                    <span className="text-[11px] shrink-0 pb-1">ลงชื่อ</span>
                    <div className="flex-1 border-b border-black h-8 flex items-end justify-center px-2">
                        <input
                            value={sig.name}
                            onChange={e => setFormData({
                                ...formData,
                                signatures: {
                                    ...formData.signatures,
                                    [key]: { ...sig, name: e.target.value }
                                }
                            })}
                            className="w-full text-center bg-transparent focus:outline-none text-xs font-bold"
                            placeholder="..."
                        />
                    </div>
                    <span className="text-[11px] shrink-0 pb-1 w-[60px]">{role}</span>
                </div>
                <div className="text-center text-[10px] text-gray-400 h-4">
                    {subText ? subText : (sig.name ? `( ${sig.name} )` : `( ........................................................... )`)}
                </div>
                <div className="flex items-center text-[11px] pl-8">
                    <span className="shrink-0 mr-2">วันที่</span>
                    <input
                        value={sig.date}
                        onChange={e => setFormData({
                            ...formData,
                            signatures: {
                                ...formData.signatures,
                                [key]: { ...sig, date: e.target.value }
                            }
                        })}
                        className="flex-1 border-b border-dotted border-gray-400 bg-transparent focus:outline-none text-center"
                        placeholder="......... / ......... / ..............."
                    />
                </div>
            </div>
        )
    }
}
