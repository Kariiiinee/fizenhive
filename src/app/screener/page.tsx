"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight, Loader2, Globe, Briefcase, ChevronRight } from "lucide-react";
import Link from "next/link";

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
};

export default function ScreenerPage() {
    const [activeRegion, setActiveRegion] = useState("US");
    const [activeFilter, setActiveFilter] = useState("Day Gainers");
    const [activeSector, setActiveSector] = useState("All Sectors");
    const [isRegionOpen, setIsRegionOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSectorOpen, setIsSectorOpen] = useState(false);
    const [results, setResults] = useState<StockResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const regions = [
        "US (82)", "France (60)", "Germany (60)", "China (40)",
        "Hong Kong (45)", "Japan (58)", "Singapore (29)"
    ];
    const filters = [
        "Day Gainers", "Day Losers", "Most Active",
        "Highest Dividend", "Highest Revenue Growth", "Highest Profit Margin",
        "52-Week Low Gainers", "Lowest P/E Ratio", "Largest Market Cap", "52-Week High Gainers"
    ];
    const sectors = [
        "All Sectors", "Technology", "Financial Services", "Healthcare",
        "Consumer Cyclical", "Consumer Defensive", "Energy", "Industrials",
        "Basic Materials", "Real Estate", "Utilities", "Communication Services"
    ];

    const formatCompactNumber = (number: number) => {
        return new Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 2
        }).format(number);
    };

    useEffect(() => {
        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/finance/screener?region=${encodeURIComponent(activeRegion)}&filter=${encodeURIComponent(activeFilter)}&sector=${encodeURIComponent(activeSector)}`);
                if (!res.ok) throw new Error("Failed to fetch data");
                const data = await res.json();
                setResults(data);
            } catch (err) {
                console.error(err);
                setError("Unable to load screener data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [activeRegion, activeFilter, activeSector]);

    return (
        <div className="pt-20 p-4 pb-20 space-y-6 relative">
            <header className="flex justify-between items-start py-2 relative">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Screener</h1>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] sm:max-w-xs">
                        Screening the top companies by market cap per region for high-quality, liquid results.
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
                        <span className="hidden sm:inline">{activeRegion}</span>
                    </button>

                    {/* Sector Dropdown Button */}
                    <button
                        onClick={() => { setIsSectorOpen(!isSectorOpen); setIsFilterOpen(false); setIsRegionOpen(false); }}
                        className={`px-3 h-10 rounded-full flex items-center justify-center gap-2 transition-colors text-sm font-medium ${isSectorOpen ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border text-foreground hover:bg-secondary"
                            }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        <span className="hidden sm:inline">{activeSector === "All Sectors" ? "Sector" : activeSector}</span>
                    </button>

                    {/* Filter (Sort) Dropdown Button */}
                    <button
                        onClick={() => { setIsFilterOpen(!isFilterOpen); setIsRegionOpen(false); setIsSectorOpen(false); }}
                        className={`px-3 h-10 rounded-full flex items-center justify-center gap-2 transition-colors text-sm font-medium ${isFilterOpen ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border text-foreground hover:bg-secondary"
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">{activeFilter}</span>
                    </button>
                </div>

                {/* Dropdown Menu for Region */}
                {isRegionOpen && (
                    <div className="absolute right-14 top-14 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-2 space-y-1">
                            {regions.map((region) => (
                                <button
                                    key={region}
                                    onClick={() => { setActiveRegion(region); setIsRegionOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeRegion === region
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-secondary text-foreground"
                                        }`}
                                >
                                    {region}
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
                                    key={sector}
                                    onClick={() => { setActiveSector(sector); setIsSectorOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSector === sector
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-secondary text-foreground"
                                        }`}
                                >
                                    {sector}
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
                                    key={filter}
                                    onClick={() => { setActiveFilter(filter); setIsFilterOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeFilter === filter
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-secondary text-foreground"
                                        }`}
                                >
                                    {filter}
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

            {/* Active Filters Summary */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                <span className="font-medium text-foreground bg-secondary px-2 py-1 rounded-md">{isLoading ? "..." : results.length} Results</span>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1"><Globe className="w-3 h-3" /> {activeRegion}</span>
                {activeSector !== "All Sectors" && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1"><Briefcase className="w-3 h-3" /> {activeSector}</span>
                )}
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> {activeFilter}</span>
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
            ) : (
                <div className="space-y-3">
                    {results.map((stock) => (
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
                                                    Send for AI analysis
                                                </span>
                                            </Link>
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

                                    <div className="text-right flex-1">
                                        <div className="font-semibold">${stock.price.toFixed(2)}</div>
                                        <div className={`flex justify-end items-center text-xs font-medium ${stock.isPositive ? 'text-primary' : 'text-destructive'}`}>
                                            {stock.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                            {stock.change.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Key Statistics Inline (1-2 rows) */}
                                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-4 md:grid-cols-8 gap-y-3 gap-x-2 text-[10px] sm:text-xs">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground truncate">Mkt Cap</span>
                                        <span className="font-medium truncate">{stock.marketCap ? formatCompactNumber(stock.marketCap) : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground truncate">Volume</span>
                                        <span className="font-medium truncate">{stock.volume ? formatCompactNumber(stock.volume) : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground truncate">P/E</span>
                                        <span className="font-medium truncate">{stock.pe ? stock.pe.toFixed(2) : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground truncate">Div</span>
                                        <span className="font-medium truncate">{stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground truncate">Rev Gr</span>
                                        <span className="font-medium truncate">{stock.revenueGrowth !== null && stock.revenueGrowth !== undefined ? `${stock.revenueGrowth.toFixed(1)}%` : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground truncate">Margin</span>
                                        <span className="font-medium truncate">{stock.profitMargin !== null && stock.profitMargin !== undefined ? `${stock.profitMargin.toFixed(1)}%` : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground truncate">D/E</span>
                                        <span className="font-medium truncate">{stock.debtToEquity !== null && stock.debtToEquity !== undefined ? stock.debtToEquity.toFixed(2) : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground truncate">52W Chg</span>
                                        <span className={`font-medium truncate ${stock.fiftyTwoWeekChange && stock.fiftyTwoWeekChange > 0 ? 'text-primary' : stock.fiftyTwoWeekChange && stock.fiftyTwoWeekChange < 0 ? 'text-destructive' : ''}`}>
                                            {stock.fiftyTwoWeekChange !== null && stock.fiftyTwoWeekChange !== undefined ? `${stock.fiftyTwoWeekChange > 0 ? '+' : ''}${stock.fiftyTwoWeekChange.toFixed(1)}%` : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
