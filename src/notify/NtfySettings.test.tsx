import React from 'react';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {NTFY_TOPIC_KEY} from './ntfy';
import NtfySettings from './NtfySettings';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

test('saves an ntfy topic from the header dialog', () => {
  render(<NtfySettings />);
  fireEvent.click(screen.getByRole('button', {name: '푸시 알림'}));
  fireEvent.change(screen.getByLabelText('ntfy 토픽'), {
    target: {value: 'desk-42'}
  });
  fireEvent.click(screen.getByRole('button', {name: 'Save'}));
  expect(localStorage.getItem(NTFY_TOPIC_KEY)).toBe('desk-42');
});

test('clears the topic when the field is emptied', () => {
  localStorage.setItem(NTFY_TOPIC_KEY, 'desk-42');
  render(<NtfySettings />);
  fireEvent.click(screen.getByRole('button', {name: '푸시 알림'}));
  fireEvent.change(screen.getByLabelText('ntfy 토픽'), {target: {value: ''}});
  fireEvent.click(screen.getByRole('button', {name: 'Save'}));
  expect(localStorage.getItem(NTFY_TOPIC_KEY)).toBeNull();
});
