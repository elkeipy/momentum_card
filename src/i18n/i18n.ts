import {useSyncExternalStore} from 'react';
import {en, ko, type MessageKey} from './messages';

export type Lang = 'ko' | 'en';

export const LANG_STORAGE_KEY = 'momentum-lang';

// 언어 이름은 그 언어로 적어 둔다. 어느 화면 언어에서도 찾을 수 있어야 한다.
export const LANGS: ReadonlyArray<{id: Lang; label: string}> = [
  {id: 'ko', label: '한국어'},
  {id: 'en', label: 'English'}
];

const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = {ko, en};
const LOCALES: Record<Lang, string> = {ko: 'ko-KR', en: 'en-US'};

export function isLang(value: unknown): value is Lang {
  return value === 'ko' || value === 'en';
}

export function localeOf(lang: Lang): string {
  return LOCALES[lang];
}

// 저장된 선택이 먼저이고, 없으면 브라우저의 첫 언어가 한국어일 때만 한국어다.
export function detectLang(stored: string | null, browserLanguages: readonly string[]): Lang {
  if (isLang(stored)) {
    return stored;
  }
  return (browserLanguages[0] ?? '').toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

export function translate(
  lang: Lang,
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  return DICTIONARIES[lang][key].replace(/\{(\w+)\}/g, (token, name: string) =>
    params && name in params ? String(params[name]) : token
  );
}

function readStoredLang(): string | null {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return null;
  }
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') {
    return [];
  }
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

let current: Lang = detectLang(readStoredLang(), browserLanguages());
const listeners = new Set<() => void>();

function applyDocumentLang(lang: Lang) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

applyDocumentLang(current);

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang, persist = true): void {
  if (next === current) {
    return;
  }
  current = next;
  applyDocumentLang(next);
  if (persist) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // 저장이 막힌 브라우저에서는 이번 방문 동안만 바뀐다.
    }
  }
  listeners.forEach(listener => listener());
}

function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// React 밖(타이머, 알림)에서도 쓰는 번역 함수다. 지금 고른 언어로 바로 옮긴다.
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return translate(current, key, params);
}

// 언어가 바뀌면 이 훅을 쓰는 컴포넌트가 다시 그려진다.
export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getLang);
}

export function useT(): typeof t {
  useLang();
  return t;
}
