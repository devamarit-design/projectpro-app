import { useState, useEffect } from "react"
import {
    Sun,
    Moon,
    Cloud,
    CloudSun,
    CloudMoon,
    CloudRain,
    CloudLightning,
    CloudFog,
    type LucideIcon
} from "lucide-react"
import { getGoogleMapsUrl } from "@/lib/utils"

export interface ProjectLocationCoord {
    lat: number
    lon: number
    locationName: string
    isMatched: boolean
}

export interface ProjectWeatherData {
    temperature: number
    apparentTemperature: number
    weatherCode: number
    isDay: boolean
    windSpeed: number
    humidity: number
    label: string
    icon: LucideIcon
    iconColor: string
    advisoryType: "good" | "warning" | "caution" | "danger"
    locationName: string
    timestamp: number
}

// Comprehensive Thai provinces and popular project districts with coordinates
const THAI_LOCATION_DICTIONARY: { keywords: string[]; name: string; lat: number; lon: number }[] = [
    // ภาคตะวันออก
    { keywords: ["บางละมุง", "พัทยา", "pattaya", "banglamung", "จอมเทียน", "นาเกลือ"], name: "อ.บางละมุง (พัทยา)", lat: 12.9276, lon: 100.8771 },
    { keywords: ["ศรีราชา", "sriracha", "แหลมฉบัง"], name: "อ.ศรีราชา, ชลบุรี", lat: 13.1737, lon: 100.9311 },
    { keywords: ["สัตหีบ", "sattahip", "บางเสร่"], name: "อ.สัตหีบ, ชลบุรี", lat: 12.6664, lon: 100.9007 },
    { keywords: ["ชลบุรี", "chonburi", "เมืองชลบุรี", "บ้านบึง", "พานทอง", "พนัสนิคม"], name: "ชลบุรี", lat: 13.3611, lon: 100.9847 },
    { keywords: ["ระยอง", "rayong", "มาบตาพุด", "ปลวกแดง", "แกลง", "บ้านฉาง"], name: "ระยอง", lat: 12.6814, lon: 101.2816 },
    { keywords: ["มะขาม", "มะขามจันทบุรี", "จันทบุรี", "chanthaburi", "ท่าใหม่", "ขลุง", "โป่งน้ำร้อน"], name: "จันทบุรี", lat: 12.6114, lon: 102.1039 },
    { keywords: ["ตราด", "trat", "เกาะช้าง"], name: "ตราด", lat: 12.2428, lon: 102.5175 },
    { keywords: ["ฉะเชิงเทรา", "chachoengsao", "แปดริ้ว", "บางปะกง", "แปลงยาว"], name: "ฉะเชิงเทรา", lat: 13.6904, lon: 101.0779 },
    { keywords: ["ปราจีนบุรี", "prachinburi", "กบินทร์บุรี", "นิคม304", "304"], name: "ปราจีนบุรี", lat: 14.0509, lon: 101.3719 },
    { keywords: ["สระแก้ว", "sa kaeo", "อรัญประเทศ"], name: "สระแก้ว", lat: 13.8140, lon: 102.0725 },

    // ภาคอีสาน
    { keywords: ["ชัยภูมิ", "chaiyaphum", "ภูเขียว", "แก้งคร้อ"], name: "ชัยภูมิ", lat: 15.8083, lon: 102.0315 },
    { keywords: ["โคราช", "นครราชสีมา", "korat", "nakhon ratchasima", "ปากช่อง", "เขาใหญ่", "สีคิ้ว", "ด่านขุนทด"], name: "นครราชสีมา (โคราช)", lat: 14.9799, lon: 102.0978 },
    { keywords: ["ขอนแก่น", "khon kaen", "ชุมแพ", "น้ำพอง", "บ้านไผ่"], name: "ขอนแก่น", lat: 16.4419, lon: 102.8359 },
    { keywords: ["อุดรธานี", "อุดร", "udon thani"], name: "อุดรธานี", lat: 17.4138, lon: 102.7872 },
    { keywords: ["อุบลราชธานี", "อุบล", "ubon ratchathani", "วารินชำราบ"], name: "อุบลราชธานี", lat: 15.2448, lon: 104.8473 },
    { keywords: ["บุรีรัมย์", "buriram", "นางรอง"], name: "บุรีรัมย์", lat: 14.9930, lon: 103.1029 },
    { keywords: ["สุรินทร์", "surin", "ปราสาท"], name: "สุรินทร์", lat: 14.8818, lon: 103.4936 },
    { keywords: ["ศรีสะเกษ", "sisaket", "กันทรลักษ์"], name: "ศรีสะเกษ", lat: 15.1186, lon: 104.3220 },
    { keywords: ["ร้อยเอ็ด", "roi et"], name: "ร้อยเอ็ด", lat: 16.0538, lon: 103.6520 },
    { keywords: ["กาฬสินธุ์", "kalasin"], name: "กาฬสินธุ์", lat: 16.4322, lon: 103.5061 },
    { keywords: ["มหาสารคาม", "maha sarakham"], name: "มหาสารคาม", lat: 16.1852, lon: 103.3023 },
    { keywords: ["สกลนคร", "sakon nakhon"], name: "สกลนคร", lat: 17.1546, lon: 104.1486 },
    { keywords: ["นครพนม", "nakhon phanom"], name: "นครพนม", lat: 17.3976, lon: 104.7695 },
    { keywords: ["หนองคาย", "nong khai"], name: "หนองคาย", lat: 17.8783, lon: 102.7420 },
    { keywords: ["เลย", "loei", "เชียงคาน", "ภูกระดึง"], name: "เลย", lat: 17.4860, lon: 101.7223 },
    { keywords: ["มุกดาหาร", "mukdahan"], name: "มุกดาหาร", lat: 16.5420, lon: 104.7235 },
    { keywords: ["ยโสธร", "yasothon"], name: "ยโสธร", lat: 15.7926, lon: 104.1451 },
    { keywords: ["อำนาจเจริญ", "amnat charoen"], name: "อำนาจเจริญ", lat: 15.8585, lon: 104.6258 },
    { keywords: ["บึงกาฬ", "bueng kan"], name: "บึงกาฬ", lat: 18.3609, lon: 103.6520 },
    { keywords: ["หนองบัวลำภู", "nong bua lamphu"], name: "หนองบัวลำภู", lat: 17.2044, lon: 102.4407 },

    // กทม. และปริมณฑล
    { keywords: ["กรุงเทพ", "กทม", "bangkok", "bkk", "สุขุมวิท", "ลาดพร้าว", "จตุจักร", "บางนา", "ดอนเมือง", "บางแค", "พระราม"], name: "กรุงเทพฯ", lat: 13.7563, lon: 100.5018 },
    { keywords: ["นนทบุรี", "nonthaburi", "ปากเกร็ด", "บางใหญ่", "บางบัวทอง", "รัตนาธิเบศร์"], name: "นนทบุรี", lat: 13.8591, lon: 100.5217 },
    { keywords: ["ปทุมธานี", "pathum thani", "รังสิต", "คลองหลวง", "ลำลูกกา", "ธัญบุรี"], name: "ปทุมธานี", lat: 14.0208, lon: 100.5250 },
    { keywords: ["สมุทรปราการ", "samut prakan", "บางพลี", "บางปู", "สำโรง", "เทพารักษ์"], name: "สมุทรปราการ", lat: 13.5991, lon: 100.5998 },
    { keywords: ["สมุทรสาคร", "samut sakhon", "มหาชัย", "กระทุ่มแบน"], name: "สมุทรสาคร", lat: 13.5475, lon: 100.2744 },
    { keywords: ["นครปฐม", "nakhon pathom", "ศาลายา", "พุทธมณฑล", "สามพราน"], name: "นครปฐม", lat: 13.8196, lon: 100.0601 },

    // ภาคกลาง
    { keywords: ["อยุธยา", "พระนครศรีอยุธยา", "ayutthaya", "โรจนะ", "บางปะอิน", "วังน้อย"], name: "พระนครศรีอยุธยา", lat: 14.3532, lon: 100.5684 },
    { keywords: ["สระบุรี", "saraburi", "แก่งคอย", "มวกเหล็ก", "หนองแค"], name: "สระบุรี", lat: 14.5289, lon: 100.9101 },
    { keywords: ["ลพบุรี", "lopburi"], name: "ลพบุรี", lat: 14.7995, lon: 100.6534 },
    { keywords: ["สุพรรณบุรี", "suphan buri"], name: "สุพรรณบุรี", lat: 14.4745, lon: 100.1177 },
    { keywords: ["กาญจนบุรี", "kanchanaburi"], name: "กาญจนบุรี", lat: 14.0228, lon: 99.5328 },
    { keywords: ["ราชบุรี", "ratchaburi", "บ้านโป่ง"], name: "ราชบุรี", lat: 13.5363, lon: 99.8171 },
    { keywords: ["นครสวรรค์", "nakhon sawan", "ปากน้ำโพ"], name: "นครสวรรค์", lat: 15.6987, lon: 100.1199 },
    { keywords: ["พิษณุโลก", "phitsanulok"], name: "พิษณุโลก", lat: 16.8211, lon: 100.2659 },
    { keywords: ["เพชรบูรณ์", "phetchabun", "เขาค้อ"], name: "เพชรบูรณ์", lat: 16.4190, lon: 101.1567 },
    { keywords: ["นครนายก", "nakhon nayok"], name: "นครนายก", lat: 14.2069, lon: 101.2131 },

    // ภาคเหนือ
    { keywords: ["เชียงใหม่", "chiang mai", "หางดง", "สันทราย", "แม่ริม", "ดอยสะเก็ด"], name: "เชียงใหม่", lat: 18.7883, lon: 98.9853 },
    { keywords: ["เชียงราย", "chiang rai", "แม่สาย"], name: "เชียงราย", lat: 19.9105, lon: 99.8406 },
    { keywords: ["ลำปาง", "lampang"], name: "ลำปาง", lat: 18.2888, lon: 99.4928 },
    { keywords: ["ลำพูน", "lamphun"], name: "ลำพูน", lat: 18.5744, lon: 99.0087 },
    { keywords: ["น่าน", "nan"], name: "น่าน", lat: 18.7830, lon: 100.7782 },
    { keywords: ["แพร่", "phrae"], name: "แพร่", lat: 18.1446, lon: 100.1411 },
    { keywords: ["พะเยา", "phayao"], name: "พะเยา", lat: 19.1664, lon: 99.9022 },
    { keywords: ["แม่ฮ่องสอน", "mae hong son", "ปาย"], name: "แม่ฮ่องสอน", lat: 19.3020, lon: 97.9654 },
    { keywords: ["ตาก", "tak", "แม่สอด"], name: "ตาก", lat: 16.8839, lon: 99.1258 },

    // ภาคใต้
    { keywords: ["ภูเก็ต", "phuket", "ป่าตอง", "กะทู้", "ถลาง"], name: "ภูเก็ต", lat: 7.8804, lon: 98.3923 },
    { keywords: ["สุราษฎร์ธานี", "สุราษฎร์", "surat thani", "สมุย", "พะงัน"], name: "สุราษฎร์ธานี", lat: 9.1382, lon: 99.3217 },
    { keywords: ["สงขลา", "หาดใหญ่", "songkhla", "hat yai"], name: "สงขลา (หาดใหญ่)", lat: 7.0084, lon: 100.4767 },
    { keywords: ["กระบี่", "krabi", "อ่าวนาง"], name: "กระบี่", lat: 8.0863, lon: 98.9063 },
    { keywords: ["พังงา", "phang nga", "เขาหลัก"], name: "พังงา", lat: 8.4501, lon: 98.5255 },
    { keywords: ["นครศรีธรรมราช", "nakhon si thammarat", "ทุ่งสง"], name: "นครศรีธรรมราช", lat: 8.4304, lon: 99.9631 },
    { keywords: ["หัวหิน", "hua hin", "ประจวบ", "ประจวบคีรีขันธ์", "ปราณบุรี"], name: "หัวหิน, ประจวบฯ", lat: 12.5684, lon: 99.9577 },
    { keywords: ["เพชรบุรี", "phetchaburi", "ชะอำ"], name: "เพชรบุรี (ชะอำ)", lat: 13.1114, lon: 99.9391 },
    { keywords: ["ตรัง", "trang"], name: "ตรัง", lat: 7.5594, lon: 99.6114 },
    { keywords: ["ชุมพร", "chumphon"], name: "ชุมพร", lat: 10.4930, lon: 99.1800 },
    { keywords: ["ระนอง", "ranong"], name: "ระนอง", lat: 9.9658, lon: 98.6348 },
]

