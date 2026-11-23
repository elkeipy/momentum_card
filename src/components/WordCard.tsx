import React, {useEffect, useRef, useState} from 'react';
import {FONT_SIZE_DEFAULT, REFRESH_SEC_DEFAULT} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import {useT} from '../i18n/i18n';
import {
  dropPracticedWord,
  nextRandomIndex,
  readDefinition,
  readWordList,
  readWordRepGoal,
  removeWord,
  submitWord,
  WORD_LIST_STORAGE_KEY,
  WORD_REP_GOAL_MAX,
  WORD_REP_GOAL_MIN,
  writeWordRepGoal,
  type WordEntry
} from '../words/words';
import DisplaySettingsFields from './DisplaySettingsFields';
import OptionField from './OptionField';
import RemainBar from './RemainBar';
import SettingsModal from './SettingsModal';
import styles from './WordCard.module.css';

const WORD_DEFAULTS = {
  fontSize: FONT_SIZE_DEFAULT,
  refreshSec: REFRESH_SEC_DEFAULT
};
const WORD_LEAVE_MS = 200;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function WordCard() {
  const settings = useDisplaySettings('words', WORD_DEFAULTS);
  const t = useT();
  const [words, setWords] = useState<WordEntry[]>(() => readWordList(localStorage));
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [draft, setDraft] = useState('');
  // null은 뜻을 찾지 못했다는 뜻이다. 문구는 그릴 때 현재 언어로 옮긴다.
  const [definition, setDefinition] = useState<string | null>('');
  const [showAll, setShowAll] = useState(false);
  const [goal, setGoal] = useState(() => readWordRepGoal(localStorage));
  const [goalDraft, setGoalDraft] = useState(goal);
  const [punch, setPunch] = useState(0);
  const [leaving, setLeaving] = useState<string | null>(null);
  const wordsRef = useRef(words);
  const indexRef = useRef(index);
  wordsRef.current = words;
  indexRef.current = index;
  const selected = words[index]?.word ?? '';
  const reps = words[index]?.reps ?? 0;
  const shownReps = leaving === selected ? goal : reps;
  const intervalMs = settings.shown.refreshSec * 1000;

  useEffect(() => {
    localStorage.setItem(WORD_LIST_STORAGE_KEY, JSON.stringify(words));
  }, [words]);

  useEffect(() => {
    if (index >= words.length) {
      setIndex(0);
    }
  }, [index, words.length]);

  useEffect(() => {
    if (settings.isOpen) {
      setGoalDraft(goal);
    }
  }, [settings.isOpen, goal]);

  useEffect(() => {
    if (!leaving) {
      return;
    }
    const word = leaving;
    // shortcut: 이 200ms 안에 새로고침하면 단어가 남는다. 바로 지우면 페이드가 안 보인다.
    const timerId = window.setTimeout(() => {
      const dropped = dropPracticedWord(wordsRef.current, word, indexRef.current);
      setWords(dropped.words);
      setIndex(dropped.index);
      setLeaving(current => (current === word ? null : current));
    }, WORD_LEAVE_MS);
    return () => window.clearTimeout(timerId);
  }, [leaving]);

  useEffect(() => {
    if (words.length === 0) {
      return;
    }
    const timerId = window.setTimeout(() => {
      setIndex(current => nextRandomIndex(current, words.length));
      setStartedAt(Date.now());
    }, intervalMs);
    return () => window.clearTimeout(timerId);
  }, [startedAt, intervalMs, words.length]);

  useEffect(() => {
    if (!selected) {
      setDefinition('');
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(selected)}`,
          {signal: controller.signal}
        );
        if (!response.ok) {
          setDefinition(null);
          return;
        }
        const payload: unknown = await response.json();
        const nextDefinition = readDefinition(payload);
        setDefinition(nextDefinition || null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setDefinition(null);
      }
    };
    void load();
    return () => controller.abort();
  }, [selected]);

  const saveWord = () => {
    if (leaving) {
      return;
    }
    const result = submitWord(words, draft, goal);
    if (result.kind === 'ignore') {
      return;
    }
    setDraft('');
    if (result.kind === 'added') {
      setWords(result.words);
      setIndex(result.words.length - 1);
      setStartedAt(Date.now());
      setShowAll(true);
      return;
    }
    if (result.kind === 'hit') {
      setWords(result.words);
      if (result.word === selected) {
        setPunch(count => count + 1);
      }
      return;
    }
    if (prefersReducedMotion()) {
      const dropped = dropPracticedWord(words, result.word, index);
      setWords(dropped.words);
      setIndex(dropped.index);
      return;
    }
    setLeaving(result.word);
  };

  const refresh = () => {
    setIndex(current => nextRandomIndex(current, words.length));
    setStartedAt(Date.now());
  };

  const saveSettings = () => {
    writeWordRepGoal(localStorage, goalDraft);
    const nextGoal = readWordRepGoal(localStorage);
    const kept = words.filter(entry => entry.reps < nextGoal);
    if (kept.length !== words.length) {
      const currentWord = words[index]?.word;
      const nextIndex = kept.findIndex(entry => entry.word === currentWord);
      setWords(kept);
      setIndex(nextIndex < 0 ? 0 : nextIndex);
    }
    setGoal(nextGoal);
    settings.save();
  };

  const wordClass = [
    styles.word,
    leaving === selected ? styles.gone : '',
    punch > 0 && leaving !== selected ? styles.punch : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.root}>
      <div className={styles.fixed}>
        <p
          key={punch}
          className={wordClass}
          style={{fontSize: `${settings.shown.fontSize}px`}}
        >
          {selected || t('word.none')}
        </p>
        {selected ? (
          <div className={styles.practice}>
            <div
              className={styles.practiceBar}
              role="progressbar"
              aria-label={t('word.practice', {word: selected})}
              aria-valuemin={0}
              aria-valuemax={goal}
              aria-valuenow={Math.min(shownReps, goal)}
            >
              <span
                className={styles.practiceFill}
                style={{width: `${Math.min(100, (shownReps / goal) * 100)}%`}}
              />
            </div>
            <span className={styles.practiceCount}>
              {shownReps}/{goal}
            </span>
          </div>
        ) : null}
        <p className={selected ? styles.definition : styles.empty}>
          {selected ? (definition ?? t('word.notFound')) : t('word.emptyHint')}
        </p>
        {words.length > 0 ? (
          <RemainBar
            durationMs={intervalMs}
            startedAt={startedAt}
            label={t('word.remaining')}
            refreshLabel={t('word.refresh')}
            onRefresh={refresh}
          />
        ) : null}
        <form
          className={styles.form}
          onSubmit={event => {
            event.preventDefault();
            saveWord();
          }}
        >
          <label htmlFor="new-word">{t('word.addLabel')}</label>
          <div className={styles.join}>
            <input
              id="new-word"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder="english"
            />
            <button className="app-button" type="submit">
              {t('word.add')}
            </button>
          </div>
        </form>
        <button
          className={`text-button ${styles.listToggle}`}
          type="button"
          onClick={() => setShowAll(current => !current)}
        >
          {t('word.all')}
        </button>
      </div>
      {showAll ? (
        <ul className={styles.list}>
          {words.map(entry => (
            <li
              key={entry.word}
              className={leaving === entry.word ? styles.gone : undefined}
            >
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setIndex(words.findIndex(item => item.word === entry.word));
                  setStartedAt(Date.now());
                }}
              >
                {entry.word}
              </button>
              <button
                className="text-button"
                type="button"
                aria-label={t('word.deleteAria', {word: entry.word})}
                onClick={() => {
                  const nextWords = removeWord(words, entry.word);
                  setWords(nextWords);
                  if (selected === entry.word) {
                    setIndex(0);
                    setStartedAt(Date.now());
                  }
                }}
              >
                {t('word.delete')}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {settings.isOpen ? (
        <SettingsModal
          title={t('settings.words')}
          onSave={saveSettings}
          onClose={settings.close}
        >
          <OptionField
            id="wordRepGoal"
            label={t('word.reps')}
            min={WORD_REP_GOAL_MIN}
            max={WORD_REP_GOAL_MAX}
            value={goalDraft}
            onValue={setGoalDraft}
          />
          <DisplaySettingsFields
            value={settings.draft}
            onChange={settings.setDraft}
            showRefresh
          />
        </SettingsModal>
      ) : null}
    </div>
  );
}
