export type JobSheetStatus = 'completed' | 'in_progress' | 'pending' | 'delayed';

export type JobSheetTitleHighlightStyle =
    | 'standard'
    | 'highlight_amber'
    | 'highlight_blue'
    | 'highlight_emerald'
    | 'highlight_rose'
    | 'pill'
    | 'underlined';

export interface JobSheetTitleStyle {
    isBold?: boolean; // ตัวหนา (default: true)
    style?: JobSheetTitleHighlightStyle; // รูปแบบการเน้น
    tag?: string; // ป้ายกำกับ เช่น "ด่วน", "ตรวจรับ", "งานโครงสร้าง"
    tagColor?: 'amber' | 'rose' | 'blue' | 'emerald' | 'purple' | 'zinc';
    size?: 'normal' | 'large'; // ขนาดตัวอักษร
}

export interface JobSheetWorkItem {
    id: string;
    task: string; // หัวข้องานหลัก (Main Topic)
    details?: string; // รายละเอียดงานเพิ่มเติม / ข้อย่อย (Details & Subtasks)
    titleStyle?: JobSheetTitleStyle; // สไตล์การจัดรูปแบบหัวข้องาน
    projectId?: string;
    projectName?: string; // Specific project name or "งานทั่วไป / ไม่ระบุโครงการ"
    timeSlot?: string; // e.g. "ช่วงเช้า (09:00 - 12:00)", "ช่วงบ่าย", "13:30 - 16:00"
    quantity: string;
    location: string;
    status: JobSheetStatus;
    notes?: string;
    photos?: string[]; // รูปถ่ายแนบเฉพาะของรายการงานนี้
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
    createdByEmail?: string;
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
