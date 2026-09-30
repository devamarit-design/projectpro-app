"use client";

import React, { useRef, useState } from "react";
import { JobSheet } from "@/types/jobsheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
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
    const [isExportingPng, setIsExportingPng] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // Toggles for clean, job-focused output
    const [showSignatures, setShowSignatures] = useState(true);

    const { companyProfile, currentUser, currentTeam } = useProjects();

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

    // Total manpower
    const totalWorkers = jobsheet.manpower?.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0) || 0;

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
    const renderTaskDetails = (taskText: string) => {
        if (!taskText) return <span className="text-zinc-400 italic">ไม่ได้ระบุรายละเอียด</span>;
        const lines = taskText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length <= 1) {
            return (
                <div className="font-bold text-zinc-950 text-sm sm:text-[14px] leading-relaxed">
                    {taskText}
                </div>
            );
        }

        const [title, ...subLines] = lines;
        return (
            <div className="space-y-1.5">
                <div className="font-extrabold text-zinc-950 text-sm sm:text-[14px] leading-snug">
                    {title}
                </div>
                <div className="space-y-1 pl-3 border-l-2 border-amber-400">
                    {subLines.map((line, idx) => {
                        const cleanLine = line.replace(/^[-•*]\s*/, "");
                        return (
                            <div key={idx} className="flex items-start gap-2 text-zinc-800 text-[13px] leading-relaxed">
                                <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                                <span className="font-medium">{cleanLine}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Export as PNG
    const handleDownloadPng = async () => {
        if (!sheetRef.current) return;
        setIsExportingPng(true);
        const toastId = toast.loading("กำลังเรนเดอร์รูปภาพความคมชัดสูง...");

        try {
            sheetRef.current.scrollIntoView({ block: "center" });
            await new Promise((r) => setTimeout(r, 200));

            const dataUrl = await toPng(sheetRef.current, {
                pixelRatio: 2.5,
                backgroundColor: "#ffffff",
                quality: 0.98,
                cacheBust: true,
                style: {
                    transform: "scale(1)",
                    transformOrigin: "top left"
                }
            });

            const link = document.createElement("a");
            link.download = `${jobsheet.reportNumber || "JobSheet"}-${jobsheet.date}.png`;
            link.href = dataUrl;
            link.click();

            toast.success("ดาวน์โหลดรูปภาพ PNG สำเร็จ", { id: toastId });
        } catch (error) {
            console.error("Export PNG error:", error);
            toast.error("ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง", { id: toastId });
        } finally {
            setIsExportingPng(false);
        }
    };

    // Export as PDF
    const handleDownloadPdf = async () => {
        if (!sheetRef.current) return;
        setIsExportingPdf(true);
        const toastId = toast.loading("กำลังจัดทำเอกสาร PDF...");

        try {
            sheetRef.current.scrollIntoView({ block: "center" });
            await new Promise((r) => setTimeout(r, 200));

            const dataUrl = await toPng(sheetRef.current, {
                pixelRatio: 2.5,
                backgroundColor: "#ffffff",
                quality: 0.98,
                cacheBust: true
            });

            // Standard A4: 210mm x 297mm
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            const pageHeight = pdf.internal.pageSize.getHeight();
            if (pdfHeight > pageHeight) {
                const ratio = Math.min(pdfWidth / imgProps.width, pageHeight / imgProps.height);
                const fittedWidth = imgProps.width * ratio;
                const fittedHeight = imgProps.height * ratio;
                const marginX = (pdfWidth - fittedWidth) / 2;
                pdf.addImage(dataUrl, "PNG", marginX, 4, fittedWidth, fittedHeight);
            } else {
                pdf.addImage(dataUrl, "PNG", 0, 4, pdfWidth, pdfHeight);
            }

            pdf.save(`${jobsheet.reportNumber || "JobSheet"}-${jobsheet.date}.pdf`);
            toast.success("ดาวน์โหลดเอกสาร PDF สำเร็จ", { id: toastId });
        } catch (error) {
            console.error("Export PDF error:", error);
            toast.error("ไม่สามารถสร้าง PDF ได้ แนะนำให้ใช้ปุ่มพิมพ์แทน", { id: toastId });
        } finally {
            setIsExportingPdf(false);
        }
    };

    // Browser Print
    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[94vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-white/10 text-white">
                {/* Header Actions & Customizable Toggles */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-zinc-900/90 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <div>
                            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                                ตัวอย่างเอกสาร Job Sheet (A4)
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                                    {jobsheet.reportNumber}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-white/50">
                                วันที่ {jobsheet.date} • ผู้จัดทำ: {reporterName} ({reporterRole})
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Output Controls & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Toggle: Signatures block */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSignatures(!showSignatures)}
                            className={`h-8 text-xs border transition-colors ${
                                showSignatures
                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                    : "border-white/10 text-white/60 hover:bg-white/5"
                            }`}
                            title="สลับการแสดงผลช่องลงนามท้ายเอกสาร"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            {showSignatures ? "✓ มีช่องลงนาม" : "ไม่มีช่องลงนาม"}
                        </Button>

                        {onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onOpenChange(false);
                                    onEdit(jobsheet);
                                }}
                                className="h-8 text-xs border-white/10 hover:bg-white/5 text-white/80"
                            >
                                แก้ไขข้อมูล
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 text-xs border-white/10 hover:bg-white/5 text-white/80"
                        >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            พิมพ์
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPng}
                            disabled={isExportingPng}
                            className="h-8 text-xs border-white/10 hover:bg-white/5 text-white/80"
                        >
                            {isExportingPng ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 mr-1 text-emerald-400" />}
                            รูปภาพ (PNG)
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleDownloadPdf}
                            disabled={isExportingPdf}
                            className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md shadow-amber-500/20"
                        >
                            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                            ดาวน์โหลด PDF
                        </Button>
                    </div>
                </div>

                {/* Printable Document Sheet Scroll Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-zinc-900/60 flex justify-center">
                    {/* The A4 Sheet Paper - Wide, Full-width & High Legibility */}
                    <div
                        ref={sheetRef}
                        id="jobsheet-printable-paper"
                        className="w-full max-w-[940px] bg-white text-zinc-900 shadow-2xl rounded-sm p-6 sm:p-10 font-sans print:shadow-none print:p-6 print:m-0 print:w-full print:max-w-none border border-zinc-200"
                        style={{ minHeight: "1120px" }}
                    >
                        {/* Company Header (Using User's Company Logo & Name, NOT App Logo) */}
                        <div className="border-b-2 border-zinc-900 pb-4 mb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    {companyLogo ? (
                                        <img
                                            src={companyLogo}
                                            alt={companyName}
                                            className="h-12 sm:h-14 w-auto max-w-[150px] object-contain rounded"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-zinc-900 text-amber-400 flex items-center justify-center font-black text-xl tracking-tight shadow-sm shrink-0">
                                            {companyName.charAt(0).toUpperCase()}
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
                        <div className="bg-zinc-50 border border-zinc-300 rounded p-3 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
                                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <HardHat className="w-4 h-4 text-amber-600" />
                                    รายการงานที่ปฏิบัติประจำวัน (Work Activities & Progress)
                                </h3>
                                <span className="text-xs font-medium text-zinc-500">
                                    จำนวน {jobsheet.workItems?.length || 0} รายการ
                                </span>
                            </div>

                            <div className="border border-zinc-400 rounded-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-900 text-white font-bold text-xs uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-12 text-center border-r border-zinc-700">ลำดับ</th>
                                            <th className="py-2.5 px-3.5 w-56 border-r border-zinc-700">โครงการ / โซน / เวลา</th>
                                            <th className="py-2.5 px-4 border-r border-zinc-700">รายละเอียดงานที่ปฏิบัติ (Work Activities & Progress)</th>
                                            <th className="py-2.5 px-2.5 w-24 text-center border-r border-zinc-700">สถานะ</th>
                                            <th className="py-2.5 px-3 w-32">หมายเหตุ</th>
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

                                                        {/* 2. โครงการ / โซน / เวลา (จัดกลุ่มข้อมูลบริบทให้เป็นสัดส่วนชัดเจน) */}
                                                        <td className="py-3 px-3 align-top border-r border-zinc-200">
                                                            <div className="space-y-1.5">
                                                                <div>
                                                                    {isGeneral ? (
                                                                        <span className="inline-flex items-center gap-1 font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded text-[11px] border border-zinc-200">
                                                                            📦 {item.projectName || "งานทั่วไป / ส่วนกลาง"}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                                                                            🏢 {item.projectName || jobsheet.projectName}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                                                                    {item.timeSlot && (
                                                                        <span className="inline-flex items-center gap-0.5 bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 font-mono">
                                                                            ⏱ {item.timeSlot}
                                                                        </span>
                                                                    )}
                                                                    {item.location && (
                                                                        <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded border border-blue-200/80 font-medium">
                                                                            📍 {item.location}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 3. รายละเอียดงานที่ปฏิบัติ (เน้นความกว้าง ตัวหนังสือใหญ่ อ่านง่าย สบายตาที่สุด) */}
                                                        <td className="py-3.5 px-4 align-top border-r border-zinc-200">
                                                            {renderTaskDetails(item.task)}
                                                            {item.quantity && (
                                                                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 font-medium">
                                                                    <span className="text-zinc-500 font-medium text-[11px]">ปริมาณ / ขนาด:</span>
                                                                    <span className="font-bold text-zinc-900">{item.quantity}</span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* 4. สถานะ */}
                                                        <td className="py-3 px-2 text-center align-top border-r border-zinc-200">
                                                            {item.status === "completed" && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                                    <Check className="w-3 h-3 stroke-[3]" /> เสร็จสิ้น
                                                                </span>
                                                            )}
                                                            {item.status === "in_progress" && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                                                    <Clock className="w-3 h-3" /> ดำเนินการ
                                                                </span>
                                                            )}
                                                            {item.status === "pending" && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                                    รอดำเนินการ
                                                                </span>
                                                            )}
                                                            {item.status === "delayed" && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                                    ติดปัญหา
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* 5. หมายเหตุ */}
                                                        <td className="py-3 px-3 text-zinc-700 text-xs align-top leading-relaxed">
                                                            {item.notes ? (
                                                                <span className="font-medium text-zinc-800">{item.notes}</span>
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



                        {/* Obstacles & Safety Notes (Only displayed if non-empty / meaningful) */}
                        {(jobsheet.obstacles || jobsheet.safetyNotes) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs">
                                {jobsheet.obstacles && (
                                    <div className="border border-zinc-300 rounded p-2.5 bg-amber-50/20">
                                        <span className="font-bold text-amber-900 block mb-1">
                                            ⚠️ ปัญหา / อุปสรรคหน้างาน:
                                        </span>
                                        <p className="text-zinc-700 leading-relaxed">{jobsheet.obstacles}</p>
                                    </div>
                                )}
                                {jobsheet.safetyNotes && (
                                    <div className="border border-zinc-300 rounded p-2.5 bg-emerald-50/20">
                                        <span className="font-bold text-emerald-900 block mb-1">
                                            🛡️ ความปลอดภัยหน้างาน:
                                        </span>
                                        <p className="text-zinc-700 leading-relaxed">{jobsheet.safetyNotes}</p>
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
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {jobsheet.photos.map((src, i) => (
                                        <div key={i} className="aspect-video rounded border border-zinc-200 overflow-hidden bg-zinc-100">
                                            <img src={src} alt={`Site photo ${i + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Formal Signatures Footer (Wide & Clean) */}
                        {showSignatures && (
                            <div className="border-t-2 border-zinc-900 pt-6 mt-8">
                                <div className="grid grid-cols-2 gap-10 text-center text-xs">
                                    <div>
                                        <div className="h-14 border-b border-dashed border-zinc-400 mb-2 flex items-end justify-center pb-1 font-serif text-sm italic text-zinc-700">
                                            {reporterName}
                                        </div>
                                        <span className="font-bold text-zinc-900 block">
                                            ( {reporterName} )
                                        </span>
                                        <span className="text-zinc-500 text-[11px] block mt-0.5">
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
                                        <span className="font-bold text-zinc-900 block">
                                            ( {jobsheet.inspectedBy || "ผู้ตรวจสอบ / ผู้จัดการโครงการ"} )
                                        </span>
                                        <span className="text-zinc-500 text-[11px] block mt-0.5">
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
            </DialogContent>
        </Dialog>
    );
}
