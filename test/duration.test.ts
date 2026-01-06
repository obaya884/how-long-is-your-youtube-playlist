
import { parseDuration, formatDuration } from '../src/duration';

describe('duration logic', () => {
    describe('parseDuration', () => {
        it('should parse "MM:SS" format', () => {
            expect(parseDuration('10:00')).toBe(600);
            expect(parseDuration('01:00')).toBe(60);
            expect(parseDuration('00:01')).toBe(1);
        });

        it('should parse "HH:MM:SS" format', () => {
            expect(parseDuration('1:00:00')).toBe(3600);
            expect(parseDuration('01:01:01')).toBe(3661);
        });

        it('should handle single digit parts', () => {
            expect(parseDuration('1:1:1')).toBe(3661);
            expect(parseDuration('0:05')).toBe(5);
        });

        it('should return 0 for invalid inputs', () => {
            expect(parseDuration('')).toBe(0);
            expect(parseDuration(null)).toBe(0);
            expect(parseDuration(undefined)).toBe(0);
            expect(parseDuration('invalid')).toBe(0); // split length 1
        });
    });

    describe('formatDuration', () => {
        it('should format seconds to "HH:MM:SS"', () => {
            expect(formatDuration(600)).toBe('00:10:00');
            expect(formatDuration(65)).toBe('00:01:05');
            expect(formatDuration(0)).toBe('00:00:00');
            expect(formatDuration(3600)).toBe('01:00:00');
            expect(formatDuration(3665)).toBe('01:01:05');
        });

        it('should handle large durations', () => {
            expect(formatDuration(123456)).toBe('34:17:36');
        });
    });
});
