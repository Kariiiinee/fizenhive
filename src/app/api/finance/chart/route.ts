import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const range = searchParams.get('range') || '1mo'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, ALL

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Determine interval and start date based on range
        let interval: '1m' | '5m' | '15m' | '1d' | '1wk' | '1mo' = '1d';
        const startDate = new Date();

        if (range === '1d') {
            interval = '5m';
            startDate.setDate(startDate.getDate() - 1);
        } else if (range === '5d') {
            interval = '15m';
            startDate.setDate(startDate.getDate() - 5);
        } else if (range === '1mo') {
            interval = '1d';
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (range === '3mo') {
            interval = '1d';
            startDate.setMonth(startDate.getMonth() - 3);
        } else if (range === '6mo') {
            interval = '1wk';
            startDate.setMonth(startDate.getMonth() - 6);
        } else if (range === '1y') {
            interval = '1wk';
            startDate.setFullYear(startDate.getFullYear() - 1);
        } else {
            interval = '1mo';
            startDate.setFullYear(startDate.getFullYear() - 5); // Default to 5y for 'ALL'
        }

        const queryOptions = { period1: startDate.toISOString().split('T')[0], interval };
        const chart = await yahooFinance.chart(symbol, queryOptions as any);

        // Format data for Recharts
        const quotes: any[] = (chart?.quotes as any[]) || [];
        const chartData = quotes.map((quote: any) => ({
            date: quote.date ? new Date(quote.date).toISOString() : new Date().toISOString(),
            close: quote.close,
            high: quote.high,
            low: quote.low,
            open: quote.open,
            volume: quote.volume
        })).filter((q: any) => q.close !== null && q.close !== undefined); // Remove null entries

        return NextResponse.json(chartData);
    } catch (error: any) {
        console.error('Error fetching chart data:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch chart data' },
            { status: 500 }
        );
    }
}
