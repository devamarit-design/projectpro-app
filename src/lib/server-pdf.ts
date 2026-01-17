'use client'

/**
 * Sanitize filename to remove non-ASCII characters
 */
function sanitizeFilename(filename: string): string {
    // Replace Thai/non-ASCII characters with transliteration or underscore
    return filename.replace(/[^\x00-\x7F]/g, '_').replace(/__+/g, '_')
}

/**
 * Generate PDF on server-side with Thai font support
 * Uses Puppeteer to render HTML to PDF
 */
export async function generateServerPDF(html: string, filename: string = 'document.pdf'): Promise<void> {
    // Sanitize filename to ASCII-only
    const safeFilename = sanitizeFilename(filename)

    try {
        const response = await fetch('/api/pdf/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html, filename: safeFilename }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.details || error.error || 'Failed to generate PDF')
        }

        // Get the blob and trigger download
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = safeFilename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
        console.error('Server PDF generation failed:', error)
        throw error
    }
}

/**
 * Generate PDF blob for further processing (e.g. convert to image)
 */
export async function generateServerPDFBlob(html: string): Promise<Blob> {
    const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename: 'temp.pdf' }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Failed to generate PDF')
    }

    return await response.blob()
}

/**
 * Generate HTML for Expense Report
 */
export function generateExpenseReportHTML(
    projectName: string,
    items: Array<{
        date: string
        category: string
        title: string
        status: string
        amount: string | number
        totalValue?: number
    }>
): string {
    const total = items.reduce((sum, item) => {
        const val = item.totalValue || (typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount).replace(/[^\d.-]/g, '') || '0'))
        return sum + val
    }, 0)

    const rows = items.map(item => `
        <tr>
            <td>${item.date || '-'}</td>
            <td>${item.category}</td>
            <td>${item.title}</td>
            <td>${item.status}</td>
            <td style="text-align: right">${typeof item.amount === 'number' ? item.amount.toLocaleString() : item.amount}</td>
        </tr>
    `).join('')

    return `
        <div style="max-width: 800px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 20px;">
                <div>
                    <h1 style="margin: 0; color: #f97316; font-size: 24px;">รายงานค่าใช้จ่าย</h1>
                    <p style="margin: 4px 0 0 0; color: #666;">${projectName}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; color: #666;">สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH')}</p>
                    <p style="margin: 4px 0 0 0; color: #666;">${items.length} รายการ</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e7eb;">วันที่</th>
                        <th style="text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e7eb;">หมวดหมู่</th>
                        <th style="text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e7eb;">รายการ</th>
                        <th style="text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e7eb;">สถานะ</th>
                        <th style="text-align: right; padding: 12px 8px; border-bottom: 2px solid #e5e7eb;">จำนวนเงิน</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
                <div style="text-align: right;">
                    <span style="font-weight: bold; margin-right: 16px;">รวมทั้งสิ้น:</span>
                    <span style="font-weight: bold; font-size: 18px; color: #f97316;">฿${total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `
}

/**
 * Generate HTML for Income Document (Quotation/Invoice/Receipt)
 * Matching the "Modern" template from document-preview.tsx
 */
