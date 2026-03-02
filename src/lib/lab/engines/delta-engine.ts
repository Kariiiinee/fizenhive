export interface StockMetrics {
    score: number;
    revGrowth: number;
    opMargin: number;
    debt: number;
    fcf: number;
}

export interface DeltaResult {
    ticker: string;
    name: string;
    scoreDelta: number;
    revGrowthDelta: number;
    marginDelta: number;
    debtDelta: number;
    fcfDelta: number;
    isMaterialChange: boolean;
}

export class ScoreDeltaEngine {
    private threshold: number;

    constructor(materialThreshold: number = 5) { // Default 5 points change
        this.threshold = materialThreshold;
    }

    computeDelta(current: StockMetrics, previous: StockMetrics): DeltaResult & { ticker: string } {
        const scoreDelta = current.score - previous.score;
        const revGrowthDelta = current.revGrowth - previous.revGrowth;
        const marginDelta = current.opMargin - previous.opMargin;
        const debtDelta = current.debt - previous.debt;
        const fcfDelta = current.fcf - previous.fcf;

        return {
            ticker: '', // Will be set by caller
            name: '',
            scoreDelta,
            revGrowthDelta,
            marginDelta,
            debtDelta,
            fcfDelta,
            isMaterialChange: Math.abs(scoreDelta) >= this.threshold
        };
    }
}
