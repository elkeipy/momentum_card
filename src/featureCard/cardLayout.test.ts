import {
  clampCardLayout,
  parseCardLayout,
  snapCardRect,
  type CardLayout
} from './cardLayout';

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

const neighbor = {x: 100, y: 100, width: 300, height: 200};

test('snaps a moved card to a nearby card edge or the gap beside it', () => {
  expect(
    snapCardRect({x: 105, y: 322, width: 200, height: 100}, [neighbor], 'move', 16)
  ).toEqual({x: 100, y: 316, width: 200, height: 100});
  expect(
    snapCardRect({x: 413, y: 94, width: 200, height: 100}, [neighbor], 'move', 16)
  ).toEqual({x: 416, y: 100, width: 200, height: 100});
});

test('leaves a moved card alone when no edge is close', () => {
  const rect = {x: 150, y: 450, width: 200, height: 100};
  expect(snapCardRect(rect, [neighbor], 'move', 16)).toEqual(rect);
});

test('snaps only the right and bottom edges while resizing', () => {
  expect(
    snapCardRect({x: 200, y: 100, width: 205, height: 196}, [neighbor], 'resize', 16)
  ).toEqual({x: 200, y: 100, width: 200, height: 200});
  expect(
    snapCardRect({x: 100, y: 330, width: 294, height: 100}, [neighbor], 'resize', 16)
  ).toEqual({x: 100, y: 330, width: 300, height: 100});
});
