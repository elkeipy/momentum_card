import PomodoroTimer, {TimerSettings} from './PomodoroTimer';
import {DEFAULT_PERIOD_COLORS} from './pomodoro/periodColors';

function createTimer(): PomodoroTimer {
  return new PomodoroTimer({
    setTimerText: () => undefined,
    setCurrentStateText: () => undefined,
    setStartStopButtonText: () => undefined,
    setTimerTextColor: () => undefined
  });
}

beforeEach(() => {
  localStorage.clear();
});

test('falls back when stored settings are not a valid timer', () => {
  localStorage.setItem('PomodoroSettings', JSON.stringify({focusTime: 9999, shortBreak: 5}));
  const timer = createTimer();
  expect(timer.getSettings()).toEqual({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    ...DEFAULT_PERIOD_COLORS
  });
  timer.dispose();
});

test('uses a saved focus color for the timer and keeps old settings without colors', () => {
  localStorage.setItem(
    'PomodoroSettings',
    JSON.stringify({
      focusTime: 20,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      focusColor: '#112233'
    })
  );
  const colors: string[] = [];
  const timer = new PomodoroTimer({
    setTimerText: () => undefined,
    setCurrentStateText: () => undefined,
    setStartStopButtonText: () => undefined,
    setTimerTextColor: value => {
      colors.push(value);
    }
  });
  expect(timer.getSettings().focusTime).toBe(20);
  expect(timer.getSettings().focusColor).toBe('#112233');
  expect(timer.getSettings().breakColor).toBe(DEFAULT_PERIOD_COLORS.breakColor);
  expect(colors[colors.length - 1]).toBe('#112233');
  timer.dispose();
});

test('ignores settings outside the allowed range', () => {
  const timer = createTimer();
  const invalidSettings: TimerSettings = {
    focusTime: 0,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    ...DEFAULT_PERIOD_COLORS
  };
  timer.saveLocalStorageSettings(invalidSettings);
  expect(timer.getSettings().focusTime).toBe(25);
  expect(localStorage.getItem('PomodoroSettings')).toBeNull();
  timer.dispose();
});

test('pause keeps the remaining time and resume continues it', () => {
  jest.useFakeTimers();
  const texts: string[] = [];
  const buttons: string[] = [];
  const states: string[] = [];
  const timer = new PomodoroTimer({
    setTimerText: value => {
      texts.push(value);
    },
    setCurrentStateText: value => {
      states.push(value);
    },
    setStartStopButtonText: value => {
      buttons.push(value);
    },
    setTimerTextColor: () => undefined
  });
  try {
    timer.startStop();
    expect(buttons[buttons.length - 1]).toBe('Pause');
    expect(states[states.length - 1]).toBe('[Focus] #1');
    jest.advanceTimersByTime(5000);
    timer.startStop();
    expect(buttons[buttons.length - 1]).toBe('Start');
    expect(texts[texts.length - 1]).toBe('24:55');
    jest.advanceTimersByTime(60000);
    expect(texts[texts.length - 1]).toBe('24:55');
    timer.startStop();
    expect(buttons[buttons.length - 1]).toBe('Pause');
    expect(states[states.length - 1]).toBe('[Focus] #1');
    jest.advanceTimersByTime(4800);
    expect(texts[texts.length - 1]).toBe('24:50');
  } finally {
    timer.dispose();
    jest.useRealTimers();
  }
});

test('writes Pause chunks when a paused Focus term ends', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-04T10:00:00'));
  jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(
    () => Promise.resolve()
  );
  jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(
    () => undefined
  );
  const timer = new PomodoroTimer({
    setTimerText: () => undefined,
    setCurrentStateText: () => undefined,
    setStartStopButtonText: () => undefined,
    setTimerTextColor: () => undefined
  });
  try {
    timer.saveLocalStorageSettings({
      focusTime: 1,
      shortBreak: 1,
      longBreak: 1,
      longBreakInterval: 1,
      ...DEFAULT_PERIOD_COLORS
    });
    timer.startStop();
    jest.advanceTimersByTime(20000);
    timer.startStop();
    expect(localStorage.getItem('PomodoroFocusData')).toBeNull();
    jest.advanceTimersByTime(5000);
    timer.startStop();
    jest.advanceTimersByTime(40300);
    const raw = localStorage.getItem('PomodoroFocusData');
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string) as {focusPeriod: string[]};
    expect(stored.focusPeriod).toEqual([
      'Focus,10:00:00,10:00:20',
      'Pause,10:00:20,10:00:25',
      'Focus,10:00:25,10:01:05'
    ]);
  } finally {
    timer.dispose();
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
});

test('progress fills across the period and holds while paused', () => {
  jest.useFakeTimers();
  const ratios: number[] = [];
  const timer = new PomodoroTimer({
    setTimerText: () => undefined,
    setCurrentStateText: () => undefined,
    setStartStopButtonText: () => undefined,
    setTimerTextColor: () => undefined,
    setTimerProgress: value => {
      ratios.push(value);
    }
  });
  try {
    timer.saveLocalStorageSettings({
      focusTime: 1,
      shortBreak: 1,
      longBreak: 1,
      longBreakInterval: 1,
      ...DEFAULT_PERIOD_COLORS
    });
    timer.startStop();
    expect(ratios[ratios.length - 1]).toBe(0);
    jest.advanceTimersByTime(30000);
    expect(ratios[ratios.length - 1]).toBeCloseTo(0.5, 2);
    timer.startStop();
    const held = ratios[ratios.length - 1];
    jest.advanceTimersByTime(20000);
    expect(ratios[ratios.length - 1]).toBe(held);
  } finally {
    timer.dispose();
    jest.useRealTimers();
  }
});

test('drops corrupt focus history instead of throwing', () => {
  localStorage.setItem('PomodoroFocusData', '{"dateId":"not-a-date","focusCount":1,"focusPeriod":[]}');
  const timer = createTimer();
  expect(timer.getSettings().focusTime).toBe(25);
  timer.dispose();
});
