import {pinStoredCards} from './pinCards';
import type {CardId} from '../board/visibleCards';
import type {CardLayout} from './cardLayout';

const layout = {x: 24, y: 96, width: 420, height: 168, pinned: false};

beforeEach(() => {
  localStorage.clear();
});

const layouts = {
  weather: layout,
  clock: layout,
  pomodoro: layout,
  quote: layout,
  words: layout,
  todos: layout
} as Record<CardId, CardLayout>;

test('pins every card, including one that was never stored', () => {
  localStorage.setItem(
    'feature-card:clock',
    JSON.stringify({...layout, x: 12, placed: true})
  );
  pinStoredCards(true, layouts);
  expect(JSON.parse(localStorage.getItem('feature-card:weather') ?? '')).toMatchObject({
    pinned: true,
    placed: false
  });
  expect(JSON.parse(localStorage.getItem('feature-card:clock') ?? '')).toMatchObject({
    x: 12,
    pinned: true,
    placed: true
  });
  pinStoredCards(false, layouts);
  expect(JSON.parse(localStorage.getItem('feature-card:clock') ?? '')).toMatchObject({
    pinned: false,
    placed: true
  });
});