export function generateIncomeDocumentHTML(
    doc: {
        type: string
        documentNumber: string
        date: string
        customerName?: string
        customerAddress?: string
        customerTaxId?: string
        projectName?: string
        projectDescription?: string
        items: Array<{ name: string; description?: string; quantity: number; unit?: string; unitPrice?: number; total?: number; image?: string }>
        subtotal: number
        discount?: number
        tax: number
        grandTotal: number
        paymentDetails?: string
        note?: string
    },
    companyProfile: {
        name: string
        address?: string
        taxId?: string
        tel?: string
        email?: string
        logo?: string
    },
    themeColor: string = '#3b82f6',
    labels: any = {} // For passing localized labels if needed
): string {
    const typeLabels: Record<string, string> = {
        Quotation: 'ใบเสนอราคา',
        Invoice: 'ใบแจ้งหนี้',
        Receipt: 'ใบเสร็จรับเงิน',
        ...labels.docTypes
    }
    const docTitle = typeLabels[doc.type] || doc.type

    const itemRows = doc.items.map((item, i) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 8px; color: #64748b;">${i + 1}</td>
            <td style="padding: 12px 8px;">
                <div style="display: flex; gap: 8px; align-items: flex-start;">
                    ${item.image ? `<img src="${item.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : ''}
                    <div>
                        <div style="font-weight: 500; color: #1e293b;">${item.name}</div>
                        ${item.description ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${item.description}</div>` : ''}
                    </div>
                </div>
            </td>
            <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 8px; text-align: center; font-size: 12px; color: #64748b;">${item.unit || 'unit'}</td>
            <td style="padding: 12px 8px; text-align: right;">${item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: 500;">${item.total?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
        </tr>
    `).join('')

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap');
                body {
                    font-family: 'Sarabun', sans-serif;
                    margin: 0;
                    padding: 40px;
                    color: #1e293b;
                    font-size: 13px;
                    line-height: 1.5;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                }
                .brand {
                    flex: 1;
                }
                .logo-box {
                    width: 48px;
                    height: 48px;
                    background: #1e293b;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 12px;
                }
                .doc-info {
                    text-align: right;
                }
                .doc-title {
                    font-size: 32px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin: 0 0 8px 0;
                    color: #0f172a;
                    letter-spacing: 0.05em;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .info-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                }
                .label {
                    font-size: 11px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                .value {
                    font-weight: 600;
                    font-size: 14px;
                    color: #0f172a;
                    margin-bottom: 4px;
                }
                .sub-value {
                    color: #64748b;
                    font-size: 13px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 32px;
                }
                th {
                    text-align: left;
                    padding: 12px 8px;
                    border-bottom: 2px solid #e2e8f0;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #64748b;
                    font-weight: 700;
                }
                .summary-section {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 60px;
                }
                .summary-table td {
                    padding: 6px 0 6px 32px;
                    text-align: right;
                }
                .total-row td {
                    padding-top: 16px;
                    font-size: 18px;
                    font-weight: 700;
                    color: #0f172a;
                    border-top: 1px solid #e2e8f0;
                }
                .footer {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    margin-top: auto;
                }
                .signature-line {
                    border-top: 1px solid #cbd5e1;
                    margin-top: 50px;
                    padding-top: 8px;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                }
                .payment-info {
                    margin-top: 40px;
                    font-size: 12px;
                    color: #64748b;
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 8px;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 16px;
                    background: ${themeColor}15;
                    color: ${themeColor};
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="brand">
                    <div style="display: flex; gap: 16px; align-items: flex-start;">
                        ${companyProfile.logo ?
            `<img src="${companyProfile.logo}" style="height: 48px; border-radius: 8px;">` :
            `<div class="logo-box">${companyProfile.name.charAt(0)}</div>`
        }
                        <div>
                            <div style="font-weight: 700; font-size: 16px; color: #0f172a;">${companyProfile.name}</div>
                            <div class="sub-value" style="margin-top: 4px;">
                                ${companyProfile.address || ''}<br>
                                ${companyProfile.taxId ? `TAX ID: ${companyProfile.taxId}` : ''}
                                ${companyProfile.tel ? `• Tel: ${companyProfile.tel}` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="doc-info">
                    <div class="doc-title">${docTitle}</div>
                    <div style="color: #64748b;">${labels.original || 'ORIGINAL'}</div>
                    <table style="width: auto; margin-left: auto; margin-bottom: 0;">
                        <tr>
                            <td style="text-align: right; padding-right: 12px; color: #64748b;">${labels.no || 'NO.'}</td>
                            <td style="font-weight: 600;">${doc.documentNumber}</td>
                        </tr>
                        <tr>
                            <td style="text-align: right; padding-right: 12px; color: #64748b;">${labels.date || 'DATE'}</td>
                            <td style="font-weight: 600;">${new Date(doc.date).toLocaleDateString('en-GB')}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <div class="label">${labels.customer || 'Customer'}</div>
                    <div class="value">${doc.customerName || 'Customer Name'}</div>
                    <div class="sub-value">
                        ${doc.customerAddress || '-'}<br>
                        ${doc.customerTaxId ? `Tax ID: ${doc.customerTaxId}` : ''}
                    </div>
                </div>
                <div class="info-box">
                    <div class="label">${labels.projectRef || 'Project Reference'}</div>
                    <div class="value">${doc.projectName || 'Project Name'}</div>
                    <div class="sub-value">${doc.projectDescription || '-'}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">#</th>
                        <th>${labels.description || 'Description'}</th>
                        <th style="width: 80px; text-align: center;">${labels.qty || 'Qty'}</th>
                        <th style="width: 80px; text-align: center;">${labels.unit || 'Unit'}</th>
                        <th style="width: 120px; text-align: right;">${labels.price || 'Price'}</th>
                        <th style="width: 120px; text-align: right;">${labels.total || 'Total'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
            </table>

            <div class="summary-section">
                <table class="summary-table" style="width: auto;">
                    <tr>
                        <td style="color: #64748b;">${labels.subtotal || 'Subtotal'}</td>
                        <td style="font-weight: 600;">${doc.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    ${doc.discount ? `
                    <tr>
                        <td style="color: #64748b;">${labels.discount || 'Discount'}</td>
                        <td style="color: #ef4444;">-${doc.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="color: #64748b;">${labels.vat || 'VAT (7%)'}</td>
                        <td style="font-weight: 600;">${doc.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="total-row">
                        <td>${labels.grandTotal || 'Grand Total'}</td>
                        <td>${doc.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                </table>
            </div>

            ${doc.paymentDetails ? `
                <div class="payment-info">
                    <strong>Payment Details:</strong><br>
                    <div style="white-space: pre-wrap; margin-top: 4px;">${doc.paymentDetails}</div>
                </div>
            ` : ''}

            <div class="footer">
                <div style="text-align: center;">
                    <div class="signature-line">
                        <strong>${labels.customerSig || 'Customer Signature'}</strong><br>
                        Date: ______/______/______
                    </div>
                </div>
                <div style="text-align: center;">
                    <div class="signature-line">
                        <strong>${labels.authSig || 'Authorized Signature'}</strong><br>
                        ${companyProfile.name}<br>
                        Date: ______/______/______
                    </div>
                </div>
            </div>
        </body>
        </html>
    `
}

/**
 * Generate HTML for Dashboard Report
 */
export function generateDashboardReportHTML(
    data: {
        companyName: string
        dateRange: string
        totalIncome: number
        totalExpense: number
        projects: Array<{ name: string; budget: number; progress: number }>
        recentIncomes: Array<{ date: string; type: string; docNumber: string; amount: number }>
        recentExpenses: Array<{ date: string; category: string; title: string; amount: number }>
    }
): string {
    const profit = data.totalIncome - data.totalExpense
    const profitClass = profit >= 0 ? 'color: #10b981' : 'color: #ef4444'

    const projectRows = data.projects.slice(0, 10).map(p => `
        < tr >
        <td style="padding: 10px 8px;" > ${p.name} </td>
            < td style = "padding: 10px 8px; text-align: right;" >฿${p.budget.toLocaleString()} </td>
                < td style = "padding: 10px 8px; text-align: center;" >
                    <div style="background: #e5e7eb; border-radius: 9999px; height: 8px; width: 100px;" >
                        <div style="background: #3b82f6; border-radius: 9999px; height: 8px; width: ${p.progress}%;" > </div>
                            </div>
                            < span style = "font-size: 10px; color: #888;" > ${p.progress}% </span>
                                </td>
                                </tr>
                                    `).join('')

    const incomeRows = data.recentIncomes.slice(0, 10).map(i => `
                                < tr >
                                <td style="padding: 8px;" > ${i.date} </td>
                                    < td style = "padding: 8px;" > ${i.type} </td>
                                        < td style = "padding: 8px;" > ${i.docNumber} </td>
                                            < td style = "padding: 8px; text-align: right; color: #10b981;" > +฿${i.amount.toLocaleString()} </td>
                                                </tr>
                                                    `).join('')

    const expenseRows = data.recentExpenses.slice(0, 10).map(e => `
                                                < tr >
                                                <td style="padding: 8px;" > ${e.date} </td>
                                                    < td style = "padding: 8px;" > ${e.category} </td>
                                                        < td style = "padding: 8px;" > ${e.title} </td>
                                                            < td style = "padding: 8px; text-align: right; color: #ef4444;" > -฿${e.amount.toLocaleString()} </td>
                                                                </tr>
                                                                    `).join('')

    return `
                                                                < div style = "max-width: 800px; margin: 0 auto; padding: 20px;" >
                                                                    <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px;" >
                                                                        <div>
                                                                        <h1 style="margin: 0; font-size: 28px; color: #3b82f6;" > รายงานภาพรวม </h1>
                                                                            < p style = "margin: 4px 0 0 0; font-size: 14px; color: #666;" > ${data.companyName} </p>
                                                                                </div>
                                                                                < div style = "text-align: right;" >
                                                                                    <p style="margin: 0; color: #888; font-size: 12px;" > ช่วงเวลา </p>
                                                                                        < p style = "margin: 4px 0 0 0; font-weight: bold;" > ${data.dateRange} </p>
                                                                                            < p style = "margin: 4px 0 0 0; color: #888; font-size: 12px;" > สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH')} </p>
                                                                                                </div>
                                                                                                </div>

                                                                                                < !--Summary Cards-- >
                                                                                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;" >
                                                                                                        <div style="background: #ecfdf5; border-radius: 12px; padding: 16px; border: 1px solid #a7f3d0;" >
                                                                                                            <p style="margin: 0; font-size: 12px; color: #059669;" > รายรับ </p>
                                                                                                                < p style = "margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #047857;" >฿${data.totalIncome.toLocaleString()} </p>
                                                                                                                    </div>
                                                                                                                    < div style = "background: #fef2f2; border-radius: 12px; padding: 16px; border: 1px solid #fecaca;" >
                                                                                                                        <p style="margin: 0; font-size: 12px; color: #dc2626;" > รายจ่าย </p>
                                                                                                                            < p style = "margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #b91c1c;" >฿${data.totalExpense.toLocaleString()} </p>
                                                                                                                                </div>
                                                                                                                                < div style = "background: ${profit >= 0 ? '#f0fdf4' : '#fef2f2'}; border-radius: 12px; padding: 16px; border: 1px solid ${profit >= 0 ? '#bbf7d0' : '#fecaca'};" >
                                                                                                                                    <p style="margin: 0; font-size: 12px; color: ${profit >= 0 ? '#059669' : '#dc2626'};" > กำไร / ขาดทุน </p>
                                                                                                                                        < p style = "margin: 8px 0 0 0; font-size: 24px; font-weight: bold; ${profitClass}" >฿${profit.toLocaleString()} </p>
                                                                                                                                            </div>
                                                                                                                                            </div>

                                                                                                                                            < !--Projects -->
                                                                                                                                                <div style="margin-bottom: 24px;" >
                                                                                                                                                    <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;" > โครงการ(${data.projects.length}) </h2>
                                                                                                                                                        < table style = "width: 100%; border-collapse: collapse; font-size: 13px;" >
                                                                                                                                                            <thead>
                                                                                                                                                            <tr style="background: #f9fafb;" >
                                                                                                                                                                <th style="padding: 10px 8px; text-align: left;" > ชื่อโครงการ </th>
                                                                                                                                                                    < th style = "padding: 10px 8px; text-align: right;" > งบประมาณ </th>
                                                                                                                                                                        < th style = "padding: 10px 8px; text-align: center;" > ความคืบหน้า </th>
                                                                                                                                                                            </tr>
                                                                                                                                                                            </thead>
                                                                                                                                                                            <tbody>
                        ${projectRows}
</tbody>
    </table>
    </div>

    < !--Recent Transactions-- >
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;" >
            <div>
            <h3 style="font-size: 14px; margin: 0 0 8px 0; color: #059669;" > รายรับล่าสุด </h3>
                < table style = "width: 100%; border-collapse: collapse; font-size: 12px;" >
                    <tbody>${incomeRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #888;">ไม่มีข้อมูล</td></tr>'} </tbody>
                        </table>
                        </div>
                        < div >
                        <h3 style="font-size: 14px; margin: 0 0 8px 0; color: #dc2626;" > รายจ่ายล่าสุด </h3>
                            < table style = "width: 100%; border-collapse: collapse; font-size: 12px;" >
                                <tbody>${expenseRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #888;">ไม่มีข้อมูล</td></tr>'} </tbody>
                                    </table>
                                    </div>
                                    </div>
                                    </div>
                                        `
}

/**
 * Generate HTML for Contract
 */
export function generateContractHTML(
    data: {
        contractNumber: string
        date: string
        projectName: string
        workerName: string
        workerAddress?: string
        companyName: string
        companyAddress?: string
        scope?: string
        startDate?: string
        endDate?: string
        contractValue: number
        installments: Array<{ name: string; amount: number; dueDate?: string }>
        terms?: string
    }
): string {
    const installmentRows = data.installments.map((inst, i) => `
                                    < tr style = "${i % 2 === 0 ? 'background: #f9fafb;' : ''}" >
                                        <td style="padding: 10px 8px;" > ${i + 1} </td>
                                            < td style = "padding: 10px 8px;" > ${inst.name} </td>
                                                < td style = "padding: 10px 8px; text-align: right;" >฿${inst.amount.toLocaleString()} </td>
                                                    < td style = "padding: 10px 8px; text-align: center;" > ${inst.dueDate || '-'} </td>
                                                        </tr>
                                                            `).join('')

    return `
                                                        < div style = "max-width: 800px; margin: 0 auto; padding: 30px; font-family: 'Sarabun', sans-serif;" >
                                                            <div style="text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 24px;" >
                                                                <h1 style="margin: 0; font-size: 24px; color: #1e3a5f;" > สัญญาจ้าง </h1>
                                                                    < p style = "margin: 8px 0 0 0; font-size: 14px; color: #666;" > เลขที่: ${data.contractNumber} </p>
                                                                        < p style = "margin: 4px 0 0 0; font-size: 12px; color: #888;" > วันที่: ${new Date(data.date).toLocaleDateString('th-TH')} </p>
                                                                            </div>

                                                                            < div style = "display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;" >
                                                                                <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;" >
                                                                                    <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;" > ผู้ว่าจ้าง </p>
                                                                                        < p style = "margin: 8px 0 0 0; font-weight: bold; color: #1e293b;" > ${data.companyName} </p>
                    ${data.companyAddress ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${data.companyAddress}</p>` : ''}
</div>
    < div style = "background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;" >
        <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;" > ผู้รับจ้าง </p>
            < p style = "margin: 8px 0 0 0; font-weight: bold; color: #1e293b;" > ${data.workerName} </p>
                    ${data.workerAddress ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${data.workerAddress}</p>` : ''}
</div>
    </div>

    < div style = "background: #eff6ff; border-radius: 12px; padding: 16px; border: 1px solid #bfdbfe; margin-bottom: 24px;" >
        <p style="margin: 0; font-size: 11px; color: #3b82f6; text-transform: uppercase;" > โครงการ </p>
            < p style = "margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #1e40af;" > ${data.projectName} </p>
                ${data.scope ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #1e3a8a;">${data.scope}</p>` : ''}
                ${data.startDate && data.endDate ? `
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">
                        ระยะเวลา: ${new Date(data.startDate).toLocaleDateString('th-TH')} - ${new Date(data.endDate).toLocaleDateString('th-TH')}
                    </p>
                ` : ''
        }
</div>

    < div style = "margin-bottom: 24px;" >
        <h2 style="font-size: 14px; margin: 0 0 12px 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;" > งวดการชำระเงิน </h2>
            < table style = "width: 100%; border-collapse: collapse; font-size: 13px;" >
                <thead>
                <tr style="background: #1e3a5f; color: white;" >
                    <th style="padding: 10px 8px; text-align: left; width: 60px;" > งวดที่ </th>
                        < th style = "padding: 10px 8px; text-align: left;" > รายละเอียด </th>
                            < th style = "padding: 10px 8px; text-align: right;" > จำนวนเงิน </th>
                                < th style = "padding: 10px 8px; text-align: center;" > กำหนดชำระ </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                        ${installmentRows}
</tbody>
    < tfoot >
    <tr style="background: #1e3a5f; color: white; font-weight: bold;" >
        <td colspan="2" style = "padding: 12px 8px;" > รวมทั้งสิ้น </td>
            < td style = "padding: 12px 8px; text-align: right; font-size: 16px;" >฿${data.contractValue.toLocaleString()} </td>
                < td > </td>
                </tr>
                </tfoot>
                </table>
                </div>

            ${data.terms ? `
                <div style="margin-bottom: 24px;">
                    <h2 style="font-size: 14px; margin: 0 0 12px 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">เงื่อนไขและข้อตกลง</h2>
                    <div style="font-size: 12px; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${data.terms}</div>
                </div>
            ` : ''
        }

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px;" >
    <div style="text-align: center;" >
        <div style="border-bottom: 1px solid #cbd5e1; width: 100%; margin-bottom: 8px; height: 60px;" > </div>
            < p style = "margin: 0; font-size: 12px; color: #64748b;" > ลายเซ็นผู้ว่าจ้าง </p>
                < p style = "margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;" > วันที่: ______ / ______ / ______ </p>
                    </div>
                    < div style = "text-align: center;" >
                        <div style="border-bottom: 1px solid #cbd5e1; width: 100%; margin-bottom: 8px; height: 60px;" > </div>
                            < p style = "margin: 0; font-size: 12px; color: #64748b;" > ลายเซ็นผู้รับจ้าง </p>
                                < p style = "margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;" > วันที่: ______ / ______ / ______ </p>
                                    </div>
                                    </div>
                                    </div>
                                        `
}
