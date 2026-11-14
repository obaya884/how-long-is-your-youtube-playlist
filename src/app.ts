/**
 * Lifecycle: follow YouTube's in-page navigation and keep the panel up to date
 */

import { CONFIG } from './config';
import { PlaylistLoader } from './loader';
import {
    calculateTotalDuration,
    findContinuation,
    getPlaylistRoot,
    getTotalVideosCount,
    getVideoItems,
    isPlaylistPage,
} from './playlist';
import { ensurePanel, removePanels, renderPanel } from './ui';
import { debounce } from './utils';

export interface App {
    start(): void;
    dispose(): void;
}

export function createApp(): App {
    let observer: MutationObserver | null = null;
    let currentList: string | null = null;

    const loader = new PlaylistLoader({
        findContinuation: () => {
            const root = getPlaylistRoot();
            return root ? findContinuation(root) : null;
        },
        getItemCount: () => {
            const root = getPlaylistRoot();
            return root ? getVideoItems(root).length : 0;
        },
        onChange: () => refresh(),
        pollMs: CONFIG.LOAD_POLL_MS,
        stallMs: CONFIG.LOAD_STALL_MS,
    });

    const toggleLoading = (): void => {
        if (loader.isLoading) loader.stop();
        else loader.start();
    };

    function refresh(): void {
        if (!observer || document.visibilityState !== 'visible') return;

        if (window.innerWidth <= CONFIG.MIN_VIEWPORT_WIDTH) {
            removePanels();
            return;
        }

        const root = getPlaylistRoot();
        const panel = root && ensurePanel(root, toggleLoading);
        if (!root || !panel) return;

        const loaded = getVideoItems(root).length;
        const hasMore = findContinuation(root) !== null;
        renderPanel(panel, {
            totalSeconds: calculateTotalDuration(root),
            hasMore,
            remaining: hasMore ? Math.max(getTotalVideosCount(root) - loaded, 0) : 0,
            loading: loader.isLoading,
        });
    }

    const scheduleRefresh = debounce(refresh, CONFIG.DEBOUNCE_MS);

    function activate(): void {
        if (!observer) {
            observer = new MutationObserver(scheduleRefresh);
            observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        }
        refresh();
    }

    function deactivate(): void {
        observer?.disconnect();
        observer = null;
        scheduleRefresh.cancel();
        removePanels();
    }

    function handleNavigation(): void {
        const onPlaylist = isPlaylistPage(location.href);
        const list = onPlaylist ? new URLSearchParams(location.search).get('list') : null;
        if (list !== currentList) {
            // Loading belongs to the playlist it was started on
            loader.stop({ returnToTop: false });
            currentList = list;
        }

        if (onPlaylist) activate();
        else deactivate();
    }

    return {
        start(): void {
            // YouTube swaps pages without reloading and fires this event when a page is ready
            document.addEventListener('yt-navigate-finish', handleNavigation);
            document.addEventListener('visibilitychange', scheduleRefresh);
            window.addEventListener('resize', scheduleRefresh);
            handleNavigation();
        },
        dispose(): void {
            document.removeEventListener('yt-navigate-finish', handleNavigation);
            document.removeEventListener('visibilitychange', scheduleRefresh);
            window.removeEventListener('resize', scheduleRefresh);
            loader.stop({ returnToTop: false });
            deactivate();
        },
    };
}
