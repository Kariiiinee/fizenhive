import { NextResponse } from 'next/server';

export const maxDuration = 30;
import YahooFinance from 'yahoo-finance2';
import { GoogleGenerativeAI } from '@google/generative-ai';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface InsightsQuery {
    ticker: string;
    normalizedEPS?: number;
    targetPE?: number;
    targetFCFYield?: number;
    manualOverride?: number;
    language?: string;
}

// 1. Fetch Data
async function fetchData(ticker: string) {
    try {
        const quote = await yahooFinance.quote(ticker);
        const quoteSummary = await yahooFinance.quoteSummary(ticker, {
            modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'price', 'earningsTrend', 'cashflowStatementHistory']
        });
        return { quote, quoteSummary };
    } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
        throw new Error(`Failed to fetch financial data for ${ticker}`);
    }
}

// 2. Compute Metrics
function computeMetrics(data: any, query: InsightsQuery) {
    const { quote, quoteSummary } = data;
    const fd = quoteSummary.financialData || {};
    const ks = quoteSummary.defaultKeyStatistics || {};
    const sd = quoteSummary.summaryDetail || {};

    // Find latest FCF from cashflow statement if available
    let fcf = fd.freeCashflow || 0;
    if (!fcf && quoteSummary.cashflowStatementHistory?.cashflowStatements?.length > 0) {
        const latest = quoteSummary.cashflowStatementHistory.cashflowStatements[0];
        // Approximate if direct FCF missing: Operating Cash Flow - Capital Expenditure
        if (latest.totalCashFromOperatingActivities && latest.capitalExpenditures) {
            fcf = latest.totalCashFromOperatingActivities + latest.capitalExpenditures; // capex is usually negative
        }
    }

    const price = quote.regularMarketPrice || 0;
    const marketCap = quote.marketCap || sd.marketCap || 0;
    const debt = fd.totalDebt || 0;
    const cash = fd.totalCash || 0;

    const netDebt = debt - cash;
    const fcfYield = marketCap > 0 ? fcf / marketCap : 0;

    // Valuation computations
    const currentEPS = fd.revenuePerShare && sd.trailingPE ? (price / sd.trailingPE) : (ks.trailingEps || 0); // Approximate if missing

    // Use inputs or defaults
    const normEPS = query.normalizedEPS || currentEPS;
    const targetPE = query.targetPE || 15;
    const targetFCFY = query.targetFCFYield || 0.05;

    const intrinsic_PE = normEPS > 0 ? normEPS * targetPE : 0;
    const intrinsic_FCF = fcf > 0 && sd.sharesOutstanding ? (fcf / sd.sharesOutstanding) / targetFCFY : 0;

    let intrinsic_final = 0;
    if (query.manualOverride) {
        intrinsic_final = query.manualOverride;
    } else {
        // If both are > 0, take min. If one is 0, take the other.
        if (intrinsic_PE > 0 && intrinsic_FCF > 0) {
            intrinsic_final = Math.min(intrinsic_PE, intrinsic_FCF);
        } else {
            intrinsic_final = intrinsic_PE > 0 ? intrinsic_PE : intrinsic_FCF;
        }
    }

    const mos = intrinsic_final > 0 ? ((intrinsic_final - price) / intrinsic_final) : 0;

    const company_info = {
        name: quote.longName || quote.shortName,
        sector: quoteSummary.price?.quoteType || 'Unknown', // YF doesn't reliably return sector in basic modules without assetProfile
        industry: 'Unknown',
        price: price,
        marketCap: marketCap,
        enterpriseValue: ks.enterpriseValue || 0,
        fiftyTwoWeekRange: `${sd.fiftyTwoWeekLow || 'N/A'} - ${sd.fiftyTwoWeekHigh || 'N/A'}`
    };

    const valuation_metrics = {
        pe_trailing: sd.trailingPE || null,
        pe_forward: sd.forwardPE || null,
        peg: ks.pegRatio || null,
        price_to_sales: sd.priceToSalesTrailing12Months || null,
        price_to_book: ks.priceToBook || null,
        ev_to_ebitda: ks.enterpriseToEbitda || null
    };

    const currentRatio = fd.currentRatio || 0;
    const debtEquity = fd.debtToEquity ? (fd.debtToEquity / 100) : 0; // usually returned as percentage

    const financial_strength = {
        total_debt: debt,
        total_cash: cash,
        net_debt: netDebt,
        debt_to_equity: debtEquity,
        current_ratio: currentRatio,
        quick_ratio: fd.quickRatio || null
    };

    const cashflow = {
        operating_cash_flow: fd.operatingCashflow || 0,
        free_cash_flow: fcf,
        dividend_yield: sd.dividendYield ? (sd.dividendYield * 100) : 0
    };

    // Growth & Margins
    const revGrowth = fd.revenueGrowth || 0;
    const opMargin = fd.operatingMargins || 0;
    const roe = fd.returnOnEquity || 0;

    return {
        ticker: query.ticker,
        company_info,
        valuation_metrics,
        financial_strength,
        cashflow,
        intrinsic_value: {
            methods: {
                pe_based: intrinsic_PE,
                fcf_based: intrinsic_FCF
            },
            final: intrinsic_final
        },
        margin_of_safety: mos * 100, // percentage
        _raw_for_scoring: { fcf, revGrowth, opMargin, roe, debtEquity, currentRatio }
    };
}

