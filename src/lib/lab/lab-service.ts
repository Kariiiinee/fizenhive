import YahooFinance from 'yahoo-finance2';
import { SmallCapEngine, SmallCapResult } from './engines/small-cap-engine';
import { RelativeRankingEngine, RankedStock, RankableStock } from './engines/relative-ranking-engine';
import { CuriosityRadar, CuriosityStock, CuriosityLists } from './engines/curiosity-radar';
import { ScoreDeltaEngine, DeltaResult } from './engines/delta-engine';
import { createClient } from '@/lib/supabase/server';

const yf = new (YahooFinance as any)();

export interface LabDiscoveryOutput {
    smallCaps: (SmallCapResult & { price?: number, changePercent?: number, pe?: number, industry?: string })[];
    rankings: (RankedStock & { price?: number, changePercent?: number, pe?: number, industry?: string })[];
    radar: CuriosityLists;
    deltas: (DeltaResult & { price?: number, changePercent?: number, pe?: number, industry?: string })[];
    country: string;
    timestamp: string;
}

export class LabService {
    private smallCapEngine = new SmallCapEngine();
    private rankingEngine = new RelativeRankingEngine();
    private radar = new CuriosityRadar();
    private deltaEngine = new ScoreDeltaEngine();

    async runDiscovery(country: string, tickers: string[]): Promise<LabDiscoveryOutput> {
        // threshold map ($1B US equivalent)
        const thresholdMap: Record<string, number> = {
            'US': 1000000000,
            'France': 950000000,
            'Germany': 950000000,
            'China': 7800000000,
            'Hong Kong': 7800000000,
            'Japan': 150000000000,
            'Singapore': 1350000000
        };

        const currentThreshold = thresholdMap[country] || 1000000000;
        const iterativeSmallCapEngine = new SmallCapEngine(currentThreshold);

        const results = await Promise.all(tickers.map(async (ticker) => {
            try {
                // Fetch full quote summary for engines
                let qs: any;
                try {
                    qs = await yf.quoteSummary(ticker, {
                        modules: ['price', 'financialData', 'defaultKeyStatistics', 'summaryDetail', 'assetProfile', 'incomeStatementHistory', 'cashflowStatementHistory', 'netSharePurchaseActivity' as any]
                    }, { validateResult: false });
                } catch (error: any) {
                    qs = error.result || null;
                }

                if (!qs) return null;

                // Extra data for engines
                let history6m: any = [];
                try {
                    history6m = await yf.historical(ticker, {
                        period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
                        period2: new Date(),
                        interval: '1d'
                    }, { validateResult: false });
                } catch (error: any) {
                    history6m = error.result || [];
                }

                let priceChange6m = null;
                if (history6m.length >= 2) {
                    const latest = (history6m[history6m.length - 1] as any).close;
                    const start = (history6m[0] as any).close;
                    priceChange6m = ((latest - start) / start) * 100;
                }

                const dailyVol = qs.price?.regularMarketVolume || 0;
                const avgVol = qs.summaryDetail?.averageVolume || 1;
                const volumeSurge = dailyVol / avgVol;

                const displayMetrics = {
                    price: qs.price?.regularMarketPrice || undefined,
                    changePercent: qs.price?.regularMarketChangePercent ? qs.price.regularMarketChangePercent * 100 : undefined,
                    pe: qs.summaryDetail?.trailingPE || qs.summaryDetail?.forwardPE || undefined,
                    industry: qs.assetProfile?.industry || undefined
                };

                return { ticker, qs, extra: { priceChange6m, volumeSurge, ...displayMetrics } };
            } catch (err) {
                console.error(`LabService: Error fetching ${ticker}`, err);
                return null;
            }
        }));

        const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);

        // 1. Run Small Cap Engine
        const smallCaps: SmallCapResult[] = [];
        for (const r of validResults) {
            const sc = await iterativeSmallCapEngine.evaluate(r.ticker, r.qs);
            if (sc) {
                smallCaps.push({
                    ...sc,
                    price: r.extra.price,
                    changePercent: r.extra.changePercent,
                    pe: r.extra.pe,
                    industry: r.extra.industry
                } as any);
            }
        }

        // Assign ranks to small caps
        smallCaps.sort((a, b) => b.score - a.score);
        smallCaps.forEach((sc, idx) => {
            sc.rank = idx + 1;
        });

