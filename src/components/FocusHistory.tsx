import React, {useEffect, useState} from 'react';
import {
  readTodayFocusHistory,
  summarizePeriodMinutes,
  type FocusPeriod,
  type PeriodMinutes
} from '../pomodoro/focusHistory';
import styles from './FocusHistory.module.css';

const HISTORY_REFRESH_MS = 5000;
const BAR_KINDS: (keyof PeriodMinutes)[] = ['Focus', 'Break', 'Lost'];

export default function FocusHistory() {
  const [rows, setRows] = useState<FocusPeriod[]>([]);

  useEffect(() => {
    const update = () => setRows(readTodayFocusHistory(localStorage, new Date()));
    update();
    const timerId = window.setInterval(update, HISTORY_REFRESH_MS);
    return () => window.clearInterval(timerId);
  }, []);

  const minutes = summarizePeriodMinutes(rows);
  const widest = Math.max(minutes.Focus, minutes.Break, minutes.Lost, 1);

  return (
    <div>
      <ul className={styles.bars} aria-label="오늘 시간 요약">
        {BAR_KINDS.map(kind => (
          <li key={kind}>
            <span className={styles.barLabel}>
              {kind} {minutes[kind]}분
            </span>
            <span className={styles.barTrack}>
              <span
                className={`${styles.barFill} ${styles[kind.toLowerCase()]}`}
                style={{width: `${(minutes[kind] / widest) * 100}%`}}
              />
            </span>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? (
        <p className={styles.empty}>오늘 이력이 없습니다.</p>
      ) : (
        <table className={styles.table}>
          <caption>집중 이력</caption>
          <thead>
            <tr>
              <th>구분</th>
              <th>시작</th>
              <th>종료</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.periodType}-${row.start}-${row.finish}-${index}`}>
                <td>{row.periodType}</td>
                <td>{row.start}</td>
                <td>{row.finish}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
