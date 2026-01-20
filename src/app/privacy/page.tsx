"use client"

import { ArrowLeft, Shield, Lock, Eye, Server } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"

export default function PrivacyPolicyPage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container flex h-14 items-center">
                    <Link href="/login" className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        {t.privacy.back_to_login}
                    </Link>
                </div>
            </header>

            <main className="container max-w-3xl py-10 px-4 md:px-6">
                <div className="space-y-4 text-center mb-10">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t.privacy.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        We value your privacy. Here is how HipslothProject handles your data.
                    </p>
                    <p className="text-xs text-gray-400">{t.privacy.last_updated}: January 15, 2026</p>
                </div>

                <div className="prose dark:prose-invert max-w-none space-y-8">
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Server className="w-5 h-5 text-green-600" />
                            <h2 className="text-xl font-bold m-0">1. Data Storage (Local First)</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            HipslothProject is designed as a <strong>Local-First Application</strong>. This means that the majority of your data (projects, expenses, clients) is stored directly on your device using IndexedDB technology. We do not automatically upload your sensitive business data to a central cloud server without your explicit action (e.g., performing a backup).
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-purple-600" />
                            <h2 className="text-xl font-bold m-0">2. Data Collection</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            We collect minimal data necessary for the application's functionality:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-300">
                            <li><strong>Account Information:</strong> When you use Google Login, we store your name, email, and profile picture locally to identify your session.</li>
                            <li><strong>Usage Data:</strong> We may collect anonymous usage statistics to improve application performance.</li>
                            <li><strong>User Content:</strong> Projects, tasks, and documents you create are stored locally on your device.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-orange-600" />
                            <h2 className="text-xl font-bold m-0">3. Data Security</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Since data is stored on your device, the security of your data largely depends on the security of your device. We recommend:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-300">
                            <li>Using a device passcode or biometric lock.</li>
                            <li>Enabling the <strong>PIN Lock</strong> feature within HipslothProject settings.</li>
                            <li>Regularly backing up your data using the "Backup / Restore" feature in Settings.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold">4. Third-Party Services</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            We use the following third-party services:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-300">
                            <li><strong>Google Authentication:</strong> For secure sign-in verification.</li>
                            <li><strong>Vercel:</strong> For hosting the application static assets.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold">5. Contact Us</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            If you have any questions about this Privacy Policy, please contact us at:
                            <br />
                            <a href="mailto:support@hipslothproject.com" className="text-blue-600 hover:underline">support@hipslothproject.com</a>
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t text-center">
                    <p className="text-sm text-gray-500">
                        &copy; 2026 HipslothProject Construction App. All rights reserved.
                    </p>
                </div>
            </main>
        </div>
    )
}