        // 2. Prepare data for Ranking and Radar
        const rankable: RankableStock[] = validResults.map(r => ({
            ticker: r.ticker,
            name: r.qs.price?.shortName || r.ticker,
            metrics: {
                evToEbitda: r.qs.defaultKeyStatistics?.enterpriseToEbitda || null,
                pe: r.qs.summaryDetail?.trailingPE || r.qs.summaryDetail?.forwardPE || null,
                fcfYield: r.qs.financialData?.freeCashflow && r.qs.summaryDetail?.marketCap ? r.qs.financialData.freeCashflow / r.qs.summaryDetail.marketCap : null,
                revGrowth: r.qs.financialData?.revenueGrowth || null,
                roic: r.qs.financialData?.returnOnAssets || null,
                debtToEquity: r.qs.financialData?.debtToEquity || null
            }
        }));

        const curiosityData: CuriosityStock[] = validResults.map(r => ({
            ticker: r.ticker,
            name: r.qs.price?.shortName || r.ticker,
            metrics: {
                evToEbitda: r.qs.defaultKeyStatistics?.enterpriseToEbitda || null,
                fcfYield: r.qs.financialData?.freeCashflow && r.qs.summaryDetail?.marketCap ? r.qs.financialData.freeCashflow / r.qs.summaryDetail.marketCap : null,
                revGrowth: r.qs.financialData?.revenueGrowth || null,
                priceChange6m: r.extra.priceChange6m,
                volumeSurge: r.extra.volumeSurge,
                marketCap: r.qs.summaryDetail?.marketCap || r.qs.price?.marketCap || 0,
                insiderBuying: (r.qs as any).netSharePurchaseActivity?.netInfoShares || null,
                price: r.extra.price,
                changePercent: r.extra.changePercent,
                pe: r.extra.pe,
                industry: r.extra.industry
            }
        }));

        // 3. Execution
        const rankings = this.rankingEngine.compute(rankable).map(rank => {
            const orig = validResults.find(r => r.ticker === rank.ticker);
            return {
                ...rank,
                price: orig?.extra.price,
                changePercent: orig?.extra.changePercent,
                pe: orig?.extra.pe,
                industry: orig?.extra.industry
            };
        });
        const radar = this.radar.analyze(curiosityData);

        // 4. Persistence & Deltas (Supabase)
        const deltas: DeltaResult[] = [];
        const supabase = await createClient();

        // For each stock, save results and check for previous
        for (const ranking of rankings) {
            const currentMetrics = rankable.find(r => r.ticker === ranking.ticker);
            if (currentMetrics) {
                // Fetch previous result from DB
                const { data: prevData } = await supabase
                    .from('lab_engine_results')
                    .select('score, metrics_json')
                    .eq('ticker', ranking.ticker)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (prevData) {
                    const prevMetrics = (prevData.metrics_json as any);
                    const delta = this.deltaEngine.computeDelta(
                        {
                            score: ranking.compositeScore,
                            revGrowth: currentMetrics.metrics.revGrowth || 0,
                            opMargin: 0, // Need to extract from QS if wanted
                            debt: currentMetrics.metrics.debtToEquity || 0,
                            fcf: currentMetrics.metrics.fcfYield || 0
                        },
                        {
                            score: prevData.score,
                            revGrowth: prevMetrics.revGrowth || 0,
                            opMargin: prevMetrics.opMargin || 0,
                            debt: prevMetrics.debt || 0,
                            fcf: prevMetrics.fcf || 0
                        }
                    );
                    delta.ticker = ranking.ticker;
                    delta.name = ranking.name;
                    (delta as any).price = ranking.price;
                    (delta as any).changePercent = ranking.changePercent;
                    (delta as any).pe = ranking.pe;
                    (delta as any).industry = ranking.industry;
                    deltas.push(delta);
                }

                // Save current result
                await supabase.from('lab_engine_results').insert({
                    ticker: ranking.ticker,
                    engine_name: 'relative_ranking',
                    score: ranking.compositeScore,
                    metrics_json: {
                        revGrowth: currentMetrics.metrics.revGrowth,
                        debt: currentMetrics.metrics.debtToEquity,
                        fcf: currentMetrics.metrics.fcfYield,
                        factors: ranking.factors
                    }
                });
            }
        }

        return {
            smallCaps: smallCaps.sort((a, b) => b.score - a.score),
            rankings,
            radar,
            deltas: deltas.sort((a, b) => b.scoreDelta - a.scoreDelta),
            country,
            timestamp: new Date().toISOString()
        };
    }
}
