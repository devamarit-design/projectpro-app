"use client";

import React from "react";
import {
    BarChart3,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Clock,
    TrendingUp,
    Users,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
    { label: 'Total Messages', value: '1,284', change: '+12.5%', icon: MessageCircle, trend: 'up' },
    { label: 'Wait Time', value: '4m 32s', change: '-1.2m', icon: Clock, trend: 'up' },
    { label: 'Resolved', value: '856', change: '+5.4%', icon: CheckCircle2, trend: 'up' },
    { label: 'Pending', value: '42', change: '+8', icon: AlertCircle, trend: 'down' },
];

const trackingStats = [
    { name: 'John Doe', status: 'In Progress', platform: 'Meta', time: '10m ago', color: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' },
    { name: 'Sarah Wilson', status: 'Completed', platform: 'Line', time: '2h ago', color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' },
    { name: 'Michael Chen', status: 'Problem', platform: 'YouTube', time: '5m ago', color: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' },
    { name: 'Alex Rivera', status: 'Pending', platform: 'Meta', time: '1h ago', color: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' },
];

export function DashboardHome() {
    return (
        <div className="flex-1 p-6 lg:p-10 space-y-10 overflow-y-auto custom-scrollbar bg-background text-foreground animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground mt-1.5 font-medium">สรุปภาพรวมการแชทและการติดตามสถานลูกค้าแบบ Real-time</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 bg-card rounded-2xl shadow-md flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                        <span className="text-sm font-bold tracking-tight">Live System Status</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-card p-6 rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full transition-transform group-hover:scale-150 duration-700" />
                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <div className="p-3.5 bg-secondary rounded-2xl text-primary shadow-sm group-hover:shadow-md transition-all">
                                <s.icon size={22} />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm",
                                s.trend === 'up' ? "text-green-600 bg-green-500/10" : "text-amber-600 bg-amber-500/10"
                            )}>
                                {s.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {s.change}
                            </div>
                        </div>
                        <div className="text-3xl font-black tracking-tight relative z-10">{s.value}</div>
                        <div className="text-[11px] text-muted-foreground mt-1.5 font-bold uppercase tracking-widest relative z-10">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Tracking List */}
                <div className="lg:col-span-2 bg-card rounded-[2.5rem] shadow-xl overflow-hidden min-h-[450px]">
                    <div className="p-8 flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                            <Users size={20} className="text-primary" />
                            การติดตามสถานะลูกค้า (Active Tracking)
                        </h3>
                        <button className="text-xs font-black text-primary hover:text-primary/80 uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-xl transition-all">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary/30 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">
                                    <th className="px-8 py-5">Customer</th>
                                    <th className="px-8 py-5">Platform</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Last Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-0">
                                {trackingStats.map((u, i) => (
                                    <tr key={i} className="hover:bg-secondary/40 transition-all duration-300 group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-secondary shadow-sm flex items-center justify-center font-black text-xs overflow-hidden text-primary group-hover:scale-110 transition-transform">
                                                    {u.name[0]}
                                                </div>
                                                <span className="text-sm font-bold">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-[10px] font-bold px-3 py-1.5 bg-background rounded-xl shadow-sm uppercase tracking-wider">{u.platform}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2.5">
                                                <span className={cn("w-2.5 h-2.5 rounded-full", u.color)} />
                                                <span className="text-xs font-black uppercase tracking-tight">{u.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-xs text-muted-foreground font-bold">{u.time}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Insights */}
                <div className="bg-card rounded-[2.5rem] shadow-xl p-8 flex flex-col">
                    <h3 className="text-lg font-bold flex items-center gap-3 mb-8">
                        <TrendingUp size={20} className="text-primary" />
                        สรุปรายช่องทาง
                    </h3>
                    <div className="space-y-8 flex-1 flex flex-col justify-center">
                        <PlatformProgress label="Line Official" value={65} color="bg-green-500" />
                        <PlatformProgress label="Meta / Instagram" value={45} color="bg-pink-500" />
                        <PlatformProgress label="YouTube" value={20} color="bg-red-500" />
                    </div>
                    <div className="mt-10 p-5 bg-secondary/40 rounded-3xl shadow-inner group">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-primary rounded-full" />
                            AI Recommendation
                        </div>
                        <p className="text-xs leading-relaxed font-bold text-foreground/80 group-hover:text-foreground transition-colors">
                            แชทจาก Meta เพิ่มขึ้น 15% ในช่วง 2 ชั่วโมงที่ผ่านมา แนะนำให้เพิ่มเจ้าหน้าที่ตอบกลับครับ
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlatformProgress({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span>{label}</span>
                <span className="text-primary">{value}%</span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden shadow-inner p-0.5">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000 shadow-sm", color)}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
