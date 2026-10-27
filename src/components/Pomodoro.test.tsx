import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
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
  render(<Pomodoro />);
  fireEvent.click(screen.getByRole('button', {name: '타이머 설정'}));
  fireEvent.change(screen.getByLabelText('Timer Text'), {target: {value: '64'}});
  fireEvent.click(screen.getByRole('button', {name: 'Save'}));
  expect(screen.getByText('25:00')).toHaveStyle({fontSize: '64px'});
});
