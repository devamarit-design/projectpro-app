"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import {
    Sun,
    Moon,
    Cloud,
    CloudSun,
    CloudMoon,
    CloudRain,
    CloudLightning,
    CloudFog,
    Wind,
    Droplets,
    Thermometer,
    MapPin,
    RefreshCw,
    FileBarChart,
    Trophy,
    ArrowRight,
    Download,
    Sparkles,
    Calendar,
    Navigation,
    ShieldAlert,
    CheckCircle2,
    HardHat
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
    onDownload?: () => void
}

interface WeatherData {
    temperature: number
    apparentTemperature: number
    humidity: number
    windSpeed: number
    weatherCode: number
    isDay: boolean
    cityName: string
    updatedAt: string
}

const SITE_LOCATIONS = [
    { id: "chonburi", name: "ชลบุรี (บางละมุง/พัทยา)", lat: 12.9276, lon: 100.8771 },
    { id: "bangkok", name: "กรุงเทพมหานคร", lat: 13.7563, lon: 100.5018 },
    { id: "rayong", name: "ระยอง", lat: 12.6814, lon: 101.2816 },
    { id: "chiangmai", name: "เชียงใหม่", lat: 18.7883, lon: 98.9853 },
    { id: "phuket", name: "ภูเก็ต", lat: 7.8804, lon: 98.3923 },
    { id: "khonkaen", name: "ขอนแก่น", lat: 16.4419, lon: 102.8359 },
]

function getWeatherDetails(code: number, isDay: boolean) {
    if (code === 0) {
        return {
            label: "ท้องฟ้าแจ่มใส",
            en: "Clear Sky",
            icon: isDay ? Sun : Moon,
            color: isDay ? "text-amber-400" : "text-indigo-300",
            bgTint: isDay ? "from-amber-500/20" : "from-indigo-500/20",
            advisory: "☀️ สภาพอากาศแจ่มใส เหมาะสำหรับงานเทคอนกรีต งานโครงสร้าง และงานกลางแจ้งทุกประเภท",
            advisoryType: "good" as const
        }
    }
    if (code >= 1 && code <= 3) {
        return {
            label: code === 3 ? "ท้องฟ้ามีเมฆมาก" : "มีเมฆบางส่วน",
            en: code === 3 ? "Overcast" : "Partly Cloudy",
            icon: isDay ? CloudSun : CloudMoon,
            color: "text-sky-300",
            bgTint: "from-sky-500/20",
            advisory: "⛅ สภาพอากาศดี อุณหภูมิกำลังดี ปลอดโปร่งสำหรับการปฏิบัติงานหน้างาน",
            advisoryType: "good" as const
        }
    }
    if (code === 45 || code === 48) {
        return {
            label: "มีหมอกลง",
            en: "Foggy",
            icon: CloudFog,
            color: "text-slate-300",
            bgTint: "from-slate-500/20",
            advisory: "🌫️ มีหมอกในพื้นที่ ระมัดระวังทัศนวิสัยในการขับขี่และควบคุมเครื่องจักรหนัก",
            advisoryType: "warning" as const
        }
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        return {
            label: code >= 65 || code === 82 ? "ฝนตกหนัก" : "มีฝนตก",
            en: "Rain Showers",
            icon: CloudRain,
            color: "text-blue-400",
            bgTint: "from-blue-600/30",
            advisory: "🌧️ มีฝนตก ระวังงานโครงสร้าง งานเทคอนกรีต และความปลอดภัยระบบไฟฟ้าหน้างาน",
            advisoryType: "caution" as const
        }
    }
    if (code >= 95) {
        return {
            label: "พายุฝนฟ้าคะนอง",
            en: "Thunderstorm",
            icon: CloudLightning,
            color: "text-purple-400",
            bgTint: "from-purple-600/30",
            advisory: "⚡ มีพายุฟ้าคะนอง งดงานบนที่สูงและงานติดตั้งเครนเพื่อความปลอดภัยสูงสุด",
            advisoryType: "danger" as const
        }
    }
    return {
        label: "อากาศทั่วไป",
        en: "Normal",
        icon: isDay ? Sun : Moon,
        color: "text-amber-400",
        bgTint: "from-amber-500/20",
        advisory: "✨ สภาพอากาศปกติ สามารถดำเนินงานได้ตามแผนงาน",
        advisoryType: "good" as const
    }
}

