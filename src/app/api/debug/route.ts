import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    return NextResponse.json({
        gemini_key_present: !!key,
        gemini_key_length: key ? key.length : 0,
        gemini_key_prefix: key ? key.substring(0, 8) + '...' : 'MISSING',
        node_env: process.env.NODE_ENV,
    });
}
