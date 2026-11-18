import React, {useEffect, useState} from 'react';
import {
  labelFocusHistory,
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
import {useT} from '../i18n/i18n';
import styles from './FocusHistory.module.css';

const HISTORY_REFRESH_MS = 5000;
const BAR_KINDS: (keyof PeriodMinutes)[] = [
  'Focus',
  'Break',
  'Pause',
  'Lost'
];

export default function FocusHistory() {
  const t = useT();
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
  const labels = labelFocusHistory(rows);
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
      <ul className={styles.legend} aria-label={t('history.summary')}>
        {BAR_KINDS.map(kind => {
          const color = periodTextColor(kind, colors);
          const numColor = kind === 'Lost' && minutes.Lost === 0 ? undefined : color;
          return (
            <li key={kind} style={kind === 'Lost' ? undefined : {color}}>
              {kind}{' '}
              <span style={numColor ? {color: numColor} : undefined}>
                {t('minutes', {n: minutes[kind]})}
              </span>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 ? (
        <p className={styles.empty}>{t('history.empty')}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>{t('history.caption')}</caption>
            <thead>
              <tr>
                <th>{t('history.kind')}</th>
                <th>{t('history.start')}</th>
                <th>{t('history.end')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.periodType}-${row.start}-${row.finish}-${index}`}
                  style={{color: periodTextColor(row.periodType, colors)}}
                >
                  <td>{labels[index]}</td>
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
