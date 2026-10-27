import {nextQuoteIndex, remainingQuoteSeconds} from './quotes';

test('counts down the quote refresh and wraps the list', () => {
  expect(remainingQuoteSeconds(1500)).toBe(59);
  expect(remainingQuoteSeconds(60_000)).toBe(0);
  expect(remainingQuoteSeconds(90_000)).toBe(0);
  expect(nextQuoteIndex(4, 5)).toBe(0);
});
