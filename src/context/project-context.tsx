"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { auth, googleProvider, db } from "@/lib/firebase"
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, User as FirebaseUser, setPersistence, browserLocalPersistence, updatePassword, deleteUser as deleteAuthUser, reauthenticateWithPopup, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"
import { doc, getDoc, getDocs, setDoc, onSnapshot, collection, query, where, addDoc, updateDoc, deleteDoc, documentId, orderBy, limit } from "firebase/firestore"
import { seedDatabase } from "@/lib/seed-data"
import { useOrganization } from "@/context/organization-context"
import { logActivity } from "@/lib/activity-logger"

// Domain Providers
import { TaskProvider, useTasks } from "./task-context"
import { FinanceProvider, useFinance } from "./finance-context"
import { SocialProvider, useSocial } from "./social-context"

export type ProjectStatus = "Planning" | "In Progress" | "On Hold" | "Completed"
export type TaskStatus = "Todo" | "In Progress" | "Done"
export type Priority = "High" | "Medium" | "Low"

export interface ProjectTask {
    id: string
    title: string
    status: TaskStatus
    priority: Priority
    assignedTo?: string[] // Array of user IDs for multi-assign
    dueDate?: string
    startDate?: string // New: Start of range
    endDate?: string // New: End of range
    createdBy?: string // New: Creator ID
    description?: string
    projectId: string // Link to project
    subProjectId?: string // Link to sub-project
    orgId: string    // Link to organization
    isArchived?: boolean // Archive flag
    createdAt?: string // Timestamp
    updatedAt?: string // Timestamp
    doneAt?: string // Timestamp when task was marked as Done (for auto-archive)
    images?: string[] // Array of image URLs
}

// Sub-project (โปรเจคย่อย) - Different from Task
export interface SubProject {
    id: string
    name: string
    description?: string
    status: "Planning" | "In Progress" | "Done"
    budget?: string
    startDate?: string
    endDate?: string
}

export interface WorkItem {
    id: string
    title: string
    startDate: string
    endDate: string
    progress: number // 0-100
    projectId: string
    orgId: string
    category?: string // ประเภทงาน (Work Type)
    assignedTo?: string // Assignee ID
    priority?: Priority
    labels?: string[]
    dependencies?: string[] // IDs of WorkItems this depends on
    color?: string
    isArchived?: boolean
    description?: string // รายละเอียดงาน
    sortOrder?: number // สำหรับสลับลำดับแถว
    createdAt?: string
    updatedAt?: string
}

export interface CompanyProfile {
    name: string
    nameEn?: string // English Company Name
    address: string
    addressEn?: string // English Address
    taxId: string
    phone: string
    logo?: string
    paymentInfo?: string
    signatureName?: string
    description?: string // Added description
    email?: string
    website?: string
    primaryColor?: string
    secondaryColor?: string
    updatedAt?: string // Timestamp
}

export interface ProjectFile {
    id: string
    name: string
    url: string
    type: "image" | "pdf" | "spreadsheet" | "doc" | "video" | "other"
    size: string
    uploadedAt: string
    projectId?: string // Linked to project
    folder?: string // Virtual folder if needed
    thumbnailUrl?: string
}

export type ExpenseCategory = "Material" | "Labor" | "Sub-contract" | "Other"

export interface ExpenseItem {
    id: string
    description: string
    amount: number
    quantity?: number
    unitPrice?: number
    category: ExpenseCategory
    projectId?: string
    subProjectId?: string
    taskId?: string
}

export interface Expense {
    id: string
    title: string
    amount: string // Display amount (e.g. "฿5,000")
    totalValue: number // Numeric value for calculations
    date: string
    category: ExpenseCategory // Main category fallback
    payee?: string // For "Paid" status
    paidBy?: string // For "Advanced" (สำรองจ่าย) - e.g. "User A"
    vendor?: string // For "Credit" or general vendor
    status: "Paid" | "Pending" | "Unpaid" | "Advanced" | "Credit"
    projectId?: string // Main project linkage
    items?: ExpenseItem[] // For split bills
    vatIncluded?: boolean
    receiptImage?: string
    thumbnailUrl?: string
    imageEdited?: boolean
    subProjectId?: string
    orgId?: string
    isArchived?: boolean // Archive flag
    createdAt?: string // Timestamp
    updatedAt?: string // Timestamp
    createdBy?: string // User ID of creator
}

export interface Project {
    id: string
    name: string
    customer: string
    location: string
    status: ProjectStatus
    progress: number
    budget: string // Keeping as string for now to match UI, ideally number
    income: string // Added to track money received from customer
    expenses: string // Added to track money spent (cost)
    startDate: string
    endDate: string
    image: string
    description?: string
    tasks?: ProjectTask[]
    works?: WorkItem[] // New: Works for Gantt/Schedule
    subProjects?: SubProject[] // โปรเจคย่อย - separate from Tasks
    orgId?: string // Organization ID
    isArchived?: boolean // Archive flag
    createdAt?: string // Timestamp
    updatedAt?: string // Timestamp
}

export interface User {
    id: string
    name: string
    role: string
    email?: string // Added for RBAC/Communication
    phone?: string

    lineId?: string
    location?: string
    rating?: number
    skills?: string[]
    joinedDate?: string
    avatar?: string // Profile picture URL
    status: "Active" | "Inactive" | "Pending"
    orgIds: string[] // Legacy support
    display?: string // Display Mode (Compact/Comfortable)
    theme?: string // Theme Preference (Light/Dark/System)
    organizations?: { orgId: string, role: string }[] // New SaaS Structure
    settings?: {
        theme?: any // Avoid circular dependency, typed as AppTheme in usage
    }
    hasOnboarded?: boolean // New flag for onboarding flow
    createdAt?: string // Timestamp
    updatedAt?: string // Timestamp
}

export interface Vendor {
    id: string
    name: string
    category: string
    phone?: string
    lineId?: string
    location?: string
    rating?: number
    products?: string[]
    status: "Active" | "Inactive"
    orgId?: string
    avatar?: string
    createdAt?: string
    updatedAt?: string
}

export interface Worker {
    id: string
    name: string
    role: string
    phone?: string
    lineId?: string
    location?: string
    skills?: string[]
    dailyRate?: number
    rating?: number
    status: "Active" | "Inactive"
    joinedDate?: string
    orgId?: string
    avatar?: string
    createdAt?: string
    updatedAt?: string
}

export interface Customer {
    id: string
    name: string
    type: "Person" | "Company"
    taxId?: string
    address?: string
    phone?: string
    lineId?: string
    email?: string
    contactPerson?: string
    projects?: string[] // IDs of linked projects
    totalValue?: number // Calculated
    status: "Active" | "Inactive"
    orgId?: string
    createdAt?: string
    updatedAt?: string
}

export interface IncomeItem {
    id: string
    name?: string  // Item name
    description: string  // Item description/details
    quantity: number
    unit: string
    unitPrice: number
    total: number
    image?: string
}

export interface IncomeSection {
    id: string
    name: string
    coverImage?: string
    items: IncomeItem[]
}

export type IncomeType = "Quotation" | "Invoice" | "Receipt"
export type IncomeStatus = "Draft" | "Sent" | "Accepted" | "Invoiced" | "Paid" | "Void"

export interface IncomeDocument {
    id: string
    documentNumber: string // e.g., QT-2024001
    type: IncomeType
    date: string
    validUntil?: string // For QT
    projectId: string
    customerId: string

    // Mode
    mode: "Simple" | "Zone"

    // Content
    items?: IncomeItem[] // For Simple mode
    sections?: IncomeSection[] // For Zone mode

    // Financials
    subtotal: number
    discount: number
    tax: number // 7% VAT usually
    total: number
    withholdingTax?: number // 3% usually
    grandTotal: number

    status: IncomeStatus
    note?: string
    manualPageBreaks?: number[] // Array of item indices after which a break occurs
    template?: "modern" | "classic" | "minimal"
    paymentDetails?: string
    remarks?: string
    referenceDocumentId?: string // Link QT -> BN -> RE
    isArchived?: boolean // Archive flag
    vatIncluded?: boolean // VAT included flag
    createdAt?: string
    updatedAt?: string
}

