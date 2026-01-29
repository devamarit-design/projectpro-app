"use client"

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { WorkItem, useProjects } from "@/context/project-context"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Target, MoveHorizontal, Plus, ChevronLeft, ChevronRight, GripVertical, SortDesc, Calendar as CalendarIcon, Type, Tag } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays, addDays, isToday, isSameWeek, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfDay } from "date-fns"
import { th } from "date-fns/locale"

interface ProjectGanttProps {
    projectId: string
    works: WorkItem[]
    onWorkUpdate: (workId: string, updates: any) => Promise<void>
    onWorkClick: (workId: string) => void
    onAddWork: () => void
    onReorder?: (newWorks: WorkItem[]) => void
}

type ViewMode = 'Day' | 'Week' | 'Month'

// ROW_HEIGHT increased to 72px for better readability
const ROW_HEIGHT = 72
const TABLE_COL_INDEX_WIDTH = 40
const TABLE_COL_CAT_WIDTH = 90
const TABLE_COL_TITLE_WIDTH = 180
const TABLE_COL_DATE_WIDTH = 100
const TABLE_COL_USER_WIDTH = 50
const TOTAL_TABLE_WIDTH = TABLE_COL_INDEX_WIDTH + TABLE_COL_CAT_WIDTH + TABLE_COL_TITLE_WIDTH + TABLE_COL_DATE_WIDTH + TABLE_COL_USER_WIDTH

