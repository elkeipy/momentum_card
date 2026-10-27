import React, {useEffect, useState} from 'react';
import {readTodayFocusHistory, type FocusPeriod} from '../pomodoro/focusHistory';
import styles from './FocusHistory.module.css';

const HISTORY_REFRESH_MS = 5000;

export default function FocusHistory() {
  const [rows, setRows] = useState<FocusPeriod[]>([]);

  useEffect(() => {
    const update = () => setRows(readTodayFocusHistory(localStorage, new Date()));
    update();
    const timerId = window.setInterval(update, HISTORY_REFRESH_MS);
    return () => window.clearInterval(timerId);
  }, []);

  if (rows.length === 0) {
    return <p className={styles.empty}>오늘 이력이 없습니다.</p>;
  }

  return (
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
  );
}
