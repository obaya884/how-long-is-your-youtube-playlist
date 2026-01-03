console.log("YouTube Playlist Total Duration extension loaded.");

// --- Constants & Selectors ---
const SELECTORS = {
    // Video duration text: "10:05" inside badge-shape
    DURATION: 'ytd-thumbnail-overlay-time-status-renderer badge-shape div',
    // Container for playlist videos
    PLAYLIST_CONTAINER: 'ytd-playlist-video-list-renderer #contents',
    // Header metadata area to inject our panel
    HEADER_METADATA: 'yt-content-metadata-view-model',
    // Element containing the total number of videos (e.g. "150 videos")
    VIDEO_COUNT: 'yt-content-metadata-view-model .yt-content-metadata-view-model__metadata-row, yt-formatted-string'
};

const UI_ID = 'yptd-container'; // Class name used for the panel

// --- State ---
let isObserverRunning = false;
let isLoadingAll = false;

// --- Helpers ---

// Convert "HH:MM:SS" or "MM:SS" to seconds
function parseDuration(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
    }
    return seconds;
}

// Convert seconds to "HH:MM:SS"
function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const hStr = h > 0 ? `${h}:` : '';
    const mStr = m.toString().padStart(h > 0 ? 2 : 1, '0');
    const sStr = s.toString().padStart(2, '0');

    return `${hStr}${mStr}:${sStr}`;
}

// Extract total video count from metadata text
function getTotalVideosCount() {
    // Look for elements containing "videos" or "本の動画"
    // Priority check on the header metadata
    const metadataRows = document.querySelectorAll(SELECTORS.VIDEO_COUNT);
    for (const row of metadataRows) {
        const text = row.textContent;
        if (text.includes('本の動画') || text.includes('videos')) {
            // Extract number: "150 本の動画" -> 150
            // Handles "1,234" as well
            const match = text.match(/([\d,]+)/);
            if (match) {
                return parseInt(match[1].replace(/,/g, ''), 10);
            }
        }
    }
    return 0;
}

// Get the count of video elements currently in DOM
function getLoadedVideosCount() {
    // Excluding hidden or skeleton items if possible, but general query is usually enough
    // We check for duration elements as a proxy for valid videos
    // However, playlist items are 'ytd-playlist-video-renderer'
    return document.querySelectorAll('ytd-playlist-video-renderer').length;
}

// --- Core Logic ---

function calculateTotalDuration() {
    const durationElements = document.querySelectorAll(SELECTORS.DURATION);
    let totalSeconds = 0;

    durationElements.forEach(el => {
        // Clean text (trim whitespace)
        totalSeconds += parseDuration(el.textContent.trim());
    });

    return totalSeconds;
}

// Update the UI
function updateDisplay() {
    const totalSeconds = calculateTotalDuration();
    const formattedTime = formatDuration(totalSeconds);

    // Update all injected panels (since we may have multiple for desktop/mobile)
    const panels = document.querySelectorAll('.' + UI_ID);
    panels.forEach(panel => {
        const durationEl = panel.querySelector('.yptd-duration');
        if (durationEl) {
            durationEl.textContent = `Total: ${formattedTime}`;
        }

        // Check if we need to show/enable the Load All button
        const loadBtn = panel.querySelector('.yptd-load-btn');
        if (loadBtn && !isLoadingAll) {
            const totalCount = getTotalVideosCount();
            const loadedCount = getLoadedVideosCount();

            // Logic: Show button if we have significantly fewer items loaded than total
            if (totalCount > 0 && loadedCount < totalCount) {
                loadBtn.style.display = 'flex';
                loadBtn.textContent = `Load All (${totalCount - loadedCount} remaining)`;
            } else {
                loadBtn.style.display = 'none';
            }
        }
    });
}

// --- Load All Feature ---

