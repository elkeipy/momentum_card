import {
  addWord,
  nextRandomIndex,
  readDefinition,
  readWordList,
  removeWord,
  sanitizeWord
} from './words';

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

test('stores a short personal list and reads a definition string', () => {
  const storage = {getItem: () => JSON.stringify(['Focus', '<script>', 'steady'])};
  expect(readWordList(storage)).toEqual(['focus', 'steady']);
  expect(addWord(['focus'], 'steady')).toEqual(['focus', 'steady']);
  expect(addWord(['focus'], 'focus')).toEqual(['focus']);
  expect(removeWord(['focus', 'steady'], 'focus')).toEqual(['steady']);
  expect(
    readDefinition([{meanings: [{definitions: [{definition: 'steady attention'}]}]}])
  ).toBe('steady attention');
});
