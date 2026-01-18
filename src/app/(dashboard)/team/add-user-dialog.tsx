"use client"

import * as React from "react"
import { X, User, Shield, Phone, Mail, Check } from "lucide-react"
import { useProjects, User as UserType } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"

interface AddUserDialogProps {
    isOpen: boolean
    onClose: () => void
    initialData?: UserType | null
}

export default function AddUserDialog({ isOpen, onClose, initialData }: AddUserDialogProps) {
    const { addUser, updateUser, currentUser } = useProjects()
    const { t } = useTranslation()

    // Form State
    const [name, setName] = React.useState("")
    const [role, setRole] = React.useState("Staff")
    const [phone, setPhone] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [status, setStatus] = React.useState<"Active" | "Inactive" | "Pending">("Active")

    // Reset/Fill form
    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                setName(initialData.name)
                setRole(initialData.role)
                setPhone(initialData.phone || "")
                setEmail(initialData.email || "")
                setStatus(initialData.status)
            } else {
                // New Mode
                setName("")
                setRole("Staff")
                setPhone("")
                setEmail("")
                // If creating new, let it handle default (usually Active if manually set, but logic sets Pending for new)
                // However, if manual creation, we might want to default to Active or Pending? 
                // The prompt says "Status pending for User created waiting for signup".
                // If the dialog is "Add Member", showing "Pending" as initial might be good.
                setStatus("Pending")
            }
        }
    }, [isOpen, initialData])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        if (initialData) {
            // Update
            updateUser(initialData.id, {
                name,
                role,
                phone,
                email,
                status
            })
        } else {
            // Create
            addUser({
                name,
                role,
                phone,
                email,
                // status is handled by addUser or defaults
                rating: 5, // Default rating for internal staff transparency
            })
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Shield className="w-5 h-5" />
                        </div>
                        {initialData ? t.dialogs.add_user.title_edit : t.dialogs.add_user.title_add}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {/* Name */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.dialogs.add_user.full_name}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Somchai Jai-dee"
                                    className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Role & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.dialogs.add_user.role}</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={currentUser?.role !== "Owner"}
                                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Foreman">Foreman</option>
                                    <option value="Accountant">Accountant</option>
                                    <option value="Contractor">Contractor (ช่างเหมา)</option>
                                    <option value="Foreman">Foreman (หัวหน้างาน)</option>
                                    <option value="Accountant">Accountant (บัญชี)</option>
                                    <option value="Staff">Staff (พนักงาน)</option>
                                    <option value="Owner">Owner</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.dialogs.add_user.status}</label>
                                <div className="flex bg-muted p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setStatus("Active")}
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                            status === "Active" ? "bg-background text-green-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {t.dialogs.add_user.active}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatus("Pending")}
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                            status === "Pending" ? "bg-background text-orange-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Pending
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatus("Inactive")}
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                            status === "Inactive" ? "bg-background text-muted-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {t.dialogs.add_user.inactive}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.profile.fields.phone}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="08X-XXX-XXXX"
                                        className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.profile.fields.email}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="user@company.com"
                                        className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Note about Users vs Workers */}
                        <div className="p-3 bg-blue-500/10 text-blue-500 text-xs rounded-xl flex gap-2">
                            <div className="shrink-0 mt-0.5">
                                <Shield className="w-4 h-4" />
                            </div>
                            <p>
                                {t.dialogs.add_user.system_users_hint}
                            </p>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
                        >
                            {t.dialogs.add_user.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={!name}
                            className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            {initialData ? t.dialogs.add_user.save : t.dialogs.add_user.add}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
