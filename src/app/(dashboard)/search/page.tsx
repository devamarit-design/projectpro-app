"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { useTranslation } from "@/lib/i18n-context"
import { Suspense } from "react"
import Link from "next/link"
import {
    FolderKanban,
    CheckSquare,
    CreditCard,
    ArrowRight,
    Search as SearchIcon,
    Users,
    TrendingUp,
    Handshake,
    Gamepad2,
    UserCircle
} from "lucide-react"

function SearchResultsContent() {
    const searchParams = useSearchParams()
    const query = searchParams.get("q") || ""
    const {
        projects,
        customers,
        vendors,
        expenses,
        incomes
    } = useProjects()
    const { currentOrg } = useOrganization()
    const { t } = useTranslation()

    const lowerQuery = query.toLowerCase()

    // Filter Logic
    const filteredProjects = React.useMemo(() => {
        if (!query) return []
        return projects.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.customer.toLowerCase().includes(lowerQuery) ||
            p.location?.toLowerCase().includes(lowerQuery)
        )
    }, [projects, lowerQuery, query])

    const filteredTasks = React.useMemo(() => {
        if (!query) return []
        const allTasks = projects.flatMap(p => p.tasks?.map(t => ({ ...t, projectName: p.name, projectId: p.id })) || [])
        return allTasks.filter(t =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.assignedTo?.toLowerCase().includes(lowerQuery)
        )
    }, [projects, lowerQuery, query])

    const filteredCustomers = React.useMemo(() => {
        if (!query) return []
        return (customers || []).filter(c =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.phone?.toLowerCase().includes(lowerQuery) ||
            c.email?.toLowerCase().includes(lowerQuery)
        )
    }, [customers, lowerQuery, query])

    const filteredPartners = React.useMemo(() => {
        if (!query) return []
        return (vendors || []).filter(v =>
            v.name.toLowerCase().includes(lowerQuery) ||
            v.category.toLowerCase().includes(lowerQuery)
        )
    }, [vendors, lowerQuery, query])

    const filteredExpenses = React.useMemo(() => {
        if (!query) return []
        return (expenses || []).filter(e =>
            e.title.toLowerCase().includes(lowerQuery) ||
            e.category.toLowerCase().includes(lowerQuery) ||
            e.payee?.toLowerCase().includes(lowerQuery) ||
            e.vendor?.toLowerCase().includes(lowerQuery)
        )
    }, [expenses, lowerQuery, query])

    const filteredIncomes = React.useMemo(() => {
        if (!query) return []
        return (incomes || []).filter(i =>
            i.documentNumber.toLowerCase().includes(lowerQuery) ||
            i.customerId.toLowerCase().includes(lowerQuery)
        )
    }, [incomes, lowerQuery, query])

    const filteredTeams = React.useMemo(() => {
        if (!query || !currentOrg?.members) return []
        return currentOrg.members.filter(m =>
            m.userId.toLowerCase().includes(lowerQuery) ||
            m.role.toLowerCase().includes(lowerQuery)
        )
    }, [currentOrg, lowerQuery, query])

    const totalResults =
        filteredProjects.length +
        filteredTasks.length +
        filteredCustomers.length +
        filteredPartners.length +
        filteredExpenses.length +
        filteredIncomes.length +
        filteredTeams.length

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <SearchIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">{t.search.enter_term}</h2>
                <p className="text-muted-foreground">{t.search.search_hint}</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-12">
            <div>
                <h1 className="text-3xl font-bold mb-2 tracking-tight">{t.search.title}</h1>
                <p className="text-muted-foreground">
                    {t.search.found_results.replace('{{count}}', totalResults.toString()).replace('{{query}}', query)}
                </p>
            </div>

            {/* Entities Sections */}

            {/* Projects Section */}
            {filteredProjects.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <FolderKanban className="w-4 h-4" />
                        {t.search.sections.projects}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProjects.map(project => (
                            <Link
                                key={project.id}
                                href={`/projects/detail?id=${project.id}`}
                                className="group block p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h3>
                                        <p className="text-sm text-muted-foreground">{project.customer}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                        {project.status}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center text-xs text-muted-foreground gap-4">
                                    <span>{project.location}</span>
                                    <span>{project.progress}% Complete</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Customers Section */}
            {filteredCustomers.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {t.common.customers}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filteredCustomers.map(customer => (
                            <Link
                                key={customer.id}
                                href={`/customers?id=${customer.id}`}
                                className="block p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all"
                            >
                                <h3 className="font-semibold">{customer.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{customer.phone || customer.email || "No contact"}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Teams Section */}
            {filteredTeams.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        {t.common.team}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {filteredTeams.map((member, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-border bg-card">
                                <h3 className="font-medium text-sm">{member.userId}</h3>
                                <p className="text-[10px] text-muted-foreground">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Expenses Section */}
            {filteredExpenses.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t.finance.expense}
                    </h2>
                    <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                        {filteredExpenses.map(expense => (
                            <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div>
                                    <h3 className="font-medium">{expense.title}</h3>
                                    <p className="text-xs text-muted-foreground">{expense.category} • {expense.date}</p>
                                </div>
                                <span className="font-mono font-semibold text-red-500">฿{expense.amount}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Incomes Section */}
            {filteredIncomes.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {t.finance.income}
                    </h2>
                    <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                        {filteredIncomes.map(income => (
                            <div key={income.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div>
                                    <h3 className="font-medium text-primary">{income.documentNumber}</h3>
                                    <p className="text-xs text-muted-foreground">{income.date} • {income.type}</p>
                                </div>
                                <span className="font-mono font-semibold text-green-500">฿{(income.grandTotal || 0).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Partners Section */}
            {filteredPartners.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Handshake className="w-4 h-4" />
                        {t.common.partners}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filteredPartners.map(v => (
                            <Link
                                key={v.id}
                                href={`/partners?id=${v.id}`}
                                className="block p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all"
                            >
                                <h3 className="font-semibold">{v.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{v.category}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Tasks Section */}
            {filteredTasks.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        {t.search.sections.tasks}
                    </h2>
                    <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div>
                                    <h3 className="font-medium">{task.title}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {t.search.in_project} <span className="font-semibold text-foreground">{task.projectName}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full",
                                        task.priority === 'High' ? "bg-red-500/10 text-red-500" :
                                            task.priority === 'Medium' ? "bg-yellow-500/10 text-yellow-500" :
                                                "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {totalResults === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-muted-foreground">{t.search.no_results}</p>
                    <p className="text-sm text-muted-foreground mt-2">{t.search.adjust_terms}</p>
                </div>
            )}
        </div>
    )
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <SearchResultsContent />
        </Suspense>
    )
}