export interface ContractInstallment {
    id: string
    description: string
    amount: number
    dueDate: string
    status: "Pending" | "Paid" | "Overdue"
    paidAt?: string
    expenseId?: string // Link to created expense
    paymentDetails?: string
    createdAt?: string
    updatedAt?: string
}

export interface Contract {
    id: string
    documentNumber?: string
    projectId: string
    workerId: string
    title: string
    scope: string
    startDate: string
    endDate: string
    totalAmount: number
    status: "Active" | "Completed" | "Terminated"
    installments: ContractInstallment[]
    createdAt: string
    updatedAt?: string
}



export interface Team extends CompanyProfile {
    id: string
    name: string
    logo?: string // Emoji or Image URL
    role: "Owner" | "Admin" | "Manager" | "Accountant" | "Staff"
}

interface CoreProjectContextType {
    projects: Project[]
    addProject: (project: Omit<Project, "id" | "createdAt">) => void
    updateProject: (id: string, updates: Partial<Project>) => void
    deleteProject: (id: string) => void
    getProject: (id: string) => Project | undefined

    // Team / Workspace
    teams: Team[]
    currentTeam: Team | null
    switchTeam: (teamId: string) => void
    addTeam: (name: string) => Promise<string>

    // Sub-project Management (โปรเจคย่อย)
    addSubProject: (projectId: string, subProject: Omit<SubProject, "id">) => void
    deleteSubProject: (projectId: string, subProjectId: string) => void

    // Master Data
    users: User[]
    addUser: (userData: Omit<User, "id" | "joinedDate" | "status" | "orgIds">) => Promise<void>
    updateUser: (id: string, updates: Partial<User>) => Promise<void>
    deleteUser: (id: string) => Promise<void>

    // File Management
    files: ProjectFile[]
    addFile: (file: Omit<ProjectFile, "id" | "uploadedAt">) => void
    deleteFile: (id: string) => void

    // Company Profile
    companyProfile: CompanyProfile
    updateCompanyProfile: (updates: Partial<CompanyProfile>) => Promise<void>

    currentUser: User | null
    setCurrentUser: (user: User | null) => void
    login: (provider: string, credentials?: { email?: string, password?: string }) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    updateUserPassword: (password: string) => Promise<void>
    logout: () => void
    deleteAccount: (password?: string) => Promise<void>
    isAuthLoading: boolean

    // Backup & Restore
    restoreData: (data: Record<string, unknown>) => Promise<boolean>
    seedData: () => Promise<void>
    isOrgLoading: boolean
    isLoading: boolean // Global Data Loading State

    // Archive System (Projects only)
    archiveProject: (id: string) => Promise<void>
    unarchiveProject: (id: string) => Promise<void>

    // Archived data for Archive page
    archivedProjects: Project[]

    // Environment & System
    isRedirecting: boolean
    getEnvironment: () => { isIOS: boolean; isPWA: boolean; isRestricted: boolean }
}

export interface ProjectContextType extends CoreProjectContextType {
    // Task Management (Aggregated)
    tasks: ProjectTask[]
    addTask: (projectId: string, task: Omit<ProjectTask, "id" | "projectId" | "orgId">) => Promise<string | undefined>
    updateTask: (id: string, updates: Partial<ProjectTask>) => Promise<void>
    deleteTask: (id: string) => Promise<void>
    toggleTask: (taskId: string) => Promise<void>
    setTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>

    // Work Management (Aggregated)
    works: WorkItem[]
    // ... work actions are currently simplified or handled as partials in TaskContext

    // Expense Management (Aggregated)
    // Expense Management (Aggregated)
    expenses: Expense[]
    archivedExpenses: Expense[]
    addExpense: (expense: Omit<Expense, "id" | "createdAt" | "orgId">) => Promise<string | undefined>
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
    deleteExpense: (id: string) => Promise<void>

    // Income (Aggregated)
    incomes: IncomeDocument[]
    addIncome: (income: Omit<IncomeDocument, "id" | "createdAt" | "orgId">) => Promise<string | undefined>
    updateIncome: (id: string, updates: Partial<IncomeDocument>) => Promise<void>
    deleteIncome: (id: string) => Promise<void>

    // Finance Master Data (Aggregated)
    vendors: Vendor[]
    workers: Worker[]
    customers: Customer[]
    contracts: Contract[]
    addVendor: (vendor: Omit<Vendor, "id" | "status">) => Promise<void>
    updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>
    deleteVendor: (id: string) => Promise<void>
    addWorker: (worker: Omit<Worker, "id" | "status">) => Promise<void>
    updateWorker: (id: string, updates: Partial<Worker>) => Promise<void>
    deleteWorker: (id: string) => Promise<void>
    addCustomer: (customer: Omit<Customer, "id" | "status" | "totalValue">) => Promise<void>
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>
    deleteCustomer: (id: string) => Promise<void>
    addContract: (contract: Omit<Contract, "id" | "createdAt" | "status">) => Promise<void>
    updateContract: (id: string, updates: Partial<Contract>) => Promise<void>
    deleteContract: (id: string) => Promise<void>
    payInstallment: (contractId: string, installmentId: string) => Promise<void>

    // Archive System (Aggregated)
    archiveTask: (id: string) => Promise<void>
    unarchiveTask: (id: string) => Promise<void>
    archiveExpense: (id: string) => Promise<void>
    unarchiveExpense: (id: string) => Promise<void>
    archiveIncome: (id: string) => Promise<void>
    unarchiveIncome: (id: string) => Promise<void>

    // Archived data (Aggregated)
    archivedTasks: ProjectTask[]

    // Social (Aggregated)
    posts: any[]
    addPost: (content: string, images?: string[]) => Promise<void>
    updatePost: (id: string, updates: Partial<any>) => Promise<void>
    deletePost: (id: string) => Promise<void>
    toggleLike: (postId: string) => Promise<void>

    isTasksLoading: boolean
    isFinanceLoading: boolean
    isSocialLoading: boolean
}



import { INITIAL_PROJECTS } from "@/lib/initial-data"

const ProjectContext = createContext<CoreProjectContextType | undefined>(undefined)


// Initial Mock Expenses
const INITIAL_EXPENSES: Expense[] = [
    {
        id: "1",
        title: "Cement Bags x50",
        amount: "฿7,500",
        totalValue: 7500,
        date: "2024-01-12",
        category: "Material",
        payee: "SCG Home",
        status: "Paid",
        projectId: "1",
        vatIncluded: true,
        items: [
            { id: "e1-1", description: "Portland Cement Type 1", amount: 7000, category: "Material" },
            { id: "e1-2", description: "Delivery Fee", amount: 500, category: "Other" }
        ]
    },
    {
        id: "2",
        title: "Daily Wage (Team A)",
        amount: "฿4,500",
        totalValue: 4500,
        date: "2024-01-12",
        category: "Labor",
        payee: "Foreman Chai",
        status: "Paid",
        projectId: "1"
    },
    {
        id: "3",
        title: "Electric System Install",
        amount: "฿25,000",
        totalValue: 25000,
        date: "2024-01-10",
        category: "Sub-contract",
        payee: "PowerTech Ltd.",
        status: "Pending",
        projectId: "1",
        vendor: "PowerTech Ltd."
    },
    {
        id: "4",
        title: "Paint Supplies (Lot 1)",
        amount: "฿12,000",
        totalValue: 12000,
        date: "2024-01-08",
        category: "Material",
        payee: "Thai Watsadu",
        status: "Paid",
        projectId: "4",
        vendor: "Thai Watsadu"
    },
    {
        id: "5",
        title: "Built-in Furniture Deposit",
        amount: "฿50,000",
        totalValue: 50000,
        date: "2023-12-15",
        category: "Sub-contract",
        payee: "WoodWork Expert",
        status: "Paid",
        projectId: "4"
    },
    {
        id: "6",
        title: "Roof Metal Sheet",
        amount: "฿85,000",
        totalValue: 85000,
        date: "2024-01-06",
        category: "Material",
        payee: "Metal Sheet Center",
        status: "Unpaid",
        projectId: "5",
        vendor: "Global House"
    },
    {
        id: "7",
        title: "Crane Rental",
        amount: "฿8,000",
        totalValue: 8000,
        date: "2024-01-06",
        category: "Other",
        payee: "Crane Service Co.",
        status: "Credit",
        projectId: "5"
    },
    {
        id: "8",
        title: "Weekly Wage (Team B)",
        amount: "฿15,000",
        totalValue: 15000,
        date: "2024-01-19",
        category: "Labor",
        payee: "Foreman Chai",
        status: "Advanced",
        paidBy: "Admin Ply",
        projectId: "1"
    },
    {
        id: "9",
        title: "Glass Partitions",
        amount: "฿45,000",
        totalValue: 45000,
        date: "2024-02-01",
        category: "Material",
        payee: "Glass Master",
        status: "Unpaid",
        projectId: "1"
    },
    {
        id: "10",
        title: "Fuel for Truck",
        amount: "฿2,000",
        totalValue: 2000,
        date: "2024-01-20",
        category: "Other",
        payee: "PTT Station",
        status: "Paid",
        projectId: "5",
        paidBy: "Driver Ek"
    }
]

