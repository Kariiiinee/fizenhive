"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp, Shield, Activity, Target, Search, Filter,
    ArrowUpRight, ArrowDownRight, Loader2, Globe, Boxes,
    Beaker, Zap, BarChart3, Star, Clock, Info,
    Tag, Banknote, Rocket, TrendingDown, UserCheck, BarChart2
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
    const [supabase] = useState(() => createClient());

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
        fetchData(activeCountry);
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
                                onClick={() => setActiveCountry(c)}
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

                {/* Background Decoration */}
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
                                    {t('lab.sections.smallCaps.title')}
                                </h2>
                                <p className="text-muted-foreground">{t('lab.sections.smallCaps.description')}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.smallCaps.length > 0 ? (
                                    data.smallCaps.map((stock, i) => (
                                        <DiscoveryCard key={stock.ticker} stock={stock} type="small_cap" index={i} />
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
                                        <DiscoveryCard key={stock.ticker} stock={stock} type="outlier" index={i} />
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Biggest Improvers Section */}
                        <section>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <TrendingUp className="text-pink-500" />
                                    {t('lab.sections.improvers.title')}
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
                                                <button className="p-1.5 hover:bg-primary/10 rounded-full text-muted-foreground/40 hover:text-primary transition-colors">
                                                    <Star size={14} />
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
                                    {t('lab.sections.curiosity.title')}
                                </h2>
                                <p className="text-muted-foreground mb-8">{t('lab.sections.curiosity.description')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <RadarList icon={Tag} title="Lowest EV/EBITDA" items={data.radar.cheapestEV} metric="evToEbitda" />
                                <RadarList icon={Banknote} title="Highest FCF Yield" items={data.radar.highestFCF} metric="fcfYield" isPercent />
                                <RadarList icon={Rocket} title="Growth Under $1B" items={data.radar.fastestGrowthSmallCap} metric="revGrowth" isPercent />
                                <RadarList icon={TrendingDown} title="6-Month Laggards" items={data.radar.underperformers} metric="priceChange6m" isPercent />
                                <RadarList icon={UserCheck} title="Insider Buying" items={data.radar.insiderBuying} metric="insiderBuying" isCompact />
                                <RadarList icon={BarChart2} title="Volume Spikes" items={data.radar.volumeSpikes} metric="volumeSurge" />
                            </div>
                        </section>

                        {/* Watchlist Section */}
                        <section className="bg-gradient-to-br from-primary/5 to-secondary/20 p-8 rounded-3xl border border-primary/10">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Star className="text-primary fill-primary" />
                                    {t('lab.sections.watchlist.title')}
                                </h2>
                                <p className="text-muted-foreground">{t('lab.sections.watchlist.description')}</p>
                            </div>
                            <WatchlistTracker />
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

function WatchlistTracker() {
    const { t } = useTranslation();
    const [watchlist, setWatchlist] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mocking watchlist for now or fetching from Supabase if ready
        const fetchWatchlist = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data } = await supabase
                    .from('lab_watchlist')
                    .select('*, lab_stocks(*)')
                    .eq('user_id', user.id);
                setWatchlist(data || []);
            } else {
                // Guests use localStorage
                const local = localStorage.getItem('fizenhive_lab_watchlist');
                setWatchlist(local ? JSON.parse(local) : []);
            }
            setIsLoading(false);
        };
        fetchWatchlist();
    }, []);

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {watchlist.length > 0 ? watchlist.map((item) => (
                <div key={item.ticker} className="flex items-center justify-between p-4 bg-background/80 backdrop-blur rounded-2xl border border-border/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary">
                            {item.ticker[0]}
                        </div>
                        <div>
                            <p className="font-bold">{item.ticker}</p>
                            <div className="flex gap-1 mt-1">
                                {(item.tags || []).map((tag: string) => (
                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground font-medium">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Link href={`/analysis?symbol=${item.ticker}`} className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                        <ArrowUpRight size={20} className="text-primary" />
                    </Link>
                </div>
            )) : (
                <div className="lg:col-span-2 text-center py-12 border-2 border-dashed border-primary/20 rounded-2xl">
                    <p className="text-muted-foreground text-sm italic">Your watchlist is currently empty. Star stocks to track them here.</p>
                </div>
            )}
        </div>
    );
}

function DiscoveryCard({ stock, type, index }: { stock: any, type: string, index: number }) {
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
                <button className="p-2 hover:bg-primary/10 rounded-full text-muted-foreground hover:text-primary transition-colors">
                    <Star size={18} />
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
    isCompact
}: {
    title: string,
    icon: any,
    items: any[],
    metric?: string,
    isPercent?: boolean,
    isCompact?: boolean
}) {
    const formatValue = (val: any) => {
        if (val === null || val === undefined) return '-';
        if (isPercent) return `${(val).toFixed(1)}%`;
        if (Math.abs(val) > 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (Math.abs(val) > 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(2);
    };

    return (
        <div className="p-1 px-0 border-border/10">
            <h3 className="font-bold mb-4 text-emerald-500/90 text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Icon size={16} /> {title}</span>
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
                                <button className="p-1 hover:bg-primary/10 rounded-full text-muted-foreground/40 hover:text-primary transition-colors">
                                    <Star size={12} />
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
