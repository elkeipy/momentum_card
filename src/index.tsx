import React from 'react';
import ReactDOM from 'react-dom/client';
import Clock from './components/Clock';
import Weather from './components/Weather';
import Pomodoro from './components/Pomodoro';
import QuoteCard from './components/QuoteCard';
import WordCard from './components/WordCard';
import FeatureCard from './components/FeatureCard';
import ThemeSwitcher from './components/ThemeSwitcher';
import type {CardLayout} from './featureCard/cardLayout';
import './index.css';
import './theme/themes.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const weatherLayout: CardLayout = {x: 16, y: 48, width: 280, height: 150, pinned: false};
const clockLayout: CardLayout = {x: 312, y: 48, width: 260, height: 140, pinned: false};
const pomodoroLayout: CardLayout = {x: 16, y: 208, width: 360, height: 480, pinned: false};
const quoteLayout: CardLayout = {x: 392, y: 208, width: 280, height: 200, pinned: false};
const wordLayout: CardLayout = {x: 392, y: 420, width: 300, height: 260, pinned: false};

root.render(
  <React.StrictMode>
    <ThemeSwitcher />
    <FeatureCard id="weather" title="날씨" defaultLayout={weatherLayout}>
      <Weather />
    </FeatureCard>
    <FeatureCard id="clock" title="시계" defaultLayout={clockLayout}>
      <Clock />
    </FeatureCard>
    <FeatureCard id="pomodoro" title="뽀모도로" defaultLayout={pomodoroLayout}>
      <Pomodoro />
    </FeatureCard>
    <FeatureCard id="quote" title="명언" defaultLayout={quoteLayout}>
      <QuoteCard />
    </FeatureCard>
    <FeatureCard id="words" title="단어" defaultLayout={wordLayout}>
      <WordCard />
    </FeatureCard>
  </React.StrictMode>
);
