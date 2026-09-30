"use client";

import React, { useState, useEffect } from "react";
import { JobSheet, JobSheetWorkItem, JobSheetManpower, JobSheetWeather } from "@/types/jobsheet";
import { useProjects } from "@/context/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Plus, 
    Trash2, 
    Sun, 
    CloudSun, 
    CloudRain, 
    CloudLightning, 
    CloudFog, 
    Sparkles, 
    Save, 
    Eye, 
    Users, 
    HardHat, 
    Wrench, 
    CheckCircle2, 
    Upload, 
    X,
    Calendar,
    Building2,
    Shield,
    Clock,
    ChevronDown,
    ChevronUp,
    Briefcase,
    Package,
    Truck,
    Factory,
    Check,
    AlertTriangle,
    Layers
} from "lucide-react";
import { toast } from "sonner";

interface JobSheetFormProps {
    initialData?: JobSheet | null;
    onSave: (data: Omit<JobSheet, "id" | "createdAt" | "updatedAt">) => Promise<void>;
    onPreview: (data: JobSheet) => void;
    onCancel?: () => void;
}

const DEFAULT_MANPOWER_ROLES = [
    "หัวหน้างาน / โฟร์แมน",
    "ช่างปูน / งานคอนกรีต",
    "ช่างเหล็ก / ช่างเชื่อม",
    "ช่างไม้ / งานแบบหล่อ",
    "ช่างไฟฟ้า / งานระบบ",
    "ช่างประปา / สุขาภิบาล",
    "ช่างสี / งานตกแต่ง",
    "คนงานทั่วไป / กรรมกร"
];

const QUICK_TASK_PRESETS = [
    { 
        label: "เข้าตรวจหน้างาน", 
        task: "เข้าตรวจหน้างานและประสานช่าง\n- เคลียร์เรื่องระดับและการปรับพื้น แต่ละชั้น\n- เคลียร์แนววางท่อและงานระบบไฟกับช่าง", 
        category: "", 
        time: "09:00 - 12:00" 
    },
    { 
        label: "ตรวจงานกระเบื้อง/หน้าจั่ว", 
        task: "ตรวจงานสถาปัตย์และงานเก็บรอยต่อ\n- ช่วยดูเรื่องการจบงานกระเบื้องและงานหน้าจั่ว\n- กำชับช่างเก็บงานตามมาตรฐาน", 
        category: "", 
        time: "09:00 - 12:00" 
    },
    { 
        label: "เทคอนกรีต เสา/คาน", 
        task: "งานเทคอนกรีตเสาและคาน\n- ตรวจเช็คเหล็กเสริมและระยะลูกปูน\n- ควบคุมการเทและจี้คอนกรีตตามมาตรฐาน", 
        category: "", 
        time: "09:00 - 12:00" 
    },
    { 
        label: "ตรวจงานก่ออิฐ/เสาเอ็น", 
        task: "ตรวจงานก่ออิฐและโครงสร้างย่อย\n- เช็คจุดทำทับหลังและเสริมเสาเอ็นเพิ่ม\n- เตรียมบล็อคช่องลมเข้าหน้างาน", 
        category: "", 
        time: "09:00 - 17:00" 
    },
    { 
        label: "โทรเคลียร์งานช่าง", 
        task: "โทรประสานงานช่างและซัพพลายเออร์\n- โทรเคลียร์เรื่องงานไฟและระบบหน้างาน\n- นัดหมายทีมช่างเข้าพื้นที่", 
        category: "งานทั่วไป / ธุรการ", 
        time: "13:00 - 16:30" 
    },
    { 
        label: "ปรับปรุงแอพ/เคลียร์เบิกจ่าย", 
        task: "งานจัดการระบบและบัญชีเบิกจ่าย\n- แก้ไขและตรวจสอบรายรับ-รายจ่ายให้เห็นต้นทุนชัดเจน\n- สรุปตัวเลขยอดเบิกจ่ายงวดงาน", 
        category: "งานทั่วไป / ธุรการ", 
        time: "13:00 - 16:30" 
    },
    { 
        label: "จัดซื้อ/รับส่งวัสดุ", 
        task: "จัดซื้อและประสานส่งของเข้าไซต์งาน\n- สั่งซื้อวัสดุก่อสร้างและอุปกรณ์\n- ตรวจรับของหน้างาน", 
        category: "จัดซื้อ / จัดส่งวัสดุ", 
        time: "09:00 - 17:00" 
    }
];

