"use client"

import { CONTRACTS_ENABLED } from "@/lib/feature-flags"
import React, { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { hasPermission, Role, Action } from "@/lib/permissions"
import { toast } from "sonner"
import {
    FolderKanban,
    Receipt,
    FileText,
    Store,
    Users,
    Settings,
    ClipboardList,
    TrendingUp,
    BarChart3,
    Package,
    Briefcase,
    CheckSquare,
    Calendar,
    Newspaper,
    Megaphone,
    HardDrive,
    Wrench,
    Activity,
    Plus,
    X,
    Check,
    RotateCcw,
    Edit3,
    Sparkles,
    Search,
    CheckCircle2,
    LucideIcon
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"

export interface ShortcutDefinition {
    id: string
    labelKey?: string
    defaultLabel: string
    icon: LucideIcon
    href: string
    color: string
    bg: string
    permission?: Action
    guestAllowed?: boolean
    category: string
    description: string
}

export function QuickActionsGrid() {
    const { t } = useTranslation()
    const { currentTeam, currentUser, updateUser } = useProjects()

    // Determine current role
    const userRole = (currentTeam?.role || currentUser?.role || "Staff") as Role
    const isGuest = userRole === "Guest"

    // Storage key per user & organization
    const storageKey = currentUser?.id
        ? `hipsloth_quick_actions_${currentUser.id}_${currentTeam?.id || "default"}`
        : "hipsloth_quick_actions_guest"

    // Master list of all possible shortcuts with role / permission metadata
    const ALL_SHORTCUTS: ShortcutDefinition[] = useMemo(() => [
        {
            id: "projects",
            defaultLabel: t.dashboard?.active_projects || "Projects",
            icon: FolderKanban,
            href: "/projects",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            permission: "PROJECT_VIEW",
            guestAllowed: false,
            category: "งาน & โครงการ",
            description: "ภาพรวมโครงการ ความคืบหน้า และบริหารงานก่อสร้าง"
        },
        {
            id: "jobsheets",
            defaultLabel: "JobSheet",
            icon: ClipboardList,
            href: "/jobsheets",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            permission: "JOBSHEET_VIEW",
            guestAllowed: true,
            category: "งาน & โครงการ",
            description: "บันทึกรายงานประจำวัน สภาพอากาศ แรงงาน และงานหน้างาน"
        },
        {
            id: "expenses",
            defaultLabel: t.expenses?.title || "Expenses",
            icon: Receipt,
            href: "/expenses",
            color: "text-red-500",
            bg: "bg-red-500/10",
            permission: "EXPENSE_VIEW",
            guestAllowed: false,
            category: "การเงิน & บัญชี",
            description: "บันทึกและตรวจสอบค่าใช้จ่าย บิล และใบเสร็จ"
        },
        {
            id: "income",
            defaultLabel: t.common?.income || "Income",
            icon: TrendingUp,
            href: "/income",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            permission: "INCOME_VIEW",
            guestAllowed: false,
            category: "การเงิน & บัญชี",
            description: "ติดตามเงินงวด ยอดรับชำระ และใบวางบิล"
        },
        {
            id: "financial",
            defaultLabel: "Financial",
            icon: BarChart3,
            href: "/financial",
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            permission: "FINANCIAL_VIEW",
            guestAllowed: false,
            category: "การเงิน & บัญชี",
            description: "สรุปกระแสเงินสด กำไร-ขาดทุน และงบประมาณรวม"
        },
        {
            id: "customers",
            defaultLabel: t.common?.customers || "Customers",
            icon: Users,
            href: "/customers",
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            permission: "PROJECT_VIEW",
            guestAllowed: false,
            category: "บริหาร & คู่ค้า",
            description: "ฐานข้อมูลลูกค้า ผู้ว่าจ้าง และการติดต่อ"
        },
        {
            id: "contracts",
            defaultLabel: t.settings?.menu?.documents || "Documents",
            icon: FileText,
            href: "/contracts",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            permission: "PROJECT_VIEW",
            guestAllowed: false,
            category: "งาน & โครงการ",
            description: "สัญญาจ้าง เอกสารแนบ ใบเสนอราคา และข้อตกลง"
        },
        {
            id: "partners",
            defaultLabel: t.common?.partners || "Partners",
            icon: Store,
            href: "/partners",
            color: "text-teal-500",
            bg: "bg-teal-500/10",
            permission: "PROJECT_VIEW",
            guestAllowed: false,
            category: "บริหาร & คู่ค้า",
            description: "ร้านค้าวัสดุ ช่าง และผู้รับเหมาช่วง"
        },
        {
            id: "catalog",
            defaultLabel: "Catalog",
            icon: Package,
            href: "/catalog",
            color: "text-pink-500",
            bg: "bg-pink-500/10",
            guestAllowed: true,
            category: "สินค้า & วัสดุ",
            description: "แคตตาล็อกวัสดุก่อสร้าง สินค้า และสเปก"
        },
        {
            id: "team",
            defaultLabel: t.common?.team || "Team",
            icon: Briefcase,
            href: "/team",
            color: "text-sky-500",
            bg: "bg-sky-500/10",
            permission: "TEAM_VIEW",
            guestAllowed: false,
            category: "บริหาร & คู่ค้า",
            description: "รายชื่อทีมงาน สิทธิ์การใช้งาน และฝ่ายต่างๆ"
        },
        {
            id: "tasks",
            defaultLabel: t.common?.tasks || "Tasks",
            icon: CheckSquare,
            href: "/tasks",
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            permission: "PROJECT_VIEW",
            guestAllowed: false,
            category: "งาน & โครงการ",
            description: "รายการงานย่อยที่ต้องทำและสถานะงาน"
        },
        {
            id: "calendar",
            defaultLabel: "Calendar",
            icon: Calendar,
            href: "/calendar",
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            permission: "PROJECT_VIEW",
            guestAllowed: false,
            category: "งาน & โครงการ",
            description: "ปฏิทินงาน นัดหมาย งวดส่งมอบ และงวดเงิน"
        },
        {
            id: "wall",
            defaultLabel: "Team Wall",
            icon: Newspaper,
            href: "/wall",
            color: "text-fuchsia-500",
            bg: "bg-fuchsia-500/10",
            guestAllowed: true,
            category: "ทั่วไป & สื่อสาร",
            description: "กระดานสื่อสารภายในทีมและอัปเดตหน้างาน"
        },
        {
            id: "announcements",
            defaultLabel: "Announcements",
            icon: Megaphone,
            href: "/announcements",
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            guestAllowed: true,
            category: "ทั่วไป & สื่อสาร",
            description: "ประกาศและข่าวสารสำคัญขององค์กร"
        },
        {
            id: "storage",
            defaultLabel: t.common?.storage || "Storage",
            icon: HardDrive,
            href: "/storage",
            color: "text-cyan-500",
            bg: "bg-cyan-500/10",
            permission: "PROJECT_VIEW",
            guestAllowed: false,
            category: "งาน & โครงการ",
            description: "คลังไฟล์จัดเก็บเอกสารและรูปภาพโครงการ"
        },
        {
            id: "pro-tools",
            defaultLabel: "Pro Tools",
            icon: Wrench,
            href: "/pro-tools",
            color: "text-amber-600",
            bg: "bg-amber-600/10",
            guestAllowed: true,
            category: "ทั่วไป & สื่อสาร",
            description: "เครื่องมือคำนวณและตัวช่วยงานช่าง"
        },
        {
            id: "activity",
            defaultLabel: "Activity",
            icon: Activity,
            href: "/activity",
            color: "text-blue-600",
            bg: "bg-blue-600/10",
            permission: "TEAM_VIEW",
            guestAllowed: false,
            category: "บริหาร & คู่ค้า",
            description: "ประวัติกิจกรรมและการดำเนินงานของทีม"
        },
        {
            id: "settings",
            defaultLabel: t.settings?.title || "Settings",
            icon: Settings,
            href: "/settings",
            color: "text-slate-500",
            bg: "bg-slate-500/10",
            permission: "SETTINGS_VIEW",
            guestAllowed: true,
            category: "ทั่วไป & สื่อสาร",
            description: "ตั้งค่าระบบ ธีม ข้อมูลส่วนตัว และองค์กร"
        }
    ], [t])

    // Check if a shortcut is allowed for the user's role
    const isActionAllowed = (action: ShortcutDefinition, role: Role): boolean => {
        if (role === "Guest") {
            return !!action.guestAllowed
        }
        if (action.permission) {
            return hasPermission(role, action.permission)
        }
        return true
    }

    // Role-based default shortcuts
    const getDefaultIdsForRole = (role: Role): string[] => {
        if (role === "Guest") {
            return ["jobsheets", "catalog", "wall", "settings"]
        }
        if (role === "Accountant") {
            return ["income", "expenses", "financial", "projects", "jobsheets", "contracts", "settings"]
        }
        return ["projects", "jobsheets", "expenses", "customers", "contracts", "partners", "settings"]
    }

    // Allowed shortcuts for current role
    const allowedShortcuts = useMemo(() => {
        return ALL_SHORTCUTS.filter(a => isActionAllowed(a, userRole) && (CONTRACTS_ENABLED || a.id !== "contracts"))
    }, [ALL_SHORTCUTS, userRole])

    // State for active shortcuts and editing mode
    const [activeIds, setActiveIds] = useState<string[]>([])
    const [isEditing, setIsEditing] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")

    // Load active shortcuts for user
    useEffect(() => {
        let loadedIds: string[] = []

        // 1. Check user profile in context
        if (currentUser?.quickActions && Array.isArray(currentUser.quickActions) && currentUser.quickActions.length > 0) {
            loadedIds = currentUser.quickActions
        } else {
            // 2. Check localStorage
            try {
                const saved = localStorage.getItem(storageKey)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        loadedIds = parsed
                    }
                }
            } catch (e) {
                console.error("Failed to parse quickActions from storage", e)
            }
        }

        // 3. Fallback to defaults
        if (loadedIds.length === 0) {
            loadedIds = getDefaultIdsForRole(userRole)
        }

        // Filter by permissions of current role
        const allowedIdsSet = new Set(allowedShortcuts.map(s => s.id))
        const validIds = loadedIds.filter(id => allowedIdsSet.has(id))

        setActiveIds(validIds.length > 0 ? validIds : getDefaultIdsForRole(userRole).filter(id => allowedIdsSet.has(id)))
    }, [currentUser?.id, currentUser?.quickActions, userRole, storageKey, allowedShortcuts])

    // Save shortcuts to Firestore & localStorage
    const saveShortcuts = async (newIds: string[]) => {
        setActiveIds(newIds)
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(storageKey, JSON.stringify(newIds))
            }
            if (currentUser?.id) {
                await updateUser(currentUser.id, { quickActions: newIds })
            }
        } catch (err) {
            console.error("Failed to save quick actions:", err)
        }
    }

    // Remove shortcut handler
    const handleRemoveShortcut = (idToRemove: string) => {
        if (activeIds.length <= 1) {
            toast.error("ต้องมีปุ่มลัดอย่างน้อย 1 รายการ")
            return
        }
        const updated = activeIds.filter(id => id !== idToRemove)
        saveShortcuts(updated)
        toast.info("นำปุ่มลัดออกแล้ว")
    }

    // Add shortcut handler
    const handleAddShortcut = (idToAdd: string) => {
        if (activeIds.includes(idToAdd)) return
        const updated = [...activeIds, idToAdd]
        saveShortcuts(updated)
        toast.success("เพิ่มปุ่มลัดเรียบร้อยแล้ว")
    }

    // Reset to defaults
    const handleReset = () => {
        const defaults = getDefaultIdsForRole(userRole).filter(id =>
            allowedShortcuts.some(s => s.id === id)
        )
        saveShortcuts(defaults)
        toast.success("คืนค่าปุ่มลัดเริ่มต้นแล้ว")
    }

    // Long press detection logic
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const longPressTriggeredRef = useRef(false)
    const touchStartPosRef = useRef({ x: 0, y: 0 })

    const startLongPress = (clientX: number, clientY: number) => {
        longPressTriggeredRef.current = false
        touchStartPosRef.current = { x: clientX, y: clientY }
        if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current)
        longPressTimeoutRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true
            setIsEditing(true)
            if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(40)
            }
        }, 500)
    }

    const cancelLongPress = () => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current)
            longPressTimeoutRef.current = null
        }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isEditing) return
        const touch = e.touches[0]
        startLongPress(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!longPressTimeoutRef.current) return
        const touch = e.touches[0]
        const dx = Math.abs(touch.clientX - touchStartPosRef.current.x)
        const dy = Math.abs(touch.clientY - touchStartPosRef.current.y)
        if (dx > 10 || dy > 10) {
            cancelLongPress()
        }
    }

    const handleTouchEnd = () => {
        cancelLongPress()
        setTimeout(() => {
            longPressTriggeredRef.current = false
        }, 120)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditing || e.button !== 0) return
        startLongPress(e.clientX, e.clientY)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!longPressTimeoutRef.current) return
        const dx = Math.abs(e.clientX - touchStartPosRef.current.x)
        const dy = Math.abs(e.clientY - touchStartPosRef.current.y)
        if (dx > 8 || dy > 8) {
            cancelLongPress()
        }
    }

    const handleMouseUp = () => {
        cancelLongPress()
        setTimeout(() => {
            longPressTriggeredRef.current = false
        }, 120)
    }

    // Active shortcuts mapped to definition objects
    const displayedActions = useMemo(() => {
        const map = new Map(ALL_SHORTCUTS.map(s => [s.id, s]))
        return activeIds
            .map(id => map.get(id))
            .filter((s): s is ShortcutDefinition => !!s && isActionAllowed(s, userRole))
    }, [activeIds, ALL_SHORTCUTS, userRole])

    // Available shortcuts for Add Modal (allowed for role, not currently added)
    const availableToAdd = useMemo(() => {
        const activeSet = new Set(activeIds)
        return allowedShortcuts.filter(s => !activeSet.has(s.id))
    }, [allowedShortcuts, activeIds])

    // Filter available shortcuts by search and category
    const filteredAvailable = useMemo(() => {
        return availableToAdd.filter(s => {
            const matchesSearch = searchQuery.trim() === "" ||
                s.defaultLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.category.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === "all" || s.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [availableToAdd, searchQuery, selectedCategory])

    // Categories list for modal
    const categories = useMemo(() => {
        const set = new Set<string>()
        availableToAdd.forEach(s => set.add(s.category))
        return Array.from(set)
    }, [availableToAdd])

    return (
        <div className="mb-8 select-none">
            {/* Toolbar / Header Indicator */}
            {isEditing ? (
                <div className="flex items-center justify-between px-3 py-2 mb-4 bg-primary/10 border border-primary/25 rounded-2xl animate-in fade-in slide-in-from-top-1 transition-all">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span className="text-xs font-bold text-primary">
                                กำลังปรับแต่งปุ่มลัด
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                                แตะ ✕ เพื่อลบ หรือแตะ + เพื่อเพิ่ม
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-xs px-2.5 py-1 rounded-xl bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1 cursor-pointer"
                            title="คืนค่าเริ่มต้น"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span className="hidden sm:inline">รีเซ็ต</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false)
                                toast.success("บันทึกการปรับแต่งปุ่มลัดแล้ว")
                            }}
                            className="text-xs px-3.5 py-1 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>เสร็จสิ้น</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between px-1 mb-3">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">
                            ทางลัดด่วน
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-[11px] text-muted-foreground/70 hover:text-foreground flex items-center gap-1 px-2.5 py-0.5 rounded-full hover:bg-muted/50 transition-colors cursor-pointer"
                        title="กดค้างที่ไอคอน หรือคลิกที่นี่เพื่อปรับแต่ง"
                    >
                        <Edit3 className="w-3 h-3" />
                        <span>กดค้างเพื่อแก้ไข</span>
                    </button>
                </div>
            )}

            {/* Icons Grid */}
            <div
                className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-8 gap-y-6 gap-x-3 sm:gap-x-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {displayedActions.map((action, index) => {
                    const Icon = action.icon
                    const isEven = index % 2 === 0
                    const jiggleClass = isEditing
                        ? isEven ? "animate-ios-jiggle" : "animate-ios-jiggle-alt"
                        : ""

                    return (
                        <div
                            key={action.id}
                            className={`relative flex flex-col items-center gap-2 group ${jiggleClass}`}
                        >
                            {/* Delete badge in edit mode */}
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleRemoveShortcut(action.id)
                                    }}
                                    className="absolute -top-1.5 -right-1 sm:right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 active:scale-90 text-white rounded-full flex items-center justify-center shadow-md z-30 transition-transform cursor-pointer border-2 border-background"
                                    title={`ลบ ${action.defaultLabel}`}
                                    aria-label={`ลบ ${action.defaultLabel}`}
                                >
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                            )}

                            {/* Shortcut Item Button / Link */}
                            {isEditing ? (
                                <div
                                    onClick={() => handleRemoveShortcut(action.id)}
                                    className="flex flex-col items-center gap-2 w-full cursor-pointer focus:outline-none"
                                >
                                    <div className={`p-4 rounded-2xl ${action.bg} ${action.color} shadow-sm group-hover:brightness-105 transition-all duration-200`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground text-center line-clamp-2 leading-tight group-hover:text-foreground transition-colors">
                                        {action.defaultLabel}
                                    </span>
                                </div>
                            ) : (
                                <Link
                                    href={action.href}
                                    onClick={(e) => {
                                        if (longPressTriggeredRef.current) {
                                            e.preventDefault()
                                            e.stopPropagation()
                                        }
                                    }}
                                    className="flex flex-col items-center gap-2 w-full group focus:outline-none"
                                >
                                    <div className={`p-4 rounded-2xl ${action.bg} ${action.color} shadow-sm group-hover:shadow-md group-hover:brightness-105 group-hover:-translate-y-0.5 transition-all duration-300`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground text-center line-clamp-2 leading-tight group-hover:text-foreground transition-colors">
                                        {action.defaultLabel}
                                    </span>
                                </Link>
                            )}
                        </div>
                    )
                })}

                {/* Add shortcut button in edit mode */}
                {isEditing && (
                    <div className="flex flex-col items-center gap-2 group animate-in fade-in zoom-in-90 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="p-4 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary shadow-sm flex items-center justify-center transition-all duration-200 group-hover:scale-105 cursor-pointer focus:outline-none"
                            title="เพิ่มทางลัด"
                        >
                            <Plus className="w-6 h-6 stroke-[2.5]" />
                        </button>
                        <span className="text-[10px] sm:text-xs font-bold text-primary text-center line-clamp-1">
                            + เพิ่มปุ่มลัด
                        </span>
                    </div>
                )}
            </div>

            {/* Add Shortcut Dialog */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border shadow-2xl">
                    <DialogHeader className="p-5 pb-3 border-b border-border/40">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-primary" />
                                    เพิ่มปุ่มลัดบนหน้าแรก
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    แสดงเฉพาะเมนูที่บทบาทของคุณ ({userRole}) มีสิทธิ์เข้าถึง
                                </DialogDescription>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative mt-3">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="ค้นหาทางลัด..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 text-xs bg-muted/50 focus:bg-background border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Category filter pills */}
                        {categories.length > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-none text-[11px]">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory("all")}
                                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                                        selectedCategory === "all"
                                            ? "bg-primary text-primary-foreground font-bold"
                                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    ทั้งหมด ({availableToAdd.length})
                                </button>
                                {categories.map(cat => {
                                    const count = availableToAdd.filter(s => s.category === cat).length
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                                                selectedCategory === cat
                                                    ? "bg-primary text-primary-foreground font-bold"
                                                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                            }`}
                                        >
                                            {cat} ({count})
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </DialogHeader>

                    {/* Available Items List */}
                    <div className="max-h-[380px] overflow-y-auto p-4 space-y-2">
                        {filteredAvailable.length > 0 ? (
                            filteredAvailable.map(item => {
                                const ItemIcon = item.icon
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleAddShortcut(item.id)}
                                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/60 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-2xl ${item.bg} ${item.color} shadow-xs group-hover:scale-105 transition-transform`}>
                                                <ItemIcon className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {item.defaultLabel}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAddShortcut(item.id)
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                                        >
                                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>เพิ่ม</span>
                                        </button>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="py-10 text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-bold text-foreground">
                                    {availableToAdd.length === 0
                                        ? "คุณได้เพิ่มปุ่มลัดทั้งหมดแล้ว"
                                        : "ไม่พบปุ่มลัดที่ค้นหา"}
                                </h4>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                    {availableToAdd.length === 0
                                        ? "ปุ่มลัดทั้งหมดที่คุณมีสิทธิ์เข้าถึงได้แสดงอยู่บนหน้าแรกเรียบร้อยแล้ว"
                                        : "ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            ปุ่มลัดปัจจุบัน: <strong className="text-foreground">{activeIds.length}</strong> รายการ
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                        >
                            เสร็จสิ้น
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
