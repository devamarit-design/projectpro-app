"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { get, set } from "idb-keyval"
import { auth, googleProvider, db } from "@/lib/firebase"
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, updateDoc, deleteDoc, documentId, orderBy } from "firebase/firestore"
import { seedDatabase } from "@/lib/seed-data"

export type ProjectStatus = "Planning" | "In Progress" | "On Hold" | "Completed"
export type TaskStatus = "Todo" | "In Progress" | "Done"
export type Priority = "High" | "Medium" | "Low"

export interface ProjectTask {
    id: string
    title: string
    status: TaskStatus
    priority: Priority
    assignedTo?: string
    dueDate?: string
    description?: string
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

export interface CompanyProfile {
    name: string
    address: string
    taxId: string
    phone: string
    logo?: string
    paymentInfo?: string
    signatureName?: string
    description?: string // Added description
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
}

export type ExpenseCategory = "Material" | "Labor" | "Sub-contract" | "Other"

export interface ExpenseItem {
    id: string
    description: string
    amount: number
    category: ExpenseCategory
    projectId?: string
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
    teamId?: string
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
    subProjects?: SubProject[] // โปรเจคย่อย - separate from Tasks
    teamId?: string // Workspace/Team ID
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
    status: "Active" | "Inactive"
    teamIds: string[] // Teams this user belongs to
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
    teamId?: string
}

export interface Worker {
    id: string
    name: string
    role: "Technician" | "Contractor" | "Foreman" | "Engineer" | "Architect" | "Worker" | "Other"
    phone?: string
    lineId?: string
    location?: string
    skills?: string[]
    dailyRate?: number
    rating?: number
    status: "Active" | "Inactive"
    joinedDate?: string
    teamId?: string
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
    teamId?: string
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
}

export interface Contract {
    id: string
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
}



export interface Team extends CompanyProfile {
    id: string
    name: string
    logo?: string // Emoji or Image URL
    role: "Owner" | "Member"
}

interface ProjectContextType {
    projects: Project[]
    addProject: (project: Omit<Project, "id">) => void
    updateProject: (id: string, updates: Partial<Project>) => void
    deleteProject: (id: string) => void
    getProject: (id: string) => Project | undefined

    // Team / Workspace
    teams: Team[]
    currentTeam: Team | null
    switchTeam: (teamId: string) => void
    addTeam: (name: string) => void

    // Task Management
    addTask: (projectId: string, task: Omit<ProjectTask, "id">) => void
    updateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void
    deleteTask: (projectId: string, taskId: string) => void
    toggleTask: (projectId: string, taskId: string) => void

    // Sub-project Management (โปรเจคย่อย)
    addSubProject: (projectId: string, subProject: Omit<SubProject, "id">) => void

    // Expense Management
    expenses: Expense[]
    addExpense: (expense: Omit<Expense, "id">) => void
    updateExpense: (id: string, updates: Partial<Expense>) => void
    deleteExpense: (id: string) => void

    // Master Data
    users: User[]
    vendors: Vendor[]
    addUser: (user: Omit<User, "id" | "joinedDate" | "status" | "teamIds">) => void
    updateUser: (id: string, updates: Partial<User>) => void
    deleteUser: (id: string) => void

    workers: Worker[]
    addWorker: (worker: Omit<Worker, "id" | "status">) => void
    updateWorker: (id: string, updates: Partial<Worker>) => void
    deleteWorker: (id: string) => void

    addVendor: (vendor: Omit<Vendor, "id" | "status">) => void
    updateVendor: (id: string, updates: Partial<Vendor>) => void
    deleteVendor: (id: string) => void

    // Customer Management
    customers: Customer[]
    addCustomer: (customer: Omit<Customer, "id" | "status" | "totalValue">) => void
    updateCustomer: (id: string, updates: Partial<Customer>) => void
    deleteCustomer: (id: string) => void

