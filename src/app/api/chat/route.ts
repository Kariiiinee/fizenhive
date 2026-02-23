import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
import yahooFinance from 'yahoo-finance2';


// Helper to fetch live data if a ticker is detected
async function fetchTickerContext(query: string) {
    try {
        // Simple heuristic: look for 1-5 letter all-cap words in the query
        const words = query.replace(/[^\w\s]/gi, '').split(/\s+/);
        const possibleTickers = words.filter(w => w.length >= 1 && w.length <= 5 && w === w.toUpperCase() && !['A', 'I', 'IS', 'OF', 'THE', 'AND', 'ETF'].includes(w));

        let contextData = "";

        for (const ticker of possibleTickers.slice(0, 2)) { // max 2 tickers to prevent slow fetching
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const quote = await yahooFinance.quote(ticker) as any;
                if (quote && quote.regularMarketPrice) {
                    contextData += `\nLatest data for ${ticker}: Price: $${quote.regularMarketPrice}, Market Cap: ${quote.marketCap}, PE: ${quote.trailingPE || 'N/A'}. `;
                    if (quote.quoteType === 'ETF') {
                        contextData += `This is an ETF. `;
                    } else {
                        contextData += `This is a company/stock. `;
                    }
                }
            } catch (e) { /* ignore invalid tickers */ }
        }
        return contextData;
    } catch (error) {
        return "";
    }
}

export async function POST(request: Request) {
    try {
        const { messages, language } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        // Get the latest user message to search for tickers
        const latestUserMsg = messages.filter(m => m.role === 'user').pop();
        let marketContext = "";
        if (latestUserMsg) {
            marketContext = await fetchTickerContext(latestUserMsg.content);
        }

        // Prepare the system prompt
        const systemPrompt = `Act as a professional, unbiased investment analyst providing educational information only. Evaluate this investment for an individual investor.

Investment: [NAME OF STOCK / ETF / CRYPTO / PROPERTY / FUND]

Provide your answer in this structure and keep response strictly between 500 to 700 words only:
1) Simple overview (what it is + why people invest in it)
2) Bull case (main reasons it could perform well)
3) Bear case & risks (valuation, macro, competition, liquidity, etc.)
4) Who this investment is suitable for (time horizon, risk level, portfolio role)
5) Short-term vs long-term outlook
6) Clear bottom-line verdict in plain English (not vague)

Keep it concise, practical, and decision-focused.  
If needed, ask me follow-up questions about my budget, timeline, location, or risk tolerance before concluding.


            `;
        // Initialize direct REST call to Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });

        // Build contents array: history + latest message (Gemini REST format)
        const contents = [
            ...messages.slice(0, -1).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            { role: 'user', parts: [{ text: latestUserMsg?.content || '' }] }
        ];

        // Ensure history starts with 'user'
        while (contents.length > 1 && contents[0].role !== 'user') {
            contents.shift();
        }

        const geminiRes = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                    contents,
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            throw new Error(`Gemini REST error ${geminiRes.status}: ${errText}`);
        }

        const geminiData = await geminiRes.json();
        const responseText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();

        return NextResponse.json({
            role: 'assistant',
            content: responseText
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat message' },
            { status: 500 }
        );
    }
}
