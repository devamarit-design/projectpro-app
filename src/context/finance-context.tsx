"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, limit, getDocs, getDoc } from "firebase/firestore"
import { useOrganization } from "@/context/organization-context"
import { logActivity } from "@/lib/activity-logger"
import { Expense, IncomeDocument, Vendor, Customer, Worker, Contract, ContractInstallment, ContractDraw } from "./project-context"
import { getInstallmentDrawn, getInstallmentState, nextDrawLabel, generateContractNumber, generateVoucherNumber, todayISO } from "@/lib/contract-utils"

export interface StandaloneVoucherInput {
    voucherNumber?: string
    projectId: string
    workerId: string
    title: string
    amount: number
    date: string
    paymentDate?: string
    expenseStatus: "Paid" | "Pending"
    note?: string
    responsibleRole?: string
    department?: string
    signatures?: {
        requester?: { name: string; label?: string }
        inspector?: { name: string; label?: string }
        accountant?: { name: string; label?: string }
        payer?: { name: string; label?: string }
    }
    items?: Array<{ id?: string; description: string; amount: number; notes?: string }>
}

export interface DrawInstallmentInput {
    amount: number
    date: string
    paymentDate?: string
    voucherNumber?: string
    department?: string
    responsibleRole?: string
    signatures?: {
        requester?: { name: string; label?: string }
        inspector?: { name: string; label?: string }
        accountant?: { name: string; label?: string }
        payer?: { name: string; label?: string }
    }
    items?: Array<{ id?: string; description: string; amount: number; notes?: string }>
    note?: string
    expenseStatus: "Paid" | "Pending"
}

/** Recompute installment status from its draws */
function withComputedStatus(inst: ContractInstallment, index: number): ContractInstallment {
    const state = getInstallmentState(inst, index)
    const next: ContractInstallment = { ...inst, status: state }
    if (state === "Paid") next.paidAt = inst.paidAt || new Date().toISOString()
    else delete next.paidAt
    return next
}

/** Firestore rejects `undefined` values — strip them recursively from plain objects/arrays */
function stripUndefined<T>(value: T): T {
    if (Array.isArray(value)) return value.map(stripUndefined) as unknown as T
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {}
        Object.entries(value as Record<string, unknown>).forEach(([k, v]) => { if (v !== undefined) out[k] = stripUndefined(v) })
        return out as T
    }
    return value
}

interface FinanceContextType {
    expenses: Expense[]
    archivedExpenses: Expense[]
    incomes: IncomeDocument[]
    vendors: Vendor[]
    customers: Customer[]
    workers: Worker[]
    contracts: Contract[]
    addExpense: (expense: Omit<Expense, "id" | "createdAt" | "orgId">) => Promise<string | undefined>
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
    deleteExpense: (id: string, permanent?: boolean) => Promise<void>
    restoreExpense: (id: string) => Promise<void>
    addIncome: (income: Omit<IncomeDocument, "id" | "createdAt" | "orgId">) => Promise<string | undefined>
    updateIncome: (id: string, updates: Partial<IncomeDocument>) => Promise<void>
    deleteIncome: (id: string, permanent?: boolean) => Promise<void>
    restoreIncome: (id: string) => Promise<void>

    // Master Data
    addVendor: (vendor: Omit<Vendor, "id" | "status">) => Promise<void>
    updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>
    deleteVendor: (id: string) => Promise<void>

    addWorker: (worker: Omit<Worker, "id" | "status">) => Promise<void>
    updateWorker: (id: string, updates: Partial<Worker>) => Promise<void>
    deleteWorker: (id: string) => Promise<void>

    addCustomer: (customer: Omit<Customer, "id" | "status" | "totalValue">) => Promise<void>
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>
    deleteCustomer: (id: string) => Promise<void>

    // Contracts
    addContract: (contract: Omit<Contract, "id" | "createdAt" | "status">) => Promise<void>
    updateContract: (id: string, updates: Partial<Contract>) => Promise<void>
    deleteContract: (id: string, permanent?: boolean) => Promise<void>
    restoreContract: (id: string) => Promise<void>
    payInstallment: (contractId: string, installmentId: string) => Promise<void>
    unpayInstallment: (contractId: string, installmentId: string) => Promise<void>
    /** เบิกงวด (full or partial) → creates an Expense and records the draw on the contract */
    drawInstallment: (contractId: string, installmentId: string, input: DrawInstallmentInput) => Promise<{ expenseId?: string; label: string; drawId?: string } | undefined>
    /** ยกเลิกการเบิก → removes the draw and moves its Expense to trash */
    cancelDraw: (contractId: string, installmentId: string, drawId: string) => Promise<void>
    markDrawAsPaid: (contractId: string, installmentId: string, drawId: string, paymentDate?: string) => Promise<void>
    updateDraw: (contractId: string, installmentId: string, drawId: string, updates: Partial<ContractDraw>) => Promise<void>
    createStandaloneVoucher: (input: StandaloneVoucherInput) => Promise<{ contractId: string; drawId: string; expenseId?: string; voucherNumber: string } | undefined>

