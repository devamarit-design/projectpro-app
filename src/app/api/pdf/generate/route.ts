import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { authErrorResponse, requireAuthenticatedUser } from '@/lib/api-auth'

// PDF generation using Puppeteer - renders actual preview page for pixel-perfect output
export async function POST(request: NextRequest) {
    try {
        await requireAuthenticatedUser(request)
        const body = await request.json()
        const { url, html, filename = 'document.pdf' } = body
        let safeUrl: string | undefined

        if (!url && !html) {
            return NextResponse.json({ error: 'URL or HTML is required' }, { status: 400 })
        }

        if (url) {
            const target = new URL(url, request.nextUrl.origin)
            if (target.origin !== request.nextUrl.origin) {
                return NextResponse.json({ error: 'Only same-origin preview URLs are allowed' }, { status: 400 })
            }
            safeUrl = target.toString()
        }

        // Launch Puppeteer with full Chrome
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--font-render-hinting=none', // Better font rendering
            ]
        })

        const page = await browser.newPage()

        const allowedHosts = new Set([
            request.nextUrl.hostname,
            'firebasestorage.googleapis.com',
            'storage.googleapis.com',
            'projectpro-app-76535.firebasestorage.app',
            'fonts.googleapis.com',
            'fonts.gstatic.com',
        ])
        await page.setRequestInterception(true)
        page.on('request', interceptedRequest => {
            try {
                const resourceUrl = new URL(interceptedRequest.url())
                if (['data:', 'blob:', 'about:'].includes(resourceUrl.protocol)) {
                    void interceptedRequest.continue()
                    return
                }
                if (resourceUrl.protocol === 'https:' && allowedHosts.has(resourceUrl.hostname.toLowerCase())) {
                    void interceptedRequest.continue()
                    return
                }
                if (resourceUrl.origin === request.nextUrl.origin) {
                    void interceptedRequest.continue()
                    return
                }
            } catch {
                // Invalid resource URLs are blocked below.
            }
            void interceptedRequest.abort('blockedbyclient')
        })

        // Set viewport to A4 size at high DPI
        await page.setViewport({
            width: 794, // A4 width at 96 DPI
            height: 1123, // A4 height at 96 DPI
            deviceScaleFactor: 2 // High quality
        })

        if (safeUrl) {
            // Navigate to the preview page with print mode (hides toolbars)
            const printUrl = safeUrl.includes('?') ? `${safeUrl}&print=true` : `${safeUrl}?print=true`

            await page.goto(printUrl, {
                waitUntil: 'networkidle0',
                timeout: 30000
            })
        } else if (html) {
            await page.setContent(html, {
                waitUntil: 'networkidle0',
                timeout: 30000
            })
        }

        // Wait for content to be ready
        try {
            await page.waitForSelector('#preview-content', { timeout: 10000 })
        } catch {
            // Fallback if selector not found
            await new Promise(r => setTimeout(r, 2000))
        }

        // Wait for all images to load
        await page.evaluate(() => {
            return Promise.all(
                Array.from(document.images)
                    .filter(img => !img.complete)
                    .map(img => new Promise(resolve => {
                        img.onload = img.onerror = resolve
                    }))
            )
        })

        // Wait for fonts to load
        await page.evaluateHandle('document.fonts.ready')

        // Small delay for any animations to complete
        await new Promise(r => setTimeout(r, 500))

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: true
        })

        await browser.close()

        // URL-encode the filename to handle Thai characters
        const safeFilename = encodeURIComponent(filename)

        // Return PDF as response
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename*=UTF-8''${safeFilename}`,
                'Content-Length': pdfBuffer.length.toString()
            },
        })

    } catch (error) {
        const authResponse = authErrorResponse(error)
        if (authResponse) return authResponse
        console.error('PDF generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: String(error) },
            { status: 500 }
        )
    }
}

// Support GET for simple testing
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, {
        status: 405,
        headers: { Allow: 'POST' },
    })
}
