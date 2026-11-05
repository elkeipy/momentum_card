import React from 'react';
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {NTFY_ORIGIN, NTFY_TOPIC_KEY} from '../notify/ntfy';
import TodoCard from './TodoCard';

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(
    () => Promise.resolve()
  );
  jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(
    () => undefined
  );
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('adds, completes, and removes a todo', () => {
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: 'write tests'}});
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  expect(screen.getByText('write tests')).toBeInTheDocument();
  expect(screen.getByText('남은 1 · 전체 1')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('checkbox', {name: 'write tests'}));
  expect(screen.getByRole('checkbox', {name: 'write tests'})).toBeChecked();
  expect(screen.getByText('남은 0 · 전체 1')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'write tests 삭제'}));
  expect(screen.getByText('할 일을 추가하면 여기에 쌓인다.')).toBeInTheDocument();
});

test('focuses the new todo field on alt+t unless typing elsewhere', () => {
  render(<TodoCard />);
  const field = screen.getByLabelText('할 일 추가');
  fireEvent.keyDown(document, {altKey: true, code: 'KeyT'});
  expect(field).toHaveFocus();

  const other = document.createElement('input');
  document.body.appendChild(other);
  other.focus();
  fireEvent.keyDown(other, {altKey: true, code: 'KeyT'});
  expect(other).toHaveFocus();
  other.remove();
});

test('shows the full todo text in a tooltip and deletes with an icon', () => {
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {
    target: {value: 'write a much longer note'}
  });
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  expect(screen.getByText('write a much longer note')).toHaveAttribute(
    'title',
    'write a much longer note'
  );
  const remove = screen.getByRole('button', {name: 'write a much longer note 삭제'});
  expect(remove).not.toHaveTextContent('삭제');
});

test('renames a todo from a double click and keeps the old text on escape', () => {
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: 'write tests'}});
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  fireEvent.doubleClick(screen.getByText('write tests'));
  const field = screen.getByRole('textbox', {name: 'write tests 수정'});
  fireEvent.change(field, {target: {value: 'rewrite tests'}});
  fireEvent.keyDown(field, {key: 'Enter'});
  expect(screen.getByText('rewrite tests')).toBeInTheDocument();

  fireEvent.doubleClick(screen.getByText('rewrite tests'));
  const again = screen.getByRole('textbox', {name: 'rewrite tests 수정'});
  fireEvent.change(again, {target: {value: 'nope'}});
  fireEvent.keyDown(again, {key: 'Escape'});
  expect(screen.getByText('rewrite tests')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', {name: 'rewrite tests 수정'})).not.toBeInTheDocument();
});

test('shows hour and minute fields after @ and rings when due', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-28T10:00:00'));
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: 'call @'}});
  expect(screen.getByLabelText('마감 시')).toHaveValue(10);
  expect(screen.getByLabelText('마감 분')).toHaveValue(0);
  fireEvent.change(screen.getByLabelText('마감 시'), {target: {value: '9'}});
  expect(screen.getByLabelText('마감 시')).toHaveValue(10);
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  const alarm = screen.getByRole('status', {name: '할 일 알람 call'});
  expect(alarm).toHaveTextContent('call');
  expect(alarm).toHaveTextContent('10:00');
  fireEvent.click(screen.getByRole('button', {name: '확인'}));
  expect(screen.queryByRole('region', {name: '할 일 알람'})).not.toBeInTheDocument();
});

test('fills a bar from the moment a timed todo is added until it is due', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-28T10:00:00'));
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: 'call @'}});
  fireEvent.change(screen.getByLabelText('마감 시'), {target: {value: '11'}});
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  const bar = screen.getByRole('progressbar', {name: 'call 마감'});
  expect(bar).toHaveAttribute('aria-valuenow', '0');

  act(() => {
    jest.setSystemTime(new Date('2026-10-28T10:30:00'));
    jest.advanceTimersByTime(1000);
  });
  expect(bar).toHaveAttribute('aria-valuenow', '50');
});

test('posts a due todo to ntfy when a topic is set', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-28T10:00:00'));
  localStorage.setItem(NTFY_TOPIC_KEY, 'desk-42');
  const post = jest.fn(() => Promise.resolve({} as Response));
  global.fetch = post as unknown as typeof fetch;
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: 'call @'}});
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  expect(post).toHaveBeenCalledWith(`${NTFY_ORIGIN}/desk-42`, {
    method: 'POST',
    body: '할 일: call (10:00)'
  });
});

test('stacks a toast for each overdue todo', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-28T10:00:00'));
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: 'call @'}});
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: 'mail @'}});
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  expect(screen.getByRole('status', {name: '할 일 알람 call'})).toBeInTheDocument();
  expect(screen.getByRole('status', {name: '할 일 알람 mail'})).toBeInTheDocument();
});

test('opens a prefilled Google Calendar link for a # entry without adding a todo', () => {
  const open = jest.spyOn(window, 'open').mockImplementation(() => null);
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: '치과 #'}});
  fireEvent.change(screen.getByLabelText('일정 날짜'), {target: {value: '2999-01-02'}});
  fireEvent.click(screen.getByRole('button', {name: '캘린더에 추가'}));

  expect(open).toHaveBeenCalledTimes(1);
  const link = new URL(String(open.mock.calls[0][0]));
  expect(link.searchParams.get('text')).toBe('치과');
  expect(link.searchParams.get('dates')).toBe('29990102/29990103');
  expect(open.mock.calls[0][2]).toBe('noopener,noreferrer');
  expect(screen.getByText('할 일을 추가하면 여기에 쌓인다.')).toBeInTheDocument();
  expect(screen.getByLabelText('할 일 추가')).toHaveValue('');
});