/**
 * Extracts latitude and longitude from project mapUrl, location, or name
 */
export function extractProjectLocationCoords(
    location?: string | null,
    mapUrl?: string | null,
    projectName?: string | null
): ProjectLocationCoord {
    const rawMapUrl = mapUrl || ""
    const rawLocation = location || ""
    const rawName = projectName || ""

    // 1. Try extracting exact coordinates from mapUrl or location text
    // Regex patterns for Google Maps coordinates
    const coordPatterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,                               // /@12.9235,100.8771
        /[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/,             // ?q=12.9235,100.8771
        /place\/(-?\d+\.\d+),(-?\d+\.\d+)/,                         // place/12.9235,100.8771
        /\b(-?\d{1,2}\.\d{3,})[,\s]+(\d{2,3}\.\d{3,})\b/           // "12.9276, 100.8771"
    ]

    const textToScan = `${rawMapUrl} ${rawLocation}`
    for (const pattern of coordPatterns) {
        const match = textToScan.match(pattern)
        if (match) {
            const lat = parseFloat(match[1])
            const lon = parseFloat(match[2])
            if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                // If we also matched a known city name, use it; otherwise use location or coords
                const matchedCity = THAI_LOCATION_DICTIONARY.find(item =>
                    item.keywords.some(kw => rawLocation.toLowerCase().includes(kw) || rawName.toLowerCase().includes(kw))
                )
                return {
                    lat,
                    lon,
                    locationName: matchedCity ? matchedCity.name : (rawLocation || `พิกัด ${lat.toFixed(2)},${lon.toFixed(2)}`),
                    isMatched: true
                }
            }
        }
    }

    // 2. Keyword match in location, mapUrl, and project name
    const combined = `${rawLocation} ${rawName} ${rawMapUrl}`.toLowerCase()
    for (const item of THAI_LOCATION_DICTIONARY) {
        if (item.keywords.some(kw => combined.includes(kw))) {
            return {
                lat: item.lat,
                lon: item.lon,
                locationName: item.name,
                isMatched: true
            }
        }
    }

    // 3. Fallback default (Bangkok)
    return {
        lat: 13.7563,
        lon: 100.5018,
        locationName: rawLocation || "กรุงเทพมหานคร",
        isMatched: false
    }
}

