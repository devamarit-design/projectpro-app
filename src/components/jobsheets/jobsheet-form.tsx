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
    RotateCcw, 
    Users, 
    HardHat, 
    Wrench, 
    AlertCircle, 
    CheckCircle2, 
    Upload, 
    X,
    Calendar,
    Building2,
    Shield
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
    { label: "เทคอนกรีต", task: "งานเทคอนกรีตเสาและคาน", category: "" },
    { label: "ผูกเหล็กคาน/เสา", task: "งานผูกเหล็กโครงสร้างคาน/เสา", category: "" },
    { label: "ฉาบปูนผนัง", task: "งานฉาบปูนผนังภายใน/ภายนอก", category: "" },
    { label: "ตรวจระบบไฟ/ประปา", task: "ตรวจเช็คงานเดินท่อร้อยสายไฟและประปา", category: "" },
    { label: "ปูกระเบื้อง", task: "งานปูกระเบื้องพื้นและผนัง", category: "" },
    { label: "📦 ประชุมทีม/พบลูกค้า", task: "ประชุมติดตามงานกับทีมงานและสรุปงานกับลูกค้า", category: "งานทั่วไป / ธุรการ" },
    { label: "🚚 สั่งซื้อ/ตรวจรับวัสดุ", task: "ประสานงานร้านค้า สั่งซื้อและตรวจรับวัสดุก่อสร้าง", category: "จัดซื้อ / จัดส่งวัสดุ" },
    { label: "🏭 โกดัง/ซ่อมบำรุง", task: "จัดระเบียบสต็อก ตรวจเช็คและบำรุงรักษาเครื่องมือในโกดัง", category: "โรงงาน / โกดัง / ซ่อมบำรุง" },
    { label: "📑 เคลียร์เอกสาร/งวดงาน", task: "จัดทำเอกสารเบิกงวดงาน จัดทำใบเสนอราคาและสัญญา", category: "งานทั่วไป / ธุรการ" }
];

