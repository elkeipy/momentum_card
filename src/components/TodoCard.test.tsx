import React from 'react';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
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

test('shows hour and minute fields after @ and rings when due', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-28T10:00:00'));
  render(<TodoCard />);
  fireEvent.change(screen.getByLabelText('할 일 추가'), {target: {value: 'call @'}});
  expect(screen.getByLabelText('마감 시')).toHaveValue(10);
  expect(screen.getByLabelText('마감 분')).toHaveValue(0);
  fireEvent.click(screen.getByRole('button', {name: '추가'}));
  const alarm = screen.getByRole('alertdialog', {name: '할 일 알람'});
  expect(alarm).toHaveTextContent('call');
  expect(alarm).toHaveTextContent('10:00');
  fireEvent.click(screen.getByRole('button', {name: '확인'}));
  expect(screen.queryByRole('alertdialog', {name: '할 일 알람'})).not.toBeInTheDocument();
});
