import React, {ChangeEvent, useCallback, useEffect, useState} from 'react';
import {
  FONT_SIZE_DEFAULT,
  REFRESH_SEC_DEFAULT
} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import {
  addTodo,
  currentMinutes,
  dueTodos,
  formatDueMinutes,
  markAlarmed,
  parseDueMinutes,
  readTodoList,
  removeTodo,
  TODO_STORAGE_KEY,
  toggleTodo,
  type TodoItem
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
  const [dueHour, setDueHour] = useState(9);
  const [dueMinute, setDueMinute] = useState(0);
  const [alarm, setAlarm] = useState<TodoItem | null>(null);
  const remaining = items.filter(item => !item.done).length;
  const showDue = draft.includes('@');

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const ring = () => {
      setAlarm(current => current ?? dueTodos(items, currentMinutes())[0] ?? null);
    };
    ring();
    const timerId = window.setInterval(ring, ALARM_TICK_MS);
    return () => window.clearInterval(timerId);
  }, [items]);

  const onDraftChange = (value: string) => {
    if (!draft.includes('@') && value.includes('@')) {
      const now = new Date();
      setDueHour(now.getHours());
      setDueMinute(now.getMinutes());
    }
    setDraft(value);
  };

  const saveItem = () => {
    const dueMinutes = showDue ? parseDueMinutes(dueHour, dueMinute) : null;
    const nextItems = addTodo(items, draft, undefined, dueMinutes);
    if (nextItems === items) {
      return;
    }
    setItems(nextItems);
    setDraft('');
  };

  const ackAlarm = useCallback(() => {
    setAlarm(current => {
      if (current) {
        const alarmId = current.id;
        setItems(items => markAlarmed(items, alarmId));
      }
      return null;
    });
  }, []);

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
                min={0}
                max={23}
                step={1}
                value={dueHour}
                aria-label="마감 시"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const next = readClockPart(event.target.value, 23);
                  if (next !== null) {
                    setDueHour(next);
                  }
                }}
              />
            </label>
            <label>
              분
              <input
                type="number"
                min={0}
                max={59}
                step={1}
                value={dueMinute}
                aria-label="마감 분"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const next = readClockPart(event.target.value, 59);
                  if (next !== null) {
                    setDueMinute(next);
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
      {alarm ? (
        <AlarmDialog
          title="할 일 알람"
          message={alarm.text}
          detail={
            alarm.dueMinutes === null ? undefined : formatDueMinutes(alarm.dueMinutes)
          }
          onAck={ackAlarm}
        />
      ) : null}
      {settings.isOpen ? (
        <SettingsModal title="할 일 설정" onSave={settings.save} onClose={settings.close}>
          <DisplaySettingsFields value={settings.draft} onChange={settings.setDraft} />
        </SettingsModal>
      ) : null}
    </div>
  );
}
