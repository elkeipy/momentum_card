import {hideCard, readVisibleCards, showCard} from './visibleCards';

test('hides a card and shows it again without duplicates', () => {
  const hidden = hideCard(['weather', 'clock'], 'weather');
  expect(hidden).toEqual(['clock']);
  expect(showCard(hidden, 'weather')).toEqual(['clock', 'weather']);
  expect(showCard(['clock', 'weather'], 'weather')).toEqual(['clock', 'weather']);
});

test('keeps an explicit empty list and drops unknown ids', () => {
  expect(readVisibleCards({getItem: () => '[]'})).toEqual([]);
  expect(readVisibleCards({getItem: () => '["clock","nope"]'})).toEqual(['clock']);
  expect(readVisibleCards({getItem: () => null})).toEqual([
    'weather',
    'clock',
    'pomodoro',
    'quote',
    'words'
  ]);
});