export function JobSheetForm({
    initialData,
    onSave,
    onPreview,
    onCancel
}: JobSheetFormProps) {
    const { projects, currentUser, companyProfile, currentTeam } = useProjects();
    const [isSaving, setIsSaving] = useState(false);

    // Accordion toggles for mobile compactness
    const [openManpower, setOpenManpower] = useState(false);
    const [openEquipment, setOpenEquipment] = useState(false);
    const [openSafety, setOpenSafety] = useState(false);
    const [openPhotos, setOpenPhotos] = useState(false);

    // Form states
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split("T")[0]);
    const [reportNumber, setReportNumber] = useState(
        initialData?.reportNumber || `JS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-01`
    );
    const [title, setTitle] = useState(initialData?.title || "บันทึกการทำงานประจำวัน");
    const [selectedProjectId, setSelectedProjectId] = useState(
        initialData?.isMultiProject ? "multi" : initialData?.projectId || (projects.length > 0 ? "multi" : "general")
    );
    const [projectName, setProjectName] = useState(
        initialData?.projectName || "ปฏิบัติงานหลายโครงการ & งานทั่วไป"
    );
    const [subProjectName, setSubProjectName] = useState(initialData?.subProjectName || "");

    // Weather
    const [weatherCondition, setWeatherCondition] = useState(
        initialData?.weather?.condition || "ท้องฟ้าแจ่มใส (Clear Sky)"
    );
    const [temperature, setTemperature] = useState<number | undefined>(
        initialData?.weather?.temperature ?? 30
    );

    // Work Items (Task-centric list)
    const [workItems, setWorkItems] = useState<JobSheetWorkItem[]>(
        initialData?.workItems && initialData.workItems.length > 0
            ? initialData.workItems
            : [
                  {
                      id: "1",
                      task: "งานเทคอนกรีตเสาและคาน",
                      projectId: projects[0]?.id || "",
                      projectName: projects[0]?.name || "โครงการหลัก",
                      timeSlot: "ช่วงเช้า (08:30 - 12:00)",
                      quantity: "15 ตร.ม.",
                      location: "ชั้น 2 โซน A",
                      status: "completed",
                      notes: "เทปูนเรียบร้อย บ่มคอนกรีตตามมาตรฐาน"
                  }
              ]
    );

    // Manpower (Default count 0 to not clutter)
    const [manpower, setManpower] = useState<JobSheetManpower[]>(
        initialData?.manpower && initialData.manpower.length > 0
            ? initialData.manpower
            : DEFAULT_MANPOWER_ROLES.map((role, idx) => ({
                  id: String(idx + 1),
                  role,
                  count: 0
              }))
    );

    // Other details - clean defaults without fake filler text
    const [equipment, setEquipment] = useState(initialData?.equipment || "");
    const [materialsReceived, setMaterialsReceived] = useState(initialData?.materialsReceived || "");
    const [obstacles, setObstacles] = useState(initialData?.obstacles || "");
    const [safetyNotes, setSafetyNotes] = useState(initialData?.safetyNotes || "");
    const [reportedBy, setReportedBy] = useState(
        initialData?.reportedBy || currentUser?.name || "เบียร์"
    );
    const [reportedByRole, setReportedByRole] = useState(
        initialData?.reportedByRole || currentUser?.role || "ผู้ดูแลหน้างาน"
    );
    const [inspectedBy, setInspectedBy] = useState(initialData?.inspectedBy || "");
    const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);

    // When project mode changes
    useEffect(() => {
        if (selectedProjectId === "multi") {
            setProjectName("ปฏิบัติงานหลายโครงการ & งานทั่วไป");
        } else if (selectedProjectId === "general") {
            setProjectName("งานทั่วไป / ธุรการ / ไม่ระบุโครงการ");
        } else if (selectedProjectId) {
            const found = projects.find((p) => p.id === selectedProjectId);
            if (found) {
                setProjectName(found.name);
            }
        }
    }, [selectedProjectId, projects]);

    // Work item handlers
    const addWorkItem = (presetTask?: string, presetCategory?: string, presetTime?: string) => {
        let initialProjId = selectedProjectId && selectedProjectId !== "multi" && selectedProjectId !== "general" ? selectedProjectId : "";
        let initialProjName = "";

        if (presetCategory) {
            initialProjName = presetCategory;
            initialProjId = "";
        } else if (selectedProjectId === "general") {
            initialProjName = "งานทั่วไป / ธุรการ";
        } else if (initialProjId) {
            const f = projects.find((p) => p.id === initialProjId);
            if (f) initialProjName = f.name;
        } else if (projects.length > 0) {
            initialProjId = projects[0].id;
            initialProjName = projects[0].name;
        }

        const newItem: JobSheetWorkItem = {
            id: String(Date.now() + Math.random()),
            task: presetTask || "",
            projectId: initialProjId,
            projectName: initialProjName,
            timeSlot: presetTime || (workItems.length === 0 ? "ช่วงเช้า" : workItems.length === 1 ? "ช่วงบ่าย" : "ช่วงเย็น"),
            quantity: "",
            location: "",
            status: "in_progress",
            notes: ""
        };
        setWorkItems([...workItems, newItem]);
    };

    const updateWorkItem = (id: string, field: keyof JobSheetWorkItem, value: any) => {
        setWorkItems(
            workItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const removeWorkItem = (id: string) => {
        if (workItems.length <= 1) {
            toast.error("ควรมีรายการงานอย่างน้อย 1 รายการ");
            return;
        }
        setWorkItems(workItems.filter((item) => item.id !== id));
    };

    // Manpower count change
    const updateManpowerCount = (id: string, delta: number) => {
        setManpower(
            manpower.map((mp) => {
                if (mp.id === id) {
                    const next = Math.max(0, mp.count + delta);
                    return { ...mp, count: next };
                }
                return mp;
            })
        );
    };

    // Add photo
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/")) {
                toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setPhotos((prev) => [...prev, event.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    // Auto-fetch live weather
    const handleAutoFetchWeather = async () => {
        try {
            const toastId = toast.loading("กำลังดึงสภาพอากาศจริง...");
            const res = await fetch(
                "https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current=temperature_2m,weather_code&timezone=Asia%2FBangkok"
            );
            if (!res.ok) throw new Error("Fetch failed");
            const data = await res.json();
            const temp = Math.round(data?.current?.temperature_2m || 30);
            const code = data?.current?.weather_code || 0;

            let condition = "ท้องฟ้าแจ่มใส (Clear Sky)";
            if (code >= 1 && code <= 3) condition = "มีเมฆบางส่วน / ครึ้มฟ้าครึ้มฝน (Cloudy)";
            else if (code === 45 || code === 48) condition = "มีหมอกลง (Foggy)";
            else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) condition = "มีฝนตก (Rain Showers)";
            else if (code >= 95) condition = "พายุฝนฟ้าคะนอง (Thunderstorm)";

            setTemperature(temp);
            setWeatherCondition(condition);
            toast.success(`อัปเดตสภาพอากาศแล้ว: ${condition} ${temp}°C`, { id: toastId });
        } catch {
            toast.error("ไม่สามารถเชื่อมต่อสภาพอากาศได้");
        }
    };

    // Construct sheet object
    const getPayload = () => {
        // Collect all unique projectIds involved
        const involvedProjectIds = Array.from(
            new Set(
                [
                    selectedProjectId && selectedProjectId !== "multi" && selectedProjectId !== "general" ? selectedProjectId : null,
                    ...workItems.map((w) => w.projectId).filter(Boolean)
                ].filter(Boolean)
            )
        ) as string[];

        // Build composite projectName
        let displayProjectName = projectName;
        if (!displayProjectName || selectedProjectId === "multi") {
            const projectNames = Array.from(
                new Set(
                    workItems
                        .map((w) => w.projectName || (w.projectId ? projects.find((p) => p.id === w.projectId)?.name : ""))
                        .filter(Boolean)
                )
            );
            if (projectNames.length > 0) {
                displayProjectName = projectNames.join(" • ");
            } else {
                displayProjectName = "ปฏิบัติงานหลายโครงการ & งานทั่วไป";
            }
        }

        return {
            reportNumber,
            title,
            date,
            projectId: selectedProjectId === "multi" || selectedProjectId === "general" ? "" : selectedProjectId,
            projectName: displayProjectName || "ปฏิบัติงานหลายโครงการ & งานทั่วไป",
            projectIds: involvedProjectIds,
            isMultiProject: involvedProjectIds.length > 1 || selectedProjectId === "multi" || workItems.some((w) => !w.projectId || w.projectName?.includes("ทั่วไป")),
            subProjectId: "",
            subProjectName,
            orgId: "", // Will be assigned by service/context
            companyName: initialData?.companyName || companyProfile?.name || currentTeam?.name || "บริษัทของคุณ",
            companyLogo: initialData?.companyLogo || companyProfile?.logo || "",
            createdBy: currentUser?.id || "",
            createdByName: currentUser?.name || reportedBy,
            createdByRole: currentUser?.role || reportedByRole,
            weather: {
                condition: weatherCondition,
                temperature: Number(temperature) || 30
            },
            workItems,
            manpower: manpower.filter((m) => m.count > 0),
            equipment,
            materialsReceived,
            obstacles,
            safetyNotes,
            generalNotes: "",
            photos,
            reportedBy: reportedBy || currentUser?.name || "เบียร์",
            reportedByRole: reportedByRole || "ผู้ดูแลหน้างาน",
            inspectedBy
        };
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (workItems.length === 0) {
            toast.error("กรุณาระบุอย่างน้อย 1 รายการงาน");
            return;
        }

        setIsSaving(true);
        try {
            await onSave(getPayload());
            toast.success("บันทึก JobSheet ลงระบบเรียบร้อยแล้ว");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTriggerPreview = () => {
        const fullSheet: JobSheet = {
            ...getPayload(),
            id: initialData?.id || "preview",
            createdAt: initialData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        onPreview(fullSheet);
    };

    const totalManpower = manpower.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

    return (
        <form onSubmit={handleFormSubmit} className="space-y-5 max-w-5xl mx-auto pb-24 sm:pb-12">
            {/* Desktop Top Toolbar */}
            <div className="hidden sm:flex items-center justify-between gap-3 bg-zinc-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md sticky top-16 z-20 shadow-xl">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-amber-400" />
                        {initialData ? "แก้ไขรายงาน JobSheet" : "เขียน JobSheet ประจำวัน"}
                    </h2>
                    <p className="text-xs text-white/50">
                        เน้นบันทึกเป็นงานๆ ประจำวัน รองรับหลายโปรเจคและงานทั่วไปใน 1 วัน
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onCancel}
                            className="border-white/10 text-white/70 hover:bg-white/5"
                        >
                            ยกเลิก
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTriggerPreview}
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    >
                        <Eye className="w-4 h-4 mr-1.5" />
                        ดูตัวอย่าง Sheet / พิมพ์
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20 px-5"
                    >
                        <Save className="w-4 h-4 mr-1.5" />
                        {isSaving ? "กำลังบันทึก..." : "บันทึก JobSheet"}
                    </Button>
                </div>
            </div>

            {/* Mobile Header Banner */}
            <div className="sm:hidden flex items-center justify-between gap-2 px-1">
                <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                        <HardHat className="w-4 h-4 text-amber-400" />
                        {initialData ? "แก้ไข JobSheet" : "เขียน JobSheet วันนี้"}
                    </h2>
                    <span className="text-[11px] text-white/50 font-mono">
                        {date} • {workItems.length} งาน
                    </span>
                </div>
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="text-white/60 text-xs h-8 px-2"
                    >
                        ยกเลิก
                    </Button>
                )}
            </div>

            {/* COMPACT TOP BAR: Date, Report No & Weather Summary */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-md space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                    {/* Date Picker */}
                    <div className="sm:col-span-4 flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-white/10">
                        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="flex-1">
                            <span className="text-[10px] text-white/40 block leading-none mb-1 font-medium">วันที่บันทึกงาน</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent text-white text-xs font-semibold focus:outline-none w-full"
                                required
                            />
                        </div>
                    </div>

                    {/* Mode / Overall Scope */}
                    <div className="sm:col-span-5 flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-white/10">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-white/40 block leading-none mb-1 font-medium">รูปแบบการทำงานวันนี้</span>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedProjectId(val);
                                    if (val === "multi") {
                                        setProjectName("ปฏิบัติงานหลายโครงการ & งานทั่วไป");
                                    } else if (val === "general") {
                                        setProjectName("งานทั่วไป / ธุรการ / ไม่ระบุโครงการ");
                                    } else {
                                        const found = projects.find((p) => p.id === val);
                                        if (found) setProjectName(found.name);
                                    }
                                }}
                                className="bg-transparent text-white text-xs font-semibold focus:outline-none w-full truncate"
                            >
                                <option value="multi">🗂️ ปฏิบัติงานหลายโครงการ / ทั่วไป</option>
                                <option value="general">📦 งานทั่วไป / ธุรการ / นอกโครงการ</option>
                                <optgroup label="🏢 โครงการเฉพาะในระบบ">
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            🏢 {p.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    {/* Weather Quick Capsule */}
                    <div className="sm:col-span-3 flex items-center justify-between gap-1.5 bg-zinc-950 px-3 py-2 rounded-xl border border-white/10">
                        <div className="flex items-center gap-1.5 truncate">
                            <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-xs text-white/80 font-medium truncate">
                                {weatherCondition.split(" ")[0]}
                            </span>
                            <span className="text-xs font-bold text-amber-400 font-mono">
                                {temperature}°C
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleAutoFetchWeather}
                            title="ดึงสภาพอากาศจริง"
                            className="p-1 rounded-md text-amber-400 hover:bg-white/10 transition-colors"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN SECTION: THE DAILY JOBS LIST (TASK-CENTRIC) */}
            <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                งานที่ปฏิบัติในวันนี้
                                <span className="text-xs font-mono font-bold text-black bg-amber-400 px-2 py-0.5 rounded-full">
                                    {workItems.length} งาน
                                </span>
                            </h3>
                            <p className="text-[11px] text-white/50 hidden sm:block">
                                แยกบันทึกทีละงานได้อิสระ แต่ละงานเลือกโครงการหรือเป็นงานทั่วไปได้
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={() => addWorkItem()}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8 sm:h-9 rounded-xl shadow-md shadow-amber-500/10"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                        เพิ่มงานใหม่
                    </Button>
                </div>

                {/* Horizontal Quick Task Presets (Swipeable on Mobile) */}
                <div className="overflow-x-auto pb-1.5 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
                    <div className="flex items-center gap-1.5 min-w-max">
                        <span className="text-[11px] text-white/40 font-medium mr-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" /> แม่แบบด่วน:
                        </span>
                        {QUICK_TASK_PRESETS.map((preset, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => addWorkItem(preset.task, preset.category, preset.time)}
                                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-white/70 transition-all active:scale-95 whitespace-nowrap shadow-sm"
                            >
                                + {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* THE TASK CARDS LIST (Mobile-First Layout) */}
                <div className="space-y-3">
                    {workItems.map((item, index) => {
                        const isGeneral = !item.projectId || item.projectName?.includes("ทั่วไป") || item.projectName?.includes("จัดซื้อ") || item.projectName?.includes("โรงงาน");

                        return (
                            <div
                                key={item.id}
                                className="bg-zinc-900/80 border border-white/10 hover:border-amber-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3 transition-all shadow-lg relative group"
                            >
                                {/* CARD TOP ROW: Job Number + Project Selector + Time + Trash */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 shrink-0">
                                            งานที่ #{index + 1}
                                        </span>

                                        {/* Project / Category Selector Pill */}
                                        <div className="relative flex-1 max-w-xs">
                                            <select
                                                value={
                                                    item.projectId ||
                                                    (item.projectName?.includes("จัดซื้อ")
                                                        ? "procurement"
                                                        : item.projectName?.includes("โรงงาน")
                                                        ? "workshop"
                                                        : item.projectName?.includes("ทั่วไป")
                                                        ? "general"
                                                        : "")
                                                }
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "general") {
                                                        updateWorkItem(item.id, "projectId", "");
                                                        updateWorkItem(item.id, "projectName", "งานทั่วไป / ธุรการ");
                                                    } else if (val === "procurement") {
                                                        updateWorkItem(item.id, "projectId", "");
                                                        updateWorkItem(item.id, "projectName", "จัดซื้อ / จัดส่งวัสดุ");
                                                    } else if (val === "workshop") {
                                                        updateWorkItem(item.id, "projectId", "");
                                                        updateWorkItem(item.id, "projectName", "โรงงาน / โกดัง / ซ่อมบำรุง");
                                                    } else if (val === "") {
                                                        updateWorkItem(item.id, "projectId", "");
                                                        updateWorkItem(item.id, "projectName", projectName || "งานทั่วไป");
                                                    } else {
                                                        const found = projects.find((p) => p.id === val);
                                                        updateWorkItem(item.id, "projectId", val);
                                                        updateWorkItem(item.id, "projectName", found ? found.name : "");
                                                    }
                                                }}
                                                className={`w-full text-xs font-bold px-2.5 py-1 rounded-lg border appearance-none pr-6 focus:outline-none transition-all truncate ${
                                                    isGeneral
                                                        ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                                                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                                }`}
                                            >
                                                <option value="">-- โครงการหลัก / ตามฟอร์ม --</option>
                                                <optgroup label="🏢 โครงการก่อสร้าง">
                                                    {projects.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            🏢 {p.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="📦 งานทั่วไป / ไม่ระบุโครงการ">
                                                    <option value="general">📦 งานทั่วไป / ธุรการ / ออฟฟิศ</option>
                                                    <option value="procurement">🚚 จัดซื้อ / จัดส่งวัสดุ</option>
                                                    <option value="workshop">🏭 โรงงาน / โกดัง / ซ่อมบำรุง</option>
                                                </optgroup>
                                            </select>
                                            <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Time Slot & Delete */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                placeholder="เช่น 9:00-12:00"
                                                value={item.timeSlot || ""}
                                                onChange={(e) => updateWorkItem(item.id, "timeSlot", e.target.value)}
                                                className="w-24 sm:w-28 bg-black/40 border border-white/10 text-[11px] text-white/90 rounded-lg px-2 py-1 placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                                            />
                                            <div className="relative">
                                                <select
                                                    value=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            updateWorkItem(item.id, "timeSlot", e.target.value);
                                                        }
                                                    }}
                                                    className="bg-zinc-800 text-white/60 text-[10px] rounded px-1.5 py-1 appearance-none focus:outline-none cursor-pointer border border-white/10"
                                                    title="เลือกช่วงเวลาด่วน"
                                                >
                                                    <option value="">▼</option>
                                                    <option value="09:00 - 12:00">09:00 - 12:00</option>
                                                    <option value="13:00 - 16:30">13:00 - 16:30</option>
                                                    <option value="09:00 - 17:00">09:00 - 17:00</option>
                                                    <option value="ช่วงเช้า">🌅 เช้า</option>
                                                    <option value="ช่วงบ่าย">☀️ บ่าย</option>
                                                    <option value="ช่วงเย็น">🌆 เย็น</option>
                                                    <option value="ล่วงเวลา (OT)">🌙 OT</option>
                                                    <option value="ทั้งวัน">⏱️ ทั้งวัน</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeWorkItem(item.id)}
                                            className="w-7 h-7 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                                            title="ลบงานนี้"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* TASK TITLE & DETAILS (Supports Multi-line / Sub-bullets) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                                            รายละเอียดงานที่ปฏิบัติ *
                                        </label>
                                        <span className="text-[10px] text-white/40 hidden sm:inline">
                                            ขึ้นบรรทัดใหม่หรือใส่ - เพื่อทำข้อย่อยได้
                                        </span>
                                    </div>
                                    <textarea
                                        rows={2}
                                        placeholder={`ระบุรายละเอียดงาน เช่น:\nเข้าหน้างานตึก\n- เคลียร์เรื่องการปรับพื้น แต่ละชั้น\n- เคลียร์แนววางไฟกับช่าง`}
                                        value={item.task}
                                        onChange={(e) => updateWorkItem(item.id, "task", e.target.value)}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-white text-xs sm:text-sm font-medium placeholder:text-white/20 focus:border-amber-500/60 focus:outline-none transition-all resize-y min-h-[58px]"
                                        required
                                    />
                                </div>

                                {/* LOCATION & QUANTITY (2-Column Grid on Mobile) */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/40 block mb-1 font-medium">พื้นที่ / โซน</label>
                                        <Input
                                            placeholder="เช่น ชั้น 2, ออฟฟิศ"
                                            value={item.location}
                                            onChange={(e) => updateWorkItem(item.id, "location", e.target.value)}
                                            className="bg-zinc-950 border-white/10 text-white text-xs h-9 placeholder:text-white/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/40 block mb-1 font-medium">ปริมาณงาน / เวลา</label>
                                        <Input
                                            placeholder="เช่น 15 ตร.ม., 3 ชม."
                                            value={item.quantity}
                                            onChange={(e) => updateWorkItem(item.id, "quantity", e.target.value)}
                                            className="bg-zinc-950 border-white/10 text-white text-xs h-9 placeholder:text-white/30"
                                        />
                                    </div>
                                </div>

                                {/* STATUS (4 Tap Buttons on Mobile - No Clunky Select!) */}
                                <div>
                                    <label className="text-[10px] text-white/40 block mb-1 font-medium">สถานะของงานนี้</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                        {[
                                            { key: "completed", label: "เสร็จสิ้น", icon: Check, activeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" },
                                            { key: "in_progress", label: "กำลังดำเนินการ", icon: Clock, activeClass: "bg-blue-500/20 text-blue-300 border-blue-500/50" },
                                            { key: "pending", label: "รอดำเนินการ", icon: Clock, activeClass: "bg-amber-500/20 text-amber-300 border-amber-500/50" },
                                            { key: "delayed", label: "ติดปัญหา/ล่าช้า", icon: AlertTriangle, activeClass: "bg-rose-500/20 text-rose-300 border-rose-500/50" }
                                        ].map((st) => {
                                            const isActive = item.status === st.key;
                                            return (
                                                <button
                                                    key={st.key}
                                                    type="button"
                                                    onClick={() => updateWorkItem(item.id, "status", st.key)}
                                                    className={`h-8 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 border transition-all ${
                                                        isActive
                                                            ? st.activeClass + " shadow-sm"
                                                            : "bg-zinc-950/60 text-white/40 border-white/5 hover:text-white hover:bg-white/5"
                                                    }`}
                                                >
                                                    <st.icon className="w-3 h-3" />
                                                    <span>{st.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Item Notes */}
                                <div>
                                    <Input
                                        placeholder="หมายเหตุเพิ่มเติมสำหรับงานนี้ (ถ้ามี)..."
                                        value={item.notes || ""}
                                        onChange={(e) => updateWorkItem(item.id, "notes", e.target.value)}
                                        className="bg-zinc-950/60 border-white/5 text-white/70 text-xs h-8 placeholder:text-white/25"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Big Full-Width Add Another Job Button */}
                <button
                    type="button"
                    onClick={() => addWorkItem()}
                    className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-500/80 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    เพิ่มงานถัดไปในวันนี้ (+ Add Job)
                </button>
            </div>

            {/* COLLAPSIBLE SECONDARY SECTIONS (Mobile-Optimized Accordions) */}
            <div className="space-y-3 pt-2">
                {/* 1. Manpower Accordion */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <button
                        type="button"
                        onClick={() => setOpenManpower(!openManpower)}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-blue-400" />
                            <div>
                                <span className="text-xs sm:text-sm font-bold text-white block">กำลังพลหน้างาน (Manpower)</span>
                                <span className="text-[10px] text-white/50">รวมช่าง/คนงานทั้งหมด {totalManpower} คน</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                {totalManpower} คน
                            </span>
                            {openManpower ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                        </div>
                    </button>

                    {openManpower && (
                        <div className="p-4 border-t border-white/5 bg-zinc-950/40 space-y-3 animate-in fade-in duration-200">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {manpower.map((mp) => (
                                    <div
                                        key={mp.id}
                                        className="bg-zinc-900 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-1.5"
                                    >
                                        <div className="truncate">
                                            <span className="text-xs text-white/80 block truncate font-medium">{mp.role}</span>
                                            <span className="text-[10px] text-white/40">{mp.count} คน</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => updateManpowerCount(mp.id, -1)}
                                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors active:scale-95"
                                            >
                                                -
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold text-amber-400 font-mono">
                                                {mp.count}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateManpowerCount(mp.id, 1)}
                                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors active:scale-95"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Equipment & Materials Accordion */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <button
                        type="button"
                        onClick={() => setOpenEquipment(!openEquipment)}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <Factory className="w-4 h-4 text-purple-400" />
                            <div>
                                <span className="text-xs sm:text-sm font-bold text-white block">เครื่องจักร & วัสดุก่อสร้างเข้าไซต์</span>
                                <span className="text-[10px] text-white/50 truncate block max-w-[240px]">
                                    {equipment || materialsReceived || "ระบุเครื่องมือหรือวัสดุที่ใช้"}
                                </span>
                            </div>
                        </div>
                        {openEquipment ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </button>

                    {openEquipment && (
                        <div className="p-4 border-t border-white/5 bg-zinc-950/40 space-y-3 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1">เครื่องจักร / เครื่องมือที่ใช้งาน</label>
                                    <Textarea
                                        rows={2}
                                        placeholder="เช่น รถโม่คอนกรีต 2 คัน, เครื่องตบดิน..."
                                        value={equipment}
                                        onChange={(e) => setEquipment(e.target.value)}
                                        className="bg-zinc-900 border-white/10 text-white text-xs resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1">วัสดุก่อสร้างที่รับเข้าวันนี้</label>
                                    <Textarea
                                        rows={2}
                                        placeholder="เช่น ปูนซีเมนต์ 50 ถุง, หินทราย 2 คันรถ..."
                                        value={materialsReceived}
                                        onChange={(e) => setMaterialsReceived(e.target.value)}
                                        className="bg-zinc-900 border-white/10 text-white text-xs resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Site Photos Accordion */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <button
                        type="button"
                        onClick={() => setOpenPhotos(!openPhotos)}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <Upload className="w-4 h-4 text-emerald-400" />
                            <div>
                                <span className="text-xs sm:text-sm font-bold text-white block">รูปถ่ายหน้างาน (Site Photos)</span>
                                <span className="text-[10px] text-white/50">{photos.length} รูปภาพประกอบ</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {photos.length > 0 && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    {photos.length} รูป
                                </span>
                            )}
                            {openPhotos ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                        </div>
                    </button>

                    {openPhotos && (
                        <div className="p-4 border-t border-white/5 bg-zinc-950/40 space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/60">ถ่ายจากกล้องมือถือหรือแนบรูปหน้างาน</span>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors">
                                        <Plus className="w-3.5 h-3.5" />
                                        แนบรูปเพิ่ม
                                    </span>
                                </label>
                            </div>

                            {photos.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {photos.map((src, idx) => (
                                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group bg-black">
                                            <img src={src} alt="site" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx)}
                                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/80 text-white hover:bg-rose-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-dashed border-white/10 rounded-xl p-5 text-center text-white/40 text-xs">
                                    ยังไม่มีรูปภาพประกอบ สามารถกดปุ่มแนบรูปด้านบนได้
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. Safety & Signatures Accordion */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <button
                        type="button"
                        onClick={() => setOpenSafety(!openSafety)}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <Shield className="w-4 h-4 text-amber-400" />
                            <div>
                                <span className="text-xs sm:text-sm font-bold text-white block">ความปลอดภัย & ผู้จัดทำรายงาน</span>
                                <span className="text-[10px] text-white/50">ผู้รายงาน: {reportedBy}</span>
                            </div>
                        </div>
                        {openSafety ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </button>

                    {openSafety && (
                        <div className="p-4 border-t border-white/5 bg-zinc-950/40 space-y-3 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1">ปัญหา / อุปสรรคหน้างาน</label>
                                    <Input
                                        placeholder="เช่น ฝนตกช่วงบ่าย 1 ชม."
                                        value={obstacles}
                                        onChange={(e) => setObstacles(e.target.value)}
                                        className="bg-zinc-900 border-white/10 text-white text-xs h-9"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1">บันทึกความปลอดภัย</label>
                                    <Input
                                        placeholder="เช่น สวมหมวกนิรภัย 100% ไม่มีอุบัติเหตุ"
                                        value={safetyNotes}
                                        onChange={(e) => setSafetyNotes(e.target.value)}
                                        className="bg-zinc-900 border-white/10 text-white text-xs h-9"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/5">
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1">ชื่อผู้จัดทำรายงาน *</label>
                                    <Input
                                        value={reportedBy}
                                        onChange={(e) => setReportedBy(e.target.value)}
                                        placeholder="เช่น เบียร์"
                                        className="bg-zinc-900 border-white/10 text-white text-xs h-9"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1">ตำแหน่ง *</label>
                                    <Input
                                        value={reportedByRole}
                                        onChange={(e) => setReportedByRole(e.target.value)}
                                        placeholder="เช่น ผู้ดูแลหน้างาน"
                                        className="bg-zinc-900 border-white/10 text-white text-xs h-9"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1">ชื่อวิศวกรผู้ตรวจสอบ</label>
                                    <Input
                                        placeholder="เช่น นายช่างสมศักดิ์"
                                        value={inspectedBy}
                                        onChange={(e) => setInspectedBy(e.target.value)}
                                        className="bg-zinc-900 border-white/10 text-white text-xs h-9"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Bottom Submit Actions */}
            <div className="hidden sm:flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="border-white/10 text-white/70 hover:bg-white/5"
                    >
                        ยกเลิก
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleTriggerPreview}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                    <Eye className="w-4 h-4 mr-1.5" />
                    ดูตัวอย่าง Sheet / พิมพ์
                </Button>
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/20 px-6 h-10"
                >
                    <Save className="w-4 h-4 mr-1.5" />
                    {isSaving ? "กำลังบันทึก..." : "บันทึก JobSheet"}
                </Button>
            </div>

            {/* MOBILE FLOATING BOTTOM BAR (Always accessible by thumb!) */}
            <div className="fixed bottom-0 inset-x-0 bg-zinc-950/95 border-t border-white/10 px-4 py-2.5 flex items-center justify-between sm:hidden z-40 backdrop-blur-lg shadow-2xl">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-500/20">
                        {workItems.length} งาน
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTriggerPreview}
                        className="h-9 px-3 text-xs border-white/10 text-white/80"
                    >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        ดู Sheet
                    </Button>
                </div>

                <Button
                    type="submit"
                    disabled={isSaving}
                    className="h-10 px-5 text-xs bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-xl shadow-lg shadow-amber-500/30"
                >
                    <Save className="w-4 h-4 mr-1 stroke-[3]" />
                    {isSaving ? "กำลังบันทึก..." : "บันทึก JobSheet"}
                </Button>
            </div>
        </form>
    );
}
