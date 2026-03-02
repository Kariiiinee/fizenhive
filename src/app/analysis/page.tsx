"use client";

import { useState, useEffect, Suspense } from "react";
import {
    ArrowUpRight, ArrowDownRight, Search, Loader2, Bot,
    ShieldAlert, Sparkles, TrendingUp, AlertTriangle,
    Bookmark, BookmarkCheck, Info, Download, FileText
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n";
import { isGuestLimitReached, incrementGuestUsage } from "@/lib/guest-limit";
import { GuestLimitModal } from "@/components/GuestLimitModal";

function AnalysisContent() {
    const { t, language } = useTranslation();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("search") || "AAPL";

    const [timeRange, setTimeRange] = useState("1M");
    const ranges = ["1D", "1W", "1M", "1Y", "ALL"];

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [inputValue, setInputValue] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingChart, setLoadingChart] = useState(false);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [stockData, setStockData] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [insightsData, setInsightsData] = useState<any>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [supabase, setSupabase] = useState<any>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    useEffect(() => {
        setSupabase(createClient());
    }, []);

    useEffect(() => {
        const checkSavedStatus = async () => {
            if (stockData?.symbol && supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from("saved_analyses")
                        .select("id")
                        .eq("ticker", stockData.symbol)
                        .maybeSingle();

                    if (data) {
                        setIsSaved(true);
                        setSavedId(data.id);
                    } else {
                        setIsSaved(false);
                        setSavedId(null);
                    }
                } else {
                    // Guest Mode: Check localStorage
                    const localSaved = localStorage.getItem('fizenhive_saved_analyses_demo');
                    if (localSaved) {
                        const savedList = JSON.parse(localSaved);
                        const exists = savedList.find((item: any) => item.ticker === stockData.symbol);
                        if (exists) {
                            setIsSaved(true);
                            setSavedId(exists.id);
                        } else {
                            setIsSaved(false);
                            setSavedId(null);
                        }
                    } else {
                        setIsSaved(false);
                        setSavedId(null);
                    }
                }
            }
        };
        checkSavedStatus();
    }, [stockData, insightsData, supabase]);

    const handleToggleSave = async () => {
        if (!stockData || !insightsData || !supabase) return;
        const { data: { user } } = await supabase.auth.getUser();

        const ticker = stockData.symbol;
        const name = stockData.shortName || stockData.longName;

        if (!user) {
            // Guest Mode: Save to localStorage
            const localSaved = localStorage.getItem('fizenhive_saved_analyses_demo');
            let savedList = localSaved ? JSON.parse(localSaved) : [];

            if (isSaved) {
                savedList = savedList.filter((item: any) => item.ticker !== ticker);
                setIsSaved(false);
                setSavedId(null);
            } else {
                const newId = Math.random().toString(36).substr(2, 9);
                const newEntry = {
                    id: newId,
                    ticker,
                    name,
                    insightsData: insightsData,
                    timestamp: new Date().toISOString()
                };
                savedList.push(newEntry);
                setIsSaved(true);
                setSavedId(newId);
            }
            localStorage.setItem('fizenhive_saved_analyses_demo', JSON.stringify(savedList));
            return;
        }

        if (isSaved && savedId) {
            const { error } = await supabase
                .from("saved_analyses")
                .delete()
                .eq("id", savedId);

            if (!error) {
                setIsSaved(false);
                setSavedId(null);
            }
        } else {
            const { data, error } = await supabase
                .from("saved_analyses")
                .insert([{
                    user_id: user.id,
                    ticker,
                    name,
                    insights_data: insightsData,
                }])
                .select()
                .single();

            if (!error && data) {
                setIsSaved(true);
                setSavedId(data.id);
            }
        }
    };

    const fetchStockData = async (symbol: string) => {
        setLoading(true);
        setLoadingChart(true);
        setError("");

        try {
            // 1. Fetch Quote
            const quoteRes = await fetch(`/api/finance?symbol=${symbol.toUpperCase()}`);
            if (!quoteRes.ok) throw new Error("Failed to fetch data");
            const quoteData = await quoteRes.json();
            setStockData(quoteData);

            // 2. Fetch Chart Data
            fetchChartData(symbol, timeRange);

            // 3. Reset insights data
            setInsightsData(null);

        } catch (err) {
            setError(t('common.error'));
            setStockData(null);
            setChartData([]);
            setInsightsData(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchInsightsData = async (symbol: string) => {
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user && isGuestLimitReached('analysis')) {
            setShowLimitModal(true);
            return;
        }

        setLoadingInsights(true);
        setError(""); // Clear any previous errors
        try {
            const res = await fetch('/api/finance/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: symbol, language: language })
            });
            const data = await res.json();
            if (res.ok) {
                setInsightsData(data);
                if (!user) incrementGuestUsage('analysis');
            } else {
                setError(data.error || t('analysis.insightsError'));
            }
        } catch (err: any) {
            console.error("Failed to fetch insights", err);
            setError(t('analysis.networkError'));
        } finally {
            setLoadingInsights(false);
        }
    };

    const fetchChartData = async (symbol: string, range: string) => {
        setLoadingChart(true);
        try {
            // Map UI ranges to Yahoo Finance ranges
            let yfRange = "1mo";
            if (range === "1D") yfRange = "1d";
            else if (range === "1W") yfRange = "5d";
            else if (range === "1M") yfRange = "1mo";
            else if (range === "1Y") yfRange = "1y";
            else if (range === "ALL") yfRange = "max";

            const res = await fetch(`/api/finance/chart?symbol=${symbol.toUpperCase()}&range=${yfRange}`);
            if (res.ok) {
                const data = await res.json();
                setChartData(data);
            }
        } catch (err) {
            console.error("Failed to fetch chart", err);
        } finally {
            setLoadingChart(false);
        }
    };

    useEffect(() => {
        fetchStockData(searchQuery);
    }, [searchQuery]);

    // Refetch only the chart when the time range changes
    useEffect(() => {
        if (stockData?.symbol) {
            fetchChartData(stockData.symbol, timeRange);
        }
    }, [timeRange]);

    // Handle typing to fetch search results
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (inputValue.trim().length > 1) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/finance/search?q=${encodeURIComponent(inputValue)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSearchResults(data);
                        setShowDropdown(true);
                    }
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [inputValue]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setSearchQuery(inputValue.trim());
            setShowDropdown(false);
        }
    };

    const handleSelectStock = (symbol: string) => {
        setSearchQuery(symbol);
        setInputValue(symbol);
        setShowDropdown(false);
    };

    const downloadAnalysisAsCSV = () => {
        if (!stockData) return;

        const headers = ["Metric", "Value"];
        const rows = [
            ["Symbol", stockData.symbol],
            ["Name", stockData.shortName || stockData.longName || ""],
            ["Current Price", stockData.regularMarketPrice || "N/A"],
            ["Market Cap", stockData.marketCap || "N/A"],
            ["P/E Ratio", stockData.trailingPE || "N/A"],
            ["Revenue Growth", stockData.summary?.financialData?.revenueGrowth || "N/A"],
            ["Profit Margin", stockData.summary?.financialData?.profitMargins || "N/A"],
            ["Debt-to-Equity", stockData.summary?.financialData?.debtToEquity || "N/A"],
            ["Dividend Yield", stockData.summary?.summaryDetail?.dividendYield || stockData.dividendYield || "N/A"],
            ["52-Week Change", stockData.fiftyTwoWeekChangePercent || stockData.summary?.defaultKeyStatistics?.['52WeekChange'] || "N/A"],
            ["Volume", stockData.regularMarketVolume || "N/A"],
        ];

        if (insightsData) {
            rows.push(["---", "---"]);
            rows.push(["AI Intrinsic Value", insightsData.intrinsic_value?.final || "N/A"]);
            rows.push(["Margin of Safety", insightsData.margin_of_safety ? `${insightsData.margin_of_safety}%` : "N/A"]);
            rows.push(["Quality Score", insightsData.quality_score ? `${insightsData.quality_score}/5` : "N/A"]);

            const takeawayStr = typeof insightsData.takeaway === 'string' ? insightsData.takeaway : "";
            rows.push(["Takeaway", takeawayStr ? `"${takeawayStr.replace(/"/g, '""')}"` : "N/A"]);
        }

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const filename = `FizenHive_Analysis_${stockData.symbol}_${new Date().toISOString().split('T')[0]}.csv`;



        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.target = "_blank"; // Helps Safari
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    const downloadAnalysisAsPDF = () => {
        window.print();
    };

    return (
        <div className="pt-20 p-4 pb-20 space-y-6 relative print:p-0 print:m-0 print:max-w-none print:w-full print:block print:space-y-4">
            <GuestLimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                feature="analysis"
            />
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative mt-2 z-50 print-hidden">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t('analysis.searchPlaceholder')}
                    className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-10 text-base focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground shadow-sm relative z-50"
                    onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                />
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-50" />

                {isSearching && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin z-50" />
                )}

                {/* Dropdown Results */}
                {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                        {searchResults.map((result: any, idx: number) => (
                            <button
                                key={idx}
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-b-0 flex justify-between items-center"
                                onClick={() => handleSelectStock(result.symbol)}
                            >
                                <div className="truncate pr-4">
                                    <div className="font-semibold text-foreground text-sm">{result.symbol}</div>
                                    <div className="text-xs text-muted-foreground truncate">{result.shortname || result.longname}</div>
                                </div>
                                <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md whitespace-nowrap">
                                    {result.exchDisp || result.exchange}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </form>

            {/* Overlay to close dropdown when clicking outside */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowDropdown(false)}
                />
            )}

            {error && <p className="text-destructive text-sm text-center">{error}</p>}

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t('analysis.loadingMarketData')}</p>
                </div>
            ) : stockData ? (
                <>
                    <header className="py-2">
                        <h1 className="text-xl font-semibold text-muted-foreground line-clamp-1">{stockData.shortName || stockData.longName || searchQuery.toUpperCase()}</h1>
                        <div className="flex justify-between items-end">
                            <h2 className="text-3xl font-bold tracking-tight">{stockData.symbol}</h2>
                            <div className="text-right">
                                <div className="text-2xl font-bold">${stockData.regularMarketPrice?.toFixed(2) || '---'}</div>
                                <div className={`flex items-center font-medium text-sm justify-end ${stockData.regularMarketChange >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                    {stockData.regularMarketChange >= 0 ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                                    {stockData.regularMarketChange >= 0 ? '+' : ''}{stockData.regularMarketChangePercent?.toFixed(2)}% ({stockData.regularMarketChange >= 0 ? '+' : ''}{stockData.regularMarketChange?.toFixed(2)})
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Chart Area Options */}
                    <div className="flex justify-between bg-card rounded-lg p-1 border border-border">
                        {ranges.map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === range
                                    ? "bg-primary text-primary-foreground shadow"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {/* Area Chart Implementation */}
                    <section className="h-64 bg-card border border-border rounded-xl flex items-center justify-center relative p-2 shadow-sm">
                        {loadingChart ? (
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#11d452" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#11d452" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(tickStr) => {
                                            if (!tickStr) return "";
                                            const date = new Date(tickStr);
                                            return timeRange === '1D' || timeRange === '1W'
                                                ? format(date, "HH:mm")
                                                : format(date, "MMM dd");
                                        }}
                                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={30}
                                        dy={10}
                                    />

                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                                        itemStyle={{ color: '#11d452', fontWeight: 600 }}
                                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
                                        labelFormatter={(label: any) => {
                                            if (!label) return '';
                                            const date = new Date(label);
                                            return timeRange === '1D' || timeRange === '1W'
                                                ? format(date, "MMM d, h:mm a")
                                                : format(date, "MMM d, yyyy");
                                        }}
                                    />
                                    <YAxis
                                        domain={['dataMin', 'auto']}
                                        hide
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="close"
                                        stroke="#11d452"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorPrice)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-muted-foreground">{t('analysis.noChartData')}</p>
                        )}
                    </section>

                    {/* AI Insights Card */}
                    <section>
                        <div className="bg-gradient-to-br from-card to-card border border-primary/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {t('analysis.aiAnalysisTitle')}
                                    </h3>
                                </div>
                                {insightsData && !loadingInsights && (
                                    <button
                                        onClick={handleToggleSave}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${isSaved
                                            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                                            : "bg-background border border-border text-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                        {isSaved ? t('common.saved') : t('common.save')}
                                    </button>
                                )}
                            </div>

                            {loadingInsights ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    <p className="text-sm font-medium text-muted-foreground animate-pulse">{t('analysis.crunchingFundamentals')}</p>
                                </div>
                            ) : insightsData ? (
                                <div className="space-y-5">
                                    {/* Top Metrics Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background rounded-xl p-3 border border-border">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                <TrendingUp className="w-3 h-3 text-primary" /> {t('analysis.intrinsicValue')}
                                            </p>
                                            <p className="font-bold text-foreground text-lg">
                                                ${insightsData.intrinsic_value?.final > 0 ? insightsData.intrinsic_value.final.toFixed(2) : "N/A"}
                                            </p>
                                            <p className={`text-xs mt-1 ${insightsData.margin_of_safety > 0 ? "text-primary" : "text-destructive"}`}>
                                                MOS: {insightsData.margin_of_safety.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="bg-background rounded-xl p-3 border border-border">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                <Sparkles className="w-3 h-3 text-yellow-500" /> {t('analysis.qualityScore')}
                                            </p>
                                            <div className="flex items-end gap-1">
                                                <p className="font-bold text-foreground text-lg">{insightsData.quality_score}</p>
                                                <p className="text-xs text-muted-foreground pb-1">/ 5</p>
                                            </div>
                                            <div className="flex gap-1 mt-1.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <div key={star} className={`flex-1 h-1.5 rounded-full ${star <= insightsData.quality_score ? "bg-primary" : "bg-muted"}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Explanation Text */}
                                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                        <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                            <p><span className="font-semibold text-primary">{t('analysis.takeaway')}:</span> {insightsData.takeaway}</p>
                                            <p><span className="font-semibold text-muted-foreground">{t('analysis.context')}:</span> {insightsData.context}</p>
                                        </div>
                                    </div>

                                    {/* Risk Flags */}
                                    {insightsData.risk_flags && insightsData.risk_flags.length > 0 && (
                                        <div className="mt-3">
                                            <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-2">
                                                <AlertTriangle className="w-3 h-3 text-destructive" /> {t('analysis.identifiedRisks')}
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {insightsData.risk_flags.map((flag: string, i: number) => (
                                                    <li key={i} className="text-xs text-destructive/90 flex items-start gap-1.5 bg-destructive/10 px-2.5 py-1.5 rounded-md">
                                                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                        <span>{flag}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : stockData ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-1">
                                        <Bot className="w-7 h-7" />
                                    </div>
                                    <p className="text-sm text-center text-muted-foreground max-w-[250px]">
                                        {t('analysis.generateHelpText')}
                                    </p>
                                    <button
                                        onClick={() => fetchInsightsData(stockData.symbol)}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-full transition-all shadow-md active:scale-95 flex items-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {t('analysis.generateButton')}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3">{t('analysis.keyStats')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    key: 'marketCap',
                                    value: stockData.marketCap ? `$${(stockData.marketCap / 1e9).toFixed(2)}B` : '---',
                                },
                                {
                                    key: 'peRatio',
                                    value: stockData.trailingPE?.toFixed(2) || 'N/A',
                                },
                                {
                                    key: 'revenueGrowth',
                                    value: stockData.summary?.financialData?.revenueGrowth !== undefined ? `${(stockData.summary.financialData.revenueGrowth * 100).toFixed(2)}%` : 'N/A',
                                },
                                {
                                    key: 'profitMargin',
                                    value: stockData.summary?.financialData?.profitMargins !== undefined ? `${(stockData.summary.financialData.profitMargins * 100).toFixed(2)}%` : 'N/A',
                                },
                                {
                                    key: 'debtToEquity',
                                    value: stockData.summary?.financialData?.debtToEquity !== undefined ? (stockData.summary.financialData.debtToEquity / 100).toFixed(2) : 'N/A',
                                },
                                {
                                    key: 'dividendYield',
                                    value: stockData.summary?.summaryDetail?.dividendYield !== undefined ? `${(stockData.summary.summaryDetail.dividendYield * 100).toFixed(2)}%` : (stockData.dividendYield !== undefined ? `${stockData.dividendYield}%` : 'N/A'),
                                },
                                {
                                    key: 'fiftyTwoWeekPriceChange',
                                    value: stockData.fiftyTwoWeekChangePercent !== undefined
                                        ? `${stockData.fiftyTwoWeekChangePercent > 0 ? '+' : ''}${stockData.fiftyTwoWeekChangePercent.toFixed(2)}%`
                                        : (stockData.summary?.defaultKeyStatistics?.['52WeekChange'] !== undefined ? `${stockData.summary.defaultKeyStatistics['52WeekChange'] > 0 ? '+' : ''}${(stockData.summary.defaultKeyStatistics['52WeekChange'] * 100).toFixed(2)}%` : '---'),
                                },
                                {
                                    key: 'volume',
                                    value: stockData.regularMarketVolume ? (stockData.regularMarketVolume / 1e6).toFixed(1) + 'M' : '---',
                                }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-card border border-border rounded-xl p-3 shadow-sm relative group cursor-help transition-colors hover:bg-muted/50">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-xs text-muted-foreground font-medium">{t(`analysis.stats.${stat.key}.label`)}</p>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                                    </div>
                                    <p className="font-semibold text-foreground">
                                        {stat.value}
                                    </p>
                                    {/* Tooltip for desktop hover */}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-[108%] w-[210px] p-3 bg-foreground text-background text-xs leading-relaxed rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                        <span className="font-semibold text-primary/90 mb-1 block uppercase tracking-wider text-[10px]">{t(`analysis.stats.${stat.key}.label`)}</span>
                                        {t(`analysis.stats.${stat.key}.def`)}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rotate-45"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Export Action Bar */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 pb-2 print-hidden border-t border-border mt-8">
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); downloadAnalysisAsCSV(); }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4" /> {t('common.downloadCsv')}
                        </button>

                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); downloadAnalysisAsPDF(); }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
                        >
                            <FileText className="w-4 h-4" /> {t('common.exportPdf')}
                        </button>
                    </div>
                </>
            ) : null}
        </div>
    );
}

export default function AnalysisPage() {
    const { t } = useTranslation();
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
        }>
            <AnalysisContent />
        </Suspense>
    );
}
