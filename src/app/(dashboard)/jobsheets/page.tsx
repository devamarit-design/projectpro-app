"use client";

import React, { useState, useEffect, useMemo } from "react";
import { JobSheet } from "@/types/jobsheet";
import { 
    subscribeJobSheets, 
    createJobSheet, 
    updateJobSheet, 
    deleteJobSheet 
} from "@/lib/services/jobsheet-service";
import { useProjects } from "@/context/project-context";
import { JobSheetForm } from "@/components/jobsheets/jobsheet-form";
import { JobSheetPreviewModal } from "@/components/jobsheets/jobsheet-preview-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    FileText, 
    Plus, 
    Calendar, 
    Search, 
    Filter, 
    Download, 
    Printer, 
    Eye, 
    Edit3, 
    Trash2, 
    CheckCircle2, 
    Clock, 
    CloudSun, 
    Users, 
    HardHat, 
    Building2, 
    FolderKanban,
    UserCheck,
    Layers,
    ChevronRight,
    Sparkles,
    LayoutGrid,
    CalendarRange
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WeeklyJobSheetSummaryModal, WeekGroupData } from "@/components/jobsheets/weekly-jobsheet-summary-modal";

const THAI_MONTH_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THAI_MONTH_LONG = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function getISOWeekNumber(d: Date): number {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function getWeekBoundaries(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatYMD = (dt: Date) => {
        const yr = dt.getFullYear();
        const mo = String(dt.getMonth() + 1).padStart(2, "0");
        const da = String(dt.getDate()).padStart(2, "0");
        return `${yr}-${mo}-${da}`;
    };

    return {
        monday,
        sunday,
        mondayStr: formatYMD(monday),
        sundayStr: formatYMD(sunday)
    };
}

export default function JobSheetsPage() {
    const { currentTeam, currentUser, projects } = useProjects();
    const orgId = currentTeam?.id || currentUser?.orgIds?.[0] || currentUser?.organizations?.[0]?.orgId || "default_org";
    const currentUserId = currentUser?.id || "";

    // Data state
    const [jobsheets, setJobsheets] = useState<JobSheet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [activeTab, setActiveTab] = useState<"list" | "create" | "edit">("list");
    const [viewMode, setViewMode] = useState<"grouped" | "cards">("grouped"); // Grouped by month/week by default!
    const [filterScope, setFilterScope] = useState<"all" | "mine">("mine"); // Default to personal separation as requested!
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
    const [selectedDateFilter, setSelectedDateFilter] = useState("");

    // Preview & Edit states
    const [previewSheet, setPreviewSheet] = useState<JobSheet | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingSheet, setEditingSheet] = useState<JobSheet | null>(null);
    const [deletingSheetId, setDeletingSheetId] = useState<string | null>(null);

    // Weekly Summary Modal state
    const [selectedWeekForSummary, setSelectedWeekForSummary] = useState<WeekGroupData | null>(null);
    const [isWeeklySummaryOpen, setIsWeeklySummaryOpen] = useState(false);

    // Subscribe to Firestore jobsheets
    useEffect(() => {
        setIsLoading(true);

        const unsubscribe = subscribeJobSheets(
            orgId,
            undefined, // We fetch org sheets and filter locally, or filter by userId
            (data) => {
                setJobsheets(data);
                setIsLoading(false);
            },
            (err) => {
                console.warn("Jobsheet subscription warning:", err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [orgId]);

    // Filtered list
    const filteredSheets = useMemo(() => {
        return jobsheets.filter((sheet) => {
            // Scope filter: mine vs all
            if (filterScope === "mine") {
                const isMine = 
                    !currentUserId || 
                    !sheet.createdBy || 
                    sheet.createdBy === currentUserId || 
                    sheet.createdBy === "current_user" ||
                    (currentUser?.name && sheet.reportedBy?.toLowerCase() === currentUser.name.toLowerCase()) ||
                    (currentUser?.name && sheet.createdByName?.toLowerCase() === currentUser.name.toLowerCase());
                if (!isMine) return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = sheet.title?.toLowerCase().includes(q);
                const matchProject = sheet.projectName?.toLowerCase().includes(q);
                const matchDocNo = sheet.reportNumber?.toLowerCase().includes(q);
                const matchReporter = sheet.reportedBy?.toLowerCase().includes(q);
                const matchTasks = sheet.workItems?.some((w) => w.task.toLowerCase().includes(q));
                if (!matchTitle && !matchProject && !matchDocNo && !matchReporter && !matchTasks) {
                    return false;
                }
            }

            // Project filter
            if (selectedProjectFilter !== "all") {
                if (selectedProjectFilter === "general") {
                    const hasGeneral = !sheet.projectId || sheet.projectName?.includes("ทั่วไป") || sheet.workItems?.some(w => !w.projectId || w.projectName?.includes("ทั่วไป") || w.projectName?.includes("จัดซื้อ") || w.projectName?.includes("โรงงาน"));
                    if (!hasGeneral) return false;
                } else {
                    const matchPrimary = sheet.projectId === selectedProjectFilter || sheet.projectName === selectedProjectFilter;
                    const matchArray = sheet.projectIds?.includes(selectedProjectFilter);
                    const matchItems = sheet.workItems?.some(w => w.projectId === selectedProjectFilter);
                    if (!matchPrimary && !matchArray && !matchItems) {
                        return false;
                    }
                }
            }

            // Date filter
            if (selectedDateFilter && sheet.date !== selectedDateFilter) {
                return false;
            }

            return true;
        });
    }, [jobsheets, filterScope, currentUserId, currentUser?.name, searchQuery, selectedProjectFilter, selectedDateFilter]);

    // Group filtered sheets by Month and then by Week
    const monthGroups = useMemo(() => {
        const todayStr = new Date().toISOString().split("T")[0];

        // 1. Group by Week Key
        const weekMap = new Map<string, {
            weekKey: string;
            startDateStr: string;
            endDateStr: string;
            dateRangeLabel: string;
            weekLabel: string;
            monday: Date;
            sunday: Date;
            sheets: JobSheet[];
        }>();

        for (const sheet of filteredSheets) {
            const boundaries = getWeekBoundaries(sheet.date);
            const weekKey = `${boundaries.mondayStr}_${boundaries.sundayStr}`;

            if (!weekMap.has(weekKey)) {
                const { monday, sunday, mondayStr, sundayStr } = boundaries;
                const weekNum = getISOWeekNumber(monday);

                let dateRangeLabel = "";
                if (monday.getMonth() === sunday.getMonth()) {
                    dateRangeLabel = `${monday.getDate()} - ${sunday.getDate()} ${THAI_MONTH_SHORT[sunday.getMonth()]} ${sunday.getFullYear()}`;
                } else {
                    dateRangeLabel = `${monday.getDate()} ${THAI_MONTH_SHORT[monday.getMonth()]} - ${sunday.getDate()} ${THAI_MONTH_SHORT[sunday.getMonth()]} ${sunday.getFullYear()}`;
                }

                weekMap.set(weekKey, {
                    weekKey,
                    startDateStr: mondayStr,
                    endDateStr: sundayStr,
                    dateRangeLabel,
                    weekLabel: `สัปดาห์ที่ ${weekNum}`,
                    monday,
                    sunday,
                    sheets: []
                });
            }

            weekMap.get(weekKey)!.sheets.push(sheet);
        }

        // 2. Sort sheets in each week descending by date
        const weekList: WeekGroupData[] = Array.from(weekMap.values()).map((w) => {
            const sortedSheets = [...w.sheets].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
            const totalTasksDone = sortedSheets.reduce(
                (acc, s) => acc + (s.workItems?.filter((item) => item.status === "completed").length || 0),
                0
            );
            const totalTasks = sortedSheets.reduce(
                (acc, s) => acc + (s.workItems?.length || 0),
                0
            );
            const totalManpower = sortedSheets.reduce(
                (acc, s) => acc + (s.manpower?.reduce((mAcc, m) => mAcc + (Number(m.count) || 0), 0) || 0),
                0
            );
            const uniqueProjects = Array.from(
                new Set(sortedSheets.map((s) => s.projectName).filter(Boolean))
            );
            const isCurrentWeek = todayStr >= w.startDateStr && todayStr <= w.endDateStr;

            return {
                weekKey: w.weekKey,
                weekLabel: w.weekLabel,
                dateRangeLabel: w.dateRangeLabel,
                startDateStr: w.startDateStr,
                endDateStr: w.endDateStr,
                sheets: sortedSheets,
                totalTasksDone,
                totalTasks,
                totalManpower,
                uniqueProjects,
                isCurrentWeek
            };
        });

        // 3. Sort weeks descending (newest week first)
        weekList.sort((a, b) => b.startDateStr.localeCompare(a.startDateStr));

        // 4. Group weeks by Month (using month of sunday/end of week)
        const mGroupsMap = new Map<string, {
            monthKey: string;
            monthLabel: string;
            totalSheets: number;
            weeks: WeekGroupData[];
        }>();

        for (const week of weekList) {
            const [y, m] = week.endDateStr.split("-").map(Number);
            const monthKey = `${y}-${String(m).padStart(2, "0")}`;
            const monthLabel = `${THAI_MONTH_LONG[m - 1]} ${y}`;

            if (!mGroupsMap.has(monthKey)) {
                mGroupsMap.set(monthKey, {
                    monthKey,
                    monthLabel,
                    totalSheets: 0,
                    weeks: []
                });
            }

            const mg = mGroupsMap.get(monthKey)!;
            mg.weeks.push(week);
            mg.totalSheets += week.sheets.length;
        }

        return Array.from(mGroupsMap.values());
    }, [filteredSheets]);

    // Stats
    const totalReports = jobsheets.length;
    const myReportsCount = jobsheets.filter((s) => {
        return !currentUserId || !s.createdBy || s.createdBy === currentUserId || s.createdBy === "current_user" ||
            (currentUser?.name && (s.reportedBy?.toLowerCase() === currentUser.name.toLowerCase() || s.createdByName?.toLowerCase() === currentUser.name.toLowerCase()));
    }).length;
    const totalTasksDone = jobsheets.reduce(
        (acc, s) => acc + (s.workItems?.filter((w) => w.status === "completed").length || 0),
        0
    );
    const latestSheet = jobsheets[0];

    // Handlers with Optimistic Updates
    const handleSaveNew = async (data: Omit<JobSheet, "id" | "createdAt" | "updatedAt">) => {
        const targetOrgId = currentTeam?.id || data.orgId || currentUser?.orgIds?.[0] || (orgId !== "default_org" ? orgId : "");
        if (!targetOrgId) {
            toast.error("กรุณาเลือกทีมก่อนบันทึก JobSheet");
            return;
        }
        try {
            const saved = await createJobSheet(targetOrgId, {
                ...data,
                orgId: targetOrgId,
                createdBy: currentUserId || currentUser?.id || "current_user",
                createdByName: currentUser?.name || data.reportedBy || "ผู้รายงาน"
            });
            // Optimistic update so user sees it in list immediately
            setJobsheets(prev => [saved, ...prev.filter(s => s.id !== saved.id && (!saved.reportNumber || s.reportNumber !== saved.reportNumber))]);
            setActiveTab("list");
            toast.success("บันทึก JobSheet ลงระบบเรียบร้อยแล้ว");
        } catch (err: any) {
            console.error("Save error:", err);
            toast.error("บันทึกไม่สำเร็จ: " + (err?.message || "กรุณาลองใหม่อีกครั้ง"));
        }
    };

    const handleSaveEdit = async (data: Omit<JobSheet, "id" | "createdAt" | "updatedAt">) => {
        if (!editingSheet) return;
        const targetOrgId = editingSheet.orgId || currentTeam?.id || data.orgId || currentUser?.orgIds?.[0] || (orgId !== "default_org" ? orgId : "");
        try {
            await updateJobSheet(targetOrgId, editingSheet.id, {
                ...data,
                orgId: targetOrgId
            });
            const updated: JobSheet = {
                ...editingSheet,
                ...data,
                orgId: targetOrgId,
                updatedAt: new Date().toISOString()
            };
            setJobsheets(prev => prev.map(s => s.id === editingSheet.id ? updated : s));
            setEditingSheet(null);
            setActiveTab("list");
            toast.success("อัปเดต JobSheet เรียบร้อยแล้ว");
        } catch (err: any) {
            console.error("Update error:", err);
            toast.error("อัปเดตไม่สำเร็จ: " + (err?.message || "กรุณาลองใหม่อีกครั้ง"));
        }
    };

    const handleDelete = async () => {
        if (!deletingSheetId) return;
        const targetOrgId = orgId || "default_org";
        try {
            await deleteJobSheet(targetOrgId, deletingSheetId);
            setJobsheets(prev => prev.filter(s => s.id !== deletingSheetId));
            toast.success("ลบรายงานเรียบร้อยแล้ว");
        } catch {
            toast.error("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setDeletingSheetId(null);
        }
    };

    const openPreview = (sheet: JobSheet) => {
        setPreviewSheet(sheet);
        setIsPreviewOpen(true);
    };

    const startEdit = (sheet: JobSheet) => {
        setEditingSheet(sheet);
        setActiveTab("edit");
    };

    const handleOpenWeeklySummary = (week: WeekGroupData) => {
        setSelectedWeekForSummary(week);
        setIsWeeklySummaryOpen(true);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl animate-in fade-in duration-500 pb-32 md:pb-12">
            {/* Header Banner (Shown only in List view for focused writing/editing) */}
            {activeTab === "list" && (
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                                <FileText className="w-3.5 h-3.5" />
                                Daily Construction Log & Sheet
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                                JobSheet <span className="text-amber-400 font-mono">/</span> Daily Report
                            </h1>
                            <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
                                ระบบบันทึกงานประจำวันหน้างาน รายการงานที่ทำ สภาพอากาศ กำลังพล และดาวน์โหลดเป็น A4 JobSheet ในรูปแบบ PDF หรือภาพความละเอียดสูง (PNG) ส่งเข้า LINE หรือลูกค้าง่ายๆ
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button
                                onClick={() => {
                                    setEditingSheet(null);
                                    setActiveTab("create");
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/25 px-5 h-11 rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
                                เขียน JobSheet วันนี้
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
                        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4">
                            <span className="text-xs text-white/50 block mb-1">รายงานทั้งหมดในระบบ</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-white font-mono">{totalReports}</span>
                                <span className="text-xs text-amber-400/80">ฉบับ</span>
                            </div>
                        </div>

                        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4">
                            <span className="text-xs text-white/50 block mb-1">รายงานของฉัน</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-amber-400 font-mono">{myReportsCount}</span>
                                <span className="text-xs text-white/40">ฉบับ</span>
                            </div>
                        </div>

                        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4">
                            <span className="text-xs text-white/50 block mb-1">งานที่บันทึกสำเร็จ</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-emerald-400 font-mono">{totalTasksDone}</span>
                                <span className="text-xs text-white/40">รายการ</span>
                            </div>
                        </div>

                        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4">
                            <span className="text-xs text-white/50 block mb-1">โครงการล่าสุด</span>
                            <span className="text-sm font-bold text-white truncate block">
                                {latestSheet ? latestSheet.projectName : "ยังไม่มีข้อมูล"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Create / Edit Form */}
            {activeTab === "create" && (
                <div className="animate-in fade-in duration-300">
                    <JobSheetForm
                        onSave={handleSaveNew}
                        onPreview={openPreview}
                        onCancel={() => setActiveTab("list")}
                    />
                </div>
            )}

            {activeTab === "edit" && editingSheet && (
                <div className="animate-in fade-in duration-300">
                    <JobSheetForm
                        initialData={editingSheet}
                        onSave={handleSaveEdit}
                        onPreview={openPreview}
                        onCancel={() => {
                            setEditingSheet(null);
                            setActiveTab("list");
                        }}
                    />
                </div>
            )}

            {/* TAB: List & Archives */}
            {activeTab === "list" && (
                <div className="space-y-6">
                    {/* Filters & View Toolbar */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-zinc-900/40 border border-white/10 rounded-2xl p-4">
                        {/* Left Controls: Scope (Mine/All) + View Mode (Grouped/Cards) */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                            {/* Scope Toggle: Mine vs All */}
                            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setFilterScope("mine")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        filterScope === "mine"
                                            ? "bg-amber-500 text-black shadow-md"
                                            : "text-white/60 hover:text-white"
                                    }`}
                                >
                                    <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                                    รายงานของฉัน ({myReportsCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterScope("all")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        filterScope === "all"
                                            ? "bg-amber-500 text-black shadow-md"
                                            : "text-white/60 hover:text-white"
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5 inline mr-1" />
                                    ทุกคนในทีม ({totalReports})
                                </button>
                            </div>

                            {/* View Mode Toggle: Grouped by Month/Week vs Flat Cards */}
                            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grouped")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                        viewMode === "grouped"
                                            ? "bg-amber-500 text-black shadow-md font-bold"
                                            : "text-white/60 hover:text-white"
                                    }`}
                                    title="จัดเรียงแบ่งตามสัปดาห์และเดือน พร้อมออกเอกสารสรุป"
                                >
                                    <CalendarRange className="w-3.5 h-3.5" />
                                    <span>แบ่งตามสัปดาห์ / เดือน</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("cards")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                        viewMode === "cards"
                                            ? "bg-amber-500 text-black shadow-md font-bold"
                                            : "text-white/60 hover:text-white"
                                    }`}
                                    title="มุมมองการ์ดทั้งหมด"
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">การ์ดทั้งหมด</span>
                                </button>
                            </div>
                        </div>

                        {/* Right: Search and Dropdowns */}
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl justify-end">
                            {/* Search input */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    placeholder="ค้นหาชื่องาน, โครงการ, เลขที่..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-zinc-950 border-white/10 text-white text-xs h-9"
                                />
                            </div>

                            {/* Project Filter */}
                            <select
                                value={selectedProjectFilter}
                                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                                className="h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                            >
                                <option value="all">ทุกโครงการ & งานทั้งหมด</option>
                                <option value="general">📦 งานทั่วไป / นอกโครงการ</option>
                                <optgroup label="🏢 โครงการก่อสร้าง">
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            🏢 {p.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>

                            {/* Date Filter */}
                            <Input
                                type="date"
                                value={selectedDateFilter}
                                onChange={(e) => setSelectedDateFilter(e.target.value)}
                                className="w-auto h-9 bg-zinc-950 border-white/10 text-white text-xs"
                            />

                            {(searchQuery || selectedProjectFilter !== "all" || selectedDateFilter) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedProjectFilter("all");
                                        setSelectedDateFilter("");
                                    }}
                                    className="h-9 text-xs text-white/60 hover:text-white"
                                >
                                    ล้างตัวกรอง
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* JobSheets Content Area */}
                    {isLoading ? (
                        <div className="p-12 text-center text-white/40 text-sm">
                            กำลังโหลดรายการ JobSheet...
                        </div>
                    ) : filteredSheets.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
                                <FileText className="w-8 h-8 opacity-60" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-white">ยังไม่มีบันทึก JobSheet</h3>
                                <p className="text-xs text-white/50 max-w-sm mx-auto">
                                    {filterScope === "mine"
                                        ? "คุณยังไม่ได้เขียนรายงาน JobSheet ประจำวัน กดปุ่มด้านล่างเพื่อเริ่มสร้างฉบับแรกได้ทันที"
                                        : "ยังไม่มีใครสร้างรายงานในระบบสำหรับตัวกรองนี้"}
                                </p>
                            </div>
                            <Button
                                onClick={() => setActiveTab("create")}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                สร้าง JobSheet ใหม่
                            </Button>
                        </div>
                    ) : viewMode === "grouped" ? (
                        /* Grouped by Month and Week */
                        <div className="space-y-12">
                            {monthGroups.map((monthGroup) => (
                                <div key={monthGroup.monthKey} className="space-y-6">
                                    {/* Month Header Banner */}
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3 pt-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                                {monthGroup.monthLabel}
                                                <span className="text-xs font-mono font-medium text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                                                    {monthGroup.totalSheets} ฉบับ
                                                </span>
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Weeks in this Month */}
                                    <div className="space-y-8">
                                        {monthGroup.weeks.map((week) => (
                                            <div key={week.weekKey} className="space-y-4">
                                                {/* Week Divider & Action Bar */}
                                                <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950/80 border border-white/10 hover:border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl transition-all relative overflow-hidden group">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

                                                    <div className="flex flex-col gap-2 pl-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-black text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 font-mono">
                                                                {week.weekLabel}
                                                            </span>
                                                            {week.isCurrentWeek && (
                                                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30 animate-pulse">
                                                                    สัปดาห์นี้
                                                                </span>
                                                            )}
                                                            <span className="text-xs sm:text-sm font-bold text-white/80">
                                                                {week.dateRangeLabel}
                                                            </span>
                                                        </div>

                                                        {/* Mini Stats Badges */}
                                                        <div className="flex items-center gap-2 flex-wrap text-xs text-white/70">
                                                            <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-medium">
                                                                <FileText className="w-3.5 h-3.5 text-amber-400" />
                                                                <strong>{week.sheets.length}</strong> วันบันทึก
                                                            </span>
                                                            <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-medium">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                                <strong>{week.totalTasksDone}/{week.totalTasks}</strong> งานสำเร็จ
                                                            </span>
                                                            {week.totalManpower > 0 && (
                                                                <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-medium">
                                                                    <Users className="w-3.5 h-3.5 text-blue-400" />
                                                                    <strong>{week.totalManpower}</strong> คน-วัน
                                                                </span>
                                                            )}
                                                            {week.uniqueProjects.length > 0 && (
                                                                <span className="text-white/40 truncate max-w-[240px] sm:max-w-md text-[11px]">
                                                                    🏢 {week.uniqueProjects.join(" • ")}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Button: Export Weekly Summary */}
                                                    <div className="flex items-center gap-2 self-start md:self-auto pl-2 shrink-0">
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleOpenWeeklySummary(week)}
                                                            className="h-10 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold px-4 sm:px-5 rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer"
                                                        >
                                                            <FileText className="w-4 h-4 mr-2 stroke-[2.5]" />
                                                            ออกเอกสารสรุปสัปดาห์
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Cards in this Week */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {week.sheets.map((sheet) => {
                                                        const totalWorkers = sheet.manpower?.reduce((acc, c) => acc + (Number(c.count) || 0), 0) || 0;
                                                        const completedCount = sheet.workItems?.filter((w) => w.status === "completed").length || 0;
                                                        const isMySheet = sheet.createdBy === currentUserId;

                                                        return (
                                                            <div
                                                                key={sheet.id}
                                                                className="bg-zinc-900/60 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 group shadow-lg hover:shadow-amber-500/5 relative overflow-hidden"
                                                            >
                                                                <div className="space-y-3">
                                                                    {/* Top Tag Row */}
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                                            {sheet.reportNumber}
                                                                        </span>
                                                                        <span className="text-[11px] text-white/50 flex items-center gap-1 font-mono">
                                                                            <Calendar className="w-3 h-3 text-white/40" />
                                                                            {sheet.date}
                                                                        </span>
                                                                    </div>

                                                                    {/* Title & Project */}
                                                                    <div>
                                                                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                                            {sheet.isMultiProject && (
                                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                                                                    🗂️ หลายโครงการ & งานทั่วไป
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors line-clamp-1">
                                                                            {sheet.title}
                                                                        </h3>
                                                                        <p className="text-xs text-white/60 flex items-center gap-1.5 mt-0.5 truncate">
                                                                            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                            <span className="truncate">{sheet.projectName}</span>
                                                                            {sheet.subProjectName && (
                                                                                <span className="text-white/40 truncate">({sheet.subProjectName})</span>
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                    {/* Weather & Worker Badges */}
                                                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-white/70 border border-white/5">
                                                                            <CloudSun className="w-3 h-3 text-amber-400" />
                                                                            {sheet.weather?.condition ? sheet.weather.condition.split("(")[0].trim() : "แจ่มใส"}
                                                                            {sheet.weather?.temperature ? ` ${sheet.weather.temperature}°C` : ""}
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-white/70 border border-white/5">
                                                                            <Users className="w-3 h-3 text-blue-400" />
                                                                            {totalWorkers} คน
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                            เสร็จ {completedCount}/{sheet.workItems?.length || 0}
                                                                        </span>
                                                                    </div>

                                                                    {/* Work items snippet */}
                                                                    {sheet.workItems && sheet.workItems.length > 0 && (
                                                                        <div className="bg-zinc-950/60 rounded-xl p-2.5 text-xs text-white/70 space-y-1">
                                                                            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">
                                                                                รายการงานเด่น:
                                                                            </span>
                                                                            {sheet.workItems.slice(0, 2).map((item, idx) => (
                                                                                <div key={idx} className="flex items-center justify-between text-[11px] truncate">
                                                                                    <span className="truncate">
                                                                                        {item.projectName ? (
                                                                                            <strong className="text-amber-400/90 font-normal mr-1">
                                                                                                [{item.projectName}]
                                                                                            </strong>
                                                                                        ) : null}
                                                                                        {item.task}
                                                                                    </span>
                                                                                    <span className="text-white/40 shrink-0 text-[10px] ml-2 font-mono">
                                                                                        {item.quantity}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                            {sheet.workItems.length > 2 && (
                                                                                <span className="text-[10px] text-amber-400/80 block mt-0.5">
                                                                                    + อีก {sheet.workItems.length - 2} รายการ
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Reporter footer */}
                                                                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                                                                        <span>ผู้บันทึก: <strong className="text-white/70">{sheet.reportedBy || sheet.createdByName}</strong></span>
                                                                        {isMySheet && (
                                                                            <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-white/60">
                                                                                ของฉัน
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Actions Toolbar */}
                                                                <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-white/10">
                                                                    <div className="flex items-center gap-1">
                                                                        {isMySheet && (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => startEdit(sheet)}
                                                                                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                                                                    title="แก้ไขรายงาน"
                                                                                >
                                                                                    <Edit3 className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setDeletingSheetId(sheet.id)}
                                                                                    className="p-1.5 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                                                    title="ลบรายงาน"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-1.5">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => openPreview(sheet)}
                                                                            className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg shadow-sm"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                                                            เปิด Sheet / โหลด
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Flat Cards Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSheets.map((sheet) => {
                                const totalWorkers = sheet.manpower?.reduce((acc, c) => acc + (Number(c.count) || 0), 0) || 0;
                                const completedCount = sheet.workItems?.filter((w) => w.status === "completed").length || 0;
                                const isMySheet = sheet.createdBy === currentUserId;

                                return (
                                    <div
                                        key={sheet.id}
                                        className="bg-zinc-900/60 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 group shadow-lg hover:shadow-amber-500/5 relative overflow-hidden"
                                    >
                                        <div className="space-y-3">
                                            {/* Top Tag Row */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                    {sheet.reportNumber}
                                                </span>
                                                <span className="text-[11px] text-white/50 flex items-center gap-1 font-mono">
                                                    <Calendar className="w-3 h-3 text-white/40" />
                                                    {sheet.date}
                                                </span>
                                            </div>

                                            {/* Title & Project */}
                                            <div>
                                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                    {sheet.isMultiProject && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                                            🗂️ หลายโครงการ & งานทั่วไป
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors line-clamp-1">
                                                    {sheet.title}
                                                </h3>
                                                <p className="text-xs text-white/60 flex items-center gap-1.5 mt-0.5 truncate">
                                                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span className="truncate">{sheet.projectName}</span>
                                                    {sheet.subProjectName && (
                                                        <span className="text-white/40 truncate">({sheet.subProjectName})</span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Weather & Worker Badges */}
                                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-white/70 border border-white/5">
                                                    <CloudSun className="w-3 h-3 text-amber-400" />
                                                    {sheet.weather?.condition ? sheet.weather.condition.split("(")[0].trim() : "แจ่มใส"}
                                                    {sheet.weather?.temperature ? ` ${sheet.weather.temperature}°C` : ""}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-white/70 border border-white/5">
                                                    <Users className="w-3 h-3 text-blue-400" />
                                                    {totalWorkers} คน
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    เสร็จ {completedCount}/{sheet.workItems?.length || 0}
                                                </span>
                                            </div>

                                            {/* Work items snippet */}
                                            {sheet.workItems && sheet.workItems.length > 0 && (
                                                <div className="bg-zinc-950/60 rounded-xl p-2.5 text-xs text-white/70 space-y-1">
                                                    <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">
                                                        รายการงานเด่น:
                                                    </span>
                                                    {sheet.workItems.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-[11px] truncate">
                                                            <span className="truncate">
                                                                {item.projectName ? (
                                                                    <strong className="text-amber-400/90 font-normal mr-1">
                                                                        [{item.projectName}]
                                                                    </strong>
                                                                ) : null}
                                                                {item.task}
                                                            </span>
                                                            <span className="text-white/40 shrink-0 text-[10px] ml-2 font-mono">
                                                                {item.quantity}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {sheet.workItems.length > 2 && (
                                                        <span className="text-[10px] text-amber-400/80 block mt-0.5">
                                                            + อีก {sheet.workItems.length - 2} รายการ
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reporter footer */}
                                            <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                                                <span>ผู้บันทึก: <strong className="text-white/70">{sheet.reportedBy || sheet.createdByName}</strong></span>
                                                {isMySheet && (
                                                    <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-white/60">
                                                        ของฉัน
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Toolbar */}
                                        <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-white/10">
                                            <div className="flex items-center gap-1">
                                                {isMySheet && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(sheet)}
                                                            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                                            title="แก้ไขรายงาน"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingSheetId(sheet.id)}
                                                            className="p-1.5 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                            title="ลบรายงาน"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    size="sm"
                                                    onClick={() => openPreview(sheet)}
                                                    className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg shadow-sm"
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    เปิด Sheet / โหลด
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Document Preview & Export Modal */}
            <JobSheetPreviewModal
                jobsheet={previewSheet}
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                onEdit={(sheet) => {
                    startEdit(sheet);
                }}
            />

            {/* Weekly Summary Modal */}
            <WeeklyJobSheetSummaryModal
                weekData={selectedWeekForSummary}
                open={isWeeklySummaryOpen}
                onOpenChange={setIsWeeklySummaryOpen}
            />

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={Boolean(deletingSheetId)}
                onClose={() => setDeletingSheetId(null)}
                title="ยืนยันการลบ JobSheet"
                message="คุณแน่ใจหรือไม่ว่าต้องการลบรายงาน JobSheet ฉบับนี้? การลบนี้ไม่สามารถย้อนกลับได้"
                confirmText="ลบรายงาน"
                cancelText="ยกเลิก"
                variant="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
}
