export const WORD_LIST_STORAGE_KEY = 'wordList';
export const MAX_WORDS = 20;
export const DEFAULT_WORDS = ['focus', 'steady', 'clear'];

const WORD_PATTERN = /^[a-z][a-z'-]{0,39}$/i;

export function sanitizeWord(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!WORD_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function readWordList(storage: {getItem(key: string): string | null}): string[] {
  const raw = storage.getItem(WORD_LIST_STORAGE_KEY);
  if (!raw) {
    return [...DEFAULT_WORDS];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_WORDS];
    }
    const words = parsed
      .filter((word): word is string => typeof word === 'string')
      .map(sanitizeWord)
      .filter((word): word is string => word !== null)
      .slice(0, MAX_WORDS);
    return words.length > 0 ? words : [...DEFAULT_WORDS];
  } catch {
    return [...DEFAULT_WORDS];
  }
}

export function addWord(words: string[], value: string): string[] {
  const word = sanitizeWord(value);
  if (!word || words.includes(word) || words.length >= MAX_WORDS) {
    return words;
  }
  return [...words, word];
}

export function removeWord(words: string[], value: string): string[] {
  return words.filter(word => word !== value);
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
