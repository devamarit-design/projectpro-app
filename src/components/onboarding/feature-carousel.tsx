"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, CheckCircle2, Layout, Wallet, FileText, Users, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCarouselProps {
    onComplete: () => void
}

const slides = [
    {
        id: 1,
        title: "Master Your Projects",
        description: "Plan, track, and deliver construction projects with powerful Kanban boards and timelines.",
        image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000&auto=format&fit=crop",
        icon: Layout,
        color: "text-blue-500",
        bgColor: "bg-blue-500/20"
    },
    {
        id: 2,
        title: "Smart Financials",
        description: "Control your budget with precision. Scan receipts, track expenses, and manage cash flow in real-time.",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop",
        icon: Wallet,
        color: "text-green-500",
        bgColor: "bg-green-500/20"
    },
    {
        id: 3,
        title: "Professional Documents",
        description: "Create and manage contracts, invoices, and quotations effortlessly. Keep everything organized.",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1000&auto=format&fit=crop",
        icon: FileText,
        color: "text-purple-500",
        bgColor: "bg-purple-500/20"
    },
    {
        id: 4,
        title: "Unified Teamwork",
        description: "Connect your office and field teams. Assign tasks, share files, and stay in sync anywhere.",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop",
        icon: Users,
        color: "text-orange-500",
        bgColor: "bg-orange-500/20"
    }
]

export default function FeatureCarousel({ onComplete }: FeatureCarouselProps) {
    const [currentSlide, setCurrentSlide] = React.useState(0)

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1)
        } else {
            onComplete()
        }
    }

    return (
        <div className="w-full min-h-screen flex flex-col relative overflow-hidden bg-black text-white">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        className="absolute inset-0"
                    >
                        <img
                            src={slides[currentSlide].image}
                            alt="Background"
                            className="w-full h-full object-cover opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col justify-end p-8 sm:p-12 pb-16 max-w-2xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-6"
                    >
                        {/* Icon Badge */}
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl", slides[currentSlide].bgColor)}>
                            {React.createElement(slides[currentSlide].icon, {
                                className: cn("w-8 h-8", slides[currentSlide].color)
                            })}
                        </div>

                        {/* Text Content */}
                        <div className="space-y-3">
                            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                {slides[currentSlide].title}
                            </h2>
                            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-md">
                                {slides[currentSlide].description}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="mt-12 flex items-center justify-between">
                    {/* Indicators */}
                    <div className="flex gap-2">
                        {slides.map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    index === currentSlide ? "w-8 bg-primary" : "w-1.5 bg-white/20"
                                )}
                            />
                        ))}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={handleNext}
                        className="group flex items-center gap-3 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
                        <ChevronRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-1", currentSlide === slides.length - 1 ? "hidden" : "block")} />
                        {currentSlide === slides.length - 1 && <ArrowRight className="w-5 h-5 ml-1" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
