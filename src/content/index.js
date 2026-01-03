/**
 * Entry Point - Observer and Initialization
 * YouTube Playlist Total Duration Extension
 */

import { CONFIG } from './config.js';
import { log, debounce, clearDebounceTimeout } from './utils.js';
import { updateDisplay, injectUI } from './ui.js';

let updateIntervalId = null;
let observer = null;

const debouncedInjectUI = debounce(injectUI, CONFIG.DEBOUNCE_MS);

/**
 * Start observing DOM changes
 */
function startObserver() {
    if (observer) return;

    observer = new MutationObserver(() => {
        debouncedInjectUI();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    log('Observer started');
}

/**
 * Start periodic display updates
 */
function startUpdateInterval() {
    if (updateIntervalId) return;

    updateIntervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
            updateDisplay();
        }
    }, CONFIG.UPDATE_INTERVAL_MS);

    log('Update interval started');
}

/**
 * Cleanup resources
 */
function cleanup() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
    }
    clearDebounceTimeout();
    log('Cleanup complete');
}

/**
 * Initialize the extension
 */
function init() {
    log('YouTube Playlist Total Duration extension loaded.');

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
