
export type GuestFeature = 'analysis' | 'screener' | 'chat' | 'lab';

const GUEST_LIMITS: Record<GuestFeature, number> = {
    analysis: 3,
    screener: 5,
    chat: 5,
    lab: 5
};

const STORAGE_KEY = 'fizenhive_guest_usage';

interface GuestUsage {
    analysis: number;
    screener: number;
    chat: number;
    lab: number;
}

export function getGuestUsage(): GuestUsage {
    if (typeof window === 'undefined') return { analysis: 0, screener: 0, chat: 0, lab: 0 };

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { analysis: 0, screener: 0, chat: 0, lab: 0 };

    try {
        const parsed = JSON.parse(stored);
        if (parsed.lab === undefined) parsed.lab = 0; // Migrating old data
        return parsed as GuestUsage;
    } catch (e) {
        return { analysis: 0, screener: 0, chat: 0, lab: 0 };
    }
}

export function incrementGuestUsage(feature: GuestFeature) {
    if (typeof window === 'undefined') return;

    const usage = getGuestUsage();
    usage[feature] = (usage[feature] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function isGuestLimitReached(feature: GuestFeature): boolean {
    const usage = getGuestUsage();
    return usage[feature] >= GUEST_LIMITS[feature];
}

export function getRemainingGuestActions(feature: GuestFeature): number {
    const usage = getGuestUsage();
    return Math.max(0, GUEST_LIMITS[feature] - (usage[feature] || 0));
}
