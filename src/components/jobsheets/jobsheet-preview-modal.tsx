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
    CheckCircle2, 
    Clock, 
    Check, 
    Loader2, 
    X,
    Building2,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { toPng, toBlob } from "html-to-image";

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

    if (!jobsheet) return null;

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

    // Export as PNG
    const handleDownloadPng = async () => {
        if (!sheetRef.current) return;
        setIsExportingPng(true);
        const toastId = toast.loading("กำลังเรนเดอร์รูปภาพความคมชัดสูง...");

        try {
            // Scroll into view & wait for render
            sheetRef.current.scrollIntoView({ block: "center" });
            await new Promise((r) => setTimeout(r, 200));

            const dataUrl = await toPng(sheetRef.current, {
                pixelRatio: 2,
                backgroundColor: "#ffffff",
                quality: 0.95,
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

            toast.success("ดาวน์โหลดรูปภาพ PNG เรียบร้อยแล้ว", { id: toastId });
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
                pixelRatio: 2,
                backgroundColor: "#ffffff",
                quality: 0.95,
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

            // If taller than A4, add pages or scale fit
            const pageHeight = pdf.internal.pageSize.getHeight();
            if (pdfHeight > pageHeight) {
                // Multi-page or scale to fit
                const ratio = Math.min(pdfWidth / imgProps.width, pageHeight / imgProps.height);
                const fittedWidth = imgProps.width * ratio;
                const fittedHeight = imgProps.height * ratio;
                const marginX = (pdfWidth - fittedWidth) / 2;
                pdf.addImage(dataUrl, "PNG", marginX, 5, fittedWidth, fittedHeight);
            } else {
                pdf.addImage(dataUrl, "PNG", 0, 5, pdfWidth, pdfHeight);
            }

            pdf.save(`${jobsheet.reportNumber || "JobSheet"}-${jobsheet.date}.pdf`);
            toast.success("ดาวน์โหลดเอกสาร PDF สำเร็จแล้ว", { id: toastId });
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
            <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-white/10 text-white">
                {/* Header Actions */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-zinc-900/80 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <div>
                            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                                {jobsheet.title}
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                                    {jobsheet.reportNumber}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-white/50">
                                วันที่ {jobsheet.date} • {jobsheet.projectName}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                            พิมพ์ (Print)
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
                            className="h-8 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold shadow-md shadow-amber-500/20"
                        >
                            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                            ดาวน์โหลด PDF
                        </Button>
                    </div>
                </div>

                {/* Printable Document Sheet Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-900/50 flex justify-center">
                    {/* The A4 Sheet Paper */}
                    <div
                        ref={sheetRef}
                        id="jobsheet-printable-paper"
                        className="w-full max-w-[800px] bg-white text-zinc-900 shadow-2xl rounded-sm p-8 sm:p-10 font-sans print:shadow-none print:p-6 print:m-0 print:w-full print:max-w-none"
                        style={{ minHeight: "1050px" }}
                    >
                        {/* Company & Document Header */}
                        <div className="border-b-2 border-zinc-900 pb-4 mb-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-zinc-900 text-amber-400 flex items-center justify-center font-black text-xl tracking-tighter shadow-sm">
                                        HP
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight uppercase">
                                            HIPSLOTH PROJECT
                                        </h1>
                                        <p className="text-xs text-zinc-500 font-medium">
                                            CONSTRUCTION MANAGEMENT & SITE PROGRESS REPORT
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="inline-block bg-zinc-900 text-white font-mono text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider mb-1">
                                        DAILY JOB SHEET
                                    </div>
                                    <div className="text-xs text-zinc-600 font-mono">
                                        เลขที่: <span className="font-bold text-zinc-900">{jobsheet.reportNumber}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Title & Project Meta Box */}
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                                <span className="text-zinc-500 block mb-0.5 font-medium">ขอบเขตงาน / โครงการ:</span>
                                <span className="font-bold text-zinc-900 text-sm block leading-tight">{jobsheet.projectName}</span>
                                {jobsheet.subProjectName && (
                                    <span className="text-zinc-600 block mt-0.5">({jobsheet.subProjectName})</span>
                                )}
                                {jobsheet.isMultiProject && (
                                    <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                                        บันทึกรวมหลายโครงการ / งานทั่วไป
                                    </span>
                                )}
                            </div>
                            <div>
                                <span className="text-zinc-500 block mb-0.5 font-medium">วันที่บันทึก / Date:</span>
                                <span className="font-bold text-zinc-900">{formatThaiDate(jobsheet.date)}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block mb-0.5 font-medium">สภาพอากาศ / Weather:</span>
                                <span className="inline-flex items-center gap-1 font-semibold text-zinc-800 bg-white px-2 py-0.5 rounded border border-zinc-200">
                                    <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                                    {jobsheet.weather?.condition || "ท้องฟ้าแจ่มใส"}
                                    {jobsheet.weather?.temperature ? ` (${jobsheet.weather.temperature}°C)` : ""}
                                </span>
                            </div>
                        </div>

                        {/* Work Items Table */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <HardHat className="w-4 h-4 text-amber-600" />
                                    1. รายการงานที่ปฏิบัติประจำวัน (Work Executed)
                                </h2>
                                <span className="text-[11px] text-zinc-500">
                                    รวม {jobsheet.workItems?.length || 0} รายการ
                                </span>
                            </div>

                            <div className="border border-zinc-300 rounded-md overflow-hidden text-xs">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-700 font-semibold">
                                            <th className="py-2 px-2 w-8 text-center">#</th>
                                            <th className="py-2 px-2.5 w-36">โครงการ / หมวดงาน</th>
                                            <th className="py-2 px-2.5">รายการงาน / กิจกรรม</th>
                                            <th className="py-2 px-2 w-24">พื้นที่ / โซน</th>
                                            <th className="py-2 px-2 w-16 text-center">ปริมาณ</th>
                                            <th className="py-2 px-2 w-20 text-center">สถานะ</th>
                                            <th className="py-2 px-2 w-28">หมายเหตุ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200">
                                        {jobsheet.workItems && jobsheet.workItems.length > 0 ? (
                                            jobsheet.workItems.map((item, idx) => {
                                                const isGeneral = !item.projectId && (!item.projectName || item.projectName.includes("ทั่วไป") || item.projectName.includes("จัดซื้อ") || item.projectName.includes("โรงงาน"));
                                                return (
                                                    <tr key={item.id || idx} className="hover:bg-zinc-50/50">
                                                        <td className="py-2 px-2 text-center text-zinc-500 font-mono">{idx + 1}</td>
                                                        <td className="py-2 px-2.5">
                                                            {isGeneral ? (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                                                                    📦 {item.projectName || "งานทั่วไป / นอกโครงการ"}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 truncate max-w-[130px]" title={item.projectName || jobsheet.projectName}>
                                                                    🏢 {item.projectName || jobsheet.projectName}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-2.5 font-medium text-zinc-900">{item.task}</td>
                                                        <td className="py-2 px-2 text-zinc-600">{item.location || "-"}</td>
                                                        <td className="py-2 px-2 text-center text-zinc-800 font-medium">{item.quantity || "-"}</td>
                                                        <td className="py-2 px-2 text-center">
                                                            {item.status === "completed" && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                                                    <Check className="w-3 h-3" /> เสร็จสิ้น
                                                                </span>
                                                            )}
                                                            {item.status === "in_progress" && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                                                                    <Clock className="w-3 h-3" /> ดำเนินการ
                                                                </span>
                                                            )}
                                                            {item.status === "pending" && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                                                    รอดำเนินการ
                                                                </span>
                                                            )}
                                                            {item.status === "delayed" && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                                                                    ล่าช้า
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-2 text-zinc-500 text-[11px]">{item.notes || "-"}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-4 text-center text-zinc-400">
                                                    ไม่มีรายการงานที่บันทึก
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Manpower & Resources Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-xs">
                            {/* Manpower Breakdown */}
                            <div className="border border-zinc-300 rounded-md p-3.5 bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        2. กำลังพลหน้างาน (Manpower)
                                    </span>
                                    <span className="font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                                        รวม {totalWorkers} คน
                                    </span>
                                </h3>

                                <div className="grid grid-cols-2 gap-2 text-zinc-700">
                                    {jobsheet.manpower && jobsheet.manpower.length > 0 ? (
                                        jobsheet.manpower.map((mp, i) => (
                                            <div key={mp.id || i} className="flex justify-between border-b border-zinc-200/70 pb-1">
                                                <span>{mp.role}:</span>
                                                <span className="font-bold text-zinc-900">{mp.count} คน</span>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-zinc-400 col-span-2">ไม่ได้ระบุแยกสายงาน</span>
                                    )}
                                </div>
                            </div>

                            {/* Equipment & Material */}
                            <div className="border border-zinc-300 rounded-md p-3.5 bg-zinc-50/50 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-purple-600" />
                                        3. เครื่องจักร & วัสดุเข้าหน้างาน
                                    </h3>
                                    <div className="space-y-2 text-zinc-700">
                                        <div>
                                            <span className="font-semibold text-zinc-800 block text-[11px]">เครื่องจักร / เครื่องมือหลัก:</span>
                                            <p className="text-zinc-600 mt-0.5 leading-relaxed">
                                                {jobsheet.equipment || "ไม่มีเครื่องจักรหนัก"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-zinc-800 block text-[11px]">วัสดุก่อสร้างที่รับเข้าวันนี้:</span>
                                            <p className="text-zinc-600 mt-0.5 leading-relaxed">
                                                {jobsheet.materialsReceived || "ไม่มีวัสดุเข้าหน้างาน"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Obstacles & Safety */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
                            <div className="border border-zinc-300 rounded-md p-3 bg-amber-50/30">
                                <h3 className="font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    ปัญหา / อุปสรรคหน้างาน (Obstacles)
                                </h3>
                                <p className="text-zinc-700 leading-relaxed">
                                    {jobsheet.obstacles || "การดำเนินงานราบรื่น ไม่มีปัญหาหรืออุปสรรคที่มีนัยสำคัญ"}
                                </p>
                            </div>

                            <div className="border border-zinc-300 rounded-md p-3 bg-emerald-50/30">
                                <h3 className="font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    ความปลอดภัยหน้างาน (Safety & Notes)
                                </h3>
                                <p className="text-zinc-700 leading-relaxed">
                                    {jobsheet.safetyNotes || "ปฏิบัติตามมาตรฐานความปลอดภัย สวมใส่อุปกรณ์ PPE ครบถ้วน ไม่มีอุบัติเหตุ"}
                                </p>
                            </div>
                        </div>

                        {/* Photos Section (if any) */}
                        {jobsheet.photos && jobsheet.photos.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
                                    <ImageIcon className="w-4 h-4 text-sky-600" />
                                    ภาพถ่ายประกอบหน้างาน (Site Photos)
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {jobsheet.photos.map((src, i) => (
                                        <div key={i} className="aspect-video rounded border border-zinc-200 overflow-hidden bg-zinc-100">
                                            <img src={src} alt={`Site photo ${i + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Signatures Footer */}
                        <div className="border-t-2 border-zinc-900 pt-6 mt-8">
                            <div className="grid grid-cols-2 gap-8 text-center text-xs">
                                <div>
                                    <div className="h-16 border-b border-dashed border-zinc-400 mb-2 flex items-end justify-center pb-1 font-serif text-sm italic text-zinc-700">
                                        {jobsheet.reportedBy || jobsheet.createdByName}
                                    </div>
                                    <span className="font-bold text-zinc-900 block">
                                        ( {jobsheet.reportedBy || jobsheet.createdByName || "ผู้จัดทำรายงาน"} )
                                    </span>
                                    <span className="text-zinc-500 text-[11px] block mt-0.5">
                                        ผู้จัดทำรายงาน / ผู้ควบคุมงานหน้างาน
                                    </span>
                                </div>

                                <div>
                                    <div className="h-16 border-b border-dashed border-zinc-400 mb-2 flex items-end justify-center pb-1 font-serif text-sm italic text-zinc-700">
                                        {jobsheet.inspectedBy || "..................................................."}
                                    </div>
                                    <span className="font-bold text-zinc-900 block">
                                        ( {jobsheet.inspectedBy || "ผู้ตรวจสอบ / วิศวกรโครงการ"} )
                                    </span>
                                    <span className="text-zinc-500 text-[11px] block mt-0.5">
                                        วิศวกรโครงการ / ตัวแทนผู้ว่าจ้าง
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
