import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Expanded Curated Universes (Top Stocks by Market Cap per Region)
const REGION_UNIVERSES: Record<string, string[]> = {
    "US": [
        'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK-B', 'LLY', 'AVGO', 'JPM', 'UNH', 'V', 'XOM', 'MA', 'JNJ', 'PG', 'HD', 'COST', 'MRK',
        'ABBV', 'CVX', 'CRM', 'AMD', 'PEP', 'BAC', 'KO', 'LIN', 'TMO', 'WMT', 'MCD', 'ACN', 'ADBE', 'ABT', 'DIS', 'CSCO', 'TXN', 'INTC', 'CMCSA', 'VZ',
        'PFE', 'NKE', 'NEE', 'PM', 'AMGN', 'IBM', 'HON', 'QCOM', 'UNP', 'CAT', 'BA', 'SPGI', 'RTX', 'LOW', 'GE', 'GS', 'SYK', 'BLK', 'MDT', 'EL',
        'INTU', 'ISRG', 'NOW', 'TJX', 'AXP', 'C', 'PGR', 'COP', 'MDLZ', 'BKNG', 'ZTS', 'AMAT', 'ADI', 'LRCX', 'CI', 'GILD', 'BMY', 'SLB', 'CVS', 'MMC',
        'VRTX', 'T', 'REGN', 'DE', 'BDX', 'EOG', 'SO', 'CB', 'BSX', 'LMT', 'PXD', 'ITW', 'CME', 'AON', 'CSX', 'NOC', 'D', 'ICE', 'MU', 'SHW', 'TGT', 'KLAC'
    ],
    "France": [
        'MC.PA', 'OR.PA', 'RMS.PA', 'TTE.PA', 'SAN.PA', 'AIR.PA', 'SU.PA', 'BNP.PA', 'EL.PA', 'DG.PA', 'AI.PA', 'CS.PA', 'SAF.PA', 'ACA.PA', 'LR.PA', 'GLE.PA', 'CA.PA', 'ENGI.PA', 'CAP.PA', 'ORA.PA',
        'SGO.PA', 'VIV.PA', 'ML.PA', 'RNO.PA', 'PUB.PA', 'VIE.PA', 'FR.PA', 'RI.PA', 'STM.PA', 'HO.PA', 'TEP.PA', 'WLN.PA', 'ALO.PA', 'SW.PA', 'NK.PA', 'KER.PA', 'BN.PA', 'EN.PA', 'FDJ.PA', 'ADP.PA',
        'AMUN.PA', 'BVI.PA', 'CNP.PA', 'COFA.PA', 'DEC.PA', 'DIM.PA', 'EIF.PA', 'FGR.PA', 'GFC.PA', 'ICAD.PA', 'IPS.PA', 'JCQ.PA', 'KOF.PA', 'LI.PA', 'MMB.PA', 'NEX.PA', 'ORP.PA', 'POM.PA', 'RCO.PA', 'SESL.PA'
    ],
    "Germany": [
        'SAP.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'MRK.DE', 'BMW.DE', 'MBG.DE', 'BAS.DE', 'VOW3.DE', 'MUV2.DE', 'DPW.DE', 'IFX.DE', 'ADS.DE', 'BAYN.DE', 'DBK.DE', 'DHL.DE', 'HEN3.DE', 'RWE.DE', 'SY1.DE', 'FRE.DE',
        'BEI.DE', 'CBK.DE', 'CON.DE', '1COV.DE', 'DTG.DE', 'EOAN.DE', 'FME.DE', 'HNR1.DE', 'MTX.DE', 'PAH3.DE', 'PUM.DE', 'QIA.DE', 'SHL.DE', 'SRT3.DE', 'ZAL.DE', 'AIXA.DE', 'ARL.DE', 'BOS3.DE', 'CEV.DE', 'EVK.DE',
        'FPE3.DE', 'FRA.DE', 'G1A.DE', 'GBF.DE', 'HOT.DE', 'KRN.DE', 'LEG.DE', 'MOR.DE', 'NDA.DE', 'NEM.DE', 'O2D.DE', 'PSM.DE', 'RHM.DE', 'SDF.DE', 'SOW.DE', 'TAG.DE', 'TEG.DE', 'UN01.DE', 'WCH.DE'
    ],
    "China": [
        'BABA', 'TCEHY', 'PDD', 'JD', 'BIDU', 'NTES', 'BYDDY', 'NIO', 'LI', 'XPEV', 'BZUN', 'TCOM', 'ZTO', 'YUMC', 'WB', 'VIPS', 'TME', 'TAL', 'SNP', 'PTR',
        'LFC', 'HNP', 'GDS', 'EDU', 'DAO', 'CZR', 'CEO', 'BGNE', 'BILI', 'ATHM', 'ACH', '600519.SS', '601398.SS', '601857.SS', '601288.SS', '601988.SS', '600036.SS', '601318.SS', '000858.SZ', '300750.SZ'
    ],
    "Hong Kong": [
        '0700.HK', '3690.HK', '0941.HK', '0939.HK', '1398.HK', '3988.HK', '0883.HK', '0005.HK', '2318.HK', '1299.HK', '0388.HK', '1109.HK', '0001.HK', '0823.HK', '0011.HK', '0016.HK', '0267.HK', '0002.HK', '0012.HK', '0066.HK',
        '0003.HK', '0006.HK', '0083.HK', '0101.HK', '0151.HK', '0175.HK', '0268.HK', '0288.HK', '0316.HK', '0386.HK', '0688.HK', '0762.HK', '0836.HK', '0857.HK', '0868.HK', '0960.HK', '0968.HK', '0992.HK', '1038.HK', '1044.HK',
        '1088.HK', '1093.HK', '1113.HK', '1177.HK', '1378.HK'
    ],
    "Japan": [
        '7203.T', '6758.T', '9984.T', '6861.T', '8035.T', '9432.T', '8306.T', '6098.T', '4063.T', '9983.T', '4568.T', '8058.T', '8316.T', '6501.T', '6954.T', '6367.T', '6902.T', '7974.T', '7741.T', '4502.T',
        '8766.T', '8001.T', '6702.T', '8031.T', '4519.T', '6594.T', '4543.T', '8053.T', '6981.T', '9433.T', '8411.T', '3382.T', '4661.T', '4523.T', '7751.T', '7267.T', '9022.T', '9020.T', '4901.T', '7269.T',
        '5108.T', '8802.T', '8801.T', '7201.T', '6762.T', '4503.T', '8591.T', '4911.T', '9735.T', '1925.T', '6920.T', '4507.T', '1928.T', '9021.T', '2502.T', '3402.T', '6752.T', '6502.T'
    ],
    "Singapore": [
        'D05.SI', 'O39.SI', 'U11.SI', 'Z74.SI', 'V03.SI', 'C38U.SI', 'Y92.SI', 'ME8U.SI', 'A17U.SI', 'BN4.SI', 'M44U.SI', 'N2IU.SI', 'T39.SI', 'F34.SI', 'S68.SI', 'U96.SI', 'C52.SI', 'BS6.SI', 'G13.SI', 'S58.SI',
        'S63.SI', 'U14.SI', 'J36.SI', 'H78.SI', 'C09.SI', 'C31.SI', 'D01.SI', 'F99.SI', 'O32.SI'
    ]
};

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
                const [history, qs] = await Promise.all([
                    yahooFinance.historical(sym, { period1: start, period2: end, interval: '1d' }).catch(() => []),
                    yahooFinance.quoteSummary(sym, { modules: ['price', 'assetProfile', 'defaultKeyStatistics', 'financialData', 'summaryDetail'] }).catch(() => null)
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

                const calculateScores = (qs: any) => {
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
                        total: Math.min(80, safety + mispricing)
                    };
                };

                const scores = calculateScores(qs);

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
