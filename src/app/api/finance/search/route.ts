import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    try {
        const results = await yahooFinance.search(query, {
            newsCount: 0,
            quotesCount: 5
        });

        const equityQuotes = results.quotes.filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');

        return NextResponse.json(equityQuotes.slice(0, 5));
    } catch (error: any) {
        console.error('Error fetching search data:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch search data' },
            { status: 500 }
        );
    }
}
