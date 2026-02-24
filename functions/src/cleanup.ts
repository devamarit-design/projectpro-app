import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const region = 'asia-southeast1'

/**
 * Scheduled function to permanently delete items that have been in the trash for more than 7 days
 * Runs daily at 2:00 AM Bangkok time
 */
export const autoCleanupTrash = functions
    .region(region)
    .pubsub.schedule('0 2 * * *')
    .timeZone('Asia/Bangkok')
    .onRun(async (context) => {
        const db = admin.firestore()
        console.log('Running auto-cleanup for trashed items...')

        try {
            const now = new Date()
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
            const sevenDaysAgoISO = sevenDaysAgo.toISOString()

            const collectionsToCleanup = ['expenses', 'incomes', 'contracts']
            let totalDeleted = 0

            for (const collectionName of collectionsToCleanup) {
                const snapshot = await db.collection(collectionName)
                    .where('isDeleted', '==', true)
                    .where('deletedAt', '<=', sevenDaysAgoISO)
                    .get()

                if (snapshot.empty) continue

                const batch = db.batch()
                let batchCount = 0

                for (const doc of snapshot.docs) {
                    batch.delete(doc.ref)
                    batchCount++
                    totalDeleted++

                    // Firestore batch limit is 500
                    if (batchCount === 500) {
                        await batch.commit()
                        batchCount = 0
                    }
                }

                if (batchCount > 0) {
                    await batch.commit()
                }
            }

            console.log(`Auto-cleanup completed. Deleted ${totalDeleted} items.`)
            return null
        } catch (error) {
            console.error('Error during auto-cleanup:', error)
            return null
        }
    })
