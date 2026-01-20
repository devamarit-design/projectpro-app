"use client"

import { useState } from "react"
import { ArrowLeft, KeyRound, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n-context"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [email, setEmail] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { auth } = await import("@/lib/firebase")
            const { sendPasswordResetEmail } = await import("firebase/auth")

            await sendPasswordResetEmail(auth, email)
            setIsSent(true)
        } catch (error) {
            console.error("Error sending password reset email", error)
            // Optional: Set specific error state if needed, but for security we might not want to reveal too much
            // For now, let's just show sent to avoid enumeration attacks, or maybe a generic error toast
            // But to be user friendly let's show success even if email not found (security best practice)
            // However, for this app level, let's just let it succeed visually.
            setIsSent(true)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
                <div className="mb-6">
                    <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        {t.forgot_password.back_to_login}
                    </Link>
                </div>

                {isSent ? (
                    <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.forgot_password.check_email}</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t.forgot_password.sent_to} <strong>{email}</strong>.
                        </p>
                        <div className="pt-4">
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                            >
                                {t.forgot_password.return_to_login}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 pt-2">
                            {t.forgot_password.didnt_receive} <button onClick={() => setIsSent(false)} className="text-blue-600 hover:underline">{t.forgot_password.resend}</button>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2 text-center">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <KeyRound className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                {t.forgot_password.title}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t.forgot_password.subtitle}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.forgot_password.email}</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.forgot_password.placeholder}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t.forgot_password.sending}</span>
                                    </>
                                ) : (
                                    t.forgot_password.reset
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
