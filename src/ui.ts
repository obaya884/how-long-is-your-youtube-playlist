/**
 * The panel in the playlist header
 */

import { PANEL_CLASS, SELECTORS } from './config';
import { formatDuration } from './duration';
import { t } from './i18n';
import { isElementVisible } from './utils';

export interface PanelState {
    totalSeconds: number;
    /** More videos can be loaded */
    hasMore: boolean;
    /** Videos not loaded yet, or 0 when unknown */
    remaining: number;
    loading: boolean;
}

function setText(el: Element, text: string): void {
    // Writing the same text again would still be a DOM change and wake the observer
    if (el.textContent !== text) el.textContent = text;
}

function findTarget(root: Element): Element | null {
    for (const selector of SELECTORS.INJECTION_TARGETS) {
        const target = Array.from(root.querySelectorAll(selector)).find(isElementVisible);
        if (target) return target;
    }
    return null;
}

function createPanel(onLoadClick: () => void): HTMLElement {
    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;

    const duration = document.createElement('span');
    duration.className = 'yptd-duration';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'yptd-load-btn';
    button.hidden = true;
    button.addEventListener('click', onLoadClick);

    panel.append(duration, button);
    return panel;
}

export function removePanels(): void {
    document.querySelectorAll(`.${PANEL_CLASS}`).forEach(el => el.remove());
}

/**
 * Make sure exactly one panel sits right after the header's action buttons.
 * Returns null when the header has not rendered yet.
 */
export function ensurePanel(root: Element, onLoadClick: () => void): HTMLElement | null {
    const target = findTarget(root);
    if (!target) return null;

    const next = target.nextElementSibling;
    if (next instanceof HTMLElement && next.classList.contains(PANEL_CLASS)) return next;

    removePanels();
    const panel = createPanel(onLoadClick);
    target.insertAdjacentElement('afterend', panel);
    return panel;
}

export function renderPanel(panel: HTMLElement, state: PanelState): void {
    const duration = panel.querySelector('.yptd-duration');
    const button = panel.querySelector<HTMLButtonElement>('.yptd-load-btn');
    if (!duration || !button) return;

    setText(duration, t('totalLabel', formatDuration(state.totalSeconds)));

    const showButton = state.loading || state.hasMore;
    if (button.hidden === showButton) button.hidden = !showButton;

    if (state.loading) {
        setText(button, t('stopLoading'));
    } else if (state.remaining > 0) {
        setText(button, t('loadAllRemaining', String(state.remaining)));
    } else {
        setText(button, t('loadAll'));
    }
}
