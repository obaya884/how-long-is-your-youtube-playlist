/**
 * YouTube Playlist Total Duration Extension
 * Calculates and displays the total duration of YouTube playlists.
 */
(function () {
    'use strict';

    // ===========================================
    // Configuration
    // ===========================================

    const CONFIG = {
        DEBUG: false,
        MIN_VIEWPORT_WIDTH: 1080,
        SCROLL_INTERVAL_MS: 1500,
        UPDATE_INTERVAL_MS: 2000,
        INITIAL_DELAY_MS: 1000,
        MAX_NO_CHANGE_COUNT: 3,
        DEBOUNCE_MS: 200
    };

    const SELECTORS = {
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

    const INJECTION_TARGETS = [
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

    const UI_ID = 'yptd-container';

    // ===========================================
    // State
    // ===========================================

    let isLoadingAll = false;
    let lastLoadedCount = 0;
    let updateIntervalId = null;
    let debounceTimeoutId = null;
    let observer = null;

    // ===========================================
    // Utilities
    // ===========================================

    /**
     * Log message to console (only when DEBUG is enabled)
     * @param {string} message - Log message
     * @param {...any} args - Additional arguments
     */
    function log(message, ...args) {
        if (CONFIG.DEBUG) {
            console.log(`[YPTD] ${message}`, ...args);
        }
    }

    /**
     * Create a debounced version of a function
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(fn, delay) {
        return function (...args) {
            clearTimeout(debounceTimeoutId);
            debounceTimeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Check if an element is visible in the viewport
     * @param {Element} element - DOM element to check
     * @returns {boolean} True if visible
     */
    function isElementVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none';
    }

    // ===========================================
    // Duration Parsing & Formatting
    // ===========================================

    /**
     * Convert "HH:MM:SS" or "MM:SS" to seconds
     * @param {string} timeStr - Time string
     * @returns {number} Total seconds
     */
    function parseDuration(timeStr) {
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
    function formatDuration(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        const hStr = h > 0 ? `${h}:` : '';
        const mStr = m.toString().padStart(h > 0 ? 2 : 1, '0');
        const sStr = s.toString().padStart(2, '0');

        return `${hStr}${mStr}:${sStr}`;
    }

    // ===========================================
    // Video Count & Duration Calculation
    // ===========================================

    /**
     * Extract total video count from metadata text
     * @returns {number} Total video count
     */
    function getTotalVideosCount() {
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
    function getLoadedVideosCount() {
        return document.querySelectorAll(SELECTORS.VIDEO_ITEM).length;
    }

    /**
     * Calculate total duration of all visible videos
     * @returns {number} Total seconds
     */
    function calculateTotalDuration() {
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

    // ===========================================
    // UI Update
    // ===========================================

    /**
     * Update the duration display in all injected panels
     */
    function updateDisplay() {
        // Skip if page is not visible
        if (document.visibilityState !== 'visible') {
            return;
        }

        try {
            const currentLoadedCount = getLoadedVideosCount();

            // Recalculate only if video count changed or first run
            const totalSeconds = calculateTotalDuration();
            const formattedTime = formatDuration(totalSeconds);
            lastLoadedCount = currentLoadedCount;

            const panels = document.querySelectorAll('.' + UI_ID);
            panels.forEach(panel => {
                const durationEl = panel?.querySelector('.yptd-duration');
                if (durationEl) {
                    durationEl.textContent = `Total: ${formattedTime}`;
                }

                const loadBtn = panel?.querySelector('.yptd-load-btn');
                if (loadBtn && !isLoadingAll) {
                    const totalCount = getTotalVideosCount();
                    const loadedCount = currentLoadedCount;

                    if (totalCount > 0 && loadedCount < totalCount) {
                        loadBtn.style.display = 'flex';
                        loadBtn.textContent = `Load All (${totalCount - loadedCount} remaining)`;
                    } else {
                        loadBtn.style.display = 'none';
                    }
                }
            });
        } catch (e) {
            log('Error updating display:', e);
        }
    }

    // ===========================================
    // Load All Feature
    // ===========================================

    /**
     * Scroll through the playlist to load all videos
     */
    async function loadAllVideos() {
        if (isLoadingAll) return;
        isLoadingAll = true;

        const buttons = document.querySelectorAll(`.${UI_ID} .yptd-load-btn`);
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Loading...';
        });

        let previousHeight = 0;
        let noChangeCount = 0;

        const interval = setInterval(() => {
            try {
                const currentHeight = document.documentElement.scrollHeight;
                window.scrollTo(0, currentHeight);

                if (currentHeight === previousHeight) {
                    noChangeCount++;
                } else {
                    noChangeCount = 0;
                    previousHeight = currentHeight;
                }

                if (noChangeCount >= CONFIG.MAX_NO_CHANGE_COUNT) {
                    clearInterval(interval);
                    isLoadingAll = false;
                    updateDisplay();
                    window.scrollTo(0, 0);

                    buttons.forEach(btn => {
                        btn.disabled = false;
                        btn.textContent = 'Load All';
                    });
                }

                updateDisplay();
            } catch (e) {
                log('Error during load all:', e);
                clearInterval(interval);
                isLoadingAll = false;
            }
        }, CONFIG.SCROLL_INTERVAL_MS);
    }

    // ===========================================
    // UI Injection
    // ===========================================

    /**
     * Check if injection should proceed
     * @returns {boolean} True if should inject
     */
    function shouldInject() {
        return window.innerWidth > CONFIG.MIN_VIEWPORT_WIDTH;
    }

    /**
     * Create panel DOM element
     * @returns {HTMLDivElement} Panel element
     */
    function createPanelElement() {
        const panel = document.createElement('div');
        panel.className = UI_ID;
        panel.innerHTML = `
            <span class="yptd-duration">Total: --:--</span>
            <button class="yptd-load-btn" style="display:none;">Load All</button>
        `;
        return panel;
    }

    /**
     * Attach panel to target element
     * @param {Element} target - Target element
     * @param {string} position - Insert position
     * @returns {HTMLDivElement|null} Attached panel or null
     */
    function attachPanel(target, position) {
        const nextNode = target.nextElementSibling;
        if (nextNode?.classList?.contains(UI_ID)) {
            return null; // Already attached
        }

        const panel = createPanelElement();
        target.insertAdjacentElement(position, panel);

        const btn = panel.querySelector('.yptd-load-btn');
        btn?.addEventListener('click', loadAllVideos);

        return panel;
    }

    /**
     * Inject UI panels into the page
     */
    function injectUI() {
        try {
            // Remove panels if viewport too small
            if (!shouldInject()) {
                document.querySelectorAll(`.${UI_ID}`).forEach(el => el.remove());
                return;
            }

            INJECTION_TARGETS.forEach(targetSpec => {
                const elements = document.querySelectorAll(targetSpec.selector);
                let hasInjected = false;

                elements.forEach(element => {
                    if (targetSpec.unique && hasInjected) return;
                    if (!isElementVisible(element)) return;

                    const panel = attachPanel(element, targetSpec.position);
                    if (panel) {
                        hasInjected = true;
                        updateDisplay();
                    } else if (targetSpec.unique) {
                        // Already injected counts as "done" for unique selectors
                        hasInjected = true;
                    }
                });
            });
        } catch (e) {
            log('Error injecting UI:', e);
        }
    }

    // ===========================================
    // Observer & Initialization
    // ===========================================

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
        if (debounceTimeoutId) {
            clearTimeout(debounceTimeoutId);
            debounceTimeoutId = null;
        }
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
