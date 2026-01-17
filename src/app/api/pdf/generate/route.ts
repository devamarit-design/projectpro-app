import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'

// PDF generation using Puppeteer - supports Thai fonts
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { html, filename = 'document.pdf' } = body

        if (!html) {
            return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
        }

        // Get Chrome executable path based on platform
        let executablePath: string
        if (process.platform === 'darwin') {
            executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        } else if (process.platform === 'win32') {
            executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        } else {
            executablePath = '/usr/bin/chromium-browser'
        }

        // Configure browser
        const browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })

        const page = await browser.newPage()

        // Inject Thai font CSS with proper loading
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
                    * { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif !important; }
                    body { margin: 0; padding: 20px; }
                    @page { margin: 0; }
                </style>
            </head>
            <body>
                ${html}
            </body>
            </html>
        `

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' })

        // Wait for fonts to load
        await page.evaluateHandle('document.fonts.ready')

        // Additional wait to ensure fonts are rendered
        await new Promise(resolve => setTimeout(resolve, 1000))

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        })

        await browser.close()

        // URL-encode the filename to handle Thai characters
        const safeFilename = encodeURIComponent(filename)

        // Return PDF as response
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename*=UTF-8''${safeFilename}`,
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
