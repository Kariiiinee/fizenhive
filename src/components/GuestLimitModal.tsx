
"use client";

import { X, Sparkles, Bot, ShieldAlert, LogIn } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface GuestLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: 'analysis' | 'screener' | 'chat';
}

export function GuestLimitModal({ isOpen, onClose, feature }: GuestLimitModalProps) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const featureIcon = {
        analysis: <Sparkles className="w-8 h-8 text-primary" />,
        screener: <ShieldAlert className="w-8 h-8 text-primary" />,
        chat: <Bot className="w-8 h-8 text-primary" />
    }[feature];

    const featureTitle = t(`limits.${feature}.title`);
    const featureDesc = t(`limits.${feature}.description`);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-card w-full max-w-md border border-border rounded-3xl shadow-2xl relative z-[101] overflow-hidden"
                    >
                        {/* Premium Glow Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

                        <div className="p-8 flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-2 transform rotate-3">
                                <div className="transform -rotate-3 text-primary animate-pulse">
                                    {featureIcon}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                    {featureTitle}
                                </h2>
                                <p className="text-muted-foreground text-sm leading-relaxed px-4">
                                    {featureDesc}
                                </p>
                            </div>

                            <div className="w-full flex flex-col gap-3 pt-4">
                                <Link
                                    href="/login"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <LogIn className="w-5 h-5" />
                                    {t('limits.loginButton')}
                                </Link>
                                <button
                                    onClick={onClose}
                                    className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-4 rounded-2xl transition-all active:scale-[0.98]"
                                >
                                    {t('limits.maybeLater')}
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
