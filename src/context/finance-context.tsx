"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { useOrganization } from "@/context/organization-context"
import { logActivity } from "@/lib/activity-logger"
import { Expense, IncomeDocument, Vendor, Customer, Worker, Contract } from "./project-context"

interface FinanceContextType {
    expenses: Expense[]
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

    isLoading: boolean
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
    const [isLoading, setIsLoading] = useState(true)

    // Helper for incremental updates
    const handleIncrementalUpdate = useCallback((setFn: React.Dispatch<React.SetStateAction<any[]>>, snapshot: any, sortKey: string = "createdAt") => {
        setFn(prev => {
            let newData = [...prev]
            snapshot.docChanges().forEach((change: any) => {
                const data = { ...change.doc.data(), id: change.doc.id }
                if (change.type === "added") {
                    if (!newData.find(item => item.id === data.id)) newData.unshift(data)
                }
                if (change.type === "modified") {
                    const index = newData.findIndex(item => item.id === data.id)
                    if (index > -1) newData[index] = data
                }
                if (change.type === "removed") {
                    newData = newData.filter(item => item.id !== data.id)
                }
            })
            return newData.sort((a, b) => new Date(b[sortKey] || 0).getTime() - new Date(a[sortKey] || 0).getTime())
        })
    }, [])

    // Listeners
    useEffect(() => {
        if (!currentTeam?.id) return

        const unsubExpenses = onSnapshot(query(collection(db, "expenses"), where("orgId", "==", currentTeam.id)), (snap) => handleIncrementalUpdate(setExpenses, snap, "date"))
        const unsubIncomes = onSnapshot(query(collection(db, "incomes"), where("orgId", "==", currentTeam.id)), (snap) => handleIncrementalUpdate(setIncomes, snap, "date"))
        const unsubVendors = onSnapshot(query(collection(db, "vendors"), where("orgId", "==", currentTeam.id)), (snap) => handleIncrementalUpdate(setVendors, snap))
        const unsubCustomers = onSnapshot(query(collection(db, "customers"), where("orgId", "==", currentTeam.id)), (snap) => handleIncrementalUpdate(setCustomers, snap))
        const unsubWorkers = onSnapshot(query(collection(db, "workers"), where("orgId", "==", currentTeam.id)), (snap) => handleIncrementalUpdate(setWorkers, snap))
        const unsubContracts = onSnapshot(query(collection(db, "contracts"), where("orgId", "==", currentTeam.id)), (snap) => handleIncrementalUpdate(setContracts, snap))

        setIsLoading(false)
        return () => {
            unsubExpenses()
            unsubIncomes()
            unsubVendors()
            unsubCustomers()
            unsubWorkers()
            unsubContracts()
        }
    }, [currentTeam?.id, handleIncrementalUpdate])

    // Finance Actions
    const addExpense = useCallback(async (expenseData: Omit<Expense, "id" | "createdAt" | "orgId">) => {
        if (!currentTeam) return
        const tempId = `temp-${Date.now()}`
        const newExpense = { ...expenseData, id: tempId, orgId: currentTeam.id, createdAt: new Date().toISOString() } as Expense
        setExpenses(prev => [newExpense, ...prev])
        try {
            const payload = { ...newExpense }; delete (payload as any).id
            const docRef = await addDoc(collection(db, "expenses"), payload)
            logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "EXPENSE",
                entityId: docRef.id,
                entityTitle: newExpense.title,
                details: `Created new expense: ${newExpense.title}`,
                performedBy: {
                    uid: currentUser?.id,
                    name: currentUser?.name,
                    role: currentUser?.role
                },
                relatedUserIds: []
            })
            return docRef.id
        } catch (e) {
            setExpenses(prev => prev.filter(i => i.id !== tempId))
            return undefined
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
        const tempId = `temp-${Date.now()}`
        const newIncome = { ...incomeData, id: tempId, orgId: currentTeam.id, createdAt: new Date().toISOString() } as IncomeDocument
        setIncomes(prev => [newIncome, ...prev])
        try {
            const payload = { ...newIncome }; delete (payload as any).id
            const docRef = await addDoc(collection(db, "incomes"), payload)
            logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "INCOME",
                entityId: docRef.id,
                entityTitle: newIncome.documentNumber,
                details: `Created new income document: ${newIncome.documentNumber}`,
                performedBy: {
                    uid: currentUser?.id,
                    name: currentUser?.name,
                    role: currentUser?.role
                },
                relatedUserIds: []
            })
            return docRef.id
        } catch (e) {
            setIncomes(prev => prev.filter(i => i.id !== tempId))
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
            const docRef = await addDoc(collection(db, "contracts"), {
                ...contract,
                createdAt: new Date().toISOString(),
                status: "Active",
                orgId: currentTeam.id
            })

            logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "CONTRACT",
                entityId: docRef.id,
                entityTitle: contract.title,
                details: `Created contract with total amount: ${contract.totalAmount}`,
                performedBy: {
                    uid: currentUser?.id || "unknown",
                    name: currentUser?.name || "Unknown",
                    role: currentUser?.role || "Staff"
                },
                relatedUserIds: [contract.workerId]
            })
        } catch (e) { console.error(e) }
    }, [currentTeam, currentUser])

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

    const value = useMemo(() => ({
        expenses, incomes, vendors, customers, workers, contracts,
        addExpense, updateExpense, deleteExpense,
        addIncome, updateIncome, deleteIncome,
        addVendor, updateVendor, deleteVendor,
        addWorker, updateWorker, deleteWorker,
        addCustomer, updateCustomer, deleteCustomer,
        addContract, updateContract, deleteContract, payInstallment,
        archiveExpense, unarchiveExpense, archiveIncome, unarchiveIncome,
        isLoading
    }), [
        expenses, incomes, vendors, customers, workers, contracts,
        addExpense, updateExpense, deleteExpense,
        addIncome, updateIncome, deleteIncome,
        addVendor, updateVendor, deleteVendor,
        addWorker, updateWorker, deleteWorker,
        addCustomer, updateCustomer, deleteCustomer,
        addContract, updateContract, deleteContract, payInstallment,
        archiveExpense, unarchiveExpense, archiveIncome, unarchiveIncome,
        isLoading
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
