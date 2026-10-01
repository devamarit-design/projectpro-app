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
    HardHat,
    Search,
    Crosshair,
    Building2,
    X
} from "lucide-react"
import { toast } from "sonner"
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

export interface LocationOption {
    id: string
    name: string
    lat: number
    lon: number
    isGPS?: boolean
    accuracy?: number
    region?: string
}

const POPULAR_LOCATIONS: LocationOption[] = [
    { id: "bangkok", name: "กรุงเทพมหานคร", lat: 13.7563, lon: 100.5018, region: "กทม.และปริมณฑล" },
    { id: "nonthaburi", name: "นนทบุรี", lat: 13.8591, lon: 100.5217, region: "กทม.และปริมณฑล" },
    { id: "samutprakan", name: "สมุทรปราการ (บางพลี/บางปู)", lat: 13.5991, lon: 100.5998, region: "กทม.และปริมณฑล" },
    { id: "pathumthani", name: "ปทุมธานี (รังสิต/คลองหลวง)", lat: 14.0208, lon: 100.5250, region: "กทม.และปริมณฑล" },
    { id: "samutsakhon", name: "สมุทรสาคร (มหาชัย)", lat: 13.5475, lon: 100.2744, region: "กทม.และปริมณฑล" },
    { id: "chonburi", name: "ชลบุรี (เมือง/ศรีราชา)", lat: 13.3611, lon: 100.9847, region: "ภาคตะวันออก" },
    { id: "pattaya", name: "พัทยา / บางละมุง (ชลบุรี)", lat: 12.9276, lon: 100.8771, region: "ภาคตะวันออก" },
    { id: "rayong", name: "ระยอง (เมือง/มาบตาพุด)", lat: 12.6814, lon: 101.2816, region: "ภาคตะวันออก" },
    { id: "chachoengsao", name: "ฉะเชิงเทรา", lat: 13.6904, lon: 101.0779, region: "ภาคตะวันออก" },
    { id: "ayutthaya", name: "พระนครศรีอยุธยา (โรจนะ)", lat: 14.3532, lon: 100.5684, region: "ภาคกลาง" },
    { id: "saraburi", name: "สระบุรี (แก่งคอย)", lat: 14.5289, lon: 100.9101, region: "ภาคกลาง" },
    { id: "chiangmai", name: "เชียงใหม่ (เมือง/หางดง)", lat: 18.7883, lon: 98.9853, region: "ภาคเหนือ" },
    { id: "chiangrai", name: "เชียงราย", lat: 19.9105, lon: 99.8406, region: "ภาคเหนือ" },
    { id: "korat", name: "นครราชสีมา (โคราช/ปากช่อง)", lat: 14.9799, lon: 102.0978, region: "ภาคอีสาน" },
    { id: "khonkaen", name: "ขอนแก่น", lat: 16.4419, lon: 102.8359, region: "ภาคอีสาน" },
    { id: "phuket", name: "ภูเก็ต (เมือง/ถลาง)", lat: 7.8804, lon: 98.3923, region: "ภาคใต้" },
    { id: "surat", name: "สุราษฎร์ธานี (สมุย)", lat: 9.1382, lon: 99.3217, region: "ภาคใต้" },
    { id: "songkhla", name: "สงขลา (หาดใหญ่)", lat: 7.0084, lon: 100.4767, region: "ภาคใต้" },
    { id: "huahin", name: "ประจวบคีรีขันธ์ (หัวหิน)", lat: 12.5684, lon: 99.9577, region: "ภาคใต้" },
]

