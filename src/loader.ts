/**
 * "Load All": scroll to the end of the list until YouTube has loaded every video
 */

export interface LoaderOptions {
    /** The marker at the end of the list, or null when every video is loaded */
    findContinuation: () => Element | null;
    getItemCount: () => number;
    /** Called whenever loading starts or ends */
    onChange: () => void;
    pollMs: number;
    stallMs: number;
}

export class PlaylistLoader {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private lastCount = 0;
    private lastProgressAt = 0;
    private loading = false;

    constructor(private readonly options: LoaderOptions) {}

    get isLoading(): boolean {
        return this.loading;
    }

    start(): void {
        if (this.loading) return;

        this.loading = true;
        this.lastCount = this.options.getItemCount();
        this.lastProgressAt = Date.now();
        this.intervalId = setInterval(() => this.step(), this.options.pollMs);
        this.step();
        this.options.onChange();
    }

    stop({ returnToTop = true }: { returnToTop?: boolean } = {}): void {
        if (!this.loading) return;

        this.loading = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (returnToTop) window.scrollTo(0, 0);
        this.options.onChange();
    }

    private step(): void {
        const marker = this.options.findContinuation();
        if (!marker) {
            this.stop();
            return;
        }

        const count = this.options.getItemCount();
        if (count !== this.lastCount) {
            this.lastCount = count;
            this.lastProgressAt = Date.now();
        } else if (Date.now() - this.lastProgressAt >= this.options.stallMs) {
            this.stop();
            return;
        }

        marker.scrollIntoView({ block: 'center' });
    }
}
