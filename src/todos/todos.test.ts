import {
  addTodo,
  parseTodoItem,
  readTodoList,
  removeTodo,
  sanitizeTodoText,
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
    done: false
  });
  expect(parseTodoItem({id: '<script>', text: 'ship', done: false})).toBeNull();
  expect(parseTodoItem({id: 'a1', text: '', done: false})).toBeNull();
});

test('adds, toggles, and removes todos without growing past the cap', () => {
  const added = addTodo([], ' ship it ', 'id-1');
  expect(added).toEqual([{id: 'id-1', text: 'ship it', done: false}]);
  expect(addTodo(added, '   ')).toEqual(added);
  expect(toggleTodo(added, 'id-1')[0].done).toBe(true);
  expect(removeTodo(added, 'id-1')).toEqual([]);
  const full = Array.from({length: 40}, (_, index) => ({
    id: `n${index}`,
    text: 'task',
    done: false
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
  expect(readTodoList(storage)).toEqual([{id: 'ok-1', text: 'keep', done: true}]);
  expect(readTodoList({getItem: () => null})).toEqual([]);
  expect(readTodoList({getItem: () => '{'})).toEqual([]);
});
