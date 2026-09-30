import { db } from "@/lib/firebase";
import { JobSheet } from "@/types/jobsheet";
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs
} from "firebase/firestore";

const LOCAL_STORAGE_KEY = "hipsloth_jobsheets_backup";

function getLocalJobSheets(orgId: string, userId?: string): JobSheet[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const all: JobSheet[] = JSON.parse(raw);
        return all.filter(s => s.orgId === orgId && (!userId || s.createdBy === userId));
    } catch {
        return [];
    }
}

function saveLocalJobSheet(sheet: JobSheet) {
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

function removeLocalJobSheet(id: string) {
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

export function subscribeJobSheets(
    orgId: string,
    userId: string | null | undefined,
    onData: (sheets: JobSheet[]) => void,
    onError?: (err: any) => void
) {
    if (!orgId) {
        onData([]);
        return () => {};
    }

    try {
        const colRef = collection(db, "organizations", orgId, "jobsheets");
        let q = query(colRef, orderBy("date", "desc"));

        if (userId) {
            q = query(colRef, where("createdBy", "==", userId), orderBy("date", "desc"));
        }

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
                        reportedBy: data.reportedBy || data.createdByName || "",
                        inspectedBy: data.inspectedBy || "",
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
                        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString()
                    } as JobSheet;
                });

                // Also merge/backup with local
                results.forEach(saveLocalJobSheet);
                onData(results);
            },
            (error) => {
                console.warn("Firestore jobsheet subscription warning, falling back to local:", error);
                const local = getLocalJobSheets(orgId, userId || undefined);
                onData(local);
                if (onError) onError(error);
            }
        );

        return unsubscribe;
    } catch (err) {
        console.warn("Error setting up jobsheet listener, using local:", err);
        const local = getLocalJobSheets(orgId, userId || undefined);
        onData(local);
        return () => {};
    }
}

export async function createJobSheet(
    orgId: string,
    data: Omit<JobSheet, "id" | "createdAt" | "updatedAt">
): Promise<string> {
    const nowIso = new Date().toISOString();
    const tempId = `local_${Date.now()}`;
    const newSheet: JobSheet = {
        ...data,
        id: tempId,
        orgId,
        createdAt: nowIso,
        updatedAt: nowIso
    };

    // Save locally immediately
    saveLocalJobSheet(newSheet);

    try {
        const colRef = collection(db, "organizations", orgId, "jobsheets");
        const docRef = await addDoc(colRef, {
            ...data,
            orgId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Update local with real Firestore ID
        removeLocalJobSheet(tempId);
        newSheet.id = docRef.id;
        saveLocalJobSheet(newSheet);

        return docRef.id;
    } catch (error) {
        console.warn("Firestore save failed, saved locally:", error);
        return tempId;
    }
}

export async function updateJobSheet(
    orgId: string,
    id: string,
    data: Partial<JobSheet>
): Promise<void> {
    const nowIso = new Date().toISOString();
    try {
        const docRef = doc(db, "organizations", orgId, "jobsheets", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.warn("Firestore update error, updating local only:", error);
    }

    // Local update
    const local = getLocalJobSheets(orgId);
    const existing = local.find(s => s.id === id);
    if (existing) {
        saveLocalJobSheet({ ...existing, ...data, updatedAt: nowIso });
    }
}

export async function deleteJobSheet(orgId: string, id: string): Promise<void> {
    removeLocalJobSheet(id);
    try {
        const docRef = doc(db, "organizations", orgId, "jobsheets", id);
        await deleteDoc(docRef);
    } catch (error) {
        console.warn("Firestore delete warning:", error);
    }
}
