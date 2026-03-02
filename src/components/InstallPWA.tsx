"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/i18n";

export function InstallPWA() {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsStandalone(true);
            return;
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // If it's iOS and not standalone, show the button
        if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isIOS) {
            setShowIOSPrompt(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            try {
                const choiceResult = await deferredPrompt.userChoice;
                if (choiceResult && choiceResult.outcome === 'accepted') {
                    setDeferredPrompt(null);
                    setIsVisible(false);
                }
            } catch (err) {
                console.error("PWA Install Error:", err);
            }
        }
    };

    if (!isVisible || isStandalone) return null;

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors w-full text-left"
            >
                <Download className="w-4 h-4" />
                {t('pwa.install')}
            </button>

            {showIOSPrompt && typeof document !== 'undefined' && createPortal(
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[320px] z-[99999] animate-in slide-in-from-bottom-5 duration-500">
                    <div
                        className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-foreground relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <img src="/logo_fizenhive1.png" alt="" className="w-6 h-6 grayscale opacity-80" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold leading-tight mb-2">{t('pwa.install')}</h3>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                            <Share className="w-3 h-3 text-primary" />
                                            <span>{t('pwa.tapShare')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                            <PlusSquare className="w-3 h-3 text-primary" />
                                            <span>{t('pwa.addToHome')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowIOSPrompt(false)}
                                className="shrink-0 p-1.5 hover:bg-muted rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowIOSPrompt(false)}
                            className="w-full mt-4 py-2 bg-primary text-primary-foreground text-[11px] font-bold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            {t('pwa.gotIt')}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
