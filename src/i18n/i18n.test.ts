import {formatSpan, labelFocusHistory} from '../pomodoro/focusHistory';
import {QUOTES} from '../quotes/quotes';
import {
  detectLang,
  getLang,
  LANG_STORAGE_KEY,
  localeOf,
  setLang,
  t,
  translate
} from './i18n';
import {en, ko, type MessageKey} from './messages';

afterEach(() => {
  localStorage.removeItem(LANG_STORAGE_KEY);
});

describe('detectLang', () => {
  test('uses the stored choice before the browser language', () => {
    expect(detectLang('en', ['ko-KR'])).toBe('en');
    expect(detectLang('ko', ['en-US'])).toBe('ko');
  });

  test('ignores a stored value that is not a language', () => {
    expect(detectLang('fr', ['ko-KR'])).toBe('ko');
    expect(detectLang('', ['en-US'])).toBe('en');
  });

  test('follows only the first browser language', () => {
    expect(detectLang(null, ['ko-KR', 'en-US'])).toBe('ko');
    expect(detectLang(null, ['ko'])).toBe('ko');
    expect(detectLang(null, ['en-US', 'ko'])).toBe('en');
    expect(detectLang(null, ['ja-JP'])).toBe('en');
    expect(detectLang(null, [])).toBe('en');
  });
});

describe('translate', () => {
  test('fills placeholders and leaves unknown ones as they are', () => {
    expect(translate('en', 'card.settings', {title: 'Weather'})).toBe('Weather settings');
    expect(translate('ko', 'card.settings', {title: '날씨'})).toBe('날씨 설정');
    expect(translate('en', 'card.settings')).toBe('{title} settings');
  });

  test('has every message in both languages with the same placeholders', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ko).sort());
    const tokens = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(ko) as MessageKey[]) {
      expect(tokens(en[key])).toEqual(tokens(ko[key]));
    }
  });

  test('has no empty message', () => {
    for (const key of Object.keys(ko) as MessageKey[]) {
      expect(ko[key].trim()).not.toBe('');
      expect(en[key].trim()).not.toBe('');
    }
  });
});

describe('setLang', () => {
  test('switches the text, the document language, and the stored choice', () => {
    setLang('en');
    expect(getLang()).toBe('en');
    expect(t('cardList')).toBe('Card list');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');

    setLang('ko');
    expect(t('cardList')).toBe('카드 목록');
    expect(document.documentElement.lang).toBe('ko');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('ko');
  });

  test('does not store the choice when asked not to', () => {
    setLang('en', false);
    expect(getLang()).toBe('en');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });

  test('picks the date and time locale for each language', () => {
    expect(localeOf('ko')).toBe('ko-KR');
    expect(localeOf('en')).toBe('en-US');
  });
});

describe('content that depends on the language', () => {
  test('every quote has a sentence in each language', () => {
    for (const quote of QUOTES) {
      expect(quote.text.ko.trim()).not.toBe('');
      expect(quote.text.en.trim()).not.toBe('');
    }
  });

  test('writes history lengths in the chosen language', () => {
    expect(formatSpan(10, 'en')).toBe('10 s');
    expect(formatSpan(60, 'en')).toBe('60 s');
    expect(formatSpan(62, 'en')).toBe('1 min 2 s');
    expect(formatSpan(3000, 'en')).toBe('50 min');
    expect(formatSpan(62, 'ko')).toBe('1분2초');
  });

  test('labels history rows in English', () => {
    expect(
      labelFocusHistory(
        [
          {periodType: 'Focus', start: '09:00:00', finish: '09:25:00'},
          {periodType: 'Lost', start: '09:30:00', finish: '09:30:10'}
        ],
        'en'
      )
    ).toEqual(['Focus #1(25 min)', 'Lost (10 s)']);
  });
});
