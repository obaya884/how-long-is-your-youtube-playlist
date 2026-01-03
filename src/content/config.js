/**
 * Configuration and Constants
 */

export const CONFIG = {
    DEBUG: false,
    MIN_VIEWPORT_WIDTH: 1080,
    SCROLL_INTERVAL_MS: 1500,
    UPDATE_INTERVAL_MS: 2000,
    INITIAL_DELAY_MS: 1000,
    MAX_NO_CHANGE_COUNT: 3,
    DEBOUNCE_MS: 200
};

export const SELECTORS = {
    // Video duration text: "10:05" inside badge-shape
    DURATION: 'ytd-thumbnail-overlay-time-status-renderer badge-shape div',
    // Container for playlist videos
    PLAYLIST_CONTAINER: 'ytd-playlist-video-list-renderer #contents',
    // Header metadata area
    HEADER_METADATA: 'yt-content-metadata-view-model',
    // Element containing the total number of videos (e.g. "150 videos")
    VIDEO_COUNT: 'yt-content-metadata-view-model .yt-content-metadata-view-model__metadata-row, yt-formatted-string',
    // Playlist video item
    VIDEO_ITEM: 'ytd-playlist-video-renderer'
};

export const INJECTION_TARGETS = [
    // Desktop: Button container (Old Layout / Watch Later)
    {
        selector: '.play-menu.ytd-playlist-header-renderer:not(.small-screen-form)',
        position: 'afterend',
        unique: true
    },
    // Desktop New Layout: Action Buttons Container (Standard Playlists)
    {
        selector: 'yt-flexible-actions-view-model',
        position: 'afterend',
        unique: true
    }
];

export const UI_ID = 'yptd-container';
