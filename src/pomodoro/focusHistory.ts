export const POMODORO_FOCUS_STORAGE_KEY = 'PomodoroFocusData';

export type FocusPeriod = {
  periodType: 'Focus' | 'Break' | 'Lost' | 'Pause';
  start: string;
  finish: string;
};

const PERIOD_PATTERN =
  /^(Focus|Break|Lost|Pause),(\d{2}:\d{2}:\d{2}),(\d{2}:\d{2}:\d{2})$/;

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
  Pause: number;
};

function secondsOf(time: string): number {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function periodSeconds(period: FocusPeriod): number {
  const delta = secondsOf(period.finish) - secondsOf(period.start);
  return delta < 0 ? delta + 24 * 3600 : delta;
}

export function summarizePeriodMinutes(periods: FocusPeriod[]): PeriodMinutes {
  const totals = {Focus: 0, Break: 0, Lost: 0, Pause: 0};
  periods.forEach(period => {
    totals[period.periodType] += periodSeconds(period);
  });
  return {
    Focus: Math.round(totals.Focus / 60),
    Break: Math.round(totals.Break / 60),
    Lost: Math.round(totals.Lost / 60),
    Pause: Math.round(totals.Pause / 60)
  };
}

// 1분까지는 초만, 넘으면 분과 초(0초는 생략)로 적는다.
export function formatSpan(totalSeconds: number): string {
  if (totalSeconds <= 60) {
    return `${totalSeconds}초`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}분` : `${minutes}분${seconds}초`;
}

// Pause로 끊긴 텀은 Focus, Pause, Focus처럼 맞닿은 조각으로 남는다.
function continuesTerm(periods: FocusPeriod[], index: number): boolean {
  const pause = periods[index - 1];
  const before = periods[index - 2];
  const current = periods[index];
  return (
    pause?.periodType === 'Pause' &&
    before?.periodType === current.periodType &&
    before.finish === pause.start &&
    pause.finish === current.start
  );
}

// Focus와 Break는 오늘 몇 번째 텀인지와 그 줄의 길이를, Lost와 Pause는 길이만 붙인다.
export function labelFocusHistory(periods: FocusPeriod[]): string[] {
  const counts = {Focus: 0, Break: 0};
  return periods.map((period, index) => {
    const span = formatSpan(periodSeconds(period));
    const kind = period.periodType;
    if (kind !== 'Focus' && kind !== 'Break') {
      return `${kind} (${span})`;
    }
    if (!continuesTerm(periods, index)) {
      counts[kind] += 1;
    }
    return `${kind} #${counts[kind]}(${span})`;
  });
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
