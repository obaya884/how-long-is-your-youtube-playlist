/**
 * Test helpers: a layout shim for jsdom and fixtures of the two playlist layouts.
 *
 * jsdom has no layout engine, so every element reports a 0x0 box and
 * scrollIntoView / scrollTo do not exist. The shim treats an element as laid
 * out unless it (or an ancestor) carries the `hidden` attribute, which is how
 * YouTube keeps stale pages and unused headers in the DOM.
 */

export function installLayoutShim(): void {
    Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
        const size = this.closest('[hidden]') ? 0 : 100;
        return { width: size, height: size, top: 0, left: 0, right: size, bottom: size, x: 0, y: 0, toJSON: () => ({}) };
    };
    Element.prototype.scrollIntoView = jest.fn();
    window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true });
}

export interface LayoutOptions {
    durations: string[];
    hasMore?: boolean;
    countText?: string;
    hidden?: boolean;
}

/** Playlists the user can edit (e.g. Watch Later): ytd-playlist-video-renderer rows. */
export function classicLayout({ durations, hasMore = false, countText = '', hidden = false }: LayoutOptions): string {
    const rows = durations.map((d, i) => `
        <ytd-playlist-video-renderer>
            <a id="thumbnail" href="/watch?v=video${i}&list=PL1"></a>
            <ytd-thumbnail-overlay-time-status-renderer>
                <div><badge-shape class="ytBadgeShapeHost"><div class="ytBadgeShapeText">${d}</div></badge-shape></div>
            </ytd-thumbnail-overlay-time-status-renderer>
        </ytd-playlist-video-renderer>`).join('');
    return `
    <ytd-browse page-subtype="playlist"${hidden ? ' hidden' : ''}>
        <ytd-playlist-header-renderer>
            <div class="metadata-wrapper">
                <ytd-playlist-byline-renderer>
                    <yt-formatted-string class="byline-item">${countText}</yt-formatted-string>
                    <yt-formatted-string class="byline-item">1,234 views</yt-formatted-string>
                </ytd-playlist-byline-renderer>
                <div class="play-menu ytd-playlist-header-renderer"></div>
            </div>
        </ytd-playlist-header-renderer>
        <ytd-playlist-video-list-renderer>
            <div id="contents">${rows}${hasMore ? '<ytd-continuation-item-renderer></ytd-continuation-item-renderer>' : ''}</div>
        </ytd-playlist-video-list-renderer>
    </ytd-browse>`;
}

/** Other people's playlists: yt-lockup-view-model rows under a page header view model. */
export function lockupLayout({ durations, hasMore = false, countText = '', hidden = false }: LayoutOptions): string {
    const rows = durations.map((d, i) => `
        <div><yt-lockup-view-model>
            <a href="/watch?v=video${i}&list=PL1"></a>
            <yt-thumbnail-badge-view-model>
                <badge-shape class="ytBadgeShapeHost"><div class="ytBadgeShapeText">${d}</div></badge-shape>
            </yt-thumbnail-badge-view-model>
        </yt-lockup-view-model></div>`).join('');
    return `
    <ytd-browse page-subtype="playlist"${hidden ? ' hidden' : ''}>
        <ytd-playlist-header-renderer hidden>
            <ytd-playlist-byline-renderer><yt-formatted-string class="byline-item"></yt-formatted-string></ytd-playlist-byline-renderer>
            <div class="play-menu ytd-playlist-header-renderer"></div>
        </ytd-playlist-header-renderer>
        <yt-page-header-renderer>
            <yt-page-header-view-model>
                <yt-content-metadata-view-model>
                    <div class="ytContentMetadataViewModelMetadataRow">by Channel 5</div>
                    <div class="ytContentMetadataViewModelMetadataRow">${countText}</div>
                </yt-content-metadata-view-model>
                <yt-flexible-actions-view-model></yt-flexible-actions-view-model>
            </yt-page-header-view-model>
        </yt-page-header-renderer>
        <yt-section-list-renderer>
            <div class="ytSectionListRendererContents">
                <yt-item-section-renderer>
                    <div id="contents">${rows}${hasMore ? '<div><yt-continuation-item-view-model></yt-continuation-item-view-model></div>' : ''}</div>
                </yt-item-section-renderer>
                <yt-continuation-item-view-model></yt-continuation-item-view-model>
            </div>
        </yt-section-list-renderer>
    </ytd-browse>`;
}
