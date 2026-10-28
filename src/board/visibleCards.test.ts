import {hideCard, readVisibleCards, showCard, toggleCard} from './visibleCards';

test('hides a card and shows it again without duplicates', () => {
  const hidden = hideCard(['weather', 'clock'], 'weather');
  expect(hidden).toEqual(['clock']);
  expect(showCard(hidden, 'weather')).toEqual(['clock', 'weather']);
  expect(showCard(['clock', 'weather'], 'weather')).toEqual(['clock', 'weather']);
});

test('toggles a card on and off', () => {
  expect(toggleCard(['clock'], 'weather')).toEqual(['clock', 'weather']);
  expect(toggleCard(['clock', 'weather'], 'weather')).toEqual(['clock']);
});

test('keeps an explicit empty list and drops unknown ids', () => {
  expect(readVisibleCards({getItem: () => '[]'})).toEqual([]);
  expect(readVisibleCards({getItem: () => '["clock","nope"]'})).toEqual(['clock']);
  expect(readVisibleCards({getItem: () => null})).toEqual([
    'weather',
    'clock',
    'pomodoro',
    'quote',
    'words',
    'todos'
  ]);
});
