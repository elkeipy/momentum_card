import {
  formatSpan,
  labelFocusHistory,
  readTodayFocusHistory,
  summarizePeriodMinutes
} from './focusHistory';

test('sums Focus, Break, Pause, and Lost minutes, including midnight wrap', () => {
  expect(
    summarizePeriodMinutes([
      {periodType: 'Focus', start: '09:00:00', finish: '09:20:00'},
      {periodType: 'Pause', start: '09:20:00', finish: '09:23:00'},
      {periodType: 'Focus', start: '09:23:00', finish: '09:28:00'},
      {periodType: 'Break', start: '09:28:00', finish: '09:33:00'},
      {periodType: 'Lost', start: '23:50:00', finish: '00:10:00'}
    ])
  ).toEqual({Focus: 25, Break: 5, Pause: 3, Lost: 20});
});

test('reads only today periods with a valid time pair', () => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        dateId: '2026-10-27',
        focusCount: 2,
        focusPeriod: ['Focus,09:00:00,09:25:00', 'broken', 'Lost,10:00:00,10:03:00']
      })
  };
  expect(readTodayFocusHistory(storage, new Date(2026, 9, 27, 12, 0, 0))).toEqual([
    {periodType: 'Focus', start: '09:00:00', finish: '09:25:00'},
    {periodType: 'Lost', start: '10:00:00', finish: '10:03:00'}
  ]);
});

test('drops history from another day', () => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        dateId: '2026-10-26',
        focusPeriod: ['Focus,09:00:00,09:25:00']
      })
  };
  expect(readTodayFocusHistory(storage, new Date(2026, 9, 27))).toEqual([]);
});

test('writes seconds up to a minute and minutes with seconds past it', () => {
  expect(formatSpan(10)).toBe('10초');
  expect(formatSpan(60)).toBe('60초');
  expect(formatSpan(62)).toBe('1분2초');
  expect(formatSpan(3000)).toBe('50분');
});

test('numbers Focus and Break terms and keeps a paused term on one number', () => {
  expect(
    labelFocusHistory([
      {periodType: 'Focus', start: '09:00:00', finish: '09:20:00'},
      {periodType: 'Pause', start: '09:20:00', finish: '09:23:00'},
      {periodType: 'Focus', start: '09:23:00', finish: '09:28:00'},
      {periodType: 'Lost', start: '09:28:00', finish: '09:28:10'},
      {periodType: 'Break', start: '09:30:00', finish: '09:40:00'},
      {periodType: 'Focus', start: '09:41:00', finish: '10:31:02'}
    ])
  ).toEqual([
    'Focus #1(20분)',
    'Pause (3분)',
    'Focus #1(5분)',
    'Lost (10초)',
    'Break #1(10분)',
    'Focus #2(50분2초)'
  ]);
});
