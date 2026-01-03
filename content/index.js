/**
 * Entry Point - Observer and Initialization
 * YouTube Playlist Total Duration Extension
 */

(function () {
    'use strict';

    const YPTD = window.YPTD;
    const { log, debounce, clearDebounceTimeout } = YPTD.utils;
    const { updateDisplay, injectUI } = YPTD.ui;
    const { CONFIG } = YPTD;

    // State
    let updateIntervalId = null;
    let observer = null;

    /**
     * Handle mutations with debouncing
     */
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

        // Initial injection after delay
        setTimeout(injectUI, CONFIG.INITIAL_DELAY_MS);

        // Start observer and update interval
        startObserver();
        startUpdateInterval();

        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanup);

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                updateDisplay();
            }
        });
    }

    // Start!
    init();

})();
