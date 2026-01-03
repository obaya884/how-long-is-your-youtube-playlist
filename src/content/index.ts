/**
 * Entry Point - Observer and Initialization
 * YouTube Playlist Total Duration Extension
 */

import { CONFIG } from './config';
import { debounce, clearDebounceTimeout } from './utils';
import { updateDisplay, injectUI } from './ui';

let updateIntervalId: ReturnType<typeof setInterval> | null = null;
let observer: MutationObserver | null = null;

const debouncedInjectUI = debounce(injectUI, CONFIG.DEBOUNCE_MS);

/**
 * Start observing DOM changes
 */
function startObserver(): void {
    if (observer) return;

    observer = new MutationObserver(() => {
        debouncedInjectUI();
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Start periodic display updates
 */
function startUpdateInterval(): void {
    if (updateIntervalId) return;

    updateIntervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
            updateDisplay();
        }
    }, CONFIG.UPDATE_INTERVAL_MS);
}

/**
 * Cleanup resources
 */
function cleanup(): void {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
    }
    clearDebounceTimeout();
}

/**
 * Initialize the extension
 */
function init(): void {

    setTimeout(injectUI, CONFIG.INITIAL_DELAY_MS);
    startObserver();
    startUpdateInterval();

    window.addEventListener('beforeunload', cleanup);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            updateDisplay();
        }
    });
}

// Start!
init();
