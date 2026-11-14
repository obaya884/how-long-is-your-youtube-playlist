/**
 * Configuration and Constants
 */

export const CONFIG = {
    /** The panel is not shown in the narrow layout */
    MIN_VIEWPORT_WIDTH: 1080,
    /** Wait this long after the last DOM change before refreshing the panel */
    DEBOUNCE_MS: 200,
    /** How often "Load All" checks progress and scrolls to the next batch */
    LOAD_POLL_MS: 500,
    /** "Load All" gives up when no new video appears for this long */
    LOAD_STALL_MS: 8000,
} as const;

export const SELECTORS = {
    PLAYLIST_ROOT: 'ytd-browse[page-subtype="playlist"]:not([hidden])',
    VIDEO_ITEM: 'ytd-playlist-video-renderer, yt-item-section-renderer yt-lockup-view-model',
    VIDEO_LIST: 'ytd-playlist-video-list-renderer, yt-item-section-renderer',
    DURATION_BADGE: 'badge-shape',
    VIDEO_LINK: 'a[href*="/watch"]',
    CONTINUATION: 'ytd-continuation-item-renderer, yt-continuation-item-view-model',
    COUNT_CLASSIC: 'ytd-playlist-byline-renderer .byline-item',
    COUNT_ROWS: 'yt-page-header-view-model .ytContentMetadataViewModelMetadataRow',
    /** The panel goes right after the first visible one of these */
    INJECTION_TARGETS: [
        '.play-menu.ytd-playlist-header-renderer:not(.small-screen-form)',
        'yt-page-header-view-model yt-flexible-actions-view-model',
    ],
} as const;

export const PANEL_CLASS = 'yptd-container';
