
import { db } from "@/lib/firebase"
import { collection, doc, writeBatch } from "firebase/firestore"
import { Project, Expense, Team, User, Worker, Vendor, Customer, Contract, ProjectTask, ExpenseCategory } from "@/context/project-context"

// Helper to get random item from array
const r = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export const seedDatabase = async (orgId: string, userId: string) => {
    const batch = writeBatch(db)

    // Helper to generate team-scoped ID
    const tid = (prefix: string) => `${prefix}_${orgId}_${Math.floor(Math.random() * 1000)}`

    // 1. Projects
    const projects: Project[] = [
        {
            id: tid("proj_1"),
            name: "Modern Loft Renovation",
            customer: "Khun Somchai",
            location: "Sukhumvit 39, Bangkok",
            status: "In Progress",
            progress: 45,
            budget: "฿2,500,000",
            income: "฿1,000,000",
            expenses: "฿850,000",
            startDate: "2024-02-01",
            endDate: "2024-06-30",
            image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
            description: "Complete interior renovation including mezzanine construction.",
            orgId,
            tasks: []
        },
        {
            id: tid("proj_2"),
            name: "Riverside Villa Construction",
            customer: "Mrs. Sarah Jones",
            location: "Nonthaburi",
            status: "Planning",
            progress: 10,
            budget: "฿15,000,000",
            income: "฿3,000,000",
            expenses: "฿500,000",
            startDate: "2024-04-15",
            endDate: "2025-04-15",
            image: "https://images.unsplash.com/photo-1600596542815-e32c2159c82c?w=800&q=80",
            description: "Luxury 3-storey villa with swimming pool.",
            orgId,
            tasks: []
        },
        {
            id: tid("proj_3"),
            name: "Office Extension",
            customer: "Tech Solutions Co., Ltd.",
            location: "Sathorn, Bangkok",
            status: "Completed",
            progress: 100,
            budget: "฿800,000",
            income: "฿800,000",
            expenses: "฿650,000",
            startDate: "2024-01-10",
            endDate: "2024-02-28",
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
            description: "Meeting room expansion and acoustic treatment.",
            orgId,
            tasks: []
        }
    ]

    // 2. Tasks (Sub-collection vs Array? Context uses Array in Project, but let's stick to Context structure)
    // We already initialized empty tasks. Let's update them with data if your context stores tasks ON the project document.
    // Based on previous reads, tasks are an array inside Project.
    // Let's re-define projects with tasks.

    // Helper for Tasks
    const generateTasks = (projId: string) => [
        { id: tid(`task_${projId}_1`), title: "Site Survey", status: "Done", priority: "High", assignedTo: "User", dueDate: "2024-02-05" },
        { id: tid(`task_${projId}_2`), title: "Structural Design", status: "In Progress", priority: "High", assignedTo: "User", dueDate: "2024-02-20" },
        { id: tid(`task_${projId}_3`), title: "Material Procurement", status: "Todo", priority: "Medium", dueDate: "2024-03-01" },
        { id: tid(`task_${projId}_4`), title: "Foundation Work", status: "Todo", priority: "High", dueDate: "2024-03-15" },
    ]

    // Assign Tasks & Add Projects to Batch
    projects.forEach(p => {
        p.tasks = generateTasks(p.id) as ProjectTask[]
        const ref = doc(db, "projects", p.id)
        batch.set(ref, { ...p, createdAt: new Date().toISOString() })
    })

    // 3. Expenses
    const categories = ["Material", "Labor", "Sub-contract", "Other"]
    const statuses = ["Paid", "Pending", "Unpaid"]

    for (let i = 0; i < 15; i++) {
        const id = tid(`exp_${i}`)
        const amount = Math.floor(Math.random() * 50000) + 1000
        const project = r(projects)
        const expense: Expense = {
            id,
            title: `Expense Item ${i + 1}`,
            amount: `฿${amount.toLocaleString()}`,
            totalValue: amount,
            date: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            category: r(categories) as ExpenseCategory,
            status: r(statuses) as Expense["status"],
            projectId: project.id,
            orgId,
            payee: "Supplier ABC",
        }
        const ref = doc(db, "expenses", id)
        batch.set(ref, expense)
    }

    // 4. Workers
    const workers: Worker[] = [
        { id: tid("w1"), name: "Somchai (Foreman)", role: "Foreman", dailyRate: 800, status: "Active", phone: "081-111-1111", orgId },
        { id: tid("w2"), name: "Lek (Electrician)", role: "Worker", dailyRate: 600, status: "Active", phone: "081-222-2222", orgId },
        { id: tid("w3"), name: "Dang (General)", role: "Worker", dailyRate: 500, status: "Active", phone: "081-333-3333", orgId },
    ]
    workers.forEach(w => {
        const ref = doc(db, "workers", w.id)
        batch.set(ref, w)
    })

    await batch.commit()
    console.log("Database seeded successfully with Team-Scoped Data!")
}
