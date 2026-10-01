"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
    Sparkles,
    CheckCircle2,
    ArrowRight,
    ScanLine,
    FileText,
    TrendingUp,
    ShieldCheck,
    HardHat,
    Receipt,
    ChevronDown,
    ChevronUp,
    Check,
    LayoutDashboard,
    Bell,
    Lock,
    Maximize2
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function HomePage() {
    const [activeTab, setActiveTab] = React.useState<"pnl" | "scan" | "jobsheet" | "docs">("scan")
    const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("yearly")
    const [openFaq, setOpenFaq] = React.useState<{ [key: number]: boolean }>({ 0: true })

    const toggleFaq = (index: number) => {
        setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }))
    }

    return (
        <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden">

            {/* Subtle Luxury Ambient Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] pointer-events-none z-0 opacity-25 blur-[140px] bg-gradient-to-b from-slate-400/20 via-amber-500/10 to-transparent" />
            <div className="fixed top-1/3 left-0 w-[450px] h-[450px] pointer-events-none z-0 opacity-15 blur-[160px] bg-amber-500/20" />
            <div className="fixed bottom-1/4 right-0 w-[500px] h-[500px] pointer-events-none z-0 opacity-15 blur-[160px] bg-emerald-500/15" />

            {/* ======================================================== */}
            {/* 1. HEADER / NAVIGATION BAR                                */}
            {/* ======================================================== */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#07090E]/85 border-b border-white/[0.08] transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    {/* Brand Logo */}
                    <Link href="/home" className="flex items-center gap-3.5 group">
                        <div className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/15 p-0.5 shadow-xl group-hover:border-amber-400/50 transition-all flex items-center justify-center">
                            <HardHat className="w-5 h-5 text-white group-hover:text-amber-400 transition-colors" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-black tracking-tight text-white font-mono">HIPSLOTH</span>
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-black uppercase tracking-wider">
                                    PRO
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block -mt-1 tracking-widest uppercase font-medium">Construction SaaS</span>
                        </div>
                    </Link>

                    {/* Nav Links (Desktop) */}
                    <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#hero-preview" className="hover:text-white transition-colors">ภาพรวมระบบ</a>
                        <a href="#features" className="hover:text-white transition-colors">ฟีเจอร์หลัก</a>
                        <a href="#demo" className="hover:text-white transition-colors">สาธิต AI & ไซต์งาน</a>
                        <a href="#solutions" className="hover:text-white transition-colors">สำหรับใคร</a>
                        <a href="#pricing" className="hover:text-white transition-colors">แพ็กเกจราคา</a>
                        <a href="#faq" className="hover:text-white transition-colors">คำถามที่พบบ่อย</a>
                    </nav>

                    {/* Auth & Dashboard Buttons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/10"
                        >
                            เข้าสู่ระบบ
                        </Link>
                        <Link
                            href="/"
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white hover:bg-slate-100 text-black shadow-xl active:scale-95 transition-all flex items-center gap-2"
                        >
                            <span>เปิดแดชบอร์ด</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ======================================================== */}
            {/* 2. HERO SECTION                                          */}
            {/* ======================================================== */}
            <section className="relative pt-14 pb-20 sm:pt-24 sm:pb-32 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                    {/* Pill Badge */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 text-slate-200 text-xs sm:text-sm font-semibold mb-8 animate-in fade-in duration-500">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>ระบบบริหารงานก่อสร้าง & รีโนเวท ยุคใหม่ สไตล์โมเดิร์น</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.12] text-white max-w-5xl mx-auto mb-6">
                        คุมไซต์งาน คุมงบประมาณ{" "}
                        <span className="bg-gradient-to-r from-white via-slate-200 to-amber-300 bg-clip-text text-transparent">
                            กำไรไม่รั่วไหล
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        ยกระดับการทำงานก่อสร้างด้วย <strong className="text-white font-semibold">AI สแกนบิลซื้อของ</strong>, ระบบติดตามงบ Real-time,
                        ออกใบเสนอราคาแยกโซน และ JobSheet รายงานไซต์งานบนมือถือ ครบจบในที่เดียว
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold bg-white hover:bg-slate-200 text-black shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>ทดลองใช้งานฟรี 14 วัน</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/15 shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <LayoutDashboard className="w-5 h-5 text-amber-400" />
                            <span>เปิดหน้าแอปพลิเคชัน (App Dashboard)</span>
                        </Link>
                    </div>

                    {/* Key Stats Counter Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16">
                        <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                            <p className="text-2xl sm:text-4xl font-black text-white font-mono">฿500M+</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">มูลค่าโครงการดูแลสะสม</p>
                        </div>
                        <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                            <p className="text-2xl sm:text-4xl font-black text-amber-400 font-mono">99.8%</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">ความแม่นยำ AI สแกนบิล</p>
                        </div>
                        <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                            <p className="text-2xl sm:text-4xl font-black text-white font-mono">500+</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">ทีมผู้รับเหมาไว้ใจใช้งาน</p>
                        </div>
                        <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                            <p className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono">3x</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">คุมไซต์งานเสร็จไวขึ้น</p>
                        </div>
                    </div>

                    {/* ======================================================== */}
                    {/* HERO SHOWCASE IMAGE (High-End Dark Architecture Visual)  */}
                    {/* ======================================================== */}
                    <div id="hero-preview" className="relative max-w-6xl mx-auto rounded-3xl p-2.5 sm:p-4 bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent border border-white/15 shadow-2xl shadow-black/80">
                        {/* Browser Top Window Bar */}
                        <div className="flex items-center justify-between px-4 py-3 bg-[#0B0F19] rounded-2xl border border-white/10 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-white/20" />
                                <div className="w-3 h-3 rounded-full bg-white/20" />
                                <div className="w-3 h-3 rounded-full bg-white/20" />
                            </div>
                            <div className="text-xs font-mono text-slate-400 bg-white/[0.05] px-4 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>app.hipslothproject.com/dashboard</span>
                            </div>
                            <div className="text-xs font-bold text-white bg-white/10 border border-white/15 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>REAL-TIME PLATFORM</span>
                            </div>
                        </div>

                        {/* High-Resolution Hero Visual */}
                        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 group shadow-2xl bg-black">
                            <Image
                                src="/images/landing/hero-dashboard.jpg"
                                alt="Hipsloth Executive Construction Management Dashboard"
                                fill
                                sizes="(max-width: 1200px) 100vw, 1200px"
                                priority
                                className="object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-transparent to-transparent opacity-40 pointer-events-none" />

                            {/* Floating Glass Badges */}
                            <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 p-3.5 sm:p-5 rounded-2xl bg-[#07090E]/80 border border-white/15 backdrop-blur-xl max-w-xs text-left shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                                    Project Overview & Key Metrics
                                </span>
                                <p className="text-sm sm:text-base font-bold text-white">
                                    กราฟวิเคราะห์กำไรขาดทุนสะสม (P&L) และความคืบหน้างบประมาณแบบเรียลไทม์
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ======================================================== */}
            {/* 3. CORE FEATURES SECTION (6 PILLARS)                      */}
            {/* ======================================================== */}
            <section id="features" className="py-20 sm:py-32 bg-[#0B0F19]/60 border-y border-white/[0.08] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3">
                            BUILT FOR PERFORMANCE
                        </h2>
                        <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            6 ฟีเจอร์หลัก ออกแบบเพื่อผู้รับเหมาและทีมก่อสร้างโดยเฉพาะ
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* 1. AI Smart Scan */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/30 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-amber-400/50 group-hover:text-amber-400 transition-all">
                                <ScanLine className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                1. AI Smart Scan ใบเสร็จ
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                ไม่ต้องพิมพ์บิลเองอีกต่อไป สแกนใบเสร็จซื้อวัสดุ AI สกัดชื่อร้าน, ถอดรายการสินค้า, แยกภาษี VAT 7% และลงหมวดหมู่ต้นทุนให้อัตโนมัติใน 2 วินาที
                            </p>
                        </div>

                        {/* 2. Real-time Financial */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/30 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-emerald-400/50 group-hover:text-emerald-400 transition-all">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                2. ติดตามการเงิน & กำไรสุทธิ
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                ติดตาม Budget vs Actual แยกตามโครงการ รู้งบประมาณคงเหลือและกำไรสะสมทันที ป้องกันปัญหางบบานปลายและเงินขาดมือ
                            </p>
                        </div>

                        {/* 3. Smart JobSheet */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/30 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-amber-400/50 group-hover:text-amber-400 transition-all">
                                <FileText className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                3. JobSheet รายงานไซต์งาน
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                โฟร์แมนและช่างส่งรายงานประจำวัน ถ่ายรูปความคืบหน้าหน้างาน บันทึกจำนวนคนงาน สภาพอากาศ และปัญหาไซต์งานตรงถึงผู้บริหารทันที
                            </p>
                        </div>

                        {/* 4. Quotation & VAT */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/30 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-cyan-400/50 group-hover:text-cyan-400 transition-all">
                                <Receipt className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                4. ออกใบเสนอราคาแยกโซน
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                ออกใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จรับเงิน สวยงาม รองรับการแยกโซนห้อง/พื้นที่ (Zone Mode) คำนวณ VAT 7% พร้อมส่งออก PDF ได้ใน 1 คลิก
                            </p>
                        </div>

                        {/* 5. Team Roles & Security */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/30 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-white/50 transition-all">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                5. ควบคุมสิทธิ์ทีมงาน & Guest Role
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                กำหนดสิทธิ์ผู้ใช้รัดกุม (Owner, Admin, Accountant, Staff, Foreman) พร้อมสิทธิ์ Guest สำหรับดูและเขียนเฉพาะ JobSheet หน้างาน
                            </p>
                        </div>

                        {/* 6. Telegram & PWA */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/30 transition-all group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-amber-400/50 group-hover:text-amber-400 transition-all">
                                <Bell className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
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
            {/* 4. VISUAL SHOWCASE: AI SCAN & SITE JOBSHEET              */}
            {/* ======================================================== */}
            <section id="demo" className="py-20 sm:py-32 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3">
                            IMMERSIVE VISUAL EXPERIENCE
                        </h2>
                        <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            เจาะลึก 2 นวัตกรรมหลักเพื่อหน้างาน
                        </p>
                    </div>

                    <div className="space-y-16 sm:space-y-24">
                        {/* FEATURE A: AI SMART SCAN */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                            <div className="lg:col-span-6 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold text-amber-400">
                                    <ScanLine className="w-4 h-4" />
                                    <span>AI SMART SCAN 2.0</span>
                                </div>
                                <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                                    อ่านและถอดข้อมูลบิลซื้อของ ด้วยเทคโนโลยี AI อัจฉริยะ
                                </h3>
                                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                                    ไม่ว่าบิลจาก ไทวัสดุ, โฮมโปร, Global House หรือร้านวัสดุก่อสร้างทั่วไป เพียงแค่ถ่ายรูปผ่านมือถือ AI จะสกัดชื่อร้านค้า วันที่ รายการสินค้า จำนวนเงิน และยอดภาษี VAT 7% พร้อมจัดหมวดหมู่วัสดุให้อัตโนมัติ แม่นยำ 99.8%
                                </p>
                                <ul className="space-y-3 text-sm text-slate-300">
                                    <li className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                                        <span>สกัดข้อมูลเสร็จสิ้นภายใน 1.5 - 2 วินาที</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                                        <span>รองรับทั้งบิลกระดาษ สลิปโอนเงิน และไฟล์ PDF</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                                        <span>ลงบัญชีต้นทุนแยกโครงการโดยตรง ไม่ต้องพิมพ์มือ</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="lg:col-span-6">
                                <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black group">
                                    <Image
                                        src="/images/landing/ai-smart-scan.jpg"
                                        alt="AI Smart Scan Document Recognition Interface"
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 600px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-transparent to-transparent opacity-30 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* FEATURE B: SITE JOBSHEET REPORTING */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                            <div className="lg:col-span-6 order-2 lg:order-1">
                                <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black group">
                                    <Image
                                        src="/images/landing/site-jobsheet.jpg"
                                        alt="Engineers reviewing digital jobsheet and architectural plans on construction site"
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 600px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-transparent to-transparent opacity-30 pointer-events-none" />
                                </div>
                            </div>

                            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold text-white">
                                    <FileText className="w-4 h-4 text-amber-400" />
                                    <span>DAILY JOBSHEET PORTAL</span>
                                </div>
                                <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                                    รายงานความคืบหน้าหน้างานประจำวัน ซิงค์ข้อมูลตรงถึงผู้บริหาร
                                </h3>
                                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                                    ให้โฟร์แมนและวิศวกรคุมไซต์งานเขียนรายงานความคืบหน้า บันทึกแรงงาน อุปกรณ์ สภาพอากาศ และปัญหาอุปสรรค พร้อมแนบรูปถ่ายหน้างานแบบเรียลไทม์ ตรวจสอบและอนุมัติงานได้ทันทีจากทุกที่
                                </p>
                                <ul className="space-y-3 text-sm text-slate-300">
                                    <li className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                                        <span>โฟร์แมนใช้งานง่ายผ่านมือถือ สะดวกรวดเร็ว</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                                        <span>กำหนดสิทธิ์แบบ Guest ดูและส่งเฉพาะ JobSheet ได้อย่างปลอดภัย</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                                        <span>เก็บบันทึกประวัติหน้างานย้อนหลังครบถ้วน ตรวจสอบได้ตลอดเวลา</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 5. TARGET AUDIENCE SECTION                               */}
            {/* ======================================================== */}
            <section id="solutions" className="py-20 sm:py-32 bg-[#0B0F19]/60 border-y border-white/[0.08]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3">
                            MADE FOR YOUR TEAM
                        </h2>
                        <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            ออกแบบมาครอบคลุมทุกบทบาทในทีมก่อสร้าง
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 text-white flex items-center justify-center font-bold text-xl mb-4">
                                🏗️
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">ผู้รับเหมาก่อสร้าง</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ดูแลหลายไซต์งานพร้อมกัน ติดตามต้นทุนจริงเทียบงบประมาณ ไม่ต้องกลัวเงินขาดมือ
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 text-white flex items-center justify-center font-bold text-xl mb-4">
                                📐
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">สถาปนิก & อินทีเรีย</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ออกใบเสนอราคาแยกห้อง/โซน ได้รวดเร็ว ดูสวยงามเป็นมืออาชีพ ปิดการขายง่ายขึ้น
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 text-white flex items-center justify-center font-bold text-xl mb-4">
                                👷‍♂️
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">โฟร์แมน & ช่างหน้างาน</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ส่ง JobSheet รายงานไซต์งาน และถ่ายรูปสแกนบิลซื้อวัสดุผ่านมือถือได้ทันที
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 text-white flex items-center justify-center font-bold text-xl mb-4">
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
                        <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10">
                            <button
                                onClick={() => setBillingCycle("monthly")}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    billingCycle === "monthly" ? "bg-white text-black" : "text-slate-400"
                                )}
                            >
                                ชำระรายเดือน
                            </button>
                            <button
                                onClick={() => setBillingCycle("yearly")}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                                    billingCycle === "yearly" ? "bg-white text-black shadow-md" : "text-slate-400"
                                )}
                            >
                                <span>ชำระรายปี</span>
                                <span className="px-1.5 py-0.5 rounded bg-black text-amber-400 text-[10px] font-black">ลด 20%</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Plan 1: Starter */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">Starter (ทดลองใช้)</h3>
                            <p className="text-xs text-slate-400 mb-6">สำหรับช่างและผู้รับเหมาเริ่มต้น</p>
                            <div className="mb-6">
                                <span className="text-4xl font-black text-white font-mono">฿0</span>
                                <span className="text-xs text-slate-400"> / ตลอดชีพ</span>
                            </div>
                            <ul className="space-y-3 text-xs text-slate-300 mb-8 flex-1">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-white" />
                                    <span>ดูแลได้ 1 โครงการ</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-white" />
                                    <span>AI สแกนบิล 20 รายการ/เดือน</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-white" />
                                    <span>ออกใบเสนอราคา & PDF</span>
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-xs text-center transition-all"
                            >
                                สมัครใช้ฟรี
                            </Link>
                        </div>

                        {/* Plan 2: Pro Contractor (Popular) */}
                        <div className="p-8 rounded-3xl bg-white/[0.04] border-2 border-white shadow-2xl flex flex-col relative">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-black text-[11px] font-black tracking-wider uppercase shadow-md">
                                RECOMMENDED (คุ้มค่าที่สุด)
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro Contractor</h3>
                            <p className="text-xs text-slate-400 mb-6">สำหรับทีมผู้รับเหมามืออาชีพ</p>
                            <div className="mb-6">
                                <span className="text-4xl font-black text-white font-mono">
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
                                className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-200 text-black font-black text-xs text-center shadow-xl transition-all"
                            >
                                เริ่มทดลองใช้ Pro ฟรี 14 วัน
                            </Link>
                        </div>

                        {/* Plan 3: Enterprise */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] flex flex-col">
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
                                    <Check className="w-4 h-4 text-white" />
                                    <span>ทุกฟีเจอร์ไม่จำกัด</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-white" />
                                    <span>สิทธิ์สมาชิกไม่จำกัดจำนวน</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-white" />
                                    <span>Multi-Organization Support</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-white" />
                                    <span>VIP Support 24/7 + Custom Integration</span>
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-xs text-center transition-all"
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
            <section id="faq" className="py-20 sm:py-32 bg-[#0B0F19]/60 border-t border-white/[0.08]">
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
                            <div key={idx} className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white text-base sm:text-lg hover:bg-white/[0.04] transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    {openFaq[idx] ? <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                                </button>
                                {openFaq[idx] && (
                                    <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/[0.06] pt-4 animate-in fade-in duration-200">
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
                    <div className="rounded-3xl p-8 sm:p-16 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-black border border-white/15 text-center relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl mx-auto">
                                พร้อมยกระดับการบริหารงานก่อสร้างของคุณแล้วหรือยัง?
                            </h2>
                            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-normal">
                                สมัครใช้งาน Hipsloth วันนี้ เพื่อคุมงบไซต์งาน ออกใบเสนอราคา และติดตามกำไรได้อย่างมืออาชีพ
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/register"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold bg-white hover:bg-slate-200 text-black shadow-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <span>เริ่มต้นใช้งานฟรีทันที</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="/"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/15 transition-all flex items-center justify-center gap-2"
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
            <footer className="py-12 bg-[#05070B] border-t border-white/[0.08] text-xs text-slate-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/15 p-0.5 flex items-center justify-center">
                            <HardHat className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-slate-200 text-sm font-mono tracking-wider">HIPSLOTHPROJECT</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link>
                        <Link href="/policy" className="hover:text-white transition-colors">ข้อตกลงการใช้งาน</Link>
                        <Link href="/" className="hover:text-white transition-colors">แดชบอร์ด</Link>
                    </div>
                    <div>
                        © 2569 HipslothProject. สงวนลิขสิทธิ์ทั้งหมด
                    </div>
                </div>
            </footer>

        </div>
    )
}
