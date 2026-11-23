export const WORD_LIST_STORAGE_KEY = 'wordList';
export const WORD_REP_GOAL_KEY = 'wordRepGoal';
export const WORD_REP_GOAL_DEFAULT = 20;
export const WORD_REP_GOAL_MIN = 1;
export const WORD_REP_GOAL_MAX = 100;
export const MAX_WORDS = 20;
export const DEFAULT_WORDS = ['focus', 'steady', 'clear'];

const WORD_PATTERN = /^[a-z][a-z'-]{0,39}$/i;

export type WordEntry = {
  word: string;
  reps: number;
};

export type WordSubmit =
  | {kind: 'ignore'}
  | {kind: 'added'; words: WordEntry[]; word: string}
  | {kind: 'hit'; words: WordEntry[]; word: string}
  | {kind: 'clear'; words: WordEntry[]; word: string};

export function sanitizeWord(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!WORD_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function defaultEntries(): WordEntry[] {
  return DEFAULT_WORDS.map(word => ({word, reps: 0}));
}

function readReps(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return 0;
  }
  return value;
}

function readEntry(value: unknown): WordEntry | null {
  if (typeof value === 'string') {
    const word = sanitizeWord(value);
    return word ? {word, reps: 0} : null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as {word?: unknown; reps?: unknown};
  if (typeof raw.word !== 'string') {
    return null;
  }
  const word = sanitizeWord(raw.word);
  if (!word) {
    return null;
  }
  return {word, reps: readReps(raw.reps)};
}

export function readWordList(storage: {
  getItem(key: string): string | null;
}): WordEntry[] {
  const raw = storage.getItem(WORD_LIST_STORAGE_KEY);
  if (!raw) {
    return defaultEntries();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultEntries();
    }
    if (parsed.length === 0) {
      return [];
    }
    const words = parsed
      .map(readEntry)
      .filter((entry): entry is WordEntry => entry !== null)
      .slice(0, MAX_WORDS);
    return words.length > 0 ? words : defaultEntries();
  } catch {
    return defaultEntries();
  }
}

export function readWordRepGoal(storage: {getItem(key: string): string | null}): number {
  const raw = storage.getItem(WORD_REP_GOAL_KEY);
  const value = Number(raw);
  if (
    !Number.isInteger(value) ||
    value < WORD_REP_GOAL_MIN ||
    value > WORD_REP_GOAL_MAX
  ) {
    return WORD_REP_GOAL_DEFAULT;
  }
  return value;
}

export function writeWordRepGoal(
  storage: {setItem(key: string, value: string): void},
  goal: number
): void {
  const bounded = Math.min(
    WORD_REP_GOAL_MAX,
    Math.max(WORD_REP_GOAL_MIN, Math.trunc(goal))
  );
  storage.setItem(WORD_REP_GOAL_KEY, String(bounded));
}

export function submitWord(words: WordEntry[], value: string, goal: number): WordSubmit {
  const word = sanitizeWord(value);
  if (!word) {
    return {kind: 'ignore'};
  }
  const index = words.findIndex(entry => entry.word === word);
  if (index < 0) {
    if (words.length >= MAX_WORDS) {
      return {kind: 'ignore'};
    }
    return {kind: 'added', word, words: [...words, {word, reps: 0}]};
  }
  const reps = words[index].reps + 1;
  if (reps >= goal) {
    return {kind: 'clear', word, words: words.filter(entry => entry.word !== word)};
  }
  const next = words.slice();
  next[index] = {word, reps};
  return {kind: 'hit', word, words: next};
}

export function removeWord(words: WordEntry[], value: string): WordEntry[] {
  return words.filter(entry => entry.word !== value);
}

export function dropPracticedWord(
  words: WordEntry[],
  word: string,
  index: number
): {words: WordEntry[]; index: number} {
  const at = words.findIndex(entry => entry.word === word);
  const next = words.filter(entry => entry.word !== word);
  if (at < 0 || next.length === 0) {
    return {words: next, index: 0};
  }
  if (at < index) {
    return {words: next, index: index - 1};
  }
  if (at === index) {
    return {words: next, index: Math.min(index, next.length - 1)};
  }
  return {words: next, index};
}

export function nextRandomIndex(
  current: number,
  length: number,
  random = Math.random
): number {
  if (length <= 1) {
    return 0;
  }
  const offset = 1 + Math.floor(random() * (length - 1));
  return (current + offset) % length;
}

export function readDefinition(payload: unknown): string {
  if (!Array.isArray(payload) || payload.length === 0) {
    return '';
  }
  const entry = payload[0] as {
    meanings?: Array<{definitions?: Array<{definition?: unknown}>}>;
  };
  const definition = entry.meanings?.[0]?.definitions?.[0]?.definition;
  if (typeof definition !== 'string') {
    return '';
  }
  return Array.from(definition)
    .filter(char => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, 180);
}
