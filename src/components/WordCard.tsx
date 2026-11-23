import React, {useEffect, useState} from 'react';
import {
  FONT_SIZE_DEFAULT,
  REFRESH_SEC_DEFAULT
} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import {useT} from '../i18n/i18n';
import {
  addWord,
  nextRandomIndex,
  readDefinition,
  readWordList,
  removeWord,
  sanitizeWord,
  WORD_LIST_STORAGE_KEY
} from '../words/words';
import DisplaySettingsFields from './DisplaySettingsFields';
import RemainBar from './RemainBar';
import SettingsModal from './SettingsModal';
import styles from './WordCard.module.css';

const WORD_DEFAULTS = {
  fontSize: FONT_SIZE_DEFAULT,
  refreshSec: REFRESH_SEC_DEFAULT
};

export default function WordCard() {
  const settings = useDisplaySettings('words', WORD_DEFAULTS);
  const t = useT();
  const [words, setWords] = useState<string[]>(() => readWordList(localStorage));
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [draft, setDraft] = useState('');
  // null은 뜻을 찾지 못했다는 뜻이다. 문구는 그릴 때 현재 언어로 옮긴다.
  const [definition, setDefinition] = useState<string | null>('');
  const [showAll, setShowAll] = useState(false);
  const selected = words[index] ?? words[0] ?? '';
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
    const nextWords = addWord(words, draft);
    if (nextWords === words) {
      return;
    }
    setWords(nextWords);
    const word = sanitizeWord(draft);
    if (word) {
      setIndex(nextWords.indexOf(word));
      setStartedAt(Date.now());
    }
    setDraft('');
    setShowAll(true);
  };

  const refresh = () => {
    setIndex(current => nextRandomIndex(current, words.length));
    setStartedAt(Date.now());
  };

  return (
    <div className={styles.root}>
      <div className={styles.fixed}>
        <p className={styles.word} style={{fontSize: `${settings.shown.fontSize}px`}}>
          {selected || t('word.none')}
        </p>
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
          {words.map((word, wordIndex) => (
            <li key={word}>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setIndex(wordIndex);
                  setStartedAt(Date.now());
                }}
              >
                {word}
              </button>
              <button
                className="text-button"
                type="button"
                aria-label={t('word.deleteAria', {word})}
                onClick={() => {
                  const nextWords = removeWord(words, word);
                  setWords(nextWords);
                  if (selected === word) {
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
        <SettingsModal title={t('settings.words')} onSave={settings.save} onClose={settings.close}>
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
