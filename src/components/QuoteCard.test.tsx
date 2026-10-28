import React from 'react';
import {render, screen} from '@testing-library/react';
import QuoteCard from './QuoteCard';

test('shows a remaining-time bar instead of seconds text', () => {
  render(<QuoteCard />);
  expect(screen.getByRole('progressbar', {name: '명언 남은 시간'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: '명언 새로고침'})).toBeInTheDocument();
  expect(screen.queryByText(/남은 시간/)).not.toBeInTheDocument();
});
