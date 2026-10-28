import React, {ChangeEvent} from 'react';
import styles from '../css/SettingsModal.module.css';

function readBoundedInteger(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

type OptionFieldProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onValue: (value: number) => void;
};

export default function OptionField({
  id,
  label,
  min,
  max,
  value,
  onValue
}: OptionFieldProps) {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = readBoundedInteger(event.target.value, min, max);
    if (nextValue !== null) {
      onValue(nextValue);
    }
  };
  return (
    <div className={styles.optionDiv}>
      <label htmlFor={id} className={styles.optionLabel}>
        {label}
      </label>
      <input
        name={id}
        id={id}
        className={styles.optionValue}
        type="number"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
