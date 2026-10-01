"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Sparkles, Upload, Palette, Image as ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    PROJECT_COVER_CATEGORIES,
    PROJECT_COVER_PRESETS,
    getSmartProjectCover
} from "@/lib/project-covers"
import {
    PROJECT_THEMES,
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
}

export function CoverPresetPicker({
    value = "",
    projectName = "",
    projectId = "",
    onChange,
    onUploadClick,
    isUploading = false,
    className
}: CoverPresetPickerProps) {
    // Mode switcher: 'themes' (default graphic color & icons) vs 'photos' (stock photos)
    const [viewMode, setViewMode] = React.useState<'themes' | 'photos'>('themes')
    const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

    // Active theme resolved from value or auto-selected
    const activeTheme = React.useMemo(() => {
        return getProjectTheme({
            id: projectId,
            name: projectName,
            imageUrl: value
        })
    }, [projectId, projectName, value])

    const filteredPhotoPresets = React.useMemo(() => {
        if (selectedCategory === 'all') return PROJECT_COVER_PRESETS
        return PROJECT_COVER_PRESETS.filter(p => p.category === selectedCategory)
    }, [selectedCategory])

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
        <div className={cn("space-y-3", className)}>
            {/* Top Bar: View Mode Switcher + Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                {/* View Switcher: Graphic Themes (Recommended) vs Stock Photos */}
                <div className="flex items-center p-0.5 rounded-lg bg-muted/50 border border-white/5">
                    <button
                        type="button"
                        onClick={() => setViewMode('themes')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all",
                            viewMode === 'themes'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Palette className="w-3.5 h-3.5" />
                        <span>ธีมสี & ไอคอน</span>
                        <span className="text-[10px] opacity-75 font-normal ml-0.5">(แยกง่าย)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('photos')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all",
                            viewMode === 'photos'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>ภาพถ่าย</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleAutoSmartPick}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all font-medium active:scale-95"
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
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploading ? "กำลังอัปโหลด..." : "อัปโหลดภาพจริง"}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Mode 1: Graphic Color & Icon Themes Grid (Default & Recommended) */}
            {viewMode === 'themes' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
                    {PROJECT_THEMES.map(theme => {
                        const themeValue = `theme:${theme.id}`
                        const isSelected = value === themeValue || (!value.startsWith('http') && activeTheme.id === theme.id)
                        const ThemeIcon = theme.icon

                        return (
                            <button
                                key={theme.id}
                                type="button"
                                onClick={() => onChange(themeValue)}
                                className={cn(
                                    "group relative aspect-[16/11] rounded-xl overflow-hidden border text-left transition-all p-2 flex flex-col justify-between shadow-xs",
                                    isSelected
                                        ? "ring-2 ring-primary border-primary shadow-md scale-[1.02]"
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
                                        "w-7 h-7 rounded-lg flex items-center justify-center border backdrop-blur-md shadow-xs",
                                        theme.badgeBg
                                    )}>
                                        <ThemeIcon className={cn("w-3.5 h-3.5", theme.iconColor)} />
                                    </div>
                                    {isSelected && (
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                            <Check className="h-2.5 w-2.5" />
                                        </span>
                                    )}
                                </div>

                                {/* Bottom: Title & Category */}
                                <div className="relative z-10 min-w-0 mt-2">
                                    <span className="text-[11px] font-bold text-white block truncate leading-tight drop-shadow-sm">
                                        {theme.title.split(' (')[0]}
                                    </span>
                                    <span className="text-[9px] text-white/70 block truncate">
                                        {theme.categoryLabel}
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Mode 2: Stock Photo Presets (Alternative) */}
            {viewMode === 'photos' && (
                <div className="space-y-2">
                    {/* Category tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                        {PROJECT_COVER_CATEGORIES.map(cat => {
                            const isActive = selectedCategory === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-all border",
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                        {filteredPhotoPresets.map(preset => {
                            const isSelected = value === preset.url
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => onChange(preset.url)}
                                    className={cn(
                                        "group relative aspect-[16/10] rounded-xl overflow-hidden border text-left transition-all",
                                        isSelected
                                            ? "ring-2 ring-primary border-primary shadow-md scale-[1.02]"
                                            : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                                    )}
                                >
                                    <Image
                                        src={preset.thumbnail}
                                        alt={preset.title}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-2 flex items-end justify-between gap-1">
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-semibold text-white/90 truncate block drop-shadow-sm">
                                                {preset.title}
                                            </span>
                                            <span className="text-[9px] text-white/60 block">
                                                {preset.categoryLabel}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in-50">
                                                <Check className="h-3 w-3" />
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
 * Interactive Modal to quickly change project theme or cover anywhere without navigating away
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
            className="fixed inset-0 z-[170] flex items-center justify-center p-4 font-sans"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <SafeBackdrop onClose={onClose} className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

            <div className="relative w-full max-w-2xl bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" />
                            ปรับแต่งธีม & สัญลักษณ์โครงการ
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {projectName ? `โครงการ: ${projectName}` : "เลือกชุดสีและไอคอนสถาปัตยกรรม หรืออัปโหลดภาพจริง"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Live Preview Card */}
                    <div className="relative aspect-[21/9] sm:aspect-[24/9] rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-inner group">
                        {isCustomPhoto ? (
                            <>
                                <Image
                                    src={selectedUrl}
                                    alt="Cover Preview"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 640px"
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/35" />
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                            ภาพถ่ายจริง
                                        </span>
                                        <h4 className="text-white font-bold text-sm sm:text-base mt-1 drop-shadow-sm truncate max-w-[320px]">
                                            {projectName || "ชื่อโครงการของคุณ"}
                                        </h4>
                                    </div>
                                    <span className="text-[11px] text-white/70">
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
                                <div className="absolute inset-x-0 bottom-0 p-3 z-10 flex justify-between items-end pointer-events-none">
                                    <div>
                                        <span className={cn(
                                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md",
                                            previewTheme.badgeBg
                                        )}>
                                            <PreviewIcon className={cn("w-3 h-3", previewTheme.iconColor)} />
                                            <span>{previewTheme.categoryLabel}</span>
                                        </span>
                                        <h4 className="text-white font-bold text-sm sm:text-base mt-1 drop-shadow-sm truncate max-w-[320px]">
                                            {projectName || "ชื่อโครงการของคุณ"}
                                        </h4>
                                    </div>
                                    <span className="text-[11px] text-white/80 font-medium">
                                        {previewTheme.title}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {/* Presets Grid */}
                    <CoverPresetPicker
                        value={selectedUrl}
                        projectName={projectName}
                        projectId={projectId}
                        onChange={setSelectedUrl}
                        onUploadClick={() => fileInputRef.current?.click()}
                        isUploading={isUploading}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-white/10 bg-muted/20 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
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
    )
}
