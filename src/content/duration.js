/**
 * Duration Calculation Logic
 */

import { SELECTORS } from './config.js';
import { log } from './utils.js';

/**
 * Convert "HH:MM:SS" or "MM:SS" to seconds
 * @param {string} timeStr - Time string
 * @returns {number} Total seconds
 */
export function parseDuration(timeStr) {
    if (!timeStr) return 0;
    try {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
    } catch (e) {
        log('Error parsing duration:', timeStr, e);
    }
    return 0;
}

/**
 * Convert seconds to "HH:MM:SS" or "MM:SS" format
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Formatted time string
 */
export function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const hStr = h > 0 ? `${h}:` : '';
    const mStr = m.toString().padStart(h > 0 ? 2 : 1, '0');
    const sStr = s.toString().padStart(2, '0');

    return `${hStr}${mStr}:${sStr}`;
}

/**
 * Extract total video count from metadata text
 * @returns {number} Total video count
 */
export function getTotalVideosCount() {
    try {
        const metadataRows = document.querySelectorAll(SELECTORS.VIDEO_COUNT);
        for (const row of metadataRows) {
            const text = row?.textContent || '';
            if (text.includes('本の動画') || text.includes('videos')) {
                const match = text.match(/([\d,]+)/);
                if (match) {
                    return parseInt(match[1].replace(/,/g, ''), 10);
                }
            }
        }
    } catch (e) {
        log('Error getting total video count:', e);
    }
    return 0;
}

/**
 * Get the count of video elements currently in DOM
 * @returns {number} Loaded video count
 */
export function getLoadedVideosCount() {
    return document.querySelectorAll(SELECTORS.VIDEO_ITEM).length;
}

/**
 * Calculate total duration of all visible videos
 * @returns {number} Total seconds
 */
export function calculateTotalDuration() {
    try {
        const durationElements = document.querySelectorAll(SELECTORS.DURATION);
        let totalSeconds = 0;

        durationElements.forEach(el => {
            totalSeconds += parseDuration(el?.textContent?.trim());
        });

        return totalSeconds;
    } catch (e) {
        log('Error calculating total duration:', e);
        return 0;
    }
}
