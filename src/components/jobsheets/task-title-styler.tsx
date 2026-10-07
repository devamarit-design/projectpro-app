"use client";

import React, { useState } from "react";
import { 
    Bold, 
    Palette, 
    Tag, 
    Type, 
    X, 
    Check, 
    Underline as UnderlineIcon,
    AlertTriangle,
    Search,
    Hammer,
    Zap,
    Paintbrush,
    Truck,
    Pin,
    ChevronDown,
    Sparkles
} from "lucide-react";
import { 
    JobSheetTitleStyle, 
    JobSheetTitleHighlightStyle 
} from "@/types/jobsheet";
import { cn } from "@/lib/utils";

interface TaskTitleStylerProps {
    titleStyle?: JobSheetTitleStyle;
    onChange: (style: JobSheetTitleStyle) => void;
}

const PRESET_STYLES: {
    key: JobSheetTitleHighlightStyle;
    label: string;
    description: string;
    badgeClass: string;
}[] = [
    {
        key: "standard",
        label: "ปกติ (Standard)",
        description: "ตัวอักษรมาตรฐานตามรายงาน",
        badgeClass: "bg-muted text-foreground border-border"
    },
    {
        key: "highlight_amber",
        label: "ไฮไลท์ส้ม (Amber)",
        description: "เน้นงานเด่นด้วยแถบสีส้ม",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/40"
    },
    {
        key: "highlight_blue",
        label: "ไฮไลท์ฟ้า (Blue)",
        description: "เน้นงานระบบหรือแบบแปลน",
        badgeClass: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500/40"
    },
    {
        key: "highlight_emerald",
        label: "ไฮไลท์เขียว (Green)",
        description: "เน้นงานสำเร็จ / ผ่านเกณฑ์",
        badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40"
    },
    {
        key: "highlight_rose",
        label: "ไฮไลท์แดง (Urgent)",
        description: "เน้นงานด่วน / แก้ไขเร่งด่วน",
        badgeClass: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-500/40"
    },
    {
        key: "pill",
        label: "ป้ายกรอบ (Pill)",
        description: "ล้อมกรอบมนแบบป้ายสัญลักษณ์",
        badgeClass: "bg-zinc-100 text-zinc-900 border-zinc-400 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 rounded-full"
    },
    {
        key: "underlined",
        label: "ขีดเส้นใต้ (Underline)",
        description: "ขีดเส้นใต้สีส้มเน้นข้อความ",
        badgeClass: "underline decoration-amber-500 decoration-2 underline-offset-4"
    }
];

const PRESET_TAGS: {
    label: string;
    tag: string;
    icon: any;
    color: "amber" | "rose" | "blue" | "emerald" | "purple" | "zinc";
    className: string;
}[] = [
    {
        label: "งานด่วน",
        tag: "⚠️ งานด่วน",
        icon: AlertTriangle,
        color: "rose",
        className: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
    },
    {
        label: "ตรวจรับ/QC",
        tag: "🔍 ตรวจรับ/QC",
        icon: Search,
        color: "blue",
        className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
    },
    {
        label: "โครงสร้าง",
        tag: "🏗️ โครงสร้าง",
        icon: Hammer,
        color: "amber",
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
    },
    {
        label: "งานระบบ",
        tag: "⚡ งานระบบ",
        icon: Zap,
        color: "blue",
        className: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
    },
    {
        label: "สถาปัตย์",
        tag: "🎨 สถาปัตย์",
        icon: Paintbrush,
        color: "purple",
        className: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
    },
    {
        label: "จัดซื้อ/ส่งของ",
        tag: "🚚 จัดซื้อ/ส่งของ",
        icon: Truck,
        color: "emerald",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    },
    {
        label: "สำคัญ",
        tag: "📌 สำคัญ",
        icon: Pin,
        color: "zinc",
        className: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30"
    }
];

