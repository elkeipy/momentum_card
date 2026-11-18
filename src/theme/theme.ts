export const THEME_STORAGE_KEY = 'momentum-theme';

export const THEMES = [
  {id: 'default'},
  {id: 'skeu'},
  {id: 'flat'},
  {id: 'material'},
  {id: 'neu'},
  {id: 'glass'},
  {id: 'clay'},
  {id: 'brutal'},
  {id: 'liquid'},
  {id: 'icons3d'}
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some(theme => theme.id === value);
}

export function readTheme(storage: {getItem(key: string): string | null}): ThemeId {
  const stored = storage.getItem(THEME_STORAGE_KEY);
  return isThemeId(stored) ? stored : 'default';
}

export function applyTheme(
  theme: ThemeId,
  storage?: {setItem(key: string, value: string): void}
): void {
  if (theme === 'default') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
  storage?.setItem(THEME_STORAGE_KEY, theme);
}
