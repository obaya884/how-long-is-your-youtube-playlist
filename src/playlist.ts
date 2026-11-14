/**
 * Reading the playlist page
 *
 * YouTube serves two row layouts: ytd-playlist-video-renderer for playlists
 * the user can edit (Watch Later, own playlists) and yt-lockup-view-model for
 * everything else. Headers come in two layouts as well, independently of the
 * rows. Every function here handles both.
 */

import { SELECTORS } from './config';
import { parseDuration } from './duration';
import { isElementVisible } from './utils';

export function isPlaylistPage(url: string): boolean {
    return new URL(url).pathname === '/playlist';
}

/**
 * The playlist page that is currently shown.
 * YouTube keeps pages it navigated away from in the DOM with a `hidden` attribute.
 */
export function getPlaylistRoot(): Element | null {
    return document.querySelector(SELECTORS.PLAYLIST_ROOT);
}

export function getVideoItems(root: Element): Element[] {
    return Array.from(root.querySelectorAll(SELECTORS.VIDEO_ITEM));
}

/**
 * Last duration read from each row, with the video it belonged to.
 * YouTube removes the duration badge while the pointer is over a thumbnail,
 * and reuses row elements for other videos.
 */
const lastDurations = new WeakMap<Element, { video: string; seconds: number }>();

function getItemDuration(item: Element): number {
    const video = item.querySelector(SELECTORS.VIDEO_LINK)?.getAttribute('href') ?? '';

    for (const badge of item.querySelectorAll(SELECTORS.DURATION_BADGE)) {
        const seconds = parseDuration(badge.textContent);
        if (seconds > 0) {
            lastDurations.set(item, { video, seconds });
            return seconds;
        }
    }

    const last = lastDurations.get(item);
    return last?.video === video ? last.seconds : 0;
}

/**
 * Total duration, in seconds, of the videos loaded so far
 */
export function calculateTotalDuration(root: Element): number {
    return getVideoItems(root).reduce((total, item) => total + getItemDuration(item), 0);
}

/**
 * The marker YouTube puts at the end of the video list while more videos can
 * be loaded. Scrolling it into view loads the next batch. Null when every
 * video is loaded.
 */
export function findContinuation(root: Element): Element | null {
    const list = getVideoItems(root)[0]?.closest(SELECTORS.VIDEO_LIST);
    return list?.querySelector(SELECTORS.CONTINUATION) ?? null;
}

/**
 * Number of videos in the playlist as the header states it, or 0 when it
 * cannot be read. The header text is localized, so this only looks for the
 * first number: in the classic header that is the first byline item, in the
 * page header it is the last metadata row ("Playlist • 18 videos • 1,234 views").
 */
export function getTotalVideosCount(root: Element): number {
    const candidates = [
        root.querySelector(SELECTORS.COUNT_CLASSIC),
        Array.from(root.querySelectorAll(SELECTORS.COUNT_ROWS)).filter(isElementVisible).pop(),
    ];

    for (const el of candidates) {
        if (!el || !isElementVisible(el)) continue;
        const match = el.textContent?.match(/\d[\d.,\s]*/);
        if (match) return parseInt(match[0].replace(/\D/g, ''), 10);
    }
    return 0;
}
