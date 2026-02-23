"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, ArrowRight, ShieldAlert, TrendingUp, Sparkles, Trash2, ShieldCheck, BookmarkX, Calendar, X, Bot, AlertTriangle, Download, FileText } from "lucide-react";
import { format } from "date-fns";

export default function MyAnalysisPage() {
    const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
    const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

    useEffect(() => {
        // Load saved analyses from local storage
        const loadSaved = () => {
            const data = localStorage.getItem("my_fizenhive_analysis");
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    // Ensure it's an array
                    if (Array.isArray(parsed)) {
                        // Sort by date descending
                        const sorted = parsed.sort((a, b) => {
                            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                            return dateB - dateA;
                        });
                        setSavedAnalyses(sorted);
                    }
                } catch (e) {
                    console.error("Failed to parse saved analysis", e);
                }
            }
        };

        loadSaved();

        // Listen to storage events mapping to same key to update on the fly natively
        window.addEventListener("storage", loadSaved);
        return () => window.removeEventListener("storage", loadSaved);
    }, []);

    const deleteAnalysis = (ticker: string) => {
        const confirmDelete = confirm(`Are you sure you want to delete ${ticker} from your saved analyses?`);
        if (!confirmDelete) return;

        const updated = savedAnalyses.filter(item => item.ticker !== ticker);
        setSavedAnalyses(updated);
        localStorage.setItem("my_fizenhive_analysis", JSON.stringify(updated));

        // Dispatch event for other listeners intentionally
        window.dispatchEvent(new Event("storage"));
        if (selectedAnalysis?.ticker === ticker) {
            setSelectedAnalysis(null);
        }
    };

    // Group analyses by Month and Year
    const groupedAnalyses = savedAnalyses.reduce((acc, analysis) => {
        const date = analysis.timestamp ? new Date(analysis.timestamp) : new Date();
        const monthYear = format(date, "MMMM yyyy");
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(analysis);
        return acc;
    }, {} as Record<string, any[]>);

    const downloadAllAsCSV = () => {
        if (!savedAnalyses || savedAnalyses.length === 0) return;

        const headers = ["Ticker", "Name", "Date Saved", "Price", "Intrinsic Value", "Margin of Safety", "Quality Score", "Takeaway", "Context", "Risks"];

        const rows = savedAnalyses.map(analysis => {
            const dateStr = analysis.timestamp ? format(new Date(analysis.timestamp), "yyyy-MM-dd HH:mm") : "N/A";
            const price = analysis.insightsData?.company_info?.price?.toFixed(2) || "N/A";
            const intrinsicValue = analysis.insightsData?.intrinsic_value?.final > 0 ? analysis.insightsData.intrinsic_value.final.toFixed(2) : "N/A";
            const mos = analysis.insightsData?.margin_of_safety ? `${analysis.insightsData.margin_of_safety.toFixed(0)}%` : "N/A";
            const quality = analysis.insightsData?.quality_score ? `${analysis.insightsData.quality_score}/5` : "N/A";
            const takeawayStr = typeof analysis.insightsData?.takeaway === 'string' ? analysis.insightsData.takeaway : "";
            const takeaway = takeawayStr ? `"${takeawayStr.replace(/"/g, '""')}"` : "N/A";

            const contextStr = typeof analysis.insightsData?.context === 'string' ? analysis.insightsData.context : "";
            const context = contextStr ? `"${contextStr.replace(/"/g, '""')}"` : "N/A";

            const risksArray = Array.isArray(analysis.insightsData?.risk_flags) ? analysis.insightsData.risk_flags : [];
            const risks = risksArray.length > 0 ? `"${risksArray.join("; ").replace(/"/g, '""')}"` : "None";

            return [
                analysis.ticker,
                `"${analysis.name || ""}"`,
                dateStr,
                price,
                intrinsicValue,
                mos,
                quality,
                takeaway,
                context,
                risks
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const filename = `FizenHive_MyAnalysis_${new Date().toISOString().split('T')[0]}.csv`;



        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    const downloadAsPDF = () => {
        window.print();
    };

    return (
        <div className="pt-20 p-4 pb-24 space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:block">
            <header className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Bookmark className="w-8 h-8 text-primary" />
                            My Analysis
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your collection of saved AI value investments and insights.
                        </p>
                    </div>
                    {savedAnalyses.length > 0 && (
                        <div className="flex items-center gap-2 print-hidden">
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); downloadAllAsCSV(); }}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5" /> CSV
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); downloadAsPDF(); }}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
                            >
                                <FileText className="w-3.5 h-3.5" /> PDF
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {savedAnalyses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-xl shadow-sm h-64">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <BookmarkX className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">No Saved Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        You haven't saved any AI insights yet. Head over to the Analysis page to discover valuable companies.
                    </p>
                    <Link
                        href="/analysis"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full px-6 py-2.5 transition-colors flex items-center gap-2 shadow-md w-full max-w-[200px] justify-center"
                    >
                        Go to Analysis
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedAnalyses).map(([monthYear, analyses]) => (
                        <div key={monthYear} className="space-y-4">
                            <h2 className="text-lg font-bold text-foreground border-b border-border/50 pb-2">{monthYear}</h2>
                            <div className="space-y-4">
                                {(analyses as any[]).map((analysis: any, idx: number) => {
                                    const date = analysis.timestamp ? new Date(analysis.timestamp) : new Date();
                                    return (
                                        <div key={`${analysis.ticker}-${idx}`} className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                                            {/* Header Section */}
                                            <div className="flex justify-between items-start mb-3 border-b border-border/50 pb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xl font-bold text-foreground">{analysis.ticker}</h3>
                                                    </div>
                                                    {analysis.name && <p className="text-xs text-muted-foreground line-clamp-1">{analysis.name}</p>}
                                                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {format(date, "MMM dd, yyyy")}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedAnalysis(analysis)}
                                                        className="text-xs bg-secondary/50 hover:bg-secondary text-secondary-foreground font-medium px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                                    >
                                                        View Data
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAnalysis(analysis.ticker)}
                                                        className="text-muted-foreground hover:text-destructive p-1.5 transition-colors rounded-md hover:bg-destructive/10"
                                                        title="Delete saved analysis"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Metrics Snapshot */}
                                            {analysis.insightsData ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <div className="bg-background rounded-lg p-1.5 border border-border flex flex-col justify-center items-center text-center">
                                                            <p className="text-[9px] text-muted-foreground font-medium mb-0.5 uppercase tracking-wider">
                                                                Price
                                                            </p>
                                                            <p className="font-bold text-[13px]">
                                                                ${analysis.insightsData.company_info?.price?.toFixed(2) || "---"}
                                                            </p>
                                                        </div>
                                                        <div className="bg-background/50 rounded-lg p-1.5 border border-border flex flex-col justify-center items-center text-center relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/40"></div>
                                                            <p className="text-[9px] text-muted-foreground font-medium mb-0.5 uppercase tracking-wider">
                                                                Value
                                                            </p>
                                                            <p className="font-bold text-[13px] text-primary">
                                                                ${analysis.insightsData.intrinsic_value?.final > 0 ? analysis.insightsData.intrinsic_value.final.toFixed(2) : "N/A"}
                                                            </p>
                                                        </div>
                                                        <div className={`bg-background/50 rounded-lg p-1.5 border border-border flex flex-col justify-center items-center text-center relative overflow-hidden`}>
                                                            <div className={`absolute top-0 left-0 w-full h-0.5 ${analysis.insightsData.margin_of_safety > 0 ? 'bg-primary/40' : 'bg-destructive/40'}`}></div>
                                                            <p className="text-[9px] text-muted-foreground font-medium mb-0.5 uppercase tracking-wider">
                                                                MOS
                                                            </p>
                                                            <p className={`font-bold text-[13px] ${analysis.insightsData.margin_of_safety > 0 ? "text-primary" : "text-destructive"}`}>
                                                                {analysis.insightsData.margin_of_safety?.toFixed(0) || 0}%
                                                            </p>
                                                        </div>
                                                        <div className="bg-background rounded-lg p-1.5 border border-border flex flex-col justify-center items-center text-center relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-0.5">
                                                                <Sparkles className="w-2 h-2 text-yellow-500" />
                                                            </div>
                                                            <p className="text-[9px] text-muted-foreground font-medium mb-0.5 uppercase tracking-wider">
                                                                Qual
                                                            </p>
                                                            <div className="flex items-baseline gap-0.5">
                                                                <p className="font-bold text-[13px]">{analysis.insightsData.quality_score}</p>
                                                                <p className="text-[9px] text-muted-foreground">/5</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Print / PDF Only - Full AI Details */}
                                                    <div className="hidden print:block mt-4 space-y-2 border-t border-border/50 pt-3">
                                                        <div className="text-[10px] text-foreground/90">
                                                            <span className="font-semibold text-primary">Takeaway:</span> {analysis.insightsData.takeaway}
                                                        </div>
                                                        <div className="text-[10px] text-foreground/90">
                                                            <span className="font-semibold text-muted-foreground">Context:</span> {analysis.insightsData.context}
                                                        </div>
                                                        {analysis.insightsData.risk_flags && analysis.insightsData.risk_flags.length > 0 && (
                                                            <div className="text-[10px] text-destructive/90">
                                                                <span className="font-semibold text-destructive">Risks:</span> {analysis.insightsData.risk_flags.join("; ")}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                                                    Insight data unavailable.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Full Data Modal */}
            {selectedAnalysis && selectedAnalysis.insightsData && (
                <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-border flex flex-col">
                        <div className="p-5 border-b border-border sticky top-0 bg-card/95 backdrop-blur-sm flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {selectedAnalysis.ticker} Analysis
                                </h2>
                                <p className="text-xs text-muted-foreground">{selectedAnalysis.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAnalysis(null)}
                                className="bg-muted hover:bg-muted/80 p-2 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-6">
                            <div className="bg-gradient-to-br from-card to-card border border-primary/20 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                <div className="flex items-center gap-2 mb-4">
                                    <Bot className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        AI Value Analysis
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background rounded-xl p-3 border border-border">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                <TrendingUp className="w-3 h-3 text-primary" /> Intrinsic Value
                                            </p>
                                            <p className="font-bold text-foreground text-lg">
                                                ${selectedAnalysis.insightsData.intrinsic_value?.final > 0 ? selectedAnalysis.insightsData.intrinsic_value.final.toFixed(2) : "N/A"}
                                            </p>
                                            <p className={`text-xs mt-1 ${selectedAnalysis.insightsData.margin_of_safety > 0 ? "text-primary" : "text-destructive"}`}>
                                                MOS: {selectedAnalysis.insightsData.margin_of_safety.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="bg-background rounded-xl p-3 border border-border">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                <Sparkles className="w-3 h-3 text-yellow-500" /> Quality Score
                                            </p>
                                            <div className="flex items-end gap-1">
                                                <p className="font-bold text-foreground text-lg">{selectedAnalysis.insightsData.quality_score}</p>
                                                <p className="text-xs text-muted-foreground pb-1">/ 5</p>
                                            </div>
                                            <div className="flex gap-1 mt-1.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <div key={star} className={`flex-1 h-1.5 rounded-full ${star <= selectedAnalysis.insightsData.quality_score ? "bg-primary" : "bg-muted"}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                        <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                            <p><span className="font-semibold text-primary">Takeaway:</span> {selectedAnalysis.insightsData.takeaway}</p>
                                            <p><span className="font-semibold text-muted-foreground">Context:</span> {selectedAnalysis.insightsData.context}</p>
                                        </div>
                                    </div>
                                    {selectedAnalysis.insightsData.risk_flags && selectedAnalysis.insightsData.risk_flags.length > 0 && (
                                        <div className="mt-3">
                                            <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-2">
                                                <AlertTriangle className="w-3 h-3 text-destructive" /> Identified Risks
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {selectedAnalysis.insightsData.risk_flags.map((flag: string, i: number) => (
                                                    <li key={i} className="text-xs text-destructive/90 flex items-start gap-1.5 bg-destructive/10 px-2.5 py-1.5 rounded-md">
                                                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                        <span>{flag}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
