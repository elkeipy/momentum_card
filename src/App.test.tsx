import React from 'react';
import { render, screen } from '@testing-library/react';
import Clock from './components/Clock';

test('renders clock container', () => {
  render(<Clock />);
  expect(screen.getByText(/\d/)).toBeInTheDocument();
});
