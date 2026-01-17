'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { IncomeDocument, IncomeSection, IncomeItem, Customer, Project } from '@/context/project-context'
import type { OrgProfile } from "@/context/settings-context"
import { flattenDocumentItems, paginateItems } from '@/lib/pagination-utils'

// Using Helvetica to ensure PDF generation works
// Thai text will show as placeholders

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#ffffff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3b82f6'
    },
    subtitle: {
        fontSize: 10,
        color: '#666666'
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    infoBox: {
        width: '48%'
    },
    infoLabel: {
        fontSize: 8,
        color: '#888888',
        marginBottom: 2
    },
    infoValue: {
        fontSize: 10,
        marginBottom: 4
    },
    table: {
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#3b82f6',
        padding: 8,
        color: '#ffffff'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
        padding: 8
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
        padding: 8,
        backgroundColor: '#f9f9f9'
    },
    colNo: { width: '8%' },
    colDesc: { width: '42%' },
    colQty: { width: '12%', textAlign: 'right' },
    colUnit: { width: '10%', textAlign: 'center' },
    colPrice: { width: '14%', textAlign: 'right' },
    colTotal: { width: '14%', textAlign: 'right' },
    totalsSection: {
        marginTop: 20,
        alignItems: 'flex-end'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 4
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        marginRight: 10
    },
    totalValue: {
        width: 100,
        textAlign: 'right'
    },
    grandTotal: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 8,
        borderTopWidth: 2,
        borderTopColor: '#3b82f6',
        marginTop: 4
    },
    grandTotalLabel: {
        width: 100,
        textAlign: 'right',
        marginRight: 10,
        fontWeight: 'bold',
        fontSize: 12
    },
    grandTotalValue: {
        width: 100,
        textAlign: 'right',
        fontWeight: 'bold',
        fontSize: 12,
        color: '#3b82f6'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#999999'
    },
    pageNumber: {
        position: 'absolute',
        bottom: 30,
        right: 40,
        fontSize: 8,
        color: '#999999'
    }
})

interface PDFDocumentProps {
    document: IncomeDocument
    customer?: Customer
    project?: Project
    themeColor?: string
    lang?: 'th' | 'en'
    manualPageBreaks?: number[]
    columns?: { id: string, label: string, visible: boolean, order: number }[]
    orgProfile?: OrgProfile
}

// Helper to ensure color is valid hex
const safeColor = (color: string | undefined): string => {
    if (!color) return '#3b82f6'
    // Basic hex check
    if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) return color
    return '#3b82f6' // Fallback
}

