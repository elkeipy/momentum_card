import React from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react';
import Board from '../board/Board';
import QuoteCard from '../components/QuoteCard';
import TodoCard from '../components/TodoCard';
import WordCard from '../components/WordCard';
import {LANG_STORAGE_KEY, setLang} from './i18n';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn(() => Promise.resolve({ok: false})) as unknown as typeof fetch;
});

afterEach(() => {
  localStorage.removeItem(LANG_STORAGE_KEY);
});

test('shows the to-do card in English', () => {
  setLang('en', false);
  render(<TodoCard />);
  expect(screen.getByLabelText('Add a to-do')).toBeInTheDocument();
  expect(screen.getByText('0 left · 0 total')).toBeInTheDocument();
  expect(screen.getByText('To-dos you add will pile up here.')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Add a to-do'), {target: {value: 'lunch #'}});
  expect(screen.getByRole('button', {name: 'Add to Calendar'})).toBeInTheDocument();
  expect(screen.getByLabelText('Event date')).toBeInTheDocument();
  expect(screen.getByLabelText('Event time (leave blank for all-day)')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Add a to-do'), {target: {value: 'call @'}});
  expect(screen.getByLabelText('Deadline hour')).toBeInTheDocument();
  expect(screen.getByLabelText('Deadline minute')).toBeInTheDocument();
});

test('shows the quote card in English', () => {
  setLang('en', false);
  render(<QuoteCard />);
  expect(screen.getByText('Finish one interval and the next one feels lighter.')).toBeInTheDocument();
  expect(screen.getByRole('progressbar', {name: 'Quote time remaining'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Refresh quote'})).toBeInTheDocument();
});

test('shows the word card in English and reports a missing meaning', async () => {
  setLang('en', false);
  await act(async () => {
    render(<WordCard />);
  });
  expect(screen.getByRole('button', {name: 'Refresh word'})).toBeInTheDocument();
  expect(screen.getByLabelText('Add a word')).toBeInTheDocument();
  expect(screen.getByText('Meaning not found.')).toBeInTheDocument();
});

test('switches the whole board between Korean and English', async () => {
  render(<Board />);
  expect(screen.getByRole('region', {name: '날씨'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: '카드 목록'})).toBeInTheDocument();

  const languageSelect = () => screen.getByRole('combobox', {name: /언어|Language/});
  fireEvent.change(languageSelect(), {target: {value: 'en'}});

  for (const name of ['Weather', 'Clock', 'Pomodoro', 'Quote', 'Words', 'To-do']) {
    expect(screen.getByRole('region', {name})).toBeInTheDocument();
  }
  expect(screen.getByRole('button', {name: 'Card list'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Push notifications'})).toBeInTheDocument();
  expect(screen.getByText(/^Focus today: 0 min · \d{4}-\d{2}-\d{2}$/)).toBeInTheDocument();
  expect(screen.getByText('This browser does not support geolocation.')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Weather settings'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Pin Weather'})).toBeInTheDocument();
  expect(screen.getByRole('option', {name: 'Glassmorphism'})).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('en');
  expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');

  fireEvent.change(languageSelect(), {target: {value: 'ko'}});
  expect(screen.getByRole('region', {name: '날씨'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: '푸시 알림'})).toBeInTheDocument();
  expect(screen.getByText(/^오늘 집중 0분 · \d{4}-\d{2}-\d{2}$/)).toBeInTheDocument();
  expect(screen.getByRole('option', {name: '글래스모피즘'})).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('ko');
});
