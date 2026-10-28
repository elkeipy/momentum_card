import React, {useEffect, useState} from 'react';
import Clock from '../components/Clock';
import FeatureCard from '../components/FeatureCard';
import Pomodoro from '../components/Pomodoro';
import QuoteCard from '../components/QuoteCard';
import Weather from '../components/Weather';
import WordCard from '../components/WordCard';
import type {CardLayout} from '../featureCard/cardLayout';
import {
  readTodayFocusHistory,
  summarizePeriodMinutes,
  type PeriodMinutes
} from '../pomodoro/focusHistory';
import {
  hideCard,
  readVisibleCards,
  toggleCard,
  VISIBLE_CARDS_KEY,
  type CardId
} from './visibleCards';

type CardSpec = {
  id: CardId;
  title: string;
  layout: CardLayout;
  content: React.ReactNode;
};

const CARDS: CardSpec[] = [
  {
    id: 'weather',
    title: '날씨',
    layout: {x: 24, y: 96, width: 420, height: 168, pinned: false},
    content: <Weather />
  },
  {
    id: 'clock',
    title: '시계',
    layout: {x: 460, y: 96, width: 420, height: 168, pinned: false},
    content: <Clock />
  },
  {
    id: 'pomodoro',
    title: '뽀모도로',
    layout: {x: 24, y: 280, width: 640, height: 520, pinned: false},
    content: <Pomodoro />
  },
  {
    id: 'quote',
    title: '명언',
    layout: {x: 680, y: 280, width: 420, height: 220, pinned: false},
    content: <QuoteCard />
  },
  {
    id: 'words',
    title: '단어',
    layout: {x: 680, y: 516, width: 420, height: 280, pinned: false},
    content: <WordCard />
  }
];

const HISTORY_REFRESH_MS = 5000;

function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function todaySentence(minutes: PeriodMinutes, day: string): string {
  const lost = minutes.Lost > 0 ? `, 놓친 ${minutes.Lost}분` : '';
  return `오늘 집중 ${minutes.Focus}분${lost} · ${day}`;
}

function Mark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="15"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="6" y="13" width="12" height="3" rx="1.5" fill="var(--accent)" />
    </svg>
  );
}

function TodayFact() {
  const [line, setLine] = useState(() => todaySentence(
    summarizePeriodMinutes(readTodayFocusHistory(localStorage, new Date())),
    formatDay(new Date())
  ));

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const minutes = summarizePeriodMinutes(readTodayFocusHistory(localStorage, now));
      setLine(todaySentence(minutes, formatDay(now)));
    };
    update();
    const timerId = window.setInterval(update, HISTORY_REFRESH_MS);
    return () => window.clearInterval(timerId);
  }, []);

  return <p className="mast-sub">{line}</p>;
}

export default function Board() {
  const [visible, setVisible] = useState<CardId[]>(() => readVisibleCards(localStorage));
  const [menuOpen, setMenuOpen] = useState(false);
  const [frontNonce, setFrontNonce] = useState<Partial<Record<CardId, number>>>({});
  const cardById = (id: CardId) => CARDS.find(card => card.id === id);

  useEffect(() => {
    localStorage.setItem(VISIBLE_CARDS_KEY, JSON.stringify(visible));
  }, [visible]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const renderCard = (id: CardId) => {
    const card = cardById(id);
    if (!card || !visible.includes(id)) {
      return null;
    }
    return (
      <FeatureCard
        key={card.id}
        id={card.id}
        title={card.title}
        defaultLayout={card.layout}
        frontNonce={frontNonce[card.id] ?? 0}
        onClose={() => setVisible(current => hideCard(current, card.id))}
      >
        {card.content}
      </FeatureCard>
    );
  };

  const showBand = visible.includes('weather') || visible.includes('clock');
  const showStack = visible.includes('quote') || visible.includes('words');

  return (
    <>
      <header className="mast">
        <div className="brand">
          <Mark />
          <span>Momentum</span>
        </div>
        <div className="title-block">
          <h1 className="screen-title">This session</h1>
          <TodayFact />
        </div>
        <div className="card-adder">
          <button
            type="button"
            className="app-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
          >
            카드 목록
          </button>
          {menuOpen ? (
            <div className="card-menu" role="menu">
              {CARDS.map(card => {
                const isOn = visible.includes(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    className="app-button"
                    role="menuitemcheckbox"
                    aria-checked={isOn}
                    onClick={() => {
                      setVisible(current => toggleCard(current, card.id));
                      if (!isOn) {
                        setFrontNonce(current => ({
                          ...current,
                          [card.id]: (current[card.id] ?? 0) + 1
                        }));
                      }
                    }}
                  >
                    {card.title}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </header>
      <div className="desk">
        {showBand ? (
          <div className="band">
            {renderCard('weather')}
            {renderCard('clock')}
          </div>
        ) : null}
        {visible.includes('pomodoro') ? (
          <div className="pomo-slot">{renderCard('pomodoro')}</div>
        ) : null}
        {showStack ? (
          <div className="stack">
            {renderCard('quote')}
            {renderCard('words')}
          </div>
        ) : null}
      </div>
    </>
  );
}
