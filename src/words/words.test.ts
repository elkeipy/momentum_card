import {
  dropPracticedWord,
  nextRandomIndex,
  readDefinition,
  readWordList,
  readWordRepGoal,
  removeWord,
  sanitizeWord,
  submitWord
} from './words';

const focus = {word: 'focus', reps: 0};
const steady = {word: 'steady', reps: 0};

test('accepts a dictionary word and rejects anything else', () => {
  expect(sanitizeWord('  Focus ')).toBe('focus');
  expect(sanitizeWord('drop table')).toBeNull();
  expect(sanitizeWord('a/../b')).toBeNull();
});

test('picks another word index without repeating the current one', () => {
  expect(nextRandomIndex(0, 1)).toBe(0);
  expect(nextRandomIndex(1, 3, () => 0)).toBe(2);
  expect(nextRandomIndex(1, 3, () => 0.99)).toBe(0);
});

test('reads an old string list as zero reps and keeps a cleared list empty', () => {
  expect(
    readWordList({getItem: () => JSON.stringify(['Focus', '<script>', 'steady'])})
  ).toEqual([focus, steady]);
  expect(readWordList({getItem: () => '[]'})).toEqual([]);
  expect(readWordList({getItem: () => null})).toEqual([
    focus,
    steady,
    {word: 'clear', reps: 0}
  ]);
  expect(readWordRepGoal({getItem: () => null})).toBe(20);
  expect(readWordRepGoal({getItem: () => '7'})).toBe(7);
  expect(readWordRepGoal({getItem: () => '0'})).toBe(20);
});

test('counts a repeated word and drops it at the goal', () => {
  expect(submitWord([focus], 'steady', 20)).toEqual({
    kind: 'added',
    word: 'steady',
    words: [focus, steady]
  });
  expect(submitWord([focus], 'focus', 20)).toEqual({
    kind: 'hit',
    word: 'focus',
    words: [{word: 'focus', reps: 1}]
  });
  expect(submitWord([{word: 'focus', reps: 19}], 'focus', 20)).toEqual({
    kind: 'clear',
    word: 'focus',
    words: []
  });
  expect(submitWord([focus], 'drop table', 20)).toEqual({kind: 'ignore'});
  expect(removeWord([focus, steady], 'focus')).toEqual([steady]);
  expect(
    dropPracticedWord([focus, steady, {word: 'clear', reps: 0}], 'focus', 2)
  ).toEqual({
    words: [steady, {word: 'clear', reps: 0}],
    index: 1
  });
  expect(
    readDefinition([{meanings: [{definitions: [{definition: 'steady attention'}]}]}])
  ).toBe('steady attention');
});
