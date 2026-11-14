import { parseDuration, formatDuration } from '../src/duration';

describe('parseDuration', () => {
    it.each([
        ['10:00', 600],
        ['00:01', 1],
        ['0:05', 5],
        ['1:00:00', 3600],
        ['01:01:01', 3661],
        ['1:1:1', 3661],
        ['25:37:26', 92246],
        [' 15:29 ', 929],
    ])('parses %p as %p seconds', (text, seconds) => {
        expect(parseDuration(text)).toBe(seconds);
    });

    it.each([
        ['', 'empty'],
        [null, 'null'],
        [undefined, 'undefined'],
        ['invalid', 'a word'],
        ['LIVE', 'a live badge'],
        ['1:xx', 'a non-numeric part'],
        ['1:2:3:4', 'too many parts'],
        ['-1:30', 'a negative part'],
    ])('returns 0 for %p (%s)', (text, _why) => {
        expect(parseDuration(text)).toBe(0);
    });
});

describe('formatDuration', () => {
    it.each([
        [0, '00:00:00'],
        [65, '00:01:05'],
        [600, '00:10:00'],
        [3665, '01:01:05'],
        [123456, '34:17:36'],
        [360000, '100:00:00'],
    ])('formats %p seconds as %p', (seconds, text) => {
        expect(formatDuration(seconds)).toBe(text);
    });
});
