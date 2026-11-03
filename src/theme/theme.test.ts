import {applyTheme, readTheme, THEME_STORAGE_KEY} from './theme';

test('falls back when the stored theme is unknown', () => {
  expect(readTheme({getItem: () => 'nope'})).toBe('default');
  expect(readTheme({getItem: () => 'flat'})).toBe('flat');
});

test('writes the theme onto the document and clears the default', () => {
  applyTheme('brutal', localStorage);
  expect(document.documentElement.dataset.theme).toBe('brutal');
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('brutal');
  applyTheme('default', localStorage);
  expect(document.documentElement.dataset.theme).toBeUndefined();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('default');
});
