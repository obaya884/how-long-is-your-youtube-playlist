import { createApp } from '../src/app';
import { installLayoutShim, classicLayout, lockupLayout } from './helpers/dom';

beforeAll(installLayoutShim);

let app: ReturnType<typeof createApp>;

beforeEach(() => {
    jest.useFakeTimers();
    installLayoutShim();
    document.body.innerHTML = '';
    goTo('/playlist?list=PL1');
    app = createApp();
});

afterEach(() => {
    app.dispose();
    jest.useRealTimers();
});

function goTo(url: string): void {
    window.history.pushState({}, '', url);
    document.dispatchEvent(new Event('yt-navigate-finish'));
}

/** Let the MutationObserver deliver its records, then let the debounce fire. */
async function settle(): Promise<void> {
    await Promise.resolve();
    jest.advanceTimersByTime(250);
}

const panels = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('.yptd-container'));
const durationText = (): string | null | undefined => panels()[0]?.querySelector('.yptd-duration')?.textContent;
const loadButton = (): HTMLButtonElement => panels()[0].querySelector<HTMLButtonElement>('.yptd-load-btn')!;

describe('on a playlist page', () => {
    it('shows the total right after the action buttons of the page header', () => {
        document.body.innerHTML = lockupLayout({ durations: ['15:29', '21:12', '1:02:03'] });
        app.start();

        expect(panels()).toHaveLength(1);
        expect(panels()[0].previousElementSibling?.tagName).toBe('YT-FLEXIBLE-ACTIONS-VIEW-MODEL');
        expect(durationText()).toBe('Total: 01:38:44');
    });

    it('shows the total right after the play menu of the classic header', () => {
        document.body.innerHTML = classicLayout({ durations: ['10:00', '5:00'] });
        app.start();

        expect(panels()).toHaveLength(1);
        expect(panels()[0].previousElementSibling?.classList.contains('play-menu')).toBe(true);
        expect(durationText()).toBe('Total: 00:15:00');
    });

    it('waits for the page when it has not rendered yet, then shows the total', async () => {
        app.start();
        expect(panels()).toHaveLength(0);

        document.body.innerHTML = lockupLayout({ durations: ['1:00'] });
        await settle();

        expect(durationText()).toBe('Total: 00:01:00');
    });

    it('updates the total when more videos appear', async () => {
        document.body.innerHTML = classicLayout({ durations: ['10:00'] });
        app.start();

        const list = document.querySelector('ytd-playlist-video-list-renderer #contents')!;
        const template = document.createElement('template');
        template.innerHTML = classicLayout({ durations: ['2:30'] });
        list.appendChild(template.content.querySelector('ytd-playlist-video-renderer')!);
        await settle();

        expect(durationText()).toBe('Total: 00:12:30');
    });

    it('keeps a single panel however often the page changes', async () => {
        document.body.innerHTML = lockupLayout({ durations: ['1:00'] });
        app.start();

        for (let i = 0; i < 3; i++) {
            document.body.appendChild(document.createElement('div'));
            await settle();
        }

        expect(panels()).toHaveLength(1);
    });

    it('puts the panel back when YouTube re-renders the header without it', async () => {
        document.body.innerHTML = lockupLayout({ durations: ['1:00'] });
        app.start();

        panels()[0].remove();
        await settle();

        expect(panels()).toHaveLength(1);
    });

    it('shows no panel in the narrow layout', () => {
        Object.defineProperty(window, 'innerWidth', { value: 900, configurable: true, writable: true });
        document.body.innerHTML = lockupLayout({ durations: ['1:00'] });
        app.start();

        expect(panels()).toHaveLength(0);
    });
});

describe('the Load All button', () => {
    it('is hidden when every video is loaded', () => {
        document.body.innerHTML = lockupLayout({ durations: ['1:00'], countText: 'Playlist•2 videos•5 views' });
        app.start();

        expect(loadButton().hidden).toBe(true);
    });

    it('shows how many videos remain when the header states the total', () => {
        document.body.innerHTML = lockupLayout({
            durations: ['1:00', '2:00'],
            hasMore: true,
            countText: 'Playlist•60 videos•5 views',
        });
        app.start();

        expect(loadButton().hidden).toBe(false);
        expect(loadButton().textContent).toBe('Load All (58 remaining)');
    });

    it('shows a plain label when the total cannot be read', () => {
        document.body.innerHTML = classicLayout({ durations: ['1:00'], hasMore: true, countText: 'videos' });
        app.start();

        expect(loadButton().hidden).toBe(false);
        expect(loadButton().textContent).toBe('Load All');
    });

    it('starts loading on click and stops on the next click', () => {
        document.body.innerHTML = classicLayout({ durations: ['1:00'], hasMore: true });
        app.start();
        const marker = document.querySelector('ytd-continuation-item-renderer')!;
        marker.scrollIntoView = jest.fn();

        loadButton().click();
        expect(marker.scrollIntoView).toHaveBeenCalledTimes(1);
        expect(loadButton().textContent).toBe('Stop loading');

        loadButton().click();
        jest.advanceTimersByTime(3000);
        expect(marker.scrollIntoView).toHaveBeenCalledTimes(1);
        expect(loadButton().textContent).toBe('Load All');
    });
});

describe('navigating inside YouTube', () => {
    it('shows the panel when the user arrives at a playlist from another page', () => {
        goTo('/');
        document.body.innerHTML = '<ytd-browse page-subtype="home"></ytd-browse>';
        app.start();
        expect(panels()).toHaveLength(0);

        document.body.innerHTML = lockupLayout({ durations: ['1:00'] });
        goTo('/playlist?list=PL1');

        expect(durationText()).toBe('Total: 00:01:00');
    });

    it('removes the panel and stops watching when the user leaves the playlist', async () => {
        document.body.innerHTML = lockupLayout({ durations: ['1:00'] });
        app.start();

        document.querySelector('ytd-browse')!.setAttribute('hidden', '');
        goTo('/watch?v=abc');
        expect(panels()).toHaveLength(0);

        document.body.insertAdjacentHTML('beforeend', classicLayout({ durations: ['2:00'] }));
        await settle();
        expect(panels()).toHaveLength(0);
    });

    it('stops loading when the user leaves the playlist', () => {
        document.body.innerHTML = classicLayout({ durations: ['1:00'], hasMore: true });
        app.start();
        const marker = document.querySelector('ytd-continuation-item-renderer')!;
        marker.scrollIntoView = jest.fn();
        loadButton().click();

        goTo('/watch?v=abc');
        jest.advanceTimersByTime(3000);

        expect(marker.scrollIntoView).toHaveBeenCalledTimes(1);
        expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('stops loading when the user opens a different playlist', () => {
        document.body.innerHTML = classicLayout({ durations: ['1:00'], hasMore: true });
        app.start();
        const marker = document.querySelector('ytd-continuation-item-renderer')!;
        marker.scrollIntoView = jest.fn();
        loadButton().click();

        goTo('/playlist?list=PL2');
        jest.advanceTimersByTime(3000);

        expect(marker.scrollIntoView).toHaveBeenCalledTimes(1);
        expect(loadButton().textContent).toBe('Load All');
    });
});
