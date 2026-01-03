/**
 * Utility Functions
 * YouTube Playlist Total Duration Extension
 */

(function () {
    'use strict';

    const YPTD = window.YPTD;

    // State for debounce
    let debounceTimeoutId = null;

    /**
     * Log message to console (only when DEBUG is enabled)
     * @param {string} message - Log message
     * @param {...any} args - Additional arguments
     */
    function log(message, ...args) {
        if (YPTD.CONFIG.DEBUG) {
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

    /**
     * Clear debounce timeout
     */
    function clearDebounceTimeout() {
        if (debounceTimeoutId) {
            clearTimeout(debounceTimeoutId);
            debounceTimeoutId = null;
        }
    }

    // Export to namespace
    YPTD.utils = {
        log,
        debounce,
        isElementVisible,
        clearDebounceTimeout
    };

})();
