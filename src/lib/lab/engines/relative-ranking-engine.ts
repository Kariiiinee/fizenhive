export interface RankableStock {
    ticker: string;
    name: string;
    metrics: {
        evToEbitda: number | null;
        pe: number | null;
        fcfYield: number | null;
        revGrowth: number | null;
        roic: number | null;
        debtToEquity: number | null;
    };
}

export interface RankedStock {
    ticker: string;
    name: string;
    factors: {
        value: number;
        quality: number;
        growth: number;
        safety: number;
    };
    compositeScore: number;
    isTopDecile: boolean;
}

export class RelativeRankingEngine {
    compute(stocks: RankableStock[]): RankedStock[] {
        if (stocks.length === 0) return [];

        const extract = (key: keyof RankableStock['metrics']) =>
            stocks.map(s => s.metrics[key]).filter((v): v is number => v !== null && !isNaN(v));

        const getPercentile = (value: number | null, distribution: number[], inverse: boolean = false) => {
            if (value === null || isNaN(value)) return 0;
            const sorted = [...distribution].sort((a, b) => a - b);
            const count = sorted.filter(v => inverse ? v >= value : v <= value).length;
            return (count / sorted.length) * 100;
        };

        // Distributions per metric
        const dists = {
            evToEbitda: extract('evToEbitda'),
            pe: extract('pe'),
            fcfYield: extract('fcfYield'),
            revGrowth: extract('revGrowth'),
            roic: extract('roic'),
            debtToEquity: extract('debtToEquity'),
        };

        const results: RankedStock[] = stocks.map(stock => {
            const m = stock.metrics;

            // Value Factor (Lower EV/EBITDA, Lower P/E, Higher FCF Yield)
            const v1 = getPercentile(m.evToEbitda, dists.evToEbitda, true); // true = lower is better (higher rank)
            const v2 = getPercentile(m.pe, dists.pe, true);
            const v3 = getPercentile(m.fcfYield, dists.fcfYield);
            const valueFactor = (v1 + v2 + v3) / 3;

            // Quality (Higher ROIC)
            const qualityFactor = getPercentile(m.roic, dists.roic);

            // Growth (Higher Revenue Growth)
            const growthFactor = getPercentile(m.revGrowth, dists.revGrowth);

            // Safety (Lower Debt/Equity)
            const safetyFactor = getPercentile(m.debtToEquity, dists.debtToEquity, true);

            const composite = (valueFactor + qualityFactor + growthFactor + safetyFactor) / 4;

            return {
                ticker: stock.ticker,
                name: stock.name,
                factors: {
                    value: Math.round(valueFactor),
                    quality: Math.round(qualityFactor),
                    growth: Math.round(growthFactor),
                    safety: Math.round(safetyFactor)
                },
                compositeScore: Math.round(composite),
                isTopDecile: false // Will set after sorting
            };
        });

        // Set Top Decile Flag
        results.sort((a, b) => b.compositeScore - a.compositeScore);
        const topCount = Math.ceil(results.length * 0.1);
        results.forEach((s, idx) => {
            if (idx < topCount) s.isTopDecile = true;
        });

        return results;
    }
}
