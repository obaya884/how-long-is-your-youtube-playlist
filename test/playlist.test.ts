import {
    isPlaylistPage,
    getPlaylistRoot,
    getVideoItems,
    calculateTotalDuration,
    findContinuation,
    getTotalVideosCount,
} from '../src/playlist';
import { installLayoutShim, classicLayout, lockupLayout } from './helpers/dom';

beforeAll(installLayoutShim);

function mount(html: string): Element {
    document.body.innerHTML = html;
    const root = getPlaylistRoot();
    if (!root) throw new Error('fixture has no visible playlist page');
    return root;
}

describe('isPlaylistPage', () => {
    it.each([
        ['https://www.youtube.com/playlist?list=WL', true],
        ['https://www.youtube.com/playlist', true],
        ['https://www.youtube.com/', false],
        ['https://www.youtube.com/watch?v=abc&list=WL', false],
        ['https://www.youtube.com/feed/playlists', false],
    ])('%p -> %p', (url, expected) => {
        expect(isPlaylistPage(url)).toBe(expected);
    });
});

describe('getPlaylistRoot', () => {
    it('skips a playlist page YouTube keeps hidden after navigating away', () => {
        document.body.innerHTML = classicLayout({ durations: ['1:00'], hidden: true });
        expect(getPlaylistRoot()).toBeNull();
    });

    it('picks the visible page when a stale one is still in the DOM', () => {
        document.body.innerHTML =
            lockupLayout({ durations: ['1:00'], hidden: true }) + classicLayout({ durations: ['2:00', '3:00'] });
        expect(getVideoItems(getPlaylistRoot()!)).toHaveLength(2);
    });
});

describe.each([
    ['classic rows', classicLayout],
    ['lockup rows', lockupLayout],
])('with %s', (_name, layout) => {
    it('sums the durations of the loaded videos', () => {
        const root = mount(layout({ durations: ['15:29', '21:12', '1:02:03'] }));
        expect(getVideoItems(root)).toHaveLength(3);
        expect(calculateTotalDuration(root)).toBe(929 + 1272 + 3723);
    });

    it('counts a video without a readable duration as zero seconds', () => {
        const root = mount(layout({ durations: ['10:00', 'LIVE', ''] }));
        expect(getVideoItems(root)).toHaveLength(3);
        expect(calculateTotalDuration(root)).toBe(600);
    });

    it('keeps counting a video while YouTube hides its duration badge on hover', () => {
        const root = mount(layout({ durations: ['10:00', '5:00'] }));
        expect(calculateTotalDuration(root)).toBe(900);

        getVideoItems(root)[1].querySelector('badge-shape')!.remove();

        expect(calculateTotalDuration(root)).toBe(900);
    });

    it('forgets the remembered duration when the row is reused for another video', () => {
        const root = mount(layout({ durations: ['10:00', '5:00'] }));
        expect(calculateTotalDuration(root)).toBe(900);

        const row = getVideoItems(root)[1];
        row.querySelector('badge-shape')!.remove();
        row.querySelector('a')!.setAttribute('href', '/watch?v=another&list=PL1');

        expect(calculateTotalDuration(root)).toBe(600);
    });

    it('finds the continuation marker while more videos can be loaded', () => {
        const root = mount(layout({ durations: ['1:00'], hasMore: true }));
        expect(findContinuation(root)).not.toBeNull();
    });

    it('finds no continuation marker once every video is loaded', () => {
        const root = mount(layout({ durations: ['1:00'], hasMore: false }));
        expect(findContinuation(root)).toBeNull();
    });

    it('finds no continuation marker on an empty playlist', () => {
        const root = mount(layout({ durations: [] }));
        expect(findContinuation(root)).toBeNull();
    });
});

describe('getTotalVideosCount', () => {
    it.each([
        ['158 videos', 158],
        ['158 本の動画', 158],
        ['124 回のレッスン', 124],
        ['1,234 videos', 1234],
        ['1.234 Videos', 1234],
        ['1 video', 1],
    ])('reads %p from the classic header', (text, expected) => {
        const root = mount(classicLayout({ durations: [], countText: text }));
        expect(getTotalVideosCount(root)).toBe(expected);
    });

    it.each([
        ['Playlist•18 videos•1,617,091 views', 18],
        ['再生リスト•18 本の動画•1,617,091回視聴', 18],
        ['Playlist • 2,048 videos • 12 views', 2048],
    ])('reads %p from the page header, ignoring the channel row and the view count', (text, expected) => {
        const root = mount(lockupLayout({ durations: [], countText: text }));
        expect(getTotalVideosCount(root)).toBe(expected);
    });

    it('returns 0 when the header shows no number', () => {
        const root = mount(classicLayout({ durations: [], countText: 'No videos' }));
        expect(getTotalVideosCount(root)).toBe(0);
    });
});
