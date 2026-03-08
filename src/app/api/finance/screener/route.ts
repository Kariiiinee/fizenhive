import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

import { REGION_UNIVERSES } from '@/lib/constants';

// News Keywords from Python Analytic logic
const NEGATIVE_KEYWORDS = [
    "fraud", "investigation", "probe", "bankruptcy", "default",
    "liquidity crisis", "restatement", "accounting issue",
    "lawsuit", "regulatory action", "downgrade"
];

const POSITIVE_KEYWORDS = [
    "buyback", "spinoff", "asset sale", "restructuring",
    "turnaround", "earnings beat", "debt reduction",
    "dividend increase", "guidance raise"
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawRegionName = searchParams.get('region') || 'US';
    const regionName = rawRegionName.split(' (')[0]; // Strip the ticker count like " (82)" from the frontend payload
    const filterName = searchParams.get('filter') || 'Day Gainers'; // Replaces the old category
    const sectorFilter = searchParams.get('sector') || 'All Sectors';

    const tickers = REGION_UNIVERSES[regionName] || REGION_UNIVERSES["US"];

    try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 10); // Fetch roughly 7 trading days for sparklines

        // Fetch data for all tickers in the selected region universe in parallel
        const rawResults = await Promise.all(tickers.map(async (sym) => {
            try {
                // We fetch historical data (for sparkline) and quoteSummary (for all key stats + sector)
                const [history, qs, newsSearch] = await Promise.all([
                    yf.historical(sym, { period1: start, period2: end, interval: '1d' }, { validateResult: false }).catch((err: any) => err.result || []),
                    yf.quoteSummary(sym, { modules: ['price', 'assetProfile', 'defaultKeyStatistics', 'financialData', 'summaryDetail'] }, { validateResult: false }).catch((err: any) => err.result || null),
                    yf.search(sym, { newsCount: 10 }, { validateResult: false }).catch((err: any) => err.result || { news: [] })
                ]);

                if (!qs || !qs.price) return null;

                // Create realistic sparkline (0-100 scale for UI styling)
                const historicalData = history as any[];
                let spark = [50, 50, 50, 50, 50]; // fallback
                if (historicalData.length > 0) {
                    const closes = historicalData.map((h: any) => h.close);
                    if (closes.length > 0) {
                        const min = Math.min(...closes);
                        const max = Math.max(...closes);
                        spark = closes.map((c: any) => max === min ? 50 : ((c - min) / (max - min)) * 100);
                    }
                }

                const calculateNewsScore = (newsItems: any[]) => {
                    let score = 0;
                    if (!newsItems) return 0;

                    newsItems.forEach(item => {
                        const title = (item.title || "").toLowerCase();
                        NEGATIVE_KEYWORDS.forEach((kw: string) => {
                            if (title.includes(kw)) score -= 3;
                        });
                        POSITIVE_KEYWORDS.forEach((kw: string) => {
                            if (title.includes(kw)) score += 3;
                        });
                    });

                    // Clamp to [-20, 20] as per Python logic
                    return Math.max(-20, Math.min(20, score));
                };

                const calculateScores = (qs: any, newsScore: number) => {
                    let safety = 0;
                    let mispricing = 0;

                    // Safety (0-40)
                    const de = qs?.financialData?.debtToEquity;
                    if (de !== undefined) {
                        if (de < 50) safety += 15;
                        else if (de < 100) safety += 10;
                        else if (de < 200) safety += 5;
                    }

                    const cr = qs?.financialData?.currentRatio;
                    if (cr !== undefined) {
                        if (cr > 2.0) safety += 15;
                        else if (cr > 1.5) safety += 10;
                        else if (cr > 1.0) safety += 5;
                    }

                    const fcf = qs?.financialData?.freeCashflow;
                    if (fcf && fcf > 0) safety += 10;

                    // Mispricing (0-40)
                    const pe = qs?.summaryDetail?.trailingPE || qs?.summaryDetail?.forwardPE;
                    if (pe !== undefined) {
                        if (pe < 15) mispricing += 15;
                        else if (pe < 25) mispricing += 10;
                        else if (pe < 35) mispricing += 5;
                    }

                    const curr = qs?.price?.regularMarketPrice;
                    const target = qs?.financialData?.targetMeanPrice;
                    if (curr && target) {
                        const upside = (target - curr) / curr;
                        if (upside > 0.3) mispricing += 15;
                        else if (upside > 0.15) mispricing += 10;
                        else if (upside > 0.05) mispricing += 5;
                    }

                    const roe = qs?.financialData?.returnOnEquity;
                    if (roe !== undefined) {
                        if (roe > 0.2) mispricing += 10;
                        else if (roe > 0.15) mispricing += 7;
                        else if (roe > 0.1) mispricing += 4;
                    }

                    return {
                        safety: Math.min(40, safety),
                        mispricing: Math.min(40, mispricing),
                        news: newsScore,
                        total: Math.max(0, Math.min(100, safety + mispricing + newsScore))
                    };
                };

                const newsScore = calculateNewsScore(newsSearch?.news || []);
                const scores = calculateScores(qs, newsScore);

                // Extract key stats safely
                const pe = qs?.summaryDetail?.trailingPE || qs?.summaryDetail?.forwardPE || null;
                const revenueGrowth = qs?.financialData?.revenueGrowth !== undefined ? qs.financialData.revenueGrowth * 100 : null;
                const profitMargin = qs?.financialData?.profitMargins !== undefined ? qs.financialData.profitMargins * 100 : null;
                const dividendYield = qs?.summaryDetail?.dividendYield !== undefined ? qs.summaryDetail.dividendYield * 100 : qs?.summaryDetail?.trailingAnnualDividendYield !== undefined ? qs.summaryDetail.trailingAnnualDividendYield * 100 : null;
                const debtToEquity = qs?.financialData?.debtToEquity || null;
                const marketCap = qs?.summaryDetail?.marketCap || qs?.price?.marketCap || null;
                const volume = qs?.summaryDetail?.volume || qs?.price?.regularMarketVolume || null;

                const fiftyTwoWeekChange = qs?.defaultKeyStatistics?.['52WeekChange'] !== undefined
                    ? qs.defaultKeyStatistics['52WeekChange'] * 100
                    : null;

                return {
                    ticker: sym,
                    name: qs.price.shortName || qs.price.longName || sym,
                    price: qs.price.regularMarketPrice || 0,
                    change: (qs.price.regularMarketChangePercent || 0) * 100,
                    isPositive: (qs.price.regularMarketChangePercent || 0) >= 0,
                    sector: qs.assetProfile?.sector || 'Unknown',
                    spark: spark,
                    pe,
                    revenueGrowth,
                    profitMargin,
                    dividendYield,
                    debtToEquity,
                    marketCap,
                    volume,
                    fiftyTwoWeekChange,
                    scores,
                    metrics: {
                        debtToEquity: qs?.financialData?.debtToEquity,
                        currentRatio: qs?.financialData?.currentRatio,
                        freeCashflow: qs?.financialData?.freeCashflow,
                        pe: pe,
                        targetMeanPrice: qs?.financialData?.targetMeanPrice,
                        returnOnEquity: qs?.financialData?.returnOnEquity,
                        revenueGrowth: qs?.financialData?.revenueGrowth,
                        profitMargins: qs?.financialData?.profitMargins
                    }
                };
            } catch (err) {
                console.error(`Error fetching data for ${sym}`, err);
                return null;
            }
        }));

        // Filter out failed API calls
        let validResults = rawResults.filter(r => r !== null) as NonNullable<typeof rawResults[0]>[];

        // ----------------------------------------------------
        // Secondary Filter: Sector
        // ----------------------------------------------------
        if (sectorFilter !== 'All Sectors') {
            validResults = validResults.filter(r => r.sector === sectorFilter);
        }

        // ----------------------------------------------------
        // Primary Sort
        // ----------------------------------------------------
        switch (filterName) {
            case "Day Gainers":
                validResults.sort((a, b) => b.change - a.change);
                break;
            case "Day Losers":
                validResults.sort((a, b) => a.change - b.change);
                break;
            case "Most Active":
                validResults.sort((a, b) => (b.volume || 0) - (a.volume || 0));
                break;
            case "Highest Dividend":
                validResults.sort((a, b) => (b.dividendYield || 0) - (a.dividendYield || 0));
                break;
            case "Highest Revenue Growth":
                validResults.sort((a, b) => (b.revenueGrowth || -9999) - (a.revenueGrowth || -9999));
                break;
            case "Highest Profit Margin":
                validResults.sort((a, b) => (b.profitMargin || -9999) - (a.profitMargin || -9999));
                break;
            case "52-Week Low Gainers":
                validResults.sort((a, b) => (a.fiftyTwoWeekChange || 9999) - (b.fiftyTwoWeekChange || 9999));
                break;
            case "Lowest P/E Ratio":
                validResults.sort((a, b) => {
                    if (a.pe === null && b.pe === null) return 0;
                    if (a.pe === null) return 1; // push nulls to back
                    if (b.pe === null) return -1;
                    return a.pe - b.pe;
                });
                break;
            case "Largest Market Cap":
                validResults.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
                break;
            case "52-Week High Gainers":
                validResults.sort((a, b) => (b.fiftyTwoWeekChange || -9999) - (a.fiftyTwoWeekChange || -9999));
                break;
            default:
                validResults.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
                break;
        }

        // Return all valid results to allow client-side pagination
        return NextResponse.json(validResults);

    } catch (error) {
        console.error("Error generating custom screener:", error);
        return NextResponse.json({ error: "Failed to generate screener" }, { status: 500 });
    }
}
