"use client"

import { useState, useEffect, useRef } from "react"
import { Contract, useProjects } from "@/context/project-context"
import { useSettings } from "@/context/settings-context"
import { Printer, X, ZoomIn, ZoomOut } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

interface Installment {
    id: string
    description: string
    amount: number
    dueDate: string
    status: string
    paymentDetails?: string
}

interface PaymentVoucherDialogProps {
    isOpen: boolean
    onClose: () => void
    contract: Contract
    installment: Installment
    installmentIndex: number
}

export function PaymentVoucherDialog({ isOpen, onClose, contract, installment, installmentIndex }: PaymentVoucherDialogProps) {
    const { projects, workers } = useProjects()
    const { orgProfile } = useSettings()
    const { t } = useTranslation()

    const project = projects.find(p => p.id === contract.projectId)
    const worker = workers.find(w => w.id === contract.workerId)

    const [zoom, setZoom] = useState(0.7)
    const containerRef = useRef<HTMLDivElement>(null)

    const [formData, setFormData] = useState({
        docNumber: `PV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(installmentIndex + 1).padStart(2, '0')}`,
        requestDate: new Date().toLocaleDateString('th-TH'),
        paymentDate: '',
        workerName: worker?.name || '',
        projectName: project?.name || '',
        projectDescription: contract.title,
        items: [
            {
                description: installment.description + (installment.paymentDetails ? ` - ${installment.paymentDetails}` : ''),
                amount: installment.amount,
                notes: ''
            }
        ],
        totalAmount: installment.amount,
        totalAmountText: numberToThaiText(installment.amount),
        totalContractAmount: contract.totalAmount,
        installmentNumber: installmentIndex + 1,
        installmentAmount: installment.amount,
        remainingAmount: contract.totalAmount - contract.installments
            .slice(0, installmentIndex + 1)
            .reduce((sum, inst) => sum + inst.amount, 0),
        companyName: orgProfile?.name || 'ชื่อบริษัท',
        companyAddress: orgProfile?.address || '',
        companyPhone: orgProfile?.phone || '',
        signatures: {
            requester: { name: '', label: 'ผู้เบิกจ่าย' },
            inspector: { name: orgProfile?.name || '', label: 'ผู้ตรวจสอบ' },
            accountant: { name: '', label: 'ฝ่ายบัญชี' },
            payer: { name: '', label: 'ผู้จ่ายเงิน' }
        }
    })

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                docNumber: `PV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(installmentIndex + 1).padStart(2, '0')}`,
                workerName: worker?.name || '',
                projectName: project?.name || '',
                projectDescription: contract.title,
                items: [
                    {
                        description: installment.description + (installment.paymentDetails ? ` - ${installment.paymentDetails}` : ''),
                        amount: installment.amount,
                        notes: ''
                    }
                ],
                totalAmount: installment.amount,
                totalAmountText: numberToThaiText(installment.amount),
                totalContractAmount: contract.totalAmount,
                installmentNumber: installmentIndex + 1,
                installmentAmount: installment.amount,
                remainingAmount: contract.totalAmount - contract.installments
                    .slice(0, installmentIndex + 1)
                    .reduce((sum, inst) => sum + inst.amount, 0),
                companyName: orgProfile?.name || 'ชื่อบริษัท',
                companyAddress: orgProfile?.address || '',
                companyPhone: orgProfile?.phone || '',
            }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, contract.id, installment.id])

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const html = generateVoucherHTML()
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.onload = () => {
            printWindow.print()
        }
    }

    const generateVoucherHTML = () => {
        const itemRows = formData.items.map((item, i) => `
            <tr>
                <td style="text-align: center; border: 1px solid #000; padding: 8px;">${i + 1}</td>
                <td style="border: 1px solid #000; padding: 8px;">${item.description}</td>
                <td style="text-align: right; border: 1px solid #000; padding: 8px;">${item.amount.toLocaleString()}</td>
                <td style="border: 1px solid #000; padding: 8px;">${item.notes}</td>
            </tr>
        `).join('')

        const emptyRows = Array(Math.max(0, 5 - formData.items.length)).fill(0).map((_, i) => `
            <tr>
                <td style="text-align: center; border: 1px solid #000; padding: 8px; height: 30px;">${formData.items.length + i + 1}</td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
            </tr>
        `).join('')

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ใบสำคัญจ่าย - ${formData.docNumber}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body { 
            font-family: 'Sarabun', 'TH SarabunPSK', sans-serif; 
            font-size: 14px; 
            line-height: 1.4;
            color: #000;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 20px; font-weight: bold; margin: 0; }
        .company-info { margin-bottom: 15px; }
        .doc-info { text-align: right; margin-bottom: 15px; }
        .doc-info div { margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .info-table td { padding: 5px 0; }
        .info-label { width: 100px; }
        .signature-section { margin-top: 30px; }
        .signature-row { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-bottom: 1px dotted #000; width: 200px; margin: 30px auto 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ใบสำคัญจ่าย (PAYMENT VOUCHER)</h1>
        </div>

        <div class="company-info">
            <strong>${formData.companyName}</strong><br>
            ${formData.companyAddress}<br>
            ${formData.companyPhone ? `โทร. ${formData.companyPhone}` : ''}
        </div>

        <div class="doc-info">
            <div>เลขที่เอกสาร: <u>${formData.docNumber}</u></div>
            <div>วันที่แจ้งเบิก: <u>${formData.requestDate}</u></div>
            <div>วันที่จ่ายเงิน: <u>${formData.paymentDate || '___/___/___'}</u></div>
        </div>

        <table class="info-table">
            <tr>
                <td class="info-label"><strong>ชื่อช่าง/คนทำงาน</strong></td>
                <td style="border-bottom: 1px dotted #000;">${formData.workerName}</td>
            </tr>
            <tr>
                <td><strong>โครงการ</strong></td>
                <td style="border-bottom: 1px dotted #000;">${formData.projectName}</td>
            </tr>
            <tr>
                <td><strong>โปรเจคงาน</strong></td>
                <td style="border-bottom: 1px dotted #000;">${formData.projectDescription}</td>
            </tr>
        </table>

        <table>
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="border: 1px solid #000; padding: 8px; width: 50px;">ลำดับ</th>
                    <th style="border: 1px solid #000; padding: 8px;">รายละเอียดการเบิกเงิน</th>
                    <th style="border: 1px solid #000; padding: 8px; width: 100px;">จำนวนเงิน (บาท)</th>
                    <th style="border: 1px solid #000; padding: 8px; width: 100px;">หมายเหตุ</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
                ${emptyRows}
                <tr style="background: #f9f9f9;">
                    <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>รวมเป็นเงินทั้งสิ้น</strong></td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${formData.totalAmount.toLocaleString()}</strong></td>
                    <td style="border: 1px solid #000; padding: 8px;"></td>
                </tr>
                <tr>
                    <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: right;">ยอดเงินตัวหนังสือ</td>
                    <td colspan="2" style="border: 1px solid #000; padding: 8px;"><strong>${formData.totalAmountText}</strong></td>
                </tr>
            </tbody>
        </table>

        <table class="info-table" style="margin-top: 10px; width: 100%;">
            <tr>
                <td style="padding: 5px 0;"><strong>ยอดรวมค่าแรงทั้งหมด</strong></td>
                <td style="text-align: right; border-bottom: 1px dotted #000; width: 150px; padding: 5px 10px;">${formData.totalContractAmount.toLocaleString()}</td>
                <td style="width: 50px; padding: 5px 0 5px 10px;">บาท</td>
            </tr>
            <tr>
                <td style="padding: 5px 0;">
                    <strong>โอนจ่ายค่าแรงในงวดที่</strong>
                    <span style="display: inline-block; border-bottom: 1px dotted #000; padding: 0 20px; margin: 0 10px;">${formData.installmentNumber}</span>
                    <strong>เป็นจำนวน</strong>
                </td>
                <td style="text-align: right; border-bottom: 1px dotted #000; width: 150px; padding: 5px 10px;"><strong>${formData.installmentAmount.toLocaleString()}</strong></td>
                <td style="width: 50px; padding: 5px 0 5px 10px;">บาท</td>
            </tr>
            <tr>
                <td style="padding: 5px 0;"><strong>คงเหลือค่าแรงโอนจ่ายในครั้งถัดไป</strong></td>
                <td style="text-align: right; border-bottom: 1px dotted #000; width: 150px; padding: 5px 10px;">${formData.remainingAmount.toLocaleString()}</td>
                <td style="width: 50px; padding: 5px 0 5px 10px;">บาท</td>
            </tr>
        </table>

        <div class="signature-section">
            <div class="signature-row">
                <div class="signature-box">
                    <div>ลงชื่อ <span class="signature-line"></span> ${formData.signatures.requester.label}</div>
                    <div style="margin-top: 5px;">(${formData.signatures.requester.name || '..............................'})</div>
                </div>
                <div class="signature-box">
                    <div>ลงชื่อ <span class="signature-line"></span> ${formData.signatures.inspector.label}</div>
                    <div style="margin-top: 5px;">(${formData.signatures.inspector.name || '..............................'})</div>
                </div>
            </div>
            <div class="signature-row">
                <div class="signature-box">
                    <div>ลงชื่อ <span class="signature-line"></span> ${formData.signatures.accountant.label}</div>
                    <div style="margin-top: 5px;">(${formData.signatures.accountant.name || '..............................'})</div>
                </div>
                <div class="signature-box">
                    <div>ลงชื่อ <span class="signature-line"></span> ${formData.signatures.payer.label}</div>
                    <div style="margin-top: 5px;">(${formData.signatures.payer.name || '..............................'})</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
        `
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-start justify-center overflow-y-auto py-4">
            <div className="relative w-full max-w-4xl mx-4 flex flex-col" style={{ minHeight: 'min-content' }}>
                {/* Header Controls */}
                <div className="sticky top-0 z-10 bg-card p-4 rounded-t-xl shadow-lg flex items-center gap-4 border-b border-border">
                    <h2 className="text-xl font-bold text-primary flex-1">ใบสำคัญจ่าย</h2>

                    {/* Zoom */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
                        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1 hover:bg-background rounded">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1 hover:bg-background rounded">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                    >
                        <Printer className="w-4 h-4" /> พิมพ์
                    </button>

                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview Container */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto bg-gray-700 p-8 rounded-b-xl"
                >
                    <div
                        className="bg-white text-black mx-auto shadow-2xl origin-top"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                            padding: '15mm'
                        }}
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-xl font-bold">ใบสำคัญจ่าย (PAYMENT VOUCHER)</h1>
                        </div>

                        {/* Company Info */}
                        <div className="mb-4">
                            <input
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                className="font-bold bg-transparent focus:outline-none focus:bg-yellow-50 px-1 w-full"
                                placeholder="ชื่อบริษัท"
                            />
                            <input
                                value={formData.companyAddress}
                                onChange={e => setFormData({ ...formData, companyAddress: e.target.value })}
                                className="bg-transparent focus:outline-none focus:bg-yellow-50 px-1 w-full text-sm"
                                placeholder="ที่อยู่"
                            />
                            <input
                                value={formData.companyPhone}
                                onChange={e => setFormData({ ...formData, companyPhone: e.target.value })}
                                className="bg-transparent focus:outline-none focus:bg-yellow-50 px-1 w-full text-sm"
                                placeholder="โทร."
                            />
                        </div>

                        {/* Doc Info */}
                        <div className="text-right mb-4 space-y-1">
                            <div>เลขที่เอกสาร: <input value={formData.docNumber} onChange={e => setFormData({ ...formData, docNumber: e.target.value })} className="border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 w-40 text-center" /></div>
                            <div>วันที่แจ้งเบิก: <input value={formData.requestDate} onChange={e => setFormData({ ...formData, requestDate: e.target.value })} className="border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 w-40 text-center" /></div>
                            <div>วันที่จ่ายเงิน: <input value={formData.paymentDate} onChange={e => setFormData({ ...formData, paymentDate: e.target.value })} className="border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 w-40 text-center" placeholder="___/___/___" /></div>
                        </div>

                        {/* Worker Info */}
                        <table className="w-full mb-4">
                            <tbody>
                                <tr>
                                    <td className="w-32 py-1"><strong>ชื่อช่าง/คนทำงาน</strong></td>
                                    <td><input value={formData.workerName} onChange={e => setFormData({ ...formData, workerName: e.target.value })} className="border-b border-dotted border-black w-full bg-transparent focus:outline-none focus:bg-yellow-50 px-1" /></td>
                                </tr>
                                <tr>
                                    <td className="py-1"><strong>โครงการ</strong></td>
                                    <td><input value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} className="border-b border-dotted border-black w-full bg-transparent focus:outline-none focus:bg-yellow-50 px-1" /></td>
                                </tr>
                                <tr>
                                    <td className="py-1"><strong>โปรเจคงาน</strong></td>
                                    <td><input value={formData.projectDescription} onChange={e => setFormData({ ...formData, projectDescription: e.target.value })} className="border-b border-dotted border-black w-full bg-transparent focus:outline-none focus:bg-yellow-50 px-1" /></td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Items Table */}
                        <table className="w-full border-collapse mb-4">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-2 w-12">ลำดับ</th>
                                    <th className="border border-black p-2">รายละเอียดการเบิกเงิน</th>
                                    <th className="border border-black p-2 w-28">จำนวนเงิน (บาท)</th>
                                    <th className="border border-black p-2 w-28">หมายเหตุ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="border border-black p-2 text-center">{i + 1}</td>
                                        <td className="border border-black p-2">
                                            <input
                                                value={item.description}
                                                onChange={e => {
                                                    const newItems = [...formData.items]
                                                    newItems[i].description = e.target.value
                                                    setFormData({ ...formData, items: newItems })
                                                }}
                                                className="w-full bg-transparent focus:outline-none focus:bg-yellow-50"
                                            />
                                        </td>
                                        <td className="border border-black p-2">
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={e => {
                                                    const newItems = [...formData.items]
                                                    newItems[i].amount = parseFloat(e.target.value) || 0
                                                    const total = newItems.reduce((sum, it) => sum + it.amount, 0)
                                                    setFormData({
                                                        ...formData,
                                                        items: newItems,
                                                        totalAmount: total,
                                                        totalAmountText: numberToThaiText(total)
                                                    })
                                                }}
                                                className="w-full text-right bg-transparent focus:outline-none focus:bg-yellow-50"
                                            />
                                        </td>
                                        <td className="border border-black p-2">
                                            <input
                                                value={item.notes}
                                                onChange={e => {
                                                    const newItems = [...formData.items]
                                                    newItems[i].notes = e.target.value
                                                    setFormData({ ...formData, items: newItems })
                                                }}
                                                className="w-full bg-transparent focus:outline-none focus:bg-yellow-50"
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {/* Empty rows */}
                                {Array(Math.max(0, 5 - formData.items.length)).fill(0).map((_, i) => (
                                    <tr key={`empty-${i}`}>
                                        <td className="border border-black p-2 text-center text-gray-300">{formData.items.length + i + 1}</td>
                                        <td className="border border-black p-2 h-8"></td>
                                        <td className="border border-black p-2"></td>
                                        <td className="border border-black p-2"></td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50">
                                    <td colSpan={2} className="border border-black p-2 text-right"><strong>รวมเป็นเงินทั้งสิ้น</strong></td>
                                    <td className="border border-black p-2 text-right"><strong>{formData.totalAmount.toLocaleString()}</strong></td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                                <tr>
                                    <td colSpan={2} className="border border-black p-2 text-right">ยอดเงินตัวหนังสือ</td>
                                    <td colSpan={2} className="border border-black p-2"><strong>{formData.totalAmountText}</strong></td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Summary */}
                        <table className="w-full mb-6">
                            <tbody>
                                <tr>
                                    <td className="py-2"><strong>ยอดรวมค่าแรงทั้งหมด</strong></td>
                                    <td className="text-right border-b border-dotted border-black px-4 w-40">{formData.totalContractAmount.toLocaleString()}</td>
                                    <td className="pl-4 w-12">บาท</td>
                                </tr>
                                <tr>
                                    <td className="py-2">
                                        <div className="flex items-center">
                                            <strong className="shrink-0">โอนจ่ายค่าแรงในงวดที่</strong>
                                            <span className="min-w-[40px] text-center border-b border-dotted border-black mx-2 px-2">{formData.installmentNumber}</span>
                                            <strong className="shrink-0">เป็นจำนวน</strong>
                                        </div>
                                    </td>
                                    <td className="text-right border-b border-dotted border-black px-4 w-40 font-bold">{formData.installmentAmount.toLocaleString()}</td>
                                    <td className="pl-4 w-12">บาท</td>
                                </tr>
                                <tr>
                                    <td className="py-2"><strong>คงเหลือค่าแรงโอนจ่ายในครั้งถัดไป</strong></td>
                                    <td className="text-right border-b border-dotted border-black px-4 w-40">{formData.remainingAmount.toLocaleString()}</td>
                                    <td className="pl-4 w-12">บาท</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Signatures */}
                        <div className="mt-8">
                            <div className="flex justify-between mb-10">
                                <div className="text-center w-[45%]">
                                    <div>ลงชื่อ .................................................. {formData.signatures.requester.label}</div>
                                    <div className="mt-1">(<input value={formData.signatures.requester.name} onChange={e => setFormData({ ...formData, signatures: { ...formData.signatures, requester: { ...formData.signatures.requester, name: e.target.value } } })} className="text-center bg-transparent focus:outline-none focus:bg-yellow-50 w-40" placeholder="ชื่อ" />)</div>
                                </div>
                                <div className="text-center w-[45%]">
                                    <div>ลงชื่อ .................................................. {formData.signatures.inspector.label}</div>
                                    <div className="mt-1">(<input value={formData.signatures.inspector.name} onChange={e => setFormData({ ...formData, signatures: { ...formData.signatures, inspector: { ...formData.signatures.inspector, name: e.target.value } } })} className="text-center bg-transparent focus:outline-none focus:bg-yellow-50 w-40" placeholder="ชื่อ" />)</div>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <div className="text-center w-[45%]">
                                    <div>ลงชื่อ .................................................. {formData.signatures.accountant.label}</div>
                                    <div className="mt-1">(<input value={formData.signatures.accountant.name} onChange={e => setFormData({ ...formData, signatures: { ...formData.signatures, accountant: { ...formData.signatures.accountant, name: e.target.value } } })} className="text-center bg-transparent focus:outline-none focus:bg-yellow-50 w-40" placeholder="ชื่อ" />)</div>
                                </div>
                                <div className="text-center w-[45%]">
                                    <div>ลงชื่อ .................................................. {formData.signatures.payer.label}</div>
                                    <div className="mt-1">(<input value={formData.signatures.payer.name} onChange={e => setFormData({ ...formData, signatures: { ...formData.signatures, payer: { ...formData.signatures.payer, name: e.target.value } } })} className="text-center bg-transparent focus:outline-none focus:bg-yellow-50 w-40" placeholder="ชื่อ" />)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper function to convert number to Thai text
function numberToThaiText(num: number): string {
    if (num === 0) return 'ศูนย์บาทถ้วน'

    const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
    const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

    const intPart = Math.floor(num)
    const decPart = Math.round((num - intPart) * 100)

    function convertGroup(n: number): string {
        if (n === 0) return ''

        let result = ''
        let position = 0

        while (n > 0) {
            const digit = n % 10

            if (digit !== 0) {
                if (position === 1 && digit === 1) {
                    result = 'สิบ' + result
                } else if (position === 1 && digit === 2) {
                    result = 'ยี่สิบ' + result
                } else if (position === 0 && digit === 1 && intPart > 10) {
                    result = 'เอ็ด' + result
                } else {
                    result = units[digit] + positions[position] + result
                }
            }

            n = Math.floor(n / 10)
            position++
        }

        return result
    }

    let result = ''

    if (intPart >= 1000000) {
        result += convertGroup(Math.floor(intPart / 1000000)) + 'ล้าน'
    }
    result += convertGroup(intPart % 1000000)
    result += 'บาท'

    if (decPart > 0) {
        result += convertGroup(decPart) + 'สตางค์'
    } else {
        result += 'ถ้วน'
    }

    return result
}
