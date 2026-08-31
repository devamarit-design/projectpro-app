import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, writeBatch, doc } from "firebase/firestore"
import { authErrorResponse, requireSystemAdmin } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
    try {
        await requireSystemAdmin(request)
    } catch (error) {
        return authErrorResponse(error) ?? NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }

    const result = {
        total: 0,
        migrated: 0,
        skipped: 0,
        errors: [] as string[]
    }

    try {
        const snapshot = await getDocs(collection(db, "users"))
        result.total = snapshot.docs.length

        const batch = writeBatch(db)
        let batchCount = 0

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data()

            // Check if needs migration
            // Condition: Has teamIds AND (no orgIds OR orgIds is empty)
            const hasTeamIds = Array.isArray(data.teamIds) && data.teamIds.length > 0
            const hasOrgIds = Array.isArray(data.orgIds) && data.orgIds.length > 0

            if (hasTeamIds && !hasOrgIds) {
                const docRef = doc(db, "users", docSnap.id)
                // Copy teamIds to orgIds
                batch.update(docRef, { orgId: null, orgIds: data.teamIds })
                // Note: We also clear single 'orgId' if it exists to avoid confusion, 
                // but mainly populating 'orgIds' array.
                // Wait, User interface uses orgIds: string[].

                result.migrated++
                batchCount++
            } else {
                result.skipped++
            }
        }

        if (batchCount > 0) {
            await batch.commit()
        }

    } catch (error) {
        result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return NextResponse.json({
        success: true,
        message: "User migration completed",
        result
    })
}