const LABELS = {
    th: {
        quotation: 'ใบเสนอราคา',
        invoice: 'ใบวางบิล',
        receipt: 'ใบเสร็จรับเงิน',
        no: 'ลำดับ',
        description: 'รายการ',
        qty: 'จำนวน',
        unit: 'หน่วย',
        unitPrice: 'ราคา/หน่วย',
        amount: 'จำนวนเงิน',
        subtotal: 'รวม',
        vat: 'ภาษี 7%',
        grandTotal: 'รวมทั้งสิ้น',
        date: 'วันที่',
        dueDate: 'ครบกำหนด',
        customer: 'ลูกค้า',
        project: 'โครงการ',
        docNo: 'เลขที่เอกสาร',
        cont: 'ต่อ'
    },
    en: {
        quotation: 'QUOTATION',
        invoice: 'INVOICE',
        receipt: 'RECEIPT',
        no: 'No.',
        description: 'Description',
        qty: 'Qty',
        unit: 'Unit',
        unitPrice: 'Unit Price',
        amount: 'Amount',
        subtotal: 'Subtotal',
        vat: 'VAT 7%',
        grandTotal: 'Grand Total',
        date: 'Date',
        dueDate: 'Due Date',
        customer: 'Customer',
        project: 'Project',
        docNo: 'Doc No.',
        cont: 'Cont.'
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const PDFDocument = ({ document: doc, customer, project, themeColor = '#3b82f6', lang = 'th', manualPageBreaks = [], columns, orgProfile }: PDFDocumentProps) => {
    const labels = LABELS[lang]
    // Map document type to label key safely
    const docTypeLower = doc.type.toLowerCase() as keyof typeof labels
    const docTitle = labels[docTypeLower] || doc.type.toUpperCase()

    const subtotal = doc.subtotal
    const vat = doc.tax
    const grandTotal = doc.grandTotal

    // Use Shared Pagination Logic
    const flatItems = flattenDocumentItems(doc)
    const pages = paginateItems(flatItems, manualPageBreaks, {
        itemsPerPage: 18, // Matches previous ITEMS_PER_PAGE in PDF
        itemsFirstPage: 12 // Matches previous ITEMS_FIRST_PAGE in PDF
    })

    const finalThemeColor = safeColor(themeColor)

    // Dynamically set theme color in header
    const dynamicStyles = StyleSheet.create({
        headerBorder: { borderBottomColor: finalThemeColor },
        title: { color: finalThemeColor },
        tableHeader: { backgroundColor: finalThemeColor },
        grandTotalBorder: { borderTopColor: finalThemeColor },
        grandTotalValue: { color: finalThemeColor }
    })

    // Default columns if not provided
    const visibleColumns = columns?.filter(c => c.visible).sort((a, b) => a.order - b.order) || [
        { id: "item", label: labels.no, visible: true, order: 1 },
        { id: "description", label: labels.description, visible: true, order: 2 },
        { id: "qty", label: labels.qty, visible: true, order: 3 },
        { id: "unit", label: labels.unit, visible: true, order: 4 },
        { id: "price", label: labels.unitPrice, visible: true, order: 5 },
        { id: "total", label: labels.amount, visible: true, order: 6 },
    ]

    return (
        <Document>
            {pages.map((page, pageIdx) => {
                return (
                    <Page key={pageIdx} size="A4" style={styles.page}>
                        {/* Header - full on first page, minimal on others */}
                        {page.isFirst ? (
                            <>
                                <View style={[styles.header, dynamicStyles.headerBorder]}>
                                    <View>
                                        <Text style={[styles.title, dynamicStyles.title]}>{docTitle}</Text>
                                        {orgProfile && <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{orgProfile.name}</Text>}
                                        {orgProfile && <Text style={styles.subtitle}>{orgProfile.address}</Text>}

                                        <Text style={[styles.subtitle, { marginTop: 4 }]}>{doc.documentNumber}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {orgProfile?.logo && (
                                            /* Note: Image rendering requires buffer/url, skipping for complex implementation now */
                                            <Text></Text>
                                        )}
                                        <Text style={styles.infoLabel}>{labels.date}</Text>
                                        <Text style={styles.infoValue}>{formatDate(doc.date)}</Text>
                                        {doc.validUntil && (
                                            <>
                                                <Text style={styles.infoLabel}>{labels.dueDate}</Text>
                                                <Text style={styles.infoValue}>{formatDate(doc.validUntil)}</Text>
                                            </>
                                        )}
                                        {orgProfile && <Text style={styles.infoLabel}>Tax ID: {orgProfile.taxId}</Text>}
                                    </View>
                                </View>

                                {/* Info Section */}
                                <View style={styles.infoSection}>
                                    <View style={styles.infoBox}>
                                        <Text style={styles.infoLabel}>{labels.customer}</Text>
                                        <Text style={styles.infoValue}>{customer?.name || '-'}</Text>
                                        {customer?.address && <Text style={styles.infoValue}>{customer.address}</Text>}
                                        {customer?.phone && <Text style={styles.infoValue}>{customer.phone}</Text>}
                                    </View>
                                    <View style={styles.infoBox}>
                                        <Text style={styles.infoLabel}>{labels.project}</Text>
                                        <Text style={styles.infoValue}>{project?.name || '-'}</Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eeeeee' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eeeeee' }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{docTitle} ({labels.cont})</Text>
                                    <Text style={{ fontSize: 10, color: '#666666' }}>{doc.documentNumber}</Text>
                                </View>
                                <Text style={{ fontSize: 10, color: '#666666' }}>{doc.documentNumber}</Text>
                            </View>
                        )}

                        {/* Items Table */}
                        <View style={styles.table}>
                            <View style={[styles.tableHeader, dynamicStyles.tableHeader]}>
                                {visibleColumns.map(col => {
                                    /* Map prop column style to PDF styles */
                                    let style = styles.colDesc
                                    if (col.id === 'item') style = styles.colNo
                                    if (col.id === 'qty') style = styles.colQty
                                    if (col.id === 'unit') style = styles.colUnit
                                    if (col.id === 'price') style = styles.colPrice
                                    if (col.id === 'total') style = styles.colTotal

                                    return <Text key={col.id} style={style}>{col.label}</Text>
                                })}
                            </View>
                            {page.items.map((item: any, index) => (
                                <View key={index} style={(item.originalIndex + 1) % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                    {visibleColumns.map(col => {
                                        if (col.id === 'item') return <Text key={col.id} style={styles.colNo}>{item.originalIndex + 1}</Text>
                                        if (col.id === 'description') return (
                                            <View key={col.id} style={styles.colDesc}>
                                                <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                                                {item.description && <Text style={{ color: '#666666', fontSize: 8 }}>{item.description}</Text>}
                                            </View>
                                        )
                                        if (col.id === 'qty') return <Text key={col.id} style={styles.colQty}>{item.quantity}</Text>
                                        if (col.id === 'unit') return <Text key={col.id} style={styles.colUnit}>{item.unit}</Text>
                                        if (col.id === 'price') return <Text key={col.id} style={styles.colPrice}>{item.unitPrice ? formatCurrency(item.unitPrice) : '-'}</Text>
                                        if (col.id === 'total') return <Text key={col.id} style={styles.colTotal}>{item.total ? formatCurrency(item.total) : '-'}</Text>
                                        return null
                                    })}
                                </View>
                            ))}
                        </View>

                        {/* Totals - only on last page */}
                        {page.isLast && (
                            <View style={styles.totalsSection}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>{labels.subtotal}</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                                </View>
                                {vat > 0 && (
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>{labels.vat}</Text>
                                        <Text style={styles.totalValue}>{formatCurrency(vat)}</Text>
                                    </View>
                                )}
                                <View style={[styles.grandTotal, dynamicStyles.grandTotalBorder]}>
                                    <Text style={styles.grandTotalLabel}>{labels.grandTotal}</Text>
                                    <Text style={[styles.grandTotalValue, dynamicStyles.grandTotalValue]}>{formatCurrency(grandTotal)}</Text>
                                </View>
                            </View>
                        )}

                        {/* Page Number */}
                        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
                    </Page>
                )
            })}
        </Document>
    )
}

// Export function to generate and download PDF
export async function generatePDF(props: PDFDocumentProps): Promise<void> {
    try {
        console.log('generatePDF: Starting...')
        const blob = await pdf(<PDFDocument {...props} />).toBlob()
        console.log('generatePDF: Blob created', blob.size)

        // Generate a clean filename
        const docType = props.document.type || 'Document'
        const docNum = props.document.documentNumber || 'Unknown'
        const filename = `${docType}_${docNum}.pdf`
        console.log('generatePDF: Filename:', filename)

        // Create object URL
        const url = URL.createObjectURL(blob)

        // Check if this is a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

        if (isMobile) {
            // On mobile, open in new window/tab - this is most reliable
            console.log('generatePDF: Mobile detected, opening in new window')
            const newWindow = window.open(url, '_blank')
            if (!newWindow) {
                // Popup blocked, try direct navigation
                window.location.href = url
            }
            // Don't revoke immediately for mobile
            setTimeout(() => {
                URL.revokeObjectURL(url)
            }, 60000) // Keep URL valid for 1 minute
        } else {
            // Desktop - use anchor download
            console.log('generatePDF: Desktop, using anchor download')
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                console.log('generatePDF: Download complete')
            }, 1000)
        }

    } catch (error) {
        console.error('generatePDF: Critical error', error)
        alert('PDF generation failed. Please try again.')
        throw error
    }
}
