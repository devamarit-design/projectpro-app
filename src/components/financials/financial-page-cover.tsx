"use client"

import * as React from "react"
import {
    Sparkles,
    Image as ImageIcon,
    Check,
    Upload,
    RotateCcw,
    X,
    Wallet,
    TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface CoverPreset {
    id: string
    title: string
    category: string
    description: string
    url: string
}

export const FINANCIAL_COVER_PRESETS: CoverPreset[] = [
    {
        id: "expense-default",
        title: "Architectural Studio",
        category: "Architecture",
        description: "โต๊ะแบบก่อสร้าง แสงอบอุ่น สไตล์ดาร์กลักชูรี่",
        url: "/assets/covers/expense-cover.jpg",
    },
    {
        id: "income-default",
        title: "Golden Hour Towers",
        category: "Corporate",
        description: "ตึกสูงระฟ้าสะท้อนแสงอาทิตย์ยามเช้า พลังแห่งความสำเร็จ",
        url: "/assets/covers/income-cover.jpg",
    },
    {
        id: "financial-analytics",
        title: "Financial Analytics",
        category: "Finance",
        description: "กราฟสถิติและการวิเคราะห์กระแสเงินสดโมเดิร์น",
        url: "/assets/dashboard/financial-bg.jpg",
    },
    {
        id: "skyline-construction",
        title: "Skyline & Construction",
        category: "Site",
        description: "ขอบฟ้าเมืองและไซต์งานก่อสร้างโมเดิร์น",
        url: "/assets/dashboard/weather-bg.jpg",
    },
    {
        id: "team-workspace",
        title: "Studio Workspace",
        category: "Office",
        description: "พื้นที่ทำงานและสตูดิโอออกแบบร่วมสมัย",
        url: "/assets/dashboard/team-bg.jpg",
    },
    {
        id: "contemporary-timber",
        title: "Contemporary Residence",
        category: "Interior",
        description: "สถาปัตยกรรมโมเดิร์นโทนอบอุ่นและประณีต",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    },
    {
        id: "executive-office",
        title: "Executive Office Suite",
        category: "Office",
        description: "ห้องทำงานและห้องประชุมผู้บริหารโมเดิร์น",
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    },
    {
        id: "metropolis-skyline",
        title: "Metropolis Glass Facade",
        category: "City",
        description: "อาคารกระจกสะท้อนฟ้าใจกลางมหานคร",
        url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    },
]

interface FinancialPageCoverProps {
    type: "expenses" | "income"
    title: React.ReactNode
    subtitle?: string
    badgeText?: string
    badgeIcon?: React.ReactNode
    actions?: React.ReactNode
    mood: {
        emoji: string
        label: string
        color: string
        bg: string
        icon: any
    }
    dateLabel: string
    primaryMetricLabel: string
    primaryMetricValue: string
    secondaryMetricLabel: string
    secondaryMetricValue: string
    percent: number
    isAlert?: boolean
    subText?: string
}

export function FinancialPageCover({
    type,
    title,
    subtitle,
    badgeText,
    badgeIcon,
    actions,
    mood,
    dateLabel,
    primaryMetricLabel,
    primaryMetricValue,
    secondaryMetricLabel,
    secondaryMetricValue,
    percent,
    isAlert = false,
    subText,
}: FinancialPageCoverProps) {
    const defaultCover =
        type === "expenses"
            ? "/assets/covers/expense-cover.jpg"
            : "/assets/covers/income-cover.jpg"

    const storageKey = `hipsloth_cover_${type}`

    const [coverUrl, setCoverUrl] = React.useState<string>(defaultCover)
    const [isPickerOpen, setIsPickerOpen] = React.useState<boolean>(false)
    const [customUrlInput, setCustomUrlInput] = React.useState<string>("")
    const fileInputRef = React.useRef<HTMLInputElement | null>(null)

    // Load from localStorage on client-side mount
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                setCoverUrl(saved)
            }
        } catch {
            // Ignore localStorage errors
        }
    }, [storageKey])

    const handleSelectPreset = (url: string) => {
        setCoverUrl(url)
        try {
            localStorage.setItem(storageKey, url)
        } catch {}
    }

    const handleResetDefault = () => {
        setCoverUrl(defaultCover)
        try {
            localStorage.removeItem(storageKey)
        } catch {}
    }

    const handleApplyCustomUrl = (e: React.FormEvent) => {
        e.preventDefault()
        if (!customUrlInput.trim()) return
        handleSelectPreset(customUrlInput.trim())
        setCustomUrlInput("")
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const result = event.target?.result as string
            if (result) {
                handleSelectPreset(result)
            }
        }
        reader.readAsDataURL(file)
    }

    const MoodIcon = mood.icon || Wallet
    const isExpenses = type === "expenses"

    return (
        <>
            <div className="relative rounded-3xl border border-white/10 dark:border-white/10 shadow-2xl overflow-hidden group transition-all duration-500 bg-card">
                {/* Background Image Container with Ken Burns effect on hover */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img
                        key={coverUrl}
                        src={coverUrl}
                        alt={`${type} cover`}
                        className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-1000 opacity-90 dark:opacity-85"
                        onError={() => {
                            if (coverUrl !== defaultCover) {
                                setCoverUrl(defaultCover)
                            }
                        }}
                    />

                    {/* Gradient Overlays for Maximum Contrast & Text Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30 dark:from-[#090a0f] dark:via-[#090a0f]/80 dark:to-[#090a0f]/40 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent dark:from-[#090a0f]/95 dark:via-[#090a0f]/60 dark:to-transparent pointer-events-none" />

                    {/* Ambient Radial Glow Orb */}
                    <div
                        className={cn(
                            "absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[110px] pointer-events-none opacity-30 dark:opacity-45 transition-colors duration-1000",
                            isExpenses ? "bg-emerald-500" : "bg-amber-500"
                        )}
                    />
                    <div
                        className={cn(
                            "absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-20 dark:opacity-30 transition-colors duration-1000",
                            isExpenses ? "bg-teal-500" : "bg-orange-500"
                        )}
                    />

                    {/* Giant Faint Icon Watermark */}
                    <div className="absolute -right-8 -bottom-8 opacity-[0.04] dark:opacity-[0.07] pointer-events-none">
                        <MoodIcon className="w-80 h-80 text-foreground" />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative z-10 p-5 sm:p-7 md:p-8 flex flex-col justify-between gap-6">
                    {/* TOP BAR: Category Badge, Change Cover Button, and Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/85 dark:bg-black/60 backdrop-blur-md border border-white/15 dark:border-white/10 text-xs font-semibold text-foreground/90 shadow-sm">
                                {badgeIcon || (isExpenses ? <Wallet className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingUp className="w-3.5 h-3.5 text-amber-400" />)}
                                <span>{badgeText || (isExpenses ? "EXPENSE & COST CONTROL" : "REVENUE & BILLING")}</span>
                            </span>

                            {/* Change Cover Button */}
                            <button
                                onClick={() => setIsPickerOpen(true)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 dark:bg-black/50 hover:bg-background/90 dark:hover:bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
                                title="เปลี่ยนภาพปก (Change Cover)"
                            >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span className="hidden xs:inline">เปลี่ยนภาพปก</span>
                            </button>
                        </div>

                        {/* Page Action Buttons (Export, Add, etc.) */}
                        {actions && (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
                                {actions}
                            </div>
                        )}
                    </div>

                    {/* MIDDLE: Page Title & Subtitle */}
                    <div className="max-w-2xl">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground drop-shadow-sm flex items-center gap-3">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm sm:text-base text-muted-foreground/90 dark:text-gray-300 font-medium mt-1 drop-shadow-xs">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* BOTTOM: Integrated Financial Mood & Budget HUD Card */}
                    <div className="w-full bg-background/75 dark:bg-black/50 backdrop-blur-xl border border-white/15 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all">
                        {/* Left: Emoji & Mood Details */}
                        <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
                            <div className="text-4xl sm:text-5xl md:text-6xl filter drop-shadow-lg shrink-0 select-none animate-bounce duration-[2500ms]">
                                {mood.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn("font-black text-xl sm:text-2xl tracking-tight", mood.color)}>
                                        {mood.label}
                                    </span>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 dark:bg-white/5 border border-white/10 text-muted-foreground uppercase tracking-wider">
                                        {dateLabel}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs sm:text-sm font-medium text-muted-foreground">
                                    <div>
                                        {primaryMetricLabel}:{" "}
                                        <span className="text-foreground font-semibold">
                                            {primaryMetricValue}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {secondaryMetricLabel}:{" "}
                                        <span
                                            className={cn(
                                                "font-bold",
                                                isAlert ? "text-red-400" : "text-foreground font-bold"
                                            )}
                                        >
                                            {secondaryMetricValue}
                                        </span>
                                        <span className="text-xs opacity-75 font-mono font-semibold ml-0.5">
                                            ({percent}%)
                                        </span>
                                    </div>
                                </div>

                                {subText && (
                                    <div className="text-[10px] text-muted-foreground/70 italic mt-0.5 font-medium">
                                        {subText}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Sleek Progress Bar HUD */}
                        <div className="w-full md:w-[320px] lg:w-[360px] shrink-0">
                            <div className="flex justify-between items-center text-xs font-semibold mb-1.5 text-muted-foreground">
                                <span className="text-[11px] uppercase tracking-wider">
                                    {isExpenses ? "งบประมาณที่ใช้ไป" : "ความคืบหน้ารายรับ"}
                                </span>
                                <span className={cn("font-mono font-bold", isAlert ? "text-red-400" : mood.color)}>
                                    {percent}%
                                </span>
                            </div>

                            <div className="h-3.5 w-full bg-black/20 dark:bg-black/50 rounded-full overflow-hidden backdrop-blur-md border border-white/10 dark:border-white/5 p-0.5">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                                        isAlert
                                            ? "bg-gradient-to-r from-red-500 to-rose-600"
                                            : isExpenses
                                            ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
                                            : "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300"
                                    )}
                                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                                />
                            </div>

                            <div className="flex justify-between mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 font-mono">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* COVER PRESET PICKER MODAL */}
            {isPickerOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setIsPickerOpen(false)}
                >
                    <div
                        className="bg-card dark:bg-[#121318] border border-border dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-border dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">
                                        เลือกภาพหน้าปก (Cover Image)
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        เลือกภาพพรีเซ็ตที่ชอบ หรือวางลิงก์รูปภาพของคุณเอง
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPickerOpen(false)}
                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-1">
                            {/* Current Active Preview */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                                    ตัวอย่างภาพหน้าปกปัจจุบัน
                                </label>
                                <div className="relative h-32 rounded-2xl overflow-hidden border border-white/10 shadow-md">
                                    <img
                                        src={coverUrl}
                                        alt="Current Cover"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4">
                                        <span className="text-xs font-bold text-white bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                                            {isExpenses ? "Expenses Cover" : "Income Cover"} Active
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Preset Options Grid */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
                                    ภาพหน้าปกแนะนำ (Curated Presets)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {FINANCIAL_COVER_PRESETS.map((preset) => {
                                        const isSelected = coverUrl === preset.url
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => handleSelectPreset(preset.url)}
                                                className={cn(
                                                    "group relative flex flex-col text-left rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer",
                                                    isSelected
                                                        ? "border-primary ring-2 ring-primary/40 shadow-lg scale-[1.02]"
                                                        : "border-border dark:border-white/10 hover:border-primary/50 hover:shadow-md"
                                                )}
                                            >
                                                <div className="relative h-20 w-full overflow-hidden bg-muted">
                                                    <img
                                                        src={preset.url}
                                                        alt={preset.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "/assets/covers/expense-cover.jpg"
                                                        }}
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                                                            <div className="p-1 rounded-full bg-primary text-primary-foreground shadow-md">
                                                                <Check className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2 bg-card dark:bg-[#181920]">
                                                    <div className="text-[11px] font-bold text-foreground truncate">
                                                        {preset.title}
                                                    </div>
                                                    <div className="text-[9px] text-muted-foreground truncate">
                                                        {preset.category}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Custom URL Input & File Upload */}
                            <div className="pt-2 border-t border-border dark:border-white/10 space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                    กำหนดรูปภาพเอง (Custom Image)
                                </label>
                                <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
                                    <input
                                        type="url"
                                        placeholder="วางลิงก์รูปภาพ https://images.unsplash.com/..."
                                        value={customUrlInput}
                                        onChange={(e) => setCustomUrlInput(e.target.value)}
                                        className="flex-1 bg-muted/40 border border-border dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!customUrlInput.trim()}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                                    >
                                        นำไปใช้
                                    </button>
                                </form>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-muted/50 hover:bg-muted border border-border dark:border-white/10 rounded-xl text-xs font-medium text-foreground transition-all cursor-pointer"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-primary" />
                                        อัปโหลดจากอุปกรณ์
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleResetDefault}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        รีเซ็ตเป็นภาพตั้งต้น
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-border dark:border-white/10 bg-muted/20 flex justify-end">
                            <button
                                onClick={() => setIsPickerOpen(false)}
                                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
                            >
                                เสร็จสิ้น
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