// Mock Master Data
const MOCK_USERS: User[] = [
    { id: "u1", name: "Foreman Chai", role: "Foreman", phone: "081-123-4567", location: "Bangkok", rating: 5, status: "Active", joinedDate: "2023-01-15", orgIds: ['1'] },
    { id: "u2", name: "Engineer Som", role: "Structural Engineer", phone: "089-987-6543", location: "Bangkok", rating: 4.8, status: "Active", joinedDate: "2023-03-10", orgIds: ['1'] },
    { id: "u3", name: "Admin Ply", role: "Admin", status: "Active", phone: "02-123-4567", orgIds: ['1', '2', '3'] },
    { id: "u4", name: "Boss", role: "Owner", status: "Active", orgIds: ['1', '2', '3'] }
]

const MOCK_WORKERS: Worker[] = [
    { id: "w1", name: "Foreman Chai", role: "Foreman", phone: "081-123-4567", location: "Bangkok", rating: 5, status: "Active", joinedDate: "2023-01-15", skills: ["Site Management", "Blueprints"] },
    { id: "w2", name: "Engineer Som", role: "Engineer", phone: "089-987-6543", location: "Bangkok", rating: 4.8, status: "Active", joinedDate: "2023-03-10" },
    { id: "w3", name: "Electrician Jo", role: "Technician", phone: "081-555-5555", status: "Active", skills: ["Wiring", "HVAC"], joinedDate: "2023-06-01" },
    { id: "w4", name: "Driver Ek", role: "Worker", phone: "081-666-6666", status: "Active" },
    { id: "w5", name: "Carpenter Daeng", role: "Technician", phone: "082-222-3333", status: "Active", skills: ["Woodwork", "Furniture"], joinedDate: "2023-07-20" },
    { id: "w6", name: "Helper Noi", role: "Worker", phone: "083-333-4444", status: "Active", joinedDate: "2023-08-01" }
]

const MOCK_VENDORS: Vendor[] = [
    { id: "v1", name: "SCG Home Solution", category: "Material", phone: "02-586-2222", location: "Bangsue, Bangkok", rating: 4.9, status: "Active" },
    { id: "v2", name: "Thai Watsadu", category: "Material", phone: "1308", location: "Bangna", rating: 4.5, status: "Active" },
    { id: "v3", name: "Global House", category: "Material", status: "Active" },
    { id: "v4", name: "PowerTech Ltd.", category: "Sub-contract", phone: "088-777-6666", location: "Nonthaburi", rating: 4.7, status: "Active" },
    { id: "v5", name: "Clean & Clear Service", category: "Service", status: "Active" },
    { id: "v6", name: "Metal Sheet Center", category: "Material", phone: "02-999-0000", location: "Samut Prakan", rating: 4.2, status: "Active" },
    { id: "v7", name: "Glass Master", category: "Sub-contract", phone: "081-222-3333", location: "Bangkok", rating: 4.6, status: "Active" },
    { id: "v8", name: "WoodWork Expert", category: "Sub-contract", phone: "085-555-8888", location: "Pathum Thani", rating: 4.8, status: "Active" },
    { id: "v9", name: "Heavy Mach Rental", category: "Equipment", phone: "089-111-2222", status: "Active" }
]




const MOCK_CUSTOMERS: Customer[] = [
    { id: "c1", name: "TechStart Inc.", type: "Company", phone: "02-111-2222", address: "Sathorn, Bangkok", status: "Active", taxId: "0105559998887", contactPerson: "Mr. John Doe" },
    { id: "c2", name: "Mr. Anderson", type: "Person", phone: "089-555-4444", lineId: "neo_matrix", address: "88/9 Phuket Villa, Phuket", status: "Active" },
    { id: "c3", name: "Fashion Co.", type: "Company", phone: "02-999-8888", address: "Siam, Bangkok", status: "Active" },
    { id: "c4", name: "Mrs. Linda", type: "Person", phone: "086-777-1111", address: "Riverside Condo, Bangkok", status: "Active" },
    { id: "c5", name: "Industrial Works Ltd.", type: "Company", phone: "02-333-4444", address: "Bangpoo Industrial Estate", status: "Active", taxId: "0115556667778" },
    { id: "c6", name: "Digital Nomads TH", type: "Company", phone: "053-222-333", address: "Nimman, Chiang Mai", status: "Active" }
]

const MOCK_INCOMES: IncomeDocument[] = [
    {
        id: "inc_1",
        documentNumber: "QT-2024001",
        type: "Quotation",
        date: "2024-01-15",
        validUntil: "2024-01-30",
        projectId: "1",
        customerId: "c1",
        mode: "Simple",
        items: [
            { id: "item_1", description: "Renovation Service", quantity: 1, unit: "Job", unitPrice: 50000, total: 50000 }
        ],
        subtotal: 50000,
        discount: 0,
        tax: 3500,
        total: 53500,
        grandTotal: 53500,
        status: "Sent"
    },
    {
        id: "inc_2",
        documentNumber: "BN-2024001",
        type: "Invoice",
        date: "2024-01-20",
        projectId: "1",
        customerId: "c1",
        mode: "Zone",
        sections: [
            {
                id: "sec_1",
                name: "Living Room",
                coverImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600",
                items: [
                    { id: "item_2", description: "Wall Painting", quantity: 50, unit: "sqm", unitPrice: 200, total: 10000 }
                ]
            }
        ],
        subtotal: 10000,
        discount: 0,
        tax: 700,
        total: 10700,
        grandTotal: 10700,
        status: "Invoiced"
    },
    {
        id: "inc_3",
        documentNumber: "QT-2024002",
        type: "Quotation",
        date: "2024-01-25",
        validUntil: "2024-02-10",
        projectId: "2",
        customerId: "c2",
        mode: "Simple",
        items: [
            { id: "item_3_1", description: "Pool Excavation", quantity: 1, unit: "Job", unitPrice: 150000, total: 150000 },
            { id: "item_3_2", description: "Tiles", quantity: 80, unit: "sqm", unitPrice: 500, total: 40000 }
        ],
        subtotal: 190000,
        discount: 10000,
        tax: 12600,
        total: 192600,
        grandTotal: 192600,
        status: "Accepted"
    },
    {
        id: "inc_4",
        documentNumber: "RE-2024001",
        type: "Receipt",
        date: "2024-02-01",
        projectId: "4",
        customerId: "c4",
        mode: "Simple",
        items: [
            { id: "item_4_1", description: "Deposit 50%", quantity: 1, unit: " งวด", unitPrice: 600000, total: 600000 }
        ],
        subtotal: 600000,
        discount: 0,
        tax: 0,
        total: 600000,
        grandTotal: 600000,
        status: "Paid"
    },
    {
        id: "inc_5",
        documentNumber: "QT-2024003",
        type: "Quotation",
        date: "2024-02-05",
        projectId: "5",
        customerId: "c5",
        mode: "Simple",
        items: [
            { id: "item_5_1", description: "Roof Replacement Full Service", quantity: 1500, unit: "sqm", unitPrice: 1200, total: 1800000 },
            { id: "item_5_2", description: "Insulation 5mm", quantity: 1500, unit: "sqm", unitPrice: 350, total: 525000 }
        ],
        subtotal: 2325000,
        discount: 25000,
        tax: 161000,
        total: 2461000,
        grandTotal: 2461000,
        status: "Sent"
    }
]

