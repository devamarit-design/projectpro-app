"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Sparkles, Upload, Palette, Image as ImageIcon, X, RefreshCw, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    PROJECT_COVER_CATEGORIES,
    PROJECT_COVER_PRESETS,
    getSmartProjectCover
} from "@/lib/project-covers"
import {
    PROJECT_THEMES,
    PROJECT_THEME_CATEGORIES,
    ProjectThemeConfig,
    getProjectTheme,
    isCustomUploadedPhoto
} from "@/lib/project-themes"
import { ProjectCoverGraphic } from "@/components/projects/project-cover-graphic"
import { SafeBackdrop } from "@/components/ui/safe-backdrop"

interface CoverPresetPickerProps {
    value?: string
    projectName?: string
    projectId?: string
    onChange: (url: string) => void
    onUploadClick?: () => void
    isUploading?: boolean
    className?: string
    hideTopBar?: boolean
}

export function CoverPresetPicker({
    value = "",
    projectName = "",
    projectId = "",
    onChange,
    onUploadClick,
    isUploading = false,
    className,
    hideTopBar = false
}: CoverPresetPickerProps) {
    // Mode switcher: 'themes' (default graphic color & icons) vs 'photos' (stock photos)
    const [viewMode, setViewMode] = React.useState<'themes' | 'photos'>('themes')
    const [selectedThemeCategory, setSelectedThemeCategory] = React.useState<string>('all')
    const [selectedPhotoCategory, setSelectedPhotoCategory] = React.useState<string>('all')

    // Active theme resolved from value or auto-selected
    const activeTheme = React.useMemo(() => {
        return getProjectTheme({
            id: projectId,
            name: projectName,
            imageUrl: value
        })
    }, [projectId, projectName, value])

    const filteredThemes = React.useMemo(() => {
        if (selectedThemeCategory === 'all') return PROJECT_THEMES
        return PROJECT_THEMES.filter(t => t.category === selectedThemeCategory)
    }, [selectedThemeCategory])

    const filteredPhotoPresets = React.useMemo(() => {
        if (selectedPhotoCategory === 'all') return PROJECT_COVER_PRESETS
        return PROJECT_COVER_PRESETS.filter(p => p.category === selectedPhotoCategory)
    }, [selectedPhotoCategory])

    const handleAutoSmartPick = () => {
        if (viewMode === 'themes') {
            const autoTheme = getProjectTheme({
                id: projectId || Math.random().toString(),
                name: projectName || "Modern Project"
            })
            onChange(`theme:${autoTheme.id}`)
        } else {
            const smartUrl = getSmartProjectCover({
                id: projectId || Math.random().toString(),
                name: projectName || "Modern Project"
            })
            onChange(smartUrl)
        }
    }

    return (
        <div className={cn("space-y-3.5", className)}>
            {/* Top Bar: View Mode Switcher + Action Buttons */}
            {!hideTopBar && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* View Switcher: Graphic Themes (Recommended) vs Stock Photos */}
                    <div className="flex items-center p-0.5 rounded-xl bg-muted/60 border border-white/10">
                        <button
                            type="button"
                            onClick={() => setViewMode('themes')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all",
                                viewMode === 'themes'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Palette className="w-3.5 h-3.5" />
                            <span>ธีมสี & สัญลักษณ์ CAD</span>
                            <span className="text-[10px] opacity-75 font-normal ml-0.5 hidden sm:inline">(แยกง่าย)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('photos')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all",
                                viewMode === 'photos'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>ภาพถ่ายสต็อก</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleAutoSmartPick}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all font-medium active:scale-95"
                            title="ให้ระบบเลือกสี/ภาพที่เหมาะสมตามชื่อโครงการให้อัตโนมัติ"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>เลือกให้อัตโนมัติ</span>
                        </button>

                        {onUploadClick && (
                            <button
                                type="button"
                                onClick={onUploadClick}
                                disabled={isUploading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploading ? "กำลังอัปโหลด..." : "อัปโหลดภาพจริง"}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Mode 1: Graphic Color & Icon Themes Grid (Default & Recommended) */}
            {viewMode === 'themes' && (
                <div className="space-y-2.5">
                    {/* Theme Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                        {PROJECT_THEME_CATEGORIES.map(cat => {
                            const isActive = selectedThemeCategory === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedThemeCategory(cat.id)}
                                    className={cn(
                                        "px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-all border",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                                            : "bg-muted/40 hover:bg-muted/80 text-muted-foreground border-white/5 hover:text-foreground"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Responsive themes grid with comfortable spacing - never cramps Thai text */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                        {filteredThemes.map(theme => {
                            const themeValue = `theme:${theme.id}`
                            const isSelected = value === themeValue || (!value.startsWith('http') && activeTheme.id === theme.id)
                            const ThemeIcon = theme.icon

                            return (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => onChange(themeValue)}
                                    className={cn(
                                        "group relative min-h-[100px] rounded-2xl overflow-hidden border text-left transition-all p-3 flex flex-col justify-between shadow-xs",
                                        isSelected
                                            ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]"
                                            : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                                    )}
                                >
                                    {/* Miniature Graphic Background */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <ProjectCoverGraphic
                                            theme={theme}
                                            name={projectName}
                                            compact
                                            showMonogram={false}
                                        />
                                    </div>

                                    {/* Top: Icon + Selection Check */}
                                    <div className="relative z-10 flex items-start justify-between">
                                        <div className={cn(
                                            "w-7.5 h-7.5 rounded-xl flex items-center justify-center border backdrop-blur-md shadow-xs",
                                            theme.badgeBg
                                        )}>
                                            <ThemeIcon className={cn("w-3.5 h-3.5", theme.iconColor)} />
                                        </div>
                                        {isSelected && (
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-in zoom-in-50">
                                                <Check className="h-3 w-3 stroke-[3]" />
                                            </span>
                                        )}
                                    </div>

                                    {/* Bottom: Title & Category */}
                                    <div className="relative z-10 min-w-0 mt-2">
                                        <span className="text-xs font-bold text-white block truncate leading-tight drop-shadow-sm">
                                            {theme.title.split(' (')[0]}
                                        </span>
                                        <span className="text-[10px] text-white/75 block truncate mt-0.5">
                                            {theme.categoryLabel}
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Mode 2: Stock Photo Presets (Alternative) */}
            {viewMode === 'photos' && (
                <div className="space-y-2.5">
                    {/* Category tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                        {PROJECT_COVER_CATEGORIES.map(cat => {
                            const isActive = selectedPhotoCategory === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedPhotoCategory(cat.id)}
                                    className={cn(
                                        "px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-all border",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                                            : "bg-muted/40 hover:bg-muted/80 text-muted-foreground border-white/5 hover:text-foreground"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            )
                        })}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                        {filteredPhotoPresets.map(preset => {
                            const isSelected = value === preset.url
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => onChange(preset.url)}
                                    className={cn(
                                        "group relative aspect-[16/10] rounded-2xl overflow-hidden border text-left transition-all",
                                        isSelected
                                            ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]"
                                            : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                                    )}
                                >
                                    <Image
                                        src={preset.thumbnail}
                                        alt={preset.title}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-end justify-between gap-1">
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-white/95 truncate block drop-shadow-sm">
                                                {preset.title}
                                            </span>
                                            <span className="text-[10px] text-white/60 block mt-0.5">
                                                {preset.categoryLabel}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-in zoom-in-50">
                                                <Check className="h-3 w-3 stroke-[3]" />
                                            </span>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Interactive Modal to quickly change project theme or cover anywhere without navigating away.
 * Features a modern, spacious desktop layout with large cinematic Live Preview on the left,
 * and high-contrast, comfortable preset grids on the right.
 */
interface CoverPresetModalProps {
    isOpen: boolean
    onClose: () => void
    currentImageUrl?: string
    projectName?: string
    projectId?: string
    onSelectCover: (newUrl: string) => Promise<void> | void
    onUploadCustomFile?: (file: File) => Promise<string>
}

export function CoverPresetModal({
    isOpen,
    onClose,
    currentImageUrl,
    projectName = "",
    projectId = "",
    onSelectCover,
    onUploadCustomFile
}: CoverPresetModalProps) {
    const [selectedUrl, setSelectedUrl] = React.useState<string>(currentImageUrl || "")
    const [viewMode, setViewMode] = React.useState<'themes' | 'photos'>('themes')
    const [selectedThemeCategory, setSelectedThemeCategory] = React.useState<string>('all')
    const [selectedPhotoCategory, setSelectedPhotoCategory] = React.useState<string>('all')
    const [isSaving, setIsSaving] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (isOpen) {
            setSelectedUrl(currentImageUrl || "")
        }
    }, [isOpen, currentImageUrl])

    // Live preview resolution
    const isCustomPhoto = React.useMemo(() => {
        return isCustomUploadedPhoto(selectedUrl)
    }, [selectedUrl])

    const previewTheme = React.useMemo(() => {
        return getProjectTheme({
            id: projectId,
            name: projectName,
            imageUrl: selectedUrl
        })
    }, [projectId, projectName, selectedUrl])

    const filteredThemes = React.useMemo(() => {
        if (selectedThemeCategory === 'all') return PROJECT_THEMES
        return PROJECT_THEMES.filter(t => t.category === selectedThemeCategory)
    }, [selectedThemeCategory])

    const filteredPhotoPresets = React.useMemo(() => {
        if (selectedPhotoCategory === 'all') return PROJECT_COVER_PRESETS
        return PROJECT_COVER_PRESETS.filter(p => p.category === selectedPhotoCategory)
    }, [selectedPhotoCategory])

    if (!isOpen) return null

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !onUploadCustomFile) return

        setIsUploading(true)
        try {
            const uploadedUrl = await onUploadCustomFile(file)
            setSelectedUrl(uploadedUrl)
        } catch (err) {
            console.error("Upload custom file failed:", err)
        } finally {
            setIsUploading(false)
        }
    }

    const handleAutoSmartPick = () => {
        if (viewMode === 'themes') {
            const autoTheme = getProjectTheme({
                id: projectId || Math.random().toString(),
                name: projectName || "Modern Project"
            })
            setSelectedUrl(`theme:${autoTheme.id}`)
        } else {
            const smartUrl = getSmartProjectCover({
                id: projectId || Math.random().toString(),
                name: projectName || "Modern Project"
            })
            setSelectedUrl(smartUrl)
        }
    }

    const handleSave = async () => {
        if (!selectedUrl) return
        setIsSaving(true)
        try {
            await onSelectCover(selectedUrl)
            onClose()
        } catch (err) {
            console.error("Failed to save cover image", err)
        } finally {
            setIsSaving(false)
        }
    }

    const PreviewIcon = previewTheme.icon

    return (
        <div
            className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-4 md:p-6 font-sans"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <SafeBackdrop onClose={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-md" />

            <div className="relative w-full max-w-xl lg:max-w-5xl xl:max-w-6xl bg-card border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0 bg-muted/10">
                    <div className="min-w-0 pr-3">
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2 truncate">
                            <Palette className="w-5 h-5 text-primary shrink-0" />
                            <span>ปรับแต่งธีม & ภาพปกโครงการ</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {projectName ? `โครงการ: ${projectName}` : "เลือกชุดสีและไอคอนสถาปัตยกรรม หรืออัปโหลดภาพไซต์งานจริง"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body: Responsive 2-column on desktop (Left: Preview & Quick Actions, Right: Presets) */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Column (Desktop Live Preview & Actions) */}
                    <div className="lg:w-[380px] xl:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 p-4 sm:p-5 lg:p-6 bg-slate-950/40 flex flex-col justify-between overflow-y-auto space-y-4">
                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    ตัวอย่างการแสดงผลจริง (Live Preview)
                                </span>
                                <span className={cn(
                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border",
                                    isCustomPhoto
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                        : "bg-primary/20 text-primary border-primary/30"
                                )}>
                                    {isCustomPhoto ? "ภาพถ่ายจริง" : "ธีมกราฟิก CAD"}
                                </span>
                            </div>

                            {/* Cinematic Preview Banner - 16:10 aspect ratio */}
                            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-900 shadow-xl group">
                                {isCustomPhoto ? (
                                    <>
                                        <Image
                                            src={selectedUrl}
                                            alt="Cover Preview"
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 420px"
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/35" />
                                        <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex justify-between items-end">
                                            <div className="min-w-0 pr-2">
                                                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/30 px-2 py-0.5 rounded-md border border-emerald-500/40 inline-block mb-1">
                                                    ภาพถ่ายจริง
                                                </span>
                                                <h4 className="text-white font-bold text-sm sm:text-base drop-shadow-md truncate">
                                                    {projectName || "ชื่อโครงการของคุณ"}
                                                </h4>
                                            </div>
                                            <span className="text-[10px] text-white/70 shrink-0 font-medium">
                                                Custom Photo
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ProjectCoverGraphic
                                            theme={previewTheme}
                                            name={projectName}
                                            compact={false}
                                        />
                                        <div className="absolute inset-x-0 bottom-0 p-3.5 z-10 flex justify-between items-end pointer-events-none">
                                            <div className="min-w-0 pr-2">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md mb-1",
                                                    previewTheme.badgeBg
                                                )}>
                                                    <PreviewIcon className={cn("w-3 h-3", previewTheme.iconColor)} />
                                                    <span>{previewTheme.categoryLabel}</span>
                                                </span>
                                                <h4 className="text-white font-bold text-sm sm:text-base drop-shadow-md truncate">
                                                    {projectName || "ชื่อโครงการของคุณ"}
                                                </h4>
                                            </div>
                                            <span className="text-[11px] text-white/85 font-medium shrink-0 drop-shadow-sm">
                                                {previewTheme.title.split(' (')[0]}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Theme Details Card */}
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                                            style={{ backgroundColor: isCustomPhoto ? '#10b981' : previewTheme.bgTint }}
                                        />
                                        <span className="text-xs font-semibold text-foreground truncate">
                                            {isCustomPhoto ? "ภาพถ่ายจริงที่อัปโหลด" : previewTheme.title}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                                        {isCustomPhoto ? "Custom" : previewTheme.categoryLabel}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {isCustomPhoto
                                        ? "ภาพจริงจากอุปกรณ์หรือไซต์งานโครงการ ให้มุมมองภาพถ่ายจริงของสถานที่"
                                        : "ธีมกราฟิกสถาปัตยกรรม CAD Blueprint ช่วยแยกประเภทโครงการได้ทันทีอย่างชัดเจน"
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Left column action shortcuts */}
                        <div className="space-y-2 pt-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-white/10 transition-all font-medium text-xs active:scale-95 disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4 text-primary" />
                                <span>{isUploading ? "กำลังอัปโหลดรูปภาพ..." : "อัปโหลดภาพจริงจากเครื่อง"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleAutoSmartPick}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all font-medium text-xs active:scale-95"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>ให้ระบบเลือกสีตามชื่อโครงการ</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column (Preset Selection Grid & Categories) */}
                    <div className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 flex flex-col overflow-y-auto space-y-4">
                        {/* Mode Switcher Tabs */}
                        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center p-1 rounded-xl bg-muted/50 border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('themes')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all",
                                        viewMode === 'themes'
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Palette className="w-3.5 h-3.5" />
                                    <span>ธีมสี & สัญลักษณ์ CAD</span>
                                    <span className="text-[10px] opacity-75 font-normal ml-0.5 hidden sm:inline">(แยกง่าย)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('photos')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all",
                                        viewMode === 'photos'
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>คลังภาพถ่ายสต็อก</span>
                                </button>
                            </div>

                            <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                {viewMode === 'themes' ? `ทั้งหมด ${filteredThemes.length} ธีม` : `ทั้งหมด ${filteredPhotoPresets.length} ภาพ`}
                            </span>
                        </div>

                        {/* Themes Mode */}
                        {viewMode === 'themes' && (
                            <div className="space-y-3 flex-1 flex flex-col min-h-0">
                                {/* Category Filter Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none shrink-0">
                                    {PROJECT_THEME_CATEGORIES.map(cat => {
                                        const isActive = selectedThemeCategory === cat.id
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedThemeCategory(cat.id)}
                                                className={cn(
                                                    "px-3 py-1 text-xs rounded-xl whitespace-nowrap transition-all border",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                                                        : "bg-muted/40 hover:bg-muted/80 text-muted-foreground border-white/5 hover:text-foreground"
                                                )}
                                            >
                                                {cat.label}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Themes Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto pr-1 max-h-[460px] lg:max-h-[500px]">
                                    {filteredThemes.map(theme => {
                                        const themeValue = `theme:${theme.id}`
                                        const isSelected = selectedUrl === themeValue || (!selectedUrl.startsWith('http') && previewTheme.id === theme.id)
                                        const ThemeIcon = theme.icon

                                        return (
                                            <button
                                                key={theme.id}
                                                type="button"
                                                onClick={() => setSelectedUrl(themeValue)}
                                                className={cn(
                                                    "group relative min-h-[108px] rounded-2xl overflow-hidden border text-left transition-all p-3.5 flex flex-col justify-between shadow-xs",
                                                    isSelected
                                                        ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]"
                                                        : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                                                )}
                                            >
                                                {/* Background Graphic */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <ProjectCoverGraphic
                                                        theme={theme}
                                                        name={projectName}
                                                        compact
                                                        showMonogram={false}
                                                    />
                                                </div>

                                                {/* Top: Icon + Selection Check */}
                                                <div className="relative z-10 flex items-start justify-between">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-xl flex items-center justify-center border backdrop-blur-md shadow-xs",
                                                        theme.badgeBg
                                                    )}>
                                                        <ThemeIcon className={cn("w-4 h-4", theme.iconColor)} />
                                                    </div>
                                                    {isSelected && (
                                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-in zoom-in-50">
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Bottom: Title & Category */}
                                                <div className="relative z-10 min-w-0 mt-2.5">
                                                    <span className="text-xs sm:text-[13px] font-bold text-white block truncate leading-tight drop-shadow-sm">
                                                        {theme.title.split(' (')[0]}
                                                    </span>
                                                    <span className="text-[10px] text-white/75 block truncate mt-0.5">
                                                        {theme.categoryLabel}
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stock Photos Mode */}
                        {viewMode === 'photos' && (
                            <div className="space-y-3 flex-1 flex flex-col min-h-0">
                                {/* Photo Category Tabs */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none shrink-0">
                                    {PROJECT_COVER_CATEGORIES.map(cat => {
                                        const isActive = selectedPhotoCategory === cat.id
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedPhotoCategory(cat.id)}
                                                className={cn(
                                                    "px-3 py-1 text-xs rounded-xl whitespace-nowrap transition-all border",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                                                        : "bg-muted/40 hover:bg-muted/80 text-muted-foreground border-white/5 hover:text-foreground"
                                                )}
                                            >
                                                {cat.label}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Photos Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto pr-1 max-h-[460px] lg:max-h-[500px]">
                                    {filteredPhotoPresets.map(preset => {
                                        const isSelected = selectedUrl === preset.url
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => setSelectedUrl(preset.url)}
                                                className={cn(
                                                    "group relative aspect-[16/10] rounded-2xl overflow-hidden border text-left transition-all",
                                                    isSelected
                                                        ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]"
                                                        : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                                                )}
                                            >
                                                <Image
                                                    src={preset.thumbnail}
                                                    alt={preset.title}
                                                    fill
                                                    sizes="(max-width: 1024px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                                <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-1">
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] sm:text-xs font-semibold text-white/95 truncate block drop-shadow-sm">
                                                            {preset.title}
                                                        </span>
                                                        <span className="text-[10px] text-white/65 block mt-0.5">
                                                            {preset.categoryLabel}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-in zoom-in-50">
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-t border-white/10 bg-muted/20 shrink-0">
                    <div className="text-xs text-muted-foreground hidden sm:block truncate pr-2">
                        {isCustomPhoto ? (
                            <span className="text-emerald-400 font-medium">ภาพถ่ายจริงถูกเลือกอยู่</span>
                        ) : (
                            <span>กำลังเลือกธีม: <strong className="text-foreground">{previewTheme.title}</strong></span>
                        )}
                    </div>
                    <div className="flex items-center gap-2.5 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || !selectedUrl}
                            className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? "กำลังบันทึก..." : "บันทึกรูปแบบโครงการ"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
