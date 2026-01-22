"use client"

import { motion } from "framer-motion"

export function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-8">
            <div className="relative flex items-center justify-center h-24 w-24">
                {/* Concentric rotating arcs */}
                <motion.div
                    className="absolute h-full w-full rounded-full border-t-4 border-l-4 border-primary border-transparent shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                <motion.div
                    className="absolute h-16 w-16 rounded-full border-b-4 border-r-4 border-primary/60 border-transparent shadow-[0_0_10px_rgba(var(--primary),0.2)]"
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                <motion.div
                    className="absolute h-8 w-8 rounded-full border-t-2 border-primary/40 border-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Center Glow */}
                <div className="h-2 w-2 rounded-full bg-primary blur-[2px] animate-pulse" />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold tracking-tight text-primary uppercase py-1"
                >
                    Hipslothproject
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-muted-foreground/80 font-medium text-sm tracking-widest uppercase"
                >
                    Preparing Workspace
                </motion.p>

                {/* Sleek progress line */}
                <div className="w-48 h-[2px] bg-secondary overflow-hidden rounded-full mt-2">
                    <motion.div
                        className="h-full bg-primary"
                        animate={{
                            x: ["-100%", "100%"]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