const MOCK_FILES: ProjectFile[] = [
    { id: "f1", name: "Site Plan A1.pdf", url: "#", type: "pdf", size: "2.5 MB", uploadedAt: "10 Jan 2024", projectId: "1" },
    { id: "f2", name: "Site Photo 1.jpg", url: "#", type: "image", size: "4.1 MB", uploadedAt: "11 Jan 2024", projectId: "1" },
    { id: "f3", name: "Contract v1.docx", url: "#", type: "doc", size: "1.2 MB", uploadedAt: "05 Jan 2024", projectId: "1" },
    { id: "f4", name: "Pool Design.pdf", url: "#", type: "pdf", size: "5.5 MB", uploadedAt: "12 Jan 2024", projectId: "2" }
]

const MOCK_TEAMS: Team[] = [
    {
        id: "1",
        name: "Project Pro HQ",
        address: "123 Construction Road, Bangkok",
        taxId: "0105551234567",
        phone: "02-123-4567",
        email: "hq@hipslothproject.com",
        website: "www.hipslothproject.com",
        logo: "🏢",
        role: "Owner",
        primaryColor: "#0f172a",
        secondaryColor: "#3b82f6"
    },
    {
        id: "2",
        name: "Site Operations",
        address: "88 Industrial Estate, Rayong",
        taxId: "0105559876543",
        phone: "038-111-222",
        email: "site@hipslothproject.com",
        logo: "🏗️",
        role: "Owner",
        primaryColor: "#ea580c",
        secondaryColor: "#fbbf24"
    },
    {
        id: "3",
        name: "Design Studio",
        address: "456 Creative Hub, Chiang Mai",
        taxId: "0505554443332",
        phone: "053-999-888",
        email: "design@hipslothproject.com",
        website: "design.hipslothproject.com",
        logo: "🎨",
        role: "Owner",
        primaryColor: "#7c3aed",
        secondaryColor: "#c084fc"
    }
]

export interface CompanyProfile {
    name: string
    address: string
    taxId: string
    phone: string
    paymentInfo?: string
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    email?: string
    website?: string
}

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
    name: "",
    nameEn: "",
    address: "",
    addressEn: "",
    taxId: "",
    phone: "",
    paymentInfo: "",
    signatureName: "",
    description: "",
    email: "",
    website: "",
    logo: "",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
}

