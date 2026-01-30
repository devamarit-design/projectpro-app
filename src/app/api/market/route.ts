import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'latest' or 'history'
    const id = searchParams.get('id'); // coin id or category
    const days = searchParams.get('days');
    const interval = searchParams.get('interval');

    if (!type) {
        return new NextResponse('Missing type parameter', { status: 400 });
    }

    let url = '';
    if (type === 'gold-latest') {
        url = 'https://api.chnwt.dev/thai-gold-api/latest';
    } else if (type === 'btc-latest') {
        url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=thb,usd&include_24hr_change=true';
    } else if (type === 'history' && id) {
        if (id === 'bitcoin') {
            url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${days === '1' ? '1h' : (days === '30' ? '1d' : '1w')}&limit=${days === '1' ? '24' : (days === '30' ? '30' : '52')}`;
        } else if (id === 'pax-gold') {
            url = `https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${days === '1' ? '1h' : (days === '30' ? '1d' : '1w')}&limit=${days === '1' ? '24' : (days === '30' ? '30' : '52')}`;
        } else {
            url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days || '30'}&interval=${interval || 'daily'}`;
        }
    }

    if (!url) {
        return new NextResponse('Invalid parameters', { status: 400 });
    }

    // Check cache
    const cacheKey = url;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch from third-party: ${response.statusText}`, { status: response.status });
        }

        const data = await response.json();

        // If it's binance data, transform it to CoinGecko-like format for the component
        let transformedData = data;
        if (url.includes('binance.com')) {
            transformedData = {
                prices: data.map((d: any) => [d[0], parseFloat(d[4])]) // [timestamp, closePrice]
            };
        }

        // Update cache
        cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });

        return NextResponse.json(transformedData);
    } catch (error) {
        console.error('Market Proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
