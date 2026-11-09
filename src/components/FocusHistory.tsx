import React, {useEffect, useState} from 'react';
import {
  readTodayFocusHistory,
  summarizePeriodMinutes,
  type FocusPeriod,
  type PeriodMinutes
} from '../pomodoro/focusHistory';
import {
  PERIOD_COLORS_EVENT,
  periodTextColor,
  readPeriodColors,
  type PeriodColors
} from '../pomodoro/periodColors';
import styles from './FocusHistory.module.css';

const HISTORY_REFRESH_MS = 5000;
const BAR_KINDS: (keyof PeriodMinutes)[] = [
  'Focus',
  'Break',
  'Pause',
  'Lost'
];

export default function FocusHistory() {
  const [rows, setRows] = useState<FocusPeriod[]>([]);
  const [colors, setColors] = useState<PeriodColors>(() => readPeriodColors(localStorage));

  useEffect(() => {
    const update = () => {
      setRows(readTodayFocusHistory(localStorage, new Date()));
      setColors(readPeriodColors(localStorage));
    };
    update();
    const timerId = window.setInterval(update, HISTORY_REFRESH_MS);
    window.addEventListener(PERIOD_COLORS_EVENT, update);
    return () => {
      window.clearInterval(timerId);
      window.removeEventListener(PERIOD_COLORS_EVENT, update);
    };
  }, []);

  const minutes = summarizePeriodMinutes(rows);
  const total =
    minutes.Focus + minutes.Break + minutes.Pause + minutes.Lost;

  return (
    <div className={styles.day}>
      <div className={styles.track} aria-hidden="true">
        {total > 0
          ? BAR_KINDS.map(kind =>
              minutes[kind] > 0 ? (
                <span
                  key={kind}
                  className={`${styles.seg} ${styles[kind.toLowerCase()]}`}
                  style={{flexGrow: minutes[kind]}}
                />
              ) : null
            )
          : null}
      </div>
      <ul className={styles.legend} aria-label="오늘 시간 요약">
        {BAR_KINDS.map(kind => {
          const color = periodTextColor(kind, colors);
          const numColor = kind === 'Lost' && minutes.Lost === 0 ? undefined : color;
          return (
            <li key={kind} style={kind === 'Lost' ? undefined : {color}}>
              {kind}{' '}
              <span style={numColor ? {color: numColor} : undefined}>
                {minutes[kind]}분
              </span>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 ? (
        <p className={styles.empty}>오늘 이력이 없습니다.</p>
      ) : (
        <div className={styles.tableWrap}>
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
                <tr
                  key={`${row.periodType}-${row.start}-${row.finish}-${index}`}
                  style={{color: periodTextColor(row.periodType, colors)}}
                >
                  <td>{row.periodType}</td>
                  <td>{row.start}</td>
                  <td>{row.finish}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
