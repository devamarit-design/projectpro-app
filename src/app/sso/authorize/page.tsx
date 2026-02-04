"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SSOAuthorizePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const redirectUri = searchParams.get("redirect_uri");
    const [status, setStatus] = useState("Checking authentication...");

    useEffect(() => {
        if (!redirectUri) {
            setStatus("Error: Missing redirect_uri");
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setStatus("Authenticated. Generating secure token...");
                try {
                    // Use Cloud Function to get a Custom Token (required for signInWithCustomToken on target app)
                    // Dynamic import to avoid SSR issues if strictly client side, though here we are client only
                    const { getChatHubToken } = await import("@/lib/functions-client");

                    const result = await getChatHubToken();

                    if (!result.token) {
                        throw new Error(result.error || "Failed to generate token");
                    }

                    // Redirect back to consumer
                    const callbackUrl = new URL(redirectUri);
                    callbackUrl.searchParams.set("token", result.token);

                    window.location.href = callbackUrl.toString();
                } catch (error) {
                    console.error("Token generation failed:", error);
                    setStatus("Error generating token: " + (error instanceof Error ? error.message : String(error)));
                }
            } else {
                // Not logged in, redirect to login page with return URL
                // We encode the current URL (which has the redirect_uri) as the 'next' or 'returnUrl'
                // Assuming Hipsloth uses /login?returnUrl=... or similar
                const currentPath = window.location.href; // This page
                router.push(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
            }
        });

        return () => unsubscribe();
    }, [redirectUri, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg mb-6 animate-pulse">
                HS
            </div>
            <h1 className="text-xl font-bold mb-2">Hipsloth SSO</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="animate-spin" size={20} />
                <p>{status}</p>
            </div>
        </div>
    );
}
