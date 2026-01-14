
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Contract, ContractInstallment, Project, Worker, CompanyProfile } from '@/context/project-context';
import type { OrgProfile, DocumentTemplate } from "@/context/settings-context"

// Register Thai font
Font.register({
    family: 'Sarabun',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/@fontsource/sarabun@5.0.8/files/sarabun-thai-400-normal.woff' },
        { src: 'https://cdn.jsdelivr.net/npm/@fontsource/sarabun@5.0.8/files/sarabun-thai-700-normal.woff', fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Sarabun',
        padding: 40,
        fontSize: 12,
        lineHeight: 1.5,
        color: '#333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 20
    },
    logoSection: {
        width: '60%'
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4
    },
    companyAddress: {
        fontSize: 10,
        color: '#666'
    },
    docTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#111',
        textTransform: 'uppercase'
    },
    section: {
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        backgroundColor: '#f5f5f5',
        padding: 5,
        paddingLeft: 10,
        borderRadius: 4
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4
    },
    label: {
        width: 120,
        fontWeight: 'bold',
        color: '#555'
    },
    value: {
        flex: 1
    },
    scopeContainer: {
        marginTop: 5,
        marginBottom: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#eee'
    },
    scopeText: {
        marginBottom: 4
    },
    table: {
        width: '100%',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 4
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 8
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 8
    },
    col1: { width: '40%' },
    col2: { width: '25%', textAlign: 'right' },
    col3: { width: '35%', textAlign: 'right' },

    totalRow: {
        flexDirection: 'row',
        padding: 8,
        backgroundColor: '#f9fafb',
        justifyContent: 'flex-end'
    },

    signatures: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    signBox: {
        width: '40%',
        alignItems: 'center'
    },
    signLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        width: '100%',
        height: 30,
        marginBottom: 5
    },
    signName: {
        fontSize: 10,
        marginTop: 5
    },
    remarks: {
        marginTop: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        borderRadius: 4,
        fontSize: 10,
        color: '#666'
    }
});



interface ContractDocumentProps {
    contract: Contract;
    project?: Project;
    worker?: Worker;
    orgProfile: OrgProfile;
    settings?: DocumentTemplate
}

export const ContractDocument = ({ contract, project, worker, orgProfile, settings }: ContractDocumentProps) => {
    // Format scope text handling newlines
    const scopeLines = contract.scope.split('\n');
    const color = settings?.accentColor || '#111';

    return (
        <Document>
            <Page size="A4" style={[styles.page, { fontFamily: settings?.font === 'Kanit' ? 'Sarabun' : 'Sarabun' }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: color }]}>
                    <View style={styles.logoSection}>
                        <Text style={[styles.companyName, { color: color }]}>{orgProfile.name}</Text>
                        <Text style={styles.companyAddress}>{orgProfile.address}</Text>
                        <Text style={styles.companyAddress}>Tax ID: {orgProfile.taxId} | Tel: {orgProfile.phone}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 10, color: '#aaa' }}>Contract ID: {contract.id}</Text>
                        <Text style={{ fontSize: 10, color: '#aaa' }}>Date: {contract.startDate}</Text>
                    </View>
                </View>

                <Text style={styles.docTitle}>EMPLOYMENT CONTRACT</Text>
                <Text style={{ textAlign: 'center', marginBottom: 20, fontSize: 14 }}>{contract.title}</Text>

                {/* Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contract Parties</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Employer:</Text>
                        <Text style={styles.value}>{orgProfile.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Worker/Contractor:</Text>
                        <Text style={styles.value}>{worker?.name} ({worker?.role})</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Project:</Text>
                        <Text style={styles.value}>{project?.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Duration:</Text>
                        <Text style={styles.value}>{contract.startDate} to {contract.endDate || 'TBD'}</Text>
                    </View>
                </View>

                {/* Scope */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Scope of Work</Text>
                    <View style={styles.scopeContainer}>
                        {scopeLines.map((line, i) => (
                            <Text key={i} style={styles.scopeText}>{line}</Text>
                        ))}
                    </View>
                </View>

                {/* Installments */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Schedule</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.col1, { fontWeight: 'bold' }]}>Description</Text>
                            <Text style={[styles.col2, { fontWeight: 'bold' }]}>Due Date</Text>
                            <Text style={[styles.col3, { fontWeight: 'bold' }]}>Amount</Text>
                        </View>
                        {contract.installments.map((inst, i) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={styles.col1}>{inst.description}</Text>
                                <Text style={styles.col2}>{inst.dueDate}</Text>
                                <Text style={styles.col3}>฿{inst.amount.toLocaleString()}</Text>
                            </View>
                        ))}
                        <View style={styles.totalRow}>
                            <Text style={{ fontWeight: 'bold', marginRight: 10 }}>Total Contract Value:</Text>
                            <Text style={{ fontWeight: 'bold', color: '#000' }}>฿{contract.totalAmount.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Remarks/Notes */}
                {contract.scope.includes("--- หมายเหตุ ---") && (
                    <View style={styles.remarks}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Notes / Conditions:</Text>
                        <Text>{contract.scope.split("--- หมายเหตุ ---")[1]?.trim()}</Text>
                    </View>
                )}

                {/* Signatures */}
                <View style={styles.signatures}>
                    <View style={styles.signBox}>
                        <View style={styles.signLine} />
                        <Text style={styles.signName}>({orgProfile.name})</Text>
                        <Text style={{ fontSize: 9, color: '#888' }}>Employer</Text>
                    </View>
                    <View style={styles.signBox}>
                        <View style={styles.signLine} />
                        <Text style={styles.signName}>({worker?.name})</Text>
                        <Text style={{ fontSize: 9, color: '#888' }}>Contractor / Worker</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
