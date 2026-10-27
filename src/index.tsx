import React from 'react';
import ReactDOM from 'react-dom/client';
import Clock from './components/Clock';
import Weather from './components/Weather';
import Pomodoro from './components/Pomodoro';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Weather />
    <Clock />
    <Pomodoro />
  </React.StrictMode>
);
