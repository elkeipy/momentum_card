import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {CardSettingsProvider} from '../featureCard/cardSettingsContext';
import WordCard from './WordCard';

beforeEach(() => {
  localStorage.clear();
});

test('shows a remaining-time bar like the quote card', () => {
  render(<WordCard />);
  expect(screen.getByRole('progressbar', {name: '단어 남은 시간'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: '단어 새로고침'})).toBeInTheDocument();
});

test('keeps the word and the add field apart from the scrolling list', () => {
  render(<WordCard />);
  fireEvent.click(screen.getByRole('button', {name: '전체 목록'}));
  const list = screen.getByRole('list');
  const fixed = screen.getByLabelText('단어 추가').closest('.fixed');
  expect(fixed).not.toBeNull();
  expect(fixed).toContainElement(screen.getByRole('button', {name: '전체 목록'}));
  expect(fixed).not.toContainElement(list);
});

test('counts another entry of the word on screen and ignores the bar for a different one', () => {
  render(<WordCard />);
  const input = screen.getByLabelText('단어 추가');
  const form = input.closest('form');
  expect(form).not.toBeNull();
  fireEvent.change(input, {target: {value: 'steady'}});
  fireEvent.submit(form!);
  expect(screen.getByRole('progressbar', {name: 'focus 연습'})).toHaveAttribute(
    'aria-valuenow',
    '0'
  );
  fireEvent.change(input, {target: {value: 'focus'}});
  fireEvent.submit(form!);
  expect(screen.getByRole('progressbar', {name: 'focus 연습'})).toHaveAttribute(
    'aria-valuenow',
    '1'
  );
  expect(screen.getByText('1/20')).toBeInTheDocument();
});

test('drops the word when the repeat reaches the saved goal', () => {
  localStorage.setItem('wordRepGoal', '1');
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
  }));
  render(<WordCard />);
  const input = screen.getByLabelText('단어 추가');
  fireEvent.change(input, {target: {value: 'focus'}});
  fireEvent.submit(input.closest('form')!);
  expect(screen.queryByRole('progressbar', {name: 'focus 연습'})).not.toBeInTheDocument();
  expect(screen.getByRole('progressbar', {name: 'steady 연습'})).toHaveAttribute(
    'aria-valuenow',
    '0'
  );
});

test('saves the practice goal from word settings', () => {
  render(
    <CardSettingsProvider value={{isOpen: true, close: () => undefined}}>
      <WordCard />
    </CardSettingsProvider>
  );
  fireEvent.click(screen.getByRole('button', {name: '연습 횟수 늘리기'}));
  fireEvent.click(screen.getByRole('button', {name: 'Save'}));
  expect(localStorage.getItem('wordRepGoal')).toBe('21');
});
