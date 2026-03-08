import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    try {
        let results;
        try {
            results = await yf.search(query, {
                newsCount: 0,
                quotesCount: 5
            }, { validateResult: false });
        } catch (error: any) {
            // Fallback for validation errors - use partial result if available
            if (error.result) {
                console.warn('Search validation failed but partial results available');
                results = error.result;
            } else {
                throw error;
            }
        }

        const quotes = results?.quotes || [];
        const equityQuotes = quotes
            .filter((q: any) => !!q.symbol && (q.shortName || q.longName || q.shortname || q.longname))
            .map((q: any) => ({
                ...q,
                // Normalize keys for frontend compatibility
                shortname: q.shortName || q.shortname || q.longName || q.longname || '',
                longname: q.longName || q.longname || q.shortName || q.shortname || ''
            }));

        return NextResponse.json(equityQuotes.slice(0, 5), {
            headers: { 'X-Fizen-Debug': 'resilient-v2-deployed' }
        });
    } catch (error: any) {
        console.error('CRITICAL SEARCH ERROR:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            resultAvailable: !!error.result
        });

        return NextResponse.json(
            {
                error: error.message || 'Failed to fetch search data',
                debug: 'resilient-v2-catch-active',
                errorName: error.name
            },
            {
                status: 500,
                headers: { 'X-Fizen-Debug': 'resilient-v2-error' }
            }
        );
    }
}
