export const en = {
    common: {
        portfolio: "Portfolio",
        analysis: "Analysis",
        screener: "Screener",
        aiAssistant: "AI Assistant",
        loading: "Loading...",
        error: "An error occurred",
        save: "Save",
        saved: "Saved",
        downloadCsv: "Download CSV",
        exportPdf: "Export as PDF",
        cancel: "Cancel",
        confirm: "Confirm",
        search: "Search...",
        back: "Back",
        total: "Total",
    },
    header: {
        loggedInAs: "Logged in as",
        signOut: "Sign Out",
        signIn: "Sign In",
        navMenu: "Navigation Menu",
    },
    dashboard: {
        heroTitle: "Invest with clarity, simply.",
        heroSubtitle: "Build, analyze, and track your portfolio in one space.",
        invested: "Invested",
        current: "Current",
        roi: "ROI",
        return: "Return",
        addInvestment: "Add Investment",
        searchPlaceholder: "Search to add (e.g. AAPL)",
        targetPriceInfo: "Target Price is your price aim for learning goals.",
        mainPortfolio: "Main Portfolio",
        newTab: "New Tab",
        portfolioNamePlaceholder: "Portfolio Name...",
        portfolioValue: "Portfolio Value",
        now: "Now",
        emptyChart: "Add holding to see your performance graph",
        scrollHint: "Scroll horizontally to see more columns",
        portfolioReport: "Portfolio Report",
        table: {
            ticker: "Ticker",
            mthBought: "Mth Bought",
            qty: "Qty",
            avgCost: "Avg Cost",
            totalInvested: "Total Invested",
            currentPrice: "Current Price",
            currentValue: "Current Value",
            currentRoi: "Current ROI %",
            totalRtn: "Total Rtn",
            targetPrice: "Target Price",
            targetRoi: "Target ROI %",
            targetRtn: "Target Rtn",
        },
        loadingDashboard: "Loading Dashboard...",
        loadingPortfolio: "Loading Portfolio...",
        noInvestments: "No investments added yet.",
    },
    analysis: {
        searchPlaceholder: "Search ticker or company (e.g. AAPL, LVMH)",
        fetchingData: "Fetching market data...",
        noChartData: "No chart data available for this range.",
        insightsError: "Failed to fetch AI insights.",
        networkError: "Network error. Please try again.",
        aiAnalysisTitle: "AI Value Analysis",
        crunchingFundamentals: "Crunching fundamentals...",
        generateHelpText: "Generate an AI-powered deep dive into this stock's valuation and quality.",
        generateButton: "Generate Analysis",
        price: "Price",
        aiAnalysis: "AI Value Analysis",
        crunching: "Crunching fundamentals...",
        intrinsicValue: "Intrinsic Value",
        mos: "MOS",
        qualityScore: "Quality Score",
        takeaway: "Takeaway",
        context: "Context",
        risks: "Identified Risks",
        identifiedRisks: "Identified Risks",
        heroTitle: "Discover intrinsic value, quality scores, and hidden risks using AI.",
        generateBtn: "Generate Analysis",
        keyStats: "Key Statistics",
        loadingMarketData: "Loading market data...",
        stats: {
            marketCap: {
                label: "Market Cap",
                def: "Total value of the company in the market. Gives a sense of size and stability."
            },
            peRatio: {
                label: "P/E Ratio",
                def: "Shows how much investors are paying per $1 of earnings."
            },
            revenueGrowth: {
                label: "Revenue Growth",
                def: "Indicates how fast the company is growing its sales over time."
            },
            profitMargin: {
                label: "Profit Margin",
                def: "Percentage of revenue that becomes profit."
            },
            debtToEquity: {
                label: "Debt-to-Equity",
                def: "Shows how much debt the company uses compared to its equity."
            },
            dividendYield: {
                label: "Dividend Yield",
                def: "Income returned to shareholders."
            },
            fiftyTwoWeekPriceChange: {
                label: "52-Week Price Change",
                def: "Shows the stock’s performance over the past year."
            },
            volume: {
                label: "Volume",
                def: "Number of shares traded in a given period."
            }
        }
    },
    screener: {
        title: "Screener",
        subtitle: "Screening the top companies by market cap per region for high-quality, liquid results.",
        allSectors: "All Sectors",
        results: "Results",
        sector: "Sector",
        sendForAi: "Send for AI analysis",
        loadMore: "Load more results",
        viewDetails: "View Score Details",
        badges: {
            check: "CHECK",
            watch: "WATCH",
            hold: "HOLD"
        },
        modal: {
            title: "Analysis Detail",
            safetyScore: "Safety Score Breakdown",
            mispricingScore: "Mispricing Score Breakdown",
            newsSentiment: "News Sentiment Adjustment",
            gotIt: "Got it",
            debtToEquityDef: "Lower is better. Companies with low debt are more resilient.",
            currentRatioDef: "Liquidity test. Above 1.5 indicates healthy short-term coverage.",
            fcfDef: "Positive FCF shows the company generates real cash for growth.",
            peDef: "Valuation multiple. Lower P/E often suggests better value.",
            upsideDef: "Expected return according to wall street average targets.",
            roeDef: "Efficiency metric. Above 15% shows excellent capital usage.",
            newsPositive: "Detected positive catalysts in recent headlines.",
            newsNegative: "Negative news signals detected.",
            newsNeutral: "No significant news keywords detected."
        },
        regions: {
            us: "US",
            france: "France",
            germany: "Germany",
            china: "China",
            hongkong: "Hong Kong",
            japan: "Japan",
            singapore: "Singapore"
        },
        filters: {
            gainers: "Day Gainers",
            losers: "Day Losers",
            active: "Most Active",
            dividend: "Highest Dividend",
            revenue: "Highest Revenue Growth",
            profit: "Highest Profit Margin",
            lowGainers: "52-Week Low Gainers",
            pe: "Lowest P/E Ratio",
            marketCap: "Largest Market Cap",
            highGainers: "52-Week High Gainers"
        },
        sectors: {
            all: "All Sectors",
            tech: "Technology",
            finance: "Financial Services",
            healthcare: "Healthcare",
            cyclical: "Consumer Cyclical",
            defensive: "Consumer Defensive",
            energy: "Energy",
            industrials: "Industrials",
            materials: "Basic Materials",
            realestate: "Real Estate",
            utilities: "Utilities",
            communication: "Communication Services"
        },
        stats: {
            marketCap: "Mkt Cap",
            volume: "Volume",
            pe: "P/E",
            dividend: "Div",
            revenueGrowth: "Rev Gr",
            profitMargin: "Margin",
            debtToEquity: "D/E",
            fiftyTwoWeekChange: "52W Chg"
        },
        metrics: {
            debtToEquity: "Debt to Equity",
            currentRatio: "Current Ratio",
            freeCashflow: "Free Cashflow",
            peRatio: "P/E Ratio",
            analystUpside: "Analyst Target Upside",
            roe: "Return on Equity (ROE)"
        }
    },
    chat: {
        welcome: "Hello! I'm FizenHive AI. How can I help you analyze your portfolio or the markets today?",
        inputPlaceholder: "Ask Fizenhive anything...",
        disclaimer: "Educational Purposes Only: As FizenHive AI, I provide neutral, educational information to help you understand companies and financial concepts. I do not provide investment advice or recommendations to buy, sell, or hold.",
        online: "Online",
        error: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.",
        title: "FizenHive AI",
    },
    pwa: {
        install: "Install App",
        tapShare: "Tap Share",
        addToHome: "Add to Home Screen",
        gotIt: "Got it"
    },
    limits: {
        analysis: {
            title: "AI Analysis Limited",
            description: "You've reached your free analysis limit. Sign in to continue getting unlimited financial insights."
        },
        screener: {
            title: "Screener Limited",
            description: "Explore more market opportunities by creating an account. Guests are limited to 5 screens per session."
        },
        chat: {
            title: "AI Chat Limited",
            description: "Your AI conversation has reached its limit. Sign in to unlock unlimited discussions."
        },
        lab: {
            title: "Discovery Lab Limited",
            description: "Explore more market opportunities by creating an account. Guests are limited to 5 scans per session."
        },
        loginButton: "Sign In / Create Account",
        maybeLater: "Maybe Later"
    },
    lab: {
        title: "Discovery Lab",
        subtitle: "Uncovering emerging trends, small-cap gems, and structural shifts.",
        scanButton: "Trigger Discovery Scan",
        scanning: "Scanning Market...",
        lastScan: "Last Scan",
        sections: {
            smallCaps: {
                title: "Small Cap Hidden Potential",
                description: "Stocks under $1B with accelerating growth and solid cash runway."
            },
            relativeOutliers: {
                title: "Relative Ranking Outliers",
                description: "Top 10% performers in their region based on Value, Quality, and Growth.",
                explanation: "Ranked using percentile analysis across 6 metrics: EV/EBITDA, P/E, FCF Yield, Revenue Growth, ROIC/ROA, and Debt/Equity."
            },
            curiosity: {
                title: "Curiosity Radar",
                description: "Weekly anomalies: volume spikes, extreme rotations, and outliers."
            },
            improvers: {
                title: "Biggest Improvers (Delta)",
                description: "Companies showing the most significant score improvement vs previous scan."
            },
            watchlist: {
                title: "Watchlist Tracker",
                description: "Persistent tracking of your discovered interests."
            }
        },
        metrics: {
            score: "Score",
            rank: "Rank",
            growth: "Growth",
            stability: "Stability",
            improvement: "Improvement",
            delta: "Delta"
        },
        noResults: "No anomalies detected yet. Try triggering a fresh scan."
    }
};