/**
 * Maps Open-Meteo weather code to label, icon, and colors
 */
export function getProjectWeatherDetails(code: number, isDay: boolean) {
    if (code === 0) {
        return {
            label: "ท้องฟ้าแจ่มใส",
            icon: isDay ? Sun : Moon,
            iconColor: isDay ? "text-amber-400" : "text-indigo-300",
            advisoryType: "good" as const
        }
    }
    if (code >= 1 && code <= 3) {
        return {
            label: code === 3 ? "ท้องฟ้ามีเมฆมาก" : "มีเมฆบางส่วน",
            icon: isDay ? CloudSun : CloudMoon,
            iconColor: isDay ? "text-sky-400" : "text-indigo-300",
            advisoryType: "good" as const
        }
    }
    if (code === 45 || code === 48) {
        return {
            label: "มีหมอกลง",
            icon: CloudFog,
            iconColor: "text-slate-300",
            advisoryType: "warning" as const
        }
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        return {
            label: code >= 65 || code === 82 ? "ฝนตกหนัก" : "มีฝนตก",
            icon: CloudRain,
            iconColor: "text-blue-400",
            advisoryType: "caution" as const
        }
    }
    if (code >= 95) {
        return {
            label: "พายุฟ้าคะนอง",
            icon: CloudLightning,
            iconColor: "text-purple-400",
            advisoryType: "danger" as const
        }
    }
    return {
        label: "อากาศทั่วไป",
        icon: isDay ? Sun : Moon,
        iconColor: isDay ? "text-amber-400" : "text-indigo-300",
        advisoryType: "good" as const
    }
}

