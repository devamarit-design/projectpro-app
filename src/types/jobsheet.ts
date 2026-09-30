export type JobSheetStatus = 'completed' | 'in_progress' | 'pending' | 'delayed';

export interface JobSheetWorkItem {
    id: string;
    task: string; // หัวข้องานหลัก (Main Topic)
    details?: string; // รายละเอียดงานเพิ่มเติม / ข้อย่อย (Details & Subtasks)
    projectId?: string;
    projectName?: string; // Specific project name or "งานทั่วไป / ไม่ระบุโครงการ"
    timeSlot?: string; // e.g. "ช่วงเช้า (09:00 - 12:00)", "ช่วงบ่าย", "13:30 - 16:00"
    quantity: string;
    location: string;
    status: JobSheetStatus;
    notes?: string;
}

export interface JobSheetManpower {
    id: string;
    role: string;
    count: number;
}

export interface JobSheetWeather {
    condition: string; // e.g. "แดดจัด (Clear)", "มีเมฆมาก (Cloudy)", "ฝนตก (Rainy)"
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    notes?: string;
}

export interface JobSheet {
    id: string;
    reportNumber: string; // e.g. JS-20260930-001
    title: string;
    date: string; // YYYY-MM-DD
    projectId?: string;
    projectName: string;
    projectIds?: string[]; // All projects involved
    isMultiProject?: boolean;
    subProjectId?: string;
    subProjectName?: string;
    orgId: string;
    createdBy: string;
    createdByName: string;
    createdByRole?: string;
    createdByAvatar?: string;
    weather: JobSheetWeather;
    workItems: JobSheetWorkItem[];
    manpower: JobSheetManpower[];
    equipment?: string;
    materialsReceived?: string;
    safetyNotes?: string;
    obstacles?: string;
    generalNotes?: string;
    photos?: string[];
    companyName?: string;
    companyLogo?: string;
    reportedBy: string;
    reportedByRole?: string;
    inspectedBy?: string;
    createdAt: string;
    updatedAt: string;
}
