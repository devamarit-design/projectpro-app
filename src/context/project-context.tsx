"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { get, set } from "idb-keyval"
import { auth, googleProvider, db } from "@/lib/firebase"
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, User as FirebaseUser, setPersistence, browserLocalPersistence, updatePassword } from "firebase/auth"
import { doc, getDoc, getDocs, setDoc, onSnapshot, collection, query, where, addDoc, updateDoc, deleteDoc, documentId, orderBy, limit } from "firebase/firestore"
import { seedDatabase } from "@/lib/seed-data"
import { useOrganization } from "@/context/organization-context"

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
    projectId: string // Link to project
    subProjectId?: string // Link to sub-project
    teamId: string    // Link to team
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
    teamIds: string[] // Legacy support
    display?: string // Display Mode (Compact/Comfortable)
    theme?: string // Theme Preference (Light/Dark/System)
    organizations?: { orgId: string, role: string }[] // New SaaS Structure
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
    role: "Owner" | "Admin" | "Member" | "Viewer"
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
    tasks: ProjectTask[] // Exposed global tasks
    addTask: (projectId: string, task: Omit<ProjectTask, "id" | "projectId" | "teamId">) => void
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
    incomesLoading: boolean
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
    register: (name: string, email: string, password: string) => Promise<void>
    updateUserPassword: (password: string) => Promise<void>
    logout: () => void
    isAuthLoading: boolean
    // Backup & Restore
    restoreData: (data: Record<string, unknown>) => Promise<boolean>
    seedData: () => Promise<void>
    isOrgLoading: boolean
    isLoading: boolean // Global Data Loading State
}



