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
        // Deduplicate local items as well
        const seen = new Set<string>();
        const unique = all.filter(s => {
            const key = s.reportNumber || s.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        return unique.filter(s => (!orgId || s.orgId === orgId) && (!userId || s.createdBy === userId));
    } catch {
        return [];
    }
}

export function setLocalJobSheets(sheets: JobSheet[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sheets.slice(0, 50)));
    } catch (e) {
        console.warn("Failed to set local jobsheets cache:", e);
    }
}

export function saveLocalJobSheet(sheet: JobSheet) {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const all: JobSheet[] = raw ? JSON.parse(raw) : [];
        const idx = all.findIndex(s => s.id === sheet.id || (s.reportNumber && s.reportNumber === sheet.reportNumber));
        if (idx >= 0) {
            all[idx] = sheet;
        } else {
            all.unshift(sheet);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
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

                // Deduplicate in memory for UI presentation using unique document ID
                const uniqueMap = new Map<string, JobSheet>();

                for (const sheet of results) {
                    const key = sheet.id;
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, sheet);
                    } else {
                        const existing = uniqueMap.get(key)!;
                        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
                        const sheetTime = new Date(sheet.updatedAt || sheet.createdAt || 0).getTime();
                        if (sheetTime > existingTime) {
                            uniqueMap.set(key, sheet);
                        }
                    }
                }

                const deduplicated = Array.from(uniqueMap.values());

                // Client-side sort: date descending, then createdAt descending (no composite index required)
                deduplicated.sort((a, b) => {
                    const dateDiff = (b.date || "").localeCompare(a.date || "");
                    if (dateDiff !== 0) return dateDiff;
                    return (b.createdAt || "").localeCompare(a.createdAt || "");
                });

                // Fast O(1) cache update
                setLocalJobSheets(deduplicated);
                onData(deduplicated);
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
    }

    const cleanedPayload = cleanFirestoreData({
        ...updateData,
        updatedAt: nowIso
    });

    // Update local cache directly by id or reportNumber
    try {
        if (typeof window !== "undefined") {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const all: JobSheet[] = raw ? JSON.parse(raw) : [];
            const idx = all.findIndex(s => s.id === id || (data.reportNumber && s.reportNumber === data.reportNumber));
            if (idx >= 0) {
                all[idx] = { ...all[idx], ...cleanedPayload, updatedAt: nowIso };
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
            } else {
                saveLocalJobSheet({ id, ...cleanedPayload, updatedAt: nowIso } as JobSheet);
            }
        }
    } catch (e) {
        console.warn("Failed to update jobsheet in localStorage:", e);
    }

    // Persist to Firestore
    try {
        if (!id.startsWith("local_")) {
            const docRef = doc(db, "jobsheets", id);
            // Use setDoc with merge: true so it succeeds whether the document already exists or needs creation
            await setDoc(docRef, {
                ...cleanedPayload,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } else {
            // It was a local ID, promote to a real Firestore document
            const colRef = collection(db, "jobsheets");
            const docRef = await addDoc(colRef, {
                ...cleanedPayload,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            removeLocalJobSheet(id);
            saveLocalJobSheet({ ...cleanedPayload, id: docRef.id, updatedAt: nowIso } as JobSheet);
        }
    } catch (error) {
        console.error("Firestore update error:", error);
        throw error;
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
