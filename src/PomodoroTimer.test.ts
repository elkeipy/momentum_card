import PomodoroTimer, {TimerSettings} from './PomodoroTimer';

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
    longBreakInterval: 4
  });
  timer.dispose();
});

test('ignores settings outside the allowed range', () => {
  const timer = createTimer();
  const invalidSettings: TimerSettings = {
    focusTime: 0,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4
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
      longBreakInterval: 1
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
