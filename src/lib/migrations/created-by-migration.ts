import { collection, getDocs, query, where, doc, updateDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"

export const migrateExpenseCreators = async (orgId: string) => {
    console.log("Starting migration for Org:", orgId)
    try {
        // 1. Get all expenses for this org
        const expensesRef = collection(db, "expenses")
        const q = query(expensesRef, where("orgId", "==", orgId))
        const snapshot = await getDocs(q)

        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
        const expensesToFix = expenses.filter(e => !e.createdBy)

        console.log(`Found ${expenses.length} expenses. ${expensesToFix.length} need migration.`)

        if (expensesToFix.length === 0) return { success: true, message: "No expenses need migration." }

        // 2. For each expense without createdBy, find its creation log
        const batch = writeBatch(db)
        let updateCount = 0
        let successCount = 0

        // Process in chunks if needed, but for now we'll do straight forward
        // Note: 'activities' collection might be large, better to query by entityId
        const activitiesRef = collection(db, "activities")

        for (const expense of expensesToFix) {
            // Find creation log for this expense
            const logQuery = query(
                activitiesRef,
                where("entityId", "==", expense.id),
                where("action", "==", "CREATE"),
                where("entityType", "==", "EXPENSE")
            )
            const logSnap = await getDocs(logQuery)

            if (!logSnap.empty) {
                const logData = logSnap.docs[0].data()
                const creatorId = logData.performedBy?.uid

                if (creatorId) {
                    const expenseRef = doc(db, "expenses", expense.id)
                    batch.update(expenseRef, { createdBy: creatorId })
                    updateCount++
                    successCount++
                }
            } else {
                console.warn(`No creation log found for expense: ${expense.title} (${expense.id})`)
            }
        }

        // Commit batch
        if (updateCount > 0) {
            await batch.commit()
            console.log(`Successfully migrated ${updateCount} expenses.`)
        }

        return {
            success: true,
            message: `Migration complete. Updated ${successCount}/${expensesToFix.length} expenses.`
        }

    } catch (error: any) {
        console.error("Migration failed:", error)
        return { success: false, message: error.message }
    }
}
