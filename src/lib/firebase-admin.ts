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

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "projectpro-app-76535";
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            return initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id || projectId,
            });
        } catch (error) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
            // Fallback to default credentials or other logic if needed
        }
    }

    // Fallback: Always provide projectId so verifyIdToken can verify Google JWT tokens on Vercel
    return initializeApp({
        projectId,
    });
}

export const adminApp = getFirebaseAdminApp();
export const adminAuth = getAuth(adminApp);

import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const db = getFirestore(adminApp);
export const messaging = getMessaging(adminApp);
