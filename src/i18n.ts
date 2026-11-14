/**
 * UI text
 */

import en from '../_locales/en/messages.json';

export type MessageKey = 'totalLabel' | 'loadAll' | 'loadAllRemaining' | 'stopLoading';

interface LocaleMessage {
    message: string;
    placeholders?: Record<string, { content: string }>;
}

declare const chrome: { i18n?: { getMessage(key: string, substitutions?: string[]): string } } | undefined;

/**
 * English text built from _locales/en, the way chrome.i18n would build it
 */
function fallback(key: MessageKey, substitutions: string[]): string {
    const { message, placeholders = {} }: LocaleMessage = en[key];
    return message
        .replace(/\$(\w+)\$/g, (whole, name: string) => placeholders[name.toLowerCase()]?.content ?? whole)
        .replace(/\$(\d)/g, (_, index: string) => substitutions[Number(index) - 1] ?? '');
}

/**
 * Message in the browser's language.
 * Falls back to English when the extension API is gone, which happens on
 * pages left open while the extension is updated or reloaded.
 */
export function t(key: MessageKey, ...substitutions: string[]): string {
    try {
        const message = typeof chrome !== 'undefined' ? chrome?.i18n?.getMessage(key, substitutions) : '';
        if (message) return message;
    } catch {
        // Extension context invalidated
    }
    return fallback(key, substitutions);
}
