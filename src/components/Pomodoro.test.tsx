import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import FeatureCard from './FeatureCard';
import Pomodoro from './Pomodoro';

beforeEach(() => {
  localStorage.clear();
});

test('renders the focus timer controls', () => {
  render(<Pomodoro />);
  expect(screen.getByRole('button', {name: 'Start'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Stop Alarm'})).toBeInTheDocument();
});

test('saves timer text size from the settings dialog', () => {
  render(
    <FeatureCard
      id="pomodoro"
      title="뽀모도로"
      defaultLayout={{x: 24, y: 96, width: 400, height: 300, pinned: false}}
      onClose={() => undefined}
    >
      <Pomodoro />
    </FeatureCard>
  );
  fireEvent.click(screen.getByRole('button', {name: '뽀모도로 설정'}));
  fireEvent.change(screen.getByLabelText('Timer Text'), {target: {value: '64'}});
  fireEvent.click(screen.getByRole('button', {name: 'Save'}));
  expect(screen.getByText('25:00')).toHaveStyle({fontSize: '64px'});
});
