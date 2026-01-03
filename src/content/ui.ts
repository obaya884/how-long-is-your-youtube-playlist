/**
 * UI Generation and Updates
 */

import { CONFIG, INJECTION_TARGETS, UI_ID } from './config';
import { log, isElementVisible } from './utils';
import { formatDuration, getTotalVideosCount, getLoadedVideosCount, calculateTotalDuration } from './duration';

let isLoadingAll = false;

/**
 * Update the duration display in all injected panels
 */
export function updateDisplay(): void {
    if (document.visibilityState !== 'visible') {
        return;
    }

    try {
        const currentLoadedCount = getLoadedVideosCount();
        const totalSeconds = calculateTotalDuration();
        const formattedTime = formatDuration(totalSeconds);

        const panels = document.querySelectorAll<HTMLElement>('.' + UI_ID);
        panels.forEach(panel => {
            const durationEl = panel.querySelector<HTMLElement>('.yptd-duration');
            if (durationEl) {
                durationEl.textContent = `Total: ${formattedTime}`;
            }

            const loadBtn = panel.querySelector<HTMLButtonElement>('.yptd-load-btn');
            if (loadBtn && !isLoadingAll) {
                const totalCount = getTotalVideosCount();

                if (totalCount > 0 && currentLoadedCount < totalCount) {
                    loadBtn.style.display = 'flex';
                    loadBtn.textContent = `Load All (${totalCount - currentLoadedCount} remaining)`;
                } else {
                    loadBtn.style.display = 'none';
                }
            }
        });
    } catch (e) {
        log('Error updating display:', e);
    }
}

/**
 * Scroll through the playlist to load all videos
 */
export function loadAllVideos(): void {
    if (isLoadingAll) return;
    isLoadingAll = true;

    const buttons = document.querySelectorAll<HTMLButtonElement>(`.${UI_ID} .yptd-load-btn`);
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

/**
 * Inject UI panels into the page
 */
export function injectUI(): void {
    try {
        // Do not inject UI if viewport is too small (mobile/narrow layouts)
        if (window.innerWidth <= CONFIG.MIN_VIEWPORT_WIDTH) {
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
                    hasInjected = true;
                }
            });
        });
    } catch (e) {
        log('Error injecting UI:', e);
    }
}

/**
 * Attach panel to target element
 */
function attachPanel(target: Element, position: InsertPosition): HTMLDivElement | null {
    const nextNode = target.nextElementSibling;
    if (nextNode?.classList?.contains(UI_ID)) {
        return null;
    }

    const panel = document.createElement('div');
    panel.className = UI_ID;
    panel.innerHTML = `<span class="yptd-duration">Total: --:--</span><button class="yptd-load-btn" style="display:none;">Load All</button>`;

    target.insertAdjacentElement(position, panel);

    const btn = panel.querySelector<HTMLButtonElement>('.yptd-load-btn');
    btn?.addEventListener('click', loadAllVideos);

    return panel;
}
