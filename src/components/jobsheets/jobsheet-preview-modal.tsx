"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { JobSheet } from "@/types/jobsheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
    Download, 
    Printer, 
    Image as ImageIcon, 
    FileText, 
    Calendar, 
    MapPin, 
    CloudSun, 
    Users, 
    HardHat, 
    AlertTriangle, 
    Clock, 
    Check, 
    Loader2, 
    Building2,
    ShieldCheck,
    Briefcase,
    SlidersHorizontal,
    CheckCircle2,
    X
} from "lucide-react";
import { toast } from "sonner";
import { toBlob, toPng } from "html-to-image";
import { useProjects } from "@/context/project-context";

interface JobSheetPreviewModalProps {
    jobsheet: JobSheet | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (jobsheet: JobSheet) => void;
}

export function JobSheetPreviewModal({
    jobsheet,
    open,
    onOpenChange,
    onEdit
}: JobSheetPreviewModalProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [isExportingPng, setIsExportingPng] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // Toggles for clean, job-focused output
    const [showSignatures, setShowSignatures] = useState(true);
    const [logoFailed, setLogoFailed] = useState(false);

    // Mobile viewport & zoom states
    const [containerWidth, setContainerWidth] = useState(() => 
        typeof window !== "undefined" ? window.innerWidth : 860
    );
    const [viewMode, setViewMode] = useState<"fit" | "actual">("fit");
    const [sheetHeight, setSheetHeight] = useState(1160);

    const { companyProfile, currentUser, currentTeam } = useProjects();

    const isAdminOrOwner = Boolean(
        currentTeam?.role && (currentTeam.role.toLowerCase() === "owner" || currentTeam.role.toLowerCase() === "admin")
    );

    const isMySheet = Boolean(currentUser && jobsheet && (
        (jobsheet.createdBy && jobsheet.createdBy === currentUser.id) ||
        (jobsheet.createdByName && jobsheet.createdByName.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()) ||
        (jobsheet.reportedBy && jobsheet.reportedBy.trim().toLowerCase() === currentUser.name?.trim().toLowerCase())
    ));
    const canEdit = isMySheet || isAdminOrOwner;

    useEffect(() => {
        setLogoFailed(false);
    }, [open, jobsheet?.companyLogo, companyProfile?.logo]);

    // Track container dimensions for mobile responsive preview
    useEffect(() => {
        if (!open) return;

        const updateDimensions = () => {
            if (scrollContainerRef.current) {
                setContainerWidth(scrollContainerRef.current.clientWidth);
            }
            if (sheetRef.current) {
                setSheetHeight(sheetRef.current.scrollHeight || sheetRef.current.offsetHeight || 1160);
            }
        };

        updateDimensions();

        const ro = new ResizeObserver(() => {
            updateDimensions();
        });

        if (scrollContainerRef.current) {
            ro.observe(scrollContainerRef.current);
        }
        if (sheetRef.current) {
            ro.observe(sheetRef.current);
        }

        window.addEventListener("resize", updateDimensions);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", updateDimensions);
        };
    }, [open, jobsheet, showSignatures, viewMode]);

    // Standard A4 width reference is 820px
    const scale = useMemo(() => {
        if (viewMode === "actual") return 1;
        if (!containerWidth || containerWidth >= 860) return 1;
        const availableWidth = Math.max(280, containerWidth - 32);
        return Math.min(1, availableWidth / 820);
    }, [containerWidth, viewMode]);

    if (!jobsheet) return null;

    // Company & Organization Info (Company logo and name, not app name)
    const companyLogo = jobsheet.companyLogo || companyProfile?.logo || null;
    const companyName = jobsheet.companyName || companyProfile?.name || currentTeam?.name || "บริษัทของคุณ";
    const companyAddress = companyProfile?.address || "";
    const companyTaxId = companyProfile?.taxId || "";
    const companyPhone = companyProfile?.phone || "";

    // Reporter & Position
    const reporterName = jobsheet.reportedBy || jobsheet.createdByName || currentUser?.name || "เบียร์";
    const reporterRole = jobsheet.reportedByRole || jobsheet.createdByRole || currentUser?.role || "ผู้ดูแลหน้างาน";

    // Format Thai Date
    const formatThaiDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    // Helper to render task details with clear typography & bullet support
    const renderTaskDetails = (taskTitle: string, taskDetails?: string) => {
        if (!taskTitle && !taskDetails) return <span className="text-zinc-400 italic">ไม่ได้ระบุรายละเอียด</span>;

        let title = taskTitle?.trim() || "";
        let details = taskDetails?.trim() || "";

        // Backward compatibility: If no separate details provided, but title has multiple lines, split them
        if (!details && title.includes("\n")) {
            const lines = title.split("\n").map((l) => l.trim()).filter(Boolean);
            title = lines[0] || "";
            details = lines.slice(1).join("\n");
        }

        const subLines = details
            ? details.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
            : [];

        return (
            <div className="space-y-1.5 break-words [overflow-wrap:anywhere]">
                {/* 1. หัวข้องานหลัก (Bold & Clear) */}
                <div className="font-bold text-zinc-950 text-sm leading-snug break-words [overflow-wrap:anywhere]">
                    {title || "รายละเอียดงาน"}
                </div>

                {/* 2. รายละเอียดงาน / ข้อย่อย (Indented & Formatted) */}
                {subLines.length > 0 && (
                    <div className="space-y-1 pl-2.5 border-l-2 border-amber-400/80 mt-1">
                        {subLines.map((line, idx) => {
                            const cleanLine = line.replace(/^[-•*]\s*/, "");
                            return (
                                <div key={idx} className="flex items-start gap-1.5 text-zinc-800 text-xs leading-relaxed break-words [overflow-wrap:anywhere]">
                                    <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                                    <span className="font-medium break-words [overflow-wrap:anywhere]">{cleanLine}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // Robust file saving helper (works across Desktop, iOS Safari, Android, and Capacitor)
    const saveFile = async (data: Blob | string, filename: string) => {
        try {
            const FileSaver = await import("file-saver");
            const save = FileSaver.default || (FileSaver as any).saveAs || FileSaver;
            save(data, filename);
        } catch {
            const url = typeof data === "string" ? data : URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            if (typeof data !== "string") {
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        }
    };

    // Helper to convert any image into a base64 Data URL so it is 100% immune to CORS and never vanishes during export
    const convertImageToBase64 = async (img: HTMLImageElement): Promise<string | null> => {
        try {
            if (!img.src || img.src.startsWith("data:")) return img.src;

            // 1. If image is complete in DOM and loaded, try drawing to canvas
            try {
                if (img.complete && img.naturalWidth > 0) {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        const dataUrl = canvas.toDataURL("image/png");
                        if (dataUrl && dataUrl.length > 100 && dataUrl !== "data:,") {
                            return dataUrl;
                        }
                    }
                }
            } catch {
                // Canvas tainted or blocked, fallback to proxy fetch
            }

            // 2. Fetch image via /api/proxy-image (handles CORS properly without failing)
            const targetUrl = img.src.startsWith("http") && !img.src.includes("/api/proxy-image")
                ? `/api/proxy-image?url=${encodeURIComponent(img.src)}`
                : img.src;

            const res = await fetch(targetUrl);
            if (res.ok) {
                const blob = await res.blob();
                return await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => resolve("");
                    reader.readAsDataURL(blob);
                });
            }
        } catch (e) {
            console.warn("Failed to convert image to base64 for export:", img.src, e);
        }
        return null;
    };

    const BLANK_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    // Helper to safely prep element and images for high-res screenshot capture
    const prepareElementForCapture = async () => {
        if (!sheetRef.current) return null;
        const element = sheetRef.current;

        // Convert images to base64 so they never disappear or get replaced with empty SVGs
        const images = Array.from(element.querySelectorAll("img"));
        const originalSrcs = new Map<HTMLImageElement, string>();
        const hiddenImages = new Set<HTMLImageElement>();

        await Promise.all(
            images.map(async (img) => {
                originalSrcs.set(img, img.src);
                try {
                    const dataUrl = await convertImageToBase64(img);
                    if (dataUrl) {
                        img.src = dataUrl;
                    } else {
                        // Broken or unconvertible image! Neutralize and hide it completely
                        img.src = BLANK_GIF;
                        img.style.display = "none";
                        img.setAttribute("data-skip-export", "true");
                        hiddenImages.add(img);
                    }
                } catch {
                    img.src = BLANK_GIF;
                    img.style.display = "none";
                    img.setAttribute("data-skip-export", "true");
                    hiddenImages.add(img);
                }
            })
        );

        // Wait a frame for DOM repaint
        await new Promise((r) => setTimeout(r, 120));

        // Return cleanup function to restore original src URLs
        return () => {
            originalSrcs.forEach((src, img) => {
                img.src = src;
                if (hiddenImages.has(img)) {
                    img.style.display = "";
                    img.removeAttribute("data-skip-export");
                }
            });
        };
    };

    const FONT_FAMILY_STACK = "var(--font-sans), 'Prompt', 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', 'Sukhumvit Set', sans-serif";

    const captureFilter = (domNode: Node) => {
        if (domNode instanceof HTMLElement) {
            if (domNode.style.display === "none" || domNode.getAttribute("data-skip-export") === "true") {
                return false;
            }
        }
        return true;
    };

    // Export as PNG
    const handleDownloadPng = async () => {
        if (!sheetRef.current) return;
        setIsExportingPng(true);
        const toastId = toast.loading("กำลังเรนเดอร์รูปภาพความคมชัดสูง...");

        let cleanup: (() => void) | null = null;
        try {
            cleanup = await prepareElementForCapture();
            if (!sheetRef.current) throw new Error("ไม่พบเอกสาร");

            let blob: Blob | null = null;
            try {
                // Tier 1: Capture with full embedded web fonts
                blob = await toBlob(sheetRef.current, {
                    pixelRatio: 2,
                    backgroundColor: "#ffffff",
                    quality: 0.98,
                    cacheBust: true,
                    filter: captureFilter,
                    style: {
                        transform: "none",
                        margin: "0",
                        width: "820px",
                        maxWidth: "820px",
                        boxShadow: "none",
                        border: "none",
                        borderRadius: "0",
                        fontFamily: FONT_FAMILY_STACK
                    }
                });
            } catch (fontErr) {
                console.warn("First capture attempt with embedded web fonts failed, retrying with system sans fallback:", fontErr);
                // Tier 2: Fallback with explicit modern sans-serif fallback (never Times New Roman)
                blob = await toBlob(sheetRef.current, {
                    pixelRatio: 2,
                    backgroundColor: "#ffffff",
                    quality: 0.98,
                    skipFonts: true,
                    cacheBust: true,
                    filter: captureFilter,
                    fontEmbedCSS: `* { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', 'Sukhumvit Set', sans-serif !important; }`,
                    style: {
                        transform: "none",
                        margin: "0",
                        width: "820px",
                        maxWidth: "820px",
                        boxShadow: "none",
                        border: "none",
                        borderRadius: "0",
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', 'Sukhumvit Set', sans-serif"
                    }
                });
            }

            if (!blob) throw new Error("ไม่สามารถสร้างรูปภาพ Blob ได้");

            const fileName = `${jobsheet.reportNumber || "JobSheet"}-${jobsheet.date}.png`;
            await saveFile(blob, fileName);

            toast.success("ดาวน์โหลดรูปภาพ PNG สำเร็จ", { id: toastId });
        } catch (error) {
            console.error("Export PNG error:", error);
            toast.error("ไม่สามารถสร้างรูปภาพได้ กรุณาลองใช้ปุ่มพิมพ์แทน", { id: toastId });
        } finally {
            if (cleanup) cleanup();
            setIsExportingPng(false);
        }
    };

    // Export as PDF
    const handleDownloadPdf = async () => {
        if (!sheetRef.current) return;
        setIsExportingPdf(true);
        const toastId = toast.loading("กำลังจัดทำเอกสาร PDF...");

        let cleanup: (() => void) | null = null;
        try {
            cleanup = await prepareElementForCapture();
            if (!sheetRef.current) throw new Error("ไม่พบเอกสาร");

            let dataUrl: string | null = null;
            try {
                // Tier 1: Capture with full embedded web fonts
                dataUrl = await toPng(sheetRef.current, {
                    pixelRatio: 2,
                    backgroundColor: "#ffffff",
                    quality: 0.98,
                    cacheBust: true,
                    filter: captureFilter,
                    style: {
                        transform: "none",
                        margin: "0",
                        width: "820px",
                        maxWidth: "820px",
                        boxShadow: "none",
                        border: "none",
                        borderRadius: "0",
                        fontFamily: FONT_FAMILY_STACK
                    }
                });
            } catch (fontErr) {
                console.warn("First capture attempt with embedded web fonts failed, retrying with system sans fallback:", fontErr);
                // Tier 2: Fallback with explicit modern sans-serif fallback
                dataUrl = await toPng(sheetRef.current, {
                    pixelRatio: 2,
                    backgroundColor: "#ffffff",
                    quality: 0.98,
                    skipFonts: true,
                    cacheBust: true,
                    filter: captureFilter,
                    fontEmbedCSS: `* { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', 'Sukhumvit Set', sans-serif !important; }`,
                    style: {
                        transform: "none",
                        margin: "0",
                        width: "820px",
                        maxWidth: "820px",
                        boxShadow: "none",
                        border: "none",
                        borderRadius: "0",
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', 'Sukhumvit Set', sans-serif"
                    }
                });
            }

            if (!dataUrl) throw new Error("ไม่สามารถสร้างข้อมูลภาพ PDF ได้");

            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

            const imgProps = pdf.getImageProperties(dataUrl);
            const imgRatio = imgProps.height / imgProps.width;

            // Note: Document paper is 820px width x 1160px min-height (ratio ~1.414, exact A4).
            // The paper already contains internal padding (p-8 / 32px), so rendering edge-to-edge
            // gives a pristine official A4 PDF without any double-margins, strange borders, or floating shadows!
            if (imgRatio <= 1.48) {
                pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
            } else {
                // Multi-page handling for very long documents
                const pageImgHeight = pdfWidth * imgRatio;
                let heightLeft = pageImgHeight;
                let position = 0;

                pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pageImgHeight, undefined, "FAST");
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position = position - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pageImgHeight, undefined, "FAST");
                    heightLeft -= pdfHeight;
                }
            }

            const pdfBlob = pdf.output("blob");
            const fileName = `${jobsheet.reportNumber || "JobSheet"}-${jobsheet.date}.pdf`;
            await saveFile(pdfBlob, fileName);

            toast.success("ดาวน์โหลดเอกสาร PDF สำเร็จ", { id: toastId });
        } catch (error) {
            console.error("Export PDF error:", error);
            toast.error("ไม่สามารถสร้าง PDF ได้ แนะนำให้ใช้ปุ่มพิมพ์แทน", { id: toastId });
        } finally {
            if (cleanup) cleanup();
            setIsExportingPdf(false);
        }
    };

    // Browser Print
    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-full h-[100dvh] sm:h-[96vh] max-h-[100dvh] sm:max-h-[96vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-0 sm:border sm:border-white/10 text-white rounded-none sm:rounded-2xl pt-[max(env(safe-area-inset-top),0px)] pb-[max(env(safe-area-inset-bottom),0px)]">
                {/* Header Actions & Customizable Toggles */}
                <div className="border-b border-white/10 bg-zinc-900/95 backdrop-blur-md shrink-0 px-3 sm:px-5 py-2.5 sm:py-3">
                    {/* Desktop Layout (>= sm) */}
                    <div className="hidden sm:flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                            <div>
                                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                                    <span>ตัวอย่าง Job Sheet (A4)</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                                        {jobsheet.reportNumber}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-white/50 line-clamp-1">
                                    {jobsheet.date} • {reporterName} ({reporterRole})
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSignatures(!showSignatures)}
                                className={`h-8 text-xs border transition-colors px-3 ${
                                    showSignatures
                                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                        : "border-white/10 text-white/60 hover:bg-white/5"
                                }`}
                                title="สลับการแสดงผลช่องลงนามท้ายเอกสาร"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                {showSignatures ? "มีลงนาม" : "ไม่มีลงนาม"}
                            </Button>

                            {onEdit && canEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onOpenChange(false);
                                        onEdit(jobsheet);
                                    }}
                                    className="h-8 text-xs border-white/10 hover:bg-white/5 text-white/80 px-3"
                                >
                                    แก้ไข
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="h-8 text-xs border-white/10 hover:bg-white/5 text-white/80 px-3"
                            >
                                <Printer className="w-3.5 h-3.5 mr-1" />
                                พิมพ์
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPng}
                                disabled={isExportingPng}
                                className="h-8 text-xs border-white/10 hover:bg-white/5 text-white/80 px-3"
                            >
                                {isExportingPng ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 mr-1 text-emerald-400" />}
                                PNG
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleDownloadPdf}
                                disabled={isExportingPdf}
                                className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md shadow-amber-500/20 px-3.5"
                            >
                                {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                                PDF
                            </Button>

                            {/* Prominent Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8 ml-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                                title="ปิดหน้าต่าง"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Layout (< sm) */}
                    <div className="flex sm:hidden flex-col gap-2">
                        {/* Mobile Top Row: Close Button + Report Number + Edit */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                    className="h-7 text-xs bg-white/10 hover:bg-white/20 border-white/10 text-white font-medium px-2 gap-1 shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>ปิด</span>
                                </Button>
                                <DialogTitle className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                    <span className="text-amber-400 font-mono">{jobsheet.reportNumber}</span>
                                    <span className="text-[10px] text-white/50 truncate font-normal">• {jobsheet.date}</span>
                                </DialogTitle>
                            </div>

                            {onEdit && canEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onOpenChange(false);
                                        onEdit(jobsheet);
                                    }}
                                    className="h-7 text-xs border-white/10 hover:bg-white/5 text-white/80 px-2 shrink-0"
                                >
                                    แก้ไข
                                </Button>
                            )}
                        </div>

                        {/* Mobile Bottom Row: Action Buttons */}
                        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/10 overflow-x-auto no-scrollbar">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSignatures(!showSignatures)}
                                className={`h-7 text-[11px] border shrink-0 px-2 ${
                                    showSignatures
                                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                        : "border-white/10 text-white/60 hover:bg-white/5"
                                }`}
                            >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {showSignatures ? "มีลงนาม" : "ไม่มี"}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="h-7 text-[11px] border-white/10 hover:bg-white/5 text-white/80 shrink-0 px-2"
                            >
                                <Printer className="w-3 h-3 mr-1" />
                                พิมพ์
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPng}
                                disabled={isExportingPng}
                                className="h-7 text-[11px] border-white/10 hover:bg-white/5 text-white/80 shrink-0 px-2.5"
                            >
                                {isExportingPng ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ImageIcon className="w-3 h-3 mr-1 text-emerald-400" />}
                                PNG
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleDownloadPdf}
                                disabled={isExportingPdf}
                                className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md shadow-amber-500/20 shrink-0 px-3"
                            >
                                {isExportingPdf ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                                PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Printable Document Sheet Scroll Area */}
                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-6 bg-zinc-950 flex flex-col items-center"
                >

                    {/* Scaled Wrapper for mobile */}
                    <div
                        style={{
                            width: "820px",
                            minWidth: "820px",
                            transform: scale < 1 ? `scale(${scale})` : "none",
                            transformOrigin: "top center",
                            marginBottom: scale < 1 ? `-${Math.round(sheetHeight * (1 - scale))}px` : "0px",
                            transition: "transform 0.15s ease-out"
                        }}
                        className="shrink-0 flex justify-center"
                    >
                        <div
                            ref={sheetRef}
                            id="jobsheet-printable-paper"
                            className="bg-white text-zinc-900 shadow-2xl rounded-none p-8 sm:p-10 font-sans print:shadow-none print:p-6 print:m-0 print:w-full print:max-w-none border border-zinc-200"
                            style={{
                                width: "820px",
                                minWidth: "820px",
                                minHeight: "1160px",
                                fontFamily: FONT_FAMILY_STACK,
                                borderRadius: 0
                            }}
                        >
                            {/* Company Header (Using User's Company Logo & Name, NOT App Logo) */}
                            <div className="border-b-2 border-zinc-900 pb-4 mb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        {companyLogo && !logoFailed ? (
                                            <img
                                                src={companyLogo.startsWith("http") && !companyLogo.includes("/api/proxy-image") ? `/api/proxy-image?url=${encodeURIComponent(companyLogo)}` : companyLogo}
                                                alt={companyName}
                                                className="h-12 sm:h-14 w-auto max-w-[150px] object-contain rounded"
                                                onError={() => {
                                                    setLogoFailed(true);
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-zinc-900 text-amber-400 flex items-center justify-center font-black text-xl tracking-tight shadow-sm shrink-0">
                                                {companyName ? companyName.charAt(0).toUpperCase() : "JS"}
                                            </div>
                                        )}
                                        <div>
                                            <h1 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight leading-tight">
                                                {companyName}
                                            </h1>
                                            {companyAddress ? (
                                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                                                    {companyAddress}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    CONSTRUCTION & PROJECT MANAGEMENT
                                                </p>
                                            )}
                                            {(companyTaxId || companyPhone) && (
                                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                                    {companyTaxId ? `เลขประจำตัวผู้เสียภาษี: ${companyTaxId}` : ""}
                                                    {companyTaxId && companyPhone ? " • " : ""}
                                                    {companyPhone ? `โทร: ${companyPhone}` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                                            บันทึกการทำงานประจำวัน
                                        </h2>
                                        <div className="text-xs font-bold text-zinc-600 tracking-wider font-mono uppercase">
                                            DAILY JOB SHEET
                                        </div>
                                        <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-mono bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200">
                                            เลขที่: <span className="font-bold text-zinc-900">{jobsheet.reportNumber}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Metadata Strip: Clean, Professional, Wide */}
                            <div className="bg-zinc-50 border border-zinc-300 rounded-none p-3 mb-5 grid grid-cols-4 gap-3 text-xs" style={{ borderRadius: 0 }}>
                                <div>
                                    <span className="text-zinc-500 block text-[11px] font-medium">ชื่อผู้ปฏิบัติงาน / ผู้รายงาน:</span>
                                    <span className="font-bold text-zinc-900 text-sm">{reporterName}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 block text-[11px] font-medium">ตำแหน่ง:</span>
                                    <span className="font-semibold text-zinc-800 text-xs sm:text-sm">{reporterRole}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 block text-[11px] font-medium">วันที่ปฏิบัติงาน:</span>
                                    <span className="font-bold text-zinc-900">{formatThaiDate(jobsheet.date)}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 block text-[11px] font-medium">สภาพอากาศประจำวัน:</span>
                                    <span className="inline-flex items-center gap-1 font-semibold text-zinc-800">
                                        <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        {jobsheet.weather?.condition || "ท้องฟ้าแจ่มใส"}
                                        {jobsheet.weather?.temperature ? ` (${jobsheet.weather.temperature}°C)` : ""}
                                    </span>
                                </div>
                            </div>

                            {/* MAIN WORK ITEMS TABLE (Wide, Clear, High Legibility, Centered on Tasks) */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                                        <HardHat className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>รายการงานที่ปฏิบัติประจำวัน (Work Activities & Progress)</span>
                                    </h3>
                                    <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">
                                        จำนวน {jobsheet.workItems?.length || 0} รายการ
                                    </span>
                                </div>

                                <div className="border border-zinc-400 rounded-none overflow-hidden" style={{ borderRadius: 0 }}>
                                    <table className="w-full text-left border-collapse table-fixed" style={{ borderRadius: 0 }}>
                                        <thead>
                                            <tr className="bg-zinc-900 text-white font-bold text-xs uppercase tracking-wider" style={{ borderRadius: 0 }}>
                                                <th className="py-2.5 px-2 w-[42px] text-center border-r border-zinc-700">ลำดับ</th>
                                                <th className="py-2.5 px-3 w-[175px] border-r border-zinc-700">โครงการ / โซน / เวลา</th>
                                                <th className="py-2.5 px-3.5 border-r border-zinc-700">รายละเอียดงานที่ปฏิบัติ (Work Activities & Progress)</th>
                                                <th className="py-2.5 px-1 w-[52px] text-center border-r border-zinc-700" title="สถานะ">สถานะ</th>
                                                <th className="py-2.5 px-3 w-[130px]">หมายเหตุ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-300 text-xs">
                                            {jobsheet.workItems && jobsheet.workItems.length > 0 ? (
                                                jobsheet.workItems.map((item, idx) => {
                                                    const isGeneral = !item.projectId && (!item.projectName || item.projectName.includes("ทั่วไป") || item.projectName.includes("จัดซื้อ") || item.projectName.includes("โรงงาน"));
                                                    return (
                                                        <tr key={item.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                                                            {/* 1. ลำดับ */}
                                                            <td className="py-3 px-2 text-center text-zinc-600 font-mono font-bold align-top border-r border-zinc-200">
                                                                {idx + 1}
                                                            </td>

                                                            {/* 2. โครงการ / โซน / เวลา (เรียบหรู ดูมืออาชีพ) */}
                                                            <td className="py-3 px-3 align-top border-r border-zinc-200">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className={`text-xs font-semibold leading-snug break-words ${isGeneral ? "text-zinc-600" : "text-zinc-900"}`}>
                                                                        {(item.projectName || jobsheet.projectName || "งานทั่วไป").replace(/^[🏢📦\s]+/u, "")}
                                                                    </div>

                                                                    {(item.timeSlot || item.location) && (
                                                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 font-normal leading-tight">
                                                                            {item.timeSlot && (
                                                                                <span className="text-zinc-600 font-medium">
                                                                                    {item.timeSlot.replace(/^[⏱\s]+/u, "")}
                                                                                </span>
                                                                            )}
                                                                            {item.timeSlot && item.location && (
                                                                                <span className="text-zinc-300 font-light">•</span>
                                                                            )}
                                                                            {item.location && (
                                                                                <span className="text-zinc-500">
                                                                                    {item.location.replace(/^[📍\s]+/u, "")}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* 3. รายละเอียดงานที่ปฏิบัติ */}
                                                            <td className="py-3 px-3.5 align-top border-r border-zinc-200 break-words [overflow-wrap:anywhere]">
                                                                {renderTaskDetails(item.task, item.details)}
                                                                {item.quantity && (
                                                                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 font-medium break-words leading-tight whitespace-normal">
                                                                        <span className="text-zinc-500 font-medium text-[11px] shrink-0">ปริมาณ / ขนาด:</span>
                                                                        <span className="font-bold text-zinc-900 break-words">{item.quantity}</span>
                                                                    </div>
                                                                )}
                                                                {/* รูปถ่ายแนบเฉพาะของงานนี้ (ถ้ามี) */}
                                                                {item.photos && item.photos.length > 0 && (
                                                                    <div className="mt-2.5 pt-2 border-t border-zinc-200/80">
                                                                        <span className="text-[10px] text-zinc-500 font-semibold block mb-1.5 flex items-center gap-1">
                                                                            <ImageIcon className="w-3 h-3 text-sky-600" />
                                                                            รูปแนบงานนี้ ({item.photos.length}):
                                                                        </span>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {item.photos.map((pSrc, pIdx) => {
                                                                                const proxied = pSrc.startsWith("http") && !pSrc.includes("/api/proxy-image")
                                                                                    ? `/api/proxy-image?url=${encodeURIComponent(pSrc)}`
                                                                                    : pSrc;
                                                                                return (
                                                                                    <div key={pIdx} className="w-14 h-14 rounded border border-zinc-300 overflow-hidden bg-zinc-100 shrink-0">
                                                                                        <img src={proxied} alt={`Item ${idx + 1} photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* 4. สถานะ (Compact Icon + Color Badge เพื่อเพิ่มพื้นที่ให้หมายเหตุ) */}
                                                            <td className="py-3 px-1 text-center align-top border-r border-zinc-200">
                                                                <div className="flex flex-col items-center justify-center pt-0.5">
                                                                    {item.status === "completed" && (
                                                                        <span 
                                                                            className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-2xs"
                                                                            title="เสร็จสิ้น (Completed)"
                                                                        >
                                                                            <Check className="w-4 h-4 stroke-[3]" />
                                                                        </span>
                                                                    )}
                                                                    {item.status === "in_progress" && (
                                                                        <span 
                                                                            className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-100 text-blue-700 border border-blue-300 shadow-2xs"
                                                                            title="กำลังดำเนินการ (In Progress)"
                                                                        >
                                                                            <Clock className="w-4 h-4 stroke-[2.5]" />
                                                                        </span>
                                                                    )}
                                                                    {item.status === "pending" && (
                                                                        <span 
                                                                            className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-100 text-amber-700 border border-amber-300 shadow-2xs"
                                                                            title="รอดำเนินการ (Pending)"
                                                                        >
                                                                            <Clock className="w-4 h-4 stroke-[2]" />
                                                                        </span>
                                                                    )}
                                                                    {item.status === "delayed" && (
                                                                        <span 
                                                                            className="w-7 h-7 rounded-full flex items-center justify-center bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs"
                                                                            title="ติดปัญหา / ล่าช้า (Delayed)"
                                                                        >
                                                                            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* 5. หมายเหตุ (กว้างขึ้น จุข้อความได้ชัดเจน) */}
                                                            <td className="py-3 px-3 text-zinc-800 text-xs align-top leading-relaxed break-words [overflow-wrap:anywhere]">
                                                                {item.notes ? (
                                                                    <span className="font-normal text-zinc-900 break-words leading-snug">{item.notes}</span>
                                                                ) : (
                                                                    <span className="text-zinc-300">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="py-6 text-center text-zinc-400">
                                                        ไม่มีรายการงานที่บันทึก
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Obstacles & Safety Notes */}
                            {(jobsheet.obstacles || jobsheet.safetyNotes) && (
                                <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                                    {jobsheet.obstacles && (
                                        <div className="border border-zinc-300 rounded-none p-2.5 bg-amber-50/20 break-words [overflow-wrap:anywhere]" style={{ borderRadius: 0 }}>
                                            <span className="font-bold text-amber-900 block mb-1">
                                                ⚠️ ปัญหา / อุปสรรคหน้างาน:
                                            </span>
                                            <p className="text-zinc-700 leading-relaxed break-words [overflow-wrap:anywhere]">{jobsheet.obstacles}</p>
                                        </div>
                                    )}
                                    {jobsheet.safetyNotes && (
                                        <div className="border border-zinc-300 rounded-none p-2.5 bg-emerald-50/20 break-words [overflow-wrap:anywhere]" style={{ borderRadius: 0 }}>
                                            <span className="font-bold text-emerald-900 block mb-1">
                                                🛡️ ความปลอดภัยหน้างาน:
                                            </span>
                                            <p className="text-zinc-700 leading-relaxed break-words [overflow-wrap:anywhere]">{jobsheet.safetyNotes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Site Photos (if any) */}
                            {jobsheet.photos && jobsheet.photos.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
                                        <ImageIcon className="w-4 h-4 text-sky-600" />
                                        ภาพถ่ายประกอบการทำงาน (Site Photos)
                                    </h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        {jobsheet.photos.map((src, i) => {
                                            const proxiedSrc = src.startsWith("http") && !src.includes("/api/proxy-image")
                                                ? `/api/proxy-image?url=${encodeURIComponent(src)}`
                                                : src;
                                            return (
                                                <div key={i} className="aspect-video rounded-none border border-zinc-200 overflow-hidden bg-zinc-100" style={{ borderRadius: 0 }}>
                                                    <img
                                                        src={proxiedSrc}
                                                        alt={`Site photo ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.currentTarget as HTMLElement).style.display = "none";
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Formal Signatures Footer (Wide & Clean) */}
                            {showSignatures && (
                                <div className="border-t-2 border-zinc-900 pt-6 mt-8">
                                    <div className="grid grid-cols-2 gap-12 text-center text-xs">
                                        <div>
                                            <div className="h-14 border-b border-dashed border-zinc-400 mb-2 flex items-end justify-center pb-1 font-serif text-sm italic text-zinc-700">
                                                {reporterName}
                                            </div>
                                            <span className="font-bold text-zinc-900 block text-xs break-words">
                                                ( {reporterName} )
                                            </span>
                                            <span className="text-zinc-600 text-[11px] block mt-0.5 break-words">
                                                ผู้รายงาน / {reporterRole}
                                            </span>
                                            <span className="text-zinc-400 text-[10px] block mt-0.5">
                                                วันที่ ..... / ..... / ..........
                                            </span>
                                        </div>

                                        <div>
                                            <div className="h-14 border-b border-dashed border-zinc-400 mb-2 flex items-end justify-center pb-1 font-serif text-sm italic text-zinc-700">
                                                {jobsheet.inspectedBy || "..................................................."}
                                            </div>
                                            <span className="font-bold text-zinc-900 block text-xs break-words">
                                                ( {jobsheet.inspectedBy || "ผู้ตรวจสอบ / ผู้จัดการโครงการ"} )
                                            </span>
                                            <span className="text-zinc-600 text-[11px] block mt-0.5 break-words">
                                                วิศวกรโครงการ / ตัวแทนผู้ว่าจ้าง
                                            </span>
                                            <span className="text-zinc-400 text-[10px] block mt-0.5">
                                                วันที่ ..... / ..... / ..........
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
