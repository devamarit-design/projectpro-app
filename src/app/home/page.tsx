"use client"

import * as React from "react"
import Link from "next/link"
import {
    Sparkles,
    CheckCircle2,
    ArrowRight,
    ScanLine,
    FileText,
    TrendingUp,
    ShieldCheck,
    Zap,
    Users,
    Building2,
    HardHat,
    Receipt,
    Calculator,
    ChevronDown,
    ChevronUp,
    Star,
    Phone,
    Mail,
    Globe,
    ExternalLink,
    Play,
    Check,
    LayoutDashboard,
    PieChart,
    MessageSquare,
    Layers,
    Smartphone,
    Bell,
    Lock
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function HomePage() {
    const [activeTab, setActiveTab] = React.useState<"pnl" | "scan" | "jobsheet" | "docs">("pnl")
    const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("yearly")
    const [openFaq, setOpenFaq] = React.useState<{ [key: number]: boolean }>({ 0: true })

    const toggleFaq = (index: number) => {
        setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }))
    }

    return (
        <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">

            {/* Background Glow Orbs */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0 opacity-40 blur-[120px] bg-gradient-to-b from-amber-500/20 via-orange-600/10 to-transparent" />
            <div className="fixed top-1/3 left-0 w-[400px] h-[400px] pointer-events-none z-0 opacity-20 blur-[140px] bg-emerald-500/20" />
            <div className="fixed bottom-1/4 right-0 w-[500px] h-[500px] pointer-events-none z-0 opacity-20 blur-[150px] bg-cyan-500/20" />

            {/* ======================================================== */}
            {/* 1. HEADER / NAVIGATION BAR                                */}
            {/* ======================================================== */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090D16]/80 border-b border-slate-800/80 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    {/* Brand Logo */}
                    <Link href="/home" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all">
                            <div className="w-full h-full bg-[#090D16] rounded-[14px] flex items-center justify-center">
                                <HardHat className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-black tracking-tight text-white font-mono">Hipsloth</span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 uppercase tracking-wider">
                                    PRO
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block -mt-1 tracking-wider">Project Management Platform</span>
                        </div>
                    </Link>

                    {/* Nav Links (Desktop) */}
                    <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#features" className="hover:text-amber-400 transition-colors">ฟีเจอร์หลัก</a>
                        <a href="#demo" className="hover:text-amber-400 transition-colors">สาธิตระบบ</a>
                        <a href="#solutions" className="hover:text-amber-400 transition-colors">สำหรับใคร</a>
                        <a href="#pricing" className="hover:text-amber-400 transition-colors">แพ็กเกจราคา</a>
                        <a href="#faq" className="hover:text-amber-400 transition-colors">คำถามที่พบบ่อย</a>
                    </nav>

                    {/* Auth & Dashboard Buttons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700"
                        >
                            เข้าสู่ระบบ
                        </Link>
                        <Link
                            href="/"
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <span>เข้าสู่ระบบแอป</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ======================================================== */}
            {/* 2. HERO SECTION                                          */}
            {/* ======================================================== */}
            <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                    {/* Pill Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs sm:text-sm font-bold mb-8 animate-in fade-in zoom-in duration-500">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>ระบบบริหารงานก่อสร้าง & รีโนเวท อันดับ 1 สำหรับทีมยุคใหม่</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.15] text-white max-w-5xl mx-auto mb-6">
                        คุมไซต์งาน คุมงบประมาณ{" "}
                        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
                            กำไรไม่รั่วไหล
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        ยกระดับการทำงานก่อสร้างด้วย <strong className="text-white">AI สแกนบิลซื้อของ</strong>, ระบบติดตามรายรับ-รายจ่าย Real-time,
                        ออกใบเสนอราคาแยกโซน และ JobSheet รายงานไซต์งานบนมือถือ ครบจบในแพลตฟอร์มเดียว
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:opacity-95 text-slate-950 shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>ทดลองใช้งานฟรี 14 วัน</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <LayoutDashboard className="w-5 h-5 text-amber-400" />
                            <span>เปิดหน้าแอปพลิเคชัน (App Dashboard)</span>
                        </Link>
                    </div>

                    {/* Key Stats Counter Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16">
                        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                            <p className="text-2xl sm:text-4xl font-black text-amber-400 font-mono">฿500M+</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">มูลค่าโครงการดูแลสะสม</p>
                        </div>
                        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                            <p className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono">99.8%</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">ความแม่นยำ AI สแกนบิล</p>
                        </div>
                        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                            <p className="text-2xl sm:text-4xl font-black text-cyan-400 font-mono">500+</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">ทีมผู้รับเหมาไว้ใจใช้งาน</p>
                        </div>
                        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                            <p className="text-2xl sm:text-4xl font-black text-purple-400 font-mono">3x</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">คุมไซต์งานเสร็จไวขึ้น</p>
                        </div>
                    </div>

                    {/* Interactive Mockup Container */}
                    <div className="relative max-w-6xl mx-auto rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-slate-700/50 via-slate-800/30 to-slate-900/80 border border-slate-700/80 shadow-2xl shadow-amber-500/10">
                        {/* Browser Bar */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                            </div>
                            <div className="text-xs font-mono text-slate-400 bg-slate-900 px-4 py-1 rounded-lg border border-slate-800 flex items-center gap-2">
                                <Lock className="w-3 h-3 text-emerald-400" />
                                <span>app.hipslothproject.com/dashboard</span>
                            </div>
                            <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                LIVE DEMO
                            </div>
                        </div>

                        {/* Interactive Screen Preview */}
                        <div className="bg-[#0D1322] rounded-2xl p-4 sm:p-8 border border-slate-800 text-left space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white">ภาพรวมการเงินโครงการ (Executive Dashboard)</h3>
                                    <p className="text-xs sm:text-sm text-slate-400">โครงการ: ก่อสร้างอาคารสำนักงาน สุขุมวิท 24 • อัปเดตล่าสุด Real-time</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        กำลังดำเนินงาน 78%
                                    </span>
                                </div>
                            </div>

                            {/* Stat Widgets inside Preview */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                                    <span className="text-xs font-bold text-slate-400 uppercase">รายรับสะสม (Revenue)</span>
                                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">฿4,850,000</p>
                                    <span className="text-[11px] text-emerald-400/80">เบิกเงินแล้ว 4/5 งวด</span>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                                    <span className="text-xs font-bold text-slate-400 uppercase">ต้นทุนรวม (Expenses)</span>
                                    <p className="text-2xl font-black text-rose-400 font-mono mt-1">฿2,940,000</p>
                                    <span className="text-[11px] text-rose-400/80">วัสดุ 60% • แรงงาน 40%</span>
                                </div>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                                    <span className="text-xs font-bold text-amber-400 uppercase">กำไรสุทธิ (Net Margin)</span>
                                    <p className="text-2xl font-black text-amber-400 font-mono mt-1">฿1,910,000</p>
                                    <span className="text-[11px] text-amber-400/80">+39.3% Profit Rate</span>
                                </div>
                            </div>

                            {/* Live Feature Bar */}
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-purple-300 text-xs sm:text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <ScanLine className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">AI Smart Scan 2.0</p>
                                        <p className="text-slate-400 text-xs">สแกนใบเสร็จซื้อของโฮมโปร แยกรายการเหล็ก/ปูน ถอด VAT 7% ลงตารางต้นทุนอัตโนมัติ</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 transition-colors">
                                    ดูการทำงาน AI
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ======================================================== */}
            {/* 3. CORE FEATURES SECTION (6 PILLARS)                      */}
            {/* ======================================================== */}
            <section id="features" className="py-20 sm:py-32 bg-slate-950/60 border-y border-slate-800/80 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3">
                            EVERYTHING YOU NEED
                        </h2>
                        <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            6 ฟีเจอร์หลัก ออกแบบเพื่อผู้รับเหมาและทีมก่อสร้างโดยเฉพาะ
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* 1. AI Smart Scan */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ScanLine className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                                1. AI Smart Scan ใบเสร็จ
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                ไม่ต้องพิมพ์บิลเองอีกต่อไป สแกนใบเสร็จซื้อวัสดุ AI สกัดชื่อร้าน, ถอดรายการสินค้า, แยกภาษี VAT 7% และลงหมวดหมู่ต้นทุนให้อัตโนมัติใน 2 วินาที
                            </p>
                        </div>

                        {/* 2. Real-time Financial */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                                2. ติดตามการเงิน & กำไรสุทธิ
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                ติดตาม Budget vs Actual แยกตามโครงการ รู้งบประมาณคงเหลือและกำไรสะสมทันที ป้องกันปัญหางบบานปลายและเงินขาดมือ
                            </p>
                        </div>

                        {/* 3. Smart JobSheet */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileText className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">
                                3. JobSheet รายงานไซต์งาน
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                โฟร์แมนและช่างส่งรายงานประจำวัน ถ่ายรูปความคืบหน้าหน้างาน บันทึกจำนวนคนงาน สภาพอากาศ และปัญหาไซต์งานตรงถึงผู้บริหารทันที
                            </p>
                        </div>

                        {/* 4. Quotation & VAT */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Receipt className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                                4. ออกใบเสนอราคาแยกโซน
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                ออกใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จรับเงิน สวยงาม รองรับการแยกโซนห้อง/พื้นที่ (Zone Mode) คำนวณ VAT 7% พร้อมส่งออก PDF ได้ใน 1 คลิก
                            </p>
                        </div>

                        {/* 5. Team Roles & Security */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-orange-500/50 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                                5. ควบคุมสิทธิ์ทีมงาน & Guest Role
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                กำหนดสิทธิ์ผู้ใช้รัดกุม (Owner, Admin, Accountant, Staff, Foreman) พร้อมสิทธิ์ Guest สำหรับดูและเขียนเฉพาะ JobSheet หน้างาน
                            </p>
                        </div>

                        {/* 6. Telegram & PWA */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Bell className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                6. แจ้งเตือน Telegram อัตโนมัติ
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                เมื่อมีบิลใหม่ ออกใบเสนอราคาเสร็จ หรือมีรายงาน JobSheet ระบบจะส่งการแจ้งเตือนและสรุปยอดเข้า Telegram ของทีมบริหารทันที
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 4. INTERACTIVE TAB DEMO SHOWCASE                         */}
            {/* ======================================================== */}
            <section id="demo" className="py-20 sm:py-32 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3">
                            SEE IT IN ACTION
                        </h2>
                        <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            ทดลองดูการทำงานจริงของระบบ
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-3xl mx-auto mb-12 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("pnl")}
                            className={cn(
                                "px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                                activeTab === "pnl" ? "bg-amber-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            📊 การเงิน & P&L
                        </button>
                        <button
                            onClick={() => setActiveTab("scan")}
                            className={cn(
                                "px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                                activeTab === "scan" ? "bg-purple-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            🤖 AI สแกนบิล
                        </button>
                        <button
                            onClick={() => setActiveTab("jobsheet")}
                            className={cn(
                                "px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                                activeTab === "jobsheet" ? "bg-emerald-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            📋 JobSheet ไซต์งาน
                        </button>
                        <button
                            onClick={() => setActiveTab("docs")}
                            className={cn(
                                "px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                                activeTab === "docs" ? "bg-cyan-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            📄 ใบเสนอราคา
                        </button>
                    </div>

                    {/* Interactive Tab Showcase Content */}
                    <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 shadow-2xl min-h-[380px] flex items-center">
                        {activeTab === "pnl" && (
                            <div className="w-full space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                    <div>
                                        <h4 className="text-xl font-bold text-white">รายงานสรุปกำไรขาดทุนสะสม (Profit & Loss Dashboard)</h4>
                                        <p className="text-xs text-slate-400">อัปเดตอัตโนมัติจากทุกบิลและใบเสนอราคาในโครงการ</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                        Real-time Synced
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                        <span className="text-xs text-slate-400 font-bold uppercase">รายรับสะสม</span>
                                        <p className="text-2xl font-black text-emerald-400 font-mono mt-1">฿2,450,000</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                        <span className="text-xs text-slate-400 font-bold uppercase">รายจ่ายรวม</span>
                                        <p className="text-2xl font-black text-rose-400 font-mono mt-1">฿1,120,000</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40">
                                        <span className="text-xs text-amber-400 font-bold uppercase">กำไรคงเหลือ</span>
                                        <p className="text-2xl font-black text-amber-400 font-mono mt-1">฿1,330,000</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "scan" && (
                            <div className="w-full space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                    <div>
                                        <h4 className="text-xl font-bold text-white">AI Smart Scan 2.0 (การอ่านใบเสร็จอัตโนมัติ)</h4>
                                        <p className="text-xs text-slate-400">วิเคราะห์รูปถ่ายบิล ถอดข้อความ และบันทึกเข้า Firestore ทันที</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                                        Powered by Gemini AI
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold text-xl">
                                        📸
                                    </div>
                                    <div className="space-y-1 text-xs sm:text-sm">
                                        <p className="font-bold text-white">ร้านไทวัสดุ สาขาบางนา • วันที่ 01/10/2026</p>
                                        <p className="text-slate-400">รายการ: ปูนซีเมนต์ 50 ถุง (฿7,250), เหล็กเส้น RB9 (฿12,400)</p>
                                        <p className="text-emerald-400 font-mono font-bold">รวมทั้งสิ้น: ฿19,650 (รวม VAT 7% ฿1,285.51 เรียบร้อย)</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "jobsheet" && (
                            <div className="w-full space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                    <div>
                                        <h4 className="text-xl font-bold text-white">Daily JobSheet (รายงานการปฏิบัติงานประจำวัน)</h4>
                                        <p className="text-xs text-slate-400">โฟร์แมนอัปเดตหน้างาน ช่าง 12 คน • สภาพอากาศแจ่มใส</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                                        ไซต์งาน A-102
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs sm:text-sm text-slate-300">
                                    <p className="font-bold text-white">🚧 งานเทคอนกรีตพื้นชั้น 2 แล้วเสร็จ 100%</p>
                                    <p className="text-slate-400">เริ่มตั้งแบบคานชั้น 3 ต่อเนื่อง สภาพอากาศแจ่มใส ไร้ฝนตก</p>
                                </div>
                            </div>
                        )}

                        {activeTab === "docs" && (
                            <div className="w-full space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                    <div>
                                        <h4 className="text-xl font-bold text-white">ระบบออกเอกสาร Quotation / Invoice / Receipt</h4>
                                        <p className="text-xs text-slate-400">รองรับแบบ Simple (รวมรายการ) และ Zone (แยกห้อง/พื้นที่)</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                                        QT-20261001-001
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs sm:text-sm">
                                    <div className="flex justify-between font-bold text-white">
                                        <span>โซนที่ 1: ห้องรับแขก & โถงทางเดิน</span>
                                        <span className="font-mono text-cyan-400">฿350,000</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-white">
                                        <span>โซนที่ 2: ห้องครัว & เคาน์เตอร์หินอ่อน</span>
                                        <span className="font-mono text-cyan-400">฿280,000</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 5. TARGET AUDIENCE SECTION                               */}
            {/* ======================================================== */}
            <section id="solutions" className="py-20 sm:py-32 bg-slate-950/60 border-y border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3">
                            MADE FOR YOUR TEAM
                        </h2>
                        <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            ออกแบบมาครอบคลุมทุกตำแหน่งในทีมก่อสร้าง
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl mb-4">
                                🏗️
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">ผู้รับเหมาก่อสร้าง</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ดูแลหลายไซต์งานพร้อมกัน ติดตามต้นทุนจริงเทียบงบประมาณ ไม่ต้องกลัวเงินขาดมือ
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xl mb-4">
                                📐
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">สถาปนิก & อินทีเรีย</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ออกใบเสนอราคาแยกห้อง/โซน ได้รวดเร็ว ดูสวยงามเป็นมืออาชีพ ปิดการขายง่ายขึ้น
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl mb-4">
                                👷‍♂️
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">โฟร์แมน & ช่างหน้างาน</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ส่ง JobSheet รายงานไซต์งาน และถ่ายรูปสแกนบิลซื้อวัสดุผ่านมือถือได้ทันที
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xl mb-4">
                                💼
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">ฝ่ายบัญชี & ผู้บริหาร</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ตรวจสอบบิล ออกใบเสร็จ และดูกราฟ P&L สรุปกำไรขาดทุนได้ทุกที่ 24 ชม.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 6. PRICING PLANS                                         */}
            {/* ======================================================== */}
            <section id="pricing" className="py-20 sm:py-32 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3">
                            PRICING PLANS
                        </h2>
                        <p className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
                            แพ็กเกจราคาโปร่งใส คุ้มค่าที่สุด
                        </p>

                        {/* Billing Cycle Switch */}
                        <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
                            <button
                                onClick={() => setBillingCycle("monthly")}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    billingCycle === "monthly" ? "bg-slate-800 text-white" : "text-slate-400"
                                )}
                            >
                                ชำระรายเดือน
                            </button>
                            <button
                                onClick={() => setBillingCycle("yearly")}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                                    billingCycle === "yearly" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400"
                                )}
                            >
                                <span>ชำระรายปี</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px]">ลด 20%</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Plan 1: Starter */}
                        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">Starter (ทดลองใช้)</h3>
                            <p className="text-xs text-slate-400 mb-6">สำหรับช่างและผู้รับเหมาเริ่มต้น</p>
                            <div className="mb-6">
                                <span className="text-4xl font-black text-white font-mono">฿0</span>
                                <span className="text-xs text-slate-400"> / ตลอดชีพ</span>
                            </div>
                            <ul className="space-y-3 text-xs text-slate-300 mb-8 flex-1">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>ดูแลได้ 1 โครงการ</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>AI สแกนบิล 20 รายการ/เดือน</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>ออกใบเสนอราคา & PDF</span>
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-all"
                            >
                                สมัครใช้ฟรี
                            </Link>
                        </div>

                        {/* Plan 2: Pro Contractor (Popular) */}
                        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border-2 border-amber-500 shadow-xl shadow-amber-500/10 flex flex-col relative">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[11px] font-black tracking-wider uppercase shadow-md">
                                Recommended (คุ้มค่าที่สุด)
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro Contractor</h3>
                            <p className="text-xs text-slate-400 mb-6">สำหรับทีมผู้รับเหมามืออาชีพ</p>
                            <div className="mb-6">
                                <span className="text-4xl font-black text-amber-400 font-mono">
                                    {billingCycle === "yearly" ? "฿490" : "฿590"}
                                </span>
                                <span className="text-xs text-slate-400"> / เดือน</span>
                            </div>
                            <ul className="space-y-3 text-xs text-slate-300 mb-8 flex-1">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-amber-400" />
                                    <strong className="text-white">ไม่จำกัดจำนวนโครงการ</strong>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-amber-400" />
                                    <span>AI สแกนบิล 500 รายการ/เดือน</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-amber-400" />
                                    <span>สิทธิ์สมาชิกทีมงาน 5 คน</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-amber-400" />
                                    <span>JobSheet + แจ้งเตือน Telegram</span>
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-95 text-slate-950 font-black text-xs text-center shadow-lg shadow-amber-500/20 transition-all"
                            >
                                เริ่มทดลองใช้ Pro ฟรี 14 วัน
                            </Link>
                        </div>

                        {/* Plan 3: Enterprise */}
                        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                            <p className="text-xs text-slate-400 mb-6">สำหรับบริษัทรับเหมาขนาดใหญ่</p>
                            <div className="mb-6">
                                <span className="text-4xl font-black text-white font-mono">
                                    {billingCycle === "yearly" ? "฿1,090" : "฿1,290"}
                                </span>
                                <span className="text-xs text-slate-400"> / เดือน</span>
                            </div>
                            <ul className="space-y-3 text-xs text-slate-300 mb-8 flex-1">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>ทุกฟีเจอร์ไม่จำกัด</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>สิทธิ์สมาชิกไม่จำกัดจำนวน</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>Multi-Organization Support</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>VIP Support 24/7 + Custom Integration</span>
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-all"
                            >
                                ติดต่อทีมงาน
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 7. FAQ ACCORDION                                         */}
            {/* ======================================================== */}
            <section id="faq" className="py-20 sm:py-32 bg-slate-950/60 border-t border-slate-800/80">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3">
                            FREQUENTLY ASKED QUESTIONS
                        </h2>
                        <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            คำถามที่พบบ่อย
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Hipsloth ต้องติดตั้งโปรแกรมลงคอมพิวเตอร์หรือไม่?",
                                a: "ไม่ต้องติดตั้งครับ สามารถเปิดใช้งานผ่านเว็บเบราว์เซอร์บนคอมพิวเตอร์ แท็บเล็ต หรือมือถือได้ทันที และยังรองรับระบบ Progressive Web App (PWA) ให้กดติดตั้งไอคอนลงบนหน้าจอมือถือได้ใน 1 คลิก"
                            },
                            {
                                q: "AI Smart Scan อ่านบิลและใบเสร็จซื้อของภาษาไทยได้แม่นยำแค่ไหน?",
                                a: "ระบบใช้เทคโนโลยี Gemini AI ล่าสุด มีความแม่นยำสูงถึง 99.8% สามารถอ่านใบเสร็จจากร้านค้าชั้นนำ เช่น ไทวัสดุ, โฮมโปร, Global House, ร้านวัสดุก่อสร้างทั่วไป รวมถึงสลิปโอนเงินธนาคารได้อย่างถูกต้อง"
                            },
                            {
                                q: "ข้อมูลการเงินของโครงการมีความปลอดภัยมากน้อยเพียงใด?",
                                a: "ข้อมูลทั้งหมดถูกจัดเก็บด้วยมาตรฐานความปลอดภัยระดับสูงบน Google Cloud Firebase มีการเข้ารหัสข้อมูล และแยกสิทธิ์การเข้าถึงอย่างรวดเร็ว ปลอดภัย ไม่มีการเปิดเผยข้อมูลแก่บุคคลภายนอก"
                            },
                            {
                                q: "สามารถทดลองใช้งานฟรีก่อนได้หรือไม่?",
                                a: "สามารถสมัครเข้าใช้งานแพ็กเกจ Starter หรือกดทดลองใช้ Pro ฟรี 14 วันได้ทันที โดยไม่ต้องกรอกข้อมูลบัตรเครดิต"
                            }
                        ].map((faq, idx) => (
                            <div key={idx} className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white text-base sm:text-lg hover:bg-slate-800/40 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    {openFaq[idx] ? <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                                </button>
                                {openFaq[idx] && (
                                    <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4 animate-in fade-in duration-200">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 8. FINAL CALL TO ACTION (CTA)                            */}
            {/* ======================================================== */}
            <section className="py-20 sm:py-32 relative">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl p-8 sm:p-16 bg-gradient-to-br from-amber-500/20 via-orange-600/10 to-slate-900 border border-amber-500/30 text-center relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl mx-auto">
                                พร้อมยกระดับการบริหารงานก่อสร้างของคุณแล้วหรือยัง?
                            </h2>
                            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
                                สมัครใช้งาน Hipsloth วันนี้ เพื่อคุมงบไซต์งาน ออกใบเสนอราคา และติดตามกำไรได้อย่างมืออาชีพ
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/register"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-95 text-slate-950 shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>เริ่มต้นใช้งานฟรีทันที</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="/"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>เข้าสู่ระบบแอปพลิเคชัน</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 9. FOOTER                                                */}
            {/* ======================================================== */}
            <footer className="py-12 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5">
                            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                                <HardHat className="w-4 h-4 text-amber-400" />
                            </div>
                        </div>
                        <span className="font-bold text-slate-200 text-sm font-mono">HipslothProject</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <Link href="/privacy" className="hover:text-amber-400 transition-colors">นโยบายความเป็นส่วนตัว</Link>
                        <Link href="/policy" className="hover:text-amber-400 transition-colors">ข้อตกลงการใช้งาน</Link>
                        <Link href="/" className="hover:text-amber-400 transition-colors">แดชบอร์ด</Link>
                    </div>
                    <div>
                        © 2569 HipslothProject. สงวนลิขสิทธิ์ทั้งหมด
                    </div>
                </div>
            </footer>

        </div>
    )
}
