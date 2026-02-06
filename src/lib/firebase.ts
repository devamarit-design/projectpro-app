import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBTwH7aBFdmK94IWoy9Yys26494nfWaXMs",
    authDomain: "projectpro-app-76535.firebaseapp.com",
    projectId: "projectpro-app-76535",
    storageBucket: "projectpro-app-76535.firebasestorage.app",
    messagingSenderId: "343498206325",
    appId: "1:343498206325:web:44243bb7a9375b7693dc3c",
    measurementId: "G-FJKYP026ZP"
};

// Initialize Firebase (Singleton Pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with Offline Persistence and Robustness Settings
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

let firestoreInstance;
try {
    firestoreInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
            cacheSizeBytes: 40 * 1024 * 1024 // Limit to 40MB (Standard is 40MB, but let's be explicit or smaller if needed)
        }),
        experimentalForceLongPolling: true,
    });
} catch (e) {
    console.error("Firestore initialization failed, falling back to getFirestore", e);
    firestoreInstance = getFirestore(app);
}

// Global safety: If we see the specific ca9 error, we might want to suggest a hard refresh or clear cache.
if (typeof window !== "undefined") {
    const originalError = console.error;
    console.error = (...args) => {
        if (args[0]?.includes?.("ca9") || JSON.stringify(args).includes("ca9")) {
            console.warn("Detected Firestore CA9 error. Attempting to recover...");
            if (typeof window !== "undefined" && !(window as any)._isRecoveringFromFirestore) {
                (window as any)._isRecoveringFromFirestore = true;
                // Add a small delay to prevent instant loops
                setTimeout(() => {
                    const indexedDB = window.indexedDB || (window as any).mozIndexedDB || (window as any).webkitIndexedDB || (window as any).msIndexedDB;
                    if (indexedDB) {
                        try {
                            // Try to delete the specific database if name known, or just rely on reload to hopefully fix it
                            // Actually, for ca9, often a reload is enough if it's transient. 
                            // But if persistent, we might need to nuke the DB.
                            console.log("Reloading to recover from Firestore error...");
                            window.location.reload();
                        } catch (e) {
                            window.location.reload();
                        }
                    } else {
                        window.location.reload();
                    }
                }, 1000);
            }
        }
        const combinedStr = args.map(a =>
            a instanceof Error ? (a.message || "") + (a.stack || "") :
                typeof a === 'object' ? JSON.stringify(a, Object.getOwnPropertyNames(a)) : String(a)
        ).join(" ");

        if (combinedStr.includes("resource-exhausted") || combinedStr.includes("Quota exceeded") || combinedStr.includes("QuotaExceededError") || combinedStr.includes("exceeded the quota")) {
            console.warn("🔥 FIRESTORE QUOTA EXCEEDED DETECTED 🔥");
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
            }
            return; // Suppress the log from console to reduce noise
        }
        if (JSON.stringify(args).includes("maximum backoff delay")) {
            return; // Suppress backoff warning
        }
        originalError.apply(console, args);
    };
}

// Emergency Reset Utility
if (typeof window !== "undefined") {
    (window as any).resetFirestore = async () => {
        try {
            console.log("🚨 Emergency Reset Started...");

            // 1. Clear Web Storage immediately
            localStorage.clear();
            sessionStorage.clear();
            console.log("✅ Local and Session Storage cleared.");

            const { terminate, clearIndexedDbPersistence } = await import("firebase/firestore");

            // 2. Try to terminate gracefully if possible
            if (firestoreInstance) {
                try {
                    console.log("Terminating Firestore...");
                    await terminate(firestoreInstance);
                } catch (e) {
                    console.warn("Termination failed (ignoring):", e);
                }
            }

            // 3. Clear Persistence
            try {
                console.log("Clearing IndexedDB Persistence...");
                await clearIndexedDbPersistence(firestoreInstance);
            } catch (e) {
                console.warn("Clear persistence failed (ignoring):", e);
            }

            console.log("🚀 Done! Hard reloading in 1 second...");
            setTimeout(() => {
                window.location.href = window.location.origin + '?reset=' + Date.now();
            }, 1000);
        } catch (e) {
            console.error("Fatal Reset Error:", e);
            localStorage.clear();
            alert("Reset failed. Please clear your browser cache manually (Shift+Cmd+Delete).");
            window.location.reload();
        }
    };
    console.log("💡 Developer Tip: Run `resetFirestore()` in console if you encounter quota or sync issues.");
}

export const db = firestoreInstance;
export const storage = getStorage(app);

// Messaging (Client Side Only)
export let messaging: any;
if (typeof window !== "undefined") {
    import("firebase/messaging").then(({ getMessaging }) => {
        messaging = getMessaging(app);
    });
}

// Analytics (Client Side Only)
// let analytics;
// if (typeof window !== "undefined") {
//   import("firebase/analytics").then(({ getAnalytics }) => {
//     analytics = getAnalytics(app);
//   });
// }
