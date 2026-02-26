
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { IncomeDocument, Customer, Project } from '@/context/project-context';
import { THAI_FONT_FAMILY, registerThaiFonts } from '@/lib/pdf-fonts';

// Register fonts
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
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0',
    },
    tableCol: {
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
    totalRow: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderTopWidth: 2,
        borderColor: '#000',
    },
    totalLabel: {
        width: '80%',
        padding: 5,
        textAlign: 'right',
        fontSize: 12,
        fontWeight: 'bold',
    },
    totalAmount: {
        width: '20%',
        padding: 5,
        textAlign: 'right',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

interface IncomePDFProps {
    incomes: IncomeDocument[];
    title?: string;
    customers: Customer[];
    projects: Project[];
}

export const IncomePDF: React.FC<IncomePDFProps> = ({ incomes, title = "Income Report", customers, projects }) => {
    const totalAmount = incomes.reduce((sum, doc) => sum + (doc.status !== 'Cancelled' as any ? doc.grandTotal : 0), 0);

    const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || "Unknown";
    const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || "General";

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
                        <View style={{ ...styles.tableColHeader, width: '20%' }}>
                            <Text style={styles.tableCellHeader}>Doc No.</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, width: '15%' }}>
                            <Text style={styles.tableCellHeader}>Type</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, width: '20%' }}>
                            <Text style={styles.tableCellHeader}>Customer</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, width: '15%' }}>
                            <Text style={styles.tableCellHeader}>Status</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, width: '15%' }}>
                            <Text style={styles.tableCellHeader}>Total</Text>
                        </View>
                    </View>

                    {/* Table Body */}
                    {incomes.map((doc) => (
                        <View style={styles.tableRow} key={doc.id}>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={styles.tableCell}>{doc.date}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '20%' }}>
                                <Text style={styles.tableCell}>{doc.documentNumber}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={styles.tableCell}>{doc.type}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '20%' }}>
                                <Text style={styles.tableCell}>{getCustomerName(doc.customerId)}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={styles.tableCell}>{doc.status}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={styles.tableCell}>{doc.grandTotal.toLocaleString()}</Text>
                            </View>
                        </View>
                    ))}

                    {/* Total Row */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Grand Total:</Text>
                        <Text style={styles.totalAmount}>{totalAmount.toLocaleString()}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
