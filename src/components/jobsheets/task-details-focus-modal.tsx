"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    X, 
    Check, 
    List, 
    ListOrdered, 
    Bold, 
    CheckSquare, 
    AlertTriangle, 
    CheckCircle2, 
    Maximize2, 
    Eye, 
    Edit3,
    Sparkles,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JobSheetTitleStyle } from "@/types/jobsheet";

interface TaskDetailsFocusModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskTitle: string;
    taskIndex: number;
    details: string;
    titleStyle?: JobSheetTitleStyle;
    onSave: (newDetails: string) => void;
}

export function TaskDetailsFocusModal({
    isOpen,
    onClose,
    taskTitle,
    taskIndex,
    details,
    titleStyle,
    onSave
}: TaskDetailsFocusModalProps) {
    const [content, setContent] = useState(details);
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setContent(details);
            setActiveTab("edit");
            // Delay focus slightly for smooth dialog open animation
            const timer = setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, details]);

    if (!isOpen) return null;

    const handleSaveAndClose = () => {
        onSave(content);
        onClose();
    };

    // Quick insertion helpers
    const insertAtCursor = (prefix: string, wrapText?: boolean) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setContent((prev) => (prev ? `${prev}\n${prefix}` : prefix));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.substring(start, end);

        let newText = "";
        let newCursorPos = start;

        if (wrapText && selected) {
            newText = content.substring(0, start) + `**${selected}**` + content.substring(end);
            newCursorPos = start + selected.length + 4;
        } else {
            // If cursor is at start of line or text is empty
            const before = content.substring(0, start);
            const after = content.substring(end);
            const needsNewline = before.length > 0 && !before.endsWith("\n");
            const insertion = (needsNewline ? "\n" : "") + prefix;
            newText = before + insertion + after;
            newCursorPos = start + insertion.length;
        }

        setContent(newText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 10);
    };

    const handleInsertBullet = () => {
        insertAtCursor("- ");
    };

    const handleInsertNumbered = () => {
        // Detect highest number currently in text to smartly auto-increment
        const lines = content.split("\n");
        let nextNum = 1;
        const matches = lines
            .map((l) => l.trim().match(/^(\d+)[\.\)]/))
            .filter(Boolean) as RegExpMatchArray[];
        
        if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            nextNum = parseInt(lastMatch[1], 10) + 1;
        }
        insertAtCursor(`${nextNum}. `);
    };

    const handleInsertBold = () => {
        const textarea = textareaRef.current;
        const selected = textarea ? content.substring(textarea.selectionStart, textarea.selectionEnd) : "";
        if (selected) {
            insertAtCursor("", true);
        } else {
            insertAtCursor("**ข้อความสำคัญ**");
        }
    };

    const handleInsertCheckbox = () => {
        insertAtCursor("☐ ");
    };

    const handleInsertAlert = () => {
        insertAtCursor("⚠️ ");
    };

    const handleInsertSuccess = () => {
        insertAtCursor("✅ ");
    };

    const lineCount = content ? content.split("\n").filter((l) => l.trim().length > 0).length : 0;
    const charCount = content ? content.length : 0;

    // Helper to render preview items
    const renderPreviewLines = () => {
        if (!content.trim()) {
            return (
                <div className="py-12 text-center text-muted-foreground dark:text-white/40 italic">
                    ยังไม่มีรายละเอียดงาน พิมพ์ข้อความหรือกดปุ่มเครื่องมือด้านบนเพื่อเริ่มบันทึก
                </div>
            );
        }

        const lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

        return (
            <div className="space-y-2">
                {lines.map((line, idx) => {
                    const isNum = /^(\d+)[\.\)]\s*(.*)$/.exec(line);
                    const isAlert = line.startsWith("⚠️");
                    const isSuccess = line.startsWith("✅");
                    const isChecklist = line.startsWith("☐") || line.startsWith("[ ]");
                    const clean = line.replace(/^[-•*]\s*/, "").replace(/^[⚠️✅☐]\s*/, "");

                    // Inline bold parsing
                    const renderFormattedText = (txt: string) => {
                        if (!txt.includes("**")) return txt;
                        const parts = txt.split(/(\*\*.*?\*\*)/g);
                        return parts.map((part, pIdx) => {
                            if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
                                return (
                                    <strong key={pIdx} className="font-bold text-foreground dark:text-white">
                                        {part.slice(2, -2)}
                                    </strong>
                                );
                            }
                            return part;
                        });
                    };

                    if (isNum) {
                        return (
                            <div key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90 dark:text-white/90">
                                <span className="font-bold font-mono text-amber-600 dark:text-amber-400 shrink-0 min-w-5">
                                    {isNum[1]}.
                                </span>
                                <span className="flex-1 break-words">{renderFormattedText(isNum[2])}</span>
                            </div>
                        );
                    }

                    if (isAlert) {
                        return (
                            <div key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-rose-700 dark:text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                                <span className="flex-1 break-words font-medium">{renderFormattedText(clean)}</span>
                            </div>
                        );
                    }

                    if (isSuccess) {
                        return (
                            <div key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                                <span className="flex-1 break-words font-medium">{renderFormattedText(clean)}</span>
                            </div>
                        );
                    }

                    if (isChecklist) {
                        return (
                            <div key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90 dark:text-white/90">
                                <span className="w-4 h-4 rounded border border-border dark:border-white/30 bg-muted/50 dark:bg-zinc-800 shrink-0 mt-0.5" />
                                <span className="flex-1 break-words">{renderFormattedText(clean)}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90 dark:text-white/90">
                            <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                            <span className="flex-1 break-words">{renderFormattedText(clean)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleSaveAndClose();
            }}
        >
            <div 
                className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-3xl bg-background dark:bg-zinc-900 border-0 sm:border border-border dark:border-white/10 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* MODAL HEADER */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border/80 dark:border-white/10 bg-muted/40 dark:bg-zinc-950/60 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 shrink-0">
                            งานที่ #{taskIndex + 1}
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-foreground dark:text-white truncate">
                                {taskTitle || "รายละเอียดงานที่ปฏิบัติ"}
                            </h3>
                            <p className="text-[11px] text-muted-foreground dark:text-white/50 hidden sm:block">
                                โหมดขยายหน้าจอเพื่ออ่านและพิมพ์รายละเอียดงานได้สะดวก ไม่บีบตัวอักษร
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Done Button on top for quick save */}
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveAndClose}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-8 sm:h-9 px-3 sm:px-4 rounded-xl shadow-md shadow-amber-500/20 text-xs cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                            <span className="hidden xs:inline">เสร็จสิ้น</span>
                        </Button>
                        <button
                            type="button"
                            onClick={handleSaveAndClose}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="ปิดและบันทึก"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* TOOLBAR & TABS */}
                <div className="px-3 sm:px-6 py-2.5 bg-muted/30 dark:bg-zinc-950/40 border-b border-border/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    {/* Format Action Buttons */}
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap overflow-x-auto scrollbar-hide py-0.5">
                        <button
                            type="button"
                            onClick={handleInsertBullet}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-background dark:bg-zinc-800 border border-border dark:border-white/10 text-foreground dark:text-white hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="เพิ่มข้อย่อย"
                        >
                            <List className="w-3.5 h-3.5 text-amber-500" />
                            <span>+ ข้อย่อย</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInsertNumbered}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-background dark:bg-zinc-800 border border-border dark:border-white/10 text-foreground dark:text-white hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="เพิ่มลำดับตัวเลข 1. 2. 3."
                        >
                            <ListOrdered className="w-3.5 h-3.5 text-amber-500" />
                            <span>+ ลำดับเลข</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInsertBold}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-background dark:bg-zinc-800 border border-border dark:border-white/10 text-foreground dark:text-white hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="ทำตัวหนา (**ข้อความ**)"
                        >
                            <Bold className="w-3.5 h-3.5 text-amber-500" />
                            <span>ตัวหนา</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInsertCheckbox}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-background dark:bg-zinc-800 border border-border dark:border-white/10 text-foreground dark:text-white hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="เพิ่มกล่องเช็คลิสต์"
                        >
                            <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden xs:inline">เช็คลิสต์</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInsertAlert}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
                            title="เพิ่มจุดเตือน / ปัญหา"
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">เตือน/ปัญหา</span>
                        </button>
                    </div>

                    {/* View Switcher: Edit vs Live Preview */}
                    <div className="flex items-center bg-muted dark:bg-zinc-800 p-0.5 rounded-xl border border-border dark:border-white/10 shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab("edit")}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                activeTab === "edit"
                                    ? "bg-background text-foreground dark:bg-zinc-900 dark:text-white shadow-2xs"
                                    : "text-muted-foreground dark:text-white/50 hover:text-foreground"
                            )}
                        >
                            <Edit3 className="w-3 h-3" />
                            <span>เขียน</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("preview")}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                activeTab === "preview"
                                    ? "bg-amber-500 text-black font-bold shadow-2xs"
                                    : "text-muted-foreground dark:text-white/50 hover:text-foreground"
                            )}
                        >
                            <Eye className="w-3 h-3" />
                            <span>ตัวอย่างจริง</span>
                        </button>
                    </div>
                </div>

                {/* MODAL MAIN CONTENT AREA */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-[300px] sm:min-h-[380px]">
                    {activeTab === "edit" ? (
                        <div className="h-full flex flex-col">
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="พิมพ์รายละเอียดงานหรือข้อย่อยที่นี่...&#10;- สามารถพิมพ์แยกบรรทัดได้อิสระ&#10;- กดปุ่มเครื่องมือด้านบนเพื่อใส่หัวข้อย่อยหรือลำดับเลขด่วน&#10;- ใช้ **ข้อความ** เพื่อเน้นตัวหนา"
                                className="w-full flex-1 min-h-[260px] sm:min-h-[320px] bg-transparent text-foreground dark:text-white text-base sm:text-base font-normal leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/40 font-sans"
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-start">
                            {/* Live Report Preview Container */}
                            <div className="bg-white text-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
                                <div className="border-b border-zinc-200 pb-2.5">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                                        ตัวอย่างการแสดงผลในตารางรายงาน JobSheet
                                    </span>
                                    <div className="font-bold text-base text-zinc-900 leading-snug break-words">
                                        {titleStyle?.tag && (
                                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mr-1.5 align-middle">
                                                {titleStyle.tag}
                                            </span>
                                        )}
                                        {taskTitle || "รายละเอียดงานที่ปฏิบัติ"}
                                    </div>
                                </div>

                                <div className="pl-3 border-l-2 border-amber-400/80">
                                    {renderPreviewLines()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div className="px-4 sm:px-6 py-3 border-t border-border/80 dark:border-white/10 bg-muted/40 dark:bg-zinc-950/60 flex items-center justify-between text-xs text-muted-foreground dark:text-white/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <span>{lineCount} บรรทัด</span>
                        <span>•</span>
                        <span>{charCount} ตัวอักษร</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {content && (
                            <button
                                type="button"
                                onClick={() => setContent("")}
                                className="text-muted-foreground hover:text-rose-500 transition-colors px-2 py-1 rounded text-xs cursor-pointer"
                                title="ล้างข้อความทั้งหมด"
                            >
                                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                                ล้าง
                            </button>
                        )}
                        <Button
                            type="button"
                            onClick={handleSaveAndClose}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-9 px-4 rounded-xl shadow-md shadow-amber-500/20 text-xs cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5 mr-1.5 stroke-[3]" />
                            บันทึก & เสร็จสิ้น
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