export function TaskTitleStyler({ titleStyle, onChange }: TaskTitleStylerProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [customTagInput, setCustomTagInput] = useState("");
    const [isAddingCustomTag, setIsAddingCustomTag] = useState(false);

    const isBold = titleStyle?.isBold !== false; // default true
    const currentStyle = titleStyle?.style || "standard";
    const currentTag = titleStyle?.tag;
    const isLarge = titleStyle?.size === "large";

    const handleToggleBold = () => {
        onChange({
            ...titleStyle,
            isBold: !isBold
        });
    };

    const handleSelectStyle = (style: JobSheetTitleHighlightStyle) => {
        onChange({
            ...titleStyle,
            style
        });
    };

    const handleToggleTag = (tag: string, color: "amber" | "rose" | "blue" | "emerald" | "purple" | "zinc") => {
        if (currentTag === tag) {
            // Deselect
            onChange({
                ...titleStyle,
                tag: undefined,
                tagColor: undefined
            });
        } else {
            onChange({
                ...titleStyle,
                tag,
                tagColor: color
            });
        }
    };

    const handleAddCustomTag = () => {
        if (!customTagInput.trim()) return;
        onChange({
            ...titleStyle,
            tag: customTagInput.trim(),
            tagColor: "amber"
        });
        setCustomTagInput("");
        setIsAddingCustomTag(false);
    };

    const handleToggleSize = () => {
        onChange({
            ...titleStyle,
            size: isLarge ? "normal" : "large"
        });
    };

    return (
        <div className="relative">
            {/* COMPACT TOOLBAR ROW */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {/* 1. BOLD TOGGLE */}
                <button
                    type="button"
                    onClick={handleToggleBold}
                    className={cn(
                        "h-7 sm:h-7.5 px-2 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer active:scale-95",
                        isBold
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-2xs"
                            : "bg-muted/70 text-muted-foreground dark:text-white/50 border-border dark:border-white/10 hover:text-foreground hover:bg-muted"
                    )}
                    title={isBold ? "ตัวหนา (เปิดอยู่) - กดเพื่อเปลี่ยนเป็นตัวปกติ" : "เปลี่ยนเป็นตัวหนา"}
                >
                    <Bold className="w-3.5 h-3.5" />
                    <span>หนา</span>
                </button>

                {/* 2. STYLE PICKER BUTTON */}
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={cn(
                        "h-7 sm:h-7.5 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95",
                        currentStyle !== "standard"
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold"
                            : "bg-muted/70 text-muted-foreground dark:text-white/60 border-border dark:border-white/10 hover:text-foreground hover:bg-muted"
                    )}
                    title="เลือกรูปแบบเน้นหัวข้อ"
                >
                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden xs:inline">
                        {PRESET_STYLES.find((s) => s.key === currentStyle)?.label.split(" ")[0] || "รูปแบบ"}
                    </span>
                    <span className="xs:hidden">รูปแบบ</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {/* 3. SIZE TOGGLE (Normal vs Large) */}
                <button
                    type="button"
                    onClick={handleToggleSize}
                    className={cn(
                        "h-7 sm:h-7.5 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer active:scale-95",
                        isLarge
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold"
                            : "bg-muted/70 text-muted-foreground dark:text-white/50 border-border dark:border-white/10 hover:text-foreground hover:bg-muted"
                    )}
                    title={isLarge ? "ขนาดใหญ่ (กดเพื่อคืนค่าปกติ)" : "ขนาดตัวอักษรใหญ่ขึ้น"}
                >
                    <Type className="w-3.5 h-3.5" />
                    <span>{isLarge ? "ใหญ่" : "ปกติ"}</span>
                </button>

                {/* 4. ACTIVE TAG PILL (If selected, show with remove button) */}
                {currentTag && (
                    <div className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <Tag className="w-3 h-3 text-amber-500" />
                        <span className="truncate max-w-[120px]">{currentTag}</span>
                        <button
                            type="button"
                            onClick={() => onChange({ ...titleStyle, tag: undefined, tagColor: undefined })}
                            className="hover:text-rose-500 ml-0.5"
                            title="ลบป้ายนี้"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* POPUP / MENU FOR FORMATTING OPTIONS */}
            {isMenuOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none" 
                        onClick={() => setIsMenuOpen(false)} 
                    />
                    <div className="absolute left-0 top-full mt-1.5 z-50 w-[310px] sm:w-[360px] bg-card dark:bg-zinc-900 border border-border dark:border-white/15 rounded-2xl p-3 shadow-2xl space-y-3 animate-in fade-in-0 zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-border/80 dark:border-white/10">
                            <span className="text-xs font-bold text-foreground dark:text-white flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                ปรับแต่งสไตล์หัวข้องาน
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white hover:bg-muted dark:hover:bg-white/10"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* SECTION 1: HIGHLIGHT STYLES */}
                        <div>
                            <span className="text-[10px] font-bold text-muted-foreground dark:text-white/50 uppercase tracking-wider block mb-1.5">
                                สไตล์การเน้นข้อความ
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                                {PRESET_STYLES.map((style) => {
                                    const isSelected = currentStyle === style.key;
                                    return (
                                        <button
                                            key={style.key}
                                            type="button"
                                            onClick={() => {
                                                handleSelectStyle(style.key);
                                            }}
                                            className={cn(
                                                "p-2 rounded-xl text-left border text-xs font-medium transition-all cursor-pointer flex flex-col gap-0.5",
                                                isSelected
                                                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold shadow-2xs ring-1 ring-amber-500/30"
                                                    : "border-border dark:border-white/5 bg-background dark:bg-zinc-800/60 text-foreground/80 dark:text-white/80 hover:bg-muted dark:hover:bg-zinc-800"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={cn("px-1.5 py-0.5 rounded text-[11px]", style.badgeClass)}>
                                                    {style.label.split(" ")[0]}
                                                </span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground dark:text-white/40 line-clamp-1">
                                                {style.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION 2: QUICK TAGS & CATEGORIES */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground dark:text-white/50 uppercase tracking-wider">
                                    ป้ายกำกับหมวดหมู่งาน
                                </span>
                                {currentTag && (
                                    <button
                                        type="button"
                                        onClick={() => onChange({ ...titleStyle, tag: undefined, tagColor: undefined })}
                                        className="text-[10px] text-rose-500 hover:underline"
                                    >
                                        ล้างป้าย
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {PRESET_TAGS.map((t) => {
                                    const isSelected = currentTag === t.tag;
                                    return (
                                        <button
                                            key={t.tag}
                                            type="button"
                                            onClick={() => handleToggleTag(t.tag, t.color)}
                                            className={cn(
                                                "px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                                                isSelected
                                                    ? "bg-amber-500 text-black border-amber-600 font-bold shadow-2xs"
                                                    : cn("bg-background dark:bg-zinc-800/80 border-border dark:border-white/10 text-foreground dark:text-white hover:bg-muted", t.className)
                                            )}
                                        >
                                            <span>{t.tag}</span>
                                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                        </button>
                                    );
                                })}

                                {/* Custom Tag Trigger */}
                                {!isAddingCustomTag ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCustomTag(true)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-medium border border-dashed border-border dark:border-white/20 text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white transition-all cursor-pointer"
                                    >
                                        + ใส่ป้ายเอง
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 w-full mt-1">
                                        <input
                                            type="text"
                                            placeholder="พิมพ์ป้าย เช่น งานงวด 2"
                                            value={customTagInput}
                                            onChange={(e) => setCustomTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddCustomTag();
                                                }
                                            }}
                                            className="h-7 text-xs px-2 rounded-lg bg-background dark:bg-zinc-800 border border-border dark:border-white/20 text-foreground dark:text-white flex-1 focus:outline-none focus:border-amber-500"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomTag}
                                            className="h-7 px-2 rounded-lg bg-amber-500 text-black font-bold text-xs"
                                        >
                                            เพิ่ม
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingCustomTag(false)}
                                            className="h-7 px-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Close & apply */}
                        <div className="pt-2 border-t border-border/80 dark:border-white/10 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(false)}
                                className="px-3 py-1 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-600 transition-colors"
                            >
                                ตกลง
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
