import React, {useLayoutEffect, useState} from 'react';
import {parseTheme, THEME_STORAGE_KEY, THEMES, themeLabel, type ThemeName} from '../theme/themes';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeName>(() => parseTheme(localStorage.getItem(THEME_STORAGE_KEY)));

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <label className="theme-switcher">
      테마
      <select
        aria-label="테마"
        value={theme}
        onChange={event => setTheme(parseTheme(event.target.value))}
      >
        {THEMES.map(name => (
          <option key={name} value={name}>
            {themeLabel(name)}
          </option>
        ))}
      </select>
    </label>
  );
}