export function ProjectGantt({ projectId, works: initialWorks, onWorkUpdate, onWorkClick, onAddWork, onReorder }: ProjectGanttProps) {
    const { users, currentUser } = useProjects()
    const { t } = useTranslation()

    const [viewMode, setViewMode] = useState<ViewMode>('Day')
    const [isTablePinned, setIsTablePinned] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [scrollX, setScrollX] = useState(0)
    const [viewWidth, setViewWidth] = useState(0)
    const [sortBy, setSortBy] = useState<'sortOrder' | 'startDate' | 'title' | 'category' | 'progress' | 'projectName'>('sortOrder')

    // Sort works by current criteria
    const works = useMemo(() => {
        return [...initialWorks].sort((a, b) => {
            if (sortBy === 'sortOrder') return (a.sortOrder || 0) - (b.sortOrder || 0)
            if (sortBy === 'startDate') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            if (sortBy === 'title') return (a.title || "").localeCompare(b.title || "")
            if (sortBy === 'category') return (a.category || "").localeCompare(b.category || "")
            if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0)
            if (sortBy === 'projectName') return ((a as any).projectName || "").localeCompare((b as any).projectName || "")
            return 0
        })
    }, [initialWorks, sortBy])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            // Only allow manual reorder if sorted by sortOrder
            if (sortBy !== 'sortOrder') return

            const oldIndex = works.findIndex(w => w.id === active.id)
            const newIndex = works.findIndex(w => w.id === over.id)
            const newOrderedWorks = arrayMove(works, oldIndex, newIndex)
            onReorder?.(newOrderedWorks)
        }
    }

    const config = useMemo(() => {
        switch (viewMode) {
            case 'Week': return { colWidth: 160, interval: eachWeekOfInterval, fmt: "dd MMM", subFmt: `'${t.schedule?.gantt?.week || "Week"}' w` }
            case 'Month': return { colWidth: 240, interval: eachMonthOfInterval, fmt: "MMMM", subFmt: "yyyy" }
            default: return { colWidth: 65, interval: eachDayOfInterval, fmt: "d", subFmt: "EEE" }
        }
    }, [viewMode])

    const startDate = useMemo(() => startOfDay(addDays(new Date(), -30)), [])
    const endDate = useMemo(() => startOfDay(addDays(new Date(), 365)), [])

    const intervals = useMemo(() => {
        try {
            const range = { start: startDate, end: endDate }
            if (viewMode === 'Week') return eachWeekOfInterval(range)
            if (viewMode === 'Month') return eachMonthOfInterval(range)
            return eachDayOfInterval(range)
        } catch (e) {
            return []
        }
    }, [startDate, endDate, viewMode])

    const containerRef = useRef<HTMLDivElement>(null)
    const [dragMode, setDragMode] = useState<'idle' | 'pan' | 'move' | 'resize-start' | 'resize-end'>('idle')
    const [draggingWorkId, setDraggingWorkId] = useState<string | null>(null)
    const [startX, setStartX] = useState(0)
    const [scrollLeftStart, setScrollLeftStart] = useState(0)
    const [pendingDelta, setPendingDelta] = useState(0)

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024
            setIsMobile(mobile)
            if (!mobile) setIsTablePinned(true)
            if (containerRef.current) setViewWidth(containerRef.current.clientWidth)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollX(e.currentTarget.scrollLeft)
        if (viewWidth === 0) setViewWidth(e.currentTarget.clientWidth)
    }

    const scrollToToday = () => {
        if (!containerRef.current) return
        const today = new Date()
        const tableOffset = (isTablePinned && !isMobile) ? TOTAL_TABLE_WIDTH : 0
        let todayOffset = 0

        if (viewMode === 'Day') {
            todayOffset = differenceInDays(today, startDate) * config.colWidth
        } else if (viewMode === 'Week') {
            todayOffset = (differenceInDays(startOfWeek(today), startOfWeek(startDate)) / 7) * config.colWidth
        } else {
            const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth())
            todayOffset = monthDiff * config.colWidth
        }

        containerRef.current.scrollTo({
            left: tableOffset + todayOffset - (containerRef.current.clientWidth / 2) + (config.colWidth / 2),
            behavior: 'smooth'
        })
    }

    useEffect(() => {
        setTimeout(scrollToToday, 300)
    }, [viewMode, isTablePinned, isMobile])

    const handlePointerDown = (e: React.PointerEvent, mode: typeof dragMode = 'pan', workId: string | null = null) => {
        // Only allow primary button (left click) or touch
        if (e.pointerType === 'mouse' && e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragMode(mode)
        setDraggingWorkId(workId)
        setStartX(e.pageX)
        if (containerRef.current) setScrollLeftStart(containerRef.current.scrollLeft)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (dragMode === 'pan' && containerRef.current) {
            const dx = (e.pageX - startX)
            containerRef.current.scrollLeft = scrollLeftStart - dx * 1.5
        } else if (draggingWorkId && dragMode !== 'pan') {
            const dx = e.pageX - startX
            const deltaDays = Math.round(dx / (config.colWidth / (viewMode === 'Week' ? 7 : viewMode === 'Month' ? 30 : 1)))
            setPendingDelta(deltaDays)
        }
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        e.currentTarget.releasePointerCapture(e.pointerId)
        if (draggingWorkId && dragMode !== 'pan') {
            const dx = e.pageX - startX
            const deltaDays = Math.round(dx / (config.colWidth / (viewMode === 'Week' ? 7 : viewMode === 'Month' ? 30 : 1)))
            const work = works.find(w => w.id === draggingWorkId)
            if (work && deltaDays !== 0) {
                let updates: Partial<WorkItem> = {}
                const s = new Date(work.startDate); const en = new Date(work.endDate)
                if (dragMode === 'move') {
                    updates.startDate = addDays(s, deltaDays).toISOString()
                    updates.endDate = addDays(en, deltaDays).toISOString()
                } else if (dragMode === 'resize-start') {
                    const ns = addDays(s, deltaDays)
                    if (ns < en) updates.startDate = ns.toISOString()
                } else if (dragMode === 'resize-end') {
                    const ne = addDays(en, deltaDays)
                    if (ne > s) updates.endDate = ne.toISOString()
                }
                if (Object.keys(updates).length > 0) onWorkUpdate(draggingWorkId, updates)
            }
        }
        setDragMode('idle'); setDraggingWorkId(null); setPendingDelta(0)
    }

    const getAssignee = (uid?: string) => users.find(u => u.id === uid)
    const canCreate = currentUser?.role === "Owner" || currentUser?.role === "Admin" || currentUser?.role === "Staff"

    const tableWidthOffset = (isTablePinned && !isMobile) ? TOTAL_TABLE_WIDTH : 0

    return (
        <div className="flex flex-col h-full bg-background rounded-[42px] overflow-hidden border border-border shadow-[0_32px_100px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_100px_-20px_rgba(0,0,0,0.8)] font-sans">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-card/95 border-b border-border backdrop-blur-3xl z-[40] gap-4">
                <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto no-scrollbar">
                    <div className="bg-muted p-1 rounded-2xl border border-border flex shrink-0 shadow-inner">
                        {(['Day', 'Week', 'Month'] as const).map((m) => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className={cn(
                                    "px-5 py-2 text-[11px] font-black rounded-xl transition-all uppercase tracking-widest",
                                    viewMode === m ? "bg-primary text-primary-foreground shadow-lg scale-105" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {isMobile ? m.charAt(0) : m}
                            </button>
                        ))}
                    </div>

                    <Button variant="secondary" size="icon" onClick={() => setIsTablePinned(!isTablePinned)}
                        className={cn("rounded-2xl h-11 w-11 bg-muted border border-border text-foreground shrink-0", (!isTablePinned || isMobile) && "text-primary border-primary/30")}
                    >
                        {isTablePinned && !isMobile ? <Eye size={20} /> : <EyeOff size={20} />}
                    </Button>

                    <Button variant="outline" onClick={scrollToToday} className="rounded-2xl h-11 px-6 bg-muted/50 border-border text-foreground font-bold shrink-0">
                        <Target className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-xs uppercase font-black">{t.schedule?.today || "วันนี้"}</span>
                    </Button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full border border-border whitespace-nowrap hidden lg:flex">
                        <MoveHorizontal className="w-4 h-4 text-muted-foreground/40" />
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{t.schedule?.pan_hint || "คลิกเมาส์ค้างเพื่อเลื่อนขวา"}</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-2xl h-11 px-6 bg-muted/50 border-border text-foreground font-bold shrink-0">
                                <SortDesc className="mr-2 h-4 w-4 text-primary" />
                                <span className="text-xs uppercase font-black">{t.schedule?.sort_by || "Sort by"}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-popover border-border text-popover-foreground rounded-2xl w-48 p-2">
                            <DropdownMenuItem onClick={() => setSortBy('sortOrder')} className="rounded-xl focus:bg-primary/20 focus:text-foreground cursor-pointer py-3 px-4">
                                <GripVertical className="mr-3 h-4 w-4 opacity-50" />
                                <span className="text-xs font-bold font-sans">{t.schedule?.sort?.default || "ลำดับ (Default)"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('startDate')} className="rounded-xl focus:bg-primary/20 focus:text-white cursor-pointer py-3 px-4">
                                <CalendarIcon className="mr-3 h-4 w-4 opacity-50" />
                                <span className="text-xs font-bold font-sans">{t.schedule?.sort?.start_date || "วันที่เริ่มงาน"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('title')} className="rounded-xl focus:bg-primary/20 focus:text-white cursor-pointer py-3 px-4">
                                <Type className="mr-3 h-4 w-4 opacity-50" />
                                <span className="text-xs font-bold font-sans">{t.schedule?.sort?.title || "ชื่อรายการ"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('category')} className="rounded-xl focus:bg-primary/20 focus:text-white cursor-pointer py-3 px-4">
                                <Tag className="mr-3 h-4 w-4 opacity-50" />
                                <span className="text-xs font-bold font-sans">{t.schedule?.sort?.category || "ประเภทงาน"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('progress')} className="rounded-xl focus:bg-primary/20 focus:text-white cursor-pointer py-3 px-4">
                                <Plus className="mr-3 h-4 w-4 opacity-50 rotate-45" />
                                <span className="text-xs font-bold font-sans">{t.schedule?.sort?.progress || "ความคืบหน้า"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('projectName')} className="rounded-xl focus:bg-primary/20 focus:text-foreground cursor-pointer py-3 px-4">
                                <Target className="mr-3 h-4 w-4 opacity-50" />
                                <span className="text-xs font-bold font-sans">{t.schedule?.sort?.project || "ชื่อโปรเจค"}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {canCreate && (
                        <Button onClick={onAddWork} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 px-8 font-black text-[12px] uppercase tracking-widest shadow-xl">
                            <Plus className="mr-2 h-5 w-5 stroke-[3px]" />
                            {t.schedule?.add_work || "เพิ่มเวิร์ค"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Scrolling Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                <div
                    ref={containerRef}
                    onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
                    onPointerDown={(e) => handlePointerDown(e, 'pan')}
                    onScroll={handleScroll}
                    className={cn("flex-1 overflow-auto relative select-none bg-background scroll-smooth", dragMode === 'pan' ? "cursor-grabbing" : "cursor-default")}
                >
                    <div style={{ width: tableWidthOffset + (intervals.length * config.colWidth), minWidth: '100%' }} className="relative">

                        {/* Header Row */}
                        <div className="flex sticky top-0 z-[35] bg-card border-b border-border h-[65px]">
                            {isTablePinned && !isMobile && (
                                <div className="flex sticky left-0 z-[36] bg-card shadow-2xl border-r border-border">
                                    <div style={{ width: TABLE_COL_INDEX_WIDTH }} className="flex items-center justify-center text-[10px] font-black text-muted-foreground/30 uppercase">{t.schedule?.table?.index || "#"}</div>
                                    <div style={{ width: TABLE_COL_CAT_WIDTH }} className="flex items-center px-4 text-[10px] font-black text-muted-foreground/30 uppercase">{t.schedule?.table?.category || "ประเภท"}</div>
                                    <div style={{ width: TABLE_COL_TITLE_WIDTH }} className="flex items-center px-6 text-[10px] font-black text-muted-foreground/30 uppercase">{t.schedule?.table?.task || "รายการงาน"}</div>
                                    <div style={{ width: TABLE_COL_DATE_WIDTH }} className="flex items-center px-6 text-[10px] font-black text-muted-foreground/30 uppercase">{t.schedule?.table?.due || "กำหนด"}</div>
                                    <div style={{ width: TABLE_COL_USER_WIDTH }} className="flex items-center justify-center text-[10px] font-black text-muted-foreground/30 uppercase">{t.schedule?.table?.team || "ทีม"}</div>
                                </div>
                            )}

                            {intervals.map((d: Date, i: number) => {
                                const active = viewMode === 'Day' ? isToday(d) : viewMode === 'Week' ? isSameWeek(new Date(), d) : isSameMonth(new Date(), d)
                                return (
                                    <div key={i} style={{ width: config.colWidth }}
                                        className={cn("flex flex-col items-center justify-center shrink-0 border-r border-border/50", active && "bg-primary/10")}
                                    >
                                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase leading-none mb-1">{format(d, config.subFmt, { locale: th })}</span>
                                        <span className={cn("text-sm font-black tracking-tight", active ? "text-primary" : "text-muted-foreground")}>{format(d, config.fmt, { locale: th })}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Today Marker */}
                        <div className="absolute top-0 bottom-0 z-[30] w-[2px] bg-primary/40 shadow-[0_0_12px_rgba(59,130,246,0.6)] pointer-events-none"
                            style={{
                                left: tableWidthOffset + (viewMode === 'Month'
                                    ? ((new Date().getFullYear() - startDate.getFullYear()) * 12 + (new Date().getMonth() - startDate.getMonth())) * config.colWidth + (new Date().getDate() / 31 * config.colWidth)
                                    : (differenceInDays(new Date(), startDate) / (viewMode === 'Week' ? 7 : 1)) * config.colWidth + (config.colWidth / 2))
                            }}
                        />

                        {/* Rows */}
                        <SortableContext
                            items={works.map(w => w.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {works.map((w, i) => (
                                <SortableGanttRow
                                    key={w.id}
                                    work={w}
                                    index={i}
                                    viewMode={viewMode}
                                    startDate={startDate}
                                    config={config}
                                    isTablePinned={isTablePinned}
                                    isMobile={isMobile}
                                    tableWidthOffset={tableWidthOffset}
                                    scrollX={scrollX}
                                    containerRef={containerRef}
                                    draggingWorkId={draggingWorkId}
                                    handlePointerDown={handlePointerDown}
                                    onWorkClick={onWorkClick}
                                    intervals={intervals}
                                    getAssignee={getAssignee}
                                    pendingDelta={draggingWorkId === w.id ? pendingDelta : 0}
                                    dragMode={draggingWorkId === w.id ? dragMode : 'idle'}
                                    isReorderEnabled={sortBy === 'sortOrder'}
                                    onWorkUpdate={onWorkUpdate}
                                />
                            ))}
                        </SortableContext>
                        <div style={{ height: 100 }} />
                    </div>
                </div>
            </DndContext>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 100px; }
            `}</style>
        </div>
    )
}

interface SortableGanttRowProps {
    work: WorkItem
    index: number
    viewMode: ViewMode
    startDate: Date
    config: any
    isTablePinned: boolean
    isMobile: boolean
    tableWidthOffset: number
    scrollX: number
    containerRef: React.RefObject<HTMLDivElement | null>
    draggingWorkId: string | null
    handlePointerDown: (e: React.PointerEvent, mode: any, workId: string | null) => void
    onWorkClick: (workId: string) => void
    intervals: Date[]
    getAssignee: (uid?: string) => any
    pendingDelta: number
    dragMode: 'idle' | 'pan' | 'move' | 'resize-start' | 'resize-end'
    isReorderEnabled: boolean
    onWorkUpdate: (workId: string, updates: any) => Promise<void>
}

function SortableGanttRow({
    work,
    index,
    viewMode,
    startDate,
    config,
    isTablePinned,
    isMobile,
    tableWidthOffset,
    scrollX,
    containerRef,
    draggingWorkId,
    handlePointerDown,
    onWorkClick,
    intervals,
    getAssignee,
    pendingDelta,
    dragMode,
    isReorderEnabled,
    onWorkUpdate
}: SortableGanttRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: work.id })
    const { t } = useTranslation()

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative' as const
    }

    const start = new Date(work.startDate)
    const en = new Date(work.endDate)
    const assignee = getAssignee(work.assignedTo)

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600']
    const rawColor = work.color || colors[index % colors.length]

    let taskPxLeft = 0; let taskPxWidth = 0
    if (viewMode === 'Day') {
        taskPxLeft = differenceInDays(start, startDate) * config.colWidth
        taskPxWidth = Math.max(1, differenceInDays(en, start)) * config.colWidth
    } else if (viewMode === 'Week') {
        taskPxLeft = (differenceInDays(start, startDate) / 7) * config.colWidth
        taskPxWidth = (differenceInDays(en, start) / 7) * config.colWidth
    } else {
        const mDiffStart = (start.getFullYear() - startDate.getFullYear()) * 12 + (start.getMonth() - startDate.getMonth())
        const dOffset = start.getDate() / 31
        taskPxLeft = (mDiffStart + dOffset) * config.colWidth
        taskPxWidth = (differenceInDays(en, start) / 30) * config.colWidth
    }

    // Ghost Bar calculation
    let ghostPxLeft = taskPxLeft; let ghostPxWidth = taskPxWidth
    if (pendingDelta !== 0) {
        let deltaPx = pendingDelta * (config.colWidth / (viewMode === 'Week' ? 7 : viewMode === 'Month' ? 30 : 1))
        if (dragMode === 'move') {
            ghostPxLeft += deltaPx
        } else if (dragMode === 'resize-start') {
            ghostPxLeft += deltaPx
            ghostPxWidth -= deltaPx
        } else if (dragMode === 'resize-end') {
            ghostPxWidth += deltaPx
        }
    }

    const visibleLeft = scrollX - tableWidthOffset
    const visibleRight = scrollX - tableWidthOffset + (containerRef.current?.clientWidth || 0)

    const isFullyOffLeft = (taskPxLeft + taskPxWidth) < visibleLeft
    const isFullyOffRight = taskPxLeft > visibleRight

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex group/row border-b border-border/30 hover:bg-muted/30 transition-colors",
                isDragging && "bg-muted opacity-80"
            )}
            style={{ ...style, height: ROW_HEIGHT }}
        >
            {isTablePinned && !isMobile && (
                <div className="flex sticky left-0 z-[32] bg-background border-r border-border shadow-2xl shrink-0 group-hover/row:bg-muted/50 transition-colors">
                    <div style={{ width: TABLE_COL_INDEX_WIDTH }} className="flex items-center justify-center group/grip relative">
                        {isReorderEnabled && (
                            <div className="absolute left-1 z-[33]" onPointerDown={(e) => e.stopPropagation()}>
                                <div
                                    className="opacity-20 group-hover/grip:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
                                    {...attributes}
                                    {...listeners}
                                >
                                    <GripVertical size={14} className="text-foreground" />
                                </div>
                            </div>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground/30">{index + 1}</span>
                    </div>
                    <div style={{ width: TABLE_COL_CAT_WIDTH }} className="flex items-center px-4 overflow-hidden">
                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/20 text-blue-300 px-2 py-0.5 truncate max-w-full uppercase font-black tracking-tight">
                            {work.category || "ทั่วไป"}
                        </Badge>
                    </div>
                    <div style={{ width: TABLE_COL_TITLE_WIDTH }} className="flex items-center px-6 font-bold text-[13px] text-foreground/70 group-hover:text-foreground transition-colors truncate">{work.title}</div>
                    <div style={{ width: TABLE_COL_DATE_WIDTH }} className="flex flex-col justify-center px-6 text-[10px] font-black text-muted-foreground/40 uppercase leading-none gap-1">
                        <span>{format(start, "d MMM", { locale: th })}</span>
                        <span className="opacity-30">{t.schedule?.gantt?.to || "ถึง"} {format(en, "d MMM", { locale: th })}</span>
                    </div>
                    <div style={{ width: TABLE_COL_USER_WIDTH }} className="flex items-center justify-center">
                        {assignee && (
                            <Avatar className="w-8 h-8 border-2 border-border/50 shadow-xl shrink-0">
                                <AvatarImage src={assignee.avatar} />
                                <AvatarFallback className="text-[10px] font-black bg-primary/20 text-primary">{assignee.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                </div>
            )}

            <div className="relative flex-1">
                <div className="absolute inset-0 flex pointer-events-none">
                    {intervals.map((_: Date, idx: number) => <div key={idx} style={{ width: config.colWidth }} className="h-full border-r border-border/20" />)}
                </div>

                {isFullyOffLeft && (
                    <div
                        className={cn(
                            "sticky z-[31] flex items-center h-9 mt-[16px] px-4 rounded-[14px] shadow-lg dark:shadow-2xl border border-white/20 cursor-pointer overflow-hidden backdrop-blur-md opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all",
                            rawColor
                        )}
                        style={{ left: 8, width: 220 }}
                        onClick={() => onWorkClick(work.id)}
                    >
                        <span className="text-[11px] font-black text-white uppercase truncate flex-1">{work.title}</span>
                        <ChevronRight className="w-3 h-3 text-white/50 ml-2" />
                    </div>
                )}

                {isFullyOffRight && (
                    <div
                        className={cn(
                            "sticky z-[31] flex items-center h-9 mt-[16px] px-4 rounded-[14px] shadow-lg dark:shadow-2xl border border-white/20 cursor-pointer overflow-hidden backdrop-blur-md transition-all",
                            rawColor
                        )}
                        style={{ left: (containerRef.current?.clientWidth || 800) - 230, width: 220 }}
                        onClick={() => onWorkClick(work.id)}
                    >
                        <ChevronLeft className="w-3 h-3 text-white/50 mr-2" />
                        <span className="text-[11px] font-black text-white uppercase truncate flex-1">{work.title}</span>
                    </div>
                )}


                <div
                    className={cn(
                        "absolute top-[18px] h-9 rounded-[18px] flex items-center px-4 shadow-xl z-[20] transition-all touch-none select-none",
                        rawColor,
                        draggingWorkId === work.id ? "ring-2 ring-white scale-[1.03] z-[25]" : "hover:scale-[1.015]",
                        (isFullyOffLeft || isFullyOffRight) && "opacity-0 pointer-events-none"
                    )}
                    style={{ left: taskPxLeft + 4, width: Math.max(40, taskPxWidth - 8), cursor: draggingWorkId ? 'grabbing' : 'pointer' }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        handlePointerDown(e, 'move', work.id);
                    }}

                >
                    <div className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 rounded-l-xl shrink-0"
                        onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-start', work.id) }}
                    />
                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden h-full">
                        <span
                            className="text-[11px] font-black text-white uppercase truncate px-2 py-0.5 rounded cursor-pointer hover:bg-white/20 transition-colors leading-none tracking-tight z-[5]"
                            onClick={(e) => { e.stopPropagation(); onWorkClick(work.id); }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {work.title} {(work as any).projectName ? `(${(work as any).projectName})` : ''}
                        </span>
                        {isMobile && <span
                            className="text-[8px] font-bold text-white/50 leading-none mt-1 cursor-pointer z-[5]"
                            onClick={(e) => { e.stopPropagation(); onWorkClick(work.id); }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >#{(work.category || "ทั่วไป")}</span>}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 rounded-r-xl shrink-0"
                        onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-end', work.id) }}
                    />

                    {work.progress > 0 && (
                        <div className="absolute bottom-1 left-4 right-4 h-0.5 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white/40" style={{ width: `${work.progress}%` }} />
                        </div>
                    )}
                </div>



                {/* Ghost Preview Bar */}
                {pendingDelta !== 0 && (
                    <div
                        className={cn(
                            "absolute top-[18px] h-9 rounded-[18px] shadow-lg dark:shadow-2xl border-2 border-white dark:border-white/80 animate-pulse pointer-events-none opacity-60 grayscale",
                            rawColor
                        )}
                        style={{ left: ghostPxLeft + 4, width: Math.max(40, ghostPxWidth - 8) }}
                    />
                )}
            </div>
        </div>
    )
}
