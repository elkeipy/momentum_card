export const TODO_STORAGE_KEY = 'todoList';
export const MAX_TODOS = 40;
export const MAX_TODO_TEXT = 80;
const TODO_ID_PATTERN = /^[a-z0-9-]{1,40}$/i;

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  dueMinutes: number | null;
  startMinutes: number | null;
  alarmed: boolean;
};

export function sanitizeTodoText(value: string): string | null {
  const cleaned = Array.from(value)
    .filter(char => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, MAX_TODO_TEXT);
  return cleaned.length > 0 ? cleaned : null;
}

export function createTodoId(now = Date.now(), random = Math.random): string {
  return `${now.toString(36)}-${Math.floor(random() * 1e9).toString(36)}`;
}

export function parseTodoItem(value: unknown): TodoItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Partial<TodoItem>;
  if (typeof raw.id !== 'string' || !TODO_ID_PATTERN.test(raw.id)) {
    return null;
  }
  const text = typeof raw.text === 'string' ? sanitizeTodoText(raw.text) : null;
  if (!text || typeof raw.done !== 'boolean') {
    return null;
  }
  const dueMinutes = parseStoredDueMinutes(raw.dueMinutes);
  return {
    id: raw.id,
    text,
    done: raw.done,
    dueMinutes,
    startMinutes: dueMinutes === null ? null : parseStoredDueMinutes(raw.startMinutes),
    alarmed: raw.alarmed === true
  };
}

export function stripDueTrigger(value: string): string {
  return value.replace(/@/g, ' ').replace(/\s+/g, ' ').trim();
}

export function minDueHour(nowMinutes: number): number {
  return Math.floor(nowMinutes / 60);
}

export function minDueMinute(hour: number, nowMinutes: number): number {
  return hour <= minDueHour(nowMinutes) ? nowMinutes % 60 : 0;
}

export function clampDueParts(
  hour: number,
  minute: number,
  nowMinutes: number
): {hour: number; minute: number} {
  const parsed = parseDueMinutes(hour, minute);
  const clamped = parsed === null ? nowMinutes : Math.max(parsed, nowMinutes);
  return {
    hour: Math.floor(clamped / 60),
    minute: clamped % 60
  };
}

export function parseDueMinutes(hour: number, minute: number): number | null {
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return hour * 60 + minute;
}

export function formatDueMinutes(dueMinutes: number): string {
  const hour = Math.floor(dueMinutes / 60);
  const minute = dueMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function currentMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function currentExactMinutes(now = new Date()): number {
  return currentMinutes(now) + now.getSeconds() / 60;
}

export function dueProgress(
  startMinutes: number,
  dueMinutes: number,
  nowMinutes: number
): number {
  if (nowMinutes >= dueMinutes || dueMinutes <= startMinutes) {
    return 1;
  }
  if (nowMinutes <= startMinutes) {
    return 0;
  }
  return (nowMinutes - startMinutes) / (dueMinutes - startMinutes);
}

function parseStoredDueMinutes(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 23 * 60 + 59) {
    return null;
  }
  return value;
}

export function dueTodos(items: TodoItem[], nowMinutes: number): TodoItem[] {
  return items.filter(
    item =>
      !item.done &&
      item.dueMinutes !== null &&
      !item.alarmed &&
      nowMinutes >= item.dueMinutes
  );
}

export function markAlarmed(items: TodoItem[], id: string): TodoItem[] {
  return items.map(item => (item.id === id ? {...item, alarmed: true} : item));
}

export function readTodoList(storage: {getItem(key: string): string | null}): TodoItem[] {
  const raw = storage.getItem(TODO_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(parseTodoItem).filter((item): item is TodoItem => item !== null).slice(0, MAX_TODOS);
  } catch {
    return [];
  }
}

export function addTodo(
  items: TodoItem[],
  value: string,
  id = createTodoId(),
  dueMinutes: number | null = null,
  startMinutes: number | null = null
): TodoItem[] {
  const text = sanitizeTodoText(stripDueTrigger(value));
  if (!text || items.length >= MAX_TODOS) {
    return items;
  }
  return [
    ...items,
    {
      id,
      text,
      done: false,
      dueMinutes,
      startMinutes: dueMinutes === null ? null : startMinutes,
      alarmed: false
    }
  ];
}

export function toggleTodo(items: TodoItem[], id: string): TodoItem[] {
  return items.map(item =>
    item.id === id ? {...item, done: !item.done, alarmed: item.done ? false : item.alarmed} : item
  );
}

export function removeTodo(items: TodoItem[], id: string): TodoItem[] {
  return items.filter(item => item.id !== id);
}