function CoreProjectProvider({ children }: { children: React.ReactNode }) {
    // --- Team / Workspace State (Refactored to SaaS Adapter) ---


    // Mock Projects
    // Real Data State (Initially Empty)
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS as Project[])
    const [files, setFiles] = useState<ProjectFile[]>([])
    // Users are managed by filtering all users (or fetching team users - optimized later)
    // For now, let's keep mock users until we replace them with real user fetch
    const [users, setUsers] = useState<User[]>([])

    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [isAuthLoading, setIsAuthLoading] = useState(true)
    const [isLoading, setIsLoading] = useState(true) // Added for data loading state

    // SaaS Adapter
    const { currentOrg, userOrgs, setCurrentOrg, isLoading: isOrgLoading, createOrganization, refreshOrgs } = useOrganization()

    const [isRedirecting, setIsRedirecting] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('auth_in_progress') === 'true'
        }
        return false
    })

    // Environment Detection Helpers
    const getEnvironment = React.useCallback(() => {
        if (typeof window === 'undefined') return { isIOS: false, isPWA: false, isRestricted: false }
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera
        const isIOS = /iPhone|iPad|iPod/i.test(ua)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
        // Detect Line, Facebook, etc. which usually block Google OAuth
        const isRestricted = /Line|FBAN|FBAV|Instagram/i.test(ua)
        return { isIOS, isPWA, isRestricted }
    }, [])

    const currentTeam: Team | null = React.useMemo(() => {
        if (!currentOrg || !currentUser) return null

        // Prioritize role from real-time user profile
        const userOrgData = currentUser.organizations?.find(o => (typeof o === 'string' ? o : o.orgId) === currentOrg.id)
        const userRole = userOrgData && typeof userOrgData !== 'string' ? userOrgData.role : null

        const member = currentOrg.members?.find(m => m.userId === currentUser.id)
        const role = (currentOrg.ownerId === currentUser.id ? "Owner" : (userRole || member?.role || "Staff")) as "Owner" | "Admin" | "Manager" | "Accountant" | "Staff"

        return {
            id: currentOrg.id,
            name: currentOrg.name,
            nameEn: currentOrg.settings?.nameEn || "",
            role: role,
            address: currentOrg.settings?.address || "",
            addressEn: currentOrg.settings?.addressEn || "",
            taxId: currentOrg.settings?.taxId || "",
            phone: currentOrg.settings?.phone || "",
            email: currentOrg.settings?.email || "",
            website: currentOrg.settings?.website || "",
            logo: currentOrg.settings?.logoUrl,
            description: currentOrg.settings?.description || "",
            paymentInfo: currentOrg.settings?.paymentInfo || "",
            signatureName: currentOrg.settings?.signatureName || ""
        }
    }, [currentOrg, currentUser])

    const teams: Team[] = React.useMemo(() => {
        if (!currentUser) return []
        return userOrgs.map(org => {
            // Prioritize role from real-time user profile
            const userOrgData = currentUser.organizations?.find(o => (typeof o === 'string' ? o : o.orgId) === org.id)
            const userRole = userOrgData && typeof userOrgData !== 'string' ? userOrgData.role : null

            const member = org.members?.find(m => m.userId === currentUser.id)
            const role = (org.ownerId === currentUser.id ? "Owner" : (userRole || member?.role || "Staff")) as "Owner" | "Admin" | "Manager" | "Accountant" | "Staff"

            return {
                id: org.id,
                name: org.name,
                nameEn: org.settings?.nameEn || "",
                role: role,
                address: org.settings?.address || "",
                addressEn: org.settings?.addressEn || "",
                taxId: org.settings?.taxId || "",
                phone: org.settings?.phone || "",
                logo: org.settings?.logoUrl,
                description: org.settings?.description || "",
                paymentInfo: org.settings?.paymentInfo || "",
                signatureName: org.settings?.signatureName || ""
            }
        })
    }, [userOrgs, currentUser])

    const switchTeam = (teamId: string) => {
        const org = userOrgs.find(o => o.id === teamId)
        if (org) setCurrentOrg(org)
    }

    // Derived Company Profile from Current Team (Moved here to fix hoisting)
    const companyProfile: CompanyProfile = currentTeam ? {
        name: currentTeam.name,
        nameEn: currentTeam.nameEn,
        address: currentTeam.address,
        addressEn: currentTeam.addressEn,
        taxId: currentTeam.taxId,
        phone: currentTeam.phone,
        email: currentTeam.email,
        website: currentTeam.website,
        logo: currentTeam.logo,
        primaryColor: currentTeam.primaryColor,
        secondaryColor: currentTeam.secondaryColor,
        description: currentTeam.description,
        paymentInfo: currentTeam.paymentInfo,
        signatureName: currentTeam.signatureName
    } : INITIAL_COMPANY_PROFILE


    const [debugLogs, setDebugLogs] = useState<string[]>([]) // Removed, keeping simple state for cleanliness if needed or just remove lines.
    // Actually, I should remove the whole block.



    // Auth State Listener
    useEffect(() => {
        let userUnsubscribe: (() => void) | null = null

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                // Clear previous listener if exists
                if (userUnsubscribe) {
                    userUnsubscribe()
                    userUnsubscribe = null
                }

                if (firebaseUser) {
                    const userRef = doc(db, "users", firebaseUser.uid)

                    // Real-time listener for User Profile
                    userUnsubscribe = onSnapshot(userRef, async (userSnap) => {
                        if (userSnap.exists()) {
                            const userData = userSnap.data() as User
                            setCurrentUser({ ...userData, id: firebaseUser.uid } as User)

                            // SYNC: Ensure orgIds is in sync with organizations (for legacy data)
                            if (userData.organizations && userData.organizations.length > 0) {
                                const orgIds = userData.organizations.map(o => o.orgId)
                                const currentTeamIds = userData.orgIds || []
                                const missingTeamIds = orgIds.filter(id => !currentTeamIds.includes(id))

                                if (missingTeamIds.length > 0) {
                                    // Background sync
                                    const updatedTeamIds = Array.from(new Set([...currentTeamIds, ...orgIds]))
                                    setDoc(userRef, { orgIds: updatedTeamIds }, { merge: true })
                                        .catch(err => console.warn("Failed to sync orgIds:", err))
                                }
                            }
                        } else {
                            // New User - Check for Placeholder (Invite)
                            const q = query(collection(db, "users"), where("email", "==", firebaseUser.email))
                            const snapshot = await getDocs(q)

                            let initialData: Partial<User> = {}
                            if (!snapshot.empty) {
                                const placeholderDoc = snapshot.docs[0]
                                initialData = placeholderDoc.data() as User
                                // Delete placeholder
                                await deleteDoc(placeholderDoc.ref)
                            }

                            // Create Profile
                            const newUser: User = {
                                id: firebaseUser.uid,
                                name: firebaseUser.displayName || initialData.name || "User",
                                email: firebaseUser.email || "",
                                role: initialData.role || "Member",
                                status: "Active",
                                orgIds: initialData.orgIds || [],
                                organizations: (initialData as any).organizations || [],
                                ...(firebaseUser.photoURL ? { avatar: firebaseUser.photoURL } : {})
                            }
                            await setDoc(userRef, newUser)
                            // Listener will pick this up next update, but we set it optimistically
                            setCurrentUser(newUser)
                        }
                        setIsAuthLoading(false)
                    }, (error) => {
                        console.error("User snapshot error:", error)
                        setIsAuthLoading(false)
                    })

                } else {
                    setCurrentUser(null)
                    setIsAuthLoading(false)
                }
            } catch (error) {
                console.error("Auth state processing failed:", error)
                setIsAuthLoading(false)
            }
        })
        return () => {
            unsubscribe()
            if (userUnsubscribe) userUnsubscribe()
        }
    }, [])

    // Handle Redirect Result (for Mobile/PWA)
    useEffect(() => {
        const handleRedirect = async () => {
            const { isIOS, isPWA } = getEnvironment()
            const authInProgress = typeof window !== 'undefined' && sessionStorage.getItem('auth_in_progress') === 'true'

            // Only show redirecting state if we actually expect a redirect
            if ((isIOS || isPWA) && authInProgress) {
                setIsRedirecting(true)
            } else {
                // If not in a known redirect flow, ensure it's false
                setIsRedirecting(false)
                return
            }

            try {
                const result = await getRedirectResult(auth)
                if (result) {
                    console.log("Logged in via redirect", result.user.email)
                } else {
                    // Timeout safety
                    setTimeout(() => {
                        setIsRedirecting(false)
                        if (typeof window !== 'undefined') sessionStorage.removeItem('auth_in_progress')
                    }, 2000)
                }
            } catch (error: any) {
                console.warn("Redirect login non-fatal error:", error)
                setIsRedirecting(false)
                if (typeof window !== 'undefined') sessionStorage.removeItem('auth_in_progress')
            }
        }
        handleRedirect()
    }, [getEnvironment])

    // Clear Redirecting State when User is confirmed
    useEffect(() => {
        if (currentUser) {
            setIsRedirecting(false)
            if (typeof window !== 'undefined') sessionStorage.removeItem('auth_in_progress')
        }
    }, [currentUser])







    const login = async (provider: string, credentials?: { email?: string, password?: string }) => {
        setIsAuthLoading(true)

        try {
            if (provider === 'google') {
                const { isIOS, isPWA, isRestricted } = getEnvironment()

                if (isRestricted) {
                    throw new Error("SOCIAL_WEBVIEW_BLOCKED")
                }

                // PWA/Mobile & Desktop: Use Popup
                // CRITICAL: Must not await setPersistence before popup, or iOS blocks it.
                setPersistence(auth, browserLocalPersistence).catch(console.error)

                try {
                    await signInWithPopup(auth, googleProvider)
                } catch (error: any) {
                    console.error("Popup login failed:", error)
                    if (error.code === 'auth/popup-closed-by-user') {
                        throw new Error("Login cancelled")
                    } else if (error.code === 'auth/popup-blocked') {
                        throw new Error("Popup blocked. Please allow popups for this site.")
                    }
                    throw error
                }
            } else if ((provider === 'email' || provider === 'credentials') && credentials?.email && credentials?.password) {
                await setPersistence(auth, browserLocalPersistence)
                await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
            }
        } catch (error: any) {
            setIsAuthLoading(false)
            setIsRedirecting(false)
            if (error.message === "SOCIAL_WEBVIEW_BLOCKED") {
                throw error // Pass through for UI to handle
            }
            console.error("Login failed", error)
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error("Login cancelled")
            }
            throw error
        }
    }


    const register = async (name: string, email: string, password: string) => {
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const firebaseUser = userCredential.user

            // 2. Update Profile Name
            await updateProfile(firebaseUser, { displayName: name })

            // 3. Create Firestore User Doc (Check for Placeholder)
            const q = query(collection(db, "users"), where("email", "==", email))
            const snapshot = await getDocs(q)

            let initialData: Partial<User> = {}
            if (!snapshot.empty) {
                const placeholderDoc = snapshot.docs[0]
                initialData = placeholderDoc.data() as User
                await deleteDoc(placeholderDoc.ref)
            }

            const newUser: User = {
                id: firebaseUser.uid,
                name: name,
                email: email,
                role: initialData.role || "Member",
                status: "Active",
                orgIds: initialData.orgIds || [],
                // avatar: undefined, // Removed to avoid Firestore error
                theme: "system", // Default to system
                joinedDate: new Date().toISOString()
            }

            await setDoc(doc(db, "users", firebaseUser.uid), newUser)

            // 4. Update State
            setCurrentUser(newUser)

        } catch (error) {
            console.error("Registration failed", error)
            throw error
        }
    }

    const updateUserPassword = async (password: string) => {
        if (!auth.currentUser) return
        try {
            await updatePassword(auth.currentUser, password)
        } catch (error) {
            console.error("Failed to update password", error)
            throw error
        }
    }

    const deleteAccount = async (password?: string) => {
        if (!auth.currentUser) return

        try {
            const user = auth.currentUser
            const providerId = user.providerData[0]?.providerId

            // Re-authenticate
            if (providerId === 'google.com') {
                await reauthenticateWithPopup(user, googleProvider)
            } else if (providerId === 'password') {
                if (!password) throw new Error("Password confirmation required")
                if (!user.email) throw new Error("User email not found")

                const credential = EmailAuthProvider.credential(user.email, password)
                await reauthenticateWithCredential(user, credential)
            }

            const uid = user.uid

            // 1. Delete Firestore Data
            await deleteDoc(doc(db, "users", uid))

            // 2. Delete Auth Account
            await deleteAuthUser(user)

            // 3. Cleanup
            setCurrentUser(null)
            window.location.href = "/"

        } catch (error) {
            console.error("Delete account failed", error)
            throw error
        }
    }

    const logout = async () => {
        try {
            await signOut(auth)
            // Clear all local state
            setCurrentUser(null)
            // Teams/CurrentTeam handled by OrgContext


            // Clear persistence
            if (typeof window !== 'undefined') {
                localStorage.removeItem("projectpro_teamid")
                sessionStorage.removeItem("app_security_unlocked")
                // Optional: Clear other app-specific storage if needed
            }
        } catch (error) {
            console.error("Logout failed", error)
        }
    }



    // Load User's Teams (Real-time) - REMOVED (Handled by OrganizationContext)


    // --- Real-time Data Sync ---
    useEffect(() => {
        if (!currentTeam?.id) {
            // If no team, clear everything
            setProjects([])
            setUsers([])
            setFiles([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        // ORG ISOLATION: Clear current data state to prevent leaks while loading next org
        setProjects([])
        setUsers([])
        setFiles([])

        // Create tracking flags to prevent update flashes
        const snapshotLoaded = {
            projects: false,
            users: false,
            files: false
        }

        // 1. Projects
        const qProjects = query(collection(db, "projects"), where("orgId", "==", currentTeam.id))
        const unsubProjects = onSnapshot(qProjects, (snap) => {
            snapshotLoaded.projects = true
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Project))
            setProjects(data)
            setIsLoading(false)
        }, (error) => {
            console.error(`[ProjectContext] Projects sync error for org ${currentTeam.id}:`, error.code, error.message)
            setIsLoading(false)
        })

        // 9. Team Members (Merged from OrgIds and TeamIds)
        const qUsersOrgIds = query(collection(db, "users"), where("orgIds", "array-contains", currentTeam.id))
        const qUsersTeamIds = query(collection(db, "users"), where("teamIds", "array-contains", currentTeam.id))

        let usersFromOrgIds: User[] = []
        let usersFromTeamIds: User[] = []

        const mergeUsers = () => {
            snapshotLoaded.users = true
            const allUsers = [...usersFromOrgIds, ...usersFromTeamIds]
            const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.id, u])).values()).map(u => {
                // ORG-SPECIFIC ROLE SYNC:
                // Use the role from the organizations array specifically for this team
                const orgMembership = u.organizations?.find(o => o.orgId === currentTeam.id)
                return {
                    ...u,
                    role: orgMembership?.role || u.role || "Staff"
                }
            })
            setUsers(uniqueUsers)
        }

        const unsubUsersOrgIds = onSnapshot(qUsersOrgIds, (snap) => {
            usersFromOrgIds = snap.docs.map(d => ({ ...d.data(), id: d.id } as User))
            mergeUsers()
        }, (error) => console.error(`[ProjectContext] User Org sync error for org ${currentTeam.id}:`, error.code, error.message))

        const unsubUsersTeamIds = onSnapshot(qUsersTeamIds, (snap) => {
            usersFromTeamIds = snap.docs.map(d => ({ ...d.data(), id: d.id } as User))
            mergeUsers()
        }, (error) => console.error(`[ProjectContext] User Team sync error for org ${currentTeam.id}:`, error.code, error.message))

        // 10. Files
        const qFiles = query(collection(db, "files"), where("orgId", "==", currentTeam.id))
        const unsubFiles = onSnapshot(qFiles, (snap) => {
            snapshotLoaded.files = true
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ProjectFile))
            setFiles(data)
        }, (error) => console.error(`[ProjectContext] Files sync error for org ${currentTeam.id}:`, error.code, error.message))

        return () => {
            unsubProjects()
            unsubUsersOrgIds()
            unsubUsersTeamIds()
            unsubFiles()
        }
    }, [currentTeam?.id])


    const seedData = async () => {
        if (!currentTeam || !currentUser) return
        await seedDatabase(currentTeam.id, currentUser.id)
    }






    // Save data whenever it changes



    // --- CRUD Operations (Firestore) ---

    // 1. Projects
    const addProject = async (project: Omit<Project, "id">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "projects"), {
                ...project,
                orgId: currentTeam.id,
                createdAt: new Date().toISOString()
            })

            // Log Activity
            await logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "PROJECT",
                entityId: "",
                entityTitle: project.name,
                details: `Created new project: ${project.name}`,
                performedBy: {
                    uid: currentUser?.id || "unknown",
                    name: currentUser?.name || "Unknown",
                    role: currentUser?.role || "Staff"
                },
                relatedUserIds: []
            })

        } catch (e) {
            console.error("Error adding project", e)
        }
    }

    const updateProject = async (id: string, updates: Partial<Project>) => {
        try {
            await updateDoc(doc(db, "projects", id), { ...updates, updatedAt: new Date().toISOString() })
        } catch (e) {
            console.error("Error updating project", e)
        }

        if (currentTeam && currentUser) {
            logActivity(db, currentTeam.id, {
                action: "UPDATE",
                entityType: "PROJECT",
                entityId: id,
                entityTitle: updates.name || "Project",
                details: `Updated project details`,
                performedBy: {
                    uid: currentUser.id,
                    name: currentUser.name,
                    role: currentUser.role
                },
                relatedUserIds: []
            })
        }
    }

    const deleteProject = async (id: string) => {
        try {
            await deleteDoc(doc(db, "projects", id))
        } catch (e) {
            console.error("Error deleting project", e)
        }

        if (currentTeam && currentUser) {
            const proj = projects.find(p => p.id === id)
            logActivity(db, currentTeam.id, {
                action: "DELETE",
                entityType: "PROJECT",
                entityId: id,
                entityTitle: proj?.name || "Unknown Project",
                details: `Deleted project`,
                performedBy: {
                    uid: currentUser.id,
                    name: currentUser.name,
                    role: currentUser.role
                },
                relatedUserIds: []
            })
        }
    }

    // ========== ARCHIVE SYSTEM ==========
    // ========== ARCHIVE SYSTEM (Projects) ==========
    const archiveProject = async (id: string) => {
        try {
            await updateDoc(doc(db, "projects", id), { isArchived: true })
        } catch (e) {
            console.error("Error archiving project", e)
        }
    }

    const unarchiveProject = async (id: string) => {
        try {
            await updateDoc(doc(db, "projects", id), { isArchived: false })
        } catch (e) {
            console.error("Error unarchiving project", e)
        }
    }

    const getProject = (id: string) => {
        const project = projects.find(p => p.id === id)
        return project
    }

    // Work actions migrated to TaskContext

    // Add Sub-project (โปรเจคย่อย)
    const addSubProject = async (projectId: string, subProject: Omit<SubProject, "id">) => {
        const project = projects.find(p => p.id === projectId)
        if (!project) return

        const newSubProject = { ...subProject, id: Math.random().toString(36).substr(2, 9) }
        const updatedSubProjects = [...(project.subProjects || []), newSubProject]

        // Optimistic Update
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, subProjects: updatedSubProjects } : p))

        try {
            await updateDoc(doc(db, "projects", projectId), { subProjects: updatedSubProjects })
        } catch (e) {
            console.error("Error adding sub-project", e)
        }
    }

    const deleteSubProject = async (projectId: string, subProjectId: string) => {
        const project = projects.find(p => p.id === projectId)
        if (!project || !project.subProjects) return

        const updatedSubProjects = project.subProjects.filter(sp => sp.id !== subProjectId)

        // Optimistic Update
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, subProjects: updatedSubProjects } : p))

        try {
            await updateDoc(doc(db, "projects", projectId), { subProjects: updatedSubProjects })
        } catch (e) {
            console.error("Error deleting sub-project", e)
        }
    }

    // Finance actions migrated to FinanceContext


    // User CRUD
    // User CRUD
    const addUser = async (userData: Omit<User, "id" | "joinedDate" | "status" | "orgIds">) => {
        if (!currentTeam) return
        try {
            // 1. Check if user with this email already exists
            const q = query(collection(db, "users"), where("email", "==", userData.email))
            const snapshot = await getDocs(q)

            if (!snapshot.empty) {
                // User exists - Update their permissions
                const existingUserDoc = snapshot.docs[0]
                const existingUserData = existingUserDoc.data() as User

                // Check if already in this org
                if (existingUserData.orgIds?.includes(currentTeam.id)) {
                    return
                }

                // Add to Org
                const updatedOrgIds = [...(existingUserData.orgIds || []), currentTeam.id]
                const updatedOrganizations = [
                    ...(existingUserData.organizations || []),
                    { orgId: currentTeam.id, role: userData.role || "Staff" }
                ]

                await updateDoc(doc(db, "users", existingUserDoc.id), {
                    orgIds: updatedOrgIds,
                    organizations: updatedOrganizations
                })

                // 2. Synchronize with Organization Document
                const orgRef = doc(db, "organizations", currentTeam.id)
                const orgSnap = await getDoc(orgRef)
                if (orgSnap.exists()) {
                    const orgData = orgSnap.data()
                    const members = orgData.members || []
                    const memberIds = orgData.memberIds || []

                    if (!members.find((m: any) => m.userId === existingUserDoc.id)) {
                        await updateDoc(orgRef, {
                            members: [...members, {
                                userId: existingUserDoc.id,
                                role: userData.role || "Staff",
                                joinedAt: new Date().toISOString()
                            }],
                            memberIds: Array.from(new Set([...memberIds, existingUserDoc.id]))
                        })
                    }
                }

                await logActivity(db, currentTeam.id, {
                    action: "UPDATE",
                    entityType: "USER",
                    entityId: existingUserDoc.id,
                    entityTitle: userData.name,
                    details: `${userData.name} was added to the organization.`,
                    performedBy: {
                        uid: currentUser?.id || "system",
                        name: currentUser?.name || "System",
                        role: currentTeam.role || "Staff"
                    },
                    relatedUserIds: [existingUserDoc.id]
                })

            } else {
                // 3. User does not exist - Create new placeholder
                const docRef = await addDoc(collection(db, "users"), {
                    ...userData,
                    joinedDate: new Date().toISOString().split('T')[0],
                    status: "Pending", // Default to Pending for invites
                    orgIds: [currentTeam.id],
                    organizations: [{ // Forward compatibility
                        orgId: currentTeam.id,
                        role: userData.role || "Staff"
                    }],
                    role: userData.role || "Staff"
                })

                // 4. Synchronize with Organization Document
                const orgRef = doc(db, "organizations", currentTeam.id)
                const orgSnap = await getDoc(orgRef)
                if (orgSnap.exists()) {
                    const orgData = orgSnap.data()
                    const members = orgData.members || []
                    const memberIds = orgData.memberIds || []
                    await updateDoc(orgRef, {
                        members: [...members, {
                            userId: docRef.id,
                            role: userData.role || "Staff",
                            joinedAt: new Date().toISOString()
                        }],
                        memberIds: Array.from(new Set([...memberIds, docRef.id]))
                    })
                }

                await logActivity(db, currentTeam.id, {
                    action: "CREATE",
                    entityType: "USER",
                    entityId: docRef.id,
                    entityTitle: userData.name,
                    details: `Invitation sent to ${userData.email} (${userData.name})`,
                    performedBy: {
                        uid: currentUser?.id || "system",
                        name: currentUser?.name || "System",
                        role: currentTeam.role || "Staff"
                    },
                    relatedUserIds: [docRef.id]
                })
            }

        } catch (e) {
            console.error("Error adding user", e)
        }
    }

    const updateUser = async (id: string, updates: Partial<User>) => {
        const isSelf = currentUser?.id === id
        const { role, ...otherUpdates } = updates

        // Optimistic Update
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
        if (isSelf) {
            setCurrentUser(prev => (prev ? { ...prev, ...updates } : null))
        }

        try {
            // 1. Update User Document
            // IMPORTANT: If updating someone else, we MUST NOT touch top-level 'role' 
            // as it is protected. Instead, we update the organization-specific role below.
            const updatesToApply = isSelf ? updates : otherUpdates
            if (Object.keys(updatesToApply).length > 0) {
                await updateDoc(doc(db, "users", id), updatesToApply)
            }

            // 2. Synchronize Organizations array in User Document if role changed
            if (role && currentTeam) {
                const userRef = doc(db, "users", id)
                const userSnap = await getDoc(userRef)
                if (userSnap.exists()) {
                    const userData = userSnap.data()
                    const organizations = userData.organizations || []
                    // Robust check: Find and replace or Add if missing
                    const existingIndex = organizations.findIndex((org: any) =>
                        (typeof org === 'string' ? org : org.orgId) === currentTeam.id
                    )

                    let updatedOrgs
                    if (existingIndex >= 0) {
                        updatedOrgs = [...organizations]
                        const existingOrg = organizations[existingIndex]
                        updatedOrgs[existingIndex] = typeof existingOrg === 'string'
                            ? { orgId: existingOrg, role: role }
                            : { ...existingOrg, role: role }
                    } else {
                        updatedOrgs = [...organizations, { orgId: currentTeam.id, role: role }]
                    }

                    await updateDoc(userRef, {
                        organizations: updatedOrgs,
                        // Ensure mirror IDs are present too
                        orgIds: Array.from(new Set([...(userData.orgIds || []), currentTeam.id])),
                        teamIds: Array.from(new Set([...(userData.teamIds || []), currentTeam.id])),
                        organizationIds: Array.from(new Set([...(userData.organizationIds || []), currentTeam.id]))
                    })
                }

                // 3. Synchronize Organization Document members list
                const orgRef = doc(db, "organizations", currentTeam.id)
                const orgSnap = await getDoc(orgRef)
                if (orgSnap.exists()) {
                    const orgData = orgSnap.data()
                    const members = orgData.members || []
                    // Robust check: Find and replace or Add if missing
                    const memberIndex = members.findIndex((m: any) => m.userId === id)

                    let updatedMembers
                    if (memberIndex >= 0) {
                        updatedMembers = [...members]
                        updatedMembers[memberIndex] = { ...members[memberIndex], role: role }
                    } else {
                        updatedMembers = [...members, { userId: id, role: role, joinedAt: new Date().toISOString() }]
                    }

                    await updateDoc(orgRef, {
                        members: updatedMembers,
                        // Ensure memberIds is in sync
                        memberIds: Array.from(new Set([...(orgData.memberIds || []), id]))
                    })

                    // 4. Refresh org context to update currentOrg with new role
                    refreshOrgs()
                }
            }
        } catch (e) {
            console.error("Error updating user", e)
        }
    }

    const deleteUser = async (id: string) => {
        if (!currentTeam) return
        try {
            // Call Cloud Function to remove user from org
            // Region MUST match backend deployment (asia-southeast1)
            const functions = getFunctions(undefined, 'asia-southeast1')
            const removeUser = httpsCallable(functions, 'removeUserFromOrg')

            await removeUser({
                userId: id,
                orgId: currentTeam.id
            })

            // Allow UI to update via snapshot listener or optimistic update if needed
            // For now, snapshot listener on users collection should handle it if we filter by org properly?
            // ProjectContext loads ALL users currently (line 781), needing optimization.
            // But since `users` state is likely not real-time updated for all users in `ProjectProvider` yet (it was Mock/Initial),
            // we should manually update the local state to match the "remove" action
            setUsers(prev => prev.filter(u => u.id !== id))

        } catch (e) {
            console.error("Error deleting user", e)
            alert("Failed to remove user. Please try again.")
        }
    }

    // Customer/Vendor/Worker CRUD migrated to FinanceContext

    // 3. Files
    const addFile = async (file: Omit<ProjectFile, "id" | "uploadedAt">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "files"), {
                ...file,
                orgId: currentTeam.id,
                uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            })
        } catch (e) {
            console.error("Error adding file", e)
        }

        if (currentTeam && currentUser) {
            logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "FILE",
                entityId: "",
                entityTitle: file.name,
                details: `Uploaded file(${file.type})`,
                performedBy: {
                    uid: currentUser.id,
                    name: currentUser.name,
                    role: currentUser.role
                },
                relatedUserIds: []
            })
        }
    }

    const deleteFile = async (id: string) => {
        try {
            await deleteDoc(doc(db, "files", id))
        } catch (e) {
            console.error("Error deleting file", e)
        }
    }

    const updateCompanyProfile = async (updates: Partial<CompanyProfile>) => {
        if (!currentTeam) return

        try {
            // Update Firestore (Organization)
            // Map CompanyProfile fields to Organization settings
            const orgRef = doc(db, "organizations", currentTeam.id)

            const orgUpdates: any = {}
            if (updates.name) orgUpdates.name = updates.name
            if (updates.nameEn !== undefined) orgUpdates['settings.nameEn'] = updates.nameEn

            // Settings map
            if (updates.address) orgUpdates['settings.address'] = updates.address
            if (updates.addressEn !== undefined) orgUpdates['settings.addressEn'] = updates.addressEn
            if (updates.taxId) orgUpdates['settings.taxId'] = updates.taxId
            if (updates.phone) orgUpdates['settings.phone'] = updates.phone
            if (updates.logo) orgUpdates['settings.logoUrl'] = updates.logo
            if (updates.email) orgUpdates['settings.email'] = updates.email
            if (updates.website) orgUpdates['settings.website'] = updates.website
            if (updates.paymentInfo !== undefined) orgUpdates['settings.paymentInfo'] = updates.paymentInfo
            if (updates.signatureName !== undefined) orgUpdates['settings.signatureName'] = updates.signatureName
            if (updates.description !== undefined) orgUpdates['settings.description'] = updates.description

            await updateDoc(orgRef, { ...orgUpdates, updatedAt: new Date().toISOString() })

            // Refresh organization data to update local state (currentTeam)
            await refreshOrgs()

        } catch (e) {
            console.error("Error updating company profile", e)
        }
    }

    const restoreData = async (data: Record<string, unknown>) => {
        try {
            if (data.projects) setProjects(data.projects as Project[])
            if (data.files) setFiles(data.files as ProjectFile[])
            if (data.users) setUsers(data.users as User[])

            return true
        } catch (e) {
            console.error("Restore failed", e)
            return false
        }
    }

    const filteredProjects = React.useMemo(() =>
        projects.filter(p => p.orgId === currentTeam?.id),
        [projects, currentTeam?.id])

    const filteredProjectIds = React.useMemo(() =>
        new Set(filteredProjects.map(p => p.id)),
        [filteredProjects])

    // Contracts migrated to FinanceContext

    const value = React.useMemo(() => ({
        projects: filteredProjects.filter(p => !p.isArchived),
        addProject,
        updateProject,
        deleteProject,
        getProject,

        // Teams
        teams,
        currentTeam,
        switchTeam,
        addTeam: async (name: string) => {
            return await createOrganization(name)
        },

        addSubProject,
        deleteSubProject,

        users: users.filter(u => u.orgIds?.includes(currentTeam?.id || '')),
        addUser,
        updateUser,
        deleteUser,

        companyProfile,
        updateCompanyProfile,
        currentUser,
        setCurrentUser,
        isAuthLoading,
        isOrgLoading,
        isLoading,
        login,
        register,
        updateUserPassword,
        logout,
        deleteAccount,
        restoreData,
        seedData,
        files: files.filter(f => !f.projectId || filteredProjectIds.has(f.projectId)),
        addFile,
        deleteFile,

        // Archive System
        archiveProject,
        unarchiveProject,

        // Archived data for Archive page
        archivedProjects: projects.filter(p => p.isArchived === true),
        isRedirecting,
        getEnvironment
    }), [
        filteredProjects,
        addProject,
        updateProject,
        deleteProject,
        getProject,
        teams,
        currentTeam,
        switchTeam,
        createOrganization,
        addSubProject,
        deleteSubProject,
        companyProfile,
        updateCompanyProfile,
        currentUser,
        setCurrentUser,
        isAuthLoading,
        isOrgLoading,
        isLoading,
        login,
        register,
        updateUserPassword,
        logout,
        deleteAccount,
        restoreData,
        seedData,
        files,
        addFile,
        deleteFile,
        archiveProject,
        unarchiveProject,
        projects,
        isRedirecting,
        getEnvironment,
        filteredProjectIds,
        users
    ])

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    )
}

