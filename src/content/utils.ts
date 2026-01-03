/**
 * Utility Functions
 */

import { CONFIG } from './config';

let debounceTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Log message to console (only when DEBUG is enabled)
 */
export function log(message: string, ...args: unknown[]): void {
    if (CONFIG.DEBUG) {
        console.log(`[YPTD] ${message}`, ...args);
    }
}

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    return function (this: unknown, ...args: Parameters<T>): void {
        if (debounceTimeoutId) {
            clearTimeout(debounceTimeoutId);
        }
        debounceTimeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Check if an element is visible in the viewport
 */
export function isElementVisible(element: Element | null): boolean {
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
export function clearDebounceTimeout(): void {
    if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId);
        debounceTimeoutId = null;
    }
}
