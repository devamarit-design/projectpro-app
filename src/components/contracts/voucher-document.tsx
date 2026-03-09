
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Contract, Project, Worker } from '@/context/project-context';
import type { OrgProfile } from "@/context/settings-context"

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
        lineHeight: 1.4,
        color: '#000'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    companyInfo: {
        width: '60%'
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4
    },
    companyDetail: {
        fontSize: 10,
        color: '#333'
    },
    docTitleSection: {
        textAlign: 'right',
        width: '40%'
    },
    docTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    docInfo: {
        fontSize: 12
    },
    underline: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 1,
        minWidth: 80,
        textAlign: 'center'
    },
    infoTable: {
        marginBottom: 15
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 5,
        alignItems: 'baseline'
    },
    infoLabel: {
        fontWeight: 'bold',
        width: 100
    },
    infoValue: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderStyle: 'dotted',
        paddingBottom: 1
    },
    table: {
        width: '100%',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#000'
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#000'
    },
    tableCell: {
        padding: 8,
        borderRightWidth: 1,
        borderRightColor: '#000'
    },
    cellIndex: { width: '10%', textAlign: 'center' },
    cellDesc: { width: '50%' },
    cellAmount: { width: '20%', textAlign: 'right' },
    cellNote: { width: '20%', borderRightWidth: 0 },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000'
    },
    totalRow: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#000'
    },
    textAmountRow: {
        flexDirection: 'row'
    },
    summarySection: {
        marginTop: 15,
        width: '100%'
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 5,
        alignItems: 'baseline'
    },
    summaryLabel: {
        fontWeight: 'bold',
        flex: 1
    },
    summaryValue: {
        width: 150,
        textAlign: 'right',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderStyle: 'dotted',
        paddingRight: 10
    },
    summaryUnit: {
        width: 50,
        paddingLeft: 10
    },
    signatureSection: {
        marginTop: 40
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40
    },
    signatureBox: {
        width: '45%',
        alignItems: 'center'
    },
    signatureLine: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 5
    },
    line: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderStyle: 'dotted',
        width: 150,
        marginHorizontal: 5
    }
});

interface VoucherDocumentProps {
    formData: any;
    orgProfile: OrgProfile;
}

