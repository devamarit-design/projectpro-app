"use client"

import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import type { Project, Expense, IncomeDocument, CompanyProfile } from '@/context/project-context'

// Register fonts if needed, otherwise fallback to Helvetica
// Font.register({ family: 'ThaiSans', src: '...' }) 

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
        color: '#666666',
        marginTop: 4
    },
    sectionTitle: {
        fontSize: 14,
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
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 4
    },
    summaryValue: {
        fontSize: 16,
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
    textSmall: { fontSize: 8, color: '#6b7280' },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
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
    // Use 'code' to display THB instead of symbol ฿ to avoid font glyph issues in PDF
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', currencyDisplay: 'code' }).format(amount)
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH')
}

// Logic: Parse "฿1,000" strings to number if needed, or stick to provided numbers
const parseAmount = (str: string | number | undefined) => {
    if (typeof str === 'number') return str
    if (!str) return 0
    return parseFloat(str.replace(/[^0-9.-]+/g, ""))
}

export const DashboardReportPDF = ({ projects, incomes, expenses, companyProfile, dateRange }: DashboardReportProps) => {

    // 1. Calculate Summary
    // Revenue: Sum of all Invoices (Assuming 'Invoice' type is key)
    // Note: ProjectContext uses string for Project.income, but let's use the IncomeDocument source for accuracy?
    // Actually, let's use standard Incomes where status is VALID
    const validIncomes = incomes.filter(i => (i.type === 'Invoice' || i.type === 'Receipt') && i.status !== 'Void' && i.status !== 'Draft')
    const totalRevenue = validIncomes.reduce((sum, item) => sum + item.grandTotal, 0)

    // Expenses: Sum of all Expenses where status is not 'Unpaid' or just all?
    // Let's use all recorded expenses
    const totalExpenses = expenses.reduce((sum, item) => sum + item.totalValue, 0)

    const netProfit = totalRevenue - totalExpenses

    const activeProjects = projects.filter(p => p.status === 'In Progress').length

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Company Performance Report</Text>
                        <Text style={styles.subtitle}>{dateRange || `Generated on ${new Date().toLocaleDateString()}`}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{companyProfile?.name || 'My Company'}</Text>
                        <Text style={styles.subtitle}>{companyProfile?.taxId ? `Tax ID: ${companyProfile.taxId}` : ''}</Text>
                    </View>
                </View>

                {/* Executive Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Revenue</Text>
                        <Text style={[styles.summaryValue, { color: '#10b981' }]}>{formatCurrency(totalRevenue)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Expenses</Text>
                        <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{formatCurrency(totalExpenses)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Net Profit</Text>
                        <Text style={[styles.summaryValue, { color: netProfit >= 0 ? '#3b82f6' : '#ef4444' }]}>
                            {formatCurrency(netProfit)}
                        </Text>
                    </View>
                </View>

                {/* Active Projects */}
                <Text style={styles.sectionTitle}>Active Projects ({activeProjects})</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, styles.textSmall, styles.textBold]}>PROJECT NAME</Text>
                        <Text style={[styles.col2, styles.textSmall, styles.textBold]}>CUSTOMER</Text>
                        <Text style={[styles.col3, styles.textSmall, styles.textBold]}>PROGRESS</Text>
                        <Text style={[styles.col4, styles.textSmall, styles.textBold]}>STATUS</Text>
                    </View>
                    {projects.slice(0, 10).map((project, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.col1}>{project.name}</Text>
                            <Text style={styles.col2}>{project.customer}</Text>
                            <Text style={styles.col3}>{project.progress}%</Text>
                            <Text style={styles.col4}>{project.status}</Text>
                        </View>
                    ))}
                    {projects.length === 0 && <Text style={{ padding: 10, textAlign: 'center', color: '#6b7280' }}>No projects found</Text>}
                </View>

                {/* Recent Incomes */}
                <Text style={styles.sectionTitle}>Recent Incomes</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, styles.textSmall, styles.textBold]}>DOCUMENT (เอกสาร)</Text>
                        <Text style={[styles.col2, styles.textSmall, styles.textBold]}>DATE (วันที่)</Text>
                        <Text style={[styles.col3, styles.textSmall, styles.textBold]}>STATUS (สถานะ)</Text>
                        <Text style={[styles.col4, styles.textSmall, styles.textBold]}>AMOUNT (จำนวนเงิน)</Text>
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
                <Text style={styles.sectionTitle}>Recent Expenses</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, styles.textSmall, styles.textBold]}>DESCRIPTION (รายการ)</Text>
                        <Text style={[styles.col2, styles.textSmall, styles.textBold]}>DATE (วันที่)</Text>
                        <Text style={[styles.col3, styles.textSmall, styles.textBold]}>CATEGORY (หมวดหมู่)</Text>
                        <Text style={[styles.col4, styles.textSmall, styles.textBold]}>AMOUNT (จำนวนเงิน)</Text>
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
                    Generated by ProjectPro • {new Date().toLocaleString()}
                </Text>
            </Page>
        </Document>
    )
}

export async function generateDashboardReport(props: DashboardReportProps) {
    // Generate PDF Blob
    const blob = await pdf(<DashboardReportPDF {...props} />).toBlob()
    const url = URL.createObjectURL(blob)

    // Download logic
    const link = document.createElement('a')
    link.href = url
    link.download = `Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }, 1000)
}
