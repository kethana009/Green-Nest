import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const imageUrl = searchParams.get('url')

        if (!imageUrl) {
            return new NextResponse('Missing url parameter', { status: 400 })
        }

        // Derive origin of the remote image to use as Referer (bypasses hotlink protection)
        let referer = imageUrl
        try {
            const parsed = new URL(imageUrl)
            referer = parsed.origin + '/'
        } catch (_) {}

        // Fetch the image from the remote server, pretending to be a browser
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': referer,
            }
        })

        if (!response.ok) {
            return new NextResponse(`Failed to fetch remote image: ${response.statusText}`, { status: response.status })
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg'
        const arrayBuffer = await response.arrayBuffer()

        return new NextResponse(Buffer.from(arrayBuffer), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400'
            }
        })
    } catch (error: any) {
        console.error('Image proxy error:', error)
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
    }
}
