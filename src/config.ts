/**
 * Configuration and Constants
 */

export interface Config {
    MIN_VIEWPORT_WIDTH: number;
    SCROLL_INTERVAL_MS: number;
    UPDATE_INTERVAL_MS: number;
    INITIAL_DELAY_MS: number;
    MAX_NO_CHANGE_COUNT: number;
    DEBOUNCE_MS: number;
}

export interface Selectors {
    DURATION: string;
    VIDEO_COUNT: string;
    VIDEO_ITEM: string;
}

export interface InjectionTarget {
    selector: string;
    position: InsertPosition;
    unique: boolean;
}

export const CONFIG: Config = {
    MIN_VIEWPORT_WIDTH: 1080,
    SCROLL_INTERVAL_MS: 1500,
    UPDATE_INTERVAL_MS: 2000,
    INITIAL_DELAY_MS: 1000,
    MAX_NO_CHANGE_COUNT: 5,
    DEBOUNCE_MS: 200
};

export const SELECTORS: Selectors = {
    DURATION: 'ytd-thumbnail-overlay-time-status-renderer badge-shape div',
    VIDEO_COUNT: 'yt-content-metadata-view-model .yt-content-metadata-view-model__metadata-row, yt-formatted-string',
    VIDEO_ITEM: 'ytd-playlist-video-renderer'
};

export const INJECTION_TARGETS: InjectionTarget[] = [
    {
        selector: '.play-menu.ytd-playlist-header-renderer:not(.small-screen-form)',
        position: 'afterend',
        unique: true
    },
    {
        selector: 'yt-flexible-actions-view-model',
        position: 'afterend',
        unique: true
    }
];

export const UI_ID = 'yptd-container';