// In-memory cache + in-flight promises to prevent duplicate fetches across project cards
const weatherCache = new Map<string, ProjectWeatherData>()
const inFlightRequests = new Map<string, Promise<ProjectWeatherData | null>>()

const CACHE_TTL_MS = 20 * 60 * 1000 // 20 minutes

/**
 * Fetches real-time weather from Open-Meteo with caching and deduplication
 */
export async function fetchProjectWeather(
    lat: number,
    lon: number,
    locationName: string
): Promise<ProjectWeatherData | null> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`
    const now = Date.now()

    // 1. Check in-memory cache
    const cached = weatherCache.get(key)
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return cached
    }

    // 2. Check sessionStorage if in browser
    if (typeof window !== "undefined") {
        try {
            const stored = sessionStorage.getItem(`weather_${key}`)
            if (stored) {
                const parsed = JSON.parse(stored) as ProjectWeatherData
                if (now - parsed.timestamp < CACHE_TTL_MS) {
                    const details = getProjectWeatherDetails(parsed.weatherCode, parsed.isDay)
                    const fullData: ProjectWeatherData = {
                        ...parsed,
                        icon: details.icon,
                        iconColor: details.iconColor
                    }
                    weatherCache.set(key, fullData)
                    return fullData
                }
            }
        } catch {
            // Ignore sessionStorage read errors
        }
    }

    // 3. Check if identical request is already in-flight
    if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key)!
    }

    // 4. Fetch from Open-Meteo API
    const fetchPromise = (async () => {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=Asia%2FBangkok`
            const res = await fetch(url)
            if (!res.ok) throw new Error("Failed to fetch weather")
            const data = await res.json()

            if (data?.current) {
                const isDay = Boolean(data.current.is_day)
                const weatherCode = data.current.weather_code
                const details = getProjectWeatherDetails(weatherCode, isDay)

                const weatherData: ProjectWeatherData = {
                    temperature: Math.round(data.current.temperature_2m),
                    apparentTemperature: Math.round(data.current.apparent_temperature),
                    weatherCode,
                    isDay,
                    windSpeed: Math.round(data.current.wind_speed_10m),
                    humidity: data.current.relative_humidity_2m,
                    label: details.label,
                    icon: details.icon,
                    iconColor: details.iconColor,
                    advisoryType: details.advisoryType,
                    locationName,
                    timestamp: Date.now()
                }

                // Cache in memory
                weatherCache.set(key, weatherData)

                // Cache in sessionStorage (without non-serializable LucideIcon)
                if (typeof window !== "undefined") {
                    try {
                        const serializable = { ...weatherData, icon: undefined }
                        sessionStorage.setItem(`weather_${key}`, JSON.stringify(serializable))
                    } catch {
                        // Ignore quota errors
                    }
                }

                return weatherData
            }
        } catch (e) {
            console.warn(`Weather fetch failed for ${key}:`, e)
        } finally {
            inFlightRequests.delete(key)
        }
        return null
    })()

    inFlightRequests.set(key, fetchPromise)
    return fetchPromise
}

/**
 * Custom React Hook for Realtime Project Weather
 */
export function useProjectRealtimeWeather({
    location,
    mapUrl,
    name
}: {
    location?: string | null
    mapUrl?: string | null
    name?: string | null
}) {
    const [weather, setWeather] = useState<ProjectWeatherData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const coord = extractProjectLocationCoords(location, mapUrl, name)
    const mapsUrl = getGoogleMapsUrl(location, mapUrl)

    useEffect(() => {
        let isMounted = true

        const loadWeather = async () => {
            const data = await fetchProjectWeather(coord.lat, coord.lon, coord.locationName)
            if (isMounted && data) {
                setWeather(data)
            }
            if (isMounted) {
                setIsLoading(false)
            }
        }

        setIsLoading(true)
        loadWeather()

        return () => {
            isMounted = false
        }
    }, [coord.lat, coord.lon, coord.locationName])

    return {
        weather,
        isLoading,
        coord,
        mapsUrl
    }
}
