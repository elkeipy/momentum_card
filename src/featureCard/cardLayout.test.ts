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

test('keeps a card below the top inset', () => {
  const actual = clampCardLayout(
    {x: 10, y: 0, width: 300, height: 200, pinned: false},
    {width: 800, height: 600},
    80
  );
  expect(actual).toEqual({
    x: 10,
    y: 80,
    width: 300,
    height: 200,
    pinned: false
  });
});

test('shortens a tall card so it still fits below the top inset', () => {
  const actual = clampCardLayout(
    {x: 0, y: 0, width: 300, height: 900, pinned: false},
    {width: 800, height: 600},
    80
  );
  expect(actual).toEqual({
    x: 0,
    y: 80,
    width: 300,
    height: 520,
    pinned: false
  });
});

test('rejects a stored layout that is not a card', () => {
  expect(parseCardLayout({x: 1, pinned: 'yes'}, fallback)).toEqual(fallback);
  expect(parseCardLayout('nope', fallback)).toEqual(fallback);
});
