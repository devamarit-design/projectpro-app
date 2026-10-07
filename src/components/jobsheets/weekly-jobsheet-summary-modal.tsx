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
    Copy,
    CheckCircle2,
    X,
    TrendingUp,
    Package,
    Truck,
    Layers
} from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { useProjects } from "@/context/project-context";

export interface WeekGroupData {
    weekKey: string;
    weekLabel: string;
    dateRangeLabel: string;
    startDateStr: string;
    endDateStr: string;
    sheets: JobSheet[];
    totalTasksDone: number;
    totalTasks: number;
    totalManpower: number;
    uniqueProjects: string[];
    isCurrentWeek: boolean;
}

interface WeeklyJobSheetSummaryModalProps {
    weekData: WeekGroupData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const THAI_MONTH_FULL = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_DAY_NAMES: Record<number, string> = {
    0: "อาทิตย์",
    1: "จันทร์",
    2: "อังคาร",
    3: "พุธ",
    4: "พฤหัสบดี",
    5: "ศุกร์",
    6: "เสาร์"
};

function formatThaiDateLong(dateStr: string): string {
    if (!dateStr) return "-";
    try {
        const [y, m, d] = dateStr.split("-").map(Number);
        const day = d;
        const month = THAI_MONTH_FULL[m - 1] || "";
        const year = y + 543;
        return `${day} ${month} ${year}`;
    } catch {
        return dateStr;
    }
}

function getDayOfWeekThai(dateStr: string): string {
    if (!dateStr) return "";
    try {
        const [y, m, d] = dateStr.split("-").map(Number);
        const dateObj = new Date(y, m - 1, d);
        return THAI_DAY_NAMES[dateObj.getDay()] || "";
    } catch {
        return "";
    }
}

export function WeeklyJobSheetSummaryModal({
    weekData,
    open,
    onOpenChange
}: WeeklyJobSheetSummaryModalProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [isExportingPng, setIsExportingPng] = useState(false);
    const [containerWidth, setContainerWidth] = useState(860);
    const [viewMode, setViewMode] = useState<"fit" | "actual">("fit");
    const [isCopied, setIsCopied] = useState(false);

    const { companyProfile, currentTeam, currentUser } = useProjects();

    useEffect(() => {
        if (!open) return;
        const updateWidth = () => {
            if (scrollContainerRef.current) {
                setContainerWidth(scrollContainerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, [open]);

    // A4 reference width is 840px
    const scale = useMemo(() => {
        if (viewMode === "actual") return 1;
        if (!containerWidth || containerWidth >= 880) return 1;
        const available = Math.max(300, containerWidth - 32);
        return Math.min(1, available / 840);
    }, [containerWidth, viewMode]);

    if (!weekData || weekData.sheets.length === 0) return null;

    // Sort sheets chronologically for the weekly narrative
    const chronologicalSheets = [...weekData.sheets].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    // Company & Organization Info
    const companyLogo = companyProfile?.logo || chronologicalSheets[0]?.companyLogo || null;
    const companyName = companyProfile?.name || currentTeam?.name || chronologicalSheets[0]?.companyName || "บริษัทของคุณ";
    const companyAddress = companyProfile?.address || "";
    const companyTaxId = companyProfile?.taxId || "";
    const companyPhone = companyProfile?.phone || "";

    // Aggregations
    const totalDaysRecorded = chronologicalSheets.length;
    const allWorkItems = chronologicalSheets.flatMap(s => (s.workItems || []).map(w => ({ ...w, sheetDate: s.date, sheetProject: s.projectName })));
    const totalTasksCompleted = allWorkItems.filter(w => w.status === "completed").length;
    const completionRate = allWorkItems.length > 0 ? Math.round((totalTasksCompleted / allWorkItems.length) * 100) : 0;

    // Consolidated materials & equipment
    const materialsList = Array.from(new Set(chronologicalSheets.map(s => s.materialsReceived?.trim()).filter(Boolean)));
    const equipmentList = Array.from(new Set(chronologicalSheets.map(s => s.equipment?.trim()).filter(Boolean)));
    const safetyList = Array.from(new Set(chronologicalSheets.map(s => s.safetyNotes?.trim()).filter(Boolean)));
    const obstaclesList = Array.from(new Set(chronologicalSheets.map(s => s.obstacles?.trim()).filter(Boolean)));

    // Unique reporters
    const reporters = Array.from(new Set(chronologicalSheets.map(s => s.reportedBy || s.createdByName).filter(Boolean))).join(", ") || currentUser?.name || "ทีมหน้างาน";

    // Handle Print
    const handlePrint = () => {
        window.print();
    };

    // Handle Export PNG
    const handleExportPng = async () => {
        if (!reportRef.current) return;
        setIsExportingPng(true);
        const toastId = toast.loading("กำลังเรนเดอร์เอกสารสรุปสัปดาห์เป็นภาพ PNG...");

        try {
            const dataUrl = await toPng(reportRef.current, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor: "#ffffff",
                cacheBust: true
            });

            const link = document.createElement("a");
            link.download = `Weekly_JobSheet_Summary_${weekData.startDateStr}_to_${weekData.endDateStr}.png`;
            link.href = dataUrl;
            link.click();

            toast.success("ดาวน์โหลดรายงานสรุปสัปดาห์เรียบร้อยแล้ว", { id: toastId });
        } catch (err) {
            console.error("Export PNG failed:", err);
            toast.error("สร้างไฟล์ภาพไม่สำเร็จ กรุณาลองใช้ปุ่มพิมพ์/บันทึก PDF", { id: toastId });
        } finally {
            setIsExportingPng(false);
        }
    };

    // Handle Copy LINE Summary Text
    const handleCopyLineSummary = () => {
        const text = `📋 รายงานสรุปผลการปฏิบัติงานประจำสัปดาห์
🏢 ${companyName}
📅 ช่วงเวลา: ${weekData.dateRangeLabel} (${totalDaysRecorded} วันทำงาน)
👷 ผู้สรุปรายงาน: ${reporters}

📊 ภาพรวมสัปดาห์:
• งานที่บันทึก: ${allWorkItems.length} รายการ (เสร็จแล้ว ${totalTasksCompleted} รายการ / ${completionRate}%)
• โครงการ: ${weekData.uniqueProjects.join(", ") || "งานประจำวันทั่วไป"}

🔨 สรุปงานรายวัน:
${chronologicalSheets.map(s => {
    const dayName = getDayOfWeekThai(s.date);
    const tasks = (s.workItems || []).map(w => `  - ${w.task} ${w.status === "completed" ? "✅" : "⏳"}`).join("\n");
    return `🗓️ วัน${dayName} ${s.date} (${s.projectName})\n${tasks || "  - ปฏิบัติงานตามแผนงาน"}`;
}).join("\n\n")}

${obstaclesList.length > 0 ? `⚠️ ปัญหา/อุปสรรค:\n${obstaclesList.map(o => `• ${o}`).join("\n")}\n` : ""}
${materialsList.length > 0 ? `📦 วัสดุเข้าหน้างาน:\n${materialsList.map(m => `• ${m}`).join("\n")}\n` : ""}
✨ รายงานสรุปอัตโนมัติจากระบบ Hipsloth Construction Pro`;

        navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast.success("คัดลอกสรุปข้อความสำหรับส่ง LINE เรียบร้อยแล้ว!");
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-full h-[94vh] p-0 gap-0 bg-[#0d0f17] border-white/10 text-white flex flex-col overflow-hidden shadow-2xl z-[100]">
                {/* Accessible Dialog Titles */}
                <DialogTitle className="sr-only">
                    รายงานสรุปการปฏิบัติงานประจำสัปดาห์ ({weekData.dateRangeLabel})
                </DialogTitle>
                <DialogDescription className="sr-only">
                    เอกสารสรุป JobSheet รายสัปดาห์ รวบรวมงานรายวันและวัสดุ
                </DialogDescription>

                {/* Top Action Toolbar (Hidden during Print) */}
                <div className="border-b border-white/10 bg-zinc-900/90 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 print:hidden z-10">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xs sm:text-sm font-bold truncate">
                                สรุป JobSheet สัปดาห์: {weekData.dateRangeLabel}
                            </h2>
                            <p className="text-[10px] text-white/50 truncate">
                                {totalDaysRecorded} วันทำงาน • {totalTasksCompleted}/{allWorkItems.length} งานสำเร็จ
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Zoom mode toggle on mobile */}
                        <div className="hidden sm:flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[11px]">
                            <button
                                onClick={() => setViewMode("fit")}
                                className={`px-2.5 py-1 rounded-md transition-colors ${
                                    viewMode === "fit" ? "bg-amber-500 text-black font-bold" : "text-white/60 hover:text-white"
                                }`}
                            >
                                พอดีจอ
                            </button>
                            <button
                                onClick={() => setViewMode("actual")}
                                className={`px-2.5 py-1 rounded-md transition-colors ${
                                    viewMode === "actual" ? "bg-amber-500 text-black font-bold" : "text-white/60 hover:text-white"
                                }`}
                            >
                                100% (A4)
                            </button>
                        </div>

                        {/* Copy LINE Summary */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyLineSummary}
                            className="h-8 sm:h-9 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium px-2 sm:px-3"
                        >
                            {isCopied ? (
                                <Check className="w-3.5 h-3.5 mr-1" />
                            ) : (
                                <Copy className="w-3.5 h-3.5 mr-1" />
                            )}
                            <span className="hidden xs:inline">{isCopied ? "คัดลอกแล้ว" : "ส่งเข้า LINE"}</span>
                        </Button>

                        {/* Export PNG */}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isExportingPng}
                            onClick={handleExportPng}
                            className="h-8 sm:h-9 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-medium px-2 sm:px-3"
                        >
                            {isExportingPng ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            ) : (
                                <ImageIcon className="w-3.5 h-3.5 mr-1" />
                            )}
                            <span className="hidden xs:inline">บันทึกรูป PNG</span>
                        </Button>

                        {/* Print / Save PDF */}
                        <Button
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 sm:h-9 text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 shadow-md shadow-amber-500/20"
                        >
                            <Printer className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                            <span>พิมพ์ / PDF</span>
                        </Button>

                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors ml-1"
                            title="ปิด"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Scroll View Area */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-zinc-950/80 flex justify-center custom-scrollbar"
                >
                    <div
                        style={{
                            transform: scale < 1 ? `scale(${scale})` : undefined,
                            transformOrigin: "top center",
                            marginBottom: scale < 1 ? `-${Math.round((1 - scale) * 1100)}px` : 0
                        }}
                        className="transition-transform duration-200"
                    >
                        {/* A4 REPORT SHEET (White Background, Black Text for Crisp Printing) */}
                        <div
                            ref={reportRef}
                            id="weekly-jobsheet-print-area"
                            className="w-[820px] bg-white text-zinc-900 shadow-2xl p-8 sm:p-10 font-sans border border-zinc-200 print:border-none print:shadow-none print:p-0 print:w-full print:m-0"
                            style={{ minHeight: "1160px" }}
                        >
                            {/* Document Header */}
                            <div className="border-b-2 border-zinc-800 pb-4 mb-6">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Company Identity */}
                                    <div className="flex items-center gap-3">
                                        {companyLogo ? (
                                            <img
                                                src={companyLogo}
                                                alt="Company Logo"
                                                className="w-14 h-14 object-contain rounded-lg border border-zinc-200 p-1 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-xl shrink-0">
                                                HP
                                            </div>
                                        )}
                                        <div>
                                            <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
                                                {companyName}
                                            </h1>
                                            {companyAddress && (
                                                <p className="text-[11px] text-zinc-600 max-w-md line-clamp-2">
                                                    {companyAddress}
                                                </p>
                                            )}
                                            {(companyPhone || companyTaxId) && (
                                                <p className="text-[10px] text-zinc-500">
                                                    {companyPhone && `โทร: ${companyPhone}`} {companyTaxId && `• เลขผู้เสียภาษี: ${companyTaxId}`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Report Title Badge */}
                                    <div className="text-right shrink-0">
                                        <div className="inline-block bg-zinc-900 text-white text-xs font-black uppercase px-3 py-1 rounded tracking-wider mb-1">
                                            WEEKLY SUMMARY REPORT
                                        </div>
                                        <h2 className="text-base font-bold text-zinc-800">
                                            รายงานสรุปผลงานประจำสัปดาห์
                                        </h2>
                                        <p className="text-xs font-bold text-amber-600 mt-0.5">
                                            {weekData.dateRangeLabel}
                                        </p>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-zinc-200 text-xs">
                                    <div>
                                        <span className="text-zinc-500 font-semibold block text-[10px] uppercase">ช่วงสัปดาห์</span>
                                        <span className="font-bold text-zinc-800">
                                            {formatThaiDateLong(weekData.startDateStr)} – {formatThaiDateLong(weekData.endDateStr)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 font-semibold block text-[10px] uppercase">โครงการที่ดำเนินการ</span>
                                        <span className="font-bold text-zinc-800 truncate block">
                                            {weekData.uniqueProjects.join(" • ") || "งานประจำวันทั่วไป"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-zinc-500 font-semibold block text-[10px] uppercase">ผู้สรุปรายงาน / ทีมงาน</span>
                                        <span className="font-bold text-zinc-800">
                                            {reporters}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Weekly Executive KPIs */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-zinc-50 border border-zinc-200 rounded-[4px] p-3 text-center">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">วันลงบันทึกงาน</span>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-2xl font-black text-zinc-900 font-mono">{totalDaysRecorded}</span>
                                        <span className="text-[11px] text-zinc-500 font-medium">วัน</span>
                                    </div>
                                    <span className="text-[9px] text-zinc-400 mt-0.5 block">ในสัปดาห์นี้</span>
                                </div>

                                <div className="bg-zinc-50 border border-zinc-200 rounded-[4px] p-3 text-center">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">งานที่ดำเนินการ</span>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-2xl font-black text-emerald-600 font-mono">{totalTasksCompleted}</span>
                                        <span className="text-[11px] text-zinc-500 font-medium">/ {allWorkItems.length}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-600 mt-0.5 block">{completionRate}% สำเร็จ</span>
                                </div>

                                <div className="bg-zinc-50 border border-zinc-200 rounded-[4px] p-3 text-center">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">จำนวนโครงการ</span>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-2xl font-black text-indigo-600 font-mono">{weekData.uniqueProjects.length || 1}</span>
                                        <span className="text-[11px] text-zinc-500 font-medium">ไซต์งาน</span>
                                    </div>
                                    <span className="text-[9px] text-zinc-400 mt-0.5 block">ที่เข้าปฏิบัติงาน</span>
                                </div>
                            </div>

                            {/* Section 2: Daily Operations Timeline Table */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between border-b border-zinc-300 pb-1.5 mb-2.5">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                        1. สรุปความคืบหน้ารายวัน (Daily Operations Summary)
                                    </h3>
                                    <span className="text-[10px] text-zinc-500">เรียงตามวันที่ปฏิบัติงานจริง</span>
                                </div>

                                <table className="w-full text-left text-xs border border-zinc-200 rounded-none overflow-hidden" style={{ borderRadius: 0 }}>
                                    <thead className="bg-zinc-100 text-[10px] uppercase font-bold text-zinc-700 border-b border-zinc-200">
                                        <tr>
                                            <th className="py-2 px-2.5 w-24">วัน / วันที่</th>
                                            <th className="py-2 px-2.5 w-32">โครงการ / ไซต์งาน</th>
                                            <th className="py-2 px-2.5">สรุปงานสำคัญที่ปฏิบัติ</th>
                                            <th className="py-2 px-2.5 w-24 text-center">สภาพอากาศ</th>
                                            <th className="py-2 px-2.5 w-20 text-center">สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200">
                                        {chronologicalSheets.map((sheet, idx) => {
                                            const dayName = getDayOfWeekThai(sheet.date);
                                            const completed = sheet.workItems?.filter(w => w.status === "completed").length || 0;
                                            const total = sheet.workItems?.length || 0;

                                            return (
                                                <tr key={sheet.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                                                    <td className="py-2 px-2.5 align-top">
                                                        <span className="font-bold text-zinc-900 block">วัน{dayName}</span>
                                                        <span className="text-[10px] text-zinc-500 font-mono">{sheet.date}</span>
                                                        <span className="text-[9px] text-amber-600 font-mono block">{sheet.reportNumber}</span>
                                                    </td>
                                                    <td className="py-2 px-2.5 align-top font-semibold text-zinc-800">
                                                        {sheet.projectName}
                                                    </td>
                                                    <td className="py-2 px-2.5 align-top">
                                                        {sheet.workItems && sheet.workItems.length > 0 ? (
                                                            <ul className="space-y-1">
                                                                {sheet.workItems.slice(0, 3).map((w, wIdx) => (
                                                                    <li key={wIdx} className="text-[11px] text-zinc-700 flex items-start gap-1">
                                                                        <span className="text-zinc-400 mt-0.5">•</span>
                                                                        <span className="font-medium">{w.task}</span>
                                                                        {w.timeSlot && <span className="text-[9px] text-zinc-400 font-mono">({w.timeSlot})</span>}
                                                                    </li>
                                                                ))}
                                                                {sheet.workItems.length > 3 && (
                                                                    <li className="text-[10px] text-zinc-500 italic">
                                                                        + อีก {sheet.workItems.length - 3} รายการย่อย
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-zinc-400 italic text-[11px]">ไม่มีรายการระบุ</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2.5 align-top text-center text-[10px] text-zinc-600">
                                                        <div className="font-medium truncate max-w-[90px] mx-auto">
                                                            {sheet.weather?.condition ? sheet.weather.condition.split("(")[0].trim() : "แจ่มใส"}
                                                        </div>
                                                        {sheet.weather?.temperature && (
                                                            <span className="text-zinc-400 font-mono">{sheet.weather.temperature}°C</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2.5 align-top text-center">
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                            completed === total && total > 0
                                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                                : "bg-amber-100 text-amber-800 border border-amber-300"
                                                        }`}>
                                                            {completed}/{total} เสร็จ
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Section 3: Detailed Work Items by Project */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between border-b border-zinc-300 pb-1.5 mb-2.5">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                                        2. รายละเอียดงานที่ปฏิบัติแยกตามไซต์งาน / โครงการ
                                    </h3>
                                    <span className="text-[10px] text-zinc-500">รวมทั้งสิ้น {allWorkItems.length} รายการ</span>
                                </div>

                                <div className="space-y-3">
                                    {weekData.uniqueProjects.map((projName, pIdx) => {
                                        const projItems = allWorkItems.filter(w => (w.sheetProject === projName || w.projectName === projName));
                                        if (projItems.length === 0) return null;

                                        return (
                                            <div key={pIdx} className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
                                                <div className="flex items-center justify-between font-bold text-xs text-zinc-900 border-b border-zinc-200 pb-1.5 mb-2">
                                                    <span className="flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                                                        {projName}
                                                    </span>
                                                    <span className="text-[10px] font-normal text-zinc-500">
                                                        {projItems.filter(w => w.status === "completed").length}/{projItems.length} งานสำเร็จ
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-1.5">
                                                    {projItems.map((item, idx) => (
                                                        <div key={idx} className="flex items-start justify-between gap-2 text-xs py-1 px-1.5 rounded hover:bg-white transition-colors">
                                                            <div className="flex items-start gap-1.5 min-w-0">
                                                                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                                                    item.status === "completed" ? "text-emerald-600" : "text-amber-500"
                                                                }`} />
                                                                <div className="min-w-0">
                                                                    <p className="leading-tight">
                                                                        {item.titleStyle?.tag && (
                                                                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mr-1.5 align-middle">
                                                                                {item.titleStyle.tag}
                                                                            </span>
                                                                        )}
                                                                        <span className={item.titleStyle?.isBold === false ? "font-normal text-zinc-800" : "font-bold text-zinc-950"}>
                                                                            {item.task}
                                                                        </span>
                                                                    </p>
                                                                    {item.details && (
                                                                        <p className="text-[10px] text-zinc-600 whitespace-pre-line mt-0.5">
                                                                            {item.details}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                <span className="text-[10px] text-zinc-400 font-mono block">
                                                                    {item.sheetDate}
                                                                </span>
                                                                {item.timeSlot && (
                                                                    <span className="text-[9px] text-zinc-500 font-medium">
                                                                        {item.timeSlot}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section 3 & 4: Two Column Grid (Materials & Equipment + Safety & Obstacles) */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {/* Left: Materials & Equipment */}
                                <div className="border border-zinc-200 rounded-[4px] p-3 bg-zinc-50/50">
                                    <h4 className="text-[11px] font-black uppercase text-zinc-800 flex items-center gap-1 border-b border-zinc-200 pb-1.5 mb-2">
                                        <Package className="w-3 h-3 text-amber-600" /> 3. วัสดุเข้าหน้างาน & เครื่องจักร
                                    </h4>
                                    <div className="space-y-1.5 text-[11px]">
                                        <div>
                                            <span className="font-bold text-zinc-700 block text-[10px]">วัสดุก่อสร้างที่ตรวจรับ:</span>
                                            <p className="text-zinc-600">
                                                {materialsList.length > 0 ? materialsList.join(" • ") : "ไม่มีการตรวจรับวัสดุพิเศษในสัปดาห์นี้"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-bold text-zinc-700 block text-[10px]">เครื่องจักร / อุปกรณ์สำคัญ:</span>
                                            <p className="text-zinc-600">
                                                {equipmentList.length > 0 ? equipmentList.join(" • ") : "เครื่องมือประจำไซต์งานทั่วไป"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Safety & Obstacles */}
                                <div className="border border-zinc-200 rounded-[4px] p-3 bg-zinc-50/50">
                                    <h4 className="text-[11px] font-black uppercase text-zinc-800 flex items-center gap-1 border-b border-zinc-200 pb-1.5 mb-2">
                                        <ShieldCheck className="w-3 h-3 text-amber-600" /> 4. ความปลอดภัย & ปัญหาอุปสรรค
                                    </h4>
                                    <div className="space-y-1.5 text-[11px]">
                                        <div>
                                            <span className="font-bold text-zinc-700 block text-[10px]">มาตรการความปลอดภัย:</span>
                                            <p className="text-zinc-600">
                                                {safetyList.length > 0 ? safetyList.join(" • ") : "การปฏิบัติงานเป็นไปด้วยความเรียบร้อย สวมหมวกนิรภัยและ PPE ครบถ้วน"}
                                            </p>
                                        </div>
                                        {obstaclesList.length > 0 && (
                                            <div>
                                                <span className="font-bold text-rose-700 block text-[10px]">ปัญหา / อุปสรรคที่พบ:</span>
                                                <p className="text-rose-600 font-medium">
                                                    {obstaclesList.join(" • ")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 6: Sign-off / Signature Approvals */}
                            <div className="border-t-2 border-zinc-800 pt-5 mt-8 break-inside-avoid">
                                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                                    {/* Column 1: Prepared By */}
                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-12">
                                            ผู้จัดทำรายงาน / โฟร์แมน
                                        </span>
                                        <div className="border-b border-zinc-400 mx-4 mb-1"></div>
                                        <p className="font-bold text-zinc-900">{reporters}</p>
                                        <p className="text-[10px] text-zinc-500">ผู้ดูแลหน้างาน</p>
                                        <p className="text-[9px] text-zinc-400 font-mono mt-0.5">วันที่: ..... / ..... / ..........</p>
                                    </div>

                                    {/* Column 2: Site Engineer / Inspector */}
                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-12">
                                            วิศวกรผู้ควบคุมงาน / ผู้ตรวจสอบ
                                        </span>
                                        <div className="border-b border-zinc-400 mx-4 mb-1"></div>
                                        <p className="font-bold text-zinc-900">
                                            {chronologicalSheets.find(s => s.inspectedBy)?.inspectedBy || "( ............................................ )"}
                                        </p>
                                        <p className="text-[10px] text-zinc-500">วิศวกรโครงการ / ผู้ควบคุมงาน</p>
                                        <p className="text-[9px] text-zinc-400 font-mono mt-0.5">วันที่: ..... / ..... / ..........</p>
                                    </div>

                                    {/* Column 3: Project Manager / Client */}
                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-12">
                                            ผู้จัดการโครงการ / ผู้ว่าจ้าง
                                        </span>
                                        <div className="border-b border-zinc-400 mx-4 mb-1"></div>
                                        <p className="font-bold text-zinc-900">( ............................................ )</p>
                                        <p className="text-[10px] text-zinc-500">อนุมัติ / รับทราบผลการดำเนินงาน</p>
                                        <p className="text-[9px] text-zinc-400 font-mono mt-0.5">วันที่: ..... / ..... / ..........</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-6 pt-2 border-t border-zinc-100 font-mono">
                                    <span>สร้างรายงานโดย: Hipsloth Construction Management System</span>
                                    <span>เอกสารเลขที่: WSR-{weekData.startDateStr.replace(/-/g, "")} • ออกเอกสารวันที่: {new Date().toLocaleDateString('th-TH')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
