import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
