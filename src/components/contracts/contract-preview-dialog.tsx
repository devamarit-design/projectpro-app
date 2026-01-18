"use client"

import { useState, useEffect, useMemo } from "react"
import { Contract, useProjects } from "@/context/project-context"
import { useSettings } from "@/context/settings-context"
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
    const { orgProfile } = useSettings()
    const { t } = useTranslation()

    const project = projects.find(p => p.id === contract.projectId)
    const worker = workers.find(w => w.id === contract.workerId)

    const formatCurrency = (amt: number) => amt.toLocaleString('th-TH', { minimumFractionDigits: 2 })
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'

    // Generate print-ready HTML
    const contractHtml = useMemo(() => {
        const installmentRows = contract.installments.map((inst, i) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${inst.description}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${formatDate(inst.dueDate)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">฿${formatCurrency(inst.amount)}</td>
            </tr>
        `).join('')

        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>สัญญาจ้าง - ${contract.id}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; font-size: 14px; color: #1f2937; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        @media print { body { padding: 20px; } }
        h1 { font-size: 24px; color: #1f2937; text-align: center; margin-bottom: 8px; }
        .subtitle { text-align: center; color: #6b7280; margin-bottom: 24px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { display: flex; gap: 8px; }
        .info-label { font-weight: 600; color: #6b7280; min-width: 100px; }
        .scope-box { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { text-align: left; padding: 10px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
        .total-row { font-weight: 700; background: #f0f9ff; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; text-align: center; }
        .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 8px; }
        .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <h1>สัญญาจ้างงาน</h1>
    <p class="subtitle">เลขที่สัญญา: ${contract.id}</p>

    <div class="section">
        <div class="section-title">ข้อมูลคู่สัญญา</div>
        <div class="info-grid">
            <div class="info-item"><span class="info-label">ผู้ว่าจ้าง:</span> <span>${orgProfile?.name || 'Company'}</span></div>
            <div class="info-item"><span class="info-label">ที่อยู่:</span> <span>${orgProfile?.address || '-'}</span></div>
            <div class="info-item"><span class="info-label">ผู้รับจ้าง:</span> <span>${worker?.name || 'Unknown'}</span></div>
            <div class="info-item"><span class="info-label">โครงการ:</span> <span>${project?.name || 'Unknown Project'}</span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">ขอบเขตงาน</div>
        <div class="scope-box">${contract.scope || 'ไม่ระบุ'}</div>
    </div>

    <div class="section">
        <div class="section-title">ระยะเวลา</div>
        <div class="info-grid">
            <div class="info-item"><span class="info-label">วันเริ่มต้น:</span> <span>${formatDate(contract.startDate)}</span></div>
            <div class="info-item"><span class="info-label">วันสิ้นสุด:</span> <span>${formatDate(contract.endDate)}</span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">งวดการชำระเงิน</div>
        <table>
            <thead>
                <tr><th>งวดที่</th><th>รายละเอียด</th><th>กำหนดชำระ</th><th style="text-align: right;">จำนวนเงิน</th></tr>
            </thead>
            <tbody>
                ${installmentRows}
                <tr class="total-row">
                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: 700;">รวมทั้งหมด</td>
                    <td style="padding: 10px; text-align: right;">฿${formatCurrency(contract.totalAmount)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="signatures">
        <div>
            <div class="sig-line">ผู้ว่าจ้าง</div>
            <p style="margin-top: 8px; color: #6b7280;">(${orgProfile?.name || 'Company'})</p>
        </div>
        <div>
            <div class="sig-line">ผู้รับจ้าง</div>
            <p style="margin-top: 8px; color: #6b7280;">(${worker?.name || 'Worker'})</p>
        </div>
    </div>

    <div class="footer">
        Generated by ProjectPro • ${new Date().toLocaleString('th-TH')}
    </div>

    <script>window.onload = function() { window.print(); }</script>
</body>
</html>
        `
    }, [contract, project, worker, orgProfile])

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(contractHtml)
            printWindow.document.close()
        } else {
            alert('กรุณาอนุญาต Popup เพื่อเปิดหน้าพิมพ์')
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
                        ดูตัวอย่างสัญญา
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { onClose(); onEdit(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg text-sm font-bold transition-colors"
                        >
                            <Edit className="w-4 h-4" /> แก้ไข
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                        >
                            <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content - Live HTML Preview */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-6 overflow-auto">
                    <div className="bg-white text-black rounded-lg shadow-xl mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '40px' }}>
                        {/* Simple preview - mirrors the print version */}
                        <h1 className="text-2xl font-bold text-center mb-2">สัญญาจ้างงาน</h1>
                        <p className="text-center text-gray-500 mb-6">เลขที่สัญญา: {contract.id}</p>

                        <div className="mb-6">
                            <h3 className="font-bold border-b pb-2 mb-3">ข้อมูลคู่สัญญา</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="font-medium text-gray-600">ผู้ว่าจ้าง:</span> {orgProfile?.name || 'Company'}</div>
                                <div><span className="font-medium text-gray-600">ที่อยู่:</span> {orgProfile?.address || '-'}</div>
                                <div><span className="font-medium text-gray-600">ผู้รับจ้าง:</span> {worker?.name || 'Unknown'}</div>
                                <div><span className="font-medium text-gray-600">โครงการ:</span> {project?.name || 'Unknown'}</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold border-b pb-2 mb-3">ขอบเขตงาน</h3>
                            <div className="bg-gray-50 border-l-4 border-blue-500 p-4 text-sm">{contract.scope || 'ไม่ระบุ'}</div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold border-b pb-2 mb-3">ระยะเวลา</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="font-medium text-gray-600">วันเริ่มต้น:</span> {formatDate(contract.startDate)}</div>
                                <div><span className="font-medium text-gray-600">วันสิ้นสุด:</span> {formatDate(contract.endDate)}</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold border-b pb-2 mb-3">งวดการชำระเงิน</h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-2 text-left">งวดที่</th>
                                        <th className="p-2 text-left">รายละเอียด</th>
                                        <th className="p-2 text-left">กำหนดชำระ</th>
                                        <th className="p-2 text-right">จำนวนเงิน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contract.installments.map((inst, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-2">{i + 1}</td>
                                            <td className="p-2">{inst.description}</td>
                                            <td className="p-2">{formatDate(inst.dueDate)}</td>
                                            <td className="p-2 text-right">฿{formatCurrency(inst.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-50 font-bold">
                                        <td colSpan={3} className="p-2 text-right">รวมทั้งหมด</td>
                                        <td className="p-2 text-right">฿{formatCurrency(contract.totalAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

