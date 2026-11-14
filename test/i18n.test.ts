import * as fs from 'fs';
import * as path from 'path';
import { t } from '../src/i18n';

type ChromeStub = { i18n: { getMessage: (key: string, substitutions?: string[]) => string } };
const globals = globalThis as unknown as { chrome?: ChromeStub };

afterEach(() => {
    delete globals.chrome;
});

describe('t', () => {
    it('asks the browser for the message in its language', () => {
        globals.chrome = {
            i18n: { getMessage: (key, substitutions) => `${key}|${(substitutions ?? []).join(',')}` },
        };
        expect(t('totalLabel', '01:02:03')).toBe('totalLabel|01:02:03');
    });

    it('falls back to English when the extension API is missing', () => {
        expect(t('totalLabel', '01:02:03')).toBe('Total: 01:02:03');
        expect(t('loadAll')).toBe('Load All');
        expect(t('loadAllRemaining', '58')).toBe('Load All (58 remaining)');
    });

    it('falls back to English when the extension was reloaded and its API throws', () => {
        globals.chrome = {
            i18n: {
                getMessage: () => {
                    throw new Error('Extension context invalidated.');
                },
            },
        };
        expect(t('loadAll')).toBe('Load All');
    });

    it('falls back to English when the browser returns no message', () => {
        globals.chrome = { i18n: { getMessage: () => '' } };
        expect(t('stopLoading')).toBe('Stop loading');
    });
});

describe('_locales', () => {
    const localesDir = path.join(__dirname, '..', '_locales');
    const read = (locale: string): Record<string, { message: string; placeholders?: Record<string, unknown> }> =>
        JSON.parse(fs.readFileSync(path.join(localesDir, locale, 'messages.json'), 'utf8'));
    const en = read('en');

    const others = fs.readdirSync(localesDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name !== 'en')
        .map(entry => entry.name);

    it.each(others)(
        '%s defines the same messages and placeholders as en',
        (locale) => {
            const messages = read(locale);
            expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
            for (const key of Object.keys(en)) {
                expect(Object.keys(messages[key].placeholders ?? {})).toEqual(Object.keys(en[key].placeholders ?? {}));
            }
        },
    );
});