    // Archive
    archiveExpense: (id: string) => Promise<void>
    unarchiveExpense: (id: string) => Promise<void>
    archiveIncome: (id: string) => Promise<void>
    unarchiveIncome: (id: string) => Promise<void>
    archiveContract: (id: string) => Promise<void>
    unarchiveContract: (id: string) => Promise<void>

    loadArchivedExpenses: () => Promise<void>
    loadArchivedIncomes: () => Promise<void>

    isLoading: boolean
    isArchivedLoading: boolean
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children, currentUser }: { children: React.ReactNode, currentUser: any }) {
    const { currentOrg: currentTeam } = useOrganization()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [incomes, setIncomes] = useState<IncomeDocument[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [workers, setWorkers] = useState<Worker[]>([])
    const [contracts, setContracts] = useState<Contract[]>([])
    const [archivedExpenses, setArchivedExpenses] = useState<Expense[]>([])
    const [archivedIncomes, setArchivedIncomes] = useState<IncomeDocument[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isArchivedLoading, setIsArchivedLoading] = useState(false)



    // Listeners
    useEffect(() => {
        if (!currentTeam?.id) return
        setIsLoading(true)

        // 1. Expenses (Active & Ordered)
        // QUERY: Query by orgId and sort client-side to ensure docs with custom/missing dates are never dropped
        const qExpenses = query(
            collection(db, "expenses"),
            where("orgId", "==", currentTeam.id)
        )
        const unsubExpenses = onSnapshot(qExpenses, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense))
            // Sort client-side by date / createdAt descending
            data.sort((a, b) => {
                const timeA = new Date(a.date || a.createdAt || 0).getTime()
                const timeB = new Date(b.date || b.createdAt || 0).getTime()
                return timeB - timeA
            })
            // CLIENT-SIDE FILTER: Include if isArchived is false OR undefined AND isDeleted is not true
            setExpenses(data.filter(d => d.isArchived !== true && d.isDeleted !== true))
        }, (error) => console.error("[FinanceContext] Expenses sync error:", error))

        // 2. Incomes (Active & Ordered)
        const qIncomes = query(
            collection(db, "incomes"),
            where("orgId", "==", currentTeam.id)
        )
        const unsubIncomes = onSnapshot(qIncomes, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as IncomeDocument))
            data.sort((a, b) => {
                const timeA = new Date(a.date || a.createdAt || 0).getTime()
                const timeB = new Date(b.date || b.createdAt || 0).getTime()
                return timeB - timeA
            })
            // CLIENT-SIDE FILTER
            setIncomes(data.filter(d => d.isArchived !== true && d.isDeleted !== true))
        }, (error) => console.error("[FinanceContext] Incomes sync error:", error))

        // 3. Master Data (Unlimited to ensure dropdowns are complete)
        const qVendors = query(collection(db, "vendors"), where("orgId", "==", currentTeam.id))
        const qCustomers = query(collection(db, "customers"), where("orgId", "==", currentTeam.id))
        const qWorkers = query(collection(db, "workers"), where("orgId", "==", currentTeam.id))
        const qContracts = query(collection(db, "contracts"), where("orgId", "==", currentTeam.id))

        const unsubVendors = onSnapshot(qVendors, (snap) => setVendors(snap.docs.map(d => ({ ...d.data(), id: d.id } as Vendor))))
        const unsubCustomers = onSnapshot(qCustomers, (snap) => setCustomers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer))))
        const unsubWorkers = onSnapshot(qWorkers, (snap) => setWorkers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Worker))))
        const unsubContracts = onSnapshot(qContracts, (snap) => setContracts(snap.docs.map(d => ({ ...d.data(), id: d.id } as Contract)).filter(d => d.isDeleted !== true)))

        setIsLoading(false)
        return () => {
            unsubExpenses()
            unsubIncomes()
            unsubVendors()
            unsubCustomers()
            unsubWorkers()
            unsubContracts()
        }
    }, [currentTeam?.id])

    const loadArchivedExpenses = useCallback(async () => {
        if (!currentTeam?.id || archivedExpenses.length > 0) return
        setIsArchivedLoading(true)
        try {
            const q = query(
                collection(db, "expenses"),
                where("orgId", "==", currentTeam.id),
                where("isArchived", "==", true),
                orderBy("date", "desc"),
                limit(100)
            )
            const snap = await getDocs(q)
            setArchivedExpenses(snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense)))
        } catch (e) { console.error(e) } finally { setIsArchivedLoading(false) }
    }, [currentTeam?.id, archivedExpenses.length])

    const loadArchivedIncomes = useCallback(async () => {
        if (!currentTeam?.id || archivedIncomes.length > 0) return
        setIsArchivedLoading(true)
        try {
            const q = query(
                collection(db, "incomes"),
                where("orgId", "==", currentTeam.id),
                where("isArchived", "==", true),
                orderBy("date", "desc"),
                limit(100)
            )
            const snap = await getDocs(q)
            setArchivedIncomes(snap.docs.map(d => ({ ...d.data(), id: d.id } as IncomeDocument)))
        } catch (e) { console.error(e) } finally { setIsArchivedLoading(false) }
    }, [currentTeam?.id, archivedIncomes.length])

    // Finance Actions
    const addExpense = useCallback(async (expenseData: Omit<Expense, "id" | "createdAt" | "orgId">) => {
        const targetOrgId = (expenseData as any).orgId || currentTeam?.id || currentUser?.orgIds?.[0] || (typeof window !== "undefined" ? localStorage.getItem("lastOrgId") : null)
        if (!targetOrgId) {
            console.error("[FinanceContext] Cannot add expense: missing organization ID")
            return
        }
        try {
            const payload = {
                ...expenseData,
                date: expenseData.date || new Date().toISOString().split("T")[0],
                orgId: targetOrgId,
                createdAt: new Date().toISOString(),
                createdBy: currentUser?.id || "",
                createdByName: currentUser?.name || ""
            }
            const docRef = await addDoc(collection(db, "expenses"), payload)
            // Fire-and-forget: don't block the caller waiting for activity log
            logActivity(db, targetOrgId, {
                action: "CREATE",
                entityType: "EXPENSE",
                entityId: docRef.id,
                entityTitle: expenseData.title,
                details: `Created new expense: ${expenseData.title}`,
                performedBy: {
                    uid: currentUser?.id,
                    name: currentUser?.name,
                    role: currentUser?.role
                },
                relatedUserIds: []
            }).catch((e: any) => console.warn("[logActivity] expense log failed:", e))
            return docRef.id
        } catch (e: any) {
            console.error("Error adding expense:", e)
            // Re-throw to allow UI to handle specific errors (e.g. permission-denied)
            throw e
        }
    }, [currentTeam, currentUser])

    /** Apply a mutation to a single draw on a contract (reads fresh from Firestore). */
    const mutateContractDraw = useCallback(async (
        contractId: string,
        installmentId: string,
        mutate: (draws: ContractDraw[]) => ContractDraw[]
    ) => {
        const ref = doc(db, "contracts", contractId)
        const snap = await getDoc(ref)
        if (!snap.exists()) return
        const contract = snap.data() as Contract
        const installments = (contract.installments || []).map((inst, i) => {
            if (inst.id !== installmentId) return inst
            return withComputedStatus({ ...inst, draws: mutate(inst.draws || []) }, i)
        })
        await updateDoc(ref, { installments: stripUndefined(installments), updatedAt: new Date().toISOString() })
    }, [])

    const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
        const original = [...expenses]
        const current = expenses.find(e => e.id === id)
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e))
        try {
            await updateDoc(doc(db, "expenses", id), { ...updates, updatedAt: new Date().toISOString() })
            // Keep the linked contract draw in sync (amount / status / date)
            if (current?.contractId && current.contractInstallmentId && current.contractDrawId &&
                (updates.totalValue !== undefined || updates.status !== undefined || updates.date !== undefined)) {
                await mutateContractDraw(current.contractId, current.contractInstallmentId, draws => draws.map(d => d.id !== current.contractDrawId ? d : {
                    ...d,
                    amount: updates.totalValue !== undefined ? Number(updates.totalValue) || 0 : d.amount,
                    expenseStatus: updates.status !== undefined ? (updates.status === "Paid" ? "Paid" : "Pending") : d.expenseStatus,
                    date: updates.date || d.date
                }))
            }
        } catch (e) {
            setExpenses(original)
        }
    }, [expenses, mutateContractDraw])

    const deleteExpense = useCallback(async (id: string, permanent?: boolean) => {
        const original = [...expenses]
        const current = expenses.find(e => e.id === id)
        setExpenses(prev => prev.filter(e => e.id !== id))
        try {
            if (permanent) {
                await deleteDoc(doc(db, "expenses", id))
            } else {
                await updateDoc(doc(db, "expenses", id), { isDeleted: true, deletedAt: new Date().toISOString() })
            }
            // Expense created from a contract draw → remove that draw so the installment becomes available again
            if (current?.contractId && current.contractInstallmentId && current.contractDrawId) {
                await mutateContractDraw(current.contractId, current.contractInstallmentId, draws => draws.filter(d => d.id !== current.contractDrawId))
            }
        } catch (e) {
            setExpenses(original)
        }
    }, [expenses, mutateContractDraw])

    const restoreExpense = useCallback(async (id: string) => {
        try {
            await updateDoc(doc(db, "expenses", id), { isDeleted: false })
            // Restoring a contract-draw expense from trash → put the draw back on the contract
            const snap = await getDoc(doc(db, "expenses", id))
            const exp = snap.exists() ? (snap.data() as Expense) : null
            if (exp?.contractId && exp.contractInstallmentId && exp.contractDrawId) {
                const drawId = exp.contractDrawId
                await mutateContractDraw(exp.contractId, exp.contractInstallmentId, draws => draws.some(d => d.id === drawId) ? draws : [...draws, {
                    id: drawId,
                    label: exp.contractDrawLabel || "",
                    amount: Number(exp.totalValue) || 0,
                    date: exp.date,
                    expenseId: id,
                    expenseStatus: exp.status === "Paid" ? "Paid" : "Pending",
                    createdAt: exp.createdAt || new Date().toISOString()
                }])
            }
        } catch (e) { console.error(e) }
    }, [mutateContractDraw])

    const addIncome = useCallback(async (incomeData: Omit<IncomeDocument, "id" | "createdAt" | "orgId">) => {
        if (!currentTeam) return
        try {
            const payload = {
                ...incomeData,
                orgId: currentTeam.id,
                createdAt: new Date().toISOString()
            }
            const docRef = await addDoc(collection(db, "incomes"), payload)
            logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "INCOME",
                entityId: docRef.id,
                entityTitle: incomeData.documentNumber,
                details: `Created new income document: ${incomeData.documentNumber}`,
                performedBy: {
                    uid: currentUser?.id,
                    name: currentUser?.name,
                    role: currentUser?.role
                },
                relatedUserIds: []
            })
            return docRef.id
        } catch (e) {
            console.error("Error adding income:", e)
            return undefined
        }
    }, [currentTeam, currentUser])

    const updateIncome = useCallback(async (id: string, updates: Partial<IncomeDocument>) => {
        const original = [...incomes]
        setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i))
        try {
            await updateDoc(doc(db, "incomes", id), { ...updates, updatedAt: new Date().toISOString() })
        } catch (e) {
            setIncomes(original)
        }
    }, [incomes])

    const deleteIncome = useCallback(async (id: string, permanent?: boolean) => {
        const original = [...incomes]
        setIncomes(prev => prev.filter(i => i.id !== id))
        try {
            if (permanent) {
                await deleteDoc(doc(db, "incomes", id))
            } else {
                await updateDoc(doc(db, "incomes", id), { isDeleted: true, deletedAt: new Date().toISOString() })
            }
        } catch (e) {
            setIncomes(original)
        }
    }, [incomes])

    const restoreIncome = useCallback(async (id: string) => {
        try {
            await updateDoc(doc(db, "incomes", id), { isDeleted: false })
        } catch (e) { console.error(e) }
    }, [])

    // Master Data Actions
    const addVendor = useCallback(async (vendor: Omit<Vendor, "id" | "status">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "vendors"), {
                ...vendor,
                orgId: currentTeam.id,
                status: "Active",
                createdAt: new Date().toISOString()
            })
        } catch (e) { console.error(e) }
    }, [currentTeam])

    const updateVendor = useCallback(async (id: string, updates: Partial<Vendor>) => {
        try { await updateDoc(doc(db, "vendors", id), { ...updates, updatedAt: new Date().toISOString() }) } catch (e) { console.error(e) }
    }, [])

    const deleteVendor = useCallback(async (id: string) => {
        try { await deleteDoc(doc(db, "vendors", id)) } catch (e) { console.error(e) }
    }, [])

    const addWorker = useCallback(async (worker: Omit<Worker, "id" | "status">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "workers"), {
                ...worker,
                orgId: currentTeam.id,
                status: "Active",
                createdAt: new Date().toISOString()
            })
        } catch (e) { console.error(e) }
    }, [currentTeam])

    const updateWorker = useCallback(async (id: string, updates: Partial<Worker>) => {
        try { await updateDoc(doc(db, "workers", id), { ...updates, updatedAt: new Date().toISOString() }) } catch (e) { console.error(e) }
    }, [])

    const deleteWorker = useCallback(async (id: string) => {
        try { await deleteDoc(doc(db, "workers", id)) } catch (e) { console.error(e) }
    }, [])

    const addCustomer = useCallback(async (customer: Omit<Customer, "id" | "status" | "totalValue">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "customers"), {
                ...customer,
                orgId: currentTeam.id,
                status: "Active",
                totalValue: 0,
                createdAt: new Date().toISOString()
            })
        } catch (e) { console.error(e) }
    }, [currentTeam])

    const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
        try { await updateDoc(doc(db, "customers", id), { ...updates, updatedAt: new Date().toISOString() }) } catch (e) { console.error(e) }
    }, [])

    const deleteCustomer = useCallback(async (id: string) => {
        try { await deleteDoc(doc(db, "customers", id)) } catch (e) { console.error(e) }
    }, [])

    const addContract = useCallback(async (contract: Omit<Contract, "id" | "createdAt" | "status">) => {
        if (!currentTeam) return
        try {
            const documentNumber = contract.documentNumber?.trim() || generateContractNumber(contracts)

            const docRef = await addDoc(collection(db, "contracts"), stripUndefined({
                ...contract,
                documentNumber,
                createdAt: new Date().toISOString(),
                status: "Active",
                orgId: currentTeam.id
            }))

            logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "CONTRACT",
                entityId: docRef.id,
                entityTitle: `${documentNumber} - ${contract.title}`,
                details: `Created contract ${documentNumber} with total amount: ${contract.totalAmount}`,
                performedBy: {
                    uid: currentUser?.id || "unknown",
                    name: currentUser?.name || "Unknown",
                    role: currentUser?.role || "Staff"
                },
                relatedUserIds: [contract.workerId]
            })
        } catch (e) { console.error(e) }
    }, [currentTeam, currentUser, contracts])

    const updateContract = useCallback(async (id: string, updates: Partial<Contract>) => {
        try { await updateDoc(doc(db, "contracts", id), stripUndefined({ ...updates, updatedAt: new Date().toISOString() })) } catch (e) { console.error(e) }
    }, [])

    const deleteContract = useCallback(async (id: string, permanent?: boolean) => {
        try {
            if (permanent) {
                await deleteDoc(doc(db, "contracts", id))
            } else {
                await updateDoc(doc(db, "contracts", id), { isDeleted: true, deletedAt: new Date().toISOString() })
            }
        } catch (e) { console.error(e) }
    }, [])

    const restoreContract = useCallback(async (id: string) => {
        try {
            await updateDoc(doc(db, "contracts", id), { isDeleted: false })
        } catch (e) { console.error(e) }
    }, [])

    const drawInstallment = useCallback(async (contractId: string, installmentId: string, input: DrawInstallmentInput) => {
        if (!currentTeam) return
        const ref = doc(db, "contracts", contractId)
        const snap = await getDoc(ref)
        if (!snap.exists()) throw new Error("ไม่พบสัญญา")
        const contract = { ...(snap.data() as Contract), id: contractId }
        const index = contract.installments.findIndex(i => i.id === installmentId)
        const inst = contract.installments[index]
        if (!inst) throw new Error("ไม่พบงวดงาน")

        const amount = Math.round((Number(input.amount) || 0) * 100) / 100
        const remaining = inst.amount - getInstallmentDrawn(inst, index)
        if (amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0")
        if (amount > remaining + 0.009) throw new Error(`เกินยอดคงเหลือของงวด (คงเหลือ ฿${remaining.toLocaleString()})`)

        const label = nextDrawLabel(inst, index, amount)
        const drawId = Math.random().toString(36).slice(2, 10)
        const worker = workers.find(w => w.id === contract.workerId)
        const docNo = contract.documentNumber || "สัญญา"

        const voucherNo = input.voucherNumber || `PV-${docNo}-${label}`
        const expenseItems = (input.items && input.items.length > 0)
            ? input.items.map((it, i) => ({
                id: it.id || `item-${i}`,
                description: it.description,
                amount: Number(it.amount) || 0,
                category: "Sub-contract"
            }))
            : [{ id: drawId, description: `${contract.title} — งวดที่ ${label}${input.note ? ` (${input.note})` : ""}`, amount, category: "Sub-contract" }]

        const expenseId = await addExpense({
            title: `${voucherNo} งวดที่ ${label} - ${inst.description}`,
            amount: `฿${amount.toLocaleString()}`,
            totalValue: amount,
            date: input.date,
            category: "Sub-contract",
            status: input.expenseStatus,
            projectId: contract.projectId,
            payee: worker?.name || "ผู้รับเหมา",
            items: expenseItems as any,
            contractId,
            contractInstallmentId: installmentId,
            contractDrawId: drawId,
            contractDrawLabel: label
        })

        const draw: ContractDraw = {
            id: drawId,
            label,
            voucherNumber: voucherNo,
            amount,
            date: input.date,
            paymentDate: input.paymentDate,
            department: input.department,
            responsibleRole: input.responsibleRole,
            signatures: input.signatures,
            items: input.items,
            note: input.note || undefined,
            expenseId,
            expenseStatus: input.expenseStatus,
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.name || undefined
        }
        await mutateContractDraw(contractId, installmentId, draws => [...draws, draw])

        logActivity(db, currentTeam.id, {
            action: "UPDATE",
            entityType: "CONTRACT",
            entityId: contractId,
            entityTitle: `${docNo} - ${contract.title}`,
            details: `ออกใบเบิกงวดที่ ${label} (${voucherNo}) จำนวน ฿${amount.toLocaleString()} [${input.expenseStatus === "Paid" ? "จ่ายแล้ว" : "รอจ่าย"}]`,
            performedBy: { uid: currentUser?.id || "unknown", name: currentUser?.name || "Unknown", role: currentUser?.role || "Staff" },
            relatedUserIds: [contract.workerId]
        }).catch(() => { })

        return { expenseId, label, drawId }
    }, [currentTeam, currentUser, workers, addExpense, mutateContractDraw])

    const markDrawAsPaid = useCallback(async (contractId: string, installmentId: string, drawId: string, paymentDate?: string) => {
        const ref = doc(db, "contracts", contractId)
        const snap = await getDoc(ref)
        if (!snap.exists()) return
        const contract = snap.data() as Contract
        const index = contract.installments.findIndex(i => i.id === installmentId)
        const inst = contract.installments[index]
        if (!inst) return

        const effectivePaymentDate = paymentDate || new Date().toISOString().split("T")[0]
        let expenseIdToUpdate: string | undefined
        let targetDraw: ContractDraw | undefined

        await mutateContractDraw(contractId, installmentId, draws => draws.map(d => {
            if (d.id === drawId) {
                expenseIdToUpdate = d.expenseId
                targetDraw = d
                return { ...d, expenseStatus: "Paid", paymentDate: effectivePaymentDate }
            }
            return d
        }))

        if (expenseIdToUpdate) {
            await updateDoc(doc(db, "expenses", expenseIdToUpdate), {
                status: "Paid",
                date: effectivePaymentDate,
                updatedAt: new Date().toISOString()
            }).catch(e => console.error(e))
        } else if (targetDraw) {
            // If draw had no linked expense, create it now as Paid
            const worker = workers.find(w => w.id === contract.workerId)
            const voucherNo = targetDraw.voucherNumber || `PV-${contract.documentNumber || "CT"}-${targetDraw.label}`
            const createdExpenseId = await addExpense({
                title: `${voucherNo} งวดที่ ${targetDraw.label} - ${inst.description}`,
                amount: `฿${targetDraw.amount.toLocaleString()}`,
                totalValue: targetDraw.amount,
                date: effectivePaymentDate,
                category: "Sub-contract",
                status: "Paid",
                projectId: contract.projectId,
                payee: worker?.name || "ผู้รับเหมา",
                contractId,
                contractInstallmentId: installmentId,
                contractDrawId: drawId,
                contractDrawLabel: targetDraw.label
            })
            if (createdExpenseId) {
                await mutateContractDraw(contractId, installmentId, draws => draws.map(d => {
                    if (d.id === drawId) return { ...d, expenseId: createdExpenseId }
                    return d
                }))
            }
        }

        if (currentTeam) {
            logActivity(db, currentTeam.id, {
                action: "UPDATE",
                entityType: "CONTRACT",
                entityId: contractId,
                entityTitle: `${contract.documentNumber || "สัญญา"} - ${contract.title}`,
                details: `เปลี่ยนสถานะใบเบิกงวด (${targetDraw?.voucherNumber || "งวด " + (targetDraw?.label || "")}) เป็นจ่ายแล้ว (Paid) เมื่อ ${effectivePaymentDate}`,
                performedBy: { uid: currentUser?.id || "unknown", name: currentUser?.name || "Unknown", role: currentUser?.role || "Staff" },
                relatedUserIds: [contract.workerId]
            }).catch(() => { })
        }
    }, [currentTeam, currentUser, mutateContractDraw, workers, addExpense])

    const updateDraw = useCallback(async (contractId: string, installmentId: string, drawId: string, updates: Partial<ContractDraw>) => {
        await mutateContractDraw(contractId, installmentId, draws => draws.map(d => {
            if (d.id === drawId) {
                return { ...d, ...updates }
            }
            return d
        }))

        const snap = await getDoc(doc(db, "contracts", contractId))
        const c = snap.data() as Contract
        const inst = c?.installments?.find(i => i.id === installmentId)
        const d = inst?.draws?.find(dr => dr.id === drawId)
        if (d?.expenseId) {
            const expUpdates: any = {}
            if (updates.expenseStatus) expUpdates.status = updates.expenseStatus
            if (updates.amount) {
                expUpdates.totalValue = updates.amount
                expUpdates.amount = `฿${updates.amount.toLocaleString()}`
            }
            if (updates.date) expUpdates.date = updates.date
            if (updates.paymentDate && (updates.expenseStatus === "Paid" || d.expenseStatus === "Paid")) {
                expUpdates.date = updates.paymentDate
            }
            if (updates.voucherNumber) {
                expUpdates.title = `${updates.voucherNumber} งวดที่ ${d.label} - ${inst?.description || ""}`
            }
            if (updates.items && updates.items.length > 0) {
                expUpdates.items = updates.items.map((it, i) => ({
                    id: it.id || `item-${i}`,
                    description: it.description,
                    amount: Number(it.amount) || 0,
                    category: "Sub-contract"
                }))
            }
            if (Object.keys(expUpdates).length > 0) {
                await updateDoc(doc(db, "expenses", d.expenseId), {
                    ...expUpdates,
                    updatedAt: new Date().toISOString()
                }).catch(e => console.error(e))
            }
        }
    }, [mutateContractDraw])

    const cancelDraw = useCallback(async (contractId: string, installmentId: string, drawId: string) => {
        const ref = doc(db, "contracts", contractId)
        const snap = await getDoc(ref)
        if (!snap.exists()) return
        const contract = snap.data() as Contract
        const index = contract.installments.findIndex(i => i.id === installmentId)
        const inst = contract.installments[index]
        if (!inst) return

        // Legacy installment paid before the draw system existed
        if (drawId.startsWith("legacy-")) {
            if (inst.expenseId) {
                await updateDoc(doc(db, "expenses", inst.expenseId), { isDeleted: true, deletedAt: new Date().toISOString() }).catch(() => { })
            }
            const installments = contract.installments.map(i => {
                if (i.id !== installmentId) return i
                const { paidAt, expenseId, ...rest } = i
                return { ...rest, status: "Pending" as const }
            })
            await updateDoc(ref, { installments: stripUndefined(installments), updatedAt: new Date().toISOString() })
            return
        }

        const draw = (inst.draws || []).find(d => d.id === drawId)
        if (draw?.expenseId) {
            await updateDoc(doc(db, "expenses", draw.expenseId), { isDeleted: true, deletedAt: new Date().toISOString() }).catch(() => { })
        }
        await mutateContractDraw(contractId, installmentId, draws => draws.filter(d => d.id !== drawId))
    }, [mutateContractDraw])

    /** Legacy API: pay the full remaining amount of an installment */
    const payInstallment = useCallback(async (contractId: string, installmentId: string) => {
        const contract = contracts.find(c => c.id === contractId)
        const index = contract?.installments.findIndex(i => i.id === installmentId) ?? -1
        if (!contract || index < 0) return
        const inst = contract.installments[index]
        const remaining = inst.amount - getInstallmentDrawn(inst, index)
        if (remaining <= 0) return
        try {
            await drawInstallment(contractId, installmentId, { amount: remaining, date: new Date().toISOString().split("T")[0], expenseStatus: "Paid" })
        } catch (e) { console.error(e) }
    }, [contracts, drawInstallment])

    /** Legacy API: cancel every draw of an installment */
    const unpayInstallment = useCallback(async (contractId: string, installmentId: string) => {
        const contract = contracts.find(c => c.id === contractId)
        const index = contract?.installments.findIndex(i => i.id === installmentId) ?? -1
        if (!contract || index < 0) return
        const inst = contract.installments[index]
        const draws = inst.draws && inst.draws.length > 0 ? inst.draws : (inst.status === "Paid" ? [{ id: `legacy-${inst.id}` }] : [])
        for (const d of draws) await cancelDraw(contractId, installmentId, d.id)
    }, [contracts, cancelDraw])

    // Archive
    const archiveExpense = useCallback(async (id: string) => {
        try { await updateDoc(doc(db, "expenses", id), { isArchived: true }) } catch (e) { console.error(e) }
    }, [])
    const unarchiveExpense = useCallback(async (id: string) => {
        try { await updateDoc(doc(db, "expenses", id), { isArchived: false }) } catch (e) { console.error(e) }
    }, [])
    const archiveIncome = useCallback(async (id: string) => {
        try { await updateDoc(doc(db, "incomes", id), { isArchived: true }) } catch (e) { console.error(e) }
    }, [])
    const unarchiveIncome = useCallback(async (id: string) => {
        try { await updateDoc(doc(db, "incomes", id), { isArchived: false }) } catch (e) { console.error(e) }
    }, [])
    const archiveContract = useCallback(async (id: string) => {
        try {
            await updateDoc(doc(db, "contracts", id), {
                isArchived: true,
                archivedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        } catch (e) { console.error(e) }
    }, [])
    const unarchiveContract = useCallback(async (id: string) => {
        try {
            await updateDoc(doc(db, "contracts", id), {
                isArchived: false,
                updatedAt: new Date().toISOString()
            })
        } catch (e) { console.error(e) }
    }, [])

    /** Create a standalone 1-milestone voucher directly (e.g. for contractors without formal contract) */
    const createStandaloneVoucher = useCallback(async (input: StandaloneVoucherInput) => {
        if (!currentTeam) return
        const amount = Math.round((Number(input.amount) || 0) * 100) / 100
        if (amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0")

        const voucherNo = input.voucherNumber?.trim() || generateVoucherNumber(contracts)
        const drawId = Math.random().toString(36).slice(2, 10)
        const installmentId = "inst-1"
        const worker = workers.find(w => w.id === input.workerId)
        const effectiveDate = input.date || todayISO()
        const effectivePaymentDate = input.paymentDate || (input.expenseStatus === "Paid" ? effectiveDate : undefined)

        const expenseItems = (input.items && input.items.length > 0)
            ? input.items.map((it, i) => ({
                id: it.id || `item-${i}`,
                description: it.description,
                amount: Number(it.amount) || 0,
                category: "Sub-contract"
            }))
            : [{ id: drawId, description: `${voucherNo}: ${input.title}${input.note ? ` (${input.note})` : ""}`, amount, category: "Sub-contract" }]

        let createdExpenseId: string | undefined
        if (input.expenseStatus === "Paid") {
            createdExpenseId = await addExpense({
                title: `${voucherNo} - ${input.title}`,
                amount: `฿${amount.toLocaleString()}`,
                totalValue: amount,
                date: effectivePaymentDate || effectiveDate,
                category: "Sub-contract",
                status: "Paid",
                projectId: input.projectId,
                payee: worker?.name || "ผู้รับเหมา",
                items: expenseItems as any,
                contractInstallmentId: installmentId,
                contractDrawId: drawId,
                contractDrawLabel: "1"
            })
        }

        const draw: ContractDraw = {
            id: drawId,
            label: "1",
            voucherNumber: voucherNo,
            amount,
            date: effectiveDate,
            paymentDate: effectivePaymentDate,
            department: input.department,
            responsibleRole: input.responsibleRole,
            signatures: input.signatures,
            items: input.items,
            note: input.note || undefined,
            expenseId: createdExpenseId,
            expenseStatus: input.expenseStatus,
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.name || undefined
        }

        const contractData: any = {
            documentNumber: voucherNo,
            projectId: input.projectId,
            workerId: input.workerId,
            title: input.title,
            scope: input.note || input.title,
            startDate: effectiveDate,
            endDate: effectivePaymentDate || effectiveDate,
            totalAmount: amount,
            status: input.expenseStatus === "Paid" ? "Completed" : "Active",
            contractType: "ใบเบิกงวด (ไม่มีสัญญา)",
            isStandaloneVoucher: true,
            installments: [
                {
                    id: installmentId,
                    description: input.title,
                    amount,
                    dueDate: effectivePaymentDate || effectiveDate,
                    status: input.expenseStatus === "Paid" ? "Paid" : "Pending",
                    draws: [draw]
                }
            ],
            createdAt: new Date().toISOString(),
            orgId: currentTeam.id
        }

        const docRef = await addDoc(collection(db, "contracts"), stripUndefined(contractData))

        if (createdExpenseId) {
            await updateDoc(doc(db, "expenses", createdExpenseId), { contractId: docRef.id }).catch(() => {})
        }

        logActivity(db, currentTeam.id, {
            action: "CREATE",
            entityType: "CONTRACT",
            entityId: docRef.id,
            entityTitle: `${voucherNo} - ${input.title}`,
            details: `ออกใบเบิกงวดเดียว (ไม่มีสัญญา) ${voucherNo} จำนวน ฿${amount.toLocaleString()} [${input.expenseStatus === "Paid" ? "จ่ายแล้ว" : "รอจ่าย"}]`,
            performedBy: { uid: currentUser?.id || "unknown", name: currentUser?.name || "Unknown", role: currentUser?.role || "Staff" },
            relatedUserIds: [input.workerId]
        }).catch(() => {})

        return { contractId: docRef.id, drawId, expenseId: createdExpenseId, voucherNumber: voucherNo }
    }, [currentTeam, currentUser, workers, contracts, addExpense])

    const value = useMemo(() => {
        return {
            expenses,
            archivedExpenses,
            incomes, vendors, customers, workers, contracts,
            addExpense, updateExpense, deleteExpense, restoreExpense,
            addIncome, updateIncome, deleteIncome, restoreIncome,
            addVendor, updateVendor, deleteVendor,
            addWorker, updateWorker, deleteWorker,
            addCustomer, updateCustomer, deleteCustomer,
            addContract, updateContract, deleteContract, restoreContract, payInstallment, unpayInstallment, drawInstallment, cancelDraw, markDrawAsPaid, updateDraw,
            createStandaloneVoucher,
            archiveExpense, unarchiveExpense, archiveIncome, unarchiveIncome,
            archiveContract, unarchiveContract,
            loadArchivedExpenses, loadArchivedIncomes,
            isLoading, isArchivedLoading
        }
    }, [
        expenses, archivedExpenses, incomes, vendors, customers, workers, contracts,
        addExpense, updateExpense, deleteExpense, restoreExpense,
        addIncome, updateIncome, deleteIncome, restoreIncome,
        addVendor, updateVendor, deleteVendor,
        addWorker, updateWorker, deleteWorker,
        addCustomer, updateCustomer, deleteCustomer,
        addContract, updateContract, deleteContract, restoreContract, payInstallment, unpayInstallment, drawInstallment, cancelDraw, markDrawAsPaid, updateDraw,
        createStandaloneVoucher,
        archiveExpense, unarchiveExpense, archiveIncome, unarchiveIncome,
        archiveContract, unarchiveContract,
        loadArchivedExpenses, loadArchivedIncomes,
        isLoading, isArchivedLoading
    ])

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    )
}

export function useFinance() {
    const context = useContext(FinanceContext)
    if (context === undefined) throw new Error("useFinance must be used within a FinanceProvider")
    return context
}
