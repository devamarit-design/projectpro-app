import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, writeBatch, doc } from "firebase/firestore"

// Collections to migrate
const COLLECTIONS = [
    "projects",
    "expenses",
    "workers",
    "vendors",
    "customers",
    "incomes",
    "contracts",
    "tasks",
    "files",
    "notifications"
]

export async function POST(request: NextRequest) {
    const results: any[] = []

    for (const colName of COLLECTIONS) {
        const result = {
            collection: colName,
            total: 0,
            migrated: 0,
            skipped: 0,
            errors: [] as string[]
        }

        try {
            const snapshot = await getDocs(collection(db, colName))
            result.total = snapshot.docs.length

            const batch = writeBatch(db)
            let batchCount = 0

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data()

                // Skip if already has orgId or no teamId
                if (data.orgId || !data.teamId) {
                    result.skipped++
                    continue
                }

                // Migrate: copy teamId to orgId
                const docRef = doc(db, colName, docSnap.id)
                batch.update(docRef, { orgId: data.teamId })
                result.migrated++
                batchCount++

                // Commit in batches of 500
                if (batchCount >= 500) {
                    await batch.commit()
                    batchCount = 0
                }
            }

            // Commit remaining
            if (batchCount > 0) {
                await batch.commit()
            }
        } catch (error) {
            result.errors.push(error instanceof Error ? error.message : 'Unknown error')
        }

        results.push(result)
    }

    return NextResponse.json({
        success: true,
        message: "Migration completed",
        results
    })
}
