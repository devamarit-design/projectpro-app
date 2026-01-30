"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Bitcoin, Coins, Laptop, ArrowUpRight, ArrowDownRight, RefreshCcw, DollarSign, Cpu, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n-context"

// --- Types ---
type AssetType = 'gold' | 'btc' | 'nvidia' | 'currency'
type TimeframeType = '1D' | '1M' | '1Y'
type CurrencyType = 'THB' | 'USD'

interface MarketDataPoint {
    time: string
    value: number
}

// --- Helper: Dynamic Labels ---
const getLabels = (timeframe: TimeframeType, locale: string) => {
    const now = new Date()
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const months = locale === 'th' ? thaiMonths : enMonths

    if (timeframe === '1D') {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now.getTime() - (6 - i) * 60 * 60 * 1000)
            return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
        })
    }
    if (timeframe === '1M') {
        return Array.from({ length: 30 }, (_, i) => {
            const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
            return d.getDate().toString()
        })
    }
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
        return months[d.getMonth()]
    })
}

export function MarketOverview() {
    const { locale } = useTranslation()
    const [activeAsset, setActiveAsset] = useState<AssetType>('gold')
    const [timeframe, setTimeframe] = useState<TimeframeType>('1D')
    const [currency, setCurrency] = useState<CurrencyType>('THB')

    // --- State ---
    const [loading, setLoading] = useState(true)
    const [chartLoading, setChartLoading] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [prices, setPrices] = useState({
        gold: { thb: 43650, usd: 2650, change: 150 },
        btc: { thb: 3580000, usd: 104200, change: 2.5 },
        exchangeRate: 34.5
    })
    const [historyData, setHistoryData] = useState<Record<string, MarketDataPoint[]>>({})

    // --- Helper: Safe Fetch ---
    const safeFetch = async (url: string, options?: RequestInit) => {
        try {
            const res = await fetch(url, options)
            if (!res.ok) return { ok: false, status: res.status }
            const data = await res.json()
            return { ok: true, data }
        } catch (e) {
            console.error(`SafeFetch Failed: ${url}`, e)
            return { ok: false, error: e }
        }
    }

    const fetchLivePrices = async () => {
        setFetchError(null)
        try {
            const [goldResult, btcResult] = await Promise.all([
                safeFetch('/api/market?type=gold-latest'),
                safeFetch('/api/market?type=btc-latest')
            ])

            if (goldResult.ok && btcResult.ok) {
                const goldJson = goldResult.data
                const btcJson = btcResult.data

                if (goldJson?.response?.price && btcJson?.bitcoin) {
                    const goldBarBuy = parseInt(goldJson.response.price.gold_bar.buy.replace(/,/g, ''))
                    const goldBarSell = parseInt(goldJson.response.price.gold_bar.sell.replace(/,/g, ''))
                    const goldChange = parseInt(goldJson.response.price.change.compare_previous.replace(/[+,]/g, '')) || 0
                    const btcThb = btcJson.bitcoin.thb
                    const btcUsd = btcJson.bitcoin.usd
                    const rate = btcThb / btcUsd

                    setPrices({
                        gold: {
                            thb: Math.max(goldBarBuy, goldBarSell), // Use the higher price as current value
                            usd: (Math.max(goldBarBuy, goldBarSell) / rate) / 0.472, // 0.472 is approx (Baht/Oz * 0.965)
                            change: goldChange
                        },
                        btc: {
                            thb: btcThb,
                            usd: btcUsd,
                            change: btcJson.bitcoin.usd_24h_change
                        },
                        exchangeRate: rate
                    })
                    setLastUpdated(new Date())
                    return
                }
            }

            // If we reach here, one or both failed or had bad data
            if (!goldResult.ok || !btcResult.ok) {
                setFetchError("API Rate Limited")
            }
        } catch (error) {
            setFetchError("Network Error")
        } finally {
            setLoading(false)
        }
    }

    // --- Helper: Market Status ---
    const getMarketStatus = (asset: AssetType) => {
        if (asset === 'btc') return 'OPEN' // Crypto is 24/7

        const now = new Date()
        const day = now.getDay() // 0=Sun, 6=Sat
        const hour = now.getHours()
        const minute = now.getMinutes()

        // Weekend Check (Sat/Sun)
        if (day === 0 || day === 6) return 'CLOSED'

        if (asset === 'nvidia') {
            // US Market (approx 9:30 PM - 4:00 AM BKK)
            // Simulating typical US trading hours in local time (UTC+7)
            // Winter: 21:30 - 04:00 | Summer: 20:30 - 03:00
            // Let's assume generic "Night time" in Asia for US stocks
            if (hour >= 21 || hour < 4) return 'OPEN'
            return 'CLOSED'
        }

        if (asset === 'gold' || asset === 'currency') {
            // Forex/Gold: Mon-Fri basically 24h, but let's say "Closed" if it's weekend (already handled)
            // Or maybe user considers "Gold" closed outside Thai business hours? 
            // The user prompt implies "If market closed, say closed".
            return 'OPEN'
        }

        return 'OPEN'
    }

    const fetchHistory = async (asset: AssetType = activeAsset, tf: TimeframeType = timeframe) => {
        if (asset === 'nvidia' || asset === 'currency') {
            const key = `${asset}-${tf}`
            if (!historyData[key]) {
                const labels = getLabels(tf, locale)
                const baseVal = asset === 'nvidia' ? 135.5 : 34.5
                const vol = asset === 'nvidia' ? 2 : 0.05
                // Deterministic mock: same for the same asset/tf/label
                const points = labels.map((l, i) => ({
                    time: l,
                    value: baseVal + (Math.sin(i * 0.5) * vol) + (Math.cos(i * 0.2) * vol * 0.5)
                }))
                setHistoryData(prev => ({ ...prev, [key]: points }))
            }
            return
        }

        const daysMap = { '1D': 1, '1M': 30, '1Y': 365 }
        const idMap = { 'btc': 'bitcoin', 'gold': 'pax-gold' }

        if (asset === 'btc' || asset === 'gold') {
            setChartLoading(true)
            const id = idMap[asset]
            const result = await safeFetch(`/api/market?type=history&id=${id}&days=${daysMap[tf]}&interval=${tf === '1D' ? 'hourly' : 'daily'}`)

            if (result.ok && result.data?.prices && Array.isArray(result.data.prices)) {
                const labels = getLabels(tf, locale)
                // Map the results to the labels more accurately
                const rawPrices = result.data.prices
                const points = labels.map((l, i) => {
                    // Try to find the closest point in time if possible, or just sample
                    const dataIndex = Math.floor((i / labels.length) * rawPrices.length)
                    const [ts, val] = rawPrices[dataIndex] || [0, 0]
                    return {
                        time: l,
                        value: val
                    }
                })
                setHistoryData(prev => ({ ...prev, [`${asset}-${tf}`]: points }))
                setLastUpdated(new Date())
                setFetchError(null)
            } else {
                if (!result.ok) {
                    console.warn("CoinGecko history fetch failed:", result.status || 'Network Error')
                    setFetchError("API Rate Limited")

                    // --- Fallback Mock for Gold/BTC ---
                    const key = `${asset}-${tf}`
                    if (!historyData[key]) {
                        const labels = getLabels(tf, locale)
                        const baseVal = asset === 'btc' ? 104000 : 2650
                        const vol = asset === 'btc' ? 1500 : 35
                        const points = labels.map((l, i) => ({
                            time: l,
                            value: baseVal + (Math.sin(i * 0.5) * vol) + (Math.cos(i * 0.1) * vol * 0.5)
                        }))
                        setHistoryData(prev => ({ ...prev, [key]: points }))
                    }
                }
            }
            setChartLoading(false)
        }
    }

    // --- Initial and Interval Fetch ---
    useEffect(() => {
        fetchLivePrices()
        // Update every 10 minutes
        const interval = setInterval(() => {
            fetchLivePrices()
            fetchHistory(activeAsset, timeframe)
        }, 10 * 60 * 1000)

        return () => clearInterval(interval)
    }, [activeAsset, timeframe])

    useEffect(() => {
        // Fetch history if not already present for this combination
        const key = `${activeAsset}-${timeframe}`
        if (!historyData[key]) {
            fetchHistory(activeAsset, timeframe)
        }
    }, [activeAsset, timeframe, locale])

    const handleRefresh = () => {
        fetchLivePrices()
        fetchHistory(activeAsset, timeframe)
    }

    // --- Data Mapping ---
    const getData = () => {
        const isTHB = currency === 'THB'
        const rate = prices.exchangeRate
        const key = `${activeAsset}-${timeframe}`
        const apiData = historyData[key]
        const labels = getLabels(timeframe, locale)

        const getChartPoints = () => {
            if (apiData && apiData.length > 0) {
                return apiData.map(p => ({
                    ...p,
                    value: isTHB ? p.value * rate * (activeAsset === 'gold' ? 0.472 : 1) : p.value
                }))
            }
            return []
        }

        switch (activeAsset) {
            case 'gold':
                const goldPrice = isTHB ? prices.gold.thb : (prices.gold.thb / rate) * 2.0403
                return {
                    current: goldPrice,
                    change: prices.gold.change,
                    percent: (prices.gold.change / prices.gold.thb) * 100,
                    unit: isTHB ? (locale === 'th' ? 'บาท (ทองคำแท่ง 96.5%)' : 'THB (Gold 96.5%)') : 'USD / Oz',
                    data: getChartPoints()
                }
            case 'btc':
                return {
                    current: isTHB ? prices.btc.thb : prices.btc.usd,
                    change: prices.btc.usd * (prices.btc.change / 100),
                    percent: prices.btc.change,
                    unit: isTHB ? 'THB / BTC' : 'USD / BTC',
                    data: getChartPoints()
                }
            case 'nvidia':
                const nvda = 135.50
                return {
                    current: isTHB ? nvda * rate : nvda,
                    change: -1.5,
                    percent: -1.1,
                    unit: isTHB ? 'THB / Share' : 'USD / Share',
                    data: getChartPoints()
                }
            case 'currency':
                return {
                    current: rate,
                    change: 0.05,
                    percent: 0.15,
                    unit: 'THB / USD',
                    data: getChartPoints()
                }
        }
    }

    const { current, change, percent, unit, data: chartData } = getData()
    const isPositive = percent >= 0 || (activeAsset === 'gold' && change >= 0)

    const assetConfig = {
        gold: { label: locale === 'th' ? 'ทองคำ' : 'Gold', icon: <Coins className="w-5 h-5" />, color: 'from-yellow-400 to-amber-600', stroke: '#f59e0b' },
        btc: { label: 'Bitcoin', icon: <Bitcoin className="w-5 h-5" />, color: 'from-orange-400 to-red-600', stroke: '#f97316' },
        nvidia: { label: 'Nvidia', icon: <Cpu className="w-5 h-5" />, color: 'from-green-400 to-emerald-600', stroke: '#10b981' },
        currency: { label: 'USD/THB', icon: <RefreshCcw className="w-5 h-5" />, color: 'from-blue-400 to-indigo-600', stroke: '#6366f1' }
    }

    const currentAsset = assetConfig[activeAsset]
    const marketStatus = getMarketStatus(activeAsset)
    const isClosed = marketStatus === 'CLOSED'
    const statusLabel = isClosed ? 'MARKET CLOSED' :
        ((fetchError && historyData[`${activeAsset}-${timeframe}`]) ? 'DELAYED' :
            (fetchError ? 'OFFLINE' : (activeAsset === 'nvidia' || activeAsset === 'currency' ? 'DELAYED' : 'LIVE')))

    const badgeColor = isClosed ? "bg-slate-500/10 text-slate-400" :
        (statusLabel === 'OFFLINE' ? "bg-red-500/10 text-red-500" :
            (statusLabel === 'DELAYED' ? "bg-yellow-500/10 text-yellow-500" : "bg-emerald-500/10 text-emerald-500"))

    return (
        <div className="w-full mb-8">
            <div className="relative overflow-hidden rounded-3xl glass-card border border-white/10 shadow-2xl">
                <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br transition-colors duration-700", currentAsset.color)} />
                <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-2 p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/5 overflow-x-auto max-w-full scrollbar-hide">
                            {(Object.keys(assetConfig) as AssetType[]).map((tab) => (
                                <button key={tab} onClick={() => setActiveAsset(tab)} className={cn("px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap", activeAsset === tab ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-muted-foreground hover:text-white hover:bg-white/5")}>
                                    {assetConfig[tab].icon} <span>{assetConfig[tab].label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
                                {(['THB', 'USD'] as CurrencyType[]).map(c => (
                                    <button key={c} onClick={() => setCurrency(c)} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold transition-all", currency === c ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-muted-foreground hover:text-white")}>
                                        {c === 'THB' ? '฿' : '$'} {c}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md rounded-lg p-1 border border-white/5">
                                {(['1D', '1M', '1Y'] as TimeframeType[]).map(tf => (
                                    <button key={tf} onClick={() => setTimeframe(tf)} className={cn("px-3 py-1.5 rounded-md text-[10px] font-bold transition-all", timeframe === tf ? "bg-white/20 text-white shadow-sm" : "text-muted-foreground hover:text-white")}>
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-1 space-y-2">
                            <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wider flex items-center flex-wrap gap-2">
                                {currentAsset.label}
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[10px] px-1.5 rounded flex items-center gap-1 h-5", badgeColor)}>
                                        {(loading || chartLoading) && <Loader2 className="w-3 h-3 animate-spin" />}
                                        {!loading && !chartLoading && statusLabel}
                                    </span>
                                    {fetchError && !isClosed && (
                                        <button onClick={handleRefresh} className="text-[10px] text-blue-400 hover:text-blue-300 underline font-bold px-1 transition-colors">
                                            Try again
                                        </button>
                                    )}
                                    <button
                                        onClick={handleRefresh}
                                        disabled={loading || chartLoading}
                                        className="p-1 hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
                                        title="Refresh Data"
                                    >
                                        <RefreshCcw className={cn("w-3.5 h-3.5", (loading || chartLoading) && "animate-spin")} />
                                    </button>
                                </div>
                                {lastUpdated && (
                                    <span className="text-[10px] text-muted-foreground/50 lowercase">
                                        updated {lastUpdated.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                )}
                            </h2>
                            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tighter">
                                <AnimatePresence mode="wait">
                                    <motion.div key={currency + activeAsset + current} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                                        {activeAsset === 'currency' ? '' : (currency === 'THB' ? '฿' : '$')}
                                        {current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border", isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    {Math.abs(percent).toLocaleString(undefined, { minimumFractionDigits: 2 })}%
                                </div>
                                <span className="text-xs text-muted-foreground">{unit}</span>
                            </div>
                        </div>

                        <div className="md:col-span-3 h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={currentAsset.stroke} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={currentAsset.stroke} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} dy={10} />
                                    <YAxis domain={['auto', 'auto']} hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                                        itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                                        formatter={(value: any) => [
                                            `${currency === 'THB' && activeAsset !== 'currency' ? '฿' : '$'}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                            activeAsset === 'currency' ? 'Rate' : 'Price'
                                        ]}
                                    />
                                    <Area type="monotone" dataKey="value" stroke={currentAsset.stroke} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" animationDuration={1000} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
