import React from 'react';
import {render, screen} from '@testing-library/react';
import Pomodoro from './Pomodoro';

test('renders the focus timer controls', () => {
  render(<Pomodoro />);
  expect(screen.getByRole('button', {name: 'Start'})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Stop Alarm'})).toBeInTheDocument();
});
