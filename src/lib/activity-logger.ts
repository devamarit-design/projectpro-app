import { addDoc, collection } from "firebase/firestore"
import { Firestore } from "firebase/firestore"

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE"
export type EntityType = "PROJECT" | "TASK" | "EXPENSE" | "INCOME" | "USER" | "FILE" | "CONTRACT"

export interface ActivityLogData {
    action: ActivityAction
    entityType: EntityType
    entityId: string
    entityTitle: string
    details: string
    performedBy: {
        uid: string
        name: string
        role: string
    }
    relatedUserIds: string[]
    metadata?: any
}

export const logActivity = async (
    db: Firestore,
    orgId: string,
    data: ActivityLogData
) => {
    try {
        if (!orgId) {
            console.warn("Cannot log activity: Missing orgId")
            return
        }

        const payload = {
            orgId,
            ...data,
            timestamp: new Date().toISOString(),
            // Ensure relatedUserIds always includes the performer
            relatedUserIds: Array.from(new Set([...data.relatedUserIds, data.performedBy.uid]))
        }

        await addDoc(collection(db, "activities"), payload)
        // console.log(`[Activity Logged] ${data.action} ${data.entityType}: ${data.entityTitle}`)
    } catch (error) {
        console.error("Failed to log activity:", error)
        // Ensure logging failure doesn't break the app flow
    }
}
