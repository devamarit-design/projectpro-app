
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Expense } from '@/context/project-context';
import { THAI_FONT_FAMILY, registerThaiFonts } from '@/lib/pdf-fonts';

// Register fonts (ensure it runs once)
registerThaiFonts();

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: THAI_FONT_FAMILY,
    },
    header: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    subheader: {
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
        color: '#666666',
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0',
    },
    tableCol: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCellHeader: {
        margin: 5,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableCell: {
        margin: 5,
        fontSize: 10,
    },
    imageContainer: {
        marginTop: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    receiptImage: {
        width: 200,
        height: 300,
        objectFit: 'contain',
        marginBottom: 5,
    },
    imageLabel: {
        fontSize: 10,
        color: '#666666',
    },
    totalRow: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderTopWidth: 2,
        borderColor: '#000',
    },
    totalLabel: {
        width: '85%', // Span most columns
        padding: 5,
        textAlign: 'right',
        fontSize: 12,
        fontWeight: 'bold',
    },
    totalAmount: {
        width: '15%',
        padding: 5,
        textAlign: 'right',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

interface ExpensesPDFProps {
    expenses: Expense[];
    title?: string;
    showImages?: boolean;
}

export const ExpensesPDF: React.FC<ExpensesPDFProps> = ({ expenses, title = "Expense Report", showImages = false }) => {
    const totalAmount = expenses.reduce((sum, e) => sum + (e.status !== 'Unpaid' ? e.totalValue : 0), 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>{title}</Text>
                <Text style={styles.subheader}>Generated on {new Date().toLocaleDateString('th-TH')}</Text>

                {/* Table Header */}
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={{ ...styles.tableColHeader, width: '15%' }}>
                            <Text style={styles.tableCellHeader}>Date</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, width: '35%' }}>
                            <Text style={styles.tableCellHeader}>Description</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, width: '15%' }}>
                            <Text style={styles.tableCellHeader}>Category</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, width: '20%' }}>
                            <Text style={styles.tableCellHeader}>Payee</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, width: '15%' }}>
                            <Text style={styles.tableCellHeader}>Amount</Text>
                        </View>
                    </View>

                    {/* Table Body */}
                    {expenses.map((expense) => (
                        <View style={styles.tableRow} key={expense.id}>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={styles.tableCell}>{expense.date}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '35%' }}>
                                <Text style={styles.tableCell}>{expense.title}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={styles.tableCell}>{expense.category}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '20%' }}>
                                <Text style={styles.tableCell}>{expense.payee}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={styles.tableCell}>{expense.totalValue.toLocaleString()}</Text>
                            </View>
                        </View>
                    ))}

                    {/* Total Row */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Grand Total:</Text>
                        <Text style={styles.totalAmount}>{totalAmount.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Receipt Images Section */}
                {showImages && (
                    <View break>
                        <Text style={{ ...styles.header, fontSize: 18, marginTop: 20 }}>Receipt Images</Text>
                        {expenses.filter(e => e.receiptImage || e.thumbnailUrl).map((expense, index) => (
                            <View key={expense.id} style={styles.imageContainer} break={index > 0 && index % 2 === 0}>
                                <Text style={{ ...styles.subheader, textAlign: 'left', alignSelf: 'flex-start', marginLeft: '10%' }}>
                                    {index + 1}. {expense.title} ({expense.date}) - {expense.totalValue.toLocaleString()}
                                </Text>
                                {/* Use proxy or direct URL depending on CORS setup. Direct URL usually fine if Firebase allow cors */}
                                <Image
                                    style={styles.receiptImage}
                                    src={expense.receiptImage || expense.thumbnailUrl || ""}
                                />
                            </View>
                        ))}
                    </View>
                )}
            </Page>
        </Document>
    );
};