    // Income
    incomes: IncomeDocument[]
    addIncome: (income: Omit<IncomeDocument, "id">) => void
    updateIncome: (id: string, updates: Partial<IncomeDocument>) => void
    deleteIncome: (id: string) => void
    // File Management
    files: ProjectFile[]
    addFile: (file: Omit<ProjectFile, "id" | "uploadedAt">) => void
    deleteFile: (id: string) => void

    // Company Profile
    companyProfile: CompanyProfile
    updateCompanyProfile: (updates: Partial<CompanyProfile>) => Promise<void>

    // Contracts
    contracts: Contract[]
    addContract: (contract: Omit<Contract, "id" | "createdAt" | "status">) => void
    payInstallment: (contractId: string, installmentId: string) => void
    deleteContract: (id: string) => void
    updateContract: (id: string, updates: Partial<Contract>) => void

    currentUser: User | null
    setCurrentUser: (user: User | null) => void
    login: (provider: string, credentials?: { email?: string, password?: string }) => Promise<void>
    logout: () => void
    // Backup & Restore
    restoreData: (data: any) => Promise<boolean>
    seedData: () => Promise<void>
}


const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// Initial Mock Data
const INITIAL_PROJECTS: Project[] = [
    {
        id: "1",
        name: "Modern Office Complex",
        customer: "TechStart Inc.",
        location: "Bangkok, Thailand",
        status: "In Progress",
        progress: 65,
        budget: "฿12,500,000",
        income: "฿8,000,000",
        expenses: "฿7,500,000",
        startDate: "2024-01-15",
        endDate: "2024-11-30",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        description: "Renovation of existing office space including new electrical systems, HVAC, and interior design for a modern tech workspace.",
        tasks: [
            { id: "1-1", title: "Complete electrical wiring", status: "Done", priority: "High", dueDate: "2024-03-15", assignedTo: "Foreman Chai" },
            { id: "1-2", title: "Install HVAC system", status: "In Progress", priority: "Medium", dueDate: "2024-04-01", assignedTo: "Electrician Jo" },
            { id: "1-3", title: "Interior painting", status: "Todo", priority: "Low", dueDate: "2024-05-10" }
        ],
        teamId: '1' // Headquarters
    },
    {
        id: "2",
        name: "Luxury Villa Renovation",
        customer: "Mr. Anderson",
        location: "Phuket, Thailand",
        status: "Planning",
        progress: 15,
        budget: "฿8,200,000",
        income: "฿1,500,000",
        expenses: "฿500,000",
        startDate: "2024-03-01",
        endDate: "2024-08-30",
        image: "https://images.unsplash.com/photo-1600596542815-e32c2159c82c?w=800&q=80",
        description: "Complete overhaul of a 3-bedroom pool villa, including landscape redesign and smart home integration.",
        tasks: [
            { id: "2-1", title: "Excavate pool area", status: "Done", priority: "High", dueDate: "2024-03-10", assignedTo: "Team Alpha" },
            { id: "2-2", title: "Smart home wiring", status: "Todo", priority: "Medium", dueDate: "2024-04-15" }
        ],
        teamId: '2' // Site Operations
    },
    {
        id: "3",
        name: "Urban Retail Store",
        customer: "Fashion Co.",
        location: "Siam Square, Bangkok",
        status: "On Hold",
        progress: 45,
        budget: "฿4,500,000",
        income: "฿2,000,000",
        expenses: "฿1,800,000",
        startDate: "2024-02-10",
        endDate: "2024-05-20",
        image: "https://images.unsplash.com/photo-1556740758-90de2742dd28?w=800&q=80",
        description: "Interior fit-out for a new flagship retail store in a high-traffic shopping district.",
        teamId: '3' // Design Studio
    },
    {
        id: "4",
        name: "Riverside Condo Interior",
        customer: "Mrs. Linda",
        location: "Charoen Nakhon, Bangkok",
        status: "Completed",
        progress: 100,
        budget: "฿1,200,000",
        income: "฿1,200,000",
        expenses: "฿950,000",
        startDate: "2023-11-01",
        endDate: "2024-01-15",
        image: "https://images.unsplash.com/photo-1502005229762-cf1e25e7c667?w=800&q=80",
        description: "Modern minimalist interior design for a 2-bedroom condo unit with custom built-in furniture.",
        tasks: [
            { id: "4-1", title: "Final Inspection", status: "Done", priority: "High", dueDate: "2024-01-14", assignedTo: "Foreman Chai" }
        ],
        teamId: '3' // Design Studio
    },
    {
        id: "5",
        name: "Factory Roof Repair",
        customer: "Industrial Works Ltd.",
        location: "Samut Prakan",
        status: "In Progress",
        progress: 30,
        budget: "฿3,500,000",
        income: "฿1,000,000",
        expenses: "฿1,200,000",
        startDate: "2024-01-05",
        endDate: "2024-02-28",
        image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80",
        description: "Replacement of metal sheet roofing and installation of insulation for a large warehouse factory.",
        tasks: [
            { id: "5-1", title: "Remove old roofing", status: "Done", priority: "High", dueDate: "2024-01-10", assignedTo: "Team Alpha" },
            { id: "5-2", title: "Install insulation", status: "In Progress", priority: "High", dueDate: "2024-01-25" }
        ],
        teamId: '2' // Site Operations
    },
    {
        id: "6",
        name: "Co-working Space Setup",
        customer: "Digital Nomads TH",
        location: "Chiang Mai",
        status: "Planning",
        progress: 5,
        budget: "฿5,000,000",
        income: "฿500,000",
        expenses: "฿100,000",
        startDate: "2024-04-01",
        endDate: "2024-09-01",
        image: "https://images.unsplash.com/photo-1497215842964-222b430dc0a1?w=800&q=80",
        description: "Renovation of an old shop house into a modern co-working space with cafe and meeting rooms.",
        teamId: '1' // Headquarters
    }
]

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
    { id: "u1", name: "Foreman Chai", role: "Foreman", phone: "081-123-4567", location: "Bangkok", rating: 5, status: "Active", joinedDate: "2023-01-15", teamIds: ['1'] },
    { id: "u2", name: "Engineer Som", role: "Structural Engineer", phone: "089-987-6543", location: "Bangkok", rating: 4.8, status: "Active", joinedDate: "2023-03-10", teamIds: ['1'] },
    { id: "u3", name: "Admin Ply", role: "Admin", status: "Active", phone: "02-123-4567", teamIds: ['1', '2', '3'] },
    { id: "u4", name: "Boss", role: "Owner", status: "Active", teamIds: ['1', '2', '3'] }
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
        email: "hq@projectpro.com",
        website: "www.projectpro.com",
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
        email: "site@projectpro.com",
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
        email: "design@projectpro.com",
        website: "design.projectpro.com",
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
    name: "Project Pro Construction Co., Ltd.",
    address: "123 Construction Road, Building A, Bangkok 10110",
    taxId: "0105551234567",
    phone: "02-123-4567",
    email: "contact@projectpro.com",
    website: "www.projectpro.com",
    logo: "",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    paymentInfo: "Bank: KBANK\nAcc: 123-4-56789-0",
    description: "Welcome to ProjectPro"
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    // --- Team / Workspace State ---
    const [teams, setTeams] = useState<Team[]>([])
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null)

    // Mock Projects
    // Real Data State (Initially Empty)
    const [projects, setProjects] = useState<Project[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [files, setFiles] = useState<ProjectFile[]>([])
    // Users are managed by filtering all users (or fetching team users - optimized later)
    // For now, let's keep mock users until we replace them with real user fetch
    const [users, setUsers] = useState<User[]>([])
    const [workers, setWorkers] = useState<Worker[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])

    // Mock Incomes -> Real Incomes
    const [incomes, setIncomes] = useState<IncomeDocument[]>([])

    // Derived Company Profile from Current Team
    const companyProfile: CompanyProfile = currentTeam ? {
        name: currentTeam.name,
        address: currentTeam.address,
        taxId: currentTeam.taxId,
        phone: currentTeam.phone,
        email: currentTeam.email,
        website: currentTeam.website,
        logo: currentTeam.logo,
        primaryColor: currentTeam.primaryColor,
        secondaryColor: currentTeam.secondaryColor,
        description: currentTeam.description
    } : INITIAL_COMPANY_PROFILE



    const [currentUser, setCurrentUser] = useState<User | null>(null)

    // Auth State Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userRef = doc(db, "users", firebaseUser.uid)
                const userSnap = await getDoc(userRef)

                if (userSnap.exists()) {
                    setCurrentUser({ ...userSnap.data(), id: firebaseUser.uid } as User)
                } else {
                    // New User - Create Profile
                    const newUser: User = {
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || "User",
                        email: firebaseUser.email || "",
                        role: "Member",
                        status: "Active",
                        teamIds: [],
                        avatar: firebaseUser.photoURL || undefined
                    }
                    await setDoc(userRef, newUser)
                    setCurrentUser(newUser)
                }
            } else {
                setCurrentUser(null)
                setCurrentTeam(null)
                setTeams([])
            }
        })
        return () => unsubscribe()
    }, [])

    const login = async (provider: string, credentials?: { email?: string, password?: string }) => {
        if (provider === 'google') {
            try {
                await signInWithPopup(auth, googleProvider)
            } catch (error) {
                console.error("Login failed", error)
                throw error
            }
        }
        // Legacy credential support removed or can be re-added if needed
    }

    const logout = async () => {
        await signOut(auth)
        setCurrentUser(null)
        setCurrentTeam(null)
        localStorage.removeItem("projectpro_teamid")
    }

    const switchTeam = (teamId: string) => {
        const team = teams.find(t => t.id === teamId)
        if (team) {
            setCurrentTeam(team)
            localStorage.setItem("projectpro_teamid", team.id)
        }
    }

    // Load User's Teams (Real-time)
    useEffect(() => {
        if (!currentUser || !currentUser.teamIds || currentUser.teamIds.length === 0) {
            setTeams([])
            return
        }

        try {
            // Fetch teams where ID is in user's teamIds
            // Note: 'in' query limit is 10. For production, handle batches.
            const validTeamIds = currentUser.teamIds.slice(0, 10).filter(id => id)

            if (validTeamIds.length > 0) {
                const qTeams = query(collection(db, "teams"), where(documentId(), "in", validTeamIds))
                const unsubTeams = onSnapshot(qTeams, (snapshot) => {
                    const loadedTeams = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Team))
                    setTeams(loadedTeams)

                    // Auto-select first team if none selected
                    // We use functional state update to ensure we don't overwrite if user just switched?
                    // Actually, depend on currentTeam.
                    if (loadedTeams.length > 0) {
                        setCurrentTeam(prev => {
                            if (!prev || !loadedTeams.find(t => t.id === prev.id)) {
                                return loadedTeams[0]
                            }
                            return prev
                        })
                    }
                })
                return () => unsubTeams()
            }
        } catch (error) {
            console.error("Error loading teams:", error)
        }
    }, [currentUser]) // Re-run when user (and their teamIds) changes

    // --- Real-time Data Sync ---
    useEffect(() => {
        if (!currentTeam) {
            setProjects([])
            setExpenses([])
            setWorkers([])
            setVendors([])
            setCustomers([])
            setIncomes([])
            return
        }

        // 1. Projects
        const qProjects = query(collection(db, "projects"), where("teamId", "==", currentTeam.id))
        const unsubProjects = onSnapshot(qProjects, (snap) => {
            setProjects(snap.docs.map(d => ({ ...d.data(), id: d.id } as Project)))
        })

        // 2. Expenses
        const qExpenses = query(collection(db, "expenses"), where("teamId", "==", currentTeam.id))
        const unsubExpenses = onSnapshot(qExpenses, (snap) => {
            setExpenses(snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense)))
        })

        // 3. Workers
        const qWorkers = query(collection(db, "workers"), where("teamId", "==", currentTeam.id))
        const unsubWorkers = onSnapshot(qWorkers, (snap) => {
            setWorkers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Worker)))
        })

        // 4. Vendors (Optional: Add teamId to vendor logic if needed, assuming yes)
        // Note: Check if Vendor has teamId, we added it.
        const qVendors = query(collection(db, "vendors"), where("teamId", "==", currentTeam.id))
        const unsubVendors = onSnapshot(qVendors, (snap) => {
            setVendors(snap.docs.map(d => ({ ...d.data(), id: d.id } as Vendor)))
        })

        // 5. Customers
        const qCustomers = query(collection(db, "customers"), where("teamId", "==", currentTeam.id))
        const unsubCustomers = onSnapshot(qCustomers, (snap) => {
            setCustomers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer)))
        })

        // 6. Incomes (Quotation, Invoice, Receipt)
        const qIncomes = query(collection(db, "incomes"), where("teamId", "==", currentTeam.id))
        const unsubIncomes = onSnapshot(qIncomes, (snap) => {
            setIncomes(snap.docs.map(d => ({ ...d.data(), id: d.id } as IncomeDocument)))
        })

        // 7. Contracts
        const qContracts = query(collection(db, "contracts"), where("teamId", "==", currentTeam.id))
        const unsubContracts = onSnapshot(qContracts, (snap) => {
            setContracts(snap.docs.map(d => ({ ...d.data(), id: d.id } as Contract)))
        })

        // 8. Team Members (Users)
        const qUsers = query(collection(db, "users"), where("teamIds", "array-contains", currentTeam.id))
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            const realUsers = snap.docs.map(d => ({ ...d.data(), id: d.id } as User))
            // Only update if we have users, otherwise keep previous state (or empty)
            if (realUsers.length > 0) {
                setUsers(realUsers)
            }
        })

        return () => {
            unsubProjects()
            unsubExpenses()
            unsubWorkers()
            unsubVendors()
            unsubCustomers()
            unsubIncomes()
            unsubContracts()
            unsubUsers()
        }
    }, [currentTeam])

    const seedData = async () => {
        if (!currentTeam || !currentUser) return
        await seedDatabase(currentTeam.id, currentUser.id)
    }

    const addTeam = async (name: string) => {
        const newTeam: Team = {
            ...INITIAL_COMPANY_PROFILE,
            id: Date.now().toString(),
            name,
            logo: '🏢',
            role: 'Owner'
        }

        try {
            // Firestore Logic
            if (currentUser && currentUser.id) {
                // 1. Create Team Document
                const teamRef = doc(db, "teams", newTeam.id)
                await setDoc(teamRef, newTeam)

                // 2. Update User's teamIds
                const userRef = doc(db, "users", currentUser.id)
                const updatedTeamIds = [...(currentUser.teamIds || []), newTeam.id]
                await setDoc(userRef, { teamIds: updatedTeamIds }, { merge: true })

                // 3. Update Local State (Optimistic UI)
                setTeams([...teams, newTeam])

                const updatedUser = { ...currentUser, teamIds: updatedTeamIds }
                setCurrentUser(updatedUser)
                setCurrentTeam(newTeam)
            } else {
                // Fallback for non-auth / demo mode
                setTeams([...teams, newTeam])
                setCurrentTeam(newTeam)
            }
        } catch (error) {
            console.error("Error creating team:", error)
            throw error
        }
    }




    // Save data whenever it changes



    // --- CRUD Operations (Firestore) ---

    // 1. Projects
    const addProject = async (project: Omit<Project, "id">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "projects"), {
                ...project,
                teamId: currentTeam.id,
                createdAt: new Date().toISOString()
            })
        } catch (e) {
            console.error("Error adding project", e)
        }
    }

    const updateProject = async (id: string, updates: Partial<Project>) => {
        try {
            await updateDoc(doc(db, "projects", id), updates)
        } catch (e) {
            console.error("Error updating project", e)
        }
    }

    const deleteProject = async (id: string) => {
        try {
            await deleteDoc(doc(db, "projects", id))
        } catch (e) {
            console.error("Error deleting project", e)
        }
    }

    const getProject = (id: string) => projects.find(p => p.id === id)

    const addTask = (projectId: string, task: Omit<ProjectTask, "id">) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                const newTask = { ...task, id: Math.random().toString(36).substr(2, 9) }
                return { ...p, tasks: [...(p.tasks || []), newTask] }
            }
            return p
        }))
    }

    // Add Sub-project (โปรเจคย่อย)
    const addSubProject = (projectId: string, subProject: Omit<SubProject, "id">) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                const newSubProject = { ...subProject, id: Math.random().toString(36).substr(2, 9) }
                return { ...p, subProjects: [...(p.subProjects || []), newSubProject] }
            }
            return p
        }))
    }

    const updateTask = (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, ...updates } : t)
                }
            }
            return p
        }))
    }

    const deleteTask = (projectId: string, taskId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return { ...p, tasks: (p.tasks || []).filter(t => t.id !== taskId) }
            }
            return p
        }))
    }

    const toggleTask = (projectId: string, taskId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, status: t.status === 'Done' ? 'Todo' : 'Done' } : t)
                }
            }
            return p
        }))
    }

    // Contracts Logic
    const [contracts, setContracts] = useState<Contract[]>([])

    const addContract = async (data: Omit<Contract, "id" | "createdAt" | "status">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "contracts"), {
                ...data,
                status: "Active",
                createdAt: new Date().toISOString(),
                teamId: currentTeam.id,
            })
        } catch (e) {
            console.error("Error adding contract", e)
        }
    }

    const payInstallment = async (contractId: string, installmentId: string) => {
        if (!currentTeam) return

        const contract = contracts.find(c => c.id === contractId)
        if (!contract) return

        const installment = contract.installments.find(i => i.id === installmentId)
        if (!installment || installment.status === 'Paid') return

        try {
            // 1. Create Expense in Firestore
            const worker = workers.find(w => w.id === contract.workerId)
            const expenseRef = await addDoc(collection(db, "expenses"), {
                title: `Installment Payment (${installment.description})`,
                amount: `฿${installment.amount.toLocaleString()}`,
                totalValue: installment.amount,
                date: new Date().toISOString().split('T')[0],
                category: "Labor",
                payee: worker ? worker.name : "Worker",
                status: "Paid",
                projectId: contract.projectId,
                teamId: currentTeam.id,
                items: [
                    {
                        id: Math.random().toString(),
                        description: `Installment: ${installment.description}`,
                        amount: installment.amount,
                        category: "Labor",
                        projectId: contract.projectId
                    }
                ]
            })

            // 2. Update Contract Installment Status in Firestore
            const updatedInstallments = contract.installments.map(i =>
                i.id === installmentId ? {
                    ...i,
                    status: "Paid",
                    paidAt: new Date().toISOString(),
                    expenseId: expenseRef.id
                } : i
            )
            await updateDoc(doc(db, "contracts", contractId), {
                installments: updatedInstallments
            })
        } catch (e) {
            console.error("Error paying installment", e)
        }
    }

    const updateContract = async (id: string, updates: Partial<Contract>) => {
        try {
            await updateDoc(doc(db, "contracts", id), updates)
        } catch (e) {
            console.error("Error updating contract", e)
        }
    }

    const deleteContract = async (id: string) => {
        try {
            await deleteDoc(doc(db, "contracts", id))
        } catch (e) {
            console.error("Error deleting contract", e)
        }
    }


    // User CRUD
    const addUser = (userData: Omit<User, "id" | "joinedDate" | "status" | "teamIds">) => {
        const newUser: User = {
            ...userData,
            id: Date.now().toString(),
            joinedDate: new Date().toISOString().split('T')[0],
            status: "Active",
            teamIds: currentTeam ? [currentTeam.id] : []
        }
        setUsers([...users, newUser])
    }

    const updateUser = async (id: string, updates: Partial<User>) => {
        // Optimistic Update
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
        if (currentUser && currentUser.id === id) {
            setCurrentUser(prev => (prev ? { ...prev, ...updates } : null))
        }

        try {
            await updateDoc(doc(db, "users", id), updates)
        } catch (e) {
            console.error("Error updating user", e)
            // Revert on error? For now just log.
        }
    }

    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id))
    }

    // Vendor CRUD
    const addVendor = (vendorData: Omit<Vendor, "id" | "status">) => {
        const newVendor: Vendor = {
            ...vendorData,
            id: Math.random().toString(36).substr(2, 9),
            status: "Active"
        }
        setVendors(prev => [...prev, newVendor])
    }

    const updateVendor = (id: string, updates: Partial<Vendor>) => {
        setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v))
    }

    const deleteVendor = (id: string) => {
        setVendors(prev => prev.filter(v => v.id !== id))
    }

    // Worker CRUD
    const addWorker = (workerData: Omit<Worker, "id" | "status">) => {
        const newWorker: Worker = {
            ...workerData,
            id: Math.random().toString(36).substr(2, 9),
            status: "Active",
            joinedDate: new Date().toISOString().split('T')[0]
        }
        setWorkers(prev => [...prev, newWorker])
    }

    const updateWorker = (id: string, updates: Partial<Worker>) => {
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
    }

    const deleteWorker = (id: string) => {
        setWorkers(prev => prev.filter(w => w.id !== id))
    }


    // Customer CRUD
    // 4. Customers
    const addCustomer = async (customer: Omit<Customer, "id" | "status" | "totalValue">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "customers"), {
                ...customer,
                teamId: currentTeam.id,
                status: "Active",
                totalValue: 0
            })
        } catch (e) { console.error(e) }
    }
    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        try { await updateDoc(doc(db, "customers", id), updates) } catch (e) { console.error(e) }
    }
    const deleteCustomer = async (id: string) => {
        try { await deleteDoc(doc(db, "customers", id)) } catch (e) { console.error(e) }
    }

    // File CRUD
    // 3. Files
    const addFile = async (file: Omit<ProjectFile, "id" | "uploadedAt">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "files"), {
                ...file,
                teamId: currentTeam.id,
                uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            })
        } catch (e) {
            console.error("Error adding file", e)
        }
    }

    const deleteFile = async (id: string) => {
        try {
            await deleteDoc(doc(db, "files", id))
        } catch (e) {
            console.error("Error deleting file", e)
        }
    }

    // 2. Expenses
    const addExpense = async (expense: Omit<Expense, "id">) => {
        if (!currentTeam) return
        try {
            // Ensure teamId is attached
            await addDoc(collection(db, "expenses"), {
                ...expense,
                teamId: currentTeam.id
            })
        } catch (e) {
            console.error("Error adding expense", e)
        }
    }

    const updateExpense = async (id: string, updates: Partial<Expense>) => {
        try {
            await updateDoc(doc(db, "expenses", id), updates)
        } catch (e) {
            console.error("Error updating expense", e)
        }
    }

    const deleteExpense = async (id: string) => {
        try {
            await deleteDoc(doc(db, "expenses", id))
        } catch (e) {
            console.error("Error deleting expense", e)
        }
    }

    // Income Actions (Firestore)
    const addIncome = async (income: Omit<IncomeDocument, "id">) => {
        if (!currentTeam) return
        try {
            // Clean undefined values - Firestore doesn't accept undefined
            const cleanedData = Object.fromEntries(
                Object.entries({
                    ...income,
                    teamId: currentTeam.id,
                    items: income.items || [],
                    sections: income.sections || undefined,
                }).filter(([_, v]) => v !== undefined)
            )
            await addDoc(collection(db, "incomes"), cleanedData)
        } catch (e) {
            console.error("Error adding income", e)
        }
    }

    const updateIncome = async (id: string, updates: Partial<IncomeDocument>) => {
        try {
            await updateDoc(doc(db, "incomes", id), updates)
        } catch (e) {
            console.error("Error updating income", e)
        }
    }

    const deleteIncome = async (id: string) => {
        try {
            await deleteDoc(doc(db, "incomes", id))
        } catch (e) {
            console.error("Error deleting income", e)
        }
    }

    const updateCompanyProfile = async (updates: Partial<CompanyProfile>) => {
        if (!currentTeam) return

        try {
            // Update Firestore
            const teamRef = doc(db, "teams", currentTeam.id)
            await updateDoc(teamRef, updates)

            // Update Local State (Optimistic)
            const updatedTeam: Team = { ...currentTeam, ...updates }
            setTeams(teams.map(t => t.id === currentTeam.id ? updatedTeam : t))
            setCurrentTeam(updatedTeam)
        } catch (e) {
            console.error("Error updating company profile", e)
        }
    }

    const restoreData = async (data: any) => {
        try {
            if (data.projects) setProjects(data.projects)
            if (data.expenses) setExpenses(data.expenses)
            if (data.files) setFiles(data.files)
            if (data.users) setUsers(data.users)
            if (data.workers) setWorkers(data.workers)
            if (data.vendors) setVendors(data.vendors)
            if (data.customers) setCustomers(data.customers)
            if (data.incomes) setIncomes(data.incomes)
            if (data.contracts) setContracts(data.contracts)

            // Force save to disk immediately to be safe
            await Promise.all([
                set("projects_v2", data.projects || []),
                set("expenses_v2", data.expenses || []),
                set("files_v2", data.files || []),
                set("users_v2", data.users || []),
                set("workers_v2", data.workers || []),
                set("vendors_v2", data.vendors || []),
                set("customers_v2", data.customers || []),
                set("incomes_v2", data.incomes || []),
                set("companyProfile_v2", data.companyProfile || INITIAL_COMPANY_PROFILE),
                set("contracts_v2", data.contracts || []),
            ])
            return true
        } catch (e) {
            console.error("Restore failed", e)
            return false
        }
    }

    const filteredProjects = projects.filter(p => (p.teamId || '1') === currentTeam?.id)
    const filteredProjectIds = new Set(filteredProjects.map(p => p.id))

    return (
        <ProjectContext.Provider value={{
            projects: filteredProjects,
            addProject,
            updateProject,
            deleteProject,
            getProject,

            // Teams
            teams: teams.filter(t => currentUser?.teamIds?.includes(t.id)),
            currentTeam,
            switchTeam,
            addTeam,

            addTask,
            addSubProject,
            updateTask,
            deleteTask,
            toggleTask,
            expenses: expenses.filter(e => !e.projectId || filteredProjectIds.has(e.projectId)),
            addExpense,
            updateExpense,
            deleteExpense,
            users: users.filter(u => u.teamIds?.includes(currentTeam?.id || '')),
            workers,
            addUser,
            updateUser,
            deleteUser,
            addWorker,
            updateWorker,
            deleteWorker,
            vendors,
            addVendor,
            updateVendor,
            deleteVendor,
            customers,
            addCustomer,
            updateCustomer,
            deleteCustomer,
            incomes: incomes.filter(i => filteredProjectIds.has(i.projectId)),
            addIncome,
            updateIncome,
            deleteIncome,
            companyProfile,
            updateCompanyProfile,
            currentUser,
            setCurrentUser,
            login,
            logout,
            restoreData,
            seedData,
            files: files.filter(f => !f.projectId || filteredProjectIds.has(f.projectId)),
            addFile,
            deleteFile,
            contracts: contracts.filter(c => filteredProjectIds.has(c.projectId)), // Filter Contracts
            addContract,
            payInstallment,
            updateContract,
            deleteContract,
        }}>
            {children}
        </ProjectContext.Provider>
    )
}

export function useProjects() {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error("useProjects must be used within a ProjectProvider")
    }
    return context
}
