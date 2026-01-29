"use client"

import { useState, useEffect } from "react"
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { useSettings } from "@/context/settings-context"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function DashboardBanner() {
    const { banners } = useSettings()
    const activeBanners = banners.filter(b => b.active)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const router = useRouter()

    // Auto-advance
    useEffect(() => {
        if (activeBanners.length <= 1 || isHovered) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeBanners.length)
        }, 6000)

        return () => clearInterval(timer)
    }, [activeBanners.length, isHovered])

    const nextSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length)
    }

    const prevSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
    }

    if (activeBanners.length === 0) return null

    const currentBanner = activeBanners[currentIndex]
    const hasLink = !!currentBanner.buttonLink

    const handleBannerClick = () => {
        if (hasLink && currentBanner.buttonLink) {
            router.push(currentBanner.buttonLink)
        }
    }

    return (
        <div
            className={cn(
                "relative h-[240px] sm:h-[320px] lg:h-[400px] overflow-hidden mb-10 group shadow-lg transition-all duration-500 bg-background select-none -mx-3 sm:-mx-8 lg:-mx-10 rounded-none",
                hasLink ? "cursor-pointer" : "cursor-default"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleBannerClick}
        >
            {/* Slides */}
            {activeBanners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={cn(
                        "absolute inset-0 transition-opacity duration-700 ease-in-out",
                        index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    )}
                >
                    {/* Background */}
                    <div className="absolute inset-0 bg-black">
                        {banner.url ? (
                            <>
                                <img src={banner.url} alt={banner.title} className="w-full h-full object-cover opacity-60" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </>
                        ) : (
                            /* Fallback Gradient - Unique per slide */
                            <div className={`absolute inset-0 animate-gradient-xy ${index === 0 ? "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600" :
                                index === 1 ? "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500" :
                                    index === 2 ? "bg-gradient-to-br from-green-500 via-teal-500 to-cyan-500" :
                                        index === 3 ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500" :
                                            "bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
                                }`}>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                                <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[200%] bg-white/5 blur-3xl rotate-12" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="relative z-20 h-full flex flex-col justify-center px-8 sm:px-12 max-w-2xl">
                        <div className="flex items-center gap-2 mb-3 opacity-0 animate-in slide-in-from-left-4 fade-in duration-700 delay-100 fill-mode-forwards">
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                                {index + 1} / {activeBanners.length}
                            </span>
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3 drop-shadow-lg opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200 fill-mode-forwards leading-tight">
                            {banner.title || "Welcome back!"}
                        </h2>

                        {banner.description && (
                            <p className="text-white/80 text-sm sm:text-base font-medium opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-forwards line-clamp-2">
                                {banner.description}
                            </p>
                        )}

                        {/* Button (Visual) */}
                        <div
                            onClick={(e) => {
                                // Redundant if parent handles it, but good for explicit intent if we stop propagation (which we don't need to)
                                // Just let it bubble to parent
                            }}
                            className="mt-6 flex items-center gap-2 text-white font-bold text-sm bg-white/10 hover:bg-white/20 w-fit px-4 py-2 rounded-xl backdrop-blur-md transition-all border border-white/5 opacity-0 animate-in fade-in duration-700 delay-500 fill-mode-forwards"
                        >
                            <span>{banner.buttonText || "Learn More"}</span>
                            <span>→</span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows (Only show if > 1 slide) */}
            {activeBanners.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/10"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-6 left-8 sm:left-12 z-30 flex gap-2">
                        {activeBanners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentIndex(idx)
                                }}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    idx === currentIndex ? "w-8 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