export const VoucherDocument = ({ formData, orgProfile }: VoucherDocumentProps) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        {formData.companyLogo && (
                            <Image src={formData.companyLogo} style={{ maxHeight: 60, maxWidth: 150, marginBottom: 5 }} />
                        )}
                        <Text style={styles.companyName}>{formData.companyName}</Text>
                        <Text style={styles.companyDetail}>{formData.companyAddress}</Text>
                        <Text style={styles.companyDetail}>{formData.companyPhone ? `โทร. ${formData.companyPhone}` : ''}</Text>
                    </View>
                    <View style={styles.docTitleSection}>
                        <Text style={styles.docTitle}>ใบสำคัญจ่าย</Text>
                        <Text style={styles.docInfo}>(PAYMENT VOUCHER)</Text>
                        <View style={{ marginTop: 15, gap: 5 }}>
                            <Text style={{ fontSize: 10 }}>เลขที่เอกสาร: {formData.docNumber}</Text>
                            <Text style={{ fontSize: 10 }}>วันที่แจ้งเบิก: {formData.requestDate}</Text>
                            <Text style={{ fontSize: 10 }}>วันที่จ่ายเงิน: {formData.paymentDate || '___/___/___'}</Text>
                        </View>
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoTable}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>ชื่อช่าง/คนทำงาน</Text>
                        <Text style={styles.infoValue}>{formData.workerName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>โครงการ</Text>
                        <Text style={styles.infoValue}>{formData.projectName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>โปรเจคงาน</Text>
                        <Text style={styles.infoValue}>{formData.projectDescription}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCell, styles.cellIndex, { fontWeight: 'bold' }]}>ลำดับ</Text>
                        <Text style={[styles.tableCell, styles.cellDesc, { fontWeight: 'bold' }]}>รายละเอียดการเบิกเงิน</Text>
                        <Text style={[styles.tableCell, styles.cellAmount, { fontWeight: 'bold' }]}>จำนวนเงิน</Text>
                        <Text style={[styles.tableCell, styles.cellNote, { fontWeight: 'bold' }]}>หมายเหตุ</Text>
                    </View>

                    {formData.items.map((item: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.cellIndex]}>{i + 1}</Text>
                            <Text style={[styles.tableCell, styles.cellDesc]}>{item.description}</Text>
                            <Text style={[styles.tableCell, styles.cellAmount]}>{item.amount.toLocaleString()}</Text>
                            <Text style={[styles.tableCell, styles.cellNote]}>{item.notes}</Text>
                        </View>
                    ))}

                    {/* Empty rows to fill space */}
                    {Array(Math.max(0, 5 - formData.items.length)).fill(0).map((_, i) => (
                        <View key={`empty-${i}`} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.cellIndex]}>{formData.items.length + i + 1}</Text>
                            <Text style={[styles.tableCell, styles.cellDesc]}></Text>
                            <Text style={[styles.tableCell, styles.cellAmount]}></Text>
                            <Text style={[styles.tableCell, styles.cellNote]}></Text>
                        </View>
                    ))}

                    <View style={styles.totalRow}>
                        <Text style={[styles.tableCell, { width: '60%', textAlign: 'right', fontWeight: 'bold' }]}>รวมเป็นเงินทั้งสิ้น</Text>
                        <Text style={[styles.tableCell, styles.cellAmount, { fontWeight: 'bold' }]}>{formData.totalAmount.toLocaleString()}</Text>
                        <Text style={[styles.tableCell, styles.cellNote]}></Text>
                    </View>

                    <View style={styles.textAmountRow}>
                        <Text style={[styles.tableCell, { width: '60%', textAlign: 'right', fontSize: 10 }]}>ยอดเงินตัวหนังสือ</Text>
                        <Text style={[styles.tableCell, { width: '40%', fontWeight: 'bold', fontSize: 10 }]}>{formData.totalAmountText}</Text>
                    </View>
                </View>

                {/* Summary */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>ยอดรวมค่าแรงทั้งหมด</Text>
                        <Text style={styles.summaryValue}>{formData.totalContractAmount.toLocaleString()}</Text>
                        <Text style={styles.summaryUnit}>บาท</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={{ fontWeight: 'bold' }}>โอนจ่ายค่าแรงในงวดที่</Text>
                            <Text style={{ borderBottomWidth: 1, borderBottomColor: '#000', borderStyle: 'dotted', minWidth: 40, textAlign: 'center', marginHorizontal: 5 }}>{formData.installmentNumber}</Text>
                            <Text style={{ fontWeight: 'bold' }}>เป็นจำนวน</Text>
                        </View>
                        <Text style={[styles.summaryValue, { fontWeight: 'bold' }]}>{formData.installmentAmount.toLocaleString()}</Text>
                        <Text style={styles.summaryUnit}>บาท</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>คงเหลือค่าแรงโอนจ่ายในครั้งถัดไป</Text>
                        <Text style={styles.summaryValue}>{formData.remainingAmount.toLocaleString()}</Text>
                        <Text style={styles.summaryUnit}>บาท</Text>
                    </View>
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureRow}>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine}>
                                <Text>ลงชื่อ</Text>
                                <View style={styles.line} />
                                <Text>{formData.signatures.requester.label}</Text>
                            </View>
                            <Text style={{ fontSize: 10 }}>({formData.signatures.requester.name || '..............................'})</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine}>
                                <Text>ลงชื่อ</Text>
                                <View style={styles.line} />
                                <Text>{formData.signatures.inspector.label}</Text>
                            </View>
                            <Text style={{ fontSize: 10 }}>({formData.signatures.inspector.name || '..............................'})</Text>
                        </View>
                    </View>
                    <View style={styles.signatureRow}>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine}>
                                <Text>ลงชื่อ</Text>
                                <View style={styles.line} />
                                <Text>{formData.signatures.accountant.label}</Text>
                            </View>
                            <Text style={{ fontSize: 10 }}>({formData.signatures.accountant.name || '..............................'})</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine}>
                                <Text>ลงชื่อ</Text>
                                <View style={styles.line} />
                                <Text>{formData.signatures.payer.label}</Text>
                            </View>
                            <Text style={{ fontSize: 10 }}>({formData.signatures.payer.name || '..............................'})</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
