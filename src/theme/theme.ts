export const THEME_STORAGE_KEY = 'momentum-theme';

export const THEMES = [
  {id: 'default', label: '기본'},
  {id: 'skeu', label: '스큐어모피즘'},
  {id: 'flat', label: '플랫'},
  {id: 'material', label: '머티리얼'},
  {id: 'neu', label: '뉴모피즘'},
  {id: 'glass', label: '글래스모피즘'},
  {id: 'clay', label: '클레이모피즘'},
  {id: 'brutal', label: '네오 브루탈리즘'},
  {id: 'liquid', label: '리퀴드 글래스'},
  {id: 'icons3d', label: '3D 아이콘'}
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
