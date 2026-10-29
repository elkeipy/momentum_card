import {
  addTodo,
  clampDueParts,
  dueProgress,
  dueTodos,
  formatDueMinutes,
  minDueHour,
  minDueMinute,
  parseDueMinutes,
  parseTodoItem,
  readTodoList,
  removeTodo,
  sanitizeTodoText,
  stripDueTrigger,
  toggleTodo
} from './todos';

test('accepts a short task and rejects empty or control text', () => {
  expect(sanitizeTodoText('  write tests ')).toBe('write tests');
  expect(sanitizeTodoText('')).toBeNull();
  expect(sanitizeTodoText('\u0007')).toBeNull();
});

test('parses stored items and ignores anything else', () => {
  expect(parseTodoItem({id: 'a1', text: 'ship', done: false})).toEqual({
    id: 'a1',
    text: 'ship',
    done: false,
    dueMinutes: null,
    startMinutes: null,
    alarmed: false
  });
  expect(parseTodoItem({id: '<script>', text: 'ship', done: false})).toBeNull();
  expect(parseTodoItem({id: 'a1', text: '', done: false})).toBeNull();
});

test('adds, toggles, and removes todos without growing past the cap', () => {
  const added = addTodo([], ' ship it ', 'id-1');
  expect(added).toEqual([
    {id: 'id-1', text: 'ship it', done: false, dueMinutes: null, startMinutes: null, alarmed: false}
  ]);
  expect(addTodo(added, '   ')).toEqual(added);
  expect(toggleTodo(added, 'id-1')[0].done).toBe(true);
  expect(removeTodo(added, 'id-1')).toEqual([]);
  const full = Array.from({length: 40}, (_, index) => ({
    id: `n${index}`,
    text: 'task',
    done: false,
    dueMinutes: null,
    startMinutes: null,
    alarmed: false
  }));
  expect(addTodo(full, 'one more', 'n40')).toEqual(full);
});

test('reads a stored list and drops corrupt rows', () => {
  const storage = {
    getItem: () =>
      JSON.stringify([
        {id: 'ok-1', text: 'keep', done: true},
        {id: 'bad', text: '', done: false},
        'nope'
      ])
  };
  expect(readTodoList(storage)).toEqual([
    {id: 'ok-1', text: 'keep', done: true, dueMinutes: null, startMinutes: null, alarmed: false}
  ]);
  expect(readTodoList({getItem: () => null})).toEqual([]);
  expect(readTodoList({getItem: () => '{'})).toEqual([]);
});

test('stores a due time and finds unfinished items that are due', () => {
  expect(stripDueTrigger('call @')).toBe('call');
  expect(parseDueMinutes(9, 5)).toBe(9 * 60 + 5);
  expect(parseDueMinutes(24, 0)).toBeNull();
  expect(formatDueMinutes(9 * 60 + 5)).toBe('09:05');
  const withDue = addTodo([], 'call @', 'due-1', 10 * 60, 9 * 60);
  expect(withDue[0].dueMinutes).toBe(10 * 60);
  expect(withDue[0].startMinutes).toBe(9 * 60);
  expect(dueProgress(9 * 60, 10 * 60, 9 * 60)).toBe(0);
  expect(dueProgress(9 * 60, 10 * 60, 9 * 60 + 30)).toBe(0.5);
  expect(dueProgress(9 * 60, 10 * 60, 10 * 60)).toBe(1);
  expect(dueProgress(10 * 60, 10 * 60, 10 * 60)).toBe(1);
  expect(dueTodos(withDue, 9 * 60 + 59)).toEqual([]);
  expect(dueTodos(withDue, 10 * 60).map(item => item.id)).toEqual(['due-1']);
  expect(dueTodos(toggleTodo(withDue, 'due-1'), 10 * 60)).toEqual([]);
});

test('clamps due parts so they cannot be earlier than now', () => {
  expect(minDueHour(10 * 60 + 30)).toBe(10);
  expect(minDueMinute(10, 10 * 60 + 30)).toBe(30);
  expect(minDueMinute(11, 10 * 60 + 30)).toBe(0);
  expect(clampDueParts(9, 0, 10 * 60)).toEqual({hour: 10, minute: 0});
  expect(clampDueParts(10, 0, 10 * 60 + 30)).toEqual({
    hour: 10,
    minute: 30
  });
  expect(clampDueParts(11, 5, 10 * 60 + 30)).toEqual({hour: 11, minute: 5});
});
