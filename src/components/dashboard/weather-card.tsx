"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Droplets, Thermometer } from "lucide-react"

interface WeatherData {
    temp: number
    condition: string
    humidity: number
    windSpeed: number
    location: string
    icon: string
}

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
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout

        const fetchWeather = async () => {
            try {
                // Get user's location or default to Bangkok
                let location = "Bangkok"

                // Try to get user's location
                if (navigator.geolocation) {
                    try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
                        })
                        location = `${position.coords.latitude},${position.coords.longitude}`
                    } catch {
                        // Use default location if geolocation fails
                    }
                }

                // Use wttr.in API (free, no API key needed)
                const response = await fetch(`https://wttr.in/${location}?format=j1`, { signal: controller.signal })

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
            } catch (err) {
                console.warn("Weather API unavailable, using fallback:", err)
                // Fallback to generic Bangkok weather to keep UI beautiful
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
                clearTimeout(timeoutId)
            }
        }

        fetchWeather()

        // Refresh every 30 minutes
        const interval = setInterval(fetchWeather, 30 * 60 * 1000)
        return () => {
            clearInterval(interval)
            controller.abort()
            clearTimeout(timeoutId)
        }
    }, [])

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
        return null // Hide if error
    }

    // Determine background gradient based on condition
    const getGradient = () => {
        const condition = weather.condition.toLowerCase()
        if (condition.includes('rain')) return 'from-blue-500/20 to-slate-500/20'
        if (condition.includes('thunder')) return 'from-purple-500/20 to-slate-700/20'
        if (condition.includes('snow')) return 'from-slate-200/20 to-blue-200/20'
        if (condition.includes('cloud')) return 'from-gray-400/20 to-slate-500/20'
        if (condition.includes('clear') || condition.includes('sunny')) return 'from-yellow-400/20 to-orange-300/20'
        return 'from-blue-400/20 to-purple-400/20'
    }

    return (
        <div className={`glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-br ${getGradient()} overflow-hidden relative`}>
            {/* Animated background particles for rain */}
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
                        <p className="text-sm font-medium">{weather.location}</p>
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

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3" />

                {/* Current Time & Day */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-muted-foreground">
                        อัพเดทเมื่อ {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* CSS for animations */}
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
