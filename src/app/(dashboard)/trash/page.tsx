"use client"

import React, { useState, useEffect } from "react"
import { useOrganization } from "@/context/organization-context"
import { useFinance } from "@/context/finance-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Expense, IncomeDocument, Contract } from "@/context/project-context"
import { ArchiveRestore, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { th } from "date-fns/locale"

export default function TrashPage() {
    const { currentOrg } = useOrganization()
    const { restoreExpense, restoreIncome, restoreContract, deleteExpense, deleteIncome, deleteContract } = useFinance()
    const [activeTab, setActiveTab] = useState("expenses")

    const [expenses, setExpenses] = useState<Expense[]>([])
    const [incomes, setIncomes] = useState<IncomeDocument[]>([])
    const [contracts, setContracts] = useState<Contract[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete', id: string, entity: 'expense' | 'income' | 'contract', title: string } | null>(null)

    const loadData = async () => {
        if (!currentOrg?.id) return
        setIsLoading(true)
        try {
            // 1. Load Trashed Expenses
            const qExpenses = query(
                collection(db, "expenses"),
                where("orgId", "==", currentOrg.id),
                where("isDeleted", "==", true),
                orderBy("deletedAt", "desc")
            )
            const snapExpenses = await getDocs(qExpenses)
            setExpenses(snapExpenses.docs.map(d => ({ ...d.data(), id: d.id } as Expense)))

            // 2. Load Trashed Incomes
            const qIncomes = query(
                collection(db, "incomes"),
                where("orgId", "==", currentOrg.id),
                where("isDeleted", "==", true),
                orderBy("deletedAt", "desc")
            )
            const snapIncomes = await getDocs(qIncomes)
            setIncomes(snapIncomes.docs.map(d => ({ ...d.data(), id: d.id } as IncomeDocument)))

            // 3. Load Trashed Contracts
            const qContracts = query(
                collection(db, "contracts"),
                where("orgId", "==", currentOrg.id),
                where("isDeleted", "==", true),
                orderBy("deletedAt", "desc")
            )
            const snapContracts = await getDocs(qContracts)
            setContracts(snapContracts.docs.map(d => ({ ...d.data(), id: d.id } as Contract)))

        } catch (error) {
            console.error("Error loading trash data", error)
            toast.error("ไม่สามารถโหลดข้อมูลถังขยะได้")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [currentOrg?.id])

    const handleConfirm = async () => {
        if (!confirmAction) return
        const { type, id, entity } = confirmAction

        try {
            if (type === 'restore') {
                if (entity === 'expense') {
                    await restoreExpense(id)
                    setExpenses(prev => prev.filter(e => e.id !== id))
                } else if (entity === 'income') {
                    await restoreIncome(id)
                    setIncomes(prev => prev.filter(i => i.id !== id))
                } else if (entity === 'contract') {
                    await restoreContract(id)
                    setContracts(prev => prev.filter(c => c.id !== id))
                }
                toast.success("กู้คืนรายการสำเร็จ!")
            } else if (type === 'delete') {
                if (entity === 'expense') {
                    await deleteExpense(id, true) // permanent
                    setExpenses(prev => prev.filter(e => e.id !== id))
                } else if (entity === 'income') {
                    await deleteIncome(id, true)
                    setIncomes(prev => prev.filter(i => i.id !== id))
                } else if (entity === 'contract') {
                    await deleteContract(id, true)
                    setContracts(prev => prev.filter(c => c.id !== id))
                }
                toast.success("ลบรายการถาวรแล้ว!")
            }
        } catch (error) {
            console.error("Error performing action", error)
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
        } finally {
            setConfirmAction(null)
        }
    }

    // Days remaining in trash calculation (7 days max)
    const getDaysRemaining = (deletedAt?: string) => {
        if (!deletedAt) return 0
        const deleteDate = new Date(deletedAt)
        const expiryDate = new Date(deleteDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        const now = new Date()
        const diffTime = expiryDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    }

    const renderList = (items: any[], type: 'expense' | 'income' | 'contract') => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p>กำลังโหลดข้อมูลถังขยะ...</p>
                </div>
            )
        }

        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                    <Trash2 className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">ถังขยะว่างเปล่า</p>
                    <p className="text-sm">ไม่มีรายการที่ถูกลบใน 7 วันที่ผ่านมา</p>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                {items.map(item => {
                    const daysRemaining = getDaysRemaining(item.deletedAt)
                    const isExpired = daysRemaining === 0
                    const title = item.title || item.documentNumber || item.name || "Unknown Item"

                    return (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground truncate">{title}</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                    <span>ลบเมื่อ: {item.deletedAt ? format(new Date(item.deletedAt), 'dd MMM yyyy HH:mm', { locale: th }) : '-'}</span>
                                    {isExpired ? (
                                        <span className="text-red-500 font-medium flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> หมดเวลากู้คืนแล้ว (รอการลบอัตโนมัติ)
                                        </span>
                                    ) : (
                                        <span className="text-orange-500 font-medium">
                                            เหลือเวลา {daysRemaining} วันก่อนถูกลบถาวร
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmAction({ type: 'restore', id: item.id, entity: type, title })}
                                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <ArchiveRestore className="h-4 w-4" />
                                    <span className="hidden sm:inline">กู้คืน</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmAction({ type: 'delete', id: item.id, entity: type, title })}
                                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">ลบถาวร</span>
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">ถังขยะ (Trash)</h1>
                <p className="text-muted-foreground">รายการที่ถูกลบจะถูกเก็บไว้ที่นี่เป็นเวลา 7 วัน ก่อนที่จะถูกลบออกอย่างถาวรโดยอัตโนมัติ</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="expenses">ค่าใช้จ่าย ({expenses.length})</TabsTrigger>
                    <TabsTrigger value="incomes">รายรับ ({incomes.length})</TabsTrigger>
                    <TabsTrigger value="contracts">สัญญา ({contracts.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="expenses">
                    {renderList(expenses, 'expense')}
                </TabsContent>
                <TabsContent value="incomes">
                    {renderList(incomes, 'income')}
                </TabsContent>
                <TabsContent value="contracts">
                    {renderList(contracts, 'contract')}
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={confirmAction?.type === 'restore' ? "ยืนยันการกู้คืน" : "ยืนยันการลบถาวร"}
                message={confirmAction?.type === 'restore'
                    ? `คุณต้องการกู้คืน "${confirmAction?.title}" กลับไปยังรายการปกติใช่หรือไม่?`
                    : `คุณต้องการลบ "${confirmAction?.title}" อย่างถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้`}
                confirmText={confirmAction?.type === 'restore' ? "กู้คืน" : "ลบถาวร"}
                cancelText="ยกเลิก"
                variant={confirmAction?.type === 'restore' ? "info" : "danger"}
            />
        </div>
    )
}
