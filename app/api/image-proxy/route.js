import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
        }

        // امنعي أي دومين مش تبعك
        if (!imageUrl.startsWith('https://api.lajolie-eg.com/')) {
            return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
        }

        const response = await fetch(imageUrl);

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch image: ${response.status}` }, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
            return NextResponse.json({ error: `Invalid content type: ${contentType}` }, { status: 400 });
        }

        const imageBuffer = await response.arrayBuffer();

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Proxy error', details: error.message }, { status: 500 });
    }
}
