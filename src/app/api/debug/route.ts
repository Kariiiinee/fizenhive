import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function GET() {
    const key = process.env.GEMINI_API_KEY;

    // First, report key metadata
    const keyInfo = {
        gemini_key_present: !!key,
        gemini_key_length: key ? key.length : 0,
        gemini_key_prefix: key ? key.substring(0, 8) + '...' : 'MISSING',
        all_related_keys: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('KEY')),
        node_env: process.env.NODE_ENV,
        gemini_test: 'not_run',
        gemini_error: null as string | null,
    };

    if (!key) {
        return NextResponse.json(keyInfo);
    }

    // Attempt a minimal Gemini API call
    try {
        const genAI = new GoogleGenAI({ apiKey: key });
        const result = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Say "OK" in one word.',
        });
        keyInfo.gemini_test = (result.text ?? '').trim();
    } catch (err: any) {
        keyInfo.gemini_test = 'FAILED';
        keyInfo.gemini_error = err?.message || String(err);
    }

    return NextResponse.json(keyInfo);
}
