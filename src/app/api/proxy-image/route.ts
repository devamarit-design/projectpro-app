import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requireAuthenticatedUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        await requireAuthenticatedUser(req);
        const target = new URL(url);
        const allowedHosts = new Set([
            'firebasestorage.googleapis.com',
            'storage.googleapis.com',
            'projectpro-app-76535.firebasestorage.app',
        ]);

        if (target.protocol !== 'https:' || !allowedHosts.has(target.hostname.toLowerCase())) {
            return NextResponse.json({ error: 'Image host is not allowed' }, { status: 400 });
        }

        const response = await fetch(target, { redirect: 'error', signal: AbortSignal.timeout(10_000) });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('Content-Type') || '';
        if (!contentType.toLowerCase().startsWith('image/')) {
            return NextResponse.json({ error: 'Remote resource is not an image' }, { status: 415 });
        }
        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        const authResponse = authErrorResponse(error);
        if (authResponse) return authResponse;
        console.error('Proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
