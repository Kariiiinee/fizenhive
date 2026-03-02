import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export interface SmallCapResult {
    ticker: string;
    name: string;
    score: number;
    rank?: number;
    subscores: {
        growth: number;
        stability: number;
        improvement: number;
    };
    metrics: {
        marketCap: number;
        revGrowth1y: number | null;
        revGrowth3y: number | null;
        revAcceleration: boolean;
        grossMargin: number | null;
        grossMarginTrend: 'expanding' | 'stable' | 'declining' | 'unknown';
        opMarginTrend: 'expanding' | 'stable' | 'declining' | 'unknown';
        cashRunwayMonths: number | null;
        debtToEquity: number | null;
        fcfTrend: 'improving' | 'stable' | 'deteriorating' | 'unknown';
        insiderBuying: number | null;
    };
}

export class SmallCapEngine {
    private threshold: number;

    constructor(marketCapThreshold: number = 1000000000) { // Default $1B
        this.threshold = marketCapThreshold;
    }

    async evaluate(ticker: string, preFetchedQs?: any): Promise<SmallCapResult | null> {
        try {
            const qs = preFetchedQs || await yahooFinance.quoteSummary(ticker, {
                modules: ['price', 'financialData', 'defaultKeyStatistics', 'summaryDetail', 'incomeStatementHistory', 'cashflowStatementHistory', 'netSharePurchaseActivity' as any]
            });

            if (!qs || !qs.price) return null;

            const marketCap = qs.summaryDetail?.marketCap || qs.price.marketCap || 0;
            if (marketCap > this.threshold) return null;

            // 1. Strict Distressed / Bankruptcy Check
            const price = qs.price.regularMarketPrice || 0;
            const de = qs.financialData?.debtToEquity || 0;
            const currentRatio = qs.financialData?.currentRatio || 0;

            // Exclude if price is penny-stock territory, extreme debt, or poor liquidity
            if (price < 0.15 || de > 500 || (currentRatio > 0 && currentRatio < 0.5)) return null;

            // 2. Growth Factors
            const revGrowth1y = (qs.financialData?.revenueGrowth || 0) * 100;
            const revGrowth3y = (qs.defaultKeyStatistics?.revenueQuarterlyGrowth || 0) * 100;
            const revAcceleration = revGrowth1y > revGrowth3y && revGrowth1y > 0;

            // 3. Margins & Trends
            const incomeHistory = qs.incomeStatementHistory?.incomeStatementHistory || [];
            let gmTrend: any = 'unknown';
            let omTrend: any = 'unknown';
            let latestGM = 0;
            let decliningLosses = false;

            if (incomeHistory.length >= 2) {
                const latest = incomeHistory[0] as any;
                const prev = incomeHistory[1] as any;

                latestGM = (latest.grossProfit || 0) / (latest.totalRevenue || 1);
                const prevGM = (prev.grossProfit || 0) / (prev.totalRevenue || 1);
                gmTrend = latestGM > prevGM ? 'expanding' : latestGM < prevGM ? 'declining' : 'stable';

                const latestOM = (latest.operatingIncome || 0) / (latest.totalRevenue || 1);
                const prevOM = (prev.operatingIncome || 0) / (prev.totalRevenue || 1);
                omTrend = latestOM > prevOM ? 'expanding' : latestOM < prevOM ? 'declining' : 'stable';

                // Check for declining losses (if operating income is negative but becoming less negative)
                if (latestOM < 0 && (latestOM as number) > (prevOM as number)) {
                    decliningLosses = true;
                }
            }

            // 4. Balance Sheet Safety
            const cash = qs.financialData?.totalCash || 0;
            const burn = qs.financialData?.operatingCashflow || 0;
            let runway = null;
            if (burn < 0) {
                runway = Math.abs(cash / (burn / 12));
            } else {
                runway = 999; // Generating cash
            }

            const insiderBuying = (qs as any).netSharePurchaseActivity?.netInfoShares || null;

            // --- SCORING MODEL (0-100) ---

            // Growth Subscore (Max 40)
            let growthScore = 0;
            if (revGrowth1y >= 20) growthScore += 15;
            else if (revGrowth1y >= 15) growthScore += 10;
            if (revGrowth3y >= 15) growthScore += 10;
            if (revAcceleration) growthScore += 10;
            if (latestGM > 0.30) growthScore += 5;

            // Stability Subscore (Max 30)
            let stabilityScore = 0;
            if (runway === 999 || runway > 24) stabilityScore += 15;
            else if (runway > 12) stabilityScore += 10;
            if (de < 100) stabilityScore += 10;
            if (insiderBuying && insiderBuying > 0) stabilityScore += 5;

            // Improvement Subscore (Max 30)
            let improvementScore = 0;
            if (gmTrend === 'expanding') improvementScore += 10;
            if (omTrend === 'expanding' || decliningLosses) improvementScore += 10;

            // FCF Improvement
            const cfHistory = qs.cashflowStatementHistory?.cashflowStatements || [];
            let fcfTrend: any = 'unknown';
            if (cfHistory.length >= 2) {
                const latest = cfHistory[0] as any;
                const prev = cfHistory[1] as any;
                const latestFCF = (latest.totalCashFromOperatingActivities || 0) + (latest.capitalExpenditures || 0);
                const prevFCF = (prev.totalCashFromOperatingActivities || 0) + (prev.capitalExpenditures || 0);
                if (latestFCF > prevFCF) {
                    fcfTrend = 'improving';
                    improvementScore += 10;
                } else {
                    fcfTrend = latestFCF < prevFCF ? 'deteriorating' : 'stable';
                }
            }

            const totalScore = Math.min(100, growthScore + stabilityScore + improvementScore);

            return {
                ticker,
                name: qs.price.shortName || ticker,
                score: totalScore,
                subscores: {
                    growth: growthScore,
                    stability: stabilityScore,
                    improvement: improvementScore
                },
                metrics: {
                    marketCap,
                    revGrowth1y,
                    revGrowth3y,
                    revAcceleration,
                    grossMargin: latestGM,
                    grossMarginTrend: gmTrend,
                    opMarginTrend: omTrend,
                    cashRunwayMonths: runway === 999 ? null : runway,
                    debtToEquity: de,
                    fcfTrend,
                    insiderBuying
                }
            };
        } catch (error) {
            console.error(`Error in SmallCapEngine for ${ticker}:`, error);
            return null;
        }
    }
}
