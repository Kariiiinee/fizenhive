"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, User, Activity, PieChart, MessageSquare, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/login/actions";

export function Header() {
    const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <header className="fixed top-0 w-full left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur z-50 border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <img src="/logo_fizenhive1.png" alt="FizenHive Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                    <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">FizenHive</h1>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Portfolio</Link>
                    <Link href="/analysis" className="text-sm font-medium hover:text-primary transition-colors">Analysis</Link>
                    <Link href="/screener" className="text-sm font-medium hover:text-primary transition-colors">Screener</Link>
                    <Link href="/chat" className="text-sm font-medium hover:text-primary transition-colors">AI Assistant</Link>
                </nav>

                <div className="relative">
                    <button
                        onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                        className="h-10 px-3 rounded-full flex items-center gap-2 bg-muted/50 hover:bg-muted transition-all border border-border/50 text-foreground"
                        aria-label="Navigation Menu"
                    >
                        <Menu className="w-5 h-5" />
                        {user && (
                            <div className="hidden sm:block w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {user.email?.[0].toUpperCase()}
                            </div>
                        )}
                    </button>

                    {isNavMenuOpen && (
                        <>
                            {/* Invisible backdrop for closing when clicking outside */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsNavMenuOpen(false)}
                            ></div>

                            <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl flex flex-col p-2 z-50 animate-in fade-in zoom-in duration-200">
                                {user && (
                                    <div className="px-3 py-3 mb-2 border-b border-border/50">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Logged in as</p>
                                        <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                                    </div>
                                )}
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
                                <Link
                                    href="/chat"
                                    onClick={() => setIsNavMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                    AI Assistant
                                </Link>

                                {user ? (
                                    <>
                                        <div className="h-px bg-border my-2 mx-2"></div>
                                        <form action={logout}>
                                            <button
                                                type="submit"
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsNavMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
