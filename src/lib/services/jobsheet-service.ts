import { db } from "@/lib/firebase";
import { JobSheet } from "@/types/jobsheet";
import {
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from "firebase/firestore";

const LOCAL_STORAGE_KEY = "hipsloth_jobsheets_backup";

/**
 * Deep sanitize object to remove any `undefined` values which crash Firestore `addDoc` / `updateDoc`
 */
function cleanFirestoreData<T>(obj: T): T {
    if (obj === null || obj === undefined) return "" as any;
    if (Array.isArray(obj)) {
        return obj.map(cleanFirestoreData) as any;
    }
    if (typeof obj === "object" && !(obj instanceof Date)) {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value === undefined) {
                cleaned[key] = "";
            } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                cleaned[key] = cleanFirestoreData(value);
            } else {
                cleaned[key] = value;
            }
        }
        return cleaned as any;
    }
    return obj;
}

export function getLocalJobSheets(orgId?: string, userId?: string): JobSheet[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const all: JobSheet[] = JSON.parse(raw);
        return all.filter(s => (!orgId || s.orgId === orgId) && (!userId || s.createdBy === userId));
    } catch {
        return [];
    }
}

export function saveLocalJobSheet(sheet: JobSheet) {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const all: JobSheet[] = raw ? JSON.parse(raw) : [];
        const idx = all.findIndex(s => s.id === sheet.id);
        if (idx >= 0) {
            all[idx] = sheet;
        } else {
            all.unshift(sheet);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
        console.warn("Failed to backup jobsheet to localStorage:", e);
    }
}

export function removeLocalJobSheet(id: string) {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return;
        const all: JobSheet[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all.filter(s => s.id !== id)));
    } catch (e) {
        console.warn("Failed to remove jobsheet from localStorage:", e);
    }
}

/**
 * Real-time subscription to JobSheets for an organization
 */
export function subscribeJobSheets(
    orgId: string,
    userId: string | null | undefined,
    onData: (sheets: JobSheet[]) => void,
    onError?: (err: any) => void
) {
    if (!orgId) {
        onData(getLocalJobSheets(undefined, userId || undefined));
        return () => {};
    }

    // Immediately deliver local data for zero-latency initial UI
    const local = getLocalJobSheets(orgId, userId || undefined);
    if (local.length > 0) {
        onData(local);
    }

    try {
        // Use top-level collection aligned with all other entities in Hipsloth (projects, tasks, expenses)
        const colRef = collection(db, "jobsheets");
        const q = query(colRef, where("orgId", "==", orgId));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const results: JobSheet[] = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        reportNumber: data.reportNumber || `JS-${docSnap.id.substring(0, 6).toUpperCase()}`,
                        title: data.title || "JobSheet บันทึกงานประจำวัน",
                        date: data.date || new Date().toISOString().split("T")[0],
                        projectId: data.projectId || "",
                        projectName: data.projectName || "ไม่ระบุโครงการ",
                        projectIds: data.projectIds || [],
                        isMultiProject: !!data.isMultiProject,
                        subProjectId: data.subProjectId || "",
                        subProjectName: data.subProjectName || "",
                        orgId: data.orgId || orgId,
                        createdBy: data.createdBy || "",
                        createdByName: data.createdByName || "ผู้บันทึก",
                        createdByRole: data.createdByRole || "",
                        createdByAvatar: data.createdByAvatar || "",
                        weather: data.weather || { condition: "ท้องฟ้าแจ่มใส (Clear Sky)" },
                        workItems: data.workItems || [],
                        manpower: data.manpower || [],
                        equipment: data.equipment || "",
                        materialsReceived: data.materialsReceived || "",
                        safetyNotes: data.safetyNotes || "",
                        obstacles: data.obstacles || "",
                        generalNotes: data.generalNotes || "",
                        photos: data.photos || [],
                        companyName: data.companyName || "",
                        companyLogo: data.companyLogo || "",
                        reportedBy: data.reportedBy || data.createdByName || "",
                        reportedByRole: data.reportedByRole || "",
                        inspectedBy: data.inspectedBy || "",
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
                        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString()
                    } as JobSheet;
                });

                // Client-side sort: date descending, then createdAt descending (no composite index required)
                results.sort((a, b) => {
                    const dateDiff = (b.date || "").localeCompare(a.date || "");
                    if (dateDiff !== 0) return dateDiff;
                    return (b.createdAt || "").localeCompare(a.createdAt || "");
                });

                // Include any temporary or unsynced local items that haven't settled to Firestore yet
                const localSheets = getLocalJobSheets(orgId, userId || undefined);
                const localOnly = localSheets.filter(l => !results.some(r => r.id === l.id));
                const merged = [...localOnly, ...results];

                // Cache to localStorage
                merged.forEach(saveLocalJobSheet);
                onData(merged);

                // Auto-sync background healing for local items missing from Firestore
                if (typeof window !== "undefined" && navigator.onLine && orgId && orgId !== "default_org") {
                    localSheets.forEach(async (localSheet) => {
                        if (!results.some(r => r.id === localSheet.id)) {
                            try {
                                if (localSheet.id.startsWith("local_")) {
                                    await createJobSheet(orgId, localSheet);
                                } else if (localSheet.orgId === orgId || !localSheet.orgId || localSheet.orgId === "default_org") {
                                    const docRef = doc(db, "jobsheets", localSheet.id);
                                    await setDoc(docRef, {
                                        ...cleanFirestoreData(localSheet),
                                        orgId,
                                        updatedAt: serverTimestamp()
                                    }, { merge: true });
                                }
                            } catch (syncErr) {
                                console.warn("Background jobsheet sync attempt:", syncErr);
                            }
                        }
                    });
                }
            },
            (error) => {
                console.warn("Firestore jobsheet subscription warning, falling back to local:", error);
                const fallback = getLocalJobSheets(orgId, userId || undefined);
                onData(fallback);
                if (onError) onError(error);
            }
        );

        return unsubscribe;
    } catch (err) {
        console.warn("Error setting up jobsheet listener, using local:", err);
        const fallback = getLocalJobSheets(orgId, userId || undefined);
        onData(fallback);
        return () => {};
    }
}

