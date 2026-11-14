/**
 * Utility Functions
 */

export interface Debounced {
    (): void;
    cancel(): void;
}

/**
 * Run `fn` once, `delay` ms after the last call
 */
export function debounce(fn: () => void, delay: number): Debounced {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounced = (): void => {
        debounced.cancel();
        timeoutId = setTimeout(() => {
            timeoutId = null;
            fn();
        }, delay);
    };
    debounced.cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };
    return debounced;
}

/**
 * Whether an element takes up space on the page
 */
export function isElementVisible(element: Element | null | undefined): boolean {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';
}
