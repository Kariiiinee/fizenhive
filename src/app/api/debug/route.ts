import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function GET() {
    const key = process.env.GEMINI_API_KEY;

    // First, report key metadata
    const keyInfo = {
        gemini_key_present: !!key,
        gemini_key_length: key ? key.length : 0,
        gemini_key_prefix: key ? key.substring(0, 8) + '...' : 'MISSING',
        node_env: process.env.NODE_ENV,
        gemini_test: 'not_run',
        gemini_error: null as string | null,
    };

    if (!key) {
        return NextResponse.json(keyInfo);
    }

    // Attempt a minimal Gemini API call
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say "OK" in one word.');
        keyInfo.gemini_test = result.response.text().trim();
    } catch (err: any) {
        keyInfo.gemini_test = 'FAILED';
        keyInfo.gemini_error = err?.message || String(err);
    }

    return NextResponse.json(keyInfo);
}
