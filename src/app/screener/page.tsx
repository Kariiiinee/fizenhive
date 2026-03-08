"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight, Loader2, Globe, Briefcase, ChevronRight, X, CheckCircle2, AlertCircle, TrendingUp, Shield, Activity, Target, Star } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { isGuestLimitReached, incrementGuestUsage } from "@/lib/guest-limit";
import { GuestLimitModal } from "@/components/GuestLimitModal";

type StockResult = {
    ticker: string;
    name: string;
    price: number;
    change: number;
    isPositive: boolean;
    spark: number[];
    pe?: number | null;
    revenueGrowth?: number | null;
    profitMargin?: number | null;
    dividendYield?: number | null;
    debtToEquity?: number | null;
    marketCap?: number | null;
    volume?: number | null;
    fiftyTwoWeekChange?: number | null;
    sector?: string;
    scores?: {
        safety: number;
        mispricing: number;
        news: number;
        total: number;
    };
    metrics?: {
        debtToEquity?: number | null;
        currentRatio?: number | null;
        freeCashflow?: number | null;
        pe?: number | null;
        targetMeanPrice?: number | null;
        returnOnEquity?: number | null;
        revenueGrowth?: number | null;
        profitMargins?: number | null;
    };
};

export default function ScreenerPage() {
    const { t, language } = useTranslation();
    const [activeRegion, setActiveRegion] = useState("US");
    const [activeFilter, setActiveFilter] = useState("Day Gainers");
    const [activeSector, setActiveSector] = useState("All Sectors");
    const [isRegionOpen, setIsRegionOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSectorOpen, setIsSectorOpen] = useState(false);
    const [results, setResults] = useState<StockResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(15);
    const [selectedStock, setSelectedStock] = useState<StockResult | null>(null);
    const [supabase] = useState(() => createClient());
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [watchlist, setWatchlist] = useState<string[]>([]);

    const fetchWatchlist = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('portfolio_holdings').select('ticker').eq('user_id', user.id).eq('portfolio_id', 'watchlist');
            setWatchlist(data?.map(d => d.ticker) || []);
        } else {
            const local = localStorage.getItem('fizenhive_portfolio_demo');
            if (local) {
                const folio = JSON.parse(local);
                setWatchlist(folio.filter((h: any) => h.portfolio_id === 'watchlist').map((h: any) => h.ticker));
            }
        }
    };

    const toggleWatchlist = async (ticker: string, price: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        const exists = watchlist.includes(ticker);

        if (exists) {
            setWatchlist(prev => prev.filter(t => t !== ticker));
        } else {
            setWatchlist(prev => [...prev, ticker]);
        }

        if (user) {
            if (exists) {
                await supabase.from('portfolio_holdings').delete().eq('user_id', user.id).eq('ticker', ticker).eq('portfolio_id', 'watchlist');
            } else {
                await supabase.from('portfolio_holdings').insert({
                    user_id: user.id,
                    ticker,
                    quantity: 1,
                    buy_price: price,
                    portfolio_id: 'watchlist',
                    date_bought: new Date().toISOString().split('T')[0]
                });
            }
        } else {
            const local = localStorage.getItem('fizenhive_portfolio_demo');
            let folio = local ? JSON.parse(local) : [];
            if (exists) {
                folio = folio.filter((h: any) => !(h.ticker === ticker && h.portfolio_id === 'watchlist'));
            } else {
                folio.push({
                    id: Math.random().toString(36).substr(2, 9),
                    ticker,
                    quantity: 1,
                    buy_price: price,
                    portfolio_id: 'watchlist',
                    date_bought: new Date().toISOString().split('T')[0]
                });
            }
            localStorage.setItem('fizenhive_portfolio_demo', JSON.stringify(folio));
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const regions = [
        { label: t('screener.regions.us'), value: "US" },
        { label: t('screener.regions.france'), value: "France" },
        { label: t('screener.regions.germany'), value: "Germany" },
        { label: t('screener.regions.china'), value: "China" },
        { label: t('screener.regions.hongkong'), value: "Hong Kong" },
        { label: t('screener.regions.japan'), value: "Japan" },
        { label: t('screener.regions.singapore'), value: "Singapore" }
    ];
    const filters = [
        { label: t('screener.filters.gainers'), value: "Day Gainers" },
        { label: t('screener.filters.losers'), value: "Day Losers" },
        { label: t('screener.filters.active'), value: "Most Active" },
        { label: t('screener.filters.dividend'), value: "Highest Dividend" },
        { label: t('screener.filters.revenue'), value: "Highest Revenue Growth" },
        { label: t('screener.filters.profit'), value: "Highest Profit Margin" },
        { label: t('screener.filters.lowGainers'), value: "52-Week Low Gainers" },
        { label: t('screener.filters.pe'), value: "Lowest P/E Ratio" },
        { label: t('screener.filters.marketCap'), value: "Largest Market Cap" },
        { label: t('screener.filters.highGainers'), value: "52-Week High Gainers" }
    ];
    const sectors = [
        { label: t('screener.sectors.all'), value: "All Sectors" },
        { label: t('screener.sectors.tech'), value: "Technology" },
        { label: t('screener.sectors.finance'), value: "Financial Services" },
        { label: t('screener.sectors.healthcare'), value: "Healthcare" },
        { label: t('screener.sectors.cyclical'), value: "Consumer Cyclical" },
        { label: t('screener.sectors.defensive'), value: "Consumer Defensive" },
        { label: t('screener.sectors.energy'), value: "Energy" },
        { label: t('screener.sectors.industrials'), value: "Industrials" },
        { label: t('screener.sectors.materials'), value: "Basic Materials" },
        { label: t('screener.sectors.realestate'), value: "Real Estate" },
        { label: t('screener.sectors.utilities'), value: "Utilities" },
        { label: t('screener.sectors.communication'), value: "Communication Services" }
    ];

    const formatCompactNumber = (number: number) => {
        return new Intl.NumberFormat(language, {
            notation: "compact",
            maximumFractionDigits: 2
        }).format(number);
    };

    const fetchResults = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user && isGuestLimitReached('screener')) {
            setShowLimitModal(true);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setHasStarted(true);
        setError(null);
        try {
            const res = await fetch(`/api/finance/screener?region=${encodeURIComponent(activeRegion)}&filter=${encodeURIComponent(activeFilter)}&sector=${encodeURIComponent(activeSector)}`);
            if (!res.ok) throw new Error("Failed to fetch data");
            const data = await res.json();
            setResults(data);
            if (!user) incrementGuestUsage('screener');
        } catch (err) {
            console.error(err);
            setError(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setResults([]);
        setHasStarted(false);
        setVisibleCount(15);
    }, [activeRegion, activeFilter, activeSector]);

    return (
        <div className="pt-20 p-4 pb-20 space-y-6 relative">
            <GuestLimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                feature="screener"
            />
            <header className="flex justify-between items-start py-2 relative">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('screener.title')}</h1>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] sm:max-w-xs">
                        {t('screener.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    {/* Region Dropdown Button */}
                    <button
                        onClick={() => { setIsRegionOpen(!isRegionOpen); setIsFilterOpen(false); setIsSectorOpen(false); }}
                        className={`px-3 h-10 rounded-full flex items-center justify-center gap-2 transition-colors text-sm font-medium ${isRegionOpen ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border text-foreground hover:bg-secondary"
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">{regions.find(r => r.value === activeRegion)?.label || activeRegion}</span>
                    </button>

                    {/* Sector Dropdown Button */}
                    <button
                        onClick={() => { setIsSectorOpen(!isSectorOpen); setIsFilterOpen(false); setIsRegionOpen(false); }}
                        className={`px-3 h-10 rounded-full flex items-center justify-center gap-2 transition-colors text-sm font-medium ${isSectorOpen ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border text-foreground hover:bg-secondary"
                            }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        <span className="hidden sm:inline">{activeSector === "All Sectors" ? t('screener.sector') : (sectors.find(s => s.value === activeSector)?.label || activeSector)}</span>
                    </button>

                    {/* Filter (Sort) Dropdown Button */}
                    <button
                        onClick={() => { setIsFilterOpen(!isFilterOpen); setIsRegionOpen(false); setIsSectorOpen(false); }}
                        className={`px-3 h-10 rounded-full flex items-center justify-center gap-2 transition-colors text-sm font-medium ${isFilterOpen ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border text-foreground hover:bg-secondary"
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">{filters.find(f => f.value === activeFilter)?.label || activeFilter}</span>
                    </button>
                </div>

                {/* Dropdown Menu for Region */}
                {isRegionOpen && (
                    <div className="absolute right-14 top-14 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-2 space-y-1">
                            {regions.map((region) => (
                                <button
                                    key={region.value}
                                    onClick={() => { setActiveRegion(region.value); setIsRegionOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeRegion === region.value
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-secondary text-foreground"
                                        }`}
                                >
                                    {region.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dropdown Menu for Sector */}
                {isSectorOpen && (
                    <div className="absolute right-0 top-14 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-2 max-h-80 overflow-y-auto scrollbar-hide space-y-1">
                            {sectors.map((sector) => (
                                <button
                                    key={sector.value}
                                    onClick={() => { setActiveSector(sector.value); setIsSectorOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSector === sector.value
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-secondary text-foreground"
                                        }`}
                                >
                                    {sector.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dropdown Menu for Filters (Sort) */}
                {isFilterOpen && (
                    <div className="absolute right-0 top-14 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-2 max-h-80 overflow-y-auto scrollbar-hide space-y-1">
                            {filters.map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => { setActiveFilter(filter.value); setIsFilterOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeFilter === filter.value
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-secondary text-foreground"
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Backdrop for closing dropdowns */}
            {(isFilterOpen || isRegionOpen || isSectorOpen) && (
                <div
                    className="fixed inset-0 z-40 bg-black/5"
                    onClick={() => { setIsFilterOpen(false); setIsRegionOpen(false); setIsSectorOpen(false); }}
                ></div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                <span className="font-medium text-foreground bg-secondary px-2 py-1 rounded-md">
                    {isLoading ? "..." : results.length} {t('screener.results')}
                </span>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1"><Globe className="w-3 h-3" /> {regions.find(r => r.value === activeRegion)?.label || activeRegion}</span>
                {activeSector !== "All Sectors" && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1"><Briefcase className="w-3 h-3" /> {sectors.find(s => s.value === activeSector)?.label || activeSector}</span>
                )}
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> {filters.find(f => f.value === activeFilter)?.label || activeFilter}</span>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Loading / Results Area */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : hasStarted ? (
                <div className="space-y-3">
                    {results.length > 0 ? (
                        <>
                            {results.slice(0, visibleCount).map((stock) => (
                                <div key={stock.ticker} className="bg-card border border-border rounded-xl p-4 flex gap-4 hover:border-primary/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">{stock.ticker}</h4>
                                                    <Link
                                                        href={`/analysis?search=${encodeURIComponent(stock.ticker)}`}
                                                        className="group relative w-6 h-6 rounded-full bg-secondary hover:bg-primary/20 flex items-center justify-center text-foreground transition-colors"
                                                    >
                                                        <ChevronRight className="w-3 h-3 text-primary" />
                                                        <span className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border text-foreground text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-sm pointer-events-none z-10">
                                                            {t('screener.sendForAi')}
                                                        </span>
                                                    </Link>
                                                    <button
                                                        onClick={() => toggleWatchlist(stock.ticker, stock.price)}
                                                        className={`w-6 h-6 rounded-full bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors ${watchlist.includes(stock.ticker) ? 'text-primary' : 'text-muted-foreground'}`}
                                                        title={t('lab.sections.watchlist.title') || "Toggle Watchlist"}
                                                    >
                                                        <Star className={`w-3 h-3 ${watchlist.includes(stock.ticker) ? 'fill-primary' : ''}`} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{stock.name}</p>
                                            </div>

                                            {/* Middle Section: Sector */}
                                            <div className="flex flex-1 justify-center">
                                                {stock.sector && stock.sector !== 'Unknown' && (
                                                    <span className="bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded text-[10px] border border-border/50 text-center line-clamp-1">
                                                        {stock.sector}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-right flex-1 flex flex-col items-end">
                                                <div className="font-semibold text-lg">${stock.price.toFixed(2)}</div>
                                                <div className={`flex justify-end items-center text-xs font-medium ${stock.isPositive ? 'text-primary' : 'text-destructive'}`}>
                                                    {stock.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                                    {stock.change.toFixed(2)}%
                                                </div>
                                                {stock.scores && (
                                                    <button
                                                        onClick={() => setSelectedStock(stock)}
                                                        className="mt-2 flex gap-1 items-center hover:opacity-80 transition-opacity"
                                                        title={t('screener.viewDetails')}
                                                    >
                                                        <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm ${stock.scores.total >= 60 ? 'bg-primary text-primary-foreground' :
                                                            stock.scores.total >= 45 ? 'bg-yellow-500 text-white' :
                                                                'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {stock.scores.total >= 60 ? t('screener.badges.check') : stock.scores.total >= 45 ? t('screener.badges.watch') : t('screener.badges.hold')}
                                                        </div>
                                                        <div className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-foreground font-medium border border-border flex items-center gap-1">
                                                            S:{stock.scores.safety} M:{stock.scores.mispricing} N:{stock.scores.news >= 0 ? '+' : ''}{stock.scores.news}
                                                            <Activity className="w-2 h-2 text-primary" />
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Key Statistics Inline (1-2 rows) */}
                                        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-4 md:grid-cols-8 gap-y-3 gap-x-2 text-[10px] sm:text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground truncate">{t('screener.stats.marketCap')}</span>
                                                <span className="font-medium truncate">{stock.marketCap ? formatCompactNumber(stock.marketCap) : '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground truncate">{t('screener.stats.volume')}</span>
                                                <span className="font-medium truncate">{stock.volume ? formatCompactNumber(stock.volume) : '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground truncate">{t('screener.stats.pe')}</span>
                                                <span className="font-medium truncate">{stock.pe ? stock.pe.toFixed(2) : '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground truncate">{t('screener.stats.dividend')}</span>
                                                <span className="font-medium truncate">{stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground truncate">{t('screener.stats.revenueGrowth')}</span>
                                                <span className="font-medium truncate">{stock.revenueGrowth !== null && stock.revenueGrowth !== undefined ? `${stock.revenueGrowth.toFixed(1)}%` : '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground truncate">{t('screener.stats.profitMargin')}</span>
                                                <span className="font-medium truncate">{stock.profitMargin !== null && stock.profitMargin !== undefined ? `${stock.profitMargin.toFixed(1)}%` : '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground truncate">{t('screener.stats.debtToEquity')}</span>
                                                <span className="font-medium truncate">{stock.debtToEquity !== null && stock.debtToEquity !== undefined ? stock.debtToEquity.toFixed(2) : '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground truncate">{t('screener.stats.fiftyTwoWeekChange')}</span>
                                                <span className={`font-medium truncate ${stock.fiftyTwoWeekChange && stock.fiftyTwoWeekChange > 0 ? 'text-primary' : stock.fiftyTwoWeekChange && stock.fiftyTwoWeekChange < 0 ? 'text-destructive' : ''}`}>
                                                    {stock.fiftyTwoWeekChange !== null && stock.fiftyTwoWeekChange !== undefined ? `${stock.fiftyTwoWeekChange > 0 ? '+' : ''}${stock.fiftyTwoWeekChange.toFixed(1)}%` : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Load More Button */}
                            {results.length > visibleCount && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={() => setVisibleCount(prev => prev + 15)}
                                        className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold rounded-xl border border-border shadow-sm transition-all"
                                    >
                                        {t('screener.loadMore')}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 bg-secondary/10 rounded-3xl border-2 border-dashed border-border px-6">
                            <p className="text-muted-foreground mb-6">{t('screener.noResults')}</p>
                            <button
                                onClick={fetchResults}
                                className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 mx-auto active:scale-95 transition-all"
                            >
                                <Target size={18} />
                                {t('screener.scanButton')}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-secondary/10 rounded-3xl border-2 border-dashed border-border px-6">
                    <p className="text-muted-foreground mb-6 font-medium">{t('screener.startTitle')}</p>
                    <button
                        onClick={fetchResults}
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 mx-auto active:scale-95 transition-all"
                    >
                        <Target size={18} />
                        {t('screener.scanButton')}
                    </button>
                </div>
            )}
            {/* Score Detail Modal */}
            {selectedStock && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="fixed inset-0"
                        onClick={() => setSelectedStock(null)}
                    ></div>
                    <div className="bg-card w-full max-w-lg border border-border rounded-2xl shadow-2xl relative z-[101] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${selectedStock.scores!.total >= 60 ? 'bg-primary text-primary-foreground' :
                                    selectedStock.scores!.total >= 45 ? 'bg-yellow-500 text-white' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                    {selectedStock.scores!.total}
                                </div>
                                <div>
                                    <h3 className="font-bold flex items-center gap-2">
                                        {selectedStock.ticker} {t('screener.modal.title')}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedStock.scores!.total >= 60 ? 'bg-primary/20 text-primary' :
                                            selectedStock.scores!.total >= 45 ? 'bg-yellow-500/20 text-yellow-600' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                            {selectedStock.scores!.total >= 60 ? t('screener.badges.check') : selectedStock.scores!.total >= 45 ? t('screener.badges.watch') : t('screener.badges.hold')}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{selectedStock.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStock(null)}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            {/* Safety Score Section */}
                            <section className="space-y-3">
                                <h4 className="flex items-center gap-2 font-semibold text-sm">
                                    <Shield className="w-4 h-4 text-primary" />
                                    {t('screener.modal.safetyScore')} ({selectedStock.scores!.safety}/40)
                                </h4>
                                <div className="grid gap-2">
                                    <ScoreMetricItem
                                        label={t('screener.metrics.debtToEquity')}
                                        value={selectedStock.metrics?.debtToEquity ? selectedStock.metrics.debtToEquity.toFixed(1) : '-'}
                                        status={selectedStock.metrics?.debtToEquity && selectedStock.metrics.debtToEquity < 100 ? 'positive' : 'neutral'}
                                        description={t('screener.modal.debtToEquityDef')}
                                    />
                                    <ScoreMetricItem
                                        label={t('screener.metrics.currentRatio')}
                                        value={selectedStock.metrics?.currentRatio ? selectedStock.metrics.currentRatio.toFixed(2) : '-'}
                                        status={selectedStock.metrics?.currentRatio && selectedStock.metrics.currentRatio > 1.5 ? 'positive' : 'neutral'}
                                        description={t('screener.modal.currentRatioDef')}
                                    />
                                    <ScoreMetricItem
                                        label={t('screener.metrics.freeCashflow')}
                                        value={selectedStock.metrics?.freeCashflow ? `$${formatCompactNumber(selectedStock.metrics.freeCashflow)}` : 'N/A'}
                                        status={selectedStock.metrics?.freeCashflow && selectedStock.metrics.freeCashflow > 0 ? 'positive' : 'negative'}
                                        description={t('screener.modal.fcfDef')}
                                    />
                                </div>
                            </section>

                            {/* Mispricing Score Section */}
                            <section className="space-y-3 pt-2">
                                <h4 className="flex items-center gap-2 font-semibold text-sm">
                                    <Target className="w-4 h-4 text-primary" />
                                    {t('screener.modal.mispricingScore')} ({selectedStock.scores!.mispricing}/40)
                                </h4>
                                <div className="grid gap-2">
                                    <ScoreMetricItem
                                        label={t('screener.metrics.peRatio')}
                                        value={selectedStock.metrics?.pe ? selectedStock.metrics.pe.toFixed(1) : '-'}
                                        status={selectedStock.metrics?.pe && selectedStock.metrics.pe < 25 ? 'positive' : 'neutral'}
                                        description={t('screener.modal.peDef')}
                                    />
                                    <ScoreMetricItem
                                        label={t('screener.metrics.analystUpside')}
                                        value={selectedStock.metrics?.targetMeanPrice && selectedStock.price
                                            ? `${(((selectedStock.metrics.targetMeanPrice - selectedStock.price) / selectedStock.price) * 100).toFixed(1)}%`
                                            : '-'
                                        }
                                        status={selectedStock.metrics?.targetMeanPrice && selectedStock.price && (selectedStock.metrics.targetMeanPrice > selectedStock.price * 1.1) ? 'positive' : 'neutral'}
                                        description={t('screener.modal.upsideDef')}
                                    />
                                    <ScoreMetricItem
                                        label={t('screener.metrics.roe')}
                                        value={selectedStock.metrics?.returnOnEquity ? `${(selectedStock.metrics.returnOnEquity * 100).toFixed(1)}%` : '-'}
                                        status={selectedStock.metrics?.returnOnEquity && selectedStock.metrics.returnOnEquity > 0.15 ? 'positive' : 'neutral'}
                                        description={t('screener.modal.roeDef')}
                                    />
                                </div>
                            </section>

                            {/* News Score Section */}
                            <section className="space-y-3 pt-2">
                                <h4 className="flex items-center gap-2 font-semibold text-sm">
                                    <TrendingUp className={`w-4 h-4 ${selectedStock.scores!.news > 0 ? 'text-primary' : selectedStock.scores!.news < 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                                    {t('screener.modal.newsSentiment')} ({selectedStock.scores!.news > 0 ? '+' : ''}{selectedStock.scores!.news})
                                </h4>
                                <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {selectedStock.scores!.news > 0
                                            ? t('screener.modal.newsPositive')
                                            : selectedStock.scores!.news < 0
                                                ? t('screener.modal.newsNegative')
                                                : t('screener.modal.newsNeutral')}
                                    </p>
                                </div>
                            </section>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-secondary/30 border-t border-border flex justify-end">
                            <button
                                onClick={() => setSelectedStock(null)}
                                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                                {t('screener.modal.gotIt')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ScoreMetricItem({ label, value, status, description }: { label: string, value: string, status: 'positive' | 'negative' | 'neutral', description: string }) {
    return (
        <div className="group p-3 bg-card border border-border/50 rounded-xl hover:border-primary/30 transition-all">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${status === 'positive' ? 'text-primary' : status === 'negative' ? 'text-destructive' : 'text-foreground'
                        }`}>
                        {value}
                    </span>
                    {status === 'positive' && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                    {status === 'negative' && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
                </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}
