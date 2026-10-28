export const TODO_STORAGE_KEY = 'todoList';
export const MAX_TODOS = 40;
export const MAX_TODO_TEXT = 80;
const TODO_ID_PATTERN = /^[a-z0-9-]{1,40}$/i;

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
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
  return {id: raw.id, text, done: raw.done};
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
  id = createTodoId()
): TodoItem[] {
  const text = sanitizeTodoText(value);
  if (!text || items.length >= MAX_TODOS) {
    return items;
  }
  return [...items, {id, text, done: false}];
}

export function toggleTodo(items: TodoItem[], id: string): TodoItem[] {
  return items.map(item => (item.id === id ? {...item, done: !item.done} : item));
}

export function removeTodo(items: TodoItem[], id: string): TodoItem[] {
  return items.filter(item => item.id !== id);
}
