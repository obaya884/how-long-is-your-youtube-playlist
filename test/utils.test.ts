import { debounce } from '../src/utils';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('debounce', () => {
    it('runs once after calls stop arriving', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 200);

        debounced();
        jest.advanceTimersByTime(150);
        debounced();
        jest.advanceTimersByTime(150);
        expect(fn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('keeps two debounced functions independent of each other', () => {
        const first = jest.fn();
        const second = jest.fn();
        const debouncedFirst = debounce(first, 200);
        const debouncedSecond = debounce(second, 200);

        debouncedFirst();
        debouncedSecond();
        jest.advanceTimersByTime(200);

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('does not run after cancel', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 200);

        debounced();
        debounced.cancel();
        jest.advanceTimersByTime(1000);

        expect(fn).not.toHaveBeenCalled();
    });
});
