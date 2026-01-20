"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"

export default function WelcomeBackPage() {
    const router = useRouter()
    const { currentUser } = useProjects()
    const { t } = useTranslation()

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/")
        }, 2000) // 2 seconds delay

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">👋</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                    {t.welcome_back.greeting} <span className="text-primary">{currentUser?.name || t.welcome_back.fallback_name}</span>!
                </h1>

                <p className="text-muted-foreground max-w-md mx-auto">
                    {t.welcome_back.loading}
                </p>

                <div className="flex justify-center pt-8">
                    <div className="flex gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                            className="w-3 h-3 bg-primary rounded-full"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                            className="w-3 h-3 bg-primary rounded-full"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                            className="w-3 h-3 bg-primary rounded-full"
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
