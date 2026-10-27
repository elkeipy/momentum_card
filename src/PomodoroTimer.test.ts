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

test('drops corrupt focus history instead of throwing', () => {
  localStorage.setItem('PomodoroFocusData', '{"dateId":"not-a-date","focusCount":1,"focusPeriod":[]}');
  const timer = createTimer();
  expect(timer.getSettings().focusTime).toBe(25);
  timer.dispose();
});
