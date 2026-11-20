import {localeOf, translate, type Lang} from '../i18n/i18n';

export const TODO_STORAGE_KEY = 'todoList';
export const MAX_TODOS = 40;
export const MAX_TODO_TEXT = 80;
const TODO_ID_PATTERN = /^[a-z0-9-]{1,40}$/i;

// `#`로 만든 일정. 시각이 없으면 종일이고, createdAt은 목록에 넣은 때(ms)다.
export type TodoEvent = {
  date: string;
  time: string | null;
  createdAt: number;
};

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  dueMinutes: number | null;
  startMinutes: number | null;
  alarmed: boolean;
  event?: TodoEvent;
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
  const event = parseTodoEvent(raw.event as unknown);
  const dueMinutes = event ? null : parseStoredDueMinutes(raw.dueMinutes);
  const item: TodoItem = {
    id: raw.id,
    text,
    done: raw.done,
    dueMinutes,
    startMinutes: dueMinutes === null ? null : parseStoredDueMinutes(raw.startMinutes),
    alarmed: raw.alarmed === true
  };
  return event ? {...item, event} : item;
}

export function stripDueTrigger(value: string): string {
  return value.replace(/@/g, ' ').replace(/\s+/g, ' ').trim();
}

export function stripEventTrigger(value: string): string {
  return value.replace(/#/g, ' ').replace(/\s+/g, ' ').trim();
}

export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const EVENT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const EVENT_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function compactDate(date: Date): string {
  return todayIso(date).replace(/-/g, '');
}

/**
 * Google Calendar template link. Opens a prefilled editor in whichever account
 * the browser is signed in to. Without a time the event is all-day.
 */
export function calendarEventUrl(
  title: string,
  date: string,
  time: string,
  now = new Date()
): string | null {
  const text = sanitizeTodoText(stripEventTrigger(title));
  const dateParts = EVENT_DATE_PATTERN.exec(date);
  if (!text || !dateParts || date < todayIso(now)) {
    return null;
  }
  const [year, month, day] = dateParts.slice(1).map(Number);
  const start = new Date(year, month - 1, day);
  if (compactDate(start) !== date.replace(/-/g, '')) {
    return null;
  }
  let dates: string;
  if (time === '') {
    const next = new Date(year, month - 1, day + 1);
    dates = `${compactDate(start)}/${compactDate(next)}`;
  } else {
    const timeParts = EVENT_TIME_PATTERN.exec(time);
    if (!timeParts || Number(timeParts[1]) > 23 || Number(timeParts[2]) > 59) {
      return null;
    }
    const begin = new Date(year, month - 1, day, Number(timeParts[1]), Number(timeParts[2]));
    const end = new Date(begin.getTime() + 60 * 60 * 1000);
    const stamp = (value: Date) =>
      `${compactDate(value)}T${String(value.getHours()).padStart(2, '0')}${String(
        value.getMinutes()
      ).padStart(2, '0')}00`;
    dates = `${stamp(begin)}/${stamp(end)}`;
  }
  const query = new URLSearchParams({action: 'TEMPLATE', text, dates});
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
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

export function renameTodo(items: TodoItem[], id: string, value: string): TodoItem[] {
  const text = sanitizeTodoText(value);
  if (!text) {
    return items;
  }
  return items.map(item => (item.id === id ? {...item, text} : item));
}

function isEventDate(date: unknown): date is string {
  if (typeof date !== 'string') {
    return false;
  }
  const parts = EVENT_DATE_PATTERN.exec(date);
  if (!parts) {
    return false;
  }
  const [year, month, day] = parts.slice(1).map(Number);
  return todayIso(new Date(year, month - 1, day)) === date;
}

function isEventTime(time: unknown): time is string {
  if (typeof time !== 'string') {
    return false;
  }
  const parts = EVENT_TIME_PATTERN.exec(time);
  return parts !== null && Number(parts[1]) <= 23 && Number(parts[2]) <= 59;
}

function parseTodoEvent(value: unknown): TodoEvent | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Partial<TodoEvent>;
  if (!isEventDate(raw.date)) {
    return null;
  }
  if (raw.time !== null && !isEventTime(raw.time)) {
    return null;
  }
  if (typeof raw.createdAt !== 'number' || !Number.isFinite(raw.createdAt) || raw.createdAt <= 0) {
    return null;
  }
  return {date: raw.date, time: raw.time as string | null, createdAt: raw.createdAt};
}

// `#`로 만든 일정을 목록에도 남긴다. 시각을 비우면 종일이다.
export function addEventTodo(
  items: TodoItem[],
  value: string,
  date: string,
  time: string,
  createdAt = Date.now(),
  id = createTodoId()
): TodoItem[] {
  const text = sanitizeTodoText(stripEventTrigger(value));
  const eventTime = time === '' ? null : time;
  if (
    !text ||
    items.length >= MAX_TODOS ||
    !isEventDate(date) ||
    (eventTime !== null && !isEventTime(eventTime))
  ) {
    return items;
  }
  return [
    ...items,
    {
      id,
      text,
      done: false,
      dueMinutes: null,
      startMinutes: null,
      alarmed: false,
      event: {date, time: eventTime, createdAt}
    }
  ];
}

function eventDay(date: string): [number, number, number] {
  const [year, month, day] = date.split('-').map(Number);
  return [year, month, day];
}

// 일정이 시작하는 때(ms). 종일 일정은 그날 0시다.
export function eventStartMs(event: TodoEvent): number {
  const [year, month, day] = eventDay(event.date);
  if (event.time === null) {
    return new Date(year, month - 1, day).getTime();
  }
  const [hour, minute] = event.time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

// 시각이 있는 일정은 시작하면, 종일 일정은 그날이 끝나면 지난 일정이다.
export function eventPassedMs(event: TodoEvent): number {
  if (event.time !== null) {
    return eventStartMs(event);
  }
  const [year, month, day] = eventDay(event.date);
  return new Date(year, month - 1, day + 1).getTime();
}

// 넣은 때부터 일정이 시작할 때까지 차오른다. 시간이나 날 단위로 끊지 않는다.
export function eventProgress(event: TodoEvent, nowMs: number): number {
  return dueProgress(event.createdAt, eventStartMs(event), nowMs);
}

// 오늘·내일은 말로, 그 밖은 그 언어의 날짜로 적고 시각(없으면 종일)을 붙인다.
export function formatEventStamp(event: TodoEvent, now: Date, lang: Lang): string {
  const [year, month, day] = eventDay(event.date);
  const date = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  const dayLabel =
    days === 0
      ? translate(lang, 'todo.today')
      : days === 1
        ? translate(lang, 'todo.tomorrow')
        : new Intl.DateTimeFormat(
            localeOf(lang),
            year === now.getFullYear()
              ? {month: 'short', day: 'numeric'}
              : {year: 'numeric', month: 'short', day: 'numeric'}
          ).format(date);
  return translate(lang, 'todo.eventStamp', {
    day: dayLabel,
    time: event.time ?? translate(lang, 'todo.allDay')
  });
}
