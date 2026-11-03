import React from 'react';
import ReactDOM from 'react-dom/client';
import Board from './board/Board';
import {applyTheme, readTheme} from './theme/theme';
import './index.css';
import './theme/themes.css';

applyTheme(readTheme(localStorage));

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Board />
  </React.StrictMode>
);
