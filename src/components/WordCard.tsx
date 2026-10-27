import React, {useEffect, useState} from 'react';
import {
  addWord,
  readDefinition,
  readWordList,
  removeWord,
  sanitizeWord,
  WORD_LIST_STORAGE_KEY
} from '../words/words';
import styles from './WordCard.module.css';

export default function WordCard() {
  const [words, setWords] = useState<string[]>(() => readWordList(localStorage));
  const [selected, setSelected] = useState(() => readWordList(localStorage)[0] ?? '');
  const [draft, setDraft] = useState('');
  const [definition, setDefinition] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    localStorage.setItem(WORD_LIST_STORAGE_KEY, JSON.stringify(words));
  }, [words]);

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
          setDefinition('뜻을 찾지 못했습니다.');
          return;
        }
        const payload: unknown = await response.json();
        const nextDefinition = readDefinition(payload);
        setDefinition(nextDefinition || '뜻을 찾지 못했습니다.');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setDefinition('뜻을 찾지 못했습니다.');
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
    setSelected(sanitizeWord(draft) ?? selected);
    setDraft('');
    setShowAll(true);
  };

  return (
    <div className={styles.root}>
      <p className={styles.word}>{selected || '단어가 없습니다.'}</p>
      <p className={selected ? styles.definition : styles.empty}>
        {selected ? definition : '영어 단어를 추가하면 뜻이 여기에 붙는다.'}
      </p>
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault();
          saveWord();
        }}
      >
        <label htmlFor="new-word">단어 추가</label>
        <div className={styles.join}>
          <input
            id="new-word"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="english"
          />
          <button className="app-button" type="submit">
            추가
          </button>
        </div>
      </form>
      <button
        className={`text-button ${styles.listToggle}`}
        type="button"
        onClick={() => setShowAll(current => !current)}
      >
        전체 목록
      </button>
      {showAll ? (
        <ul className={styles.list}>
          {words.map(word => (
            <li key={word}>
              <button className="text-button" type="button" onClick={() => setSelected(word)}>
                {word}
              </button>
              <button
                className="text-button"
                type="button"
                aria-label={`${word} 삭제`}
                onClick={() => {
                  const nextWords = removeWord(words, word);
                  setWords(nextWords);
                  if (selected === word) {
                    setSelected(nextWords[0] ?? '');
                  }
                }}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
