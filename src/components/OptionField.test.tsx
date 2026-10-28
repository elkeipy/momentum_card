import React, {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import OptionField from './OptionField';

function Harness() {
  const [value, setValue] = useState(16);
  return (
    <OptionField
      id="fontSize"
      label="Font Size"
      min={12}
      max={18}
      value={value}
      onValue={setValue}
    />
  );
}

test('steps the value with plus and minus buttons', () => {
  render(<Harness />);
  const field = screen.getByLabelText('Font Size');
  expect(field).toHaveValue(16);
  fireEvent.click(screen.getByRole('button', {name: 'Font Size 늘리기'}));
  expect(field).toHaveValue(17);
  fireEvent.click(screen.getByRole('button', {name: 'Font Size 줄이기'}));
  expect(field).toHaveValue(16);
});

test('disables stepping past the bounds', () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText('Font Size'), {target: {value: '12'}});
  expect(screen.getByRole('button', {name: 'Font Size 줄이기'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Font Size'), {target: {value: '18'}});
  expect(screen.getByRole('button', {name: 'Font Size 늘리기'})).toBeDisabled();
});
