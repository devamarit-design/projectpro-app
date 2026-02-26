"use client"

import * as XLSX from 'xlsx'
import { Project, SubProject, ProjectTask, Expense, IncomeDocument, Customer, User } from '@/context/project-context'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

interface ExportData {
    project: Project
    subProjects: SubProject[]
    tasks: ProjectTask[]
    expenses: Expense[]
    incomeDocuments: IncomeDocument[]
    customers: Customer[]
    users: User[]
}

export function exportProjectToExcel(data: ExportData, locale: string = 'th') {
    const { project, subProjects, tasks, expenses, incomeDocuments, customers, users } = data

    // Create workbook
    const wb = XLSX.utils.book_new()

    // ===== Sheet 1: ภาพรวม (Overview) =====
    const overviewData = [
        ['ข้อมูลโปรเจค', ''],
        ['ชื่อโปรเจค', project.name],
        ['ลูกค้า', project.customer],
        ['สถานที่', project.location],
        ['สถานะ', project.status],
        ['ความคืบหน้า (%)', project.progress],
        ['งบประมาณ', project.budget],
        ['ค่าใช้จ่าย', project.expenses],
        ['รายได้', project.income],
        ['วันเริ่มต้น', project.startDate],
        ['วันสิ้นสุด', project.endDate],
        ['คำอธิบาย', project.description || '-'],
        [''],
        ['สรุป', ''],
        ['จำนวนโปรเจคย่อย', subProjects.length],
        ['จำนวนงาน', tasks.length],
        ['จำนวนรายรับ', incomeDocuments.length],
        ['จำนวนรายจ่าย', expenses.length],
    ]
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)
    wsOverview['!cols'] = [{ wch: 20 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(wb, wsOverview, 'ภาพรวม')

    // ===== Sheet 2: โปรเจคย่อย (Sub-projects) =====
    const subProjectHeaders = ['ชื่อ', 'คำอธิบาย', 'สถานะ', 'งบประมาณ', 'วันเริ่มต้น', 'วันสิ้นสุด']
    const subProjectRows = subProjects.map(sp => [
        sp.name,
        sp.description || '-',
        sp.status,
        sp.budget || '-',
        sp.startDate || '-',
        sp.endDate || '-',
    ])
    const wsSubProjects = XLSX.utils.aoa_to_sheet([subProjectHeaders, ...subProjectRows])
    wsSubProjects['!cols'] = [{ wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsSubProjects, 'โปรเจคย่อย')

    // ===== Sheet 3: รายรับ (Income) =====
    const incomeHeaders = ['เลขที่เอกสาร', 'ประเภท', 'วันที่', 'ลูกค้า', 'ยอดรวม', 'สถานะ']
    const incomeRows = incomeDocuments.map(doc => {
        const customer = customers.find(c => c.id === doc.customerId)
        return [
            doc.documentNumber,
            doc.type,
            doc.date,
            customer?.name || '-',
            doc.grandTotal,
            doc.status,
        ]
    })
    const wsIncome = XLSX.utils.aoa_to_sheet([incomeHeaders, ...incomeRows])
    wsIncome['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsIncome, 'รายรับ')

    // ===== Sheet 4: รายจ่าย (Expenses) =====
    const expenseHeaders = [
        'วัน/เดือน/ปี', 'รับ-จ่าย', 'โปรเจค', 'โปรเจคย่อย', 'รายการ',
        'ราคา', 'ร้านค้า', 'VAT', 'ว่าง', 'จำนวนเงิน', 'เดือน', 'ปี', 'งวด',
        'หมวดหมู่', 'สถานะ', 'ผู้สร้าง'
    ]
    const expenseRows = expenses.map(exp => {
        let dateStr = exp.date
        let monthName = ""
        let yearBE = ""
        let combinedMonthYear = ""

        try {
            const d = new Date(exp.date)
            if (!isNaN(d.getTime())) {
                const day = d.getDate()
                const month = d.getMonth() + 1
                const year = d.getFullYear() + 543
                dateStr = `${day}/${month}/${year}`
                const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
                monthName = thaiMonths[d.getMonth()]
                yearBE = year.toString()
                combinedMonthYear = `${monthName}${yearBE}`
            }
        } catch (err) { }

        const subProjectName = subProjects.find(sp => sp.id === exp.subProjectId)?.name || "-"
        const createdByName = users.find(u => u.id === exp.createdBy)?.name || "Unknown"

        return [
            dateStr,
            'ค่าใช้จ่าย',
            project.name,
            subProjectName,
            exp.title,
            exp.totalValue,
            exp.vendor || exp.payee || '-',
            exp.vatIncluded ? 'Include' : 'Exclude',
            combinedMonthYear,
            -exp.totalValue,
            monthName,
            yearBE,
            '-งวด',
            exp.category,
            exp.status,
            createdByName
        ]
    })
    const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows])
    wsExpenses['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 30 },
        { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 20 }
    ]
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'รายจ่าย')

    // ===== Sheet 5: งาน (Tasks) =====
    const taskHeaders = ['ชื่องาน', 'สถานะ', 'ลำดับความสำคัญ', 'ผู้รับผิดชอบ', 'กำหนดส่ง', 'คำอธิบาย']
    const taskRows = tasks.map(task => {
        const assignees = users.filter(u => task.assignedTo?.includes(u.id)).map(u => u.name).join(', ')
        return [
            task.title,
            task.status,
            task.priority,
            assignees || '-',
            task.dueDate || '-',
            task.description || '-',
        ]
    })
    const wsTasks = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows])
    wsTasks['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(wb, wsTasks, 'งาน')

    // Generate filename
    const dateStr = format(new Date(), 'yyyyMMdd', { locale: locale === 'th' ? th : undefined })
    const filename = `${project.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}_${dateStr}.xlsx`

    // Write and download
    XLSX.writeFile(wb, filename)
}
