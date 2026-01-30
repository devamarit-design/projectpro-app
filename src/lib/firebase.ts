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
            tabManager: persistentMultipleTabManager()
        }),
        experimentalForceLongPolling: true, // Known workaround for some stream-related assertion failures
    });
} catch (e) {
    console.error("Firestore initialization failed, falling back to getFirestore", e);
    firestoreInstance = getFirestore(app);
}

// Global safety: If we see the specific ca9 error, we might want to suggest a hard refresh or clear cache.
if (typeof window !== "undefined") {
    const originalError = console.error;
    console.error = (...args) => {
        if (args[0]?.includes?.("ca9")) {
            console.warn("Detected Firestore CA9 error. Attempting to recover...");
            // Optionally: window.location.reload(); or clear indexedDB
        }
        originalError.apply(console, args);
    };
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
