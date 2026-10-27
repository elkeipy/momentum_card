import {clampCardLayout, parseCardLayout, type CardLayout} from './cardLayout';

const fallback: CardLayout = {
  x: 10,
  y: 20,
  width: 300,
  height: 200,
  pinned: false
};

test('keeps a card inside the viewport', () => {
  const actual = clampCardLayout(
    {x: -40, y: 900, width: 80, height: 40, pinned: true},
    {width: 800, height: 600}
  );
  expect(actual).toEqual({
    x: 0,
    y: 460,
    width: 220,
    height: 140,
    pinned: true
  });
});

test('rejects a stored layout that is not a card', () => {
  expect(parseCardLayout({x: 1, pinned: 'yes'}, fallback)).toEqual(fallback);
  expect(parseCardLayout('nope', fallback)).toEqual(fallback);
});
