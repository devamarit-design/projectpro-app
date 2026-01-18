"use client"

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Project, Expense, IncomeDocument, CompanyProfile } from '@/context/project-context'

// Note: Thai font loading is currently disabled due to "Unknown font format" error
// Using Helvetica as fallback. Thai text may not render correctly.

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 12,
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
        fontSize: 12,
        color: '#666666',
        marginTop: 4
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 8,
        color: '#1f2937',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 4
    },
    // Summary Cards
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    summaryCard: {
        width: '32%',
        padding: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 4
    },
    summaryLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 4
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827'
    },
    // Tables
    table: {
        width: '100%',
        marginBottom: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    col1: { width: '40%' },
    col2: { width: '20%' },
    col3: { width: '20%', textAlign: 'right' },
    col4: { width: '20%', textAlign: 'right' },

    textBold: { fontWeight: 'bold' },
    textSmall: { fontSize: 10, color: '#6b7280' },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 10,
        color: '#9ca3af'
    }
})

interface DashboardReportProps {
    projects: Project[]
    incomes: IncomeDocument[]
    expenses: Expense[]
    companyProfile?: CompanyProfile
    dateRange?: string
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH')
}

export const DashboardReportPDF = ({ projects, incomes, expenses, companyProfile, dateRange }: DashboardReportProps) => {

    // 1. Calculate Summary
    const validIncomes = incomes.filter(i => (i.type === 'Invoice' || i.type === 'Receipt') && i.status !== 'Void' && i.status !== 'Draft')
    const totalRevenue = validIncomes.reduce((sum, item) => sum + item.grandTotal, 0)

    const totalExpenses = expenses.reduce((sum, item) => sum + item.totalValue, 0)

    const netProfit = totalRevenue - totalExpenses

    const activeProjects = projects.filter(p => p.status === 'In Progress').length

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>รายงานภาพรวม (Company Report)</Text>
                        <Text style={styles.subtitle}>{dateRange || `สร้างเมื่อ ${new Date().toLocaleDateString('th-TH')}`}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{companyProfile?.name || 'My Company'}</Text>
                        <Text style={styles.subtitle}>{companyProfile?.taxId ? `Tax ID: ${companyProfile.taxId}` : ''}</Text>
                    </View>
                </View>

                {/* Executive Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>รายรับรวม (Total Revenue)</Text>
                        <Text style={[styles.summaryValue, { color: '#10b981' }]}>{formatCurrency(totalRevenue)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>รายจ่ายรวม (Total Expenses)</Text>
                        <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{formatCurrency(totalExpenses)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>กำไรสุทธิ (Net Profit)</Text>
                        <Text style={[styles.summaryValue, { color: netProfit >= 0 ? '#3b82f6' : '#ef4444' }]}>
                            {formatCurrency(netProfit)}
                        </Text>
                    </View>
                </View>

                {/* Active Projects */}
                <Text style={styles.sectionTitle}>โครงการที่ดำเนินการอยู่ ({activeProjects})</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, styles.textSmall, styles.textBold]}>ชื่อโครงการ</Text>
                        <Text style={[styles.col2, styles.textSmall, styles.textBold]}>ลูกค้า</Text>
                        <Text style={[styles.col3, styles.textSmall, styles.textBold]}>ความคืบหน้า</Text>
                        <Text style={[styles.col4, styles.textSmall, styles.textBold]}>สถานะ</Text>
                    </View>
                    {projects.slice(0, 10).map((project, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.col1}>{project.name}</Text>
                            <Text style={styles.col2}>{project.customer}</Text>
                            <Text style={styles.col3}>{project.progress}%</Text>
                            <Text style={styles.col4}>{project.status}</Text>
                        </View>
                    ))}
                    {projects.length === 0 && <Text style={{ padding: 10, textAlign: 'center', color: '#6b7280' }}>ไม่พบโครงการ</Text>}
                </View>

                {/* Recent Incomes */}
                <Text style={styles.sectionTitle}>รายรับล่าสุด</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, styles.textSmall, styles.textBold]}>เอกสาร</Text>
                        <Text style={[styles.col2, styles.textSmall, styles.textBold]}>วันที่</Text>
                        <Text style={[styles.col3, styles.textSmall, styles.textBold]}>สถานะ</Text>
                        <Text style={[styles.col4, styles.textSmall, styles.textBold]}>จำนวนเงิน</Text>
                    </View>
                    {validIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((inc, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.col1}>{inc.documentNumber} ({inc.type})</Text>
                            <Text style={styles.col2}>{formatDate(inc.date)}</Text>
                            <Text style={styles.col3}>{inc.status}</Text>
                            <Text style={styles.col4}>{formatCurrency(inc.grandTotal)}</Text>
                        </View>
                    ))}
                </View>

                {/* Recent Expenses */}
                <Text style={styles.sectionTitle}>รายจ่ายล่าสุด</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, styles.textSmall, styles.textBold]}>รายการ</Text>
                        <Text style={[styles.col2, styles.textSmall, styles.textBold]}>วันที่</Text>
                        <Text style={[styles.col3, styles.textSmall, styles.textBold]}>หมวดหมู่</Text>
                        <Text style={[styles.col4, styles.textSmall, styles.textBold]}>จำนวนเงิน</Text>
                    </View>
                    {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((exp, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.col1}>{exp.title}</Text>
                            <Text style={styles.col2}>{formatDate(exp.date)}</Text>
                            <Text style={styles.col3}>{exp.category}</Text>
                            <Text style={styles.col4}>{formatCurrency(exp.totalValue)}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.footer}>
                    Generated by ProjectPro • {new Date().toLocaleString('th-TH')}
                </Text>
            </Page>
        </Document>
    )
}

export async function generateDashboardReport(props: DashboardReportProps) {
    try {
        // Generate PDF Blob (using Helvetica font for compatibility)
        const blob = await pdf(<DashboardReportPDF {...props} />).toBlob()
        const url = URL.createObjectURL(blob)

        // Download logic
        const link = document.createElement('a')
        link.href = url
        link.download = `Report_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }, 1000)
    } catch (error: any) {
        console.error("Failed to generate PDF:", error)
        alert(`Could not generate report PDF: ${error.message || error}`)
    }
}
