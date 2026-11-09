export const PERIOD_COLORS_EVENT = 'pomodoro-period-colors';
export const POMODORO_SETTINGS_KEY = 'PomodoroSettings';

export const DEFAULT_PERIOD_COLORS = {
  focusColor: '#1b6e66',
  breakColor: '#1f201d',
  pauseColor: '#636361'
} as const;

export type PeriodColors = {
  focusColor: string;
  breakColor: string;
  pauseColor: string;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function colorOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value)
    ? value.toLowerCase()
    : fallback;
}

export function periodColorsFrom(value: unknown): PeriodColors {
  const raw = value && typeof value === 'object' ? (value as Partial<PeriodColors>) : {};
  return {
    focusColor: colorOrDefault(raw.focusColor, DEFAULT_PERIOD_COLORS.focusColor),
    breakColor: colorOrDefault(raw.breakColor, DEFAULT_PERIOD_COLORS.breakColor),
    pauseColor: colorOrDefault(raw.pauseColor, DEFAULT_PERIOD_COLORS.pauseColor)
  };
}

export function readPeriodColors(storage: {getItem(key: string): string | null}): PeriodColors {
  const raw = storage.getItem(POMODORO_SETTINGS_KEY);
  if (!raw) {
    return {...DEFAULT_PERIOD_COLORS};
  }
  try {
    return periodColorsFrom(JSON.parse(raw));
  } catch {
    return {...DEFAULT_PERIOD_COLORS};
  }
}

export function periodTextColor(
  kind: 'Focus' | 'Break' | 'Pause' | 'Lost',
  colors: PeriodColors
): string {
  if (kind === 'Focus') {
    return colors.focusColor;
  }
  if (kind === 'Break') {
    return colors.breakColor;
  }
  if (kind === 'Pause') {
    return colors.pauseColor;
  }
  return 'var(--negative)';
}

export function publishPeriodColors(): void {
  window.dispatchEvent(new Event(PERIOD_COLORS_EVENT));
}
