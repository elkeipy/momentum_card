import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import TodoCard from './TodoCard';

beforeEach(() => {
  localStorage.clear();
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
