import React, {ChangeEvent, useEffect, useState} from 'react';
import {
  FONT_SIZE_DEFAULT,
  REFRESH_SEC_DEFAULT
} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import {
  addTodo,
  clampDueParts,
  currentMinutes,
  dueTodos,
  formatDueMinutes,
  markAlarmed,
  minDueHour,
  minDueMinute,
  parseDueMinutes,
  readTodoList,
  removeTodo,
  TODO_STORAGE_KEY,
  toggleTodo
} from '../todos/todos';
import AlarmDialog from './AlarmDialog';
import DisplaySettingsFields from './DisplaySettingsFields';
import SettingsModal from './SettingsModal';
import styles from './TodoCard.module.css';

const TODO_DEFAULTS = {
  fontSize: FONT_SIZE_DEFAULT,
  refreshSec: REFRESH_SEC_DEFAULT
};
const ALARM_TICK_MS = 1000;

function readClockPart(value: string, max: number): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return parsed >= 0 && parsed <= max ? parsed : null;
}

export default function TodoCard() {
  const settings = useDisplaySettings('todos', TODO_DEFAULTS);
  const [items, setItems] = useState(() => readTodoList(localStorage));
  const [draft, setDraft] = useState('');
  const [nowMinutes, setNowMinutes] = useState(() => currentMinutes());
  const [dueHour, setDueHour] = useState(() => minDueHour(currentMinutes()));
  const [dueMinute, setDueMinute] = useState(
    () => minDueMinute(minDueHour(currentMinutes()), currentMinutes())
  );
  const remaining = items.filter(item => !item.done).length;
  const showDue = draft.includes('@');
  const ringing = dueTodos(items, nowMinutes);
  const hourMin = minDueHour(nowMinutes);
  const minuteMin = minDueMinute(dueHour, nowMinutes);

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const tick = () => setNowMinutes(currentMinutes());
    tick();
    const timerId = window.setInterval(tick, ALARM_TICK_MS);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!showDue) {
      return;
    }
    const next = clampDueParts(dueHour, dueMinute, nowMinutes);
    if (next.hour !== dueHour || next.minute !== dueMinute) {
      setDueHour(next.hour);
      setDueMinute(next.minute);
    }
  }, [showDue, dueHour, dueMinute, nowMinutes]);

  const onDraftChange = (value: string) => {
    if (!draft.includes('@') && value.includes('@')) {
      const now = currentMinutes();
      const next = clampDueParts(0, 0, now);
      setDueHour(next.hour);
      setDueMinute(next.minute);
    }
    setDraft(value);
  };

  const applyDuePart = (hour: number, minute: number) => {
    const next = clampDueParts(hour, minute, currentMinutes());
    setDueHour(next.hour);
    setDueMinute(next.minute);
  };

  const saveItem = () => {
    const clamped = showDue
      ? clampDueParts(dueHour, dueMinute, currentMinutes())
      : null;
    const dueMinutes = clamped
      ? parseDueMinutes(clamped.hour, clamped.minute)
      : null;
    const nextItems = addTodo(items, draft, undefined, dueMinutes);
    if (nextItems === items) {
      return;
    }
    setItems(nextItems);
    setDraft('');
  };

  const ackAlarm = (id: string) => {
    setItems(current => markAlarmed(current, id));
  };

  return (
    <div className={styles.root}>
      <p className={styles.summary}>남은 {remaining} · 전체 {items.length}</p>
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault();
          saveItem();
        }}
      >
        <label htmlFor="new-todo">할 일 추가</label>
        <div className={styles.join}>
          <input
            id="new-todo"
            value={draft}
            onChange={event => onDraftChange(event.target.value)}
            placeholder="오늘 끝낼 일 @시간"
          />
          <button className="app-button" type="submit">
            추가
          </button>
        </div>
        {showDue ? (
          <div className={styles.due}>
            <label>
              시
              <input
                type="number"
                min={hourMin}
                max={23}
                step={1}
                value={dueHour}
                aria-label="마감 시"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const next = readClockPart(event.target.value, 23);
                  if (next !== null) {
                    applyDuePart(next, dueMinute);
                  }
                }}
              />
            </label>
            <label>
              분
              <input
                type="number"
                min={minuteMin}
                max={59}
                step={1}
                value={dueMinute}
                aria-label="마감 분"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const next = readClockPart(event.target.value, 59);
                  if (next !== null) {
                    applyDuePart(dueHour, next);
                  }
                }}
              />
            </label>
          </div>
        ) : null}
      </form>
      {items.length === 0 ? (
        <p className={styles.empty}>할 일을 추가하면 여기에 쌓인다.</p>
      ) : (
        <ul className={styles.list} style={{fontSize: `${settings.saved.fontSize}px`}}>
          {items.map(item => (
            <li key={item.id}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => setItems(current => toggleTodo(current, item.id))}
                />
                <span className={item.done ? `${styles.label} ${styles.done}` : styles.label}>
                  {item.text}
                </span>
                {item.dueMinutes !== null ? (
                  <span className={styles.dueStamp}>{formatDueMinutes(item.dueMinutes)}</span>
                ) : null}
              </label>
              <button
                className="text-button"
                type="button"
                aria-label={`${item.text} 삭제`}
                onClick={() => setItems(current => removeTodo(current, item.id))}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
      <AlarmDialog
        items={ringing.map(item => ({
          id: item.id,
          message: item.text,
          detail:
            item.dueMinutes === null
              ? undefined
              : formatDueMinutes(item.dueMinutes)
        }))}
        onAck={ackAlarm}
      />
      {settings.isOpen ? (
        <SettingsModal title="할 일 설정" onSave={settings.save} onClose={settings.close}>
          <DisplaySettingsFields value={settings.draft} onChange={settings.setDraft} />
        </SettingsModal>
      ) : null}
    </div>
  );
}
