export const POMODORO_FOCUS_STORAGE_KEY = 'PomodoroFocusData';

export type FocusPeriod = {
  periodType: 'Focus' | 'Break' | 'Lost';
  start: string;
  finish: string;
};

const PERIOD_PATTERN = /^(Focus|Break|Lost),(\d{2}:\d{2}:\d{2}),(\d{2}:\d{2}:\d{2})$/;

function dateId(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

function parsePeriod(value: string): FocusPeriod | null {
  const matched = PERIOD_PATTERN.exec(value);
  if (!matched) {
    return null;
  }
  return {
    periodType: matched[1] as FocusPeriod['periodType'],
    start: matched[2],
    finish: matched[3]
  };
}

export type PeriodMinutes = {
  Focus: number;
  Break: number;
  Lost: number;
};

function secondsOf(time: string): number {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

export function summarizePeriodMinutes(periods: FocusPeriod[]): PeriodMinutes {
  const totals = {Focus: 0, Break: 0, Lost: 0};
  periods.forEach(period => {
    let delta = secondsOf(period.finish) - secondsOf(period.start);
    if (delta < 0) {
      delta += 24 * 3600;
    }
    totals[period.periodType] += delta;
  });
  return {
    Focus: Math.round(totals.Focus / 60),
    Break: Math.round(totals.Break / 60),
    Lost: Math.round(totals.Lost / 60)
  };
}

export function readTodayFocusHistory(
  storage: {getItem(key: string): string | null},
  now: Date
): FocusPeriod[] {
  const raw = storage.getItem(POMODORO_FOCUS_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return [];
    }
    const record = parsed as {dateId?: unknown; focusPeriod?: unknown};
    if (record.dateId !== dateId(now) || !Array.isArray(record.focusPeriod)) {
      return [];
    }
    return record.focusPeriod
      .filter((period): period is string => typeof period === 'string')
      .map(parsePeriod)
      .filter((period): period is FocusPeriod => period !== null);
  } catch {
    return [];
  }
}
