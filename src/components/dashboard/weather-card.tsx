"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Droplets, Thermometer, RefreshCw, MapPin, ChevronDown } from "lucide-react"

interface WeatherData {
    temp: number
    condition: string
    humidity: number
    windSpeed: number
    location: string
    icon: string
}

// Popular Thai cities for selection
const THAI_CITIES = [
    { name: "ตำแหน่งปัจจุบัน", value: "current" },
    { name: "กรุงเทพ", value: "Bangkok" },
    { name: "เชียงใหม่", value: "Chiang Mai" },
    { name: "ภูเก็ต", value: "Phuket" },
    { name: "พัทยา", value: "Pattaya" },
    { name: "ขอนแก่น", value: "Khon Kaen" },
    { name: "หาดใหญ่", value: "Hat Yai" },
    { name: "ระยอง", value: "Rayong" },
    { name: "แกลง", value: "Klaeng" },
    { name: "อุดรธานี", value: "Udon Thani" },
    { name: "นครราชสีมา", value: "Nakhon Ratchasima" },
]

// Animated weather icons using CSS animations
const WeatherIcon = ({ condition, className = "" }: { condition: string, className?: string }) => {
    const iconClass = `w-16 h-16 ${className}`

    // Map condition to icon
    const lowerCondition = condition.toLowerCase()

    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
        return (
            <div className="relative">
                <CloudRain className={`${iconClass} text-blue-400 animate-pulse`} />
                <div className="absolute inset-0 flex justify-center">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="w-0.5 h-2 bg-blue-400 rounded-full animate-rain mx-1"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            </div>
        )
    }

    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
        return <CloudLightning className={`${iconClass} text-yellow-400 animate-pulse`} />
    }

    if (lowerCondition.includes('snow')) {
        return <CloudSnow className={`${iconClass} text-slate-300 animate-pulse`} />
    }

    if (lowerCondition.includes('fog') || lowerCondition.includes('mist') || lowerCondition.includes('haze')) {
        return <CloudFog className={`${iconClass} text-gray-400 animate-pulse`} />
    }

    if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
        return (
            <div className="relative">
                <Cloud className={`${iconClass} text-gray-400`} style={{ animation: 'float 3s ease-in-out infinite' }} />
            </div>
        )
    }

    if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
        return (
            <Sun
                className={`${iconClass} text-yellow-400`}
                style={{ animation: 'spin 20s linear infinite' }}
            />
        )
    }

    // Default: partly cloudy
    return (
        <div className="relative">
            <Sun className="w-12 h-12 text-yellow-400 absolute -top-1 -left-1" style={{ animation: 'spin 20s linear infinite' }} />
            <Cloud className={`${iconClass} text-gray-300`} style={{ animation: 'float 3s ease-in-out infinite' }} />
        </div>
    )
}

export function WeatherCard() {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedCity, setSelectedCity] = useState<string>("current")
    const [showCityPicker, setShowCityPicker] = useState(false)

    // Load saved city from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("weather-city")
        if (saved) setSelectedCity(saved)
    }, [])

    const fetchWeather = useCallback(async (city: string, isRefresh: boolean = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        try {
            let location = city

            // If "current", try to get user's location
            if (city === "current" && navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
                    })
                    location = `${position.coords.latitude},${position.coords.longitude}`
                } catch {
                    location = "Bangkok" // Fallback
                }
            }

            const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`, { signal: controller.signal })

            if (!response.ok) throw new Error("Weather fetch failed")

            const data = await response.json()
            const current = data.current_condition[0]
            const area = data.nearest_area?.[0]

            setWeather({
                temp: parseInt(current.temp_C),
                condition: current.weatherDesc[0].value,
                humidity: parseInt(current.humidity),
                windSpeed: parseInt(current.windspeedKmph),
                location: area?.areaName?.[0]?.value || location,
                icon: current.weatherCode
            })
            setError(null)
        } catch (err) {
            console.warn("Weather API unavailable, using fallback:", err)
            setWeather({
                temp: 32,
                condition: "Sunny",
                humidity: 60,
                windSpeed: 10,
                location: "Bangkok",
                icon: "113"
            })
        } finally {
            setLoading(false)
            setRefreshing(false)
            clearTimeout(timeoutId)
        }
    }, [])

    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchWeather(selectedCity)

        const interval = setInterval(() => fetchWeather(selectedCity, true), 30 * 60 * 1000)
        return () => clearInterval(interval)
    }, [selectedCity, fetchWeather])

    const handleCityChange = (city: string) => {
        setSelectedCity(city)
        localStorage.setItem("weather-city", city)
        setShowCityPicker(false)
        fetchWeather(city, true)
    }

    const handleRefresh = () => {
        fetchWeather(selectedCity, true)
    }

    if (loading) {
        return (
            <div className="glass-card rounded-2xl p-4 border border-white/5 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-xl" />
                    <div className="space-y-2">
                        <div className="h-6 w-24 bg-muted rounded" />
                        <div className="h-4 w-32 bg-muted rounded" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !weather) {
        return null
    }

    const getGradient = () => {
        const condition = weather.condition.toLowerCase()
        if (condition.includes('rain')) return 'from-blue-500/20 to-slate-500/20'
        if (condition.includes('thunder')) return 'from-purple-500/20 to-slate-700/20'
        if (condition.includes('snow')) return 'from-slate-200/20 to-blue-200/20'
        if (condition.includes('cloud')) return 'from-gray-400/20 to-slate-500/20'
        if (condition.includes('clear') || condition.includes('sunny')) return 'from-yellow-400/20 to-orange-300/20'
        return 'from-blue-400/20 to-purple-400/20'
    }

    const selectedCityName = THAI_CITIES.find(c => c.value === selectedCity)?.name || selectedCity

    return (
        <div className={`glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-br ${getGradient()} overflow-hidden relative`}>
            {/* Rain particles */}
            {weather.condition.toLowerCase().includes('rain') && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-0.5 h-4 bg-blue-400/30 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10px`,
                                animation: `rain-fall ${0.5 + Math.random() * 0.5}s linear infinite`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="relative z-10">
                {/* Main Weather Info */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-5">
                        <div className="scale-125">
                            <WeatherIcon condition={weather.condition} />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black">{weather.temp}°</span>
                                <span className="text-xl text-muted-foreground font-medium">C</span>
                            </div>
                            <p className="text-lg font-semibold capitalize mt-1">{weather.condition}</p>
                        </div>
                    </div>

                    <div className="text-right space-y-2">
                        {/* City Picker */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCityPicker(!showCityPicker)}
                                className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                {weather.location}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCityPicker ? 'rotate-180' : ''}`} />
                            </button>

                            {showCityPicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowCityPicker(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95">
                                        {THAI_CITIES.map(city => (
                                            <button
                                                key={city.value}
                                                onClick={() => handleCityChange(city.value)}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${selectedCity === city.value ? 'bg-primary/10 text-primary font-medium' : ''}`}
                                            >
                                                {city.name}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                            <Droplets className="w-4 h-4" />
                            <span>ความชื้น {weather.humidity}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                            <Wind className="w-4 h-4" />
                            <span>ลม {weather.windSpeed} km/h</span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3" />

                {/* Footer with date and refresh */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                            อัพเดทเมื่อ {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            title="รีเฟรช"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes rain-fall {
                    0% { transform: translateY(-10px); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(150px); opacity: 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes rain {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(20px); opacity: 0; }
                }
            `}</style>
        </div>
    )
}

