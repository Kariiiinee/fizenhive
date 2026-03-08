import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Fetch quote data from Yahoo Finance
        let quote: any;
        try {
            quote = await yf.quote(symbol, {}, { validateResult: false });
        } catch (error: any) {
            if (error.result) {
                console.warn('Quote validation failed but partial results available');
                quote = error.result;
            } else {
                throw error;
            }
        }

        // Fetch quote summary for additional stats
        let summary: any = {};
        try {
            summary = await yf.quoteSummary(symbol, {
                modules: ['financialData', 'summaryDetail', 'defaultKeyStatistics']
            }, { validateResult: false });
        } catch (error: any) {
            if (error.result) {
                console.warn('Summary validation failed but partial results available');
                summary = error.result;
            } else {
                console.warn("Could not fetch quote summary for", symbol);
            }
        }

        return NextResponse.json({ ...quote, summary }, {
            headers: { 'X-Fizen-Debug': 'resilient-v2-deployed' }
        });
    } catch (error: any) {
        console.error('CRITICAL FINANCE ERROR:', {
            symbol,
            message: error.message,
            name: error.name,
            resultAvailable: !!error.result
        });

        return NextResponse.json(
            {
                error: error.message || 'Failed to fetch financial data',
                debug: 'resilient-v2-catch-active'
            },
            {
                status: 500,
                headers: { 'X-Fizen-Debug': 'resilient-v2-error' }
            }
        );
    }
}
