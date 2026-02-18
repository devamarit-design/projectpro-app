import "server-only";
import { getApps, initializeApp, cert, getApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// There are two ways to initialize:
// 1. Using a service account JSON file (for local dev or non-Google clouds)
// 2. Using Google Application Default Credentials (for Cloud Run, Functions, App Engine)

// For this implementation, we'll try to use standard environment variables or default credentials.
// If you are using Vercel, you should set FIREBASE_SERVICE_ACCOUNT_KEY env var with the JSON content.

function getFirebaseAdminApp(): App {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0]!;
    }

    // Check if we have a service account key in env
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            return initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (error) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
            // Fallback to default credentials or other logic if needed
        }
    }

    // Fallback to default behavior (relies on GOOGLE_APPLICATION_CREDENTIALS or GCloud CLI)
    return initializeApp();
}

export const adminApp = getFirebaseAdminApp();
export const adminAuth = getAuth(adminApp);

import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const db = getFirestore(adminApp);
export const messaging = getMessaging(adminApp);
