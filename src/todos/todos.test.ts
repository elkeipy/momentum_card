import {
  addEventTodo,
  addTodo,
  calendarEventUrl,
  clampDueParts,
  dueProgress,
  dueTodos,
  eventPassedMs,
  eventProgress,
  eventStartMs,
  formatDueMinutes,
  formatEventStamp,
  minDueHour,
  minDueMinute,
  parseDueMinutes,
  parseTodoItem,
  readTodoList,
  removeTodo,
  renameTodo,
  sanitizeTodoText,
  stripDueTrigger,
  toggleTodo,
  type TodoEvent,
  type TodoItem
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
  expect(renameTodo(added, 'id-1', '  ship later  ')[0].text).toBe('ship later');
  expect(renameTodo(added, 'id-1', '   ')).toEqual(added);
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

describe('calendarEventUrl', () => {
  const now = new Date(2026, 10, 2, 9, 0);
  const url = (title: string, date: string, time: string) => {
    const result = calendarEventUrl(title, date, time, now);
    return result === null ? null : new URL(result);
  };

  test('makes an all-day event ending the next day', () => {
    const link = url('치과 #', '2026-11-30', '');
    expect(link?.origin).toBe('https://calendar.google.com');
    expect(link?.searchParams.get('action')).toBe('TEMPLATE');
    expect(link?.searchParams.get('text')).toBe('치과');
    expect(link?.searchParams.get('dates')).toBe('20261130/20261201');
  });

  test('makes a one hour event from the given time', () => {
    expect(url('회의', '2026-11-05', '14:30')?.searchParams.get('dates')).toBe(
      '20261105T143000/20261105T153000'
    );
    expect(url('회의', '2026-11-05', '23:30')?.searchParams.get('dates')).toBe(
      '20261105T233000/20261106T003000'
    );
  });

  test('rejects past dates, impossible dates, bad times and empty titles', () => {
    expect(url('x', '2026-11-01', '')).toBeNull();
    expect(url('x', '2026-02-31', '')).toBeNull();
    expect(url('x', '2026-11-05', '25:00')).toBeNull();
    expect(url(' # ', '2026-11-05', '')).toBeNull();
    expect(url('x', '', '')).toBeNull();
  });

  test('allows today', () => {
    expect(url('x', '2026-11-02', '')).not.toBeNull();
  });
});

describe('event todos', () => {
  const created = new Date(2026, 10, 20, 9, 0).getTime();
  const ev = (date: string, time: string | null): TodoEvent => ({date, time, createdAt: created});

  test('adds a # entry with its date and time and strips the trigger', () => {
    expect(addEventTodo([], 'dentist #', '2026-11-22', '14:30', created, 'e1')).toEqual([
      {
        id: 'e1',
        text: 'dentist',
        done: false,
        dueMinutes: null,
        startMinutes: null,
        alarmed: false,
        event: {date: '2026-11-22', time: '14:30', createdAt: created}
      }
    ]);
    expect(addEventTodo([], 'x #', '2026-11-22', '', created, 'e2')[0].event?.time).toBeNull();
  });

  test('rejects empty text, impossible dates and times, and a full list', () => {
    const none: TodoItem[] = [];
    expect(addEventTodo(none, ' # ', '2026-11-22', '', created)).toBe(none);
    expect(addEventTodo(none, 'x', '2026-02-30', '', created)).toBe(none);
    expect(addEventTodo(none, 'x', '2026-11-22', '25:00', created)).toBe(none);
    const full = Array.from({length: 40}, (_, index) => addTodo([], 'item', `id${index}`)[0]);
    expect(addEventTodo(full, 'x', '2026-11-22', '', created)).toBe(full);
  });

  test('keeps a stored event and drops a broken one', () => {
    const event = ev('2026-11-22', '14:30');
    const base = {id: 'e1', text: 'dentist', done: false, dueMinutes: null, startMinutes: null, alarmed: false};
    expect(parseTodoItem({id: 'e1', text: 'dentist', done: false, event})).toEqual({...base, event});
    expect(parseTodoItem({id: 'e1', text: 'dentist', done: false, event: {...event, time: '9am'}})).toEqual(base);
    expect(parseTodoItem({id: 'e1', text: 'dentist', done: false, event: {...event, date: '2026-13-01'}})?.event).toBeUndefined();
    expect(parseTodoItem({id: 'e1', text: 'dentist', done: false, event: {...event, createdAt: -1}})?.event).toBeUndefined();
    expect(
      parseTodoItem({id: 'e1', text: 'dentist', done: false, dueMinutes: 600, startMinutes: 540, event})?.dueMinutes
    ).toBeNull();
  });

  test('fills from the moment it was added until the event starts', () => {
    const timed = ev('2026-11-20', '11:00');
    expect(eventProgress(timed, created)).toBe(0);
    expect(eventProgress(timed, new Date(2026, 10, 20, 10, 0).getTime())).toBeCloseTo(0.5);
    expect(eventProgress(timed, new Date(2026, 10, 20, 11, 0).getTime())).toBe(1);
    expect(eventPassedMs(timed)).toBe(new Date(2026, 10, 20, 11, 0).getTime());
    const allDay = ev('2026-11-22', null);
    expect(eventStartMs(allDay)).toBe(new Date(2026, 10, 22).getTime());
    expect(eventPassedMs(allDay)).toBe(new Date(2026, 10, 23).getTime());
    expect(eventProgress(ev('2026-11-20', null), created)).toBe(1);
  });

  test('writes the day as today, tomorrow, or a date in the chosen language', () => {
    const now = new Date(2026, 10, 20, 9, 0);
    expect(formatEventStamp(ev('2026-11-20', '14:30'), now, 'ko')).toBe('오늘 14:30');
    expect(formatEventStamp(ev('2026-11-21', null), now, 'ko')).toBe('내일 종일');
    expect(formatEventStamp(ev('2026-11-22', '09:00'), now, 'ko')).toBe('11월 22일 09:00');
    expect(formatEventStamp(ev('2027-01-02', null), now, 'ko')).toBe('2027년 1월 2일 종일');
    expect(formatEventStamp(ev('2026-11-20', '14:30'), now, 'en')).toBe('Today, 14:30');
    expect(formatEventStamp(ev('2026-11-21', null), now, 'en')).toBe('Tomorrow, all day');
    expect(formatEventStamp(ev('2026-11-22', '09:00'), now, 'en')).toBe('Nov 22, 09:00');
    expect(formatEventStamp(ev('2027-01-02', null), now, 'en')).toBe('Jan 2, 2027, all day');
  });
});