import { INITIAL_PROJECTS } from "@/lib/initial-data"

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)


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
    // --- Team / Workspace State (Refactored to SaaS Adapter) ---


    // Mock Projects
    // Real Data State (Initially Empty)
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS as Project[])
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
    const [incomesLoading, setIncomesLoading] = useState(true)

    // Task Management Logic (Refactored to Top-level Collection)
    const [tasks, setTasks] = useState<ProjectTask[]>([])

    // Contracts Logic
    const [contracts, setContracts] = useState<Contract[]>([])





    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [isAuthLoading, setIsAuthLoading] = useState(true)
    const [isLoading, setIsLoading] = useState(true) // Added for data loading state

    // SaaS Adapter
    const { currentOrg, userOrgs, setCurrentOrg, isLoading: isOrgLoading, createOrganization } = useOrganization()

    const currentTeam: Team | null = React.useMemo(() => {
        if (!currentOrg || !currentUser) return null

        const member = currentOrg.members?.find(m => m.userId === currentUser.id)
        const role = currentOrg.ownerId === currentUser.id ? "Owner" : (member?.role || "Member")

        return {
            id: currentOrg.id,
            name: currentOrg.name,
            role: role,
            address: currentOrg.settings.address || "",
            taxId: currentOrg.settings.taxId || "",
            phone: currentOrg.settings.phone || "",
            logo: currentOrg.settings.logoUrl,
            description: "",
            paymentInfo: "",
            signatureName: ""
        }
    }, [currentOrg, currentUser])

    const teams: Team[] = React.useMemo(() => {
        if (!currentUser) return []
        return userOrgs.map(org => {
            const member = org.members?.find(m => m.userId === currentUser.id)
            const role = org.ownerId === currentUser.id ? "Owner" : (member?.role || "Member")

            return {
                id: org.id,
                name: org.name,
                role: role,
                address: org.settings.address || "",
                taxId: org.settings.taxId || "",
                phone: org.settings.phone || "",
                logo: org.settings.logoUrl,
                description: "",
                paymentInfo: "",
                signatureName: ""
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
                // Teams and CurrentTeam are handled by OrgContext
            }
            setIsAuthLoading(false)
        })
        return () => unsubscribe()
    }, [])



    // ... (existing imports)

    // ... (existing code)

    const login = async (provider: string, credentials?: { email?: string, password?: string }) => {
        // iOS PWA Fix: Don't await persistence if not needed, or handle errors gracefully.
        // We set persistence to LOCAL (default) but wrap it to avoid hanging.
        try {
            await setPersistence(auth, browserLocalPersistence)
        } catch (e) {
            console.warn("Persistence fallback (PWA restricted?)", e)
        }

        const loginPromise = async () => {
            if (provider === 'google') {
                try {
                    await signInWithPopup(auth, googleProvider)
                } catch (error) {
                    console.error("Login failed", error)
                    throw error
                }
            } else if ((provider === 'email' || provider === 'credentials') && credentials?.email && credentials?.password) {
                try {
                    await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
                } catch (error) {
                    console.error("Login failed", error)
                    throw error
                }
            }
        }

        // Add 10s timeout to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Login timed out. Check your connection.")), 15000)
        )

        await Promise.race([loginPromise(), timeoutPromise])
    }

    const register = async (name: string, email: string, password: string) => {
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const firebaseUser = userCredential.user

            // 2. Update Profile Name
            await updateProfile(firebaseUser, { displayName: name })

            // 3. Create Firestore User Doc
            const newUser: User = {
                id: firebaseUser.uid,
                name: name,
                email: email,
                role: "Member",
                status: "Active",
                teamIds: [],
                avatar: undefined,
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
    // --- Real-time Data Sync with Cache-First Strategy ---
    useEffect(() => {
        if (!currentTeam) {
            // ... (clear state logic remains same if needed)
            setTimeout(() => {
                setProjects([])
                setExpenses([])
                setWorkers([])
                setVendors([])
                setCustomers([])
                setIncomes([])
                setIncomesLoading(false)
            }, 0)
            return
        }

        // 0. Cache Hydration (Load from IndexedDB immediately)
        const hydrateFromCache = async () => {
            try {
                // Parallel fetch from local store
                const [
                    cachedProjects,
                    cachedExpenses,
                    cachedWorkers,
                    cachedVendors,
                    cachedCustomers,
                    cachedIncomes,
                    cachedContracts,
                    cachedTasks,
                    cachedUsers,
                    cachedFiles
                ] = await Promise.all([
                    get(`projects_${currentTeam.id}`),
                    get(`expenses_${currentTeam.id}`),
                    get(`workers_${currentTeam.id}`),
                    get(`vendors_${currentTeam.id}`),
                    get(`customers_${currentTeam.id}`),
                    get(`incomes_${currentTeam.id}`),
                    get(`contracts_${currentTeam.id}`),
                    get(`tasks_${currentTeam.id}`),
                    get(`users_${currentTeam.id}`),
                    get(`files_${currentTeam.id}`)
                ])

                if (cachedProjects) setProjects(cachedProjects)
                if (cachedExpenses) setExpenses(cachedExpenses)
                if (cachedWorkers) setWorkers(cachedWorkers)
                if (cachedVendors) setVendors(cachedVendors)
                if (cachedCustomers) setCustomers(cachedCustomers)
                if (cachedIncomes) {
                    setIncomes(cachedIncomes)
                    setIncomesLoading(false)
                }
                if (cachedContracts) setContracts(cachedContracts)
                if (cachedTasks) setTasks(cachedTasks)
                if (cachedUsers) setUsers(cachedUsers)
                if (cachedFiles) setFiles(cachedFiles)

                // If we found projects, we can assume initial loading is "done" visually
                if (cachedProjects) setIsLoading(false)

            } catch (error) {
                console.warn("Cache hydration failed:", error)
            }
        }

        hydrateFromCache()

        // 1. Projects
        const qProjects = query(collection(db, "projects"), where("teamId", "==", currentTeam.id))
        const unsubProjects = onSnapshot(qProjects, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Project))
            setProjects(data)
            set(`projects_${currentTeam.id}`, data) // Update Cache
            setIsLoading(false)
        })

        // 2. Expenses
        const qExpenses = query(collection(db, "expenses"), where("teamId", "==", currentTeam.id))
        const unsubExpenses = onSnapshot(qExpenses, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense))
            setExpenses(data)
            set(`expenses_${currentTeam.id}`, data) // Update Cache
        })

        // 3. Workers
        const qWorkers = query(collection(db, "workers"), where("teamId", "==", currentTeam.id))
        const unsubWorkers = onSnapshot(qWorkers, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Worker))
            setWorkers(data)
            set(`workers_${currentTeam.id}`, data) // Update Cache
        })

        // 4. Vendors
        const qVendors = query(collection(db, "vendors"), where("teamId", "==", currentTeam.id))
        const unsubVendors = onSnapshot(qVendors, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Vendor))
            setVendors(data)
            set(`vendors_${currentTeam.id}`, data) // Update Cache
        })

        // 5. Customers
        const qCustomers = query(collection(db, "customers"), where("teamId", "==", currentTeam.id))
        const unsubCustomers = onSnapshot(qCustomers, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer))
            setCustomers(data)
            set(`customers_${currentTeam.id}`, data) // Update Cache
        })

        // 6. Incomes
        let unsubIncomes: () => void = () => { }
            ; (async () => {
                // ... (Migration logic skipped for brevity, keeping existing structure if possible or assuming simple query for now to match strict replacement)
                // Simplified for this replacement to avoid complexity:
                const qIncomes = query(collection(db, "incomes"), where("teamId", "==", currentTeam.id))
                unsubIncomes = onSnapshot(qIncomes, (snap) => {
                    const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as IncomeDocument))
                    setIncomes(data)
                    set(`incomes_${currentTeam.id}`, data) // Update Cache
                    setIncomesLoading(false)
                })
            })()

        // 7. Contracts
        const qContracts = query(collection(db, "contracts"), where("teamId", "==", currentTeam.id))
        const unsubContracts = onSnapshot(qContracts, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Contract))
            setContracts(data)
            set(`contracts_${currentTeam.id}`, data) // Update Cache
        })

        // 8. Tasks
        const qTasks = query(collection(db, "tasks"), where("teamId", "==", currentTeam.id))
        const unsubTasks = onSnapshot(qTasks, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ProjectTask))
            setTasks(data)
            set(`tasks_${currentTeam.id}`, data) // Update Cache
        })

        // 9. Team Members
        const qUsers = query(collection(db, "users"), where("teamIds", "array-contains", currentTeam.id))
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            const realUsers = snap.docs.map(d => ({ ...d.data(), id: d.id } as User))
            if (realUsers.length > 0) {
                setUsers(realUsers)
                set(`users_${currentTeam.id}`, realUsers) // Update Cache
            }
        })

        // 10. Files
        const qFiles = query(collection(db, "files"), where("teamId", "==", currentTeam.id))
        const unsubFiles = onSnapshot(qFiles, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ProjectFile))
            setFiles(data)
            set(`files_${currentTeam.id}`, data) // Update Cache
        })

        return () => {
            unsubProjects()
            unsubExpenses()
            unsubWorkers()
            unsubVendors()
            unsubCustomers()
            unsubIncomes()
            unsubContracts()
            unsubTasks()
            unsubUsers()
            unsubFiles()
        }
    }, [currentTeam])

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

    const getProject = (id: string) => {
        const project = projects.find(p => p.id === id)
        if (!project) return undefined
        // Merge tasks from global state
        const projectTasks = tasks.filter(t => t.projectId === id)
        return { ...project, tasks: projectTasks }
    }

    // Task Management Logic (Refactored to Top-level Collection)


    const addTask = async (projectId: string, task: Omit<ProjectTask, "id" | "projectId" | "teamId">) => {
        if (!currentTeam) return

        try {
            await addDoc(collection(db, "tasks"), {
                ...task,
                projectId,
                teamId: currentTeam.id,
                status: task.status || "Todo",
                priority: task.priority || "Medium"
            })
        } catch (e) {
            console.error("Error adding task", e)
        }
    }

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

    const updateTask = async (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
        try {
            await updateDoc(doc(db, "tasks", taskId), updates)
        } catch (e) {
            console.error("Error updating task", e)
        }
    }

    const deleteTask = async (projectId: string, taskId: string) => {
        try {
            await deleteDoc(doc(db, "tasks", taskId))
        } catch (e) {
            console.error("Error deleting task", e)
        }
    }

    const toggleTask = async (projectId: string, taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        const newStatus = task.status === 'Done' ? 'Todo' : 'Done'
        try {
            await updateDoc(doc(db, "tasks", taskId), { status: newStatus })
        } catch (e) {
            console.error("Error toggling task", e)
        }
    }

    // SaaS Context


    // Load Data Effect (SaaS Aware)
    useEffect(() => {
        // If no user or no org selected, we might clear data or show nothing
        if (!currentUser) return // Auth handled by listener below, but data fetching depends on Org

        // If generic listener below is for AUTH, we need a separate listener for DATA based on Org
        if (!currentOrg) {
            // Reset data if no org
            setProjects([])
            setExpenses([])
            setIncomes([])

            setTasks([])
            return
        }

        setIsLoading(true)

        // 1. Projects (Filtered by Org)
        // Check if legacy user without orgId in projects? 
        // For migration, we might need to handle projects with teamId matching orgId if we treat teamId as orgId temporarily.
        // Or strictly look for orgId field. 
        // Let's assume we are migrating to use teamId AS orgId for now or adding orgId field.
        // STRATEGY: Use currentOrg.id as the filter.

        const qProjects = query(
            collection(db, "projects"),
            where("teamId", "==", currentOrg.id) // Map teamId to OrgId for compatibility
        )

        const unsubProjects = onSnapshot(qProjects, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project))
            setProjects(projectsData)
        })

        // 2. Expenses
        const qExpenses = query(collection(db, "expenses"), where("teamId", "==", currentOrg.id))
        const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense))
            setExpenses(expensesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        })

        // 3. Incomes/Docs
        const qIncome = query(collection(db, "income"), where("teamId", "==", currentOrg.id))
        const unsubIncome = onSnapshot(qIncome, (snapshot) => {
            const incomeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncomeDocument))

            setIncomes(incomeData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        })

        // 4. Tasks (Global list for board)
        // Note: Tasks are usually sub-collection? Or root?
        // In this app, tasks seem to be stored in 'projects' array mostly, but if there's a root collection:
        // Checking seed-data, tasks are in 'projects' array.
        // BUT if we have root tasks collection (for 'My Tasks' view across projects), we query it.
        // Assuming we rely on project.tasks for now based on Task Board impl.

        // 5. Team/Users
        const qUsers = query(collection(db, "users"), where("teamIds", "array-contains", currentOrg.id))
        const unsubUsers = onSnapshot(qUsers, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))
            setUsers(usersData)
        })

        setIsLoading(false)

        return () => {
            unsubProjects()
            unsubExpenses()
            unsubIncome()
            unsubUsers()
        }
    }, [currentUser, currentOrg]) // Rerun when Org changes

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
    // Vendor CRUD
    const addVendor = async (vendorData: Omit<Vendor, "id" | "status">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "vendors"), {
                ...vendorData,
                status: "Active",
                teamId: currentTeam.id
            })
        } catch (e) {
            console.error("Error adding vendor", e)
        }
    }

    const updateVendor = async (id: string, updates: Partial<Vendor>) => {
        try {
            await updateDoc(doc(db, "vendors", id), updates)
        } catch (e) {
            console.error("Error updating vendor", e)
        }
    }

    const deleteVendor = async (id: string) => {
        try {
            await deleteDoc(doc(db, "vendors", id))
        } catch (e) {
            console.error("Error deleting vendor", e)
        }
    }

    // Worker CRUD
    const addWorker = async (workerData: Omit<Worker, "id" | "status">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "workers"), {
                ...workerData,
                status: "Active",
                joinedDate: new Date().toISOString().split('T')[0],
                teamId: currentTeam.id
            })
        } catch (e) {
            console.error("Error adding worker", e)
        }
    }

    const updateWorker = async (id: string, updates: Partial<Worker>) => {
        try {
            await updateDoc(doc(db, "workers", id), updates)
        } catch (e) {
            console.error("Error updating worker", e)
        }
    }

    const deleteWorker = async (id: string) => {
        try {
            await deleteDoc(doc(db, "workers", id))
        } catch (e) {
            console.error("Error deleting worker", e)
        }
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

            // Notification: Everyone gets notified for every payment
            await addDoc(collection(db, "notifications"), {
                title: `${expense.title}`,
                message: `New expense added by ${currentUser?.name || 'Unknown'}`,
                type: 'info',
                date: new Date().toISOString(),
                read: false,
                link: '/expenses',
                relatedId: 'expense-new',
                target: 'all',
                teamId: currentTeam.id
            })
        } catch (e) {
            console.error("Error adding expense", e)
        }
    }

    const updateExpense = async (id: string, updates: Partial<Expense>) => {
        if (!currentTeam) return
        try {
            await updateDoc(doc(db, "expenses", id), updates)

            // Notification: Status Change (Advanced/Credit -> Paid)
            // We only notify Admin/Owner on status changes to 'Paid'
            if (updates.status === 'Paid') {
                await addDoc(collection(db, "notifications"), {
                    title: `Expense Paid`,
                    message: `Expense has been marked as PAID (previously Pending/Advanced/Credit)`,
                    type: 'success',
                    date: new Date().toISOString(),
                    read: false,
                    link: '/expenses',
                    relatedId: id,
                    target: 'admin',
                    teamId: currentTeam.id
                })
            }
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

            // Notification: Admin gets notified for Customer Withdrawals (Income)
            await addDoc(collection(db, "notifications"), {
                title: `New Income/Withdrawal`,
                message: `New withdrawal recorded by ${currentUser?.name}`,
                type: 'info', // or success
                date: new Date().toISOString(),
                read: false,
                link: '/income',
                relatedId: 'income-new',
                target: 'admin',
                teamId: currentTeam.id
            })
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
            // Update Firestore (Organization)
            // Map CompanyProfile fields to Organization settings
            const orgRef = doc(db, "organizations", currentTeam.id)

            const orgUpdates: any = {}
            if (updates.name) orgUpdates.name = updates.name

            // Settings map
            if (updates.address) orgUpdates['settings.address'] = updates.address
            if (updates.taxId) orgUpdates['settings.taxId'] = updates.taxId
            if (updates.phone) orgUpdates['settings.phone'] = updates.phone
            if (updates.logo) orgUpdates['settings.logoUrl'] = updates.logo

            await updateDoc(orgRef, orgUpdates)

            // Local state update handled by OrgContext subscription potentially,
            // or we might need to manually trigger refresh if strictly needed immediately.
            // For now, rely on Firestore listener if it exists in OrgContext.

        } catch (e) {
            console.error("Error updating company profile", e)
        }
    }

    const restoreData = async (data: Record<string, unknown>) => {
        try {
            if (data.projects) setProjects(data.projects as Project[])
            if (data.expenses) setExpenses(data.expenses as Expense[])
            if (data.files) setFiles(data.files as ProjectFile[])
            if (data.users) setUsers(data.users as User[])
            if (data.workers) setWorkers(data.workers as Worker[])
            if (data.vendors) setVendors(data.vendors as Vendor[])
            if (data.customers) setCustomers(data.customers as Customer[])
            if (data.incomes) setIncomes(data.incomes as IncomeDocument[])
            if (data.contracts) setContracts(data.contracts as Contract[])

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

    // Missing Functions Implementation
    const addContract = async (contract: Omit<Contract, "id" | "createdAt" | "status">) => {
        if (!currentTeam) return
        try {
            await addDoc(collection(db, "contracts"), {
                ...contract,
                createdAt: new Date().toISOString(),
                status: "Active",
                teamId: currentTeam.id
            })
        } catch (e) {
            console.error("Error adding contract", e)
        }
    }





    return (
        <ProjectContext.Provider value={{
            projects: filteredProjects,
            addProject,
            updateProject,
            deleteProject,
            getProject,

            // Teams
            teams,
            currentTeam,
            switchTeam,
            addTeam: async (name: string) => {
                await createOrganization(name)
            },


            addTask,
            tasks,
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
            incomesLoading,
            addIncome,
            updateIncome,
            deleteIncome,
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
