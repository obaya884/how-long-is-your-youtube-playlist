import { PlaylistLoader } from '../src/loader';
import { installLayoutShim } from './helpers/dom';

beforeAll(installLayoutShim);
beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(window.scrollTo).mockClear();
});
afterEach(() => jest.useRealTimers());

/** A playlist that reveals `batches` more batches, one per time its marker is scrolled into view. */
function fakePlaylist(batches: number) {
    const state = { count: 100, marker: document.createElement('div') as Element | null, scrolls: 0 };
    const arm = (marker: Element): void => {
        marker.scrollIntoView = () => {
            state.scrolls++;
            if (batches-- > 0) {
                state.count += 100;
                state.marker = batches > 0 ? document.createElement('div') : null;
                if (state.marker) arm(state.marker);
            }
        };
    };
    arm(state.marker!);
    return state;
}

function createLoader(playlist: ReturnType<typeof fakePlaylist>, onChange = jest.fn()) {
    const loader = new PlaylistLoader({
        findContinuation: () => playlist.marker,
        getItemCount: () => playlist.count,
        onChange,
        pollMs: 500,
        stallMs: 8000,
    });
    return { loader, onChange };
}

describe('PlaylistLoader', () => {
    it('keeps scrolling to the continuation marker until every video is loaded', () => {
        const playlist = fakePlaylist(3);
        const { loader } = createLoader(playlist);

        loader.start();
        expect(loader.isLoading).toBe(true);
        jest.advanceTimersByTime(5000);

        expect(playlist.count).toBe(400);
        expect(loader.isLoading).toBe(false);
    });

    it('returns to the top of the page and reports the change when it finishes', () => {
        const playlist = fakePlaylist(1);
        const { loader, onChange } = createLoader(playlist);

        loader.start();
        jest.advanceTimersByTime(5000);

        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        expect(onChange).toHaveBeenCalled();
    });

    it('finishes right away when nothing is left to load', () => {
        const playlist = fakePlaylist(0);
        playlist.marker = null;
        const { loader } = createLoader(playlist);

        loader.start();

        expect(loader.isLoading).toBe(false);
    });

    it('gives up when no new video appears for the stall time', () => {
        const playlist = fakePlaylist(0);
        const { loader } = createLoader(playlist);

        loader.start();
        jest.advanceTimersByTime(7500);
        expect(loader.isLoading).toBe(true);

        jest.advanceTimersByTime(1000);
        expect(loader.isLoading).toBe(false);
    });

    it('measures the stall time from the last new video, not from the start', () => {
        const playlist = fakePlaylist(0);
        const { loader } = createLoader(playlist);

        loader.start();
        jest.advanceTimersByTime(6000);
        playlist.count += 100;
        jest.advanceTimersByTime(6000);

        expect(loader.isLoading).toBe(true);
    });

    it('stops scrolling when stopped', () => {
        const playlist = fakePlaylist(0);
        const { loader } = createLoader(playlist);

        loader.start();
        jest.advanceTimersByTime(1000);
        loader.stop();
        const scrollsAtStop = playlist.scrolls;
        jest.advanceTimersByTime(5000);

        expect(loader.isLoading).toBe(false);
        expect(playlist.scrolls).toBe(scrollsAtStop);
    });

    it('leaves the scroll position alone when asked to', () => {
        const playlist = fakePlaylist(0);
        const { loader } = createLoader(playlist);

        loader.start();
        loader.stop({ returnToTop: false });

        expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('does not speed up when started twice', () => {
        const playlist = fakePlaylist(0);
        const { loader } = createLoader(playlist);

        loader.start();
        loader.start();
        const scrollsAfterStart = playlist.scrolls;
        jest.advanceTimersByTime(500);

        expect(playlist.scrolls).toBe(scrollsAfterStart + 1);
    });
});
