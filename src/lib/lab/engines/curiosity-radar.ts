export interface CuriosityStock {
    ticker: string;
    name: string;
    metrics: {
        evToEbitda: number | null;
        fcfYield: number | null;
        revGrowth: number | null;
        priceChange6m: number | null;
        volumeSurge: number | null; // e.g., ratio of daily to avg volume
        insiderBuying: number | null; // net shares purchased by insiders
        marketCap: number;
    };
}

export interface CuriosityLists {
    cheapestEV: CuriosityStock[];
    highestFCF: CuriosityStock[];
    fastestGrowthSmallCap: CuriosityStock[];
    underperformers: CuriosityStock[];
    volumeSpikes: CuriosityStock[];
    insiderBuying: CuriosityStock[];
}

export class CuriosityRadar {
    analyze(stocks: CuriosityStock[]): CuriosityLists {
        const filterVal = (items: CuriosityStock[], fn: (s: CuriosityStock) => number | null, limit: number = 10, reverse: boolean = false) => {
            return [...items]
                .filter(s => fn(s) !== null && !isNaN(fn(s)!))
                .sort((a, b) => {
                    const va = fn(a)!;
                    const vb = fn(b)!;
                    return reverse ? va - vb : vb - va;
                })
                .slice(0, limit);
        };

        return {
            cheapestEV: filterVal(stocks, s => s.metrics.evToEbitda, 10, true), // Low is cheap
            highestFCF: filterVal(stocks, s => s.metrics.fcfYield, 10), // High is better
            fastestGrowthSmallCap: filterVal(
                stocks.filter(s => s.metrics.marketCap < 1000000000),
                s => s.metrics.revGrowth,
                10
            ),
            underperformers: filterVal(stocks, s => s.metrics.priceChange6m, 10, true), // Low is underperformer
            volumeSpikes: filterVal(stocks, s => s.metrics.volumeSurge, 10),
            insiderBuying: filterVal(stocks, s => s.metrics.insiderBuying, 10)
        };
    }
}
