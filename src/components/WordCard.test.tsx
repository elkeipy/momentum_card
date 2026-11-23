import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import WordCard from './WordCard';

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
