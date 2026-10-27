import {formatElapsed} from './formatElapsed';

test('formats unmanaged elapsed time from zero', () => {
  expect(formatElapsed(0)).toBe('+00:00');
  expect(formatElapsed(65.9)).toBe('+01:05');
  expect(formatElapsed(-4)).toBe('+00:00');
});
