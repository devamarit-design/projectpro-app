'use client'

import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer'
import type { IncomeDocument, IncomeSection, IncomeItem, Customer, Project } from '@/context/project-context'
import type { OrgProfile } from "@/context/settings-context"
import { flattenDocumentItems, paginateItems } from '@/lib/pagination-utils'

import { registerThaiFonts, THAI_FONT_FAMILY } from '@/lib/pdf-fonts'

// Using Standard Thai Font
const FONT_FAMILY = THAI_FONT_FAMILY

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'THSarabunNew',
        fontSize: 14, // Increased from 10 because Sarabun is smaller
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
    template?: 'modern' | 'classic' | 'minimal'
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
        original: 'ต้นฉบับ',
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
        original: 'Origin',
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

export const PDFDocument = ({ document: doc, customer, project, themeColor = '#3b82f6', lang = 'th', manualPageBreaks = [], columns, orgProfile, template = 'modern' }: PDFDocumentProps) => {
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
        itemsPerPage: 18,
        itemsFirstPage: 12
    })

    const finalThemeColor = safeColor(themeColor)

    // Template Flags
    const isClassic = template === 'classic'
    const isMinimal = template === 'minimal'
    const isModern = template === 'modern' // default or explicit

    // Helper for conditional styles
    const getHeaderStyle = () => {
        const base = {
            flexDirection: 'row' as const,
            justifyContent: 'space-between' as const,
            marginBottom: 20,
            paddingBottom: 10,
        }
        if (isClassic) {
            return {
                ...base,
                flexDirection: 'row-reverse' as const,
                borderBottomWidth: 2,
                borderBottomColor: '#333333'
            }
        }
        return base
    }

    const getTitleStyle = () => {
        const base = styles.title
        if (isClassic) {
            return [base, { color: '#000000', textAlign: 'left' as const }]
        }
        return [base, { color: finalThemeColor, textAlign: 'right' as const }]
    }

    const getTableHeaderStyle = () => {
        const base = {
            flexDirection: 'row' as const,
            padding: 8,
            borderBottomWidth: 1,
            borderBottomColor: isClassic ? '#000000' : '#e5e7eb',
            backgroundColor: 'transparent',
            color: '#000000'
        }

        if (isClassic) {
            base.backgroundColor = '#f3f4f6'
        } else if (isModern) {
            base.color = finalThemeColor
        }

        return base
    }

    // Replace tStyles.infoBox logic logic
    const getInfoBoxStyle = () => {
        const base: any = { width: '48%' }

        if (isClassic) {
            base.padding = 10
            base.borderWidth = 1
            base.borderColor = '#000000'
        } else if (isModern) {
            base.padding = 12
            base.borderWidth = 1
            base.borderColor = '#f3f4f6'
            base.backgroundColor = '#f9fafb'
            base.borderRadius = 4
        }
        // Minimal has no padding/border added
        return base
    }

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
                                <View style={getHeaderStyle()}>
                                    {/* Left Side (Logo + Company) - Or Right if Classic */}
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        {orgProfile?.logo && typeof orgProfile.logo === 'string' && (
                                            /* Image handles generic URLs properly (base64, remote if configured) */
                                            <Image
                                                src={orgProfile.logo}
                                                style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 4 }}
                                            />
                                        )}
                                        <View>
                                            {orgProfile && <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{orgProfile.name}</Text>}
                                            {orgProfile && <Text style={[styles.subtitle, { maxWidth: 250 }]}>{orgProfile.address}</Text>}
                                            {orgProfile && <Text style={styles.infoLabel}>Tax ID: {orgProfile.taxId}</Text>}
                                        </View>
                                    </View>

                                    {/* Right Side (Doc Info) */}
                                    <View style={{ alignItems: isClassic ? 'flex-start' : 'flex-end' }}>
                                        <Text style={getTitleStyle()}>{docTitle}</Text>
                                        <Text style={[styles.subtitle, { marginTop: 4 }]}>{labels.original}</Text>

                                        <View style={{ marginTop: 8, alignItems: isClassic ? 'flex-start' : 'flex-end' }}>
                                            <Text style={styles.infoValue}><Text style={styles.infoLabel}>{labels.docNo}: </Text>{doc.documentNumber}</Text>
                                            <Text style={styles.infoValue}><Text style={styles.infoLabel}>{labels.date}: </Text>{formatDate(doc.date)}</Text>
                                            {doc.validUntil && (
                                                <Text style={styles.infoValue}><Text style={styles.infoLabel}>{labels.dueDate}: </Text>{formatDate(doc.validUntil)}</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Info Section */}
                                <View style={styles.infoSection}>
                                    <View style={getInfoBoxStyle()}>
                                        <Text style={[styles.infoLabel, { textTransform: 'uppercase' }]}>{labels.customer}</Text>
                                        <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{customer?.name || '-'}</Text>
                                        {customer?.address && <Text style={styles.infoValue}>{customer.address}</Text>}
                                        {customer?.phone && <Text style={styles.infoValue}>{customer.phone}</Text>}
                                        {customer?.taxId && <Text style={styles.infoLabel}>Tax ID: {customer.taxId}</Text>}
                                    </View>
                                    <View style={getInfoBoxStyle()}>
                                        <Text style={[styles.infoLabel, { textTransform: 'uppercase' }]}>{labels.project}</Text>
                                        <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{project?.name || '-'}</Text>
                                        {project?.location && <Text style={styles.infoValue}>{project.location}</Text>}
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eeeeee' }}>
                                <View>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{docTitle} ({labels.cont})</Text>
                                </View>
                                <Text style={{ fontSize: 10, color: '#666666' }}>{doc.documentNumber}</Text>
                            </View>
                        )}

                        {/* Items Table */}
                        <View style={styles.table}>
                            <View style={getTableHeaderStyle()}>
                                {visibleColumns.map(col => {
                                    /* Map prop column style to PDF styles */
                                    let style = styles.colDesc
                                    if (col.id === 'item') style = styles.colNo
                                    if (col.id === 'qty') style = styles.colQty
                                    if (col.id === 'unit') style = styles.colUnit
                                    if (col.id === 'price') style = styles.colPrice
                                    if (col.id === 'total') style = styles.colTotal

                                    return <Text key={col.id} style={[style, { fontWeight: 'bold' }]}>{col.label}</Text>
                                })}
                            </View>
                            {page.items.map((item: any, index) => {
                                // Zone Section Header
                                if (item.type === 'header') {
                                    // Try multiple ways to get the zone name (same as preview)
                                    const zoneName = item.data?.name || item.name || item.description || 'Zone'

                                    return (
                                        <View key={`header-${index}`} style={{ backgroundColor: '#f3f4f6', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 12, color: finalThemeColor }}>{zoneName}</Text>
                                        </View>
                                    )
                                }

                                // Regular Item Row
                                const itemData = item.data || item
                                return (
                                    <View key={index} style={[
                                        (item.originalIndex + 1) % 2 === 0 ? styles.tableRow : styles.tableRowAlt,
                                        isClassic && (item.originalIndex + 1) % 2 !== 0 ? { backgroundColor: '#f9f9f9' } : {},
                                        isModern && (item.originalIndex + 1) % 2 !== 0 ? { backgroundColor: '#ffffff' } : {}
                                    ]}>
                                        {visibleColumns.map(col => {
                                            if (col.id === 'item') return <Text key={col.id} style={styles.colNo}>{item.originalIndex + 1}</Text>
                                            if (col.id === 'description') return (
                                                <View key={col.id} style={styles.colDesc}>
                                                    <Text style={{ fontWeight: 'bold' }}>{itemData.name}</Text>
                                                    {itemData.description && <Text style={{ color: '#666666', fontSize: 10 }}>{itemData.description}</Text>}
                                                </View>
                                            )
                                            if (col.id === 'qty') return <Text key={col.id} style={styles.colQty}>{itemData.quantity}</Text>
                                            if (col.id === 'unit') return <Text key={col.id} style={styles.colUnit}>{itemData.unit}</Text>
                                            if (col.id === 'price') return <Text key={col.id} style={styles.colPrice}>{itemData.unitPrice ? formatCurrency(itemData.unitPrice) : '-'}</Text>
                                            if (col.id === 'total') return <Text key={col.id} style={styles.colTotal}>{itemData.total ? formatCurrency(itemData.total) : '-'}</Text>
                                            return null
                                        })}
                                    </View>
                                )
                            })}
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
                                <View style={[
                                    styles.grandTotal,
                                    isClassic ? { borderTopWidth: 2, borderTopColor: '#000000' } : { borderTopColor: finalThemeColor }
                                ]}>
                                    <Text style={styles.grandTotalLabel}>{labels.grandTotal}</Text>
                                    <Text style={[styles.grandTotalValue, isClassic ? { color: '#000000' } : { color: finalThemeColor }]}>{formatCurrency(grandTotal)}</Text>
                                </View>
                            </View>
                        )}

                        {/* Signature Section */}
                        {page.isLast && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, paddingHorizontal: 20 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', width: 150, height: 30 }} />
                                    <Text style={{ marginTop: 4, fontSize: 10, color: '#888' }}>{labels.customer || 'Customer Signature'}</Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', width: 150, height: 30 }} />
                                    <Text style={{ marginTop: 4, fontSize: 10, color: '#888' }}>Authorized Signature</Text>
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

// Helper to get Blob directly (for Image Export)
export async function generatePDFBlob(props: PDFDocumentProps): Promise<Blob> {
    const fontLoaded = await registerThaiFonts()
    if (!fontLoaded) console.warn('Thai fonts failed to load')
    return await pdf(<PDFDocument {...props} />).toBlob()
}

// Export function to generate and download PDF
export async function generatePDF(props: PDFDocumentProps): Promise<void> {
    try {
        console.log('generatePDF: Starting...')

        // ensure fonts are registered
        const fontLoaded = await registerThaiFonts()
        if (!fontLoaded) {
            console.warn('Thai fonts failed to load, falling back to default')
        }

        const blob = await pdf(<PDFDocument {...props} />).toBlob()
        console.log('generatePDF: Blob created', blob.size)

        // Generate a clean filename - use just the document number as requested
        const docNum = props.document.documentNumber || 'Unknown'
        const filename = `${docNum}.pdf`
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
        alert(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        throw error
    }
}
