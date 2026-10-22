"use client"

import * as React from "react"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Receipt, FileText, ArrowLeft, Plus, Trash2, Printer,
    Save, CheckCircle2, Clock, Calendar, Building2, User2,
    DollarSign, Sparkles, ZoomIn, ZoomOut, Maximize2, Minimize2,
    CreditCard, ShieldCheck, Percent, HelpCircle, Layers,
    RefreshCw, ChevronRight, Check, AlertCircle, Copy, FileCheck
} from "lucide-react"
import { toast } from "sonner"
import { useProjects, Contract, ContractInstallment } from "@/context/project-context"
import { useFinance } from "@/context/finance-context"
import { useSettings } from "@/context/settings-context"
import { useOrganization } from "@/context/organization-context"
import SearchableCombobox from "@/components/ui/searchable-combobox"
import { cn } from "@/lib/utils"
import {
    bahtText,
    fmtBaht,
    fmtNum,
    generateVoucherNumber,
    generateVoucherHTML,
    thDateLong,
    thDateShort,
    todayISO,
    getInstallmentDrawn,
    VoucherPrintInput
} from "@/lib/contract-utils"

// Preset Work Departments
const WORK_DEPARTMENTS = [
    "งานเหมาโครงสร้าง & ฐานราก",
    "งานก่ออิฐฉาบปูน",
    "งานระบบไฟฟ้า & สื่อสาร",
    "งานระบบประปา & สุขาภิบาล",
    "งานฝ้าเพดาน & ผนังเบา",
    "งานทาสีอาคาร (ภายใน/ภายนอก)",
    "งานปูกระเบื้อง & หินขัด",
    "งานประตูหน้าต่าง & อลูมิเนียม",
    "งานหลังคา & รางน้ำ",
    "งานเฟอร์นิเจอร์ Built-in",
    "งานเหล็กดัด & รั้ว",
    "งานภูมิทัศน์ & งานสวน",
    "งานเบ็ดเตล็ด & ซ่อมแซม"
]

// Preset Banks in Thailand
const THAI_BANKS = [
    "ธนาคารกสิกรไทย (KBANK)",
    "ธนาคารไทยพาณิชย์ (SCB)",
    "ธนาคารกรุงเทพ (BBL)",
    "ธนาคารกรุงไทย (KTB)",
    "ธนาคารกรุงศรีอยุธยา (BAY)",
    "ธนาคารทหารไทยธนชาต (TTB)",
    "ธนาคารออมสิน (GSB)",
    "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
    "พร้อมเพย์ (PromptPay)",
    "เงินสด (Cash)"
]

// Preset Quick Item Descriptions
const QUICK_ITEMS = [
    "ค่าแรงงวดงานตามความคืบหน้า",
    "ค่าแรงติดตั้งหน้างาน",
    "ค่าแรงงานแก้ไข / เก็บงาน",
    "ค่างานเพิ่มพิเศษ (O.T. / Extra)",
    "ค่าวัสดุอุปกรณ์สำรองจ่ายเร่งด่วน",
    "ค่าเตรียมหน้างานและรื้อถอน",
    "ค่าขนส่งและขนย้ายเครื่องมือ"
]

interface LineItem {
    id: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    amount: number
    notes: string
}

