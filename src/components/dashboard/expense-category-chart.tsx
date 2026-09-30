"use client"

import { useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useProjects } from "@/context/project-context"
import { getExpenseAmountForProject } from "@/lib/project-utils"
import { PieChart as PieIcon, Layers, Wrench, HardHat, Package, FileQuestion, Fuel, Truck } from "lucide-react"

interface ExpenseCategoryChartProps {
    selectedProjectId?: string
}

const CATEGORY_CONFIG: Record<string, { label: string; subLabel: string; color: string; icon: any }> = {
    Material: {
        label: "ค่าวัสดุ / อุปกรณ์",
        subLabel: "Material & Goods",
        color: "#3b82f6", // Blue
        icon: Package
    },
    Labor: {
        label: "ค่าแรง / ช่าง",
        subLabel: "Labor & Craftsmen",
        color: "#f59e0b", // Amber
        icon: HardHat
    },
    "Sub-contract": {
        label: "ผู้รับเหมาช่วง",
        subLabel: "Sub-contractors",
        color: "#8b5cf6", // Purple
        icon: Wrench
    },
    Fuel: {
        label: "ค่าน้ำมัน / เชื้อเพลิง",
        subLabel: "Fuel & Transport",
        color: "#06b6d4", // Cyan
        icon: Fuel
    },
    Equipment: {
        label: "เครื่องจักร / เครื่องมือ",
        subLabel: "Machinery & Equipment",
        color: "#10b981", // Emerald
        icon: Truck
    },
    Other: {
        label: "ค่าใช้จ่ายอื่นๆ",
        subLabel: "General / Other",
        color: "#ec4899", // Pink
        icon: FileQuestion
    }
}

export function ExpenseCategoryChart({ selectedProjectId }: ExpenseCategoryChartProps) {
    const { expenses, projects } = useProjects()
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const categoryData = useMemo(() => {
        const isAll = !selectedProjectId || selectedProjectId === "all"
        const totals: Record<string, number> = {
            Material: 0,
            Labor: 0,
            "Sub-contract": 0,
            Other: 0
        }

        let overallTotal = 0

        expenses.forEach(e => {
            if (e.isDeleted || e.status === "Unpaid") return

            // If split items exist
            if (e.items && e.items.length > 0) {
                e.items.forEach(item => {
                    const pid = item.projectId || e.projectId
                    if (isAll || pid === selectedProjectId) {
                        const cat = item.category || e.category || "Other"
                        const amt = Number(item.amount) || 0
                        totals[cat] = (totals[cat] || 0) + amt
                        overallTotal += amt
                    }
                })
            } else {
                if (isAll || e.projectId === selectedProjectId) {
                    const cat = e.category || "Other"
                    const amt = e.totalValue || 0
                    totals[cat] = (totals[cat] || 0) + amt
                    overallTotal += amt
                }
            }
        })

        const chartItems = Object.entries(totals).map(([key, value]) => {
            const config = CATEGORY_CONFIG[key] || {
                label: key,
                subLabel: "",
                color: "#6b7280",
                icon: Layers
            }
            const percentage = overallTotal > 0 ? (value / overallTotal) * 100 : 0
            return {
                key,
                name: config.label,
                subLabel: config.subLabel,
                value,
                percentage,
                color: config.color,
                icon: config.icon
            }
        }).sort((a, b) => b.value - a.value)

        return {
            items: chartItems,
            total: overallTotal
        }
    }, [expenses, selectedProjectId])

    const selectedProjectName = useMemo(() => {
        if (!selectedProjectId || selectedProjectId === "all") return null
        return projects.find(p => p.id === selectedProjectId)?.name || "โครงการที่เลือก"
    }, [projects, selectedProjectId])

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-blue-400" />
                        สัดส่วนค่าใช้จ่ายตามหมวดหมู่
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedProjectName ? `เฉพาะ: ${selectedProjectName}` : "รวมค่าใช้จ่ายทุกโครงการในระบบ"}
                    </p>
                </div>
                <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                    รวม ฿{categoryData.total.toLocaleString()}
                </span>
            </div>

            {categoryData.total === 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground/60 border border-dashed border-white/10 rounded-2xl">
                    <PieIcon className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">ไม่มีข้อมูลค่าใช้จ่ายในช่วงนี้</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
                    {/* Donut Chart */}
                    <div className="md:col-span-6 h-[260px] relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload
                                            return (
                                                <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl z-50">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                                        <span className="text-sm font-semibold text-foreground">{data.name}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-mono">
                                                        ฿{Number(data.value).toLocaleString()} ({data.percentage.toFixed(1)}%)
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Pie
                                    data={categoryData.items}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    dataKey="value"
                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                >
                                    {categoryData.items.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke="transparent"
                                            className="transition-all duration-300 cursor-pointer"
                                            style={{
                                                filter: activeIndex === index ? `drop-shadow(0 0 8px ${entry.color}80)` : 'none',
                                                transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                                                transformOrigin: 'center center'
                                            }}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Metric */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                รายจ่ายรวม
                            </span>
                            <span className="text-lg font-bold font-mono text-foreground">
                                ฿{categoryData.total >= 1000000 
                                    ? (categoryData.total / 1000000).toFixed(2) + 'M' 
                                    : (categoryData.total / 1000).toFixed(0) + 'k'}
                            </span>
                        </div>
                    </div>

                    {/* Legend & Breakdown List */}
                    <div className="md:col-span-6 space-y-2.5">
                        {categoryData.items.map((cat, idx) => {
                            const Icon = cat.icon
                            const isHovered = activeIndex === idx
                            return (
                                <div
                                    key={cat.key}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                        isHovered 
                                            ? 'bg-muted/40 border-white/20 shadow-sm' 
                                            : 'bg-muted/10 border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                            style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-foreground leading-tight">
                                                {cat.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {cat.subLabel}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-bold font-mono text-foreground">
                                            ฿{cat.value.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] font-mono text-muted-foreground" style={{ color: cat.color }}>
                                            {cat.percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
