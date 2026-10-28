import React from 'react';
import {RefreshIcon} from './icons';
import styles from './RemainBar.module.css';

type RemainBarProps = {
  durationMs: number;
  startedAt: number;
  label: string;
  refreshLabel: string;
  onRefresh: () => void;
};

export default function RemainBar({
  durationMs,
  startedAt,
  label,
  refreshLabel,
  onRefresh
}: RemainBarProps) {
  return (
    <div className={styles.row}>
      <div
        className={styles.remain}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          key={startedAt}
          className={styles.remainFill}
          style={{animationDuration: `${durationMs}ms`}}
        />
      </div>
      <button type="button" className="icon-button" aria-label={refreshLabel} onClick={onRefresh}>
        <RefreshIcon />
      </button>
    </div>
  );
}
