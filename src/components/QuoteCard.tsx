import React, {useEffect, useState} from 'react';
import {nextQuoteIndex, QUOTE_REFRESH_MS, QUOTES, remainingQuoteSeconds} from '../quotes/quotes';

export default function QuoteCard() {
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const quote = QUOTES[index] ?? QUOTES[0];

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (now - startedAt < QUOTE_REFRESH_MS) {
      return;
    }
    setIndex(current => nextQuoteIndex(current, QUOTES.length));
    setStartedAt(now);
  }, [now, startedAt]);

  const refresh = () => {
    const currentTime = Date.now();
    setIndex(current => nextQuoteIndex(current, QUOTES.length));
    setStartedAt(currentTime);
    setNow(currentTime);
  };

  return (
    <div>
      <p>{quote.text}</p>
      <p>{quote.from}</p>
      <p>남은 시간 {remainingQuoteSeconds(now - startedAt)}초</p>
      <button type="button" onClick={refresh}>
        명언 새로고침
      </button>
    </div>
  );
}