/**
 * High-performance domain provider wrapper
 * We move the providers OUTSIDE of the main ProjectProvider 
 * so that useProjects can safely consume them within its aggregator logic.
 */
export function ProjectProvider({ children }: { children: React.ReactNode }) {
    return (
        <CoreProjectProvider>
            <DomainProvidersBridge>
                {children}
            </DomainProvidersBridge>
        </CoreProjectProvider>
    )
}

function DomainProvidersBridge({ children }: { children: React.ReactNode }) {
    const { currentUser } = useContext(ProjectContext)!
    return (
        <TaskProvider currentUser={currentUser}>
            <FinanceProvider currentUser={currentUser}>
                <SocialProvider currentUser={currentUser}>
                    {children}
                </SocialProvider>
            </FinanceProvider>
        </TaskProvider>
    )
}

export function useProjects() {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error("useProjects must be used within a ProjectProvider")
    }

    // AGGREGATE DOMAIN CONTEXTS
    // This allows existing components to keep using useProjects() 
    // while benefiting from the split context performance.
    const taskCtx = useTasks()
    const financeCtx = useFinance()
    const socialCtx = useSocial()

    return useMemo(() => ({
        ...context,
        // Tasks
        tasks: taskCtx.tasks,
        archivedTasks: taskCtx.archivedTasks,
        works: taskCtx.works,
        addTask: taskCtx.addTask,
        updateTask: taskCtx.updateTask,
        deleteTask: taskCtx.deleteTask,
        toggleTask: taskCtx.toggleTask,
        archiveTask: taskCtx.archiveTask,
        unarchiveTask: taskCtx.unarchiveTask,
        setTasks: taskCtx.setTasks,
        loadMoreTasks: taskCtx.loadMoreTasks,
        loadArchivedTasks: taskCtx.loadArchivedTasks,

        // Finance
        expenses: financeCtx.expenses,
        archivedExpenses: financeCtx.archivedExpenses,
        incomes: financeCtx.incomes,
        vendors: financeCtx.vendors,
        customers: financeCtx.customers,
        workers: financeCtx.workers,
        contracts: financeCtx.contracts,
        addProject: context.addProject,
        updateProject: context.updateProject,
        deleteProject: context.deleteProject,
        addExpense: financeCtx.addExpense,
        updateExpense: financeCtx.updateExpense,
        deleteExpense: financeCtx.deleteExpense,
        addIncome: financeCtx.addIncome,
        updateIncome: financeCtx.updateIncome,
        deleteIncome: financeCtx.deleteIncome,
        addVendor: financeCtx.addVendor,
        updateVendor: financeCtx.updateVendor,
        deleteVendor: financeCtx.deleteVendor,
        addWorker: financeCtx.addWorker,
        updateWorker: financeCtx.updateWorker,
        deleteWorker: financeCtx.deleteWorker,
        addCustomer: financeCtx.addCustomer,
        updateCustomer: financeCtx.updateCustomer,
        deleteCustomer: financeCtx.deleteCustomer,
        addContract: financeCtx.addContract,
        updateContract: financeCtx.updateContract,
        deleteContract: financeCtx.deleteContract,
        payInstallment: financeCtx.payInstallment,
        archiveExpense: financeCtx.archiveExpense,
        unarchiveExpense: financeCtx.unarchiveExpense,
        archiveIncome: financeCtx.archiveIncome,
        unarchiveIncome: financeCtx.unarchiveIncome,
        loadArchivedExpenses: financeCtx.loadArchivedExpenses,
        loadArchivedIncomes: financeCtx.loadArchivedIncomes,

        // Social
        posts: socialCtx.posts,
        addPost: socialCtx.addPost,
        updatePost: socialCtx.updatePost,
        deletePost: socialCtx.deletePost,
        toggleLike: socialCtx.toggleLike,

        // Loading states
        isTasksLoading: taskCtx.isLoading,
        isFinanceLoading: financeCtx.isLoading,
        isSocialLoading: socialCtx.isLoading,
        isArchivedLoading: financeCtx.isArchivedLoading
    }), [context, taskCtx, financeCtx, socialCtx])
}
