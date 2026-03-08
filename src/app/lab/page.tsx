"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp, Shield, Activity, Target, Search, Filter,
    ArrowUpRight, ArrowDownRight, Loader2, Globe, Boxes,
    Beaker, Zap, BarChart3, Star, Clock, Info,
    Tag, Banknote, Rocket, TrendingDown, UserCheck, BarChart2,
    Building2, PieChart, X
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { REGION_UNIVERSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { isGuestLimitReached, incrementGuestUsage } from "@/lib/guest-limit";
import { GuestLimitModal } from "@/components/GuestLimitModal";

type LabData = {
    smallCaps: any[];
    rankings: any[];
    radar: {
        cheapestEV: any[];
        highestFCF: any[];
        fastestGrowthSmallCap: any[];
        underperformers: any[];
        volumeSpikes: any[];
        insiderBuying: any[];
    };
    deltas: any[];
    country: string;
    timestamp: string;
};

export default function LabPage() {
    const { t, language } = useTranslation();
    const [activeCountry, setActiveCountry] = useState("US");
    const [data, setData] = useState<LabData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState("overview");
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showOutlierTooltip, setShowOutlierTooltip] = useState(false);
    const [showSmallCapTooltip, setShowSmallCapTooltip] = useState(false);
    const [showImproversTooltip, setShowImproversTooltip] = useState(false);
    const [showCuriosityTooltip, setShowCuriosityTooltip] = useState(false);
    const [showWatchlistTooltip, setShowWatchlistTooltip] = useState(false);
    const [showDiscoveryTooltip, setShowDiscoveryTooltip] = useState(false);
    const [activeRadarTooltip, setActiveRadarTooltip] = useState<string | null>(null);
    const [supabase] = useState(() => createClient());
    const [watchlist, setWatchlist] = useState<any[]>([]);
    const [isWatchlistLoading, setIsWatchlistLoading] = useState(true);

    const fetchWatchlist = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data } = await supabase
                .from('lab_watchlist')
                .select('*')
                .eq('user_id', user.id);
            setWatchlist(data || []);
        } else {
            const local = localStorage.getItem('fizenhive_lab_watchlist');
            setWatchlist(local ? JSON.parse(local) : []);
        }
        setIsWatchlistLoading(false);
    };

    const toggleWatchlist = async (ticker: string, name: string, tags: string[], extraData?: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        const exists = watchlist.find(item => item.ticker === ticker);

        let newWatchlist;
        if (exists) {
            newWatchlist = watchlist.filter(item => item.ticker !== ticker);
        } else {
            newWatchlist = [...watchlist, { ticker, name, tags, ...extraData }];
        }

        // Optimistic update
        setWatchlist(newWatchlist);

        if (user) {
            if (exists) {
                await supabase.from('lab_watchlist').delete().eq('user_id', user.id).eq('ticker', ticker);
            } else {
                await supabase.from('lab_watchlist').insert({ user_id: user.id, ticker, name, tags, ...extraData });
            }
        } else {
            localStorage.setItem('fizenhive_lab_watchlist', JSON.stringify(newWatchlist));
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const countries = Object.keys(REGION_UNIVERSES);

    const fetchData = async (country: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user && isGuestLimitReached('lab')) {
            setShowLimitModal(true);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/lab/discovery?country=${country}`);
            if (!res.ok) throw new Error("Failed to fetch discovery data");
            const json = await res.json();
            setData(json);
            if (!user) incrementGuestUsage('lab');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const triggerScan = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/lab/scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ country: activeCountry })
            });
            if (res.ok) {
                await fetchData(activeCountry);
            }
        } catch (err) {
            console.error("Scan error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setData(null);
    }, [activeCountry]);

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <GuestLimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                feature="lab"
            />
            {/* Header */}
            <div className="relative overflow-hidden pt-24 pb-16 px-6 bg-gradient-to-b from-primary/5 to-background border-b border-primary/10">
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        <div className="p-2 bg-primary/20 rounded-xl text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                            <Beaker size={28} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            {t('lab.title')}
                        </h1>
                    </motion.div>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        {t('lab.subtitle')}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        {countries.map(c => (
                            <button
                                key={c}
                                onClick={() => {
                                    setActiveCountry(c);
                                    setData(null);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCountry === c
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-secondary/50 hover:bg-secondary border border-border/50"
                                    }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
            </div>

            <main className="max-w-7xl mx-auto px-6 mt-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-primary" size={48} />
                        <p className="text-muted-foreground animate-pulse">{t('lab.scanning')}</p>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center">
                        <p className="text-destructive font-medium">{error}</p>
                        <button onClick={() => fetchData(activeCountry)} className="mt-4 text-primary underline">Try Again</button>
                    </div>
                ) : data ? (
                    <div className="space-y-16">
                        {/* Summary Stats / Last Scan */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <Clock size={16} />
                                <span>{t('lab.lastScan')}: {new Date(data.timestamp).toLocaleString()}</span>
                            </div>
                            <button
                                onClick={triggerScan}
                                className="flex items-center gap-2 px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl border border-primary/30 transition-all font-semibold"
                            >
                                <Zap size={18} />
                                {t('lab.scanButton')}
                            </button>
                        </div>

                        {/* Small Cap Section */}
                        <section>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Boxes className="text-amber-500" />
                                    <span>{t('lab.sections.smallCaps.title')}</span>
                                    <div className="group/info relative inline-block">
                                        <Info
                                            size={16}
                                            className={`cursor-help transition-colors ${showSmallCapTooltip ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary'}`}
                                            onClick={() => setShowSmallCapTooltip(!showSmallCapTooltip)}
                                        />
                                        <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl text-[10px] leading-relaxed text-muted-foreground transition-all z-50 pointer-events-none ${showSmallCapTooltip
                                            ? 'opacity-100 visible'
                                            : 'opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible'
                                            }`}>
                                            <p className="font-bold text-primary mb-1 uppercase tracking-tight">{t('lab.sections.tooltips.methodology')}</p>
                                            {t('lab.sections.smallCaps.explanation')}
                                        </div>
                                    </div>
                                </h2>
                                <p className="text-muted-foreground">{t('lab.sections.smallCaps.description')}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.smallCaps.length > 0 ? (
                                    data.smallCaps.map((stock, i) => (
                                        <DiscoveryCard
                                            key={stock.ticker}
                                            stock={stock}
                                            type="small_cap"
                                            index={i}
                                            isWatched={watchlist.some(w => w.ticker === stock.ticker)}
                                            onToggle={() => toggleWatchlist(stock.ticker, stock.name, ['Small Cap', 'Hidden Potential'], {
                                                industry: stock.industry,
                                                price: stock.price,
                                                changePercent: stock.changePercent,
                                                pe: stock.pe
                                            })}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 border-2 border-dashed border-border rounded-2xl bg-secondary/10 flex flex-col items-center justify-center text-center px-4">
                                        <Boxes className="text-muted-foreground/20 mb-3" size={40} />
                                        <p className="text-muted-foreground italic text-sm max-w-sm">
                                            {t('lab.sections.smallCaps.noneFound')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Outliers Section */}
                        <section>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Target className="text-blue-500" />
                                    <span>{t('lab.sections.relativeOutliers.title')}</span>
                                    <div className="group/info relative inline-block">
                                        <Info
                                            size={16}
                                            className={`cursor-help transition-colors ${showOutlierTooltip ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary'}`}
                                            onClick={() => setShowOutlierTooltip(!showOutlierTooltip)}
                                        />
                                        <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl text-[10px] leading-relaxed text-muted-foreground transition-all z-50 pointer-events-none ${showOutlierTooltip
                                            ? 'opacity-100 visible'
                                            : 'opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible'
                                            }`}>
                                            <p className="font-bold text-primary mb-1 uppercase tracking-tight">Technical Methodology</p>
                                            {t('lab.sections.relativeOutliers.explanation')}
                                        </div>
                                    </div>
                                </h2>
                                <p className="text-muted-foreground">{t('lab.sections.relativeOutliers.description')}</p>
                            </div>
                            <div className="overflow-x-auto pb-4">
                                <div className="flex gap-6 min-w-max">
                                    {data.rankings.filter(r => r.isTopDecile).map((stock, i) => (
                                        <DiscoveryCard
                                            key={stock.ticker}
                                            stock={stock}
                                            type="outlier"
                                            index={i}
                                            isWatched={watchlist.some(w => w.ticker === stock.ticker)}
                                            onToggle={() => toggleWatchlist(stock.ticker, stock.name, ['Outlier', 'Top Decile'], {
                                                industry: stock.industry,
                                                price: stock.price,
                                                changePercent: stock.changePercent,
                                                pe: stock.pe
                                            })}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Biggest Improvers Section */}
                        <section>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <TrendingUp className="text-pink-500" />
                                    <span>{t('lab.sections.improvers.title')}</span>
                                    <div className="group/info relative inline-block">
                                        <Info
                                            size={16}
                                            className={`cursor-help transition-colors ${showImproversTooltip ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary'}`}
                                            onClick={() => setShowImproversTooltip(!showImproversTooltip)}
                                        />
                                        <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl text-[10px] leading-relaxed text-muted-foreground transition-all z-50 pointer-events-none ${showImproversTooltip
                                            ? 'opacity-100 visible'
                                            : 'opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible'
                                            }`}>
                                            <p className="font-bold text-primary mb-1 uppercase tracking-tight">{t('lab.sections.tooltips.technicalDelta')}</p>
                                            {t('lab.sections.improvers.explanation')}
                                        </div>
                                    </div>
                                </h2>
                                <p className="text-muted-foreground">{t('lab.sections.improvers.description')}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {data.deltas.map((delta, i) => (
                                    <div key={delta.ticker} className="p-4 bg-secondary/20 border border-border/50 rounded-xl flex justify-between items-center transition-all hover:border-primary/30">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-lg">{delta.ticker}</p>
                                                <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">{delta.name}</p>
                                            </div>
                                            <p className={`text-xs flex items-center gap-1 ${delta.scoreDelta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {delta.scoreDelta > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                                {delta.scoreDelta} pts
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-2">
                                                <p className="text-[10px] text-muted-foreground uppercase">{t('lab.metrics.score')}</p>
                                                <p className="font-bold">{(data.rankings.find(r => r.ticker === delta.ticker) as any)?.compositeScore}</p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => toggleWatchlist(delta.ticker, delta.name, ['Improver', 'Technical Shift'], {
                                                        industry: (delta as any).industry,
                                                        price: (delta as any).price,
                                                        changePercent: (delta as any).changePercent,
                                                        pe: (delta as any).pe
                                                    })}
                                                    className={`p-1.5 hover:bg-primary/10 rounded-full transition-colors ${watchlist.some(w => w.ticker === delta.ticker) ? 'text-primary fill-primary' : 'text-muted-foreground/40 hover:text-primary'}`}
                                                >
                                                    <Star size={14} className={watchlist.some(w => w.ticker === delta.ticker) ? 'fill-primary' : ''} />
                                                </button>
                                                <Link href={`/analysis?symbol=${delta.ticker}`} className="p-1.5 hover:bg-primary/10 rounded-full text-muted-foreground/40 hover:text-primary transition-colors">
                                                    <ArrowUpRight size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Radar/Curiosity Section */}
                        <section>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Activity className="text-emerald-500" />
                                    <span>{t('lab.sections.curiosity.title')}</span>
                                    <div className="group/info relative inline-block">
                                        <Info
                                            size={16}
                                            className={`cursor-help transition-colors ${showCuriosityTooltip ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary'}`}
                                            onClick={() => setShowCuriosityTooltip(!showCuriosityTooltip)}
                                        />
                                        <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl text-[10px] leading-relaxed text-muted-foreground transition-all z-50 pointer-events-none ${showCuriosityTooltip
                                            ? 'opacity-100 visible'
                                            : 'opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible'
                                            }`}>
                                            <p className="font-bold text-primary mb-1 uppercase tracking-tight">{t('lab.sections.tooltips.detectionLogic')}</p>
                                            {t('lab.sections.curiosity.explanation')}
                                        </div>
                                    </div>
                                </h2>
                                <p className="text-muted-foreground mb-8">{t('lab.sections.curiosity.description')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <RadarList
                                    icon={Tag}
                                    title="Lowest EV/EBITDA"
                                    items={data.radar.cheapestEV}
                                    metric="evToEbitda"
                                    explanation={t('lab.sections.curiosity.metrics.evToEbitda')}
                                    activeTooltip={activeRadarTooltip}
                                    setActiveTooltip={setActiveRadarTooltip}
                                    tooltipId="ev"
                                    watchlist={watchlist}
                                    onToggle={toggleWatchlist}
                                />
                                <RadarList
                                    icon={Banknote}
                                    title="Highest FCF Yield"
                                    items={data.radar.highestFCF}
                                    metric="fcfYield"
                                    isPercent
                                    explanation={t('lab.sections.curiosity.metrics.fcfYield')}
                                    activeTooltip={activeRadarTooltip}
                                    setActiveTooltip={setActiveRadarTooltip}
                                    tooltipId="fcf"
                                    watchlist={watchlist}
                                    onToggle={toggleWatchlist}
                                />
                                <RadarList
                                    icon={Rocket}
                                    title="Growth Under $1B"
                                    items={data.radar.fastestGrowthSmallCap}
                                    metric="revGrowth"
                                    isPercent
                                    explanation={t('lab.sections.curiosity.metrics.growthUnder1B')}
                                    activeTooltip={activeRadarTooltip}
                                    setActiveTooltip={setActiveRadarTooltip}
                                    tooltipId="growth"
                                    watchlist={watchlist}
                                    onToggle={toggleWatchlist}
                                />
                                <RadarList
                                    icon={TrendingDown}
                                    title="6-Month Laggards"
                                    items={data.radar.underperformers}
                                    metric="priceChange6m"
                                    isPercent
                                    explanation={t('lab.sections.curiosity.metrics.laggards')}
                                    activeTooltip={activeRadarTooltip}
                                    setActiveTooltip={setActiveRadarTooltip}
                                    tooltipId="laggards"
                                    watchlist={watchlist}
                                    onToggle={toggleWatchlist}
                                />
                                <RadarList
                                    icon={UserCheck}
                                    title="Insider Buying"
                                    items={data.radar.insiderBuying}
                                    metric="insiderBuying"
                                    isCompact
                                    explanation={t('lab.sections.curiosity.metrics.insiderBuying')}
                                    activeTooltip={activeRadarTooltip}
                                    setActiveTooltip={setActiveRadarTooltip}
                                    tooltipId="insider"
                                    watchlist={watchlist}
                                    onToggle={toggleWatchlist}
                                />
                                <RadarList
                                    icon={BarChart2}
                                    title="Volume Spikes"
                                    items={data.radar.volumeSpikes}
                                    metric="volumeSurge"
                                    explanation={t('lab.sections.curiosity.metrics.volumeSpikes')}
                                    activeTooltip={activeRadarTooltip}
                                    setActiveTooltip={setActiveRadarTooltip}
                                    tooltipId="volume"
                                    watchlist={watchlist}
                                    onToggle={toggleWatchlist}
                                />
                            </div>
                        </section>

                        {/* Discovery Analysis Logic */}
                        {(() => {
                            const stockMap: Record<string, { name: string, areas: string[], industry?: string, price?: number, changePercent?: number, pe?: number }> = {};

                            const track = (items: any[], areaKey: string) => {
                                items.forEach(item => {
                                    if (!stockMap[item.ticker]) {
                                        stockMap[item.ticker] = {
                                            name: item.name,
                                            areas: [],
                                            industry: item.industry,
                                            price: item.price,
                                            changePercent: item.changePercent,
                                            pe: item.pe
                                        };
                                    }
                                    if (!stockMap[item.ticker].areas.includes(areaKey)) {
                                        stockMap[item.ticker].areas.push(areaKey);
                                    }
                                });
                            };

                            track(data.smallCaps, 'smallCaps');
                            track(data.rankings.filter(r => r.isTopDecile), 'outliers');
                            track(data.deltas, 'improvers');
                            track(data.radar.cheapestEV, 'ev');
                            track(data.radar.highestFCF, 'fcf');
                            track(data.radar.fastestGrowthSmallCap, 'growth');
                            track(data.radar.underperformers, 'laggards');
                            track(data.radar.insiderBuying, 'insider');
                            track(data.radar.volumeSpikes, 'volume');

                            const multiAreaStocks = Object.entries(stockMap)
                                .filter(([_, info]) => info.areas.length > 2)
                                .map(([ticker, info]) => ({ ticker, ...info as any }));

                            if (multiAreaStocks.length === 0) return null;

                            return (
                                <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                                    <Zap size={20} className="fill-primary" />
                                                    {t('lab.sections.discoveryNote.title')}
                                                </h2>
                                                <div className="group/info relative inline-block">
                                                    <Info
                                                        size={14}
                                                        className={`cursor-help transition-colors ${showDiscoveryTooltip ? 'text-primary' : 'text-muted-foreground/30 hover:text-primary'}`}
                                                        onClick={() => setShowDiscoveryTooltip(!showDiscoveryTooltip)}
                                                    />
                                                    <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl text-[10px] leading-relaxed text-muted-foreground transition-all z-50 pointer-events-none ${showDiscoveryTooltip
                                                        ? 'opacity-100 visible'
                                                        : 'opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible'
                                                        }`}>
                                                        {t('lab.sections.discoveryNote.explanation')}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-muted-foreground">{t('lab.sections.discoveryNote.subtitle')}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {multiAreaStocks.map(stock => {
                                                const isWatched = watchlist.some(w => w.ticker === stock.ticker);
                                                return (
                                                    <div key={stock.ticker} className="flex flex-col bg-background/50 border border-primary/10 rounded-lg p-2 px-3 hover:border-primary/30 transition-all relative pr-10">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-primary">{stock.ticker}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{stock.name}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {stock.areas.map((area: string) => (
                                                                <span key={area} className="text-[8px] bg-primary/10 text-primary px-1 whitespace-nowrap rounded font-bold uppercase tracking-tighter">
                                                                    {t(`lab.sections.discoveryNote.sections.${area}`)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => toggleWatchlist(stock.ticker, stock.name, ['Discovery Note', ...stock.areas])}
                                                            className={`absolute top-1/2 -translate-y-1/2 right-2 p-1.5 hover:bg-primary/10 rounded-full transition-colors ${isWatched ? 'text-primary fill-primary' : 'text-muted-foreground/30 hover:text-primary'}`}
                                                        >
                                                            <Star size={14} className={isWatched ? 'fill-primary' : ''} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                                </section>
                            );
                        })()}

                        {/* Watchlist Section */}
                        <section className="bg-gradient-to-br from-primary/5 to-secondary/20 p-8 rounded-3xl border border-primary/10">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Star className="text-primary fill-primary" />
                                    <span>{t('lab.sections.watchlist.title')}</span>
                                    <div className="group/info relative inline-block">
                                        <Info
                                            size={16}
                                            className={`cursor-help transition-colors ${showWatchlistTooltip ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary'}`}
                                            onClick={() => setShowWatchlistTooltip(!showWatchlistTooltip)}
                                        />
                                        <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl text-[10px] leading-relaxed text-muted-foreground transition-all z-50 pointer-events-none ${showWatchlistTooltip
                                            ? 'opacity-100 visible'
                                            : 'opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible'
                                            }`}>
                                            <p className="font-bold text-primary mb-1 uppercase tracking-tight">{t('lab.sections.tooltips.tracking')}</p>
                                            {t('lab.sections.watchlist.explanation')}
                                        </div>
                                    </div>
                                </h2>
                                <p className="text-muted-foreground">{t('lab.sections.watchlist.description')}</p>
                            </div>
                            <WatchlistTracker
                                watchlist={watchlist}
                                isLoading={isWatchlistLoading}
                                onRemove={(ticker) => toggleWatchlist(ticker, '', [])}
                            />
                        </section>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-secondary/20 rounded-3xl border-2 border-dashed border-border">
                        <p className="text-muted-foreground">{t('lab.noResults')}</p>
                        <button onClick={triggerScan} className="mt-6 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20">
                            {t('lab.scanButton')}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

function WatchlistTracker({ watchlist, isLoading, onRemove }: { watchlist: any[], isLoading: boolean, onRemove: (ticker: string) => void }) {
    const { t } = useTranslation();

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    const formatVal = (val: any, isPercent: boolean = false) => {
        if (val === null || val === undefined) return '-';
        return isPercent ? `${val.toFixed(2)}%` : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="space-y-3">
            {watchlist.length > 0 ? watchlist.map((item) => (
                <div key={item.ticker} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background/80 backdrop-blur rounded-2xl border border-border/40 hover:border-primary/30 transition-all group gap-4">
                    <div className="flex items-center gap-4 min-w-[200px]">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary shrink-0">
                            {item.ticker[0]}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-lg leading-none">{item.ticker}</p>
                                <span className="text-[10px] text-muted-foreground truncate uppercase font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <Building2 size={10} className="text-muted-foreground/50" />
                                <p className="text-[10px] text-muted-foreground/70 truncate">{item.industry || "Unknown Industry"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 md:flex md:items-center md:gap-8 flex-1">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Price</span>
                            <span className="font-mono text-sm">
                                {item.price ? `$${formatVal(item.price)}` : '-'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">24h Change</span>
                            <span className={`font-mono text-sm flex items-center gap-1 ${item.changePercent > 0 ? 'text-emerald-500' : item.changePercent < 0 ? 'text-rose-500' : ''}`}>
                                {item.changePercent > 0 && <ArrowUpRight size={12} />}
                                {item.changePercent < 0 && <ArrowDownRight size={12} />}
                                {formatVal(item.changePercent, true)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">P/E Ratio</span>
                            <span className="font-mono text-sm">
                                {item.pe ? formatVal(item.pe) : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <div className="flex gap-1 mr-2 invisible group-hover:visible transition-all">
                            {(item.tags || []).slice(0, 2).map((tag: string) => (
                                <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-secondary/50 rounded text-muted-foreground font-bold uppercase tracking-tight">{tag}</span>
                            ))}
                        </div>
                        <Link href={`/analysis?symbol=${item.ticker}`} className="p-2.5 bg-primary/5 hover:bg-primary/20 rounded-xl transition-all border border-primary/10 hover:border-primary/40 text-primary">
                            <ArrowUpRight size={18} />
                        </Link>
                        <button
                            onClick={() => onRemove(item.ticker)}
                            className="p-2.5 hover:bg-destructive/10 rounded-xl text-muted-foreground/30 hover:text-destructive transition-all border border-transparent hover:border-destructive/20"
                            title="Remove from watchlist"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )) : (
                <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded-2xl bg-secondary/5">
                    <p className="text-muted-foreground text-sm italic">Your watchlist is currently empty. Star stocks to track them here.</p>
                </div>
            )}
        </div>
    );
}

function DiscoveryCard({ stock, type, index, isWatched, onToggle }: { stock: any, type: string, index: number, isWatched?: boolean, onToggle?: () => void }) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group relative bg-secondary/30 hover:bg-secondary/50 border border-border/50 hover:border-primary/40 rounded-2xl transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5 ${type === 'outlier' ? 'p-4 w-64 flex-shrink-0' : 'p-6'}`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold group-hover:text-primary transition-colors truncate ${type === 'outlier' ? 'text-lg' : 'text-xl'}`}>{stock.ticker}</h3>
                        {type === 'small_cap' && stock.rank && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold">#{stock.rank}</span>
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">{stock.name}</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`font-bold text-primary ${type === 'outlier' ? 'text-xl' : 'text-2xl'}`}>
                        {type === 'small_cap' ? stock.score : stock.compositeScore}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">{t('lab.metrics.score')}</span>
                </div>
            </div>

            {type === 'small_cap' ? (
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('lab.metrics.growth')}</span>
                        <span className="font-semibold">{stock.subscores.growth}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('lab.metrics.stability')}</span>
                        <span className="font-semibold">{stock.subscores.stability}</span>
                    </div>
                    <div className="w-full bg-border/50 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-1000"
                            style={{ width: `${stock.score}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] uppercase tracking-wider font-bold">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-1.5 flex flex-col items-center">
                        <span className="text-[8px] text-muted-foreground/70 mb-0.5">Value</span>
                        <span className="text-primary">{stock.factors.value}</span>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-1.5 flex flex-col items-center">
                        <span className="text-[8px] text-muted-foreground/70 mb-0.5">Quality</span>
                        <span className="text-primary">{stock.factors.quality}</span>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-1.5 flex flex-col items-center">
                        <span className="text-[8px] text-muted-foreground/70 mb-0.5">Growth</span>
                        <span className="text-primary">{stock.factors.growth}</span>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-1.5 flex flex-col items-center">
                        <span className="text-[8px] text-muted-foreground/70 mb-0.5">Safety</span>
                        <span className="text-primary">{stock.factors.safety}</span>
                    </div>
                </div>
            )}

            <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/analysis?symbol=${stock.ticker}`} className="text-xs font-bold flex items-center gap-1 text-primary hover:underline">
                    Analyze Deeply <ArrowUpRight size={14} />
                </Link>
                <button
                    onClick={onToggle}
                    className={`p-2 hover:bg-primary/10 rounded-full transition-colors ${isWatched ? 'text-primary fill-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                    <Star size={18} className={isWatched ? 'fill-primary' : ''} />
                </button>
            </div>
        </motion.div>
    );
}

