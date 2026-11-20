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
  expect(screen.getByRole('progressbar', {name: '구간 진행'})).toHaveAttribute(
    'aria-valuenow',
    '0'
  );
});

test('paints the card for the current period', () => {
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
  expect(screen.getByRole('region', {name: '뽀모도로'})).toHaveAttribute(
    'data-tone',
    'focus'
  );
});

test('keeps the focus history table in a scroll region', () => {
  const now = new Date();
  const dateId = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join(
    '-'
  );
  localStorage.setItem(
    'PomodoroFocusData',
    JSON.stringify({
      dateId,
      focusCount: 1,
      focusPeriod: ['Focus,09:00:00,09:25:00']
    })
  );
  render(<Pomodoro />);
  const table = screen.getByRole('table', {name: '집중 이력'});
  expect(table.parentElement?.className).toMatch(/tableWrap/);
});

test('paints history rows with the saved period colors', () => {
  const now = new Date();
  const dateId = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
  localStorage.setItem(
    'PomodoroSettings',
    JSON.stringify({
      focusTime: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      focusColor: '#112233',
      breakColor: '#445566',
      pauseColor: '#778899'
    })
  );
  localStorage.setItem(
    'PomodoroFocusData',
    JSON.stringify({
      dateId,
      focusCount: 1,
      focusPeriod: ['Focus,09:00:00,09:25:00', 'Pause,09:25:00,09:26:00']
    })
  );
  render(<Pomodoro />);
  expect(screen.getByRole('cell', {name: 'Focus #1(25분)'}).closest('tr')).toHaveStyle({
    color: '#112233'
  });
  expect(screen.getByRole('cell', {name: 'Pause (60초)'}).closest('tr')).toHaveStyle({
    color: '#778899'
  });
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
  fireEvent.change(screen.getByLabelText('Focus 색'), {target: {value: '#abcdef'}});
  fireEvent.click(screen.getByRole('button', {name: 'Save'}));
  expect(screen.getByText('25:00')).toHaveStyle({fontSize: '64px', color: '#abcdef'});
  expect(JSON.parse(localStorage.getItem('PomodoroSettings') ?? '{}').focusColor).toBe(
    '#abcdef'
  );
});

describe('keyboard shortcuts in a text field', () => {
  let field: HTMLInputElement;

  beforeEach(() => {
    jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    field = document.createElement('input');
    document.body.appendChild(field);
    field.focus();
  });

  afterEach(() => {
    field.remove();
    jest.restoreAllMocks();
  });

  test('starts and pauses on alt+s while the caret is in a text field', () => {
    render(<Pomodoro />);
    fireEvent.keyDown(field, {altKey: true, code: 'KeyS'});
    expect(screen.getByRole('button', {name: 'Pause'})).toBeInTheDocument();
    expect(field).toHaveFocus();
    fireEvent.keyDown(field, {altKey: true, code: 'KeyS'});
    expect(screen.getByRole('button', {name: 'Start'})).toBeInTheDocument();
  });

  test('leaves AltGr and Cmd combinations to the text field', () => {
    render(<Pomodoro />);
    const typed = fireEvent.keyDown(field, {altKey: true, ctrlKey: true, code: 'KeyS'});
    expect(typed).toBe(true);
    fireEvent.keyDown(field, {altKey: true, metaKey: true, code: 'KeyS'});
    fireEvent.keyDown(field, {code: 'KeyS'});
    expect(screen.getByRole('button', {name: 'Start'})).toBeInTheDocument();
  });

  test('stops the alarm on alt+a without starting the timer', () => {
    render(<Pomodoro />);
    const handled = fireEvent.keyDown(field, {altKey: true, code: 'KeyA'});
    expect(handled).toBe(false);
    expect(screen.getByRole('button', {name: 'Start'})).toBeInTheDocument();
  });
});
