"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, limit, getDocs } from "firebase/firestore"
import { useOrganization } from "@/context/organization-context"
import { logActivity } from "@/lib/activity-logger"
import { Expense, IncomeDocument, Vendor, Customer, Worker, Contract } from "./project-context"

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
    deleteExpense: (id: string) => Promise<void>
    addIncome: (income: Omit<IncomeDocument, "id" | "createdAt" | "orgId">) => Promise<string | undefined>
    updateIncome: (id: string, updates: Partial<IncomeDocument>) => Promise<void>
    deleteIncome: (id: string) => Promise<void>

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
    deleteContract: (id: string) => Promise<void>
    payInstallment: (contractId: string, installmentId: string) => Promise<void>

    // Archive
    archiveExpense: (id: string) => Promise<void>
    unarchiveExpense: (id: string) => Promise<void>
    archiveIncome: (id: string) => Promise<void>
    unarchiveIncome: (id: string) => Promise<void>

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

    const DATA_LIMIT = 50

    // Listeners
    useEffect(() => {
        if (!currentTeam?.id) return
        setIsLoading(true)

        // 1. Expenses (Active & Ordered)
        const qExpenses = query(
            collection(db, "expenses"),
            where("orgId", "==", currentTeam.id),
            where("isArchived", "==", false),
            orderBy("date", "desc"),
            limit(DATA_LIMIT)
        )
        const unsubExpenses = onSnapshot(qExpenses, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense))
            setExpenses(data)
        }, (error) => console.error("[FinanceContext] Expenses sync error:", error))

        // 2. Incomes (Active & Ordered)
        const qIncomes = query(
            collection(db, "incomes"),
            where("orgId", "==", currentTeam.id),
            where("isArchived", "==", false),
            orderBy("date", "desc"),
            limit(DATA_LIMIT)
        )
        const unsubIncomes = onSnapshot(qIncomes, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as IncomeDocument))
            setIncomes(data)
        }, (error) => console.error("[FinanceContext] Incomes sync error:", error))

        // 3. Master Data (Limited for now to prevent startup lag)
        const qVendors = query(collection(db, "vendors"), where("orgId", "==", currentTeam.id), limit(100))
        const qCustomers = query(collection(db, "customers"), where("orgId", "==", currentTeam.id), limit(100))
        const qWorkers = query(collection(db, "workers"), where("orgId", "==", currentTeam.id), limit(100))
        const qContracts = query(collection(db, "contracts"), where("orgId", "==", currentTeam.id), limit(50))

        const unsubVendors = onSnapshot(qVendors, (snap) => setVendors(snap.docs.map(d => ({ ...d.data(), id: d.id } as Vendor))))
        const unsubCustomers = onSnapshot(qCustomers, (snap) => setCustomers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer))))
        const unsubWorkers = onSnapshot(qWorkers, (snap) => setWorkers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Worker))))
        const unsubContracts = onSnapshot(qContracts, (snap) => setContracts(snap.docs.map(d => ({ ...d.data(), id: d.id } as Contract))))

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
        if (!currentTeam) return
        try {
            const payload = {
                ...expenseData,
                orgId: currentTeam.id,
                createdAt: new Date().toISOString(),
                createdBy: currentUser?.id
            }
            const docRef = await addDoc(collection(db, "expenses"), payload)
            logActivity(db, currentTeam.id, {
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
            })
            return docRef.id
        } catch (e: any) {
            console.error("Error adding expense:", e)
            // Re-throw to allow UI to handle specific errors (e.g. permission-denied)
            throw e
        }
    }, [currentTeam, currentUser])

    const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
        const original = [...expenses]
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e))
        try {
            await updateDoc(doc(db, "expenses", id), { ...updates, updatedAt: new Date().toISOString() })
        } catch (e) {
            setExpenses(original)
        }
    }, [expenses])

    const deleteExpense = useCallback(async (id: string) => {
        const original = [...expenses]
        setExpenses(prev => prev.filter(e => e.id !== id))
        try {
            await deleteDoc(doc(db, "expenses", id))
        } catch (e) {
            setExpenses(original)
        }
    }, [expenses])

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

    const deleteIncome = useCallback(async (id: string) => {
        const original = [...incomes]
        setIncomes(prev => prev.filter(i => i.id !== id))
        try {
            await deleteDoc(doc(db, "incomes", id))
        } catch (e) {
            setIncomes(original)
        }
    }, [incomes])

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

    // Contracts
    const addContract = useCallback(async (contract: Omit<Contract, "id" | "createdAt" | "status">) => {
        if (!currentTeam) return
        try {
            // Generate Document Number: CD-yymmdd-seq
            // Use Thai timezone (UTC+7)
            const now = new Date()
            const thaiDate = new Date(now.getTime() + (7 * 60 * 60 * 1000))
            const yymmdd = thaiDate.toISOString().slice(2, 10).replace(/-/g, '')

            // Find existing contracts from today to determine sequence
            const todaysContracts = contracts.filter(c =>
                c.documentNumber && c.documentNumber.startsWith(`CD-${yymmdd}-`)
            )

            let seq = 1
            if (todaysContracts.length > 0) {
                const lastSeq = Math.max(...todaysContracts.map(c => {
                    const parts = c.documentNumber?.split('-')
                    return parts ? parseInt(parts[2]) : 0
                }))
                seq = lastSeq + 1
            }

            const documentNumber = `CD-${yymmdd}-${seq.toString().padStart(2, '0')}`

            const docRef = await addDoc(collection(db, "contracts"), {
                ...contract,
                documentNumber,
                createdAt: new Date().toISOString(),
                status: "Active",
                orgId: currentTeam.id
            })

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
        try { await updateDoc(doc(db, "contracts", id), { ...updates, updatedAt: new Date().toISOString() }) } catch (e) { console.error(e) }
    }, [])

    const deleteContract = useCallback(async (id: string) => {
        try { await deleteDoc(doc(db, "contracts", id)) } catch (e) { console.error(e) }
    }, [])

    const payInstallment = useCallback(async (contractId: string, installmentId: string) => {
        const contract = contracts.find(c => c.id === contractId)
        if (!contract || !currentTeam) return

        const updatedInstallments = contract.installments.map(inst =>
            inst.id === installmentId ? { ...inst, status: "Paid", paidAt: new Date().toISOString() } : inst
        )

        try {
            await updateDoc(doc(db, "contracts", contractId), {
                installments: updatedInstallments,
                updatedAt: new Date().toISOString()
            })
        } catch (e) { console.error(e) }
    }, [contracts, currentTeam])

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

    const value = useMemo(() => {
        return {
            expenses,
            archivedExpenses,
            incomes, vendors, customers, workers, contracts,
            addExpense, updateExpense, deleteExpense,
            addIncome, updateIncome, deleteIncome,
            addVendor, updateVendor, deleteVendor,
            addWorker, updateWorker, deleteWorker,
            addCustomer, updateCustomer, deleteCustomer,
            addContract, updateContract, deleteContract, payInstallment,
            archiveExpense, unarchiveExpense, archiveIncome, unarchiveIncome,
            loadArchivedExpenses, loadArchivedIncomes,
            isLoading, isArchivedLoading
        }
    }, [
        expenses, archivedExpenses, incomes, vendors, customers, workers, contracts,
        addExpense, updateExpense, deleteExpense,
        addIncome, updateIncome, deleteIncome,
        addVendor, updateVendor, deleteVendor,
        addWorker, updateWorker, deleteWorker,
        addCustomer, updateCustomer, deleteCustomer,
        addContract, updateContract, deleteContract, payInstallment,
        archiveExpense, unarchiveExpense, archiveIncome, unarchiveIncome,
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
