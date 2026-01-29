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

// --- Helper: Generate Mock Data (Fallback) ---
const generateMockData = (basePrice: number, volatility: number, count: number, labels: string[]) => {
    let current = basePrice
    return labels.map(label => {
        const change = (Math.random() - 0.5) * volatility
        current += change
        return { time: label, value: current }
    })
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
    const [prices, setPrices] = useState({
        gold: { thb: 43650, usd: 2650, change: 150 },
        btc: { thb: 3580000, usd: 104200, change: 2.5 },
        exchangeRate: 34.5
    })
    const [historyData, setHistoryData] = useState<Record<string, MarketDataPoint[]>>({})

    // --- Fetch Live Prices ---
    useEffect(() => {
        const fetchLive = async () => {
            try {
                const [goldRes, btcRes] = await Promise.all([
                    fetch('https://api.chnwt.dev/thai-gold-api/latest'),
                    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=thb,usd&include_24hr_change=true')
                ])
                if (goldRes.ok && btcRes.ok) {
                    const goldJson = await goldRes.json()
                    const btcJson = await btcRes.json()

                    if (goldJson?.response?.price && btcJson?.bitcoin) {
                        const goldSell = goldJson.response.price.gold_bar.sell
                        const btcThb = btcJson.bitcoin.thb
                        const btcUsd = btcJson.bitcoin.usd
                        const rate = btcThb / btcUsd

                        setPrices({
                            gold: {
                                thb: parseInt(goldSell.replace(/,/g, '')),
                                usd: (parseInt(goldSell.replace(/,/g, '')) / rate) / 0.49,
                                change: parseInt(goldJson.response.price.change.gold_bar || "0")
                            },
                            btc: {
                                thb: btcThb,
                                usd: btcUsd,
                                change: btcJson.bitcoin.usd_24h_change
                            },
                            exchangeRate: rate
                        })
                    }
                } else {
                    console.warn("Live prices fetch failed:", goldRes.status, btcRes.status)
                }
            } catch (error) {
                console.error("Live fetch error", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLive()
    }, [])

    // --- Fetch History for Charts ---
    useEffect(() => {
        const fetchHistory = async () => {
            const daysMap = { '1D': 1, '1M': 30, '1Y': 365 }
            const idMap = { 'btc': 'bitcoin', 'gold': 'pax-gold' }

            try {
                if (activeAsset === 'btc' || activeAsset === 'gold') {
                    setChartLoading(true)
                    const id = idMap[activeAsset]
                    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${daysMap[timeframe]}&interval=${timeframe === '1D' ? 'hourly' : 'daily'}`)
                    if (res.ok) {
                        const json = await res.json()
                        if (json && json.prices && Array.isArray(json.prices)) {
                            const labels = getLabels(timeframe, locale)
                            const points = json.prices.slice(-labels.length).map(([ts, val]: [number, number], i: number) => ({
                                time: labels[i] || '',
                                value: val
                            }))
                            setHistoryData(prev => ({ ...prev, [`${activeAsset}-${timeframe}`]: points }))
                        } else {
                            console.warn("CoinGecko history missing expected structure:", activeAsset, timeframe, json)
                        }
                    } else {
                        console.warn("CoinGecko history fetch failed:", res.status)
                    }
                }
            } catch (error) {
                console.error("History fetch error", error)
            } finally {
                setChartLoading(false)
            }
        }
        fetchHistory()
    }, [activeAsset, timeframe, locale])

    // --- Data Mapping ---
    const getData = () => {
        const isTHB = currency === 'THB'
        const rate = prices.exchangeRate
        const key = `${activeAsset}-${timeframe}`
        const apiData = historyData[key]
        const labels = getLabels(timeframe, locale)

        const getChartPoints = (base: number, vol: number) => {
            if (apiData && apiData.length > 0) {
                return apiData.map(p => ({
                    ...p,
                    value: isTHB ? p.value * rate * (activeAsset === 'gold' ? 0.49 : 1) : p.value
                }))
            }
            const volMult = timeframe === '1M' ? 5 : (timeframe === '1Y' ? 20 : 1)
            return generateMockData(base, vol * volMult, labels.length, labels)
        }

        switch (activeAsset) {
            case 'gold':
                const goldPrice = isTHB ? prices.gold.thb : (prices.gold.thb / rate) * 2.0403
                return {
                    current: goldPrice,
                    change: prices.gold.change,
                    percent: (prices.gold.change / prices.gold.thb) * 100,
                    unit: isTHB ? (locale === 'th' ? 'บาท (ทองคำแท่ง 96.5%)' : 'THB (Gold 96.5%)') : 'USD / Oz',
                    data: getChartPoints(goldPrice, isTHB ? 20 : 1)
                }
            case 'btc':
                return {
                    current: isTHB ? prices.btc.thb : prices.btc.usd,
                    change: prices.btc.usd * (prices.btc.change / 100),
                    percent: prices.btc.change,
                    unit: isTHB ? 'THB / BTC' : 'USD / BTC',
                    data: getChartPoints(isTHB ? prices.btc.thb : prices.btc.usd, isTHB ? 5000 : 200)
                }
            case 'nvidia':
                const nvda = 135.50
                return {
                    current: isTHB ? nvda * rate : nvda,
                    change: -1.5,
                    percent: -1.1,
                    unit: isTHB ? 'THB / Share' : 'USD / Share',
                    data: getChartPoints(isTHB ? nvda * rate : nvda, isTHB ? 10 : 0.5)
                }
            case 'currency':
                return {
                    current: rate,
                    change: 0.05,
                    percent: 0.15,
                    unit: 'THB / USD',
                    data: getChartPoints(rate, 0.02)
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
                            <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                                {currentAsset.label}
                                <span className={cn("text-[10px] px-1.5 rounded flex items-center gap-1", activeAsset === 'nvidia' ? "bg-yellow-500/10 text-yellow-500" : "bg-emerald-500/10 text-emerald-500")}>
                                    {(loading || chartLoading) && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {!loading && !chartLoading && (activeAsset === 'nvidia' ? 'DELAYED' : 'LIVE')}
                                </span>
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
