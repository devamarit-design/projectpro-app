"use client"

import { useState } from "react"
import { useOrganization } from "@/context/organization-context"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function GoogleDriveSettings() {
    const { currentOrg } = useOrganization()
    const [folderIdInput, setFolderIdInput] = useState(currentOrg?.settings?.googleDriveFolderId || "")
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

    const isConnected = !!currentOrg?.settings?.googleDriveTokens?.refresh_token

    // Helper to extract just the ID if a user pastes a full URL or an ID with query params
    const handleFolderIdChange = (value: string) => {
        let cleanId = value.trim()

        const match = cleanId.match(/folders\/([a-zA-Z0-9_-]+)/)
        if (match) {
            cleanId = match[1]
        }

        if (cleanId.includes('?')) {
            cleanId = cleanId.split('?')[0]
        }

        setFolderIdInput(cleanId)
    }

    const handleConnectGoogle = async () => {
        if (!currentOrg) return

        setIsConnecting(true)
        try {
            // 1. Request OAuth2 Code from Google
            const client = (window as any).google.accounts.oauth2.initCodeClient({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file',
                ux_mode: 'popup',
                callback: async (response: any) => {
                    if (response.code) {
                        try {
                            // 2. Exchange code for tokens in Cloud Function
                            const functions = getFunctions(undefined, 'asia-southeast1')
                            const exchangeCode = httpsCallable(functions, 'exchangeGoogleDriveCode')
                            await exchangeCode({
                                code: response.code,
                                orgId: currentOrg.id
                            })
                            toast.success("Successfully connected Google Account!")
                        } catch (error) {
                            console.error("Token exchange failed:", error)
                            toast.error("Failed to link Google Account")
                        } finally {
                            setIsConnecting(false)
                        }
                    }
                },
            })
            client.requestCode()
        } catch (error) {
            console.error("GSI Init failed:", error)
            toast.error("Google Identity Services failed to load")
            setIsConnecting(false)
        }
    }

    const handleSaveFolderId = async () => {
        if (!currentOrg) return
        setIsSaving(true)
        setTestResult(null)
        try {
            const orgRef = doc(db, "organizations", currentOrg.id)
            await updateDoc(orgRef, {
                "settings.googleDriveFolderId": folderIdInput
            })
            toast.success("Google Drive Folder ID updated successfully")
        } catch (error) {
            console.error("Failed to update Google Drive Folder ID:", error)
            toast.error("Failed to update Google Drive Folder ID")
        } finally {
            setIsSaving(false)
        }
    }

    const handleTestConnection = async () => {
        if (!folderIdInput) {
            toast.error("Please enter a Folder ID first")
            return
        }
        setIsTesting(true)
        setTestResult(null)
        try {
            const functions = getFunctions(undefined, 'asia-southeast1')
            const testConnection = httpsCallable(functions, 'testGoogleDriveConnection')
            const result = await testConnection({ folderId: folderIdInput })

            const data = result.data as any
            if (data.success) {
                setTestResult({ success: true, message: `Connected to Folder: ${data.name}` })
                toast.success("Successfully connected to Google Drive folder!")
            } else {
                setTestResult({ success: false, message: data.error || "Failed to verify access." })
                toast.error("Verification failed")
            }
        } catch (error: any) {
            console.error("Test connection error:", error)
            setTestResult({ success: false, message: error.message || "An error occurred during verification." })
            toast.error("Verification failed")
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Google Drive Integration</h2>
                <p className="text-muted-foreground">Automatically backup generated documents to a specific folder in your Google Drive.</p>
            </div>

            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-blue-600">
                        <Cloud className="w-6 h-6" />
                        <span className="font-semibold text-lg">Account Connection</span>
                    </div>
                    {isConnected ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                            <CheckCircle2 className="w-4 h-4" />
                            Connected
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-medium border border-amber-200">
                            <AlertCircle className="w-4 h-4" />
                            Not Connected
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        To bypass storage limits and save files directly to your personal Drive, please connect your Google Account.
                    </p>
                    <Button
                        onClick={handleConnectGoogle}
                        disabled={isConnecting}
                        variant={isConnected ? "outline" : "default"}
                        className={!isConnected ? "bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto px-8" : "w-full sm:w-auto px-8"}
                    >
                        {isConnecting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" alt="Google" />
                        )}
                        {isConnected ? "Reconnect Google Account" : "Connect Google Drive"}
                    </Button>
                </div>

                {isConnected && (
                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                target Folder ID
                            </label>
                            <Input
                                placeholder="e.g. 1A2b3C4d5E6f..."
                                value={folderIdInput}
                                onChange={(e) => handleFolderIdChange(e.target.value)}
                                className="bg-background"
                            />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                You can find the ID in your Google Drive Folder URL: <br />
                                <span className="font-mono text-[10px] break-all">https://drive.google.com/drive/folders/<span className="font-bold text-foreground">{'<FOLDER_ID_HERE>'}</span></span>
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={handleSaveFolderId}
                                disabled={isSaving}
                                className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSaving ? "Saving..." : "Save Folder ID"}
                            </Button>
                            <Button
                                onClick={handleTestConnection}
                                disabled={isTesting || !folderIdInput}
                                variant="secondary"
                                className="w-full sm:w-auto px-8"
                            >
                                {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Test Connection
                            </Button>
                        </div>
                    </div>
                )}

                {testResult && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 text-sm ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <div className="pt-0.5">
                            <span className="font-medium">{testResult.success ? 'Sync Successful' : 'Sync Failed'}</span>
                            <p className="mt-1 opacity-90">{testResult.message}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    Getting Started
                </h4>
                <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                    <p>1. Click <strong>"Connect Google Drive"</strong> above and sign in with your account.</p>
                    <p>2. Create a folder in your Google Drive where you want to keep the files.</p>
                    <p>3. Copy the <strong>Folder ID</strong> from your browser's address bar and paste it above.</p>
                    <p>4. Save and Test. Now your files will be stored in your own space!</p>
                </div>
            </div>
        </div>
    )
}
