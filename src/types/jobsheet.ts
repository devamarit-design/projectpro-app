export type JobSheetStatus = 'completed' | 'in_progress' | 'pending' | 'delayed';

export interface JobSheetWorkItem {
    id: string;
    task: string;
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
    reportedBy: string;
    inspectedBy?: string;
    createdAt: string;
    updatedAt: string;
}