// Accurate Thai Reverse Geocoding helper
async function resolveThaiLocation(lat: number, lon: number, accuracy?: number): Promise<string> {
    try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=th`)
        if (res.ok) {
            const data = await res.json()
            const rawProvince = (data.principalSubdivision || data.city || "").replace(/^จังหวัด/, "").trim()
            const districtObj = data.localityInfo?.administrative?.find((a: any) => a.adminLevel === 6)
            const rawDistrict = (districtObj?.name || data.city || "").trim()
            const subDistrict = (data.locality || "").trim()

            const isBkk = rawProvince.includes("กรุงเทพ") || rawDistrict.includes("เขต")

            if (isBkk) {
                const district = rawDistrict.replace(/^เขต/, "เขต")
                return district ? `${district}, กรุงเทพฯ` : "กรุงเทพมหานคร"
            }

            if (subDistrict.includes("พัทยา")) {
                return `พัทยา (บางละมุง, ชลบุรี)`
            }

            if (rawDistrict && rawProvince) {
                const district = rawDistrict.startsWith("อำเภอ") || rawDistrict.startsWith("อ.") 
                    ? rawDistrict.replace(/^อำเภอ/, "อ.")
                    : `อ.${rawDistrict}`
                return `${district}, ${rawProvince}`
            }

            if (rawProvince) return rawProvince
            if (rawDistrict) return rawDistrict
        }
    } catch (e) {
        console.warn("Reverse geocode failed:", e)
    }

    return `พิกัด (${lat.toFixed(4)}, ${lon.toFixed(4)})`
}

function getWeatherDetails(code: number, isDay: boolean) {
    if (code === 0) {
        return {
            label: "ท้องฟ้าแจ่มใส",
            en: "Clear Sky",
            icon: isDay ? Sun : Moon,
            color: isDay ? "text-amber-400" : "text-indigo-300",
            bgTint: isDay ? "from-amber-500/20" : "from-indigo-500/20",
            bgImage: isDay ? "/assets/dashboard/weather-sunny.jpg" : "/assets/dashboard/weather-night.jpg",
            advisory: "☀️ สภาพอากาศแจ่มใส เหมาะสำหรับงานเทคอนกรีต งานโครงสร้าง และงานกลางแจ้งทุกประเภท",
            advisoryType: "good" as const
        }
    }
    if (code >= 1 && code <= 3) {
        return {
            label: code === 3 ? "ท้องฟ้ามีเมฆมาก" : "มีเมฆบางส่วน",
            en: code === 3 ? "Overcast" : "Partly Cloudy",
            icon: isDay ? CloudSun : CloudMoon,
            color: isDay ? "text-sky-300" : "text-indigo-300",
            bgTint: isDay ? "from-sky-500/20" : "from-indigo-500/20",
            bgImage: isDay ? "/assets/dashboard/weather-cloudy.jpg" : "/assets/dashboard/weather-night.jpg",
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
            bgImage: "/assets/dashboard/weather-fog.jpg",
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
            bgImage: "/assets/dashboard/weather-rain.jpg",
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
            bgImage: "/assets/dashboard/weather-thunder.jpg",
            advisory: "⚡ มีพายุฟ้าคะนอง งดงานบนที่สูงและงานติดตั้งเครนเพื่อความปลอดภัยสูงสุด",
            advisoryType: "danger" as const
        }
    }
    return {
        label: "อากาศทั่วไป",
        en: "Normal",
        icon: isDay ? Sun : Moon,
        color: isDay ? "text-amber-400" : "text-indigo-300",
        bgTint: isDay ? "from-amber-500/20" : "from-indigo-500/20",
        bgImage: isDay ? "/assets/dashboard/weather-sunny.jpg" : "/assets/dashboard/weather-night.jpg",
        advisory: "✨ สภาพอากาศปกติ สามารถดำเนินงานได้ตามแผนงาน",
        advisoryType: "good" as const
    }
}

export function DashboardHeader({ onDownload }: DashboardHeaderProps) {
    const { currentUser, currentTeam, projects } = useProjects()
    const { t, locale } = useTranslation()
    const isAdmin = currentTeam?.role === 'Owner' || currentTeam?.role === 'Admin'

    // Selected site location state
    const [selectedLocation, setSelectedLocation] = useState<LocationOption>(POPULAR_LOCATIONS[0])
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [isLoadingWeather, setIsLoadingWeather] = useState(false)
    const [isLocatingGPS, setIsLocatingGPS] = useState(false)
    const [showLocationMenu, setShowLocationMenu] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

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

    // Auto-detect location on initial load (LocalStorage -> Granted GPS -> IP Geolocation)
    useEffect(() => {
        let hasResolved = false

        // 1. Try saved location from localStorage
        try {
            const saved = localStorage.getItem("hipsloth_weather_location")
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed?.lat && parsed?.lon) {
                    setSelectedLocation(parsed)
                    hasResolved = true
                }
            }
        } catch (e) {
            console.warn("Error reading saved location:", e)
        }

        const autoDetectIP = async () => {
            try {
                const res = await fetch("https://ipwho.is/")
                if (res.ok) {
                    const data = await res.json()
                    if (data?.success && data?.latitude && data?.longitude) {
                        const lat = data.latitude
                        const lon = data.longitude
                        const name = await resolveThaiLocation(lat, lon)
                        const locData: LocationOption = { id: "ip", name, lat, lon, isGPS: false }
                        setSelectedLocation(locData)
                        try {
                            localStorage.setItem("hipsloth_weather_location", JSON.stringify(locData))
                        } catch (e) {}
                    }
                }
            } catch (err) {
                console.warn("IP geolocation fallback error:", err)
            }
        }

        // 2. If geolocation permission is already granted, auto-detect high-accuracy GPS silently
        if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: "geolocation" }).then((perm) => {
                if (perm.state === "granted") {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            const lat = pos.coords.latitude
                            const lon = pos.coords.longitude
                            const accuracy = Math.round(pos.coords.accuracy)
                            const name = await resolveThaiLocation(lat, lon, accuracy)
                            const loc: LocationOption = { id: "gps", name, lat, lon, isGPS: true, accuracy }
                            setSelectedLocation(loc)
                            try {
                                localStorage.setItem("hipsloth_weather_location", JSON.stringify(loc))
                            } catch (e) {}
                        },
                        () => {
                            if (!hasResolved) autoDetectIP()
                        },
                        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
                    )
                } else if (!hasResolved) {
                    autoDetectIP()
                }
            }).catch(() => {
                if (!hasResolved) autoDetectIP()
            })
        } else if (!hasResolved) {
            autoDetectIP()
        }
    }, [])

    // Weather load when location changes
    useEffect(() => {
        fetchWeather(selectedLocation.lat, selectedLocation.lon, selectedLocation.name)
    }, [selectedLocation, fetchWeather])

    // High-accuracy GPS Detection on user click
    const handleGPSDetect = () => {
        if (!navigator.geolocation) {
            toast.error("อุปกรณ์ของคุณไม่รองรับการระบุพิกัดตำแหน่ง (Geolocation)")
            return
        }
        setIsLocatingGPS(true)
        toast.info("กำลังรับสัญญาณดาวเทียม GPS เพื่อระบุพิกัดหน้างานที่แม่นยำ...")

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude
                const lon = pos.coords.longitude
                const accuracy = Math.round(pos.coords.accuracy)
                const name = await resolveThaiLocation(lat, lon, accuracy)
                const gpsLocation: LocationOption = {
                    id: "gps",
                    name,
                    lat,
                    lon,
                    isGPS: true,
                    accuracy
                }
                setSelectedLocation(gpsLocation)
                try {
                    localStorage.setItem("hipsloth_weather_location", JSON.stringify(gpsLocation))
                } catch (e) {}
                setShowLocationMenu(false)
                setIsLocatingGPS(false)
                fetchWeather(lat, lon, name)
                toast.success(`พบพิกัดหน้างาน: ${name} (แม่นยำ ±${accuracy} ม.)`)
            },
            (err) => {
                console.warn("Geolocation permission error:", err)
                setIsLocatingGPS(false)
                toast.error("ไม่สามารถเข้าถึง GPS ได้ กรุณาเปิดสิทธิ์ระบุตำแหน่งในเบราว์เซอร์")
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
        )
    }

    // Filter locations by search query
    const filteredLocations = React.useMemo(() => {
        if (!searchQuery.trim()) return POPULAR_LOCATIONS
        const q = searchQuery.toLowerCase().trim()
        return POPULAR_LOCATIONS.filter(l =>
            l.name.toLowerCase().includes(q) ||
            l.region?.toLowerCase().includes(q)
        )
    }, [searchQuery])

    // Project sites with locations
    const projectSites = React.useMemo(() => {
        if (!projects || projects.length === 0) return []
        const sites: { id: string, name: string, projectTitle: string, locationStr: string, lat: number, lon: number }[] = []
        const seen = new Set<string>()

        projects.forEach(p => {
            if (p.location && p.location.trim()) {
                const locKey = p.location.trim().toLowerCase()
                if (!seen.has(locKey)) {
                    seen.add(locKey)
                    // Match to known coordinate if possible, or fallback to Bangkok
                    const matched = POPULAR_LOCATIONS.find(l => l.name.toLowerCase().includes(locKey) || locKey.includes(l.name.toLowerCase()))
                    sites.push({
                        id: `proj-${p.id}`,
                        name: `ไซต์ ${p.name} (${p.location})`,
                        projectTitle: p.name,
                        locationStr: p.location.trim(),
                        lat: matched?.lat || 13.7563,
                        lon: matched?.lon || 100.5018
                    })
                }
            }
        })
        return sites
    }, [projects])

    const weatherInfo = weather ? getWeatherDetails(weather.weatherCode, weather.isDay) : null
    const WeatherIcon = weatherInfo ? weatherInfo.icon : Sun

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
            {/* 1. Main Weather & Site Forecast Hero Card */}
            <div
                className={cn(
                    "relative rounded-3xl border border-white/10 shadow-2xl transition-all duration-300 group min-h-[280px] sm:min-h-[300px] flex flex-col justify-between p-4 sm:p-6 md:p-8",
                    isAdmin ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
                )}
            >
                {/* Background clip wrapper for image and blur orb */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    <img
                        key={weatherInfo?.bgImage || "/assets/dashboard/weather-bg.jpg"}
                        src={weatherInfo?.bgImage || "/assets/dashboard/weather-bg.jpg"}
                        alt="Weather & Construction Skyline"
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.02] transition-all duration-1000 pointer-events-none animate-in fade-in duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                    {/* Ambient glow light orb */}
                    {weatherInfo && (
                        <div className={cn("absolute -top-20 -left-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-40 transition-colors duration-1000", weatherInfo.bgTint)} />
                    )}
                </div>

                {/* TOP ROW: Date & Location Selector */}
                <div className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                    {/* Date Pill */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-white/80 text-xs sm:text-sm font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                        <span className="truncate">{formattedDate}</span>
                    </div>

                    {/* Site Location Selector & Refresh */}
                    <div className="relative z-40 flex items-center gap-1.5 sm:gap-2">
                        <div className="relative z-50">
                            <button
                                onClick={() => setShowLocationMenu(!showLocationMenu)}
                                className={cn(
                                    "flex items-center gap-1.5 text-xs bg-black/50 hover:bg-black/70 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full border transition-all shadow-sm max-w-[220px] sm:max-w-none cursor-pointer",
                                    selectedLocation.isGPS
                                        ? "text-emerald-300 border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-950/50"
                                        : "text-white/90 border-white/15 hover:border-primary/40"
                                )}
                                title="เลือกพื้นที่ไซต์งาน / กดระบุพิกัด GPS"
                            >
                                <MapPin className={cn(
                                    "w-3.5 h-3.5 shrink-0",
                                    selectedLocation.isGPS ? "text-emerald-400 animate-pulse" : "text-rose-400"
                                )} />
                                <span className="font-semibold truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[240px]">
                                    {selectedLocation.name}
                                </span>
                                {selectedLocation.accuracy && (
                                    <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                        ±{selectedLocation.accuracy}ม.
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {showLocationMenu && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-[90] bg-black/60 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none cursor-default transition-opacity"
                                        onClick={() => setShowLocationMenu(false)}
                                    />

                                    {/* Menu Container: Centered Modal on Mobile, Dropdown on Desktop */}
                                    <div className="fixed sm:absolute inset-x-3.5 sm:inset-x-auto top-1/2 -translate-y-1/2 sm:translate-y-0 sm:top-full sm:right-0 sm:mt-2 w-auto sm:w-80 max-w-sm mx-auto sm:mx-0 bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 origin-center sm:origin-top-right p-2.5 max-h-[85vh] sm:max-h-none flex flex-col">
                                        {/* Header with Title and Close Button */}
                                        <div className="px-2 py-1.5 flex items-center justify-between border-b border-border mb-2 shrink-0">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <Crosshair className="w-3.5 h-3.5 text-primary" /> เลือกพิกัดไซต์งาน / สภาพอากาศ
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {selectedLocation.isGPS && (
                                                    <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                        GPS แล้ว
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setShowLocationMenu(false)}
                                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                                    title="ปิดหน้าต่าง"
                                                    aria-label="Close"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* GPS Quick Action Button */}
                                        <button
                                            onClick={handleGPSDetect}
                                            disabled={isLocatingGPS}
                                            className={cn(
                                                "w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all mb-2 cursor-pointer shadow-sm shrink-0",
                                                isLocatingGPS
                                                    ? "bg-primary/20 border-primary/40 text-primary"
                                                    : "bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 hover:border-emerald-400/50"
                                            )}
                                        >
                                            <Navigation className={cn("w-4 h-4 shrink-0 text-emerald-400", isLocatingGPS && "animate-spin text-primary")} />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold leading-tight">
                                                    {isLocatingGPS ? "กำลังจับพิกัดดาวเทียม GPS..." : "📍 ระบุพิกัดปัจจุบัน (GPS แม่นยำสูง)"}
                                                </p>
                                                <p className="text-[10px] text-emerald-400/80 font-normal mt-0.5 truncate">
                                                    ค้นหาตำแหน่งหน้างานจริงจากดาวเทียมและเสาสัญญาณ
                                                </p>
                                            </div>
                                        </button>

                                        {/* Search Input */}
                                        <div className="relative mb-2 shrink-0">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="ค้นหาจังหวัด หรือพื้นที่..."
                                                className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Scrollable list */}
                                        <div className="max-h-60 sm:max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar flex-1 min-h-0">
                                            {/* Project Sites */}
                                            {projectSites.length > 0 && !searchQuery && (
                                                <div className="mb-2">
                                                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                        <Building2 className="w-3 h-3 text-amber-400" /> ไซต์งานโครงการของคุณ
                                                    </div>
                                                    {projectSites.map((site) => (
                                                        <button
                                                            key={site.id}
                                                            onClick={() => {
                                                                const loc: LocationOption = {
                                                                    id: site.id,
                                                                    name: site.name,
                                                                    lat: site.lat,
                                                                    lon: site.lon,
                                                                    isGPS: false
                                                                }
                                                                setSelectedLocation(loc)
                                                                try {
                                                                    localStorage.setItem("hipsloth_weather_location", JSON.stringify(loc))
                                                                } catch (e) {}
                                                                setShowLocationMenu(false)
                                                            }}
                                                            className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between group cursor-pointer"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-foreground truncate group-hover:text-primary">
                                                                    {site.projectTitle}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground truncate">
                                                                    {site.locationStr}
                                                                </p>
                                                            </div>
                                                            {selectedLocation.id === site.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                                                        </button>
                                                    ))}
                                                    <div className="h-px bg-white/5 my-1.5" />
                                                </div>
                                            )}

                                            {/* Popular Hubs / Filtered list */}
                                            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                {searchQuery ? "ผลการค้นหา" : "จังหวัดและพื้นที่ก่อสร้างหลัก"}
                                            </div>

                                            {filteredLocations.length === 0 ? (
                                                <p className="text-center text-xs text-muted-foreground py-3">
                                                    ไม่พบพื้นที่ที่ค้นหา
                                                </p>
                                            ) : (
                                                filteredLocations.map((loc) => (
                                                    <button
                                                        key={loc.id}
                                                        onClick={() => {
                                                            setSelectedLocation(loc)
                                                            try {
                                                                localStorage.setItem("hipsloth_weather_location", JSON.stringify(loc))
                                                            } catch (e) {}
                                                            setShowLocationMenu(false)
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between group cursor-pointer",
                                                            selectedLocation.id === loc.id
                                                                ? "bg-primary/20 text-primary font-bold"
                                                                : "hover:bg-white/10 text-foreground"
                                                        )}
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate">{loc.name}</p>
                                                            {loc.region && (
                                                                <p className="text-[9px] text-muted-foreground/70 truncate">{loc.region}</p>
                                                            )}
                                                        </div>
                                                        {selectedLocation.id === loc.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={() => fetchWeather(selectedLocation.lat, selectedLocation.lon, selectedLocation.name)}
                            disabled={isLoadingWeather}
                            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
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
                <div className="relative z-10 my-3 sm:my-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    {/* Left: Greeting & User Name */}
                    <div className="space-y-1 sm:space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {currentTeam?.role || "Member"}
                            </span>
                            <span className="text-[11px] sm:text-xs text-white/60">
                                อัปเดต {weather?.updatedAt || "เมื่อสักครู่"}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight break-words">
                            {greeting},{" "}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-primary/90">
                                {currentUser?.name?.split(" ")[0] || "Amarit"}
                            </span>
                        </h1>
                        <p className="text-xs sm:text-sm text-white/70 font-medium flex items-start sm:items-center gap-1.5 leading-snug">
                            <HardHat className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                            <span className="break-words">แดชบอร์ดติดตามสภาพงาน และข้อมูลโครงการประจำวัน</span>
                        </p>
                    </div>

                    {/* Right: Weather Metrics Display */}
                    {weather && weatherInfo && (
                        <div className="flex items-center gap-3 sm:gap-4 bg-black/40 backdrop-blur-md border border-white/10 p-2.5 sm:p-4 rounded-2xl shrink-0 self-start md:self-auto max-w-full">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 text-white shadow-inner flex items-center justify-center shrink-0">
                                <WeatherIcon className={cn("w-7 h-7 sm:w-10 sm:h-10 animate-pulse", weatherInfo.color)} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-2xl sm:text-4xl font-black font-mono text-white tracking-tight">
                                        {weather.temperature}°C
                                    </span>
                                    <span className="text-xs text-white/70 font-medium">
                                        (รู้สึก {weather.apparentTemperature}°)
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
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
                <div className="relative z-10 space-y-2.5 sm:space-y-3 pt-3 border-t border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Weather Spec Pills */}
                        {weather && (
                            <div className="flex items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs text-white/80 flex-wrap w-full">
                                <div className="flex items-center gap-1 bg-black/30 px-2 sm:px-2.5 py-1 rounded-lg border border-white/5">
                                    <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />
                                    <span>ความชื้น: <strong className="text-white font-mono">{weather.humidity}%</strong></span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/30 px-2 sm:px-2.5 py-1 rounded-lg border border-white/5">
                                    <Wind className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-300 shrink-0" />
                                    <span>ความเร็วลม: <strong className="text-white font-mono">{weather.windSpeed} km/h</strong></span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/30 px-2 sm:px-2.5 py-1 rounded-lg border border-white/5">
                                    <Thermometer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                                    <span>ดัชนีความร้อน: <strong className="text-white font-mono">{weather.apparentTemperature}°C</strong></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Site Construction Advisory Tag */}
                    {weatherInfo && (
                        <div
                            className={cn(
                                "flex items-start sm:items-center gap-2 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-medium border backdrop-blur-md transition-colors w-full",
                                weatherInfo.advisoryType === "good" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
                                weatherInfo.advisoryType === "warning" && "bg-amber-500/10 border-amber-500/20 text-amber-300",
                                weatherInfo.advisoryType === "caution" && "bg-blue-500/10 border-blue-500/20 text-blue-300",
                                weatherInfo.advisoryType === "danger" && "bg-rose-500/15 border-rose-500/30 text-rose-300 animate-pulse"
                            )}
                        >
                            <span className="flex-1 break-words leading-relaxed">{weatherInfo.advisory}</span>
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
