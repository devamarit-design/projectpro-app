/**
 * Migration Script: teamId → orgId
 * 
 * This script migrates all Firestore documents from using `teamId` to `orgId`.
 * Run this once to update existing data, then remove dual-query code.
 * 
 * Usage: 
 * 1. Import this file in your app
 * 2. Call migrateTeamIdToOrgId() from a button click or useEffect
 * 3. After migration completes, remove this file and dual-query code
 */

import { db } from "@/lib/firebase"
import { collection, getDocs, writeBatch, doc } from "firebase/firestore"

// Collections that need migration
const COLLECTIONS_TO_MIGRATE = [
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

export interface MigrationResult {
    collection: string
    total: number
    migrated: number
    skipped: number
    errors: string[]
}

export async function migrateTeamIdToOrgId(
    onProgress?: (collection: string, current: number, total: number) => void
): Promise<MigrationResult[]> {
    const results: MigrationResult[] = []

    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
        const result: MigrationResult = {
            collection: collectionName,
            total: 0,
            migrated: 0,
            skipped: 0,
            errors: []
        }

        try {
            const snapshot = await getDocs(collection(db, collectionName))
            result.total = snapshot.docs.length

            // Process in batches of 500 (Firestore limit)
            const batchSize = 500
            const docs = snapshot.docs

            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = writeBatch(db)
                const batchDocs = docs.slice(i, i + batchSize)

                for (const docSnap of batchDocs) {
                    const data = docSnap.data()

                    // Skip if already has orgId
                    if (data.orgId) {
                        result.skipped++
                        continue
                    }

                    // Skip if no teamId to migrate
                    if (!data.teamId) {
                        result.skipped++
                        continue
                    }

                    // Migrate: copy teamId to orgId, optionally remove teamId
                    const docRef = doc(db, collectionName, docSnap.id)
                    batch.update(docRef, {
                        orgId: data.teamId,
                        // Uncomment the next line to remove teamId after migration:
                        // teamId: deleteField()
                    })
                    result.migrated++
                }

                // Commit batch
                await batch.commit()

                // Report progress
                if (onProgress) {
                    onProgress(collectionName, Math.min(i + batchSize, docs.length), docs.length)
                }
            }
        } catch (error) {
            result.errors.push(`${collectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        results.push(result)
        console.log(`✓ ${collectionName}: ${result.migrated} migrated, ${result.skipped} skipped`)
    }

    return results
}

// Quick migration function for use in browser console or one-time button
export async function runMigration() {
    console.log("🚀 Starting teamId → orgId migration...")
    const results = await migrateTeamIdToOrgId((col, current, total) => {
        console.log(`  ${col}: ${current}/${total}`)
    })
    console.log("✅ Migration complete!")
    console.table(results.map(r => ({
        Collection: r.collection,
        Total: r.total,
        Migrated: r.migrated,
        Skipped: r.skipped,
        Errors: r.errors.length
    })))
    return results
}
