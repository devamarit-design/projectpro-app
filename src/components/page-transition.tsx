"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname()

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    )
}
