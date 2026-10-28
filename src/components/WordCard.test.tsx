import React from 'react';
import {render, screen} from '@testing-library/react';
import WordCard from './WordCard';

test('shows a remaining-time bar like the quote card', () => {
  render(<WordCard />);
  expect(screen.getByRole('progressbar', {name: '단어 남은 시간'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: '단어 새로고침'})).toBeInTheDocument();
});
