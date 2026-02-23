"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User, Activity, PieChart, MessageSquare } from "lucide-react";

export function Header() {
    const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full max-w-md bg-background/95 backdrop-blur z-50 border-b border-border px-4 md:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src="/logo_fizenhive1.png" alt="FizenHive Logo" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <h1 className="text-xl font-bold tracking-tight">FizenHive</h1>
            </div>
            <div className="relative">
                <button
                    onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors border border-border/50 text-foreground"
                    aria-label="Navigation Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {isNavMenuOpen && (
                    <>
                        {/* Invisible backdrop for closing when clicking outside */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsNavMenuOpen(false)}
                        ></div>

                        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg flex flex-col p-2 z-50">
                            <Link
                                href="/"
                                onClick={() => setIsNavMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <User className="w-4 h-4 text-muted-foreground" />
                                Portfolio
                            </Link>
                            <Link
                                href="/my-analysis"
                                onClick={() => setIsNavMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <PieChart className="w-4 h-4 text-muted-foreground" />
                                Analysis
                            </Link>
                            <Link
                                href="/screener"
                                onClick={() => setIsNavMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <Activity className="w-4 h-4 text-muted-foreground" />
                                Screener
                            </Link>
                            <div className="h-px bg-border my-1 mx-2"></div>
                            <Link
                                href="/chat"
                                onClick={() => setIsNavMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                AI Assistant
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
