import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requireAuthenticatedUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // In case the query was double-encoded or had unencoded &params (e.g. Firebase token)
    const rawUrl = req.url;
    const urlIdx = rawUrl.indexOf('url=');
    if (urlIdx !== -1) {
        const rawTarget = rawUrl.slice(urlIdx + 4);
        if (rawTarget.startsWith('http%3A') || rawTarget.startsWith('https%3A')) {
            try {
                url = decodeURIComponent(rawTarget);
            } catch {
                // Keep url as is
            }
        } else if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://')) {
            url = rawTarget;
        }
    }

    try {
        const target = new URL(url);
        const host = target.hostname.toLowerCase();
        const isAllowedHost = 
            host === 'firebasestorage.googleapis.com' ||
            host === 'storage.googleapis.com' ||
            host.endsWith('.firebasestorage.app') ||
            host.endsWith('.appspot.com') ||
            host === 'lh3.googleusercontent.com' ||
            host === 'images.unsplash.com';

        if (target.protocol !== 'https:' || !isAllowedHost) {
            // For non-whitelisted hosts, enforce strict authentication
            await requireAuthenticatedUser(req);
        }

        const response = await fetch(target.toString(), {
            redirect: 'follow',
            signal: AbortSignal.timeout(10_000)
        });

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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

