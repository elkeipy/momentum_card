import React, {useEffect, useState} from 'react';
import {nextQuoteIndex, QUOTE_REFRESH_MS, QUOTES} from '../quotes/quotes';
import styles from './QuoteCard.module.css';

export default function QuoteCard() {
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const quote = QUOTES[index] ?? QUOTES[0];

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIndex(current => nextQuoteIndex(current, QUOTES.length));
      setStartedAt(Date.now());
    }, QUOTE_REFRESH_MS);
    return () => window.clearTimeout(timerId);
  }, [startedAt]);

  const refresh = () => {
    setIndex(current => nextQuoteIndex(current, QUOTES.length));
    setStartedAt(Date.now());
  };

  return (
    <div>
      <p className={styles.quote}>{quote.text}</p>
      <p className={styles.from}>{quote.from}</p>
      <div
        className={styles.remain}
        role="progressbar"
        aria-label="명언 남은 시간"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          key={startedAt}
          className={styles.remainFill}
          style={{animationDuration: `${QUOTE_REFRESH_MS}ms`}}
        />
      </div>
      <button className={`app-button ${styles.refresh}`} type="button" onClick={refresh}>
        명언 새로고침
      </button>
    </div>
  );
}
