import React, {useEffect, useState} from 'react';
import Clock from '../components/Clock';
import FeatureCard from '../components/FeatureCard';
import Pomodoro from '../components/Pomodoro';
import QuoteCard from '../components/QuoteCard';
import Weather from '../components/Weather';
import TodoCard from '../components/TodoCard';
import WordCard from '../components/WordCard';
import {isLang, LANGS, setLang, t, useLang, useT} from '../i18n/i18n';
import NtfySettings from '../notify/NtfySettings';
import {applyTheme, isThemeId, readTheme, THEMES, type ThemeId} from '../theme/theme';
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
  layout: CardLayout;
  content: React.ReactNode;
};

const CARDS: CardSpec[] = [
  {
    id: 'weather',    layout: {x: 24, y: 96, width: 420, height: 168, pinned: false},
    content: <Weather />
  },
  {
    id: 'clock',    layout: {x: 460, y: 96, width: 420, height: 168, pinned: false},
    content: <Clock />
  },
  {
    id: 'pomodoro',    layout: {x: 24, y: 280, width: 640, height: 520, pinned: false},
    content: <Pomodoro />
  },
  {
    id: 'quote',    layout: {x: 680, y: 280, width: 420, height: 220, pinned: false},
    content: <QuoteCard />
  },
  {
    id: 'words',    layout: {x: 680, y: 516, width: 420, height: 280, pinned: false},
    content: <WordCard />
  },
  {
    id: 'todos',    layout: {x: 680, y: 812, width: 420, height: 320, pinned: false},
    content: <TodoCard />
  }
];

const HISTORY_REFRESH_MS = 5000;

function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function todaySentence(minutes: PeriodMinutes, day: string): string {
  const lost =
    minutes.Lost > 0 ? t('today.lost', {lost: t('minutes', {n: minutes.Lost})}) : '';
  return t('today', {focus: t('minutes', {n: minutes.Focus}), lost, day});
}

function Mark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="2"
      />
      <path
        d="M12 4A8 8 0 1 1 4 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 12V7.5M12 12H15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="4" cy="12" r="1.8" fill="var(--accent)" />
    </svg>
  );
}

function readFact(): {minutes: PeriodMinutes; day: string} {
  const now = new Date();
  return {
    minutes: summarizePeriodMinutes(readTodayFocusHistory(localStorage, now)),
    day: formatDay(now)
  };
}

function TodayFact() {
  useLang();
  const [fact, setFact] = useState(readFact);

  useEffect(() => {
    const update = () => setFact(readFact());
    update();
    const timerId = window.setInterval(update, HISTORY_REFRESH_MS);
    return () => window.clearInterval(timerId);
  }, []);

  return <p className="mast-sub">{todaySentence(fact.minutes, fact.day)}</p>;
}

export default function Board() {
  const [visible, setVisible] = useState<CardId[]>(() => readVisibleCards(localStorage));
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(() => readTheme(localStorage));
  const lang = useLang();
  const t = useT();
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
        title={t(`card.${card.id}`)}
        defaultLayout={card.layout}
        frontNonce={frontNonce[card.id] ?? 0}
        onClose={() => setVisible(current => hideCard(current, card.id))}
      >
        {card.content}
      </FeatureCard>
    );
  };

  const showBand = visible.includes('weather') || visible.includes('clock');
  const showStack =
    visible.includes('quote') || visible.includes('words') || visible.includes('todos');

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
          <label className="theme-pick">
            {t('lang.label')}
            <select
              value={lang}
              onChange={event => {
                const next = event.target.value;
                if (isLang(next)) {
                  setLang(next);
                }
              }}
            >
              {LANGS.map(item => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="theme-pick">
            {t('theme.label')}
            <select
              value={theme}
              onChange={event => {
                const next = event.target.value;
                if (!isThemeId(next)) {
                  return;
                }
                setTheme(next);
                applyTheme(next, localStorage);
              }}
            >
              {THEMES.map(item => (
                <option key={item.id} value={item.id}>
                  {t(`theme.${item.id}`)}
                </option>
              ))}
            </select>
          </label>
          <NtfySettings />
          <button
            type="button"
            className="app-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
          >
            {t('cardList')}
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
                    {t(`card.${card.id}`)}
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
            {renderCard('todos')}
          </div>
        ) : null}
      </div>
    </>
  );
}
