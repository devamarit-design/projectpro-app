"use client"

import { useState } from "react"
import { useSecurity } from "@/context/security-context"
import { Shield, Lock, Unlock, KeyRound, AlertTriangle, CheckCircle } from "lucide-react"
import { DataSettings } from "./data-settings"
import { useProjects } from "@/context/project-context"

import { useTranslation } from "@/lib/i18n-context"
export function SecuritySettings() {
    const { t } = useTranslation()
    const { hasPin, setPin, removePin, verifyPin } = useSecurity()
    const { currentUser } = useProjects()

    const isAdminOrOwner = currentUser?.role === 'Admin' || currentUser?.role === 'Owner'

    const [mode, setMode] = useState<"view" | "set" | "change" | "disable">("view")
    const [inputPin, setInputPin] = useState("")
    const [confirmPin, setConfirmPin] = useState("")
    const [currentPin, setCurrentPin] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const resetForm = () => {
        setInputPin("")
        setConfirmPin("")
        setCurrentPin("")
        setError("")
        setMode("view")
    }

    const handleSetPin = async () => {
        if (inputPin.length < 4) {
            setError(t.settings.security.messages.length_error)
            return
        }
        if (inputPin !== confirmPin) {
            setError(t.settings.security.messages.match_error)
            return
        }
        await setPin(inputPin)
        setSuccess(t.settings.security.messages.success_set)
        resetForm()
    }

    const handleChangePin = async () => {
        const isValid = await verifyPin(currentPin)
        if (!isValid) {
            setError(t.settings.security.messages.verify_error)
            return
        }
        if (inputPin.length < 4) {
            setError(t.settings.security.messages.length_error)
            return
        }
        if (inputPin !== confirmPin) {
            setError(t.settings.security.messages.match_error)
            return
        }
        await setPin(inputPin)
        setSuccess(t.settings.security.messages.success_update)
        resetForm()
    }

    const handleDisablePin = async () => {
        const isValid = await verifyPin(currentPin)
        if (!isValid) {
            setError(t.settings.security.messages.verify_error)
            return
        }
        await removePin()
        setSuccess(t.settings.security.messages.success_disable)
        resetForm()
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {t.settings.security.title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    {t.settings.security.subtitle}
                </p>
            </div>

            {/* Status Message */}
            {(error || success) && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${error
                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}>
                    {error ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{error || success}</span>
                </div>
            )}

            {/* Main Card */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasPin ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-muted-foreground"
                            }`}>
                            {hasPin ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">{t.settings.security.lock.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {hasPin ? t.settings.security.lock.enabled : t.settings.security.lock.disabled}
                            </p>
                        </div>
                    </div>
                    {mode === "view" && (
                        <button
                            onClick={() => setMode(hasPin ? "change" : "set")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${hasPin
                                ? "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                }`}
                        >
                            {hasPin ? t.settings.security.lock.change_btn : t.settings.security.lock.enable_btn}
                        </button>
                    )}
                </div>

                {/* Forms */}
                {mode === "set" && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid gap-4 max-w-sm">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.settings.security.form.new_pin}</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={inputPin}
                                    onChange={(e) => setInputPin(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder={t.settings.security.form.placeholder}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.settings.security.form.confirm_pin}</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder={t.settings.security.form.confirm_pin}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleSetPin} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90">{t.settings.security.form.save}</button>
                                <button onClick={resetForm} className="px-6 bg-transparent border border-white/10 text-muted-foreground hover:text-white py-2.5 rounded-xl font-medium">{t.settings.security.form.cancel}</button>
                            </div>
                        </div>
                    </div>
                )}

                {mode === "change" && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid gap-4 max-w-sm">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.settings.security.form.current_pin}</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={currentPin}
                                    onChange={(e) => setCurrentPin(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                            <div className="h-px bg-white/5 my-2" />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.settings.security.form.new_pin}</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={inputPin}
                                    onChange={(e) => setInputPin(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t.settings.security.form.confirm_pin}</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleChangePin} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90">{t.settings.security.form.update}</button>
                                <button onClick={resetForm} className="px-6 bg-transparent border border-white/10 text-muted-foreground hover:text-white py-2.5 rounded-xl font-medium">{t.settings.security.form.cancel}</button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <button
                                onClick={() => setMode("disable")}
                                className="text-red-500 text-sm font-medium flex items-center gap-2 hover:opacity-80"
                            >
                                <Unlock className="w-4 h-4" /> {t.settings.security.disable.btn}
                            </button>
                        </div>
                    </div>
                )}

                {mode === "disable" && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                            <h4 className="text-red-500 font-medium mb-1">{t.settings.security.disable.title}</h4>
                            <p className="text-sm text-red-500/70 mb-4">{t.settings.security.disable.desc}</p>

                            <div className="space-y-2 max-w-sm">
                                <label className="text-sm font-medium text-muted-foreground">{t.settings.security.form.confirm_pin}</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={currentPin}
                                    onChange={(e) => setCurrentPin(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 outline-none"
                                />
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleDisablePin} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700">{t.settings.security.disable.confirm_btn}</button>
                                    <button onClick={resetForm} className="px-6 bg-transparent border border-white/10 text-muted-foreground hover:text-white py-2.5 rounded-xl font-medium">{t.settings.security.form.cancel}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isAdminOrOwner && (
                <>
                    <div className="h-px bg-border my-8" />
                    <DataSettings />
                </>
            )}
        </div>
    )
}
