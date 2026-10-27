import React, {useEffect, useState} from 'react';
import Clock from '../components/Clock';
import FeatureCard from '../components/FeatureCard';
import Pomodoro from '../components/Pomodoro';
import QuoteCard from '../components/QuoteCard';
import ThemeSwitcher from '../components/ThemeSwitcher';
import Weather from '../components/Weather';
import WordCard from '../components/WordCard';
import type {CardLayout} from '../featureCard/cardLayout';
import {
  hideCard,
  readVisibleCards,
  showCard,
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
    layout: {x: 16, y: 48, width: 280, height: 150, pinned: false},
    content: <Weather />
  },
  {
    id: 'clock',
    title: '시계',
    layout: {x: 312, y: 48, width: 260, height: 140, pinned: false},
    content: <Clock />
  },
  {
    id: 'pomodoro',
    title: '뽀모도로',
    layout: {x: 16, y: 208, width: 360, height: 520, pinned: false},
    content: <Pomodoro />
  },
  {
    id: 'quote',
    title: '명언',
    layout: {x: 392, y: 208, width: 280, height: 200, pinned: false},
    content: <QuoteCard />
  },
  {
    id: 'words',
    title: '단어',
    layout: {x: 392, y: 420, width: 300, height: 260, pinned: false},
    content: <WordCard />
  }
];

export default function Board() {
  const [visible, setVisible] = useState<CardId[]>(() => readVisibleCards(localStorage));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(VISIBLE_CARDS_KEY, JSON.stringify(visible));
  }, [visible]);

  const hidden = CARDS.filter(card => !visible.includes(card.id));

  return (
    <>
      <div className="board-tools">
        <ThemeSwitcher />
        <div className="card-adder">
          <button
            type="button"
            className="app-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
          >
            카드 추가
          </button>
          {menuOpen ? (
            <div className="card-menu" role="menu">
              {hidden.length === 0 ? (
                <p>숨긴 카드가 없습니다.</p>
              ) : (
                hidden.map(card => (
                  <button
                    key={card.id}
                    type="button"
                    className="app-button"
                    role="menuitem"
                    onClick={() => {
                      setVisible(current => showCard(current, card.id));
                      setMenuOpen(false);
                    }}
                  >
                    {card.title}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
      {CARDS.filter(card => visible.includes(card.id)).map(card => (
        <FeatureCard
          key={card.id}
          id={card.id}
          title={card.title}
          defaultLayout={card.layout}
          onClose={() => setVisible(current => hideCard(current, card.id))}
        >
          {card.content}
        </FeatureCard>
      ))}
    </>
  );
}
