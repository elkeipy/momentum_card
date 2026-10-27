export const TIMER_TEXT_SIZE_KEY = 'PomodoroTimerTextSize';
export const TIMER_TEXT_SIZE_MIN = 24;
export const TIMER_TEXT_SIZE_MAX = 96;
export const TIMER_TEXT_SIZE_DEFAULT = 48;

export function parseTimerTextSize(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < TIMER_TEXT_SIZE_MIN ||
    value > TIMER_TEXT_SIZE_MAX
  ) {
    return TIMER_TEXT_SIZE_DEFAULT;
  }
  return value;
}

export function readTimerTextSize(storage: Pick<Storage, 'getItem'>): number {
  const raw = storage.getItem(TIMER_TEXT_SIZE_KEY);
  if (!raw) {
    return TIMER_TEXT_SIZE_DEFAULT;
  }
  try {
    return parseTimerTextSize(JSON.parse(raw));
  } catch {
    return TIMER_TEXT_SIZE_DEFAULT;
  }
}

export function writeTimerTextSize(
  storage: Pick<Storage, 'setItem'>,
  size: number
): void {
  storage.setItem(TIMER_TEXT_SIZE_KEY, JSON.stringify(parseTimerTextSize(size)));
}
