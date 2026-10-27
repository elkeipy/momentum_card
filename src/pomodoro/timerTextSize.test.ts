import {
  parseTimerTextSize,
  readTimerTextSize,
  TIMER_TEXT_SIZE_DEFAULT,
  writeTimerTextSize
} from './timerTextSize';

test('keeps a size inside the allowed range', () => {
  expect(parseTimerTextSize(64)).toBe(64);
  expect(parseTimerTextSize(23)).toBe(TIMER_TEXT_SIZE_DEFAULT);
  expect(parseTimerTextSize(97)).toBe(TIMER_TEXT_SIZE_DEFAULT);
  expect(parseTimerTextSize('48')).toBe(TIMER_TEXT_SIZE_DEFAULT);
});

test('reads and writes the stored timer text size', () => {
  const inputStorage = {getItem: () => '64'};
  expect(readTimerTextSize(inputStorage)).toBe(64);
  expect(readTimerTextSize({getItem: () => null})).toBe(TIMER_TEXT_SIZE_DEFAULT);
  expect(readTimerTextSize({getItem: () => '{'})).toBe(TIMER_TEXT_SIZE_DEFAULT);

  const written: {key?: string; value?: string} = {};
  writeTimerTextSize(
    {
      setItem: (key, value) => {
        written.key = key;
        written.value = value;
      }
    },
    72
  );
  expect(written).toEqual({key: 'PomodoroTimerTextSize', value: '72'});
});
