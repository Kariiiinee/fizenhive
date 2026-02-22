import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Fetch quote data from Yahoo Finance
        const quote = await yahooFinance.quote(symbol);

        // Fetch quote summary for additional stats
        let summary: any = {};
        try {
            summary = await yahooFinance.quoteSummary(symbol, {
                modules: ['financialData', 'summaryDetail', 'defaultKeyStatistics']
            });
        } catch (e) {
            console.warn("Could not fetch quote summary for", symbol);
        }

        return NextResponse.json({ ...quote, summary });
    } catch (error) {
        console.error('Error fetching financial data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch financial data' },
            { status: 500 }
        );
    }
}