function RadarList({
    title,
    icon: Icon,
    items,
    metric,
    isPercent,
    isCompact,
    explanation,
    activeTooltip,
    setActiveTooltip,
    tooltipId,
    watchlist,
    onToggle
}: {
    title: string,
    icon: any,
    items: any[],
    metric?: string,
    isPercent?: boolean,
    isCompact?: boolean,
    explanation?: string,
    activeTooltip?: string | null,
    setActiveTooltip?: (id: string | null) => void,
    tooltipId?: string,
    watchlist?: any[],
    onToggle?: (ticker: string, name: string, tags: string[], extraData?: any) => void
}) {
    const formatValue = (val: any) => {
        if (val === null || val === undefined) return '-';
        if (isPercent) return `${(val).toFixed(1)}%`;
        if (Math.abs(val) > 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (Math.abs(val) > 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(2);
    };

    const isOpen = activeTooltip === tooltipId;

    return (
        <div className="p-1 px-0 border-border/10">
            <h3 className="font-bold mb-4 text-emerald-500/90 text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <Icon size={16} />
                    {title}
                    {explanation && (
                        <div className="group/info relative inline-block">
                            <Info
                                size={12}
                                className={`cursor-help transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground/30 hover:text-primary'}`}
                                onClick={() => setActiveTooltip?.(isOpen ? null : (tooltipId || null))}
                            />
                            <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl text-[9px] leading-relaxed text-muted-foreground transition-all z-50 pointer-events-none normal-case font-medium ${isOpen
                                ? 'opacity-100 visible'
                                : 'opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible'
                                }`}>
                                {explanation}
                            </div>
                        </div>
                    )}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-0.5 rounded">Top 10</span>
            </h3>
            <div className="space-y-1">
                {items.length > 0 ? items.map((s, i) => (
                    <div key={s.ticker} className="flex items-center justify-between p-2 py-1.5 bg-background/30 rounded-lg hover:bg-background/80 border border-border/5 transition-all group">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[10px] font-mono text-muted-foreground/50 w-4 font-normal">{i + 1}.</span>
                            <span className="font-bold text-sm">{s.ticker}</span>
                            <span className="text-[10px] text-muted-foreground/60 truncate max-w-[70px] font-medium">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {metric && (
                                <span className={`text-xs font-mono font-medium ${isPercent && s.metrics[metric] > 0 ? 'text-emerald-400' : isPercent && s.metrics[metric] < 0 ? 'text-rose-400' : 'text-primary/70'}`}>
                                    {formatValue(s.metrics[metric])}
                                </span>
                            )}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onToggle?.(s.ticker, s.name, [title], {
                                        industry: s.metrics.industry,
                                        price: s.metrics.price,
                                        changePercent: s.metrics.changePercent,
                                        pe: s.metrics.pe
                                    })}
                                    className={`p-1 hover:bg-primary/10 rounded-full transition-colors ${watchlist?.some(w => w.ticker === s.ticker) ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary'}`}
                                >
                                    <Star size={12} className={watchlist?.some(w => w.ticker === s.ticker) ? 'fill-primary' : ''} />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="text-xs text-muted-foreground italic p-2">No anomalies found</p>
                )}
            </div>
        </div>
    );
}
