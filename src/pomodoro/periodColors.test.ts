import {
  DEFAULT_PERIOD_COLORS,
  periodColorsFrom,
  periodTextColor,
  readPeriodColors
} from './periodColors';

test('keeps a hex color and replaces anything else with the default', () => {
  expect(periodColorsFrom({focusColor: '#ABCDEF', breakColor: 'red'})).toEqual({
    focusColor: '#abcdef',
    breakColor: DEFAULT_PERIOD_COLORS.breakColor,
    pauseColor: DEFAULT_PERIOD_COLORS.pauseColor
  });
  expect(periodTextColor('Pause', DEFAULT_PERIOD_COLORS)).toBe(
    DEFAULT_PERIOD_COLORS.pauseColor
  );
  expect(periodTextColor('Lost', DEFAULT_PERIOD_COLORS)).toBe('var(--negative)');
});

test('reads colors stored with the timer settings', () => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        focusTime: 25,
        focusColor: '#112233',
        breakColor: '#445566',
        pauseColor: '#778899'
      })
  };
  expect(readPeriodColors(storage)).toEqual({
    focusColor: '#112233',
    breakColor: '#445566',
    pauseColor: '#778899'
  });
  expect(readPeriodColors({getItem: () => '{'})).toEqual({...DEFAULT_PERIOD_COLORS});
});
