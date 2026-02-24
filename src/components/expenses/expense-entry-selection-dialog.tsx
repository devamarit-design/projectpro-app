"use client"

import * as React from "react"
import { X, ScanLine, FileText, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

interface ExpenseEntrySelectionDialogProps {
    isOpen: boolean
    onClose: () => void
    onSelectManual: () => void
    onSelectScan: () => void
}

export function ExpenseEntrySelectionDialog({
    isOpen,
    onClose,
    onSelectManual,
    onSelectScan
}: ExpenseEntrySelectionDialogProps) {
    const { t } = useTranslation()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-background/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <h2 className="text-xl font-bold tracking-tight">{t.expenses?.add_expense || "Add Expense"}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 pt-2 space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        Choose how you would like to add this expense.
                    </p>

                    {/* AI Scan Option */}
                    <button
                        onClick={() => {
                            onSelectScan()
                        }}
                        className="w-full group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all p-5 text-left flex items-start gap-4 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.98]"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-24 h-24 rotate-12" />
                        </div>

                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                            <ScanLine className="w-6 h-6 text-white" />
                        </div>
                        <div className="relative z-10 flex-1">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-purple-400 transition-colors flex items-center gap-2">
                                {t.expenses?.smart_scan || "AI Smart Scan"}
                                <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] uppercase font-bold tracking-wider">Recommended</span>
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 leading-snug">
                                Automatically extract data from your receipt image. Fast & easy.
                                <br />
                                <span className="text-xs opacity-70">(สแกนใบเสร็จด้วย AI)</span>
                            </p>
                        </div>
                    </button>

                    {/* Manual Entry Option */}
                    <button
                        onClick={() => {
                            onSelectManual()
                        }}
                        className="w-full group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all p-5 text-left flex items-start gap-4 hover:border-white/20 active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="w-6 h-6 text-foreground" />
                        </div>
                        <div className="relative z-10 flex-1">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                {t.expenses?.manual_entry || "Manual Entry"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 leading-snug">
                                Fill in all the details yourself. Best for expenses without receipts.
                                <br />
                                <span className="text-xs opacity-70">(กรอกข้อมูลเอง)</span>
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
