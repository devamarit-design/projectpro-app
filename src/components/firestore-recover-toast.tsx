"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { AlertCircle, RefreshCw } from "lucide-react"

export function FirestoreRecoverToast() {
    useEffect(() => {
        const handleQuotaExceeded = () => {
            console.warn("Global Handler: Firestore Quota Exceeded")

            toast.custom((t) => (
                <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 shadow-2xl rounded-2xl p-4 w-full md:w-[356px] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex items-start gap-3">
                        <div className="bg-red-500/20 p-2 rounded-full shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-500">Storage Limit Reached</h3>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Browser storage is full. We need to clear all local data to restore service. You will not lose your history, only your current session.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => toast.dismiss(t)}
                            className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
                        >
                            Ignore
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                                if ((window as any).resetFirestore) {
                                    (window as any).resetFirestore();
                                } else {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <RefreshCw className="w-3 h-3 animate-spin-slow" />
                            Perform Hard Repair
                        </button>
                    </div>
                </div>
            ), {
                duration: Infinity, // Stay until dismissed
                id: 'firestore-quota-error' // Prempts duplicates
            })
        }

        window.addEventListener('firestore-quota-exceeded', handleQuotaExceeded)
        return () => window.removeEventListener('firestore-quota-exceeded', handleQuotaExceeded)
    }, [])

    return null // Headless component
}
