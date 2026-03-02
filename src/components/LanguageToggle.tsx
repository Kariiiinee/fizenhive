"use client";

import { useTranslation } from "@/lib/i18n";

export function LanguageToggle() {
    const { language, setLanguage } = useTranslation();

    return (
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/50">
            <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-[10px] font-bold rounded-full transition-all ${language === 'en'
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('fr')}
                className={`px-2 py-1 text-[10px] font-bold rounded-full transition-all ${language === 'fr'
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                FR
            </button>
        </div>
    );
}
