import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import FeatureCard from './FeatureCard';
import QuoteCard from './QuoteCard';

beforeEach(() => {
  localStorage.clear();
});

test('shows a remaining-time bar instead of seconds text', () => {
  render(<QuoteCard />);
  expect(screen.getByRole('progressbar', {name: '명언 남은 시간'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: '명언 새로고침'})).toBeInTheDocument();
  expect(screen.queryByText(/남은 시간/)).not.toBeInTheDocument();
});

test('previews font size while settings stay open', () => {
  render(
    <FeatureCard
      id="quote"
      title="명언"
      defaultLayout={{x: 24, y: 96, width: 400, height: 220, pinned: false}}
      onClose={() => undefined}
    >
      <QuoteCard />
    </FeatureCard>
  );
  const quote = screen.getByText('한 구간만 끝내면 다음이 가벼워진다.');
  fireEvent.click(screen.getByRole('button', {name: '명언 설정'}));
  fireEvent.change(screen.getByLabelText('Font Size'), {target: {value: '32'}});
  expect(quote).toHaveStyle({fontSize: '32px'});
  fireEvent.click(screen.getByRole('button', {name: 'Close'}));
  expect(quote).toHaveStyle({fontSize: '16px'});
});