export function JobSheetForm({
    initialData,
    onSave,
    onPreview,
    onCancel
}: JobSheetFormProps) {
    const { projects, currentUser } = useProjects();
    const [isSaving, setIsSaving] = useState(false);

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

    // Work Items
    const [workItems, setWorkItems] = useState<JobSheetWorkItem[]>(
        initialData?.workItems && initialData.workItems.length > 0
            ? initialData.workItems
            : [
                  {
                      id: "1",
                      task: "งานเทคอนกรีตเสาและคาน",
                      projectId: projects[0]?.id || "",
                      projectName: projects[0]?.name || "โครงการหลัก",
                      quantity: "15 ตร.ม.",
                      location: "ชั้น 2 โซน A",
                      status: "completed",
                      notes: "เทปูนเรียบร้อย บ่มคอนกรีตตามมาตรฐาน"
                  }
              ]
    );

    // Manpower
    const [manpower, setManpower] = useState<JobSheetManpower[]>(
        initialData?.manpower && initialData.manpower.length > 0
            ? initialData.manpower
            : DEFAULT_MANPOWER_ROLES.map((role, idx) => ({
                  id: String(idx + 1),
                  role,
                  count: idx === 0 ? 1 : idx === 1 ? 4 : idx === 7 ? 4 : 0
              }))
    );

    // Other details
    const [equipment, setEquipment] = useState(initialData?.equipment || "รถโม่คอนกรีต 2 คัน, เครื่องจี้ปูน 2 ตัว, นั่งร้านเหล็ก");
    const [materialsReceived, setMaterialsReceived] = useState(initialData?.materialsReceived || "ปูนซีเมนต์สำเร็จรูป 50 ถุง, เหล็กข้ออ้อย 12 มม. 40 เส้น");
    const [obstacles, setObstacles] = useState(initialData?.obstacles || "");
    const [safetyNotes, setSafetyNotes] = useState(initialData?.safetyNotes || "พนักงานทุกคนสวมหมวกนิรภัยและรองเท้าเซฟตี้ 100% ไม่มีอุบัติเหตุ");
    const [reportedBy, setReportedBy] = useState(
        initialData?.reportedBy || currentUser?.name || "วิศวกรผู้ควบคุมงาน"
    );
    const [inspectedBy, setInspectedBy] = useState(initialData?.inspectedBy || "");
    const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);

    // When project changes, update projectName
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
    const addWorkItem = (presetTask?: string, presetCategory?: string) => {
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
            const toastId = toast.loading("กำลังดึงข้อมูลสภาพอากาศ...");
            const res = await fetch(
                "https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FBangkok"
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
            createdBy: currentUser?.id || "",
            createdByName: currentUser?.name || reportedBy,
            createdByRole: currentUser?.role || "",
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
            reportedBy,
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

    // Calculate total manpower
    const totalManpower = manpower.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md sticky top-16 z-20 shadow-xl">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-amber-400" />
                        {initialData ? "แก้ไขรายงาน JobSheet" : "เขียน JobSheet ประจำวัน"}
                    </h2>
                    <p className="text-xs text-white/50">
                        บันทึกการทำงานประจำวัน กำลังพล สภาพอากาศ และดาวน์โหลดเป็น Sheet / PDF ได้ทันที
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
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                    >
                        <Eye className="w-4 h-4 mr-1.5" />
                        ดูตัวอย่าง Sheet / พิมพ์
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20"
                    >
                        <Save className="w-4 h-4 mr-1.5" />
                        {isSaving ? "กำลังบันทึก..." : "บันทึก JobSheet"}
                    </Button>
                </div>
            </div>

            {/* SECTION 1: General Info & Weather */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                        1. ข้อมูลทั่วไป & สภาพอากาศประจำวัน
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Date */}
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">วันที่บันทึกงาน *</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white"
                            required
                        />
                    </div>

                    {/* Report Number */}
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">เลขที่รายงาน (Doc No.)</label>
                        <Input
                            type="text"
                            value={reportNumber}
                            onChange={(e) => setReportNumber(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white font-mono"
                        />
                    </div>

                    {/* Project Selector / Mode */}
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium flex items-center justify-between">
                            <span>โครงการหลัก / โหมดงาน</span>
                            <span className="text-[10px] text-amber-400">แยกรายข้อได้</span>
                        </label>
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
                            className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                        >
                            <option value="multi">🗂️ ปฏิบัติงานหลายโครงการ / ทั่วไป (Multi-Project)</option>
                            <option value="general">📦 งานทั่วไป / ธุรการ / นอกโครงการ (General Tasks)</option>
                            <optgroup label="โครงการก่อสร้างในระบบ">
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        🏢 {p.name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* SubProject / Zone */}
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">โครงการย่อย / โซนงาน / แผนก</label>
                        <Input
                            type="text"
                            placeholder="เช่น อาคาร A, จัดซื้อ, งานระบบ"
                            value={subProjectName}
                            onChange={(e) => setSubProjectName(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white"
                        />
                    </div>
                </div>

                {/* Weather Section */}
                <div className="pt-2 border-t border-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
                            <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                            สภาพอากาศหน้างาน
                        </label>
                        <button
                            type="button"
                            onClick={handleAutoFetchWeather}
                            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 transition-colors"
                        >
                            <Sparkles className="w-3 h-3" />
                            ดึงสภาพอากาศจริงอัตโนมัติ
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-3 flex flex-wrap gap-2">
                            {[
                                { label: "☀️ ท้องฟ้าแจ่มใส", value: "ท้องฟ้าแจ่มใส (Clear Sky)" },
                                { label: "⛅ มีเมฆมาก", value: "มีเมฆบางส่วน / ครึ้มฟ้าครึ้มฝน (Cloudy)" },
                                { label: "🌧️ ฝนตก", value: "มีฝนตก (Rain Showers)" },
                                { label: "⚡ พายุฟ้าคะนอง", value: "พายุฝนฟ้าคะนอง (Thunderstorm)" },
                                { label: "🌫️ หมอกลง", value: "มีหมอกลง (Foggy)" }
                            ].map((w) => (
                                <button
                                    key={w.value}
                                    type="button"
                                    onClick={() => setWeatherCondition(w.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        weatherCondition === w.value
                                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                                            : "bg-zinc-950/60 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>

                        <div>
                            <Input
                                type="number"
                                placeholder="อุณหภูมิ (°C)"
                                value={temperature ?? ""}
                                onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : undefined)}
                                className="bg-zinc-950 border-white/10 text-white text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Work Items Executed */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                            2. รายการงานที่ปฏิบัติในวันนี้ ({workItems.length} รายการ)
                        </h3>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => addWorkItem()}
                        className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        เพิ่มรายการงาน
                    </Button>
                </div>

                {/* Preset Chips */}
                <div>
                    <span className="text-[11px] text-white/40 block mb-1.5">คลิกเพื่อเพิ่มงานสำเร็จรูป (มีทั้งงานโครงการและงานทั่วไป):</span>
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_TASK_PRESETS.map((preset, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => addWorkItem(preset.task, preset.category)}
                                className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 hover:bg-amber-500/10 hover:text-amber-300 border border-white/5 text-white/70 transition-colors"
                            >
                                + {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    {workItems.map((item, index) => (
                        <div
                            key={item.id}
                            className="bg-zinc-950/80 border border-white/10 rounded-xl p-3.5 space-y-2.5 relative group transition-all hover:border-white/20"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                    #{index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeWorkItem(item.id)}
                                    className="text-white/40 hover:text-rose-400 p-1 transition-colors"
                                    title="ลบรายการนี้"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* ROW 1: Project Selector & Task Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                {/* Project / Category Selector */}
                                <div className="sm:col-span-4">
                                    <label className="text-[10px] text-white/50 block mb-1">โครงการ / หมวดงาน</label>
                                    <select
                                        value={item.projectId || (item.projectName?.includes("ทั่วไป") ? "general" : item.projectName?.includes("จัดซื้อ") ? "procurement" : item.projectName?.includes("โรงงาน") ? "workshop" : "")}
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
                                        className="w-full h-9 px-2 rounded-md bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                    >
                                        <option value="">-- {selectedProjectId && selectedProjectId !== "multi" && selectedProjectId !== "general" ? projectName : "ตามโครงการหลัก"} --</option>
                                        <optgroup label="🏢 โครงการก่อสร้าง">
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="📦 งานทั่วไป / ไม่ระบุโครงการ">
                                            <option value="general">📦 งานทั่วไป / ธุรการ / ออฟฟิศ</option>
                                            <option value="procurement">🚚 จัดซื้อ / จัดส่งวัสดุ</option>
                                            <option value="workshop">🏭 โรงงาน / โกดัง / ซ่อมบำรุง</option>
                                        </optgroup>
                                    </select>
                                </div>

                                {/* Task Name */}
                                <div className="sm:col-span-8">
                                    <label className="text-[10px] text-white/50 block mb-1">รายละเอียดงานที่ทำ *</label>
                                    <Input
                                        placeholder="ระบุรายละเอียดกิจกรรมหรือเนื้องานที่ปฏิบัติ..."
                                        value={item.task}
                                        onChange={(e) => updateWorkItem(item.id, "task", e.target.value)}
                                        className="bg-zinc-900 border-white/10 text-white text-xs h-9"
                                        required
                                    />
                                </div>
                            </div>

                            {/* ROW 2: Location, Quantity, Status, Notes */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                                {/* Location */}
                                <div className="sm:col-span-3">
                                    <label className="text-[10px] text-white/50 block mb-1">พื้นที่ / โซน</label>
                                    <Input
                                        placeholder="เช่น ชั้น 2, ออฟฟิศ, โกดัง"
                                        value={item.location}
                                        onChange={(e) => updateWorkItem(item.id, "location", e.target.value)}
                                        className="bg-zinc-900 border-white/10 text-white text-xs h-8"
                                    />
                                </div>

                                {/* Quantity */}
                                <div className="sm:col-span-3">
                                    <label className="text-[10px] text-white/50 block mb-1">ปริมาณงาน / เวลา</label>
                                    <Input
                                        placeholder="เช่น 15 ตร.ม., 3 ชม."
                                        value={item.quantity}
                                        onChange={(e) => updateWorkItem(item.id, "quantity", e.target.value)}
                                        className="bg-zinc-900 border-white/10 text-white text-xs h-8"
                                    />
                                </div>

                                {/* Status */}
                                <div className="sm:col-span-2">
                                    <label className="text-[10px] text-white/50 block mb-1">สถานะ</label>
                                    <select
                                        value={item.status}
                                        onChange={(e) => updateWorkItem(item.id, "status", e.target.value)}
                                        className="w-full h-8 px-2 rounded-md bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    >
                                        <option value="completed">เสร็จสิ้น (100%)</option>
                                        <option value="in_progress">กำลังดำเนินการ</option>
                                        <option value="pending">รอดำเนินการ</option>
                                        <option value="delayed">ล่าช้า / ติดปัญหา</option>
                                    </select>
                                </div>

                                {/* Item Notes */}
                                <div className="sm:col-span-4">
                                    <label className="text-[10px] text-white/50 block mb-1">หมายเหตุ</label>
                                    <Input
                                        placeholder="รายละเอียดเพิ่มเติม..."
                                        value={item.notes || ""}
                                        onChange={(e) => updateWorkItem(item.id, "notes", e.target.value)}
                                        className="bg-zinc-900/60 border-white/5 text-white/80 text-xs h-8"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 3: Manpower & Resources */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                            3. กำลังพล & ทรัพยากรหน้างาน
                        </h3>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        รวมช่าง/คนงาน {totalManpower} คน
                    </span>
                </div>

                {/* Manpower Counter Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {manpower.map((mp) => (
                        <div
                            key={mp.id}
                            className="bg-zinc-950 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2"
                        >
                            <div className="truncate">
                                <span className="text-xs text-white/80 block truncate font-medium">{mp.role}</span>
                                <span className="text-[10px] text-white/40">{mp.count} คน</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => updateManpowerCount(mp.id, -1)}
                                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/15 text-white flex items-center justify-center text-xs font-bold transition-colors"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-amber-400 font-mono">
                                    {mp.count}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => updateManpowerCount(mp.id, 1)}
                                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/15 text-white flex items-center justify-center text-xs font-bold transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Equipment & Materials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">เครื่องจักร / เครื่องมือที่ใช้งาน</label>
                        <Textarea
                            rows={2}
                            placeholder="เช่น รถแบคโฮ 1 คัน, เครื่องตบดิน, นั่งร้าน..."
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white text-xs resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">วัสดุก่อสร้างที่รับเข้าวันนี้</label>
                        <Textarea
                            rows={2}
                            placeholder="เช่น คอนกรีตผสมเสร็จ 12 ลบ.ม., ปูนซีเมนต์ 50 ถุง..."
                            value={materialsReceived}
                            onChange={(e) => setMaterialsReceived(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white text-xs resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 4: Obstacles & Safety */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                        4. ปัญหาอุปสรรค & บันทึกความปลอดภัย
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">ปัญหา / อุปสรรคหน้างาน</label>
                        <Textarea
                            rows={2}
                            placeholder="เช่น ฝนตกช่วงบ่าย 14:00-15:00 น. ทำให้ต้องหยุดงานเทพื้นชั่วคราว..."
                            value={obstacles}
                            onChange={(e) => setObstacles(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white text-xs resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">ความปลอดภัยและข้อสังเกต</label>
                        <Textarea
                            rows={2}
                            placeholder="เช่น ตรวจสอบสายไฟและระบบนิรภัยเรียบร้อย ไม่มีอุบัติเหตุ..."
                            value={safetyNotes}
                            onChange={(e) => setSafetyNotes(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white text-xs resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 5: Site Photos */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                            5. ภาพถ่ายประกอบหน้างาน ({photos.length} รูป)
                        </h3>
                    </div>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            แนบรูปภาพหน้างาน
                        </span>
                    </label>
                </div>

                {photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {photos.map((src, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group bg-black">
                                <img src={src} alt="site" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(idx)}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border border-dashed border-white/10 rounded-xl p-6 text-center text-white/40 text-xs">
                        ยังไม่มีรูปภาพประกอบ สามารถถ่ายจากมือถือหรือแนบรูปหน้างานเข้ามาได้
                    </div>
                )}
            </div>

            {/* SECTION 6: Signatures */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">ชื่อผู้จัดทำรายงาน / ผู้ควบคุมงาน *</label>
                        <Input
                            value={reportedBy}
                            onChange={(e) => setReportedBy(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white text-xs"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/70 block mb-1.5 font-medium">ชื่อวิศวกรผู้ตรวจสอบ (ถ้ามี)</label>
                        <Input
                            placeholder="เช่น นายช่างสมศักดิ์ (วศ.1234)"
                            value={inspectedBy}
                            onChange={(e) => setInspectedBy(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-white text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
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
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20 px-6"
                >
                    <Save className="w-4 h-4 mr-1.5" />
                    {isSaving ? "กำลังบันทึก..." : "บันทึก JobSheet"}
                </Button>
            </div>
        </form>
    );
}
