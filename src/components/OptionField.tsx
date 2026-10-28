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

function clampStep(value: number, delta: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value + delta));
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
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.step}
          aria-label={`${label} 줄이기`}
          disabled={value <= min}
          onClick={() => onValue(clampStep(value, -1, min, max))}
        >
          −
        </button>
        <input
          name={id}
          id={id}
          className={styles.optionValue}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className={styles.step}
          aria-label={`${label} 늘리기`}
          disabled={value >= max}
          onClick={() => onValue(clampStep(value, 1, min, max))}
        >
          +
        </button>
      </div>
    </div>
  );
}
