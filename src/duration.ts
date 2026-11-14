/**
 * Duration text <-> seconds
 */

/**
 * Convert "H:MM:SS" or "M:SS" to seconds.
 * Anything else (a "LIVE" badge, an empty badge) counts as 0.
 */
export function parseDuration(timeStr: string | null | undefined): number {
    if (!timeStr) return 0;

    const parts = timeStr.trim().split(':');
    if (parts.length < 2 || parts.length > 3) return 0;
    if (!parts.every(part => /^\d+$/.test(part))) return 0;

    return parts.reduce((seconds, part) => seconds * 60 + Number(part), 0);
}

/**
 * Convert seconds to "HH:MM:SS"
 */
export function formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return [h, m, s].map(n => n.toString().padStart(2, '0')).join(':');
}