async function loadAllVideos() {
    if (isLoadingAll) return;
    isLoadingAll = true;

    const btn = document.querySelector(`#${UI_ID} .yptd-load-btn`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Loading...';
    }

    let previousHeight = 0;
    let noChangeCount = 0;
    const MAX_NO_CHANGE = 3; // Stop after 3 checks with no height change

    const interval = setInterval(() => {
        const currentHeight = document.documentElement.scrollHeight;

        // Scroll to bottom
        window.scrollTo(0, currentHeight);

        // Check if height changed
        if (currentHeight === previousHeight) {
            noChangeCount++;
        } else {
            noChangeCount = 0;
            previousHeight = currentHeight;
        }

        // Stop condition
        if (noChangeCount >= MAX_NO_CHANGE) {
            clearInterval(interval);
            isLoadingAll = false;

            // Final calculation
            updateDisplay();

            // Scroll back to top
            window.scrollTo(0, 0);

            // Reset button state (it will likely be hidden by updateDisplay, but just in case)
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Load All';
            }
        }
        // Force update display during scroll to show progress
        updateDisplay();

    }, 1500); // Scroll every 1.5 seconds to allow load
}

// --- Injection ---

function injectUI() {
    // 0. Width Check: Only run on wide screens (desktop view) to prevent mobile/responsive layout issues
    // If the screen is too narrow, we remove any existing panels and stop.
    if (window.innerWidth <= 1080) {
        document.querySelectorAll(`.${UI_ID}`).forEach(el => el.remove());
        return;
    }

    // Define potential injection targets (Desktop & Mobile)
    const targets = [
        // 1. Desktop: Button container (Old Layout / Watch Later) - Inject AFTER
        {
            selector: '.play-menu.ytd-playlist-header-renderer:not(.small-screen-form)',
            position: 'afterend',
            unique: true
        },
        // 2. Desktop New Layout: Action Buttons Container (Standard Playlists) - Inject AFTER
        // This places the panel directly below the "Play All" / "Shuffle" buttons row.
        {
            selector: 'yt-flexible-actions-view-model',
            position: 'afterend',
            unique: true
        }
    ];

    targets.forEach(targetSpec => {
        const elements = document.querySelectorAll(targetSpec.selector);
        let hasInjectedForThisSelector = false;

        elements.forEach((element, idx) => {
            if (targetSpec.unique && hasInjectedForThisSelector) {
                return;
            }

            // Check visibility
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 &&
                window.getComputedStyle(element).visibility !== 'hidden' &&
                window.getComputedStyle(element).display !== 'none';

            if (!isVisible) {
                return;
            }

            const nextNode = element.nextElementSibling;
            const alreadyInjected = nextNode && nextNode.classList.contains(UI_ID);

            if (alreadyInjected) {
                if (targetSpec.unique) {
                    hasInjectedForThisSelector = true;
                }
                return;
            }

            const panel = document.createElement('div');
            panel.className = UI_ID; // Use class name 'yptd-container'

            // HTML structure
            panel.innerHTML = `
                <span class="yptd-duration">Total: --:--</span>
                <button class="yptd-load-btn" style="display:none;">Load All</button>
            `;

            // Insert
            element.insertAdjacentElement(targetSpec.position, panel);

            // Bind events locally for this instance
            const btn = panel.querySelector('.yptd-load-btn');
            btn.addEventListener('click', loadAllVideos);

            if (targetSpec.unique) {
                hasInjectedForThisSelector = true;
            }

            updateDisplay();
        });
    });
}

// --- Observer ---

const observer = new MutationObserver((mutations) => {
    // Use a lightweight check or debounce if needed
    injectUI();
});

// Observe the body to catch SPA navigations and dynamic content loading
observer.observe(document.body, { childList: true, subtree: true });

// --- Initial ---

// Run initial injection
setTimeout(injectUI, 1000);

// Set up periodic update to handle video loading (infinite scroll)
// This calls updateDisplay which recalculates the total duration
setInterval(updateDisplay, 2000);
