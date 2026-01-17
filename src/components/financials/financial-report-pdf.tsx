
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'

// Using Helvetica to ensure PDF generation works

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 700,
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 8,
        alignItems: 'center',
    },
    headerRow: {
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 2,
        borderBottomColor: '#eee',
    },
    cell: {
        flex: 1,
        paddingHorizontal: 4,
    },
    cellSmall: {
        width: '10%',
        paddingHorizontal: 4,
    },
    cellMedium: {
        width: '15%',
        paddingHorizontal: 4,
    },
    cellLarge: {
        flex: 2,
        paddingHorizontal: 4,
    },
    textBold: {
        fontWeight: 700,
    },
    totalRow: {
        flexDirection: 'row',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#eee',
        justifyContent: 'flex-end',
    },
})

interface FinancialReportProps {
    type: 'Expense' | 'Income'
    projectName: string
    items: any[]
}

export const FinancialReportPDF = ({ type, projectName, items }: FinancialReportProps) => {
    const totalAmount = items.reduce((sum, item) => {
        // Handle varying amount fields if necessary (Expenses usually .amount or .totalValue, Incomes .grandTotal)
        const val = type === 'Expense' ? (item.totalValue || parseFloat(item.amount?.replace(/[^\d.-]/g, '') || '0')) : (item.grandTotal || 0)
        return sum + val
    }, 0)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{type} Report</Text>
                        <Text style={styles.subtitle}>{projectName}</Text>
                    </View>
                    <View>
                        <Text style={styles.subtitle}>Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                        <Text style={styles.subtitle}>{items.length} Items</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={[styles.row, styles.headerRow]}>
                        <Text style={[styles.cellMedium, styles.textBold]}>Date</Text>
                        <Text style={[styles.cellMedium, styles.textBold]}>{type === 'Expense' ? 'Category' : 'Doc No'}</Text>
                        <Text style={[styles.cellLarge, styles.textBold]}>{type === 'Expense' ? 'Description' : 'Customer'}</Text>
                        <Text style={[styles.cellMedium, styles.textBold]}>Status</Text>
                        <Text style={[styles.cellMedium, styles.textBold, { textAlign: 'right' }]}>Amount</Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={index} style={styles.row}>
                            <Text style={styles.cellMedium}>{item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}</Text>
                            <Text style={styles.cellMedium}>
                                {type === 'Expense' ? item.category : item.documentNumber}
                            </Text>
                            <Text style={styles.cellLarge}>
                                {type === 'Expense' ? item.title : (item.customerName || 'Unknown')}
                            </Text>
                            <Text style={styles.cellMedium}>{item.status}</Text>
                            <Text style={[styles.cellMedium, { textAlign: 'right' }]}>
                                {type === 'Expense'
                                    ? (item.amount || item.totalValue?.toLocaleString())
                                    : item.grandTotal?.toLocaleString()}
                            </Text>
                        </View>
                    ))}

                    <View style={styles.totalRow}>
                        <Text style={[styles.textBold, { marginRight: 10 }]}>Total:</Text>
                        <Text style={[styles.textBold, { minWidth: 80, textAlign: 'right' }]}>
                            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