/**
 * Create a new JobSheet in Firestore and backup to localStorage
 */
export async function createJobSheet(
    orgId: string,
    data: Omit<JobSheet, "id" | "createdAt" | "updatedAt">
): Promise<JobSheet> {
    const nowIso = new Date().toISOString();
    const tempId = `local_${Date.now()}`;
    const effectiveOrgId = (orgId && orgId !== "default_org") ? orgId : (data.orgId && data.orgId !== "default_org" ? data.orgId : "");

    const cleanedPayload = cleanFirestoreData({
        ...data,
        orgId: effectiveOrgId,
        createdAt: nowIso,
        updatedAt: nowIso
    });

    const newSheet: JobSheet = {
        ...cleanedPayload,
        id: tempId
    };

    // Save locally immediately
    saveLocalJobSheet(newSheet);

    try {
        const colRef = collection(db, "jobsheets");
        const docRef = await addDoc(colRef, {
            ...cleanedPayload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Update local with the real Firestore ID
        removeLocalJobSheet(tempId);
        newSheet.id = docRef.id;
        saveLocalJobSheet(newSheet);

        return newSheet;
    } catch (error) {
        console.error("Firestore save failed, saved locally as fallback:", error);
        return newSheet;
    }
}

/**
 * Update an existing JobSheet
 */
export async function updateJobSheet(
    orgId: string,
    id: string,
    data: Partial<JobSheet>
): Promise<void> {
    const nowIso = new Date().toISOString();
    
    // Safety: ensure orgId is never overwritten by empty string "" or "default_org"
    const updateData: Record<string, any> = { ...data };
    const effectiveOrgId = (data.orgId && data.orgId !== "default_org") ? data.orgId : (orgId && orgId !== "default_org" ? orgId : "");
    if (effectiveOrgId) {
        updateData.orgId = effectiveOrgId;
    } else {
        delete updateData.orgId; // NEVER overwrite valid orgId with empty string
    }

    const cleanedPayload = cleanFirestoreData({
        ...updateData,
        updatedAt: nowIso
    });

    // Update local immediately
    const local = getLocalJobSheets(effectiveOrgId || orgId);
    const existing = local.find(s => s.id === id);
    if (existing) {
        saveLocalJobSheet({ ...existing, ...cleanedPayload, updatedAt: nowIso });
    }

    try {
        if (!id.startsWith("local_")) {
            const docRef = doc(db, "jobsheets", id);
            await updateDoc(docRef, {
                ...cleanedPayload,
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Firestore update error, updated locally:", error);
    }
}

/**
 * Delete a JobSheet
 */
export async function deleteJobSheet(orgId: string, id: string): Promise<void> {
    removeLocalJobSheet(id);
    try {
        if (!id.startsWith("local_")) {
            const docRef = doc(db, "jobsheets", id);
            await deleteDoc(docRef);
        }
    } catch (error) {
        console.warn("Firestore delete warning:", error);
    }
}
