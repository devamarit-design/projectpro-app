"use client"

import { useState } from "react"
import { useOrganization } from "@/context/organization-context"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText } from "lucide-react"
import { toast } from "sonner"

export function GoogleSheetsSettings() {
    const { currentOrg } = useOrganization()
    const [sheetIdInput, setSheetIdInput] = useState(currentOrg?.settings?.googleSheetId || "")
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveSheetId = async () => {
        if (!currentOrg) return
        setIsSaving(true)
        try {
            const orgRef = doc(db, "organizations", currentOrg.id)
            await updateDoc(orgRef, {
                "settings.googleSheetId": sheetIdInput
            })
            toast.success("Google Sheet ID updated successfully")
        } catch (error) {
            console.error("Failed to update Google Sheet ID:", error)
            toast.error("Failed to update Google Sheet ID")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Google Sheets Integration</h2>
                <p className="text-muted-foreground">Automatically export new expenses to a specified Google Sheet.</p>
            </div>

            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 space-y-4">
                <div className="flex items-center gap-3 text-green-600 mb-2">
                    <FileText className="w-6 h-6" />
                    <span className="font-semibold text-lg">Sheet Configuration</span>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Google Sheet ID
                        </label>
                        <Input
                            placeholder="e.g. 1BxiMVs0XRYFgCEbQXhQ..."
                            value={sheetIdInput}
                            onChange={(e) => setSheetIdInput(e.target.value)}
                            className="bg-background"
                        />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            You can find the ID in your Google Sheet URL: <br />
                            <span className="font-mono text-[10px] break-all">https://docs.google.com/spreadsheets/d/<span className="font-bold text-foreground">{'<ID_HERE>'}</span>/edit</span>
                        </p>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleSaveSheetId}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-8"
                        >
                            {isSaving ? "Saving..." : "Save ID"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    Instructions for Setup
                </h4>
                <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                    <p>1. Open your target Google Sheet.</p>
                    <p>2. Click <strong>"Share"</strong> and add the Service Account email below as an <strong>Editor</strong>:</p>
                    <p className="font-mono text-xs bg-black/20 p-2 rounded-md break-all text-primary/80 select-all">
                        hipsloth-sheets-bot@hipslothsheet.iam.gserviceaccount.com
                    </p>
                    <p>3. Copy the Sheet ID from the URL and paste it above.</p>
                    <p className="text-xs mt-4 p-3 bg-background/50 rounded-lg border border-border/30">
                        <strong>Note:</strong> Once connected, every new expense created in this organization will be automatically added as a new row in your sheet.
                    </p>
                </div>
            </div>
        </div>
    )
}
