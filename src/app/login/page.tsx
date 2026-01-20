"use client"

import { useState, useEffect } from "react"
import { useProjects } from "@/context/project-context"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"

export default function LoginPage() {
    const { login, currentUser, isAuthLoading } = useProjects()
    const { t } = useTranslation()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!isAuthLoading && currentUser) {
            // If they have completed onboarding OR belong to any organization, go to dashboard
            if (currentUser.hasOnboarded || (currentUser.orgIds && currentUser.orgIds.length > 0)) {
                router.push("/")
            } else {
                router.push("/onboarding")
            }
        }
    }, [currentUser, isAuthLoading, router])

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError(null)
        try {
            await login("google")
        } catch (err: any) {
            setError(err?.message || t.login.error_login_failed)
            setIsLoading(false)
        }
    }

    return (

        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-black rounded-2xl shadow-2xl p-8 border border-zinc-900">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="relative w-48 h-auto mb-4">
                        <img
                            src="/logo.png"
                            alt="ProjectPro Logo"
                            className="w-full h-auto object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            {t.login.title}
                        </h1>
                        <p className="text-sm text-zinc-400 mt-2">
                            {t.login.subtitle}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <form onSubmit={async (e) => {
                        e.preventDefault()
                        setIsLoading(true)
                        setError(null)
                        const formData = new FormData(e.currentTarget)
                        const email = formData.get("email") as string
                        const password = formData.get("password") as string

                        try {
                            await login("credentials", { email, password })
                        } catch (err: any) {
                            setError(err?.message || t.login.error_invalid)
                            setIsLoading(false)
                        }
                    }} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-950/20 border border-red-900/50 rounded-lg">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">{t.login.email}</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="name@company.com"
                                className="w-full px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-white focus:ring-2 focus:ring-white/20 focus:border-white/20 outline-none transition-all placeholder:text-zinc-600"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-zinc-300">{t.login.password}</label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
                                >
                                    {t.login.forgot_password}
                                </Link>
                            </div>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-white focus:ring-2 focus:ring-white/20 focus:border-white/20 outline-none transition-all placeholder:text-zinc-600"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-black" /> : t.login.sign_in}
                        </button>
                    </form>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-900" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black px-2 text-zinc-500">
                                {t.login.or_continue}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white font-medium py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 4.61c1.61 0 3.09.56 4.23 1.64l3.18-3.18C17.46 1.05 14.94 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <span>{t.login.sign_in_google}</span>
                            </>
                        )}
                    </button>

                    <div className="relative pt-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-900" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black px-2 text-zinc-500">
                                {t.login.secured_by}
                            </span>
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            {t.login.privacy_policy}
                        </Link>
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-sm text-gray-500">
                            {t.login.no_account}{" "}
                            <Link href="/register" className="text-white hover:text-zinc-300 font-medium hover:underline">
                                {t.login.sign_up}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