// 3. Score Company & Risk Flags
function scoreCompany(metrics: any) {
    const raw = metrics._raw_for_scoring;
    let score = 0;
    const flags = [];

    // Quality Score (0-5)
    if (raw.fcf > 0) score += 1;
    if (raw.revGrowth > 0) score += 1;
    if (raw.opMargin > 0.10) score += 1;
    if (raw.roe > 0.12) score += 1;
    if (raw.debtEquity < 0.8 && raw.debtEquity > 0) score += 1;

    // Risk Flags
    if (raw.debtEquity > 1) flags.push("High Leverage: Debt to Equity ratio exceeds 1.0");
    if (raw.currentRatio < 1 && raw.currentRatio > 0) flags.push("Liquidity Risk: Current ratio is less than 1.0 (Current Assets < Current Liabilities)");
    if (raw.fcf < 0) flags.push("Cash Burn: Free Cash Flow is negative");

    delete metrics._raw_for_scoring; // Remove temporary field

    return {
        ...metrics,
        quality_score: score,
        risk_flags: flags
    };
}

// 4. Generate Output (Gemini)
async function generateOutput(scoredData: any, language: string) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        let prompt = `Analyze the following structured financial data for ${scoredData.ticker} (${scoredData.company_info.name}) acting as a neutral financial educator.

Data:
- Price: $${scoredData.company_info.price}
- Margin of Safety: ${scoredData.margin_of_safety.toFixed(2)}%
- Quality Score: ${scoredData.quality_score} out of 5
- Risk Flags: ${scoredData.risk_flags.length > 0 ? scoredData.risk_flags.join(", ") : "None Detected"}
- P/E (Trailing): ${scoredData.valuation_metrics.pe_trailing || 'N/A'}
- Debt to Equity: ${scoredData.financial_strength.debt_to_equity.toFixed(2)}
- Dividend Yield: ${scoredData.cashflow.dividend_yield.toFixed(2)}%

Goal: Return a JSON object ONLY with exactly two keys: "takeaway" and "context".

1. "takeaway": A beginner-friendly paragraph explaining what these specific metrics mean for this company's financial health, valuation, and safety. Do not give any buy/sell recommendations or instructions. Be educational.
2. "context": A brief paragraph comparing these metrics to general sector benchmarks (e.g. is this P/E high or low for a typical company?) and summarizing the overall stance neutrally.

Important: Provide the text in ${language === 'fr' ? 'French' : 'English'}.

Respond ONLY with valid JSON in this exact format, without markdown wrapping:
{
  "takeaway": "Your explanation here...",
  "context": "Your context here..."
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Attempt to parse JSON response
        let aiResponse = { takeaway: "AI Analysis unavailable.", context: "Context unavailable." };
        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');
            aiResponse = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", text);
        }

        return {
            ...scoredData,
            takeaway: aiResponse.takeaway,
            context: aiResponse.context
        };
    } catch (error) {
        console.error('Gemini AI generation failed:', error);
        return {
            ...scoredData,
            takeaway: "AI Analysis currently unavailable due to API limits or errors. Please review the raw metrics.",
            context: "Please evaluate the metrics independently."
        };
    }
}

export async function POST(request: Request) {
    try {
        const body: InsightsQuery = await request.json();

        if (!body.ticker) {
            return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
        }

        // 1. Fetch
        const rawData = await fetchData(body.ticker);

        // 2. Compute
        const computedMetrics = computeMetrics(rawData, body);

        // 3. Score
        const scoredData = scoreCompany(computedMetrics);

        // 4. Generate AI Text
        const finalOutput = await generateOutput(scoredData, body.language || 'en');

        return NextResponse.json(finalOutput);

    } catch (error: any) {
        console.error('Insights API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process insights analysis' },
            { status: 500 }
        );
    }
}
