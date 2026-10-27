import {readTodayFocusHistory} from './focusHistory';

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