export function DashboardHeader({ onDownload }: DashboardHeaderProps) {
    const { currentUser, currentTeam } = useProjects()
    const { t, locale } = useTranslation()
    const isAdmin = currentTeam?.role === 'Owner' || currentTeam?.role === 'Admin'

    // Selected site location state
    const [selectedLocation, setSelectedLocation] = useState(SITE_LOCATIONS[0])
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [isLoadingWeather, setIsLoadingWeather] = useState(false)
    const [isLocatingGPS, setIsLocatingGPS] = useState(false)
    const [showLocationMenu, setShowLocationMenu] = useState(false)

    // Time-based greeting
    const hour = new Date().getHours()
    let greeting = t.dashboard.greeting_morning || "สวัสดีตอนเช้า"
    let TimeIcon = Sun
    if (hour >= 12 && hour < 17) {
        greeting = t.dashboard.greeting_afternoon || "สวัสดีตอนบ่าย"
        TimeIcon = Sun
    } else if (hour >= 17) {
        greeting = t.dashboard.greeting_evening || "สวัสดีตอนเย็น"
        TimeIcon = Moon
    }

    const formattedDate = new Date().toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    // Fetch live weather from Open-Meteo API
    const fetchWeather = useCallback(async (lat: number, lon: number, cityName: string) => {
        setIsLoadingWeather(true)
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=Asia%2FBangkok`
            const res = await fetch(url)
            if (!res.ok) throw new Error("Failed to fetch weather")
            const data = await res.json()

            if (data?.current) {
                setWeather({
                    temperature: Math.round(data.current.temperature_2m),
                    apparentTemperature: Math.round(data.current.apparent_temperature),
                    humidity: data.current.relative_humidity_2m,
                    windSpeed: Math.round(data.current.wind_speed_10m),
                    weatherCode: data.current.weather_code,
                    isDay: Boolean(data.current.is_day),
                    cityName,
                    updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                })
            }
        } catch (error) {
            console.error("Weather fetch failed, falling back to default:", error)
            // Graceful fallback
            setWeather({
                temperature: 32,
                apparentTemperature: 35,
                humidity: 65,
                windSpeed: 12,
                weatherCode: 1,
                isDay: hour >= 6 && hour < 18,
                cityName,
                updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            })
        } finally {
            setIsLoadingWeather(false)
        }
    }, [hour])

    // Initial weather load
    useEffect(() => {
        fetchWeather(selectedLocation.lat, selectedLocation.lon, selectedLocation.name)
    }, [selectedLocation, fetchWeather])

    // Detect browser GPS
    const handleGPSDetect = () => {
        if (!navigator.geolocation) {
            alert("อุปกรณ์ของคุณไม่รองรับการระบุพิกัดตำแหน่ง (Geolocation)")
            return
        }
        setIsLocatingGPS(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude
                const lon = pos.coords.longitude
                const gpsLocation = { id: "gps", name: "พิกัดปัจจุบัน (GPS หน้างาน)", lat, lon }
                setSelectedLocation(gpsLocation)
                setShowLocationMenu(false)
                setIsLocatingGPS(false)
                fetchWeather(lat, lon, gpsLocation.name)
            },
            (err) => {
                console.warn("Geolocation permission denied or error:", err)
                setIsLocatingGPS(false)
                alert("ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาเปิดสิทธิ์ระบุตำแหน่งในเบราว์เซอร์")
            },
            { timeout: 10000 }
        )
    }

    const weatherInfo = weather ? getWeatherDetails(weather.weatherCode, weather.isDay) : null
    const WeatherIcon = weatherInfo ? weatherInfo.icon : Sun

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
            {/* 1. Main Weather & Site Forecast Hero Card */}
            <div
                className={cn(
                    "relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-all duration-300 group min-h-[300px] flex flex-col justify-between p-6 sm:p-8",
                    isAdmin ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
                )}
            >
                {/* Background Image with Ambient Scrim */}
                <img
                    src="/assets/dashboard/weather-bg.jpg"
                    alt="Weather & Construction Skyline"
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-1000 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                {/* Ambient glow light orb */}
                {weatherInfo && (
                    <div className={cn("absolute -top-20 -left-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-40 transition-colors duration-1000", weatherInfo.bgTint)} />
                )}

                {/* TOP ROW: Date & Location Selector */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                    {/* Date Pill */}
                    <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm font-medium bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{formattedDate}</span>
                    </div>

                    {/* Site Location Selector & Refresh */}
                    <div className="relative flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => setShowLocationMenu(!showLocationMenu)}
                                className="flex items-center gap-1.5 text-xs text-white/90 bg-black/50 hover:bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 transition-all shadow-sm group-hover:border-primary/40"
                                title="เลือกพื้นที่ไซต์งาน"
                            >
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="font-medium truncate max-w-[170px] sm:max-w-[220px]">
                                    {selectedLocation.name}
                                </span>
                            </button>

                            {/* Dropdown Menu */}
                            {showLocationMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-background/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right p-1.5">
                                    <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-white/5">
                                        เลือกตำแหน่งสภาพอากาศ
                                    </div>
                                    <button
                                        onClick={handleGPSDetect}
                                        disabled={isLocatingGPS}
                                        className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-primary/20 text-primary font-semibold flex items-center gap-2 transition-colors my-1"
                                    >
                                        <Navigation className={cn("w-3.5 h-3.5", isLocatingGPS && "animate-spin")} />
                                        <span>{isLocatingGPS ? "กำลังตรวจพิกัด GPS..." : "📍 ใช้พิกัดปัจจุบัน (GPS)"}</span>
                                    </button>
                                    <div className="h-px bg-white/5 my-1" />
                                    {SITE_LOCATIONS.map((loc) => (
                                        <button
                                            key={loc.id}
                                            onClick={() => {
                                                setSelectedLocation(loc)
                                                setShowLocationMenu(false)
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-between",
                                                selectedLocation.id === loc.id ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                                            )}
                                        >
                                            <span>{loc.name}</span>
                                            {selectedLocation.id === loc.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={() => fetchWeather(selectedLocation.lat, selectedLocation.lon, selectedLocation.name)}
                            disabled={isLoadingWeather}
                            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white transition-all shadow-sm"
                            title="รีเฟรชข้อมูลสภาพอากาศ"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isLoadingWeather && "animate-spin text-primary")} />
                        </button>

                        {/* Report Download (If passed) */}
                        {onDownload && isAdmin && (
                            <button
                                onClick={onDownload}
                                className="hidden sm:flex items-center gap-1.5 text-xs text-white bg-primary/30 hover:bg-primary/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/40 font-medium transition-all shadow-sm active:scale-95"
                                title="ออกรายงาน PDF"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>รายงาน</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* MIDDLE ROW: Greeting + Real-time Weather Highlights */}
                <div className="relative z-10 my-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Left: Greeting & User Name */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {currentTeam?.role || "Member"}
                            </span>
                            <span className="text-xs text-white/60">
                                อัปเดต {weather?.updatedAt || "เมื่อสักครู่"}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                            {greeting},{" "}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-primary/90">
                                {currentUser?.name?.split(" ")[0] || "Amarit"}
                            </span>
                        </h1>
                        <p className="text-xs sm:text-sm text-white/70 font-medium flex items-center gap-1.5">
                            <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>แดชบอร์ดติดตามสภาพงาน และข้อมูลโครงการประจำวัน</span>
                        </p>
                    </div>

                    {/* Right: Weather Metrics Display */}
                    {weather && weatherInfo && (
                        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl shrink-0 self-start md:self-auto">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 text-white shadow-inner flex items-center justify-center">
                                <WeatherIcon className={cn("w-8 h-8 sm:w-10 sm:h-10 animate-pulse", weatherInfo.color)} />
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                                        {weather.temperature}°C
                                    </span>
                                    <span className="text-xs text-white/70 font-medium">
                                        (รู้สึก {weather.apparentTemperature}°)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={cn("text-xs font-bold", weatherInfo.color)}>
                                        {weatherInfo.label}
                                    </span>
                                    <span className="text-[10px] text-white/50">
                                        {weatherInfo.en}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM ROW: Weather Detail Pills & Site Advisory */}
                <div className="relative z-10 space-y-3 pt-3 border-t border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        {/* Weather Spec Pills */}
                        {weather && (
                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-white/80 flex-wrap">
                                <div className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                                    <span>ความชื้น: <strong className="text-white font-mono">{weather.humidity}%</strong></span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                                    <Wind className="w-3.5 h-3.5 text-teal-300" />
                                    <span>ความเร็วลม: <strong className="text-white font-mono">{weather.windSpeed} km/h</strong></span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                                    <span>ดัชนีความร้อน: <strong className="text-white font-mono">{weather.apparentTemperature}°C</strong></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Site Construction Advisory Tag */}
                    {weatherInfo && (
                        <div
                            className={cn(
                                "flex items-center gap-2.5 p-2.5 rounded-xl text-xs sm:text-sm font-medium border backdrop-blur-md transition-colors",
                                weatherInfo.advisoryType === "good" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
                                weatherInfo.advisoryType === "warning" && "bg-amber-500/10 border-amber-500/20 text-amber-300",
                                weatherInfo.advisoryType === "caution" && "bg-blue-500/10 border-blue-500/20 text-blue-300",
                                weatherInfo.advisoryType === "danger" && "bg-rose-500/15 border-rose-500/30 text-rose-300 animate-pulse"
                            )}
                        >
                            <span className="shrink-0">{weatherInfo.advisory}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Right Side: Financial & Team Cards with High-End Backgrounds */}
            {isAdmin && (
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
                    {/* Financial Card */}
                    <Link
                        href="/financial"
                        className="relative flex-1 group overflow-hidden rounded-3xl border border-amber-500/20 hover:border-amber-500/50 p-6 min-h-[160px] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                    >
                        {/* Background Image */}
                        <img
                            src="/assets/dashboard/financial-bg.jpg"
                            alt="Financial Background"
                            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/35 group-hover:from-black/85 transition-colors pointer-events-none" />
                        <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/25 transition-colors duration-700" />

                        {/* Top Badge */}
                        <div className="relative z-10 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
                                <FileBarChart className="w-3.5 h-3.5" />
                                Financial
                            </span>
                            <span className="text-[10px] text-amber-400/80 font-mono font-semibold bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                                Report & Analysis
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="relative z-10 my-2">
                            <h3 className="font-extrabold text-lg sm:text-xl text-white group-hover:text-amber-300 transition-colors">
                                การเงินและรายงาน
                            </h3>
                            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
                                สรุปกระแสเงินสด รายรับ-รายจ่าย และกำไรโครงการ
                            </p>
                        </div>

                        {/* Bottom Action */}
                        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="text-xs text-white/60">ดูรายงานภาพรวม</span>
                            <div className="bg-amber-500/20 group-hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border border-amber-500/30 transition-all group-hover:translate-x-1">
                                View <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                    </Link>

                    {/* Team & Assets Card */}
                    <Link
                        href="/team"
                        className="relative flex-1 group overflow-hidden rounded-3xl border border-blue-500/20 hover:border-blue-500/50 p-6 min-h-[160px] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                    >
                        {/* Background Image */}
                        <img
                            src="/assets/dashboard/team-bg.jpg"
                            alt="Team Background"
                            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/35 group-hover:from-black/85 transition-colors pointer-events-none" />
                        <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/25 transition-colors duration-700" />

                        {/* Top Badge */}
                        <div className="relative z-10 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider">
                                <Trophy className="w-3.5 h-3.5" />
                                Team & Assets
                            </span>
                            <span className="text-[10px] text-blue-400/80 font-mono font-semibold bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                                Manage Team & Site
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="relative z-10 my-2">
                            <h3 className="font-extrabold text-lg sm:text-xl text-white group-hover:text-blue-300 transition-colors">
                                ทีมงานและไซต์งาน
                            </h3>
                            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
                                จัดการสมาชิก ช่าง ผู้รับเหมา และเครื่องจักรหน้างาน
                            </p>
                        </div>

                        {/* Bottom Action */}
                        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="text-xs text-white/60">สำรวจทีมงาน</span>
                            <div className="bg-blue-500/20 group-hover:bg-blue-500/30 text-blue-300 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border border-blue-500/30 transition-all group-hover:translate-x-1">
                                Explore <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    )
}