export default function NewVoucherPage() {
    const router = useRouter()
    const { projects, workers, contracts, addWorker, currentUser } = useProjects()
    const { createStandaloneVoucher, drawInstallment } = useFinance()
    const { orgProfile } = useSettings()
    const { currentOrg } = useOrganization()

    // ─────────────────────────────────────────────────────────────────────────
    // UI Layout States
    // ─────────────────────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<"split" | "form" | "preview">("split")
    const [zoom, setZoom] = useState(0.70)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const previewColRef = useRef<HTMLDivElement>(null)

    // Calculate optimal zoom to fit entire A4 (210x297mm) into visible viewport
    const calculateFitZoom = useCallback(() => {
        if (typeof window === "undefined") return 0.70
        const container = previewColRef.current
        const availW = container ? container.clientWidth - 32 : (window.innerWidth * (viewMode === "preview" ? 0.9 : 0.42)) - 32
        const availH = window.innerHeight - 230
        const scaleW = availW / 794
        const scaleH = availH / 1123
        const bestScale = Math.min(scaleW, scaleH)
        return Math.max(0.40, Math.min(1.2, Math.round(bestScale * 100) / 100))
    }, [viewMode])

    const handleFitScreen = useCallback(() => {
        const calculated = calculateFitZoom()
        setZoom(calculated)
    }, [calculateFitZoom])

    // Re-fit on viewMode change or initial mount
    useEffect(() => {
        handleFitScreen()
    }, [viewMode, handleFitScreen])

    // ─────────────────────────────────────────────────────────────────────────
    // Form States
    // ─────────────────────────────────────────────────────────────────────────
    // Voucher Source: Standalone (งวดเดียว/ไม่มีสัญญา) vs From Contract (เบิกจากสัญญาจ้างเดิม)
    const [voucherSource, setVoucherSource] = useState<"standalone" | "contract">("standalone")
    const [selectedContractId, setSelectedContractId] = useState<string>("")
    const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>("")

    // Document Meta
    const [voucherNumber, setVoucherNumber] = useState("")
    const [date, setDate] = useState(todayISO())
    const [paymentDate, setPaymentDate] = useState("")
    const [expenseStatus, setExpenseStatus] = useState<"Paid" | "Pending">("Pending")
    const [department, setDepartment] = useState(WORK_DEPARTMENTS[0])

    // Project & Payee
    const [projectId, setProjectId] = useState("")
    const [workerId, setWorkerId] = useState("")
    const [isNewWorker, setIsNewWorker] = useState(false)
    const [newWorkerName, setNewWorkerName] = useState("")
    const [newWorkerPhone, setNewWorkerPhone] = useState("")
    const [newWorkerRole, setNewWorkerRole] = useState("ผู้รับเหมาช่วง")
    const [workerTaxId, setWorkerTaxId] = useState("")

    // Payment Channel
    const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cash" | "cheque">("transfer")
    const [bankName, setBankName] = useState(THAI_BANKS[0])
    const [accountNumber, setAccountNumber] = useState("")
    const [accountName, setAccountName] = useState("")
    const [chequeNumber, setChequeNumber] = useState("")

    // Milestone & Line Items
    const [title, setTitle] = useState("")
    const [installmentLabel, setInstallmentLabel] = useState("1")
    const [items, setItems] = useState<LineItem[]>([
        {
            id: "item-1",
            description: "ค่าแรงงวดงานตามความคืบหน้า",
            quantity: 1,
            unit: "งวด",
            unitPrice: 0,
            amount: 0,
            notes: ""
        }
    ])

    // Financial Deductions
    const [useRetention, setUseRetention] = useState(false)
    const [retentionPercent, setRetentionPercent] = useState<number>(5)
    const [retentionAmount, setRetentionAmount] = useState<number>(0)

    const [useWht, setUseWht] = useState(false)
    const [whtRate, setWhtRate] = useState<number>(3) // Default 3% for contractor services

    const [useDeduction, setUseDeduction] = useState(false)
    const [deductionAmount, setDeductionAmount] = useState<number>(0)
    const [deductionNote, setDeductionNote] = useState("")

    // Terms & Notes
    const [terms, setTerms] = useState("จ่ายเมื่อตรวจรับความเรียบร้อยของงวดงานตามข้อตกลง")
    const [inspectionNote, setInspectionNote] = useState("ผ่านการตรวจสอบคุณภาพงานตามมาตรฐานหน้างานเรียบร้อยแล้ว")
    const [internalNote, setInternalNote] = useState("")

    // Signatures (4 Parties) - Default requester to office staff / document preparer
    const [signatures, setSignatures] = useState({
        requester: { name: "", label: "ผู้ขอเบิกจ่าย (ผู้จัดทำเอกสาร)" },
        inspector: { name: "", label: "ผู้ตรวจสอบงาน (วิศวกร / โฟร์แมน)" },
        accountant: { name: "", label: "ฝ่ายบัญชีและการเงิน" },
        payer: { name: "", label: "ผู้มีอำนาจอนุมัติจ่าย (กรรมการ)" }
    })

    // Extract historical & remembered signature names from contracts, user profile, and localStorage
    const historicalSignatures = useMemo(() => {
        const requesters = new Set<string>()
        const inspectors = new Set<string>()
        const accountants = new Set<string>()
        const payers = new Set<string>()

        // System defaults
        if (currentUser?.name) requesters.add(currentUser.name)
        if (orgProfile?.signatureName) {
            inspectors.add(orgProfile.signatureName)
            payers.add(orgProfile.signatureName)
        }
        if (orgProfile?.name) {
            inspectors.add(orgProfile.name)
            payers.add(orgProfile.name)
        }

        // Local storage history
        if (typeof window !== "undefined") {
            try {
                const stored = JSON.parse(localStorage.getItem("hipsloth_voucher_signatures_history") || "{}")
                ;(stored.requesters || []).forEach((n: string) => n && requesters.add(n))
                ;(stored.inspectors || []).forEach((n: string) => n && inspectors.add(n))
                ;(stored.accountants || []).forEach((n: string) => n && accountants.add(n))
                ;(stored.payers || []).forEach((n: string) => n && payers.add(n))
            } catch (e) {}
        }

        // Existing contracts draws history
        (contracts || []).forEach(c => {
            (c.installments || []).forEach(inst => {
                (inst.draws || []).forEach(d => {
                    const s = d.signatures
                    if (s?.requester?.name) requesters.add(s.requester.name)
                    if (s?.inspector?.name) inspectors.add(s.inspector.name)
                    if (s?.accountant?.name) accountants.add(s.accountant.name)
                    if (s?.payer?.name) payers.add(s.payer.name)
                })
            })
        })

        return {
            requesters: Array.from(requesters).filter(Boolean),
            inspectors: Array.from(inspectors).filter(Boolean),
            accountants: Array.from(accountants).filter(Boolean),
            payers: Array.from(payers).filter(Boolean)
        }
    }, [contracts, currentUser, orgProfile])

    // Save signatures to localStorage
    const persistSignatures = useCallback((newSigs: typeof signatures) => {
        if (typeof window === "undefined") return
        try {
            localStorage.setItem("hipsloth_voucher_last_signatures", JSON.stringify({
                requester: newSigs.requester.name,
                inspector: newSigs.inspector.name,
                accountant: newSigs.accountant.name,
                payer: newSigs.payer.name
            }))

            const prevHistory = JSON.parse(localStorage.getItem("hipsloth_voucher_signatures_history") || "{}")
            const updatePool = (existing: string[] = [], val: string) => {
                if (!val || !val.trim()) return existing
                const set = new Set([val.trim(), ...existing])
                return Array.from(set).slice(0, 10)
            }

            const updatedHistory = {
                requesters: updatePool(prevHistory.requesters, newSigs.requester.name),
                inspectors: updatePool(prevHistory.inspectors, newSigs.inspector.name),
                accountants: updatePool(prevHistory.accountants, newSigs.accountant.name),
                payers: updatePool(prevHistory.payers, newSigs.payer.name)
            }
            localStorage.setItem("hipsloth_voucher_signatures_history", JSON.stringify(updatedHistory))
        } catch (e) {}
    }, [])

    // ─────────────────────────────────────────────────────────────────────────
    // Initializer
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        setVoucherNumber(generateVoucherNumber(contracts))
        if (projects.length > 0 && !projectId) {
            setProjectId(projects[0].id)
        }
        if (workers.length > 0 && !workerId) {
            setWorkerId(workers[0].id)
        }

        // Restore signatures from localStorage or user/org profile (Default to Office Staff / Current User)
        let savedSigs: any = null
        try {
            if (typeof window !== "undefined") {
                savedSigs = JSON.parse(localStorage.getItem("hipsloth_voucher_last_signatures") || "null")
            }
        } catch (e) {}

        setSignatures({
            requester: {
                name: savedSigs?.requester || currentUser?.name || "",
                label: "ผู้ขอเบิกจ่าย (ผู้จัดทำเอกสาร)"
            },
            inspector: {
                name: savedSigs?.inspector || orgProfile?.signatureName || orgProfile?.name || "",
                label: "ผู้ตรวจสอบงาน (วิศวกร / โฟร์แมน)"
            },
            accountant: {
                name: savedSigs?.accountant || "",
                label: "ฝ่ายบัญชีและการเงิน"
            },
            payer: {
                name: savedSigs?.payer || orgProfile?.name || orgProfile?.signatureName || "",
                label: "ผู้มีอำนาจอนุมัติจ่าย (กรรมการ)"
            }
        })
    }, [contracts, projects, workers, orgProfile, currentUser])

    // Update payee bank account name when worker selection changes (Never overwrite requester signature with worker)
    useEffect(() => {
        if (isNewWorker) {
            if (newWorkerName && !accountName) {
                setAccountName(newWorkerName)
            }
        } else {
            const w = workers.find(item => item.id === workerId)
            if (w) {
                if (w.role) setNewWorkerRole(w.role)
                if (!accountName) setAccountName(w.name)
            }
        }
    }, [workerId, isNewWorker, newWorkerName, workers])

    // When contract source is selected, fill project & worker automatically
    const availableContracts = useMemo(() => {
        return contracts.filter(c => !c.isDeleted && !c.isArchived)
    }, [contracts])

    const selectedContract = useMemo(() => {
        return contracts.find(c => c.id === selectedContractId)
    }, [contracts, selectedContractId])

    useEffect(() => {
        if (voucherSource === "contract" && selectedContract) {
            setProjectId(selectedContract.projectId)
            setWorkerId(selectedContract.workerId)
            if (selectedContract.installments && selectedContract.installments.length > 0) {
                const firstPending = selectedContract.installments.find(i => i.status !== "Paid") || selectedContract.installments[0]
                setSelectedInstallmentId(firstPending.id)
                const instIdx = selectedContract.installments.indexOf(firstPending)
                const drawn = getInstallmentDrawn(firstPending, instIdx)
                const remaining = Math.max(0, firstPending.amount - drawn)
                setTitle(`เบิกงวดที่ ${instIdx + 1}: ${firstPending.description}`)
                setInstallmentLabel(String(instIdx + 1))
                setItems([
                    {
                        id: "item-contract-1",
                        description: firstPending.description || `งวดที่ ${instIdx + 1}`,
                        quantity: 1,
                        unit: "งวด",
                        unitPrice: remaining,
                        amount: remaining,
                        notes: `สัญญา ${selectedContract.documentNumber || "CT"}`
                    }
                ])
            }
        }
    }, [voucherSource, selectedContract])

    // ─────────────────────────────────────────────────────────────────────────
    // Financial Calculations
    // ─────────────────────────────────────────────────────────────────────────
    const subtotal = useMemo(() => {
        return items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
    }, [items])

    // Auto calculate retention amount if percentage based
    const computedRetention = useMemo(() => {
        if (!useRetention) return 0
        return Math.round((subtotal * (retentionPercent / 100)) * 100) / 100
    }, [useRetention, subtotal, retentionPercent])

    // Auto calculate WHT
    const computedWht = useMemo(() => {
        if (!useWht) return 0
        return Math.round((subtotal * (whtRate / 100)) * 100) / 100
    }, [useWht, subtotal, whtRate])

    // Effective deduction
    const computedDeduction = useDeduction ? Number(deductionAmount) || 0 : 0

    // Net payable
    const netPayable = useMemo(() => {
        const net = subtotal - computedRetention - computedWht - computedDeduction
        return Math.max(0, Math.round(net * 100) / 100)
    }, [subtotal, computedRetention, computedWht, computedDeduction])

    // Selected project & worker objects
    const currentProject = projects.find(p => p.id === projectId)
    const currentWorker = isNewWorker
        ? { id: "new", name: newWorkerName || "ช่าง / ผู้รับเหมาใหม่", phone: newWorkerPhone, role: newWorkerRole }
        : workers.find(w => w.id === workerId)

    // ─────────────────────────────────────────────────────────────────────────
    // Line Item Actions
    // ─────────────────────────────────────────────────────────────────────────
    const handleAddItem = () => {
        const nextIdx = items.length + 1
        setItems(prev => [
            ...prev,
            {
                id: `item-${Date.now()}-${nextIdx}`,
                description: "",
                quantity: 1,
                unit: "งาน",
                unitPrice: 0,
                amount: 0,
                notes: ""
            }
        ])
    }

    const handleRemoveItem = (idx: number) => {
        if (items.length <= 1) {
            toast.error("ต้องมีรายการอย่างน้อย 1 รายการ")
            return
        }
        setItems(prev => prev.filter((_, i) => i !== idx))
    }

    const handleItemChange = (idx: number, field: keyof LineItem, val: any) => {
        setItems(prev => {
            const next = [...prev]
            const it = { ...next[idx], [field]: val }

            // Recalculate amount if qty or unit price changes
            if (field === "quantity" || field === "unitPrice") {
                const q = field === "quantity" ? Number(val) || 0 : it.quantity
                const p = field === "unitPrice" ? Number(val) || 0 : it.unitPrice
                it.amount = Math.round(q * p * 100) / 100
            } else if (field === "amount" && it.quantity === 1) {
                it.unitPrice = Number(val) || 0
            }

            next[idx] = it
            return next
        })
    }

    const handleQuickItemSelect = (desc: string) => {
        const emptyIdx = items.findIndex(it => !it.description.trim())
        if (emptyIdx >= 0) {
            handleItemChange(emptyIdx, "description", desc)
        } else {
            setItems(prev => [
                ...prev,
                {
                    id: `item-${Date.now()}`,
                    description: desc,
                    quantity: 1,
                    unit: "งาน",
                    unitPrice: 0,
                    amount: 0,
                    notes: ""
                }
            ])
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Print & Submit Handlers
    // ─────────────────────────────────────────────────────────────────────────
    const printableData: VoucherPrintInput = useMemo(() => {
        return {
            docNumber: voucherNumber || "PV-XXXXXX",
            requestDate: thDateLong(date),
            paymentDate: paymentDate ? thDateLong(paymentDate) : "",
            status: expenseStatus,
            workerName: currentWorker?.name || "-",
            workerPhone: currentWorker?.phone || undefined,
            projectName: currentProject?.name || "-",
            categoryOrPipe: department || "งานเบิกงวด",
            responsibleRole: newWorkerRole || "ผู้รับเหมาช่วง",
            items: items.map(it => ({
                description: `${it.description} ${it.quantity > 1 ? `(${it.quantity} ${it.unit} @ ฿${fmtNum(it.unitPrice)})` : ""}`,
                amount: it.amount,
                notes: it.notes || ""
            })),
            totalAmount: netPayable,
            totalContractAmount: selectedContract?.totalAmount || netPayable,
            installmentLabel: installmentLabel || "1",
            installmentAmount: netPayable,
            remainingAmount: 0,
            org: orgProfile || {},
            signatures
        }
    }, [
        voucherNumber, date, paymentDate, expenseStatus, currentWorker, currentProject,
        department, newWorkerRole, items, netPayable, selectedContract, installmentLabel,
        orgProfile, signatures
    ])

    const handlePrint = () => {
        const printWindow = window.open("", "_blank")
        if (!printWindow) {
            toast.error("กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์เอกสาร")
            return
        }

        const html = generateVoucherHTML(printableData)
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print()
            }, 300)
        }
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!title.trim()) {
            toast.error("กรุณาระบุชื่องวดงาน หรือชื่องานที่ว่าจ้าง")
            return
        }

        if (!projectId) {
            toast.error("กรุณาเลือกโครงการ")
            return
        }

        let effectiveWorkerId = workerId
        if (isNewWorker) {
            if (!newWorkerName.trim()) {
                toast.error("กรุณากรอกชื่อช่าง / ผู้รับเหมา")
                return
            }
            try {
                await addWorker({
                    name: newWorkerName.trim(),
                    role: newWorkerRole || "ช่าง/ผู้รับเหมา",
                    phone: newWorkerPhone.trim() || undefined
                })
                const created = workers.find(w => w.name.trim().toLowerCase() === newWorkerName.trim().toLowerCase())
                if (created) effectiveWorkerId = created.id
            } catch (err) {
                console.error(err)
            }
        }

        if (!effectiveWorkerId) {
            toast.error("กรุณาเลือกหรือระบุชื่อช่าง")
            return
        }

        if (netPayable <= 0) {
            toast.error("ยอดจ่ายสุทธิหลังหักต้องมากกว่า 0 บาท")
            return
        }

        setIsSubmitting(true)
        persistSignatures(signatures)
        try {
            // Build rich note with bank info, deductions and inspection remarks
            const noteParts: string[] = []
            if (paymentMethod === "transfer") {
                noteParts.push(`โอนเข้า: ${bankName} เลขที่ ${accountNumber || "-"} (${accountName || "-"})`)
            } else if (paymentMethod === "cash") {
                noteParts.push("ชำระเป็นเงินสด")
            } else if (paymentMethod === "cheque") {
                noteParts.push(`จ่ายเช็คเลขที่: ${chequeNumber || "-"}`)
            }

            if (useRetention && computedRetention > 0) {
                noteParts.push(`หักประกันผลงาน ${retentionPercent}% (฿${fmtNum(computedRetention)})`)
            }
            if (useWht && computedWht > 0) {
                noteParts.push(`หัก ณ ที่จ่าย ${whtRate}% (฿${fmtNum(computedWht)})`)
            }
            if (useDeduction && computedDeduction > 0) {
                noteParts.push(`หักเพิ่มเติม: ฿${fmtNum(computedDeduction)} (${deductionNote || "หักเบิก/ค่าของ"})`)
            }
            if (inspectionNote.trim()) {
                noteParts.push(`ตรวจรับ: ${inspectionNote.trim()}`)
            }
            if (internalNote.trim()) {
                noteParts.push(`หมายเหตุ: ${internalNote.trim()}`)
            }

            const combinedNote = noteParts.join(" | ")

            if (voucherSource === "contract" && selectedContractId && selectedInstallmentId) {
                // Draw from existing contract
                const res = await drawInstallment(selectedContractId, selectedInstallmentId, {
                    amount: netPayable,
                    date,
                    paymentDate: paymentDate || (expenseStatus === "Paid" ? date : undefined),
                    voucherNumber: voucherNumber.trim() || undefined,
                    department,
                    responsibleRole: newWorkerRole,
                    label: installmentLabel,
                    items: items.map(it => ({
                        description: it.description,
                        amount: it.amount,
                        notes: it.notes
                    })),
                    signatures,
                    note: combinedNote,
                    expenseStatus
                })

                toast.success(`ออกใบเบิกงวด ${voucherNumber} สำเร็จ`, {
                    description: `เบิกงวดที่ ${res?.label ?? installmentLabel} สัญญา ${selectedContract?.documentNumber || "CT"}`
                })
            } else {
                // Standalone voucher
                const res = await createStandaloneVoucher({
                    voucherNumber: voucherNumber.trim() || undefined,
                    projectId,
                    workerId: effectiveWorkerId,
                    title: title.trim(),
                    amount: netPayable,
                    date,
                    paymentDate: paymentDate || (expenseStatus === "Paid" ? date : undefined),
                    expenseStatus,
                    note: combinedNote,
                    department,
                    responsibleRole: newWorkerRole,
                    signatures,
                    items: items.map(it => ({
                        id: it.id,
                        description: `${it.description}${it.quantity > 1 ? ` (${it.quantity} ${it.unit})` : ""}`,
                        amount: it.amount,
                        notes: it.notes
                    }))
                })

                toast.success(`ออกใบเบิกงวด ${res?.voucherNumber || voucherNumber} สำเร็จ`, {
                    description: `ยอดเงิน ${fmtBaht(netPayable)} (${expenseStatus === "Paid" ? "บันทึกตัดเป็นรายจ่ายเรียบร้อย" : "สถานะรอจ่าย"})`
                })
            }

            router.push("/vouchers")
        } catch (err: any) {
            console.error(err)
            toast.error(err?.message || "ไม่สามารถออกใบเบิกงวดได้")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background pb-28">
            {/* ─────────────────────────────────────────────────────────────────
                TOP STICKY APP BAR (Header & Actions)
               ───────────────────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Back & Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href="/vouchers"
                            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                            title="ย้อนกลับไปหน้ารวมใบเบิกงวด"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight truncate">
                                    ออกใบเบิกงวดใหม่ (Payment Voucher)
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                    {voucherNumber || "PV-AUTO"}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground hidden sm:block">
                                สร้างใบสำคัญจ่ายเงินช่าง/ผู้รับเหมา ปรับแต่งรายละเอียด แจกแจงรายการ และพิมพ์เอกสาร A4
                            </p>
                        </div>
                    </div>

                    {/* Right: View Mode Toggle & Primary Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Mode Switcher */}
                        <div className="hidden lg:flex p-1 rounded-xl bg-muted border border-border text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode("form")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-semibold transition",
                                    viewMode === "form" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                กรอกข้อมูลเต็มจอ
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("split")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5",
                                    viewMode === "split" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span>แบ่ง 2 ฝั่ง</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("preview")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-semibold transition",
                                    viewMode === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                ดูตัวอย่าง A4
                            </button>
                        </div>

                        {/* Print Button */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold transition"
                            title="พิมพ์เอกสาร A4 หรือบันทึกเป็น PDF"
                        >
                            <Printer className="w-4 h-4 text-primary" />
                            <span className="hidden sm:inline">พิมพ์ / PDF</span>
                        </button>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSubmitting ? "กำลังบันทึก..." : "ออกใบเบิกงวด"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────────
                MAIN WORKSPACE (Split Form + Live A4 Preview)
               ───────────────────────────────────────────────────────────────── */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* ── LEFT / MAIN: FORM EDITOR ── */}
                    <div
                        className={cn(
                            "w-full transition-all space-y-6",
                            viewMode === "split" ? "lg:w-[55%] xl:w-[58%]" : viewMode === "form" ? "w-full max-w-4xl mx-auto" : "hidden"
                        )}
                    >
                        {/* ──────────────────────────────────────────────
                            SECTION 1: รูปแบบใบเบิก & ข้อมูลเอกสาร
                           ────────────────────────────────────────────── */}
                        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                                        1
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-sm text-foreground">
                                            ประเภทใบเบิก & ข้อมูลทั่วไป
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            เลือกประเภทการเบิก เลขที่เอกสาร วันที่ และสถานะการชำระเงิน
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setVoucherNumber(generateVoucherNumber(contracts))}
                                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                                    title="สร้างเลขที่เอกสารอัตโนมัติใหม่"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>สร้างเลขที่ใหม่</span>
                                </button>
                            </div>

                            {/* Source Type Selector */}
                            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-muted/60 border border-border text-xs">
                                <button
                                    type="button"
                                    onClick={() => setVoucherSource("standalone")}
                                    className={cn(
                                        "py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2",
                                        voucherSource === "standalone"
                                            ? "bg-background text-foreground shadow-sm border border-border/80"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                                    <span>ใบเบิกงวดเดียว / ไม่มีสัญญา</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setVoucherSource("contract")}
                                    className={cn(
                                        "py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2",
                                        voucherSource === "contract"
                                            ? "bg-background text-foreground shadow-sm border border-border/80"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <FileText className="w-3.5 h-3.5 text-violet-500" />
                                    <span>เบิกตามสัญญาจ้างที่มีอยู่</span>
                                </button>
                            </div>

                            {/* If source is contract, show contract & installment selector */}
                            {voucherSource === "contract" && (
                                <div className="p-3.5 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-3">
                                    <label className="text-xs font-bold text-foreground block">
                                        เลือกสัญญาจ้างในระบบ <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedContractId}
                                        onChange={e => setSelectedContractId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="">-- เลือกสัญญาจ้าง --</option>
                                        {availableContracts.map((c, cIdx) => {
                                            const p = projects.find(item => item.id === c.projectId)
                                            const w = workers.find(item => item.id === c.workerId)
                                            return (
                                                <option key={c.id || `contract-${cIdx}`} value={c.id}>
                                                    {c.documentNumber || "CT"} — {c.title} ({p?.name} | ช่าง: {w?.name})
                                                </option>
                                            )
                                        })}
                                    </select>

                                    {selectedContract && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                            <div>
                                                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                                    เลือกงวดงานที่ต้องการเบิก:
                                                </label>
                                                <select
                                                    value={selectedInstallmentId}
                                                    onChange={e => {
                                                        const val = e.target.value
                                                        setSelectedInstallmentId(val)
                                                        const inst = selectedContract.installments.find((it, idx) => (it.id || `inst-${idx}`) === val)
                                                        if (inst) {
                                                            const idx = selectedContract.installments.indexOf(inst)
                                                            const drawn = getInstallmentDrawn(inst, idx)
                                                            const rem = Math.max(0, inst.amount - drawn)
                                                            setTitle(`เบิกงวดที่ ${idx + 1}: ${inst.description}`)
                                                            setInstallmentLabel(String(idx + 1))
                                                            setItems([
                                                                {
                                                                    id: `item-${inst.id || idx + 1}`,
                                                                    description: inst.description,
                                                                    quantity: 1,
                                                                    unit: "งวด",
                                                                    unitPrice: rem,
                                                                    amount: rem,
                                                                    notes: `สัญญา ${selectedContract.documentNumber || "CT"}`
                                                                }
                                                            ])
                                                        }
                                                    }}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                                                >
                                                    {selectedContract.installments.map((inst, i) => {
                                                        const instKey = inst.id || `inst-${i}`
                                                        const drawn = getInstallmentDrawn(inst, i)
                                                        const rem = Math.max(0, inst.amount - drawn)
                                                        return (
                                                            <option key={instKey} value={instKey}>
                                                                งวดที่ {i + 1}: {inst.description} (คงเหลือ ฿{fmtNum(rem)})
                                                            </option>
                                                        )
                                                    })}
                                                </select>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex flex-col justify-center">
                                                <span>มูลค่าสัญญารวม: <b className="text-foreground">{fmtBaht(selectedContract.totalAmount || 0)}</b></span>
                                                <span>สถานะสัญญา: <b className="text-foreground">{selectedContract.status}</b></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Row 1: Voucher Number & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        เลขที่เอกสาร (Voucher No.) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={voucherNumber}
                                        onChange={e => setVoucherNumber(e.target.value)}
                                        placeholder="PV-YYYYMMDD-01"
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono font-bold text-xs text-foreground focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        สถานะการจ่าย
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
                                        <button
                                            type="button"
                                            onClick={() => setExpenseStatus("Pending")}
                                            className={cn(
                                                "py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5",
                                                expenseStatus === "Pending"
                                                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                            <span>รอจ่าย (Pending)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExpenseStatus("Paid")
                                                if (!paymentDate) setPaymentDate(date)
                                            }}
                                            className={cn(
                                                "py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5",
                                                expenseStatus === "Paid"
                                                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>จ่ายแล้ว (Paid)</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Date & Payment Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        วันที่ออกเอกสาร / วันที่ขอเบิก <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>กำหนดชำระ / วันที่จ่ายจริง</span>
                                        {expenseStatus === "Paid" && (
                                            <span className="text-[10px] text-emerald-600 font-bold">บันทึกตัดจ่าย</span>
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={e => {
                                            setPaymentDate(e.target.value)
                                            if (e.target.value) setExpenseStatus("Paid")
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-primary"
                                        placeholder="ระบุวันที่ชำระเงิน"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Project & Work Department */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        โครงการ <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableCombobox
                                        options={projects.map(p => ({
                                            value: p.id,
                                            label: p.name,
                                            description: p.customer || undefined
                                        }))}
                                        value={projectId}
                                        onChange={setProjectId}
                                        placeholder="เลือกโครงการ..."
                                        searchPlaceholder="ค้นหาชื่อโครงการ หรือลูกค้า..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        หมวดหมู่งาน / แผนกงาน
                                    </label>
                                    <select
                                        value={department}
                                        onChange={e => setDepartment(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-primary"
                                    >
                                        {WORK_DEPARTMENTS.map((d, dIdx) => (
                                            <option key={`dept-${d}-${dIdx}`} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ──────────────────────────────────────────────
                            SECTION 2: ข้อมูลผู้รับเงิน / ช่าง & ช่องทางโอนเงิน
                           ────────────────────────────────────────────── */}
                        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                        2
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-sm text-foreground">
                                            ข้อมูลผู้รับเงิน & บัญชีการชำระเงิน
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            รายละเอียดช่าง/ผู้รับเหมา เลขประจำตัวผู้เสียภาษี และช่องทางโอนเงิน
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsNewWorker(!isNewWorker)}
                                    className="text-xs text-primary hover:underline font-semibold"
                                >
                                    {isNewWorker ? "← เลือกช่างเดิมในระบบ" : "+ เพิ่มช่างใหม่"}
                                </button>
                            </div>

                            {/* Worker Picker / Input */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {isNewWorker ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">
                                                ชื่อช่าง / ร้าน / บริษัท <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newWorkerName}
                                                onChange={e => setNewWorkerName(e.target.value)}
                                                placeholder="เช่น ช่างสมชาย งานสี"
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">
                                                เบอร์โทรศัพท์
                                            </label>
                                            <input
                                                type="text"
                                                value={newWorkerPhone}
                                                onChange={e => setNewWorkerPhone(e.target.value)}
                                                placeholder="08X-XXX-XXXX"
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">
                                                ช่าง / ผู้รับเหมา <span className="text-red-500">*</span>
                                            </label>
                                            <SearchableCombobox
                                                options={workers.map(w => ({
                                                    value: w.id,
                                                    label: w.name,
                                                    description: w.role || w.phone || undefined
                                                }))}
                                                value={workerId}
                                                onChange={setWorkerId}
                                                placeholder="เลือกช่าง..."
                                                searchPlaceholder="ค้นหาชื่อช่าง หรือเบอร์โทร..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">
                                                บทบาท / หน้าที่
                                            </label>
                                            <input
                                                type="text"
                                                value={newWorkerRole}
                                                onChange={e => setNewWorkerRole(e.target.value)}
                                                placeholder="เช่น ผู้รับเหมาช่วง, ช่างสี"
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Tax ID & Payment Method */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        เลขประจำตัวผู้เสียภาษี / บัตร ปชช. (ช่าง)
                                    </label>
                                    <input
                                        type="text"
                                        value={workerTaxId}
                                        onChange={e => setWorkerTaxId(e.target.value)}
                                        placeholder="1-XXXX-XXXXX-XX-X"
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        ช่องทางการชำระเงิน
                                    </label>
                                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/60 border border-border text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("transfer")}
                                            className={cn(
                                                "py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1",
                                                paymentMethod === "transfer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                            )}
                                        >
                                            <CreditCard className="w-3 h-3" />
                                            <span>โอนเงิน</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("cash")}
                                            className={cn(
                                                "py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1",
                                                paymentMethod === "cash" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                            )}
                                        >
                                            <span>เงินสด</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("cheque")}
                                            className={cn(
                                                "py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1",
                                                paymentMethod === "cheque" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                            )}
                                        >
                                            <span>เช็ค</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details if Transfer */}
                            {paymentMethod === "transfer" && (
                                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-muted-foreground">ธนาคาร</label>
                                            <select
                                                value={bankName}
                                                onChange={e => setBankName(e.target.value)}
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                                            >
                                                {THAI_BANKS.map((b, bIdx) => (
                                                    <option key={`bank-${b}-${bIdx}`} value={b}>
                                                        {b}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-muted-foreground">เลขที่บัญชี</label>
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={e => setAccountNumber(e.target.value)}
                                                placeholder="XXX-X-XXXXX-X"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-mono text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-muted-foreground">ชื่อบัญชี</label>
                                            <input
                                                type="text"
                                                value={accountName}
                                                onChange={e => setAccountName(e.target.value)}
                                                placeholder="ชื่อบัญชีรับเงิน"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "cheque" && (
                                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-muted-foreground">เลขที่เช็ค / ธนาคารที่สั่งจ่าย</label>
                                        <input
                                            type="text"
                                            value={chequeNumber}
                                            onChange={e => setChequeNumber(e.target.value)}
                                            placeholder="เช่น เช็ค ธ.กรุงเทพ เลขที่ 1234567"
                                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ──────────────────────────────────────────────
                            SECTION 3: ชื่องวดงาน & รายการแจกแจงค่าใช้จ่าย
                           ────────────────────────────────────────────── */}
                        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                        3
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-sm text-foreground">
                                            ชื่องวดงาน & รายการแจกแจงค่าใช้จ่าย
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            ระบุหัวข้องวดงาน และแจกแจงรายละเอียด ปริมาณ ราคาต่อหน่วย เพื่อพิมพ์ลงเอกสาร
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shadow-sm hover:opacity-90 transition"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>เพิ่มรายการ</span>
                                </button>
                            </div>

                            {/* Milestone Title */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground block">
                                    ชื่องวดงาน / งานที่ว่าจ้าง <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="เช่น ค่าแรงติดตั้งระบบไฟฟ้าชั้น 1, ค่างวดงานทาสีภายนอก 80%"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:ring-1 focus:ring-primary leading-relaxed resize-y"
                                    required
                                />
                            </div>

                            {/* Quick Preset Chips */}
                            <div>
                                <span className="text-[11px] text-muted-foreground block mb-1.5">
                                    เติมรายการด่วน (Quick Presets):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUICK_ITEMS.map((desc, qIdx) => (
                                        <button
                                            key={`qi-${desc}-${qIdx}`}
                                            type="button"
                                            onClick={() => handleQuickItemSelect(desc)}
                                            className="px-2.5 py-1 rounded-lg text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border/70 transition"
                                        >
                                            + {desc}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-border rounded-xl overflow-hidden bg-card">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/70 border-b border-border text-[11px] font-bold text-muted-foreground">
                                            <tr>
                                                <th className="py-2.5 px-2 w-9 text-center">#</th>
                                                <th className="py-2.5 px-3 min-w-[280px]">รายละเอียดรายการ & ขอบเขตงาน</th>
                                                <th className="py-2.5 px-2 w-16 text-right">จำนวน</th>
                                                <th className="py-2.5 px-2 w-16 text-center">หน่วย</th>
                                                <th className="py-2.5 px-2 w-24 text-right">ราคา/หน่วย</th>
                                                <th className="py-2.5 px-3 w-28 text-right">จำนวนเงิน (บาท)</th>
                                                <th className="py-2.5 px-1.5 w-8 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {items.map((it, idx) => (
                                                <tr key={it.id || `item-row-${idx}`} className="hover:bg-muted/30 transition">
                                                    <td className="py-2.5 px-2 text-center font-mono text-muted-foreground text-[11px] align-top pt-3.5">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3 space-y-1.5 align-top">
                                                        <textarea
                                                            rows={2}
                                                            value={it.description}
                                                            onChange={e => handleItemChange(idx, "description", e.target.value)}
                                                            placeholder={`รายละเอียดรายการที่ ${idx + 1} (เช่น งานระบบไฟฟ้า / งานจัดเตรียมหน้างาน)`}
                                                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs leading-relaxed resize-y focus:ring-1 focus:ring-primary"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={it.notes || ""}
                                                            onChange={e => handleItemChange(idx, "notes", e.target.value)}
                                                            placeholder="หมายเหตุ / งานย่อย (เช่น เบิกย่อย 50% หรือ งวด 2.1)"
                                                            className="w-full px-2 py-1 rounded-md border border-border/70 bg-muted/20 text-[11px] text-muted-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:text-foreground"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-right align-top pt-2.5">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={it.quantity || ""}
                                                            onChange={e => handleItemChange(idx, "quantity", Number(e.target.value) || 0)}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-right font-mono"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-center align-top pt-2.5">
                                                        <input
                                                            type="text"
                                                            value={it.unit}
                                                            onChange={e => handleItemChange(idx, "unit", e.target.value)}
                                                            placeholder="งวด"
                                                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-center"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-right align-top pt-2.5">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={it.unitPrice || ""}
                                                            onChange={e => handleItemChange(idx, "unitPrice", Number(e.target.value) || 0)}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-right font-mono"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 text-right align-top pt-2.5">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={it.amount || ""}
                                                            onChange={e => handleItemChange(idx, "amount", Number(e.target.value) || 0)}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-right font-mono font-bold text-foreground"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-1.5 text-center align-top pt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
                                                            title="ลบแถวนี้"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-primary hover:underline font-semibold flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>เพิ่มแถวรายการ</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">ยอดรวมรายการ (Subtotal):</span>
                                        <span className="font-extrabold text-sm tabular-nums text-foreground">
                                            {fmtBaht(subtotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ──────────────────────────────────────────────
                            SECTION 4: หักเงินประกันผลงาน & ภาษีหัก ณ ที่จ่าย
                           ────────────────────────────────────────────── */}
                        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                    4
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm text-foreground">
                                        การคำนวณเงิน หักประกันผลงาน & ภาษีหัก ณ ที่จ่าย
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground">
                                        กำหนดการหักเงินประกันผลงาน (Retention), ภาษีหัก ณ ที่จ่าย (WHT) และค่าใช้จ่ายสำรอง
                                    </p>
                                </div>
                            </div>

                            {/* 3 Deductions Switches */}
                            <div className="space-y-3">
                                {/* Retention */}
                                <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useRetention}
                                                onChange={e => setUseRetention(e.target.checked)}
                                                className="rounded border-border w-4 h-4 text-primary"
                                            />
                                            <span>หักเงินประกันผลงาน (Retention)</span>
                                        </label>
                                        {useRetention && (
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                                - {fmtBaht(computedRetention)}
                                            </span>
                                        )}
                                    </div>

                                    {useRetention && (
                                        <div className="flex items-center gap-3 pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] text-muted-foreground">อัตราหัก:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={retentionPercent}
                                                    onChange={e => setRetentionPercent(Number(e.target.value) || 0)}
                                                    className="w-16 px-2 py-1 rounded-lg border border-border bg-background text-xs font-bold text-center"
                                                />
                                                <span className="text-xs font-semibold">%</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[5, 10].map((pct, pIdx) => (
                                                    <button
                                                        key={`retention-${pct}-${pIdx}`}
                                                        type="button"
                                                        onClick={() => setRetentionPercent(pct)}
                                                        className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                                                            retentionPercent === pct ? "bg-amber-500/20 text-amber-600 border-amber-500/30" : "bg-card text-muted-foreground"
                                                        )}
                                                    >
                                                        {pct}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Withholding Tax */}
                                <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useWht}
                                                onChange={e => setUseWht(e.target.checked)}
                                                className="rounded border-border w-4 h-4 text-primary"
                                            />
                                            <span>ภาษีหัก ณ ที่จ่าย (Withholding Tax - WHT)</span>
                                        </label>
                                        {useWht && (
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                                - {fmtBaht(computedWht)}
                                            </span>
                                        )}
                                    </div>

                                    {useWht && (
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <span className="text-[11px] text-muted-foreground">เลือกอัตราภาษี:</span>
                                            {[
                                                { rate: 1, label: "1% (ขนส่ง)" },
                                                { rate: 2, label: "2% (โฆษณา)" },
                                                { rate: 3, label: "3% (รับเหมา/ค่าจ้าง)" },
                                                { rate: 5, label: "5% (ค่าเช่า)" }
                                            ].map((opt, optIdx) => (
                                                <button
                                                    key={`wht-${opt.rate}-${optIdx}`}
                                                    type="button"
                                                    onClick={() => setWhtRate(opt.rate)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition",
                                                        whtRate === opt.rate
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-background text-muted-foreground border-border hover:text-foreground"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Other Deductions / Advances */}
                                <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useDeduction}
                                                onChange={e => setUseDeduction(e.target.checked)}
                                                className="rounded border-border w-4 h-4 text-primary"
                                            />
                                            <span>หักเงินเบิกล่วงหน้า / ค่าวัสดุสำรองจ่าย / ค่าปรับ</span>
                                        </label>
                                        {useDeduction && (
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums">
                                                - {fmtBaht(computedDeduction)}
                                            </span>
                                        )}
                                    </div>

                                    {useDeduction && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                            <div>
                                                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                                    จำนวนเงินที่หัก (บาท):
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="any"
                                                    value={deductionAmount || ""}
                                                    onChange={e => setDeductionAmount(Number(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-bold text-red-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                                    หมายเหตุการหัก:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={deductionNote}
                                                    onChange={e => setDeductionNote(e.target.value)}
                                                    placeholder="เช่น หักค่าซื้อของที่ บ. ออกให้ก่อน"
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Net Payable Highlight Card */}
                            <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">
                                        ยอดสุทธิที่ต้องจ่ายช่าง (Net Payable Total):
                                    </span>
                                    <span className="text-xl sm:text-2xl font-black text-primary tabular-nums">
                                        {fmtBaht(netPayable)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                    ({bahtText(netPayable)})
                                </p>
                            </div>
                        </div>

                        {/* ──────────────────────────────────────────────
                            SECTION 5: เงื่อนไขการตรวจรับ & หมายเหตุ
                           ────────────────────────────────────────────── */}
                        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                                    5
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm text-foreground">
                                        เงื่อนไขการตรวจรับ & หมายเหตุในเอกสาร
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground">
                                        ข้อตกลงการจ่ายเงิน บันทึกการตรวจรับงาน และหมายเหตุสำหรับทีมงาน
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        เงื่อนไขการจ่ายเงิน (แสดงในเอกสาร)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={terms}
                                        onChange={e => setTerms(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        ผลการตรวจรับงาน (Inspection Notes)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={inspectionNote}
                                        onChange={e => setInspectionNote(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 pt-1">
                                <label className="text-xs font-semibold text-foreground">
                                    หมายเหตุภายในบริษัท (Internal Notes)
                                </label>
                                <input
                                    type="text"
                                    value={internalNote}
                                    onChange={e => setInternalNote(e.target.value)}
                                    placeholder="บันทึกข้อความภายใน เช่น อนุมัติผ่าน LINE, จ่ายโดยคุณกิตติศักดิ์"
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                                />
                            </div>
                        </div>

                        {/* ──────────────────────────────────────────────
                            SECTION 6: ผู้ลงนาม 4 ฝ่าย
                           ────────────────────────────────────────────── */}
                        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                                        6
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-sm text-foreground">
                                            ผู้มีอำนาจลงนามในเอกสาร (4 ฝ่าย)
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            ระบุชื่อผู้ขอเบิกจ่าย (ฝ่ายออฟฟิศ/คนจัดทำ), ผู้ตรวจสอบงาน, แผนกบัญชี และผู้อนุมัติจ่าย
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            persistSignatures(signatures)
                                            toast.success("บันทึกชื่อผู้ลงนามชุดนี้เป็นค่าเริ่มต้นเรียบร้อย")
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition"
                                        title="จดจำชื่อผู้ลงนามชุดนี้ไว้สำหรับออกใบเบิกงวดครั้งถัดไป"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        จำค่านี้ไว้
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            let savedSigs: any = null
                                            try {
                                                if (typeof window !== "undefined") {
                                                    savedSigs = JSON.parse(localStorage.getItem("hipsloth_voucher_last_signatures") || "null")
                                                }
                                            } catch (e) {}
                                            if (savedSigs) {
                                                setSignatures(prev => ({
                                                    requester: { ...prev.requester, name: savedSigs.requester || prev.requester.name },
                                                    inspector: { ...prev.inspector, name: savedSigs.inspector || prev.inspector.name },
                                                    accountant: { ...prev.accountant, name: savedSigs.accountant || prev.accountant.name },
                                                    payer: { ...prev.payer, name: savedSigs.payer || prev.payer.name },
                                                }))
                                                toast.success("ดึงค่าเดิมที่เคยบันทึกไว้เรียบร้อย")
                                            } else {
                                                toast.info("ยังไม่มีข้อมูลชื่อผู้ลงนามที่บันทึกไว้")
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold hover:bg-muted transition"
                                        title="โหลดชื่อผู้ลงนามที่บันทึกไว้ล่าสุด"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        ดึงค่าที่จำไว้
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSignatures({
                                                requester: { name: currentUser?.name || "", label: "ผู้ขอเบิกจ่าย (ผู้จัดทำเอกสาร)" },
                                                inspector: { name: orgProfile?.signatureName || orgProfile?.name || "", label: "ผู้ตรวจสอบงาน (วิศวกร / โฟร์แมน)" },
                                                accountant: { name: "", label: "ฝ่ายบัญชีและการเงิน" },
                                                payer: { name: orgProfile?.name || orgProfile?.signatureName || "", label: "ผู้มีอำนาจอนุมัติจ่าย (กรรมการ)" }
                                            })
                                            toast.info("รีเซ็ตชื่อผู้ลงนามตามระบบเรียบร้อย")
                                        }}
                                        className="text-xs text-muted-foreground hover:text-foreground hover:underline font-medium px-1"
                                    >
                                        รีเซ็ต
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                                {/* 1. ผู้ขอเบิกจ่าย (คนทำเอกสาร/ออฟฟิศ) */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-foreground block">
                                        1. ผู้ขอเบิกจ่าย (คนทำเอกสาร/ออฟฟิศ):
                                    </label>
                                    <input
                                        type="text"
                                        list="voucher-requester-suggestions"
                                        value={signatures.requester.name}
                                        onChange={e => setSignatures({
                                            ...signatures,
                                            requester: { ...signatures.requester, name: e.target.value }
                                        })}
                                        placeholder="ชื่อคนทำเอกสาร / ธุรการ / แอดมิน"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    />
                                    <datalist id="voucher-requester-suggestions">
                                        {historicalSignatures.requesters.map((name, i) => (
                                            <option key={`req-${i}`} value={name} />
                                        ))}
                                    </datalist>
                                    {historicalSignatures.requesters.length > 0 && (
                                        <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                            <span className="text-[10px] text-muted-foreground/70">เลือกด่วน:</span>
                                            {historicalSignatures.requesters.slice(0, 3).map(name => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => setSignatures(prev => ({
                                                        ...prev,
                                                        requester: { ...prev.requester, name }
                                                    }))}
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-md border transition truncate max-w-[120px]",
                                                        signatures.requester.name === name
                                                            ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-xs"
                                                            : "bg-muted/50 border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    )}
                                                    title={name}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 2. ผู้ตรวจสอบงาน */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-foreground block">
                                        2. ผู้ตรวจสอบงาน:
                                    </label>
                                    <input
                                        type="text"
                                        list="voucher-inspector-suggestions"
                                        value={signatures.inspector.name}
                                        onChange={e => setSignatures({
                                            ...signatures,
                                            inspector: { ...signatures.inspector, name: e.target.value }
                                        })}
                                        placeholder="วิศวกร / โฟร์แมนตรวจงาน"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    />
                                    <datalist id="voucher-inspector-suggestions">
                                        {historicalSignatures.inspectors.map((name, i) => (
                                            <option key={`insp-${i}`} value={name} />
                                        ))}
                                    </datalist>
                                    {historicalSignatures.inspectors.length > 0 && (
                                        <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                            <span className="text-[10px] text-muted-foreground/70">เลือกด่วน:</span>
                                            {historicalSignatures.inspectors.slice(0, 3).map(name => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => setSignatures(prev => ({
                                                        ...prev,
                                                        inspector: { ...prev.inspector, name }
                                                    }))}
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-md border transition truncate max-w-[120px]",
                                                        signatures.inspector.name === name
                                                            ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-xs"
                                                            : "bg-muted/50 border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    )}
                                                    title={name}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 3. ฝ่ายบัญชีและการเงิน */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-foreground block">
                                        3. ฝ่ายบัญชีและการเงิน:
                                    </label>
                                    <input
                                        type="text"
                                        list="voucher-accountant-suggestions"
                                        value={signatures.accountant.name}
                                        onChange={e => setSignatures({
                                            ...signatures,
                                            accountant: { ...signatures.accountant, name: e.target.value }
                                        })}
                                        placeholder="ชื่อเจ้าหน้าที่บัญชี"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    />
                                    <datalist id="voucher-accountant-suggestions">
                                        {historicalSignatures.accountants.map((name, i) => (
                                            <option key={`acc-${i}`} value={name} />
                                        ))}
                                    </datalist>
                                    {historicalSignatures.accountants.length > 0 && (
                                        <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                            <span className="text-[10px] text-muted-foreground/70">เลือกด่วน:</span>
                                            {historicalSignatures.accountants.slice(0, 3).map(name => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => setSignatures(prev => ({
                                                        ...prev,
                                                        accountant: { ...prev.accountant, name }
                                                    }))}
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-md border transition truncate max-w-[120px]",
                                                        signatures.accountant.name === name
                                                            ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-xs"
                                                            : "bg-muted/50 border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    )}
                                                    title={name}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 4. ผู้อนุมัติจ่ายเงิน */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-foreground block">
                                        4. ผู้อนุมัติจ่ายเงิน:
                                    </label>
                                    <input
                                        type="text"
                                        list="voucher-payer-suggestions"
                                        value={signatures.payer.name}
                                        onChange={e => setSignatures({
                                            ...signatures,
                                            payer: { ...signatures.payer, name: e.target.value }
                                        })}
                                        placeholder="กรรมการ / หุ้นส่วนผู้จัดการ"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    />
                                    <datalist id="voucher-payer-suggestions">
                                        {historicalSignatures.payers.map((name, i) => (
                                            <option key={`pyr-${i}`} value={name} />
                                        ))}
                                    </datalist>
                                    {historicalSignatures.payers.length > 0 && (
                                        <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                            <span className="text-[10px] text-muted-foreground/70">เลือกด่วน:</span>
                                            {historicalSignatures.payers.slice(0, 3).map(name => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => setSignatures(prev => ({
                                                        ...prev,
                                                        payer: { ...prev.payer, name }
                                                    }))}
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-md border transition truncate max-w-[120px]",
                                                        signatures.payer.name === name
                                                            ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-xs"
                                                            : "bg-muted/50 border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    )}
                                                    title={name}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notice if Paid */}
                        {expenseStatus === "Paid" && (
                            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-xs">
                                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                                <div>
                                    <p className="font-bold">สถานะ: จ่ายแล้ว (Paid)</p>
                                    <p className="text-[11px] opacity-90">
                                        เมื่อกดบันทึก ระบบจะลงบัญชีรายจ่ายในหมวด Sub-contract จำนวน {fmtBaht(netPayable)} ให้ทันที
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: LIVE A4 PRINTABLE DOCUMENT PREVIEW ── */}
                    <div
                        ref={previewColRef}
                        className={cn(
                            "transition-all flex flex-col items-center",
                            viewMode === "preview" ? "w-full" : viewMode === "split" ? "w-full lg:w-[45%] xl:w-[42%]" : "hidden"
                        )}
                    >
                        {/* Preview Controls Bar */}
                        <div className="sticky top-16 z-20 my-2 px-3 py-1.5 rounded-full bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white text-xs flex items-center gap-2 shadow-xl">
                            <span className="text-[11px] font-semibold text-slate-400 pl-1">A4 Preview</span>
                            <div className="h-4 w-px bg-slate-700" />
                            <button
                                type="button"
                                onClick={() => setZoom(z => Math.max(0.4, Number((z - 0.05).toFixed(2))))}
                                className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
                                title="ย่อขนาด"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono w-11 text-center font-bold text-amber-400">{Math.round(zoom * 100)}%</span>
                            <button
                                type="button"
                                onClick={() => setZoom(z => Math.min(1.4, Number((z + 0.05).toFixed(2))))}
                                className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
                                title="ขยายขนาด"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-4 w-px bg-slate-700" />

                            <button
                                type="button"
                                onClick={handleFitScreen}
                                className="px-2.5 py-0.5 rounded-full font-bold transition text-[11px] bg-amber-500 text-slate-950 hover:bg-amber-400"
                                title="ปรับขนาดให้พอดีกับหน้าจอ"
                            >
                                พอดีจอ
                            </button>

                            <button
                                type="button"
                                onClick={() => setZoom(1.0)}
                                className={cn(
                                    "px-2 py-0.5 rounded-full font-bold transition text-[11px]",
                                    zoom === 1.0 ? "bg-amber-500 text-slate-950" : "hover:bg-slate-800 text-slate-300"
                                )}
                                title="ขนาดจริง 100% ตามหน้ากระดาษ A4 (210 × 297 มม.)"
                            >
                                100% (A4)
                            </button>

                            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-[10px] font-mono border border-slate-700">
                                210×297mm
                            </span>

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="p-1 px-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-[11px] transition shadow"
                                title="สั่งพิมพ์ หรือ บันทึกเป็น PDF"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>พิมพ์ / PDF</span>
                            </button>
                        </div>

                        {/* A4 Paper Outer Wrapper with exact scaled layout footprint */}
                        <div className="w-full flex justify-center overflow-x-auto pb-28 pt-2">
                            <div
                                style={{
                                    width: `${210 * zoom}mm`,
                                    height: `${297 * zoom}mm`,
                                    position: "relative",
                                    flexShrink: 0,
                                    boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)"
                                }}
                            >
                                <div
                                    id="printable-voucher-preview"
                                    className="bg-white text-black origin-top-left rounded-none select-text text-left border border-slate-300 flex flex-col justify-between"
                                    style={{
                                        width: "210mm",
                                        height: "297mm",
                                        maxHeight: "297mm",
                                        transform: `scale(${zoom})`,
                                        transformOrigin: "top left",
                                        padding: "14mm 16mm 14mm",
                                        boxSizing: "border-box",
                                        overflow: "hidden",
                                        fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif"
                                    }}
                                >
                                    {/* Top Section */}
                                    <div className="flex-1 flex flex-col justify-start">
                                        {/* Title Centered */}
                                        <h1 className="text-center font-bold text-lg mb-2.5 tracking-wide text-black">
                                            ใบสำคัญจ่าย (PAYMENT VOUCHER)
                                        </h1>

                                        {/* Header Row */}
                                        <div className="flex justify-between items-start gap-4 mb-2.5">
                                            <div className="flex-1 text-xs">
                                                <div className="font-bold text-sm text-black mb-0.5">
                                                    {orgProfile?.name || "บริษัท แบบบ้านสวย จำกัด"}
                                                </div>
                                                <div className="text-gray-700 leading-snug">
                                                    {orgProfile?.address || "95/47 หมู่ที่ 1 ตำบลตลาดขวัญ อำเภอเมือง จังหวัดนนทบุรี 11000"}
                                                </div>
                                                {orgProfile?.phone && (
                                                    <div className="text-gray-700">โทร {orgProfile.phone}</div>
                                                )}
                                                {orgProfile?.taxId && (
                                                    <div className="text-gray-700">เลขประจำตัวผู้เสียภาษี: {orgProfile.taxId}</div>
                                                )}
                                            </div>

                                            {/* Document Meta Table */}
                                            <div className="text-xs">
                                                <table className="border-collapse">
                                                    <tbody>
                                                        <tr>
                                                            <td className="text-right font-bold text-gray-700 pr-2 py-0.5">เลขที่:</td>
                                                            <td className="font-bold font-mono text-black">{voucherNumber || "PV-XXXXXX"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-right font-bold text-gray-700 pr-2 py-0.5">วันที่:</td>
                                                            <td>{thDateShort(date)}</td>
                                                        </tr>
                                                        {paymentDate && (
                                                            <tr>
                                                                <td className="text-right font-bold text-gray-700 pr-2 py-0.5">วันที่จ่าย:</td>
                                                                <td>{thDateShort(paymentDate)}</td>
                                                            </tr>
                                                        )}
                                                        <tr>
                                                            <td className="text-right font-bold text-gray-700 pr-2 py-0.5">สถานะ:</td>
                                                            <td className={cn("font-bold", expenseStatus === "Paid" ? "text-emerald-700" : "text-amber-700")}>
                                                                {expenseStatus === "Paid" ? "จ่ายเงินแล้ว" : "รอการจ่ายเงิน"}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-b border-black mb-2.5" />

                                        {/* Payee & Project Line */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2.5">
                                            <div>
                                                <span className="font-bold">จ่ายให้ (ผู้รับเงิน): </span>
                                                <span className="font-semibold">{currentWorker?.name || "-"}</span>
                                                {currentWorker?.phone && (
                                                    <span className="text-gray-600"> (โทร {currentWorker.phone})</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-bold">โครงการ: </span>
                                                <span>{currentProject?.name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold">หน้าที่/บทบาท: </span>
                                                <span>{newWorkerRole || "ผู้รับเหมาช่วง"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold">แผนก/หมวดงาน: </span>
                                                <span>{department || "-"}</span>
                                            </div>
                                            {workerTaxId && (
                                                <div>
                                                    <span className="font-bold">เลขประจำตัวผู้เสียภาษี: </span>
                                                    <span className="font-mono">{workerTaxId}</span>
                                                </div>
                                            )}
                                            {paymentMethod === "transfer" && accountNumber && (
                                                <div>
                                                    <span className="font-bold">โอนเข้า: </span>
                                                    <span>{bankName} เลขที่ {accountNumber} ({accountName})</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Items Table with Fixed Proportion Columns */}
                                        <table className="w-full border-collapse border border-black text-xs mb-2.5 table-fixed">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-black py-1.5 px-1.5 w-[6%] text-center font-bold">ลำดับ</th>
                                                    <th className="border border-black py-1.5 px-3 w-[56%] text-left font-bold">รายการ / ขอบเขตงาน</th>
                                                    <th className="border border-black py-1.5 px-1.5 w-[11%] text-center font-bold">จำนวน</th>
                                                    <th className="border border-black py-1.5 px-2 w-[13%] text-right font-bold">ราคา/หน่วย</th>
                                                    <th className="border border-black py-1.5 px-2.5 w-[14%] text-right font-bold">จำนวนเงิน (บาท)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((it, idx) => (
                                                    <tr key={`preview-item-${it.id || idx}-${idx}`}>
                                                        <td className="border border-black py-1 px-1.5 text-center align-top">{idx + 1}</td>
                                                        <td className="border border-black py-1 px-3 align-top break-words">
                                                            <div className="font-semibold text-black leading-snug">{it.description || "-"}</div>
                                                            {it.notes && (
                                                                <div className="text-[11px] text-gray-600 leading-snug mt-0.5 whitespace-pre-wrap">{it.notes}</div>
                                                            )}
                                                        </td>
                                                        <td className="border border-black py-1 px-2 text-center align-top whitespace-nowrap">
                                                            {it.quantity} {it.unit}
                                                        </td>
                                                        <td className="border border-black py-1 px-2 text-right align-top whitespace-nowrap">
                                                            {it.unitPrice > 0 ? fmtNum(it.unitPrice) : "-"}
                                                        </td>
                                                        <td className="border border-black py-1 px-3 text-right font-bold align-top whitespace-nowrap">
                                                            {fmtNum(it.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Blank filler rows to look like official form */}
                                                {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                                                    <tr key={`preview-blank-${i}`} className="h-6">
                                                        <td className="border border-black text-center text-gray-300 text-[10px]">{items.length + i + 1}</td>
                                                        <td className="border border-black"></td>
                                                        <td className="border border-black"></td>
                                                        <td className="border border-black"></td>
                                                        <td className="border border-black"></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Summary Table & Deductions */}
                                        <div className="flex justify-between items-start text-xs mb-3">
                                            {/* Left: Baht Text & Notes */}
                                            <div className="w-[56%] space-y-1.5">
                                                <div className="p-2 border border-black bg-gray-50 rounded">
                                                    <span className="font-bold">จำนวนเงินตัวอักษร: </span>
                                                    <span className="font-bold text-gray-900">{bahtText(netPayable)}</span>
                                                </div>

                                                {terms && (
                                                    <div className="text-[11px] text-gray-700 leading-tight">
                                                        <span className="font-bold">เงื่อนไข: </span>{terms}
                                                    </div>
                                                )}

                                                {inspectionNote && (
                                                    <div className="text-[11px] text-gray-700 leading-tight">
                                                        <span className="font-bold">ผลการตรวจงาน: </span>{inspectionNote}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Numbers Table */}
                                            <div className="w-[42%] text-xs">
                                                <table className="w-full border-collapse">
                                                    <tbody>
                                                        <tr>
                                                            <td className="py-0.5 text-gray-700">รวมเงินตามรายการ:</td>
                                                            <td className="py-0.5 text-right font-bold">{fmtNum(subtotal)}</td>
                                                        </tr>
                                                        {useRetention && computedRetention > 0 && (
                                                            <tr>
                                                                <td className="py-0.5 text-gray-700">หักประกันผลงาน ({retentionPercent}%):</td>
                                                                <td className="py-0.5 text-right text-red-600 font-bold">- {fmtNum(computedRetention)}</td>
                                                            </tr>
                                                        )}
                                                        {useWht && computedWht > 0 && (
                                                            <tr>
                                                                <td className="py-0.5 text-gray-700">หัก ณ ที่จ่าย ({whtRate}%):</td>
                                                                <td className="py-0.5 text-right text-red-600 font-bold">- {fmtNum(computedWht)}</td>
                                                            </tr>
                                                        )}
                                                        {useDeduction && computedDeduction > 0 && (
                                                            <tr>
                                                                <td className="py-0.5 text-gray-700">หักค่าใช้จ่ายสำรอง:</td>
                                                                <td className="py-0.5 text-right text-red-600 font-bold">- {fmtNum(computedDeduction)}</td>
                                                            </tr>
                                                        )}
                                                        <tr className="border-t border-black font-bold text-sm">
                                                            <td className="pt-1 text-black">ยอดจ่ายสุทธิ:</td>
                                                            <td className="pt-1 text-right text-black">{fmtNum(netPayable)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signatures 4 Boxes across 1 row (Classic Thai voucher standard) */}
                                    <div className="shrink-0 pt-3 border-t border-black text-xs text-center">
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="space-y-1 px-1">
                                                <div className="h-8 flex items-end justify-center mb-1">
                                                    <div className="w-full max-w-[125px] border-b border-dotted border-black" />
                                                </div>
                                                <div className="font-bold text-[11px] truncate" title={signatures.requester.name}>
                                                    ({signatures.requester.name || "...................................."})
                                                </div>
                                                <div className="text-[10px] text-gray-700 leading-tight">{signatures.requester.label}</div>
                                                <div className="text-[9.5px] text-gray-500 mt-0.5">วันที่: ..... / ..... / .........</div>
                                            </div>

                                            <div className="space-y-1 px-1">
                                                <div className="h-8 flex items-end justify-center mb-1">
                                                    <div className="w-full max-w-[125px] border-b border-dotted border-black" />
                                                </div>
                                                <div className="font-bold text-[11px] truncate" title={signatures.inspector.name}>
                                                    ({signatures.inspector.name || "...................................."})
                                                </div>
                                                <div className="text-[10px] text-gray-700 leading-tight">{signatures.inspector.label}</div>
                                                <div className="text-[9.5px] text-gray-500 mt-0.5">วันที่: ..... / ..... / .........</div>
                                            </div>

                                            <div className="space-y-1 px-1">
                                                <div className="h-8 flex items-end justify-center mb-1">
                                                    <div className="w-full max-w-[125px] border-b border-dotted border-black" />
                                                </div>
                                                <div className="font-bold text-[11px] truncate" title={signatures.accountant.name}>
                                                    ({signatures.accountant.name || "...................................."})
                                                </div>
                                                <div className="text-[10px] text-gray-700 leading-tight">{signatures.accountant.label}</div>
                                                <div className="text-[9.5px] text-gray-500 mt-0.5">วันที่: ..... / ..... / .........</div>
                                            </div>

                                            <div className="space-y-1 px-1">
                                                <div className="h-8 flex items-end justify-center mb-1">
                                                    <div className="w-full max-w-[125px] border-b border-dotted border-black" />
                                                </div>
                                                <div className="font-bold text-[11px] truncate" title={signatures.payer.name}>
                                                    ({signatures.payer.name || "...................................."})
                                                </div>
                                                <div className="text-[10px] text-gray-700 leading-tight">{signatures.payer.label}</div>
                                                <div className="text-[9.5px] text-gray-500 mt-0.5">วันที่: ..... / ..... / .........</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────────
                BOTTOM FIXED ACTION BAR
               ───────────────────────────────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border shadow-lg p-3 sm:p-4">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/vouchers"
                            className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs sm:text-sm font-semibold transition"
                        >
                            ยกเลิก
                        </Link>
                        <div className="text-xs hidden sm:block">
                            <span className="text-muted-foreground">ยอดสุทธิที่ต้องชำระ: </span>
                            <span className="font-bold text-foreground text-sm tabular-nums">
                                {fmtBaht(netPayable)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold transition flex items-center gap-1.5"
                        >
                            <Printer className="w-4 h-4 text-primary" />
                            <span>ดูตัวอย่าง / พิมพ์ A4</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSubmitting ? "กำลังบันทึก..." : "ออกใบเบิกงวด"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
