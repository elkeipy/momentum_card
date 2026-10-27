export const THEMES = ['apple', 'dark', 'flat', 'material', 'glass'] as const;

export type ThemeName = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = 'theme';

const THEME_LABELS: Record<ThemeName, string> = {
  apple: '애플',
  dark: '다크',
  flat: '플랫',
  material: '머티리얼',
  glass: '글래스'
};

export function themeLabel(theme: ThemeName): string {
  return THEME_LABELS[theme];
}

export function parseTheme(value: unknown): ThemeName {
  if (typeof value === 'string' && THEMES.includes(value as ThemeName)) {
    return value as ThemeName;
  }
  return 'apple';
}
