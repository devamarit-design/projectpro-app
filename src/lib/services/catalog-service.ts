import { db } from "@/lib/firebase";
import { CatalogItem } from "@/types/catalog";
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

const LOCAL_STORAGE_KEY = "hipsloth_catalog_backup";

/**
 * Deep sanitize object to remove any `undefined` values which crash Firestore addDoc / updateDoc
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

export function getLocalCatalogItems(orgId?: string): CatalogItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const all: CatalogItem[] = JSON.parse(raw);
        const seen = new Set<string>();
        const unique = all.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
        return unique.filter(item => !orgId || item.orgId === orgId);
    } catch {
        return [];
    }
}

export function setLocalCatalogItems(items: CatalogItem[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
    } catch (e) {
        console.warn("Failed to set local catalog cache:", e);
    }
}

export function saveLocalCatalogItem(item: CatalogItem) {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const all: CatalogItem[] = raw ? JSON.parse(raw) : [];
        const idx = all.findIndex(i => i.id === item.id);
        if (idx >= 0) {
            all[idx] = item;
        } else {
            all.unshift(item);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all.slice(0, 100)));
    } catch (e) {
        console.warn("Failed to backup catalog item to localStorage:", e);
    }
}

export function removeLocalCatalogItem(id: string) {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return;
        const all: CatalogItem[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all.filter(i => i.id !== id)));
    } catch (e) {
        console.warn("Failed to remove catalog item from localStorage:", e);
    }
}

/**
 * Real-time subscription to Catalog Items for an organization
 */
export function subscribeCatalogItems(
    orgId: string,
    onData: (items: CatalogItem[]) => void,
    onError?: (err: any) => void
) {
    if (!orgId) {
        onData(getLocalCatalogItems());
        return () => {};
    }

    // Immediately deliver local data for zero-latency initial UI
    const local = getLocalCatalogItems(orgId);
    if (local.length > 0) {
        onData(local);
    }

    try {
        const colRef = collection(db, "catalog_items");
        const q = query(colRef, where("orgId", "==", orgId));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const results: CatalogItem[] = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        orgId: data.orgId || orgId,
                        name: data.name || "ไม่มีชื่อสินค้า",
                        code: data.code || "",
                        category: data.category || "อื่นๆ",
                        unitPrice: Number(data.unitPrice) || 0,
                        unit: data.unit || "ชิ้น",
                        storeId: data.storeId || "",
                        storeName: data.storeName || "",
                        storePhone: data.storePhone || "",
                        storeLocation: data.storeLocation || "",
                        storeMapUrl: data.storeMapUrl || "",
                        photos: Array.isArray(data.photos) ? data.photos : [],
                        description: data.description || "",
                        projectId: data.projectId || "",
                        projectName: data.projectName || "",
                        projectIds: Array.isArray(data.projectIds) ? data.projectIds : (data.projectId ? [data.projectId] : []),
                        projectNames: Array.isArray(data.projectNames) ? data.projectNames : (data.projectName ? [data.projectName] : []),
                        lastPurchasedDate: data.lastPurchasedDate || "",
                        createdBy: data.createdBy || "",
                        createdByName: data.createdByName || "ผู้บันทึก",
                        createdByRole: data.createdByRole || "",
                        createdByAvatar: data.createdByAvatar || "",
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
                        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString()
                    } as CatalogItem;
                });

                // Deduplicate by ID
                const uniqueMap = new Map<string, CatalogItem>();
                for (const item of results) {
                    uniqueMap.set(item.id, item);
                }

                const deduplicated = Array.from(uniqueMap.values());

                // Client-side sort: updatedAt descending, then createdAt descending
                deduplicated.sort((a, b) => {
                    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
                    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
                    return bTime - aTime;
                });

                setLocalCatalogItems(deduplicated);
                onData(deduplicated);
            },
            (error) => {
                console.warn("Firestore catalog subscription warning, using local fallback:", error);
                const fallback = getLocalCatalogItems(orgId);
                onData(fallback);
                if (onError) onError(error);
            }
        );

        return unsubscribe;
    } catch (error) {
        console.warn("Failed to subscribe to catalog items:", error);
        onData(getLocalCatalogItems(orgId));
        return () => {};
    }
}

/**
 * Create a new catalog item
 */
export async function createCatalogItem(
    orgId: string,
    itemData: Omit<CatalogItem, "id" | "orgId" | "createdAt" | "updatedAt">
): Promise<CatalogItem> {
    const timestamp = new Date().toISOString();
    const tempId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newItem: CatalogItem = {
        id: tempId,
        orgId,
        ...itemData,
        createdAt: timestamp,
        updatedAt: timestamp
    };

    // Optimistically save locally
    saveLocalCatalogItem(newItem);

    try {
        const colRef = collection(db, "catalog_items");
        const cleaned = cleanFirestoreData({
            ...newItem,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Use custom doc or addDoc
        const docRef = await addDoc(colRef, cleaned);
        const savedItem: CatalogItem = {
            ...newItem,
            id: docRef.id
        };

        // Update local with actual firestore id
        removeLocalCatalogItem(tempId);
        saveLocalCatalogItem(savedItem);

        return savedItem;
    } catch (error) {
        console.warn("Firestore addDoc catalog failed, kept in local storage:", error);
        return newItem;
    }
}

/**
 * Update an existing catalog item
 */
export async function updateCatalogItem(
    id: string,
    itemData: Partial<CatalogItem>
): Promise<void> {
    const timestamp = new Date().toISOString();

    // Optimistic local update
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
            const all: CatalogItem[] = JSON.parse(raw);
            const idx = all.findIndex(i => i.id === id);
            if (idx >= 0) {
                all[idx] = { ...all[idx], ...itemData, updatedAt: timestamp };
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
            }
        }
    } catch (e) {
        console.warn("Local update failed:", e);
    }

    try {
        const docRef = doc(db, "catalog_items", id);
        const cleaned = cleanFirestoreData({
            ...itemData,
            updatedAt: serverTimestamp()
        });
        await updateDoc(docRef, cleaned);
    } catch (error) {
        console.warn("Firestore updateDoc catalog item failed:", error);
    }
}

/**
 * Delete a catalog item
 */
export async function deleteCatalogItem(id: string): Promise<void> {
    removeLocalCatalogItem(id);

    try {
        const docRef = doc(db, "catalog_items", id);
        await deleteDoc(docRef);
    } catch (error) {
        console.warn("Firestore deleteDoc catalog item failed:", error);
    }
}
