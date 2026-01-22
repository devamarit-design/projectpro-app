import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

// PDF generation using Puppeteer - renders actual preview page for pixel-perfect output
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { url, filename = 'document.pdf' } = body

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
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

        // Set viewport to A4 size at high DPI
        await page.setViewport({
            width: 794, // A4 width at 96 DPI
            height: 1123, // A4 height at 96 DPI
            deviceScaleFactor: 2 // High quality
        })

        // Navigate to the preview page with print mode (hides toolbars)
        const printUrl = url.includes('?') ? `${url}&print=true` : `${url}?print=true`

        await page.goto(printUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        })

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
        console.error('PDF generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: String(error) },
            { status: 500 }
        )
    }
}

// Support GET for simple testing
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')
    const filename = request.nextUrl.searchParams.get('filename') || 'document.pdf'

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Create a mock request body and call POST
    const mockRequest = new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ url, filename }),
        headers: { 'Content-Type': 'application/json' }
    })

    return POST(mockRequest)
}

