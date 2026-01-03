/**
 * UI Generation and Updates
 */

import { CONFIG, INJECTION_TARGETS, UI_ID } from './config.js';
import { log, isElementVisible } from './utils.js';
import { formatDuration, getTotalVideosCount, getLoadedVideosCount, calculateTotalDuration } from './duration.js';

let isLoadingAll = false;

/**
 * Update the duration display in all injected panels
 */
export function updateDisplay() {
    if (document.visibilityState !== 'visible') {
        return;
    }

    try {
        const currentLoadedCount = getLoadedVideosCount();
        const totalSeconds = calculateTotalDuration();
        const formattedTime = formatDuration(totalSeconds);

        const panels = document.querySelectorAll('.' + UI_ID);
        panels.forEach(panel => {
            const durationEl = panel?.querySelector('.yptd-duration');
            if (durationEl) {
                durationEl.textContent = `Total: ${formattedTime}`;
            }

            const loadBtn = panel?.querySelector('.yptd-load-btn');
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
export async function loadAllVideos() {
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
        return null;
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
export function injectUI() {
    try {
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
                    hasInjected = true;
                }
            });
        });
    } catch (e) {
        log('Error injecting UI:', e);
    }
}
